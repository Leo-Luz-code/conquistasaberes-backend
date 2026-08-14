import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from 'src/plugins/database/services/prisma.service';
import { Role } from '@prisma/client';
import { CreateLearningPathDto, UpdateLearningPathDto } from './dto';

@Injectable()
export class LearningPathsService {
  constructor(private readonly prisma: PrismaService) {}

  async getLearningPaths(userId?: string) {
    const trilhas = await this.prisma.learningPath.findMany({
      where: { deletedAt: null },
      include: {
        eixo: true,
        courses: {
          where: { isPublished: true, deletedAt: null },
          include: { secretaria: true },
        },
      },
      orderBy: { tituloTrilha: 'asc' },
    });

    if (!userId) {
      return trilhas.map((t) => ({
        ...t,
        isEnrolled: false,
        progress: 0,
        status: 'DISPONIVEL',
        concluidosCount: 0,
      }));
    }

    // Buscar inscrições em trilhas do usuário
    const userTrilhaEnrollments = await this.prisma.learningPathEnrollment.findMany({
      where: { userId, deletedAt: null },
    });
    const trilhaEnrollmentMap = new Map(
      userTrilhaEnrollments.map((e) => [e.learningPathId, e]),
    );

    // Buscar todas as matrículas em cursos do usuário
    const userCourseEnrollments = await this.prisma.enrollment.findMany({
      where: { userId, deletedAt: null },
      select: { courseId: true, progress: true, completedAt: true, statusConclusao: true },
    });
    const courseEnrollmentMap = new Map(
      userCourseEnrollments.map((e) => [e.courseId, e]),
    );

    return trilhas.map((trilha) => {
      const pathEnrollment = trilhaEnrollmentMap.get(trilha.id);
      const isEnrolled = !!pathEnrollment;

      const totalCursos = trilha.courses.length;
      let concluidosCount = 0;
      let somaProgresso = 0;

      trilha.courses.forEach((c) => {
        const enr = courseEnrollmentMap.get(c.id);
        if (enr) {
          somaProgresso += enr.progress || 0;
          if (enr.progress >= 100 || enr.statusConclusao === 'CONCLUIDO' || enr.completedAt) {
            concluidosCount += 1;
          }
        }
      });

      const progress = totalCursos > 0 ? Math.round(somaProgresso / totalCursos) : 0;
      let status = 'DISPONIVEL';
      if (isEnrolled) {
        if (progress >= 100 || (totalCursos > 0 && concluidosCount === totalCursos)) {
          status = 'CONCLUIDO';
        } else {
          status = 'EM_ANDAMENTO';
        }
      }

      return {
        ...trilha,
        isEnrolled,
        progress,
        status,
        concluidosCount,
      };
    });
  }

  async findMyLearningPaths(userId: string) {
    const allPaths = await this.getLearningPaths(userId);
    return allPaths.filter((p) => p.isEnrolled);
  }

  async findOne(id: string, userId?: string) {
    const trilha = await this.prisma.learningPath.findFirst({
      where: { id, deletedAt: null },
      include: {
        eixo: true,
        courses: {
          where: { deletedAt: null, isPublished: true },
          include: {
            secretaria: true,
            _count: { select: { modules: true } },
          },
        },
      },
    });

    if (!trilha) {
      throw new NotFoundException('Trilha de aprendizagem não encontrada.');
    }

    if (!userId) {
      return {
        ...trilha,
        isEnrolled: false,
        progress: 0,
        status: 'DISPONIVEL',
      };
    }

    const pathEnrollment = await this.prisma.learningPathEnrollment.findUnique({
      where: { userId_learningPathId: { userId, learningPathId: id } },
    });

    const userCourseEnrollments = await this.prisma.enrollment.findMany({
      where: {
        userId,
        courseId: { in: trilha.courses.map((c) => c.id) },
        deletedAt: null,
      },
    });
    const courseMap = new Map(userCourseEnrollments.map((e) => [e.courseId, e]));

    let concluidosCount = 0;
    let somaProgresso = 0;

    const coursesEnriquecidos = trilha.courses.map((c) => {
      const enr = courseMap.get(c.id);
      const prog = enr?.progress || 0;
      const isConcluido = prog >= 100 || enr?.statusConclusao === 'CONCLUIDO' || !!enr?.completedAt;

      somaProgresso += prog;
      if (isConcluido) concluidosCount += 1;

      return {
        ...c,
        isEnrolled: !!enr,
        progress: prog,
        status: isConcluido ? 'CONCLUIDO' : enr ? 'EM_ANDAMENTO' : 'DISPONIVEL',
      };
    });

    const totalCursos = trilha.courses.length;
    const progress = totalCursos > 0 ? Math.round(somaProgresso / totalCursos) : 0;
    const isEnrolled = !!pathEnrollment;
    const status = isEnrolled
      ? progress >= 100 || (totalCursos > 0 && concluidosCount === totalCursos)
        ? 'CONCLUIDO'
        : 'EM_ANDAMENTO'
      : 'DISPONIVEL';

    return {
      ...trilha,
      courses: coursesEnriquecidos,
      isEnrolled,
      progress,
      status,
      concluidosCount,
    };
  }

  async enroll(learningPathId: string, userId: string) {
    const trilha = await this.prisma.learningPath.findFirst({
      where: { id: learningPathId, deletedAt: null },
      include: {
        courses: {
          where: { isPublished: true, deletedAt: null },
        },
      },
    });

    if (!trilha) {
      throw new NotFoundException('Trilha de aprendizagem não encontrada.');
    }

    // 1. Criar ou obter LearningPathEnrollment
    const pathEnrollment = await this.prisma.learningPathEnrollment.upsert({
      where: { userId_learningPathId: { userId, learningPathId } },
      create: {
        userId,
        learningPathId,
        status: 'EM_ANDAMENTO',
        progress: 0.0,
      },
      update: {
        deletedAt: null,
      },
    });

    // 2. Matricular automaticamente o servidor em todos os cursos publicados da trilha
    for (const curso of trilha.courses) {
      await this.prisma.enrollment.upsert({
        where: { userId_courseId: { userId, courseId: curso.id } },
        create: {
          userId,
          courseId: curso.id,
          progress: 0.0,
          statusConclusao: 'EM_ANDAMENTO',
        },
        update: {},
      });
    }

    // 3. Log de auditoria
    await this.prisma.auditLog.create({
      data: {
        userId,
        acao: 'INSCRICAO_TRILHA',
        detalhes: `Inscrição na Trilha de Aprendizagem: ${trilha.tituloTrilha}`,
      },
    });

    return pathEnrollment;
  }

  async getAdminLearningPaths(userId?: string, userRole?: Role) {
    const whereClause: any = { deletedAt: null };
    if (userRole === Role.GESTOR_SECRETARIA && userId) {
      whereClause.OR = [
        { criadorId: userId },
      ];
    }

    return this.prisma.learningPath.findMany({
      where: whereClause,
      include: {
        eixo: true,
        courses: {
          where: { deletedAt: null },
          include: { secretaria: true },
        },
      },
      orderBy: { tituloTrilha: 'asc' },
    });
  }

  async create(dto: CreateLearningPathDto, criadorId?: string) {
    return this.prisma.learningPath.create({
      data: {
        tituloTrilha: dto.tituloTrilha,
        cargaHorariaTotal: dto.cargaHorariaTotal,
        ...(dto.eixoId && { eixoId: dto.eixoId }),
        criadorId: criadorId || null,
      },
    });
  }

  async update(id: string, dto: UpdateLearningPathDto, userId?: string, userRole?: Role) {
    const trilhaExists = await this.prisma.learningPath.findFirst({
      where: { id, deletedAt: null },
    });

    if (!trilhaExists) {
      throw new NotFoundException('Trilha de aprendizagem não encontrada.');
    }

    if (userRole === Role.GESTOR_SECRETARIA && userId) {
      if (trilhaExists.criadorId && trilhaExists.criadorId !== userId) {
        throw new ForbiddenException('Você só tem permissão para gerenciar as trilhas criadas por você.');
      }
    }

    return this.prisma.learningPath.update({
      where: { id },
      data: {
        ...(dto.tituloTrilha && { tituloTrilha: dto.tituloTrilha }),
        ...(dto.cargaHorariaTotal !== undefined && { cargaHorariaTotal: dto.cargaHorariaTotal }),
        ...(dto.eixoId !== undefined && { eixoId: dto.eixoId }),
      },
    });
  }

  async softDelete(id: string, userId?: string, userRole?: Role) {
    const trilhaExists = await this.prisma.learningPath.findFirst({
      where: { id, deletedAt: null },
    });

    if (!trilhaExists) {
      throw new NotFoundException('Trilha de aprendizagem não encontrada.');
    }

    if (userRole === Role.GESTOR_SECRETARIA && userId) {
      if (trilhaExists.criadorId && trilhaExists.criadorId !== userId) {
        throw new ForbiddenException('Você só tem permissão para excluir as trilhas criadas por você.');
      }
    }

    return this.prisma.learningPath.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async linkCourses(id: string, courseIds: string[], userId?: string, userRole?: Role) {
    const trilhaExists = await this.prisma.learningPath.findFirst({
      where: { id, deletedAt: null },
    });

    if (!trilhaExists) {
      throw new NotFoundException('Trilha de aprendizagem não encontrada.');
    }

    if (userRole === Role.GESTOR_SECRETARIA && userId) {
      if (trilhaExists.criadorId && trilhaExists.criadorId !== userId) {
        throw new ForbiddenException('Você só tem permissão para vincular cursos às trilhas criadas por você.');
      }
    }

    // 1. Desvincular todos os cursos atualmente nesta trilha que não estão na lista
    await this.prisma.course.updateMany({
      where: { trilhaId: id, id: { notIn: courseIds } },
      data: { trilhaId: null },
    });

    // 2. Vincular os novos cursos (ou atualizar os que já estão)
    if (courseIds.length > 0) {
      await this.prisma.course.updateMany({
        where: { id: { in: courseIds } },
        data: { trilhaId: id },
      });
    }

    return { message: 'Cursos vinculados com sucesso.' };
  }
}
