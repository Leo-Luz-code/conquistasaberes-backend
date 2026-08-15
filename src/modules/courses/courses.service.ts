import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../plugins/database/services/prisma.service';
import { CertificateStatus, Role } from '@prisma/client';
import { GamificationService } from '../gamification/gamification.service';
import {
  CreateCourseDto,
  UpdateCourseDto,
  CreateModuleDto,
  UpdateModuleDto,
  CreateLessonDto,
  UpdateLessonDto,
} from './dto';

@Injectable()
export class CoursesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gamificationService: GamificationService,
  ) {}

  async findAll(search?: string, secretariaId?: string, categoria?: string) {
    const where: any = {
      isPublished: true,
      deletedAt: null,
    };

    if (search) {
      where.OR = [
        { titulo: { contains: search, mode: 'insensitive' } },
        { descricao: { contains: search, mode: 'insensitive' } },
      ];
    }

    if (secretariaId) {
      where.OR = [
        { secretariaId },
        { secretariaId: null }, // Cursos gerais da prefeitura
      ];
    }

    if (categoria && categoria !== 'Todas') {
      where.categoria = categoria;
    }

    const courses = await this.prisma.course.findMany({
      where,
      include: {
        secretaria: true,
        trilha: { select: { id: true, tituloTrilha: true } },
        _count: {
          select: { modules: true, enrollments: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return courses.map((course) => ({
      id: course.id,
      titulo: course.titulo,
      descricao: course.descricao,
      cargaHoraria: course.cargaHoraria,
      categoria: course.categoria,
      capaUrl: course.capaUrl,
      secretaria: course.secretaria,
      trilha: course.trilha,
      modulosCount: course._count.modules,
      inscritosCount: course._count.enrollments,
    }));
  }

  async findOne(id: string, userId?: string) {
    const course = await this.prisma.course.findFirst({
      where: { id, deletedAt: null },
      include: {
        secretaria: true,
        trilha: {
          include: {
            eixo: true,
            _count: {
              select: {
                enrollments: { where: { deletedAt: null } },
                courses: { where: { deletedAt: null } },
              },
            },
          },
        },
        modules: {
          where: { deletedAt: null },
          orderBy: { ordem: 'asc' },
          include: {
            lessons: {
              where: { deletedAt: null },
              orderBy: { ordem: 'asc' },
            },
          },
        },
        _count: {
          select: {
            enrollments: { where: { deletedAt: null } },
          },
        },
      },
    });

    if (!course) {
      throw new NotFoundException('Curso não encontrado.');
    }

    let trilhaInscritosCount = 0;
    if (course.trilhaId) {
      const [directEnrollments, courseEnrollments] = await Promise.all([
        this.prisma.learningPathEnrollment.count({
          where: { learningPathId: course.trilhaId, deletedAt: null },
        }),
        this.prisma.enrollment.findMany({
          where: {
            course: { trilhaId: course.trilhaId, deletedAt: null },
            deletedAt: null,
          },
          select: { userId: true },
          distinct: ['userId'],
        }),
      ]);
      trilhaInscritosCount = Math.max(directEnrollments, courseEnrollments.length);
    }

    let userProgress = 0;
    let isEnrolled = false;
    const completedLessonIds: string[] = [];

    if (userId) {
      const enrollment = await this.prisma.enrollment.findUnique({
        where: { userId_courseId: { userId, courseId: id } },
      });

      if (enrollment) {
        isEnrolled = true;
        userProgress = enrollment.progress;

        const progresses = await this.prisma.lessonProgress.findMany({
          where: {
            userId,
            lesson: { module: { courseId: id } },
            completed: true,
          },
        });
        completedLessonIds.push(...progresses.map((p) => p.lessonId));
      }
    }

    return {
      ...course,
      trilha: course.trilha
        ? {
            ...course.trilha,
            inscritosCount: trilhaInscritosCount,
          }
        : null,
      inscritosCount: course._count?.enrollments || 0,
      isEnrolled,
      userProgress,
      completedLessonIds,
    };
  }

  async enroll(courseId: string, userId: string) {
    const course = await this.prisma.course.findFirst({
      where: { id: courseId, deletedAt: null },
    });

    if (!course) {
      throw new NotFoundException('Curso não encontrado.');
    }

    const existing = await this.prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId } },
    });

    if (existing) {
      return existing;
    }

    const newEnrollment = await this.prisma.enrollment.create({
      data: {
        userId,
        courseId,
        progress: 0.0,
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId,
        acao: 'INSCRICAO_CURSO',
        detalhes: `Inscrição no curso: ${course.titulo}`,
      },
    });

    return newEnrollment;
  }

  async findMyCourses(userId: string, sync: boolean = false) {
    const enrollments = await this.prisma.enrollment.findMany({
      where: { userId, deletedAt: null },
      include: {
        course: {
          include: {
            secretaria: { select: { id: true, sigla: true, nome: true } },
            trilha: { select: { id: true, tituloTrilha: true } },
            _count: { select: { modules: true } },
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    if (sync) {
      for (const e of enrollments) {
        if (e.completedAt || e.progress === 100) {
          const allLessonsCount = await this.prisma.lesson.count({
            where: { module: { courseId: e.courseId }, deletedAt: null }
          });
          const completedCount = await this.prisma.lessonProgress.count({
            where: { userId, lesson: { module: { courseId: e.courseId }, deletedAt: null }, completed: true }
          });
          const newProg = allLessonsCount === 0 ? 0 : Math.min(100, Math.round((completedCount / allLessonsCount) * 100));
          
          if (newProg !== e.progress) {
            e.progress = newProg;
            await this.prisma.enrollment.update({
              where: { id: e.id },
              data: { progress: newProg },
            });
          }
        }
      }
    }

    return enrollments
      .filter((e) => e.course.deletedAt === null)
      .map((e) => {
        let status: 'em_andamento' | 'concluido' | 'nao_iniciado' = 'nao_iniciado';
        if (e.completedAt && e.progress >= 100) status = 'concluido';
        else if (e.progress > 0 || e.completedAt) status = 'em_andamento';

        return {
          id: e.course.id,
          titulo: e.course.titulo,
          descricao: e.course.descricao,
          cargaHoraria: e.course.cargaHoraria,
          categoria: e.course.categoria,
          capaUrl: e.course.capaUrl,
          secretaria: e.course.secretaria,
          trilha: e.course.trilha,
          modulosCount: e.course._count.modules,
          progresso: Math.round(e.progress),
          status,
          enrollmentId: e.id,
          completedAt: e.completedAt,
        };
      });
  }

  async completeLesson(lessonId: string, userId: string) {
    const lesson = await this.prisma.lesson.findFirst({
      where: { id: lessonId, deletedAt: null },
      include: { module: { include: { course: true } } },
    });

    if (!lesson) {
      throw new NotFoundException('Aula não encontrada.');
    }

    const courseId = lesson.module.courseId;

    // Garantir inscrição
    let enrollment = await this.prisma.enrollment.findUnique({
      where: { userId_courseId: { userId, courseId } },
    });

    if (!enrollment) {
      enrollment = await this.prisma.enrollment.create({
        data: { userId, courseId, progress: 0.0 },
      });
    }

    // Registrar progresso da aula se ainda não completada
    const existingProgress = await this.prisma.lessonProgress.findUnique({
      where: { userId_lessonId: { userId, lessonId } },
    });

    let gainedXp = 0;
    if (!existingProgress || !existingProgress.completed) {
      await this.prisma.lessonProgress.upsert({
        where: { userId_lessonId: { userId, lessonId } },
        update: { completed: true },
        create: { userId, lessonId, completed: true },
      });

      gainedXp = lesson.xp; // Usa o valor configurado na Aula
    }

    // Calcular progresso total do curso
    const allLessons = await this.prisma.lesson.findMany({
      where: { module: { courseId }, deletedAt: null },
    });

    const completedLessons = await this.prisma.lessonProgress.findMany({
      where: {
        userId,
        lesson: { module: { courseId } },
        completed: true,
      },
    });

    const progressPercentage = Math.min(
      100,
      Math.round((completedLessons.length / allLessons.length) * 100),
    );

    const isFirstTimeCompletion = progressPercentage >= 100 && !enrollment.completedAt;
    const isRecompletion = progressPercentage >= 100 && enrollment.completedAt && enrollment.progress < 100;

    await this.prisma.enrollment.update({
      where: { id: enrollment.id },
      data: {
        progress: progressPercentage,
        completedAt: isFirstTimeCompletion ? new Date() : enrollment.completedAt,
      },
    });

    // Conclusão de Curso: Bônus de XP, Badges e Certificado Automatizado
    let newBadgeEarned: any = null;
    let newCertificateCode: string | null = null;
    let totalGainedXp = gainedXp;

    if (progressPercentage >= 100) {
      if (isFirstTimeCompletion) {
        totalGainedXp += 200; // Bônus por concluir curso pela primeira vez

        // Verificar / Conceder Badges
        const badges = await this.prisma.badge.findMany({ where: { deletedAt: null } });
        const courseTitleLower = lesson.module.course.titulo.toLowerCase();

        let targetBadge = null;
        if (courseTitleLower.includes('inovação')) {
          targetBadge = badges.find((b) => b.nome.includes('Inovador'));
        } else if (courseTitleLower.includes('lgpd')) {
          targetBadge = badges.find((b) => b.nome.includes('LGPD'));
        }

        if (!targetBadge) {
          targetBadge = badges.find((b) => b.nome.includes('Pioneiro'));
        }

        if (targetBadge) {
          const hasBadge = await this.prisma.userBadge.findUnique({
            where: { userId_badgeId: { userId, badgeId: targetBadge.id } },
          });

          if (!hasBadge) {
            await this.prisma.userBadge.create({
              data: { userId, badgeId: targetBadge.id },
            });
            newBadgeEarned = targetBadge;
            totalGainedXp += targetBadge.xpBonus;
          }
        }
      }

      // Gerar Certificado com Hash Único
      const existingCert = await this.prisma.certificate.findFirst({
        where: { userId, courseId },
      });

      if (!existingCert) {
        const randHash = Math.random().toString(36).substring(2, 8).toUpperCase();
        newCertificateCode = `CS-PMVC-2026-${randHash}`;

        await this.prisma.certificate.create({
          data: {
            codigoValidacao: newCertificateCode,
            userId,
            courseId,
            status: CertificateStatus.EMITTED,
            issuedAt: new Date(),
          },
        });

        await this.prisma.auditLog.create({
          data: {
            userId,
            acao: 'CERTIFICADO_EMITIDO',
            detalhes: `Certificado ${newCertificateCode} emitido para o curso: ${lesson.module.course.titulo}`,
          },
        });
      } else {
        newCertificateCode = existingCert.codigoValidacao;
        if (isRecompletion) {
          await this.prisma.certificate.update({
            where: { id: existingCert.id },
            data: { issuedAt: new Date() },
          });
        }
      }
    }

    // Delega ao GamificationService a responsabilidade de atualizar nível e XP
    const gamificationResult = await this.gamificationService.processLessonCompletion(
      userId,
      totalGainedXp,
    );

    return {
      message: 'Aula concluída com sucesso!',
      gainedXp: totalGainedXp, // XP total ganho nesta ação
      newTotalXp: gamificationResult.newXp,
      level: gamificationResult.newLevel,
      leveledUp: gamificationResult.leveledUp,
      courseProgress: progressPercentage,
      isCourseCompleted: progressPercentage >= 100,
      newBadgeEarned,
      newCertificateCode,
    };
  }

  // =========================================================================
  // ADMIN METHODS - GESTÃO DE CURSOS, MÓDULOS E AULAS
  // =========================================================================

  async getSecretarias() {
    return this.prisma.secretaria.findMany({
      where: { deletedAt: null },
      orderBy: { sigla: 'asc' },
    });
  }

  async findAllAdmin(userId?: string, userRole?: Role) {
    const whereClause: any = { deletedAt: null };

    if (userRole === Role.GESTOR_SECRETARIA && userId) {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { secretariaId: true },
      });

      whereClause.OR = [
        { criadorId: userId },
        ...(user?.secretariaId ? [{ criadorId: null, secretariaId: user.secretariaId }] : []),
      ];
    }

    return this.prisma.course.findMany({
      where: whereClause,
      include: {
        secretaria: true,
        trilha: { select: { id: true, tituloTrilha: true } },
        modules: {
          where: { deletedAt: null },
          orderBy: { ordem: 'asc' },
          include: {
            lessons: {
              where: { deletedAt: null },
              orderBy: { ordem: 'asc' },
            },
          },
        },
        _count: {
           select: { enrollments: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createCourse(dto: CreateCourseDto, criadorId?: string) {
    let categoria = 'Geral';
    if (dto.trilhaId) {
      const trilha = await this.prisma.learningPath.findUnique({
        where: { id: dto.trilhaId },
        include: { eixo: true },
      });
      if (trilha?.eixo?.nomeEixo) {
        categoria = trilha.eixo.nomeEixo;
      }
    } else if (dto.categoria) {
      categoria = dto.categoria;
    }

    return this.prisma.course.create({
      data: {
        titulo: dto.titulo,
        descricao: dto.descricao,
        cargaHoraria: dto.cargaHoraria,
        categoria,
        capaUrl: dto.capaUrl,
        secretariaId: dto.secretariaId || null,
        trilhaId: dto.trilhaId || null,
        isPublished: dto.isPublished ?? true,
        criadorId: criadorId || null,
      },
    });
  }

  async updateCourse(id: string, dto: UpdateCourseDto, userId?: string, userRole?: Role) {
    const course = await this.prisma.course.findFirst({ where: { id, deletedAt: null } });
    if (!course) throw new NotFoundException('Curso não encontrado.');

    if (userRole === Role.GESTOR_SECRETARIA && userId) {
      if (course.criadorId && course.criadorId !== userId) {
        throw new ForbiddenException('Você só tem permissão para gerenciar os cursos criados por você.');
      }
    }

    const dataToUpdate: any = { ...dto };

    if (dto.trilhaId !== undefined) {
      if (dto.trilhaId) {
        const trilha = await this.prisma.learningPath.findUnique({
          where: { id: dto.trilhaId },
          include: { eixo: true },
        });
        dataToUpdate.categoria = trilha?.eixo?.nomeEixo || 'Geral';
      } else {
        dataToUpdate.categoria = 'Geral';
      }
    }

    return this.prisma.course.update({
      where: { id },
      data: dataToUpdate,
    });
  }

  async deleteCourse(id: string, userId?: string, userRole?: Role) {
    const course = await this.prisma.course.findFirst({ where: { id, deletedAt: null } });
    if (!course) throw new NotFoundException('Curso não encontrado.');

    if (userRole === Role.GESTOR_SECRETARIA && userId) {
      if (course.criadorId && course.criadorId !== userId) {
        throw new ForbiddenException('Você só tem permissão para excluir os cursos criados por você.');
      }
    }

    return this.prisma.course.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async createModule(courseId: string, dto: CreateModuleDto) {
    const course = await this.prisma.course.findFirst({ where: { id: courseId, deletedAt: null } });
    if (!course) throw new NotFoundException('Curso não encontrado.');

    const count = await this.prisma.module.count({ where: { courseId, deletedAt: null } });

    return this.prisma.module.create({
      data: {
        titulo: dto.titulo,
        ordem: dto.ordem ?? count + 1,
        courseId,
      },
    });
  }

  async updateModule(moduleId: string, dto: UpdateModuleDto) {
    const moduleItem = await this.prisma.module.findFirst({ where: { id: moduleId, deletedAt: null } });
    if (!moduleItem) throw new NotFoundException('Módulo não encontrado.');

    return this.prisma.module.update({
      where: { id: moduleId },
      data: dto,
    });
  }

  async deleteModule(moduleId: string) {
    const moduleItem = await this.prisma.module.findFirst({ where: { id: moduleId, deletedAt: null } });
    if (!moduleItem) throw new NotFoundException('Módulo não encontrado.');

    return this.prisma.module.update({
      where: { id: moduleId },
      data: { deletedAt: new Date() },
    });
  }

  async createLesson(moduleId: string, dto: CreateLessonDto) {
    const moduleItem = await this.prisma.module.findFirst({ where: { id: moduleId, deletedAt: null } });
    if (!moduleItem) throw new NotFoundException('Módulo não encontrado.');

    const count = await this.prisma.lesson.count({ where: { moduleId, deletedAt: null } });

    const newLesson = await this.prisma.lesson.create({
      data: {
        titulo: dto.titulo,
        tipo: dto.tipo,
        conteudoUrl: dto.conteudoUrl,
        texto: dto.texto,
        quizData: dto.quizData,
        duracaoMin: dto.duracaoMin ?? 10,
        xp: dto.xp ?? 10,
        ordem: dto.ordem ?? count + 1,
        moduleId,
      },
    });

    return newLesson;
  }

  async updateLesson(lessonId: string, dto: UpdateLessonDto) {
    const lesson = await this.prisma.lesson.findFirst({ where: { id: lessonId, deletedAt: null } });
    if (!lesson) throw new NotFoundException('Aula não encontrada.');

    return this.prisma.lesson.update({
      where: { id: lessonId },
      data: dto,
    });
  }

  async deleteLesson(lessonId: string) {
    const lesson = await this.prisma.lesson.findFirst({ where: { id: lessonId, deletedAt: null }, include: { module: true } });
    if (!lesson) throw new NotFoundException('Aula não encontrada.');

    const updated = await this.prisma.lesson.update({
      where: { id: lessonId },
      data: { deletedAt: new Date() },
    });

    return updated;
  }

  // =========================================================================
  // PRESENÇAS E CHECK-IN DE AULA PRESENCIAL
  // =========================================================================

  async checkinLesson(lessonId: string, matricula: string) {
    const cleanIdentifier = matricula.trim();

    const lesson = await this.prisma.lesson.findFirst({
      where: { id: lessonId, deletedAt: null },
      include: { module: { include: { course: true } } },
    });

    if (!lesson) {
      throw new NotFoundException('Aula não encontrada.');
    }

    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { matricula: cleanIdentifier },
          { cpf: cleanIdentifier },
        ],
        deletedAt: null,
      },
    });

    if (!user) {
      throw new NotFoundException(
        `Nenhum servidor foi localizado com a matrícula/identificador "${cleanIdentifier}".`,
      );
    }

    const courseId = lesson.module.courseId;
    const enrollment = await this.prisma.enrollment.findFirst({
      where: {
        courseId,
        userId: user.id,
        deletedAt: null,
      },
    });

    if (!enrollment) {
      throw new BadRequestException(
        `O servidor ${user.nome} (Matrícula: ${user.matricula}) não está matriculado no curso "${lesson.module.course.titulo}". É necessário se matricular antes de registrar presença.`,
      );
    }

    // Verificar se já possui presença confirmada
    const existingProgress = await this.prisma.lessonProgress.findUnique({
      where: { userId_lessonId: { userId: user.id, lessonId } },
    });

    if (existingProgress && existingProgress.completed) {
      const dataFormatada = new Date(existingProgress.updatedAt).toLocaleString('pt-BR');
      return {
        success: true,
        alreadyConfirmed: true,
        message: `Presença já havia sido confirmada anteriormente (${dataFormatada}).`,
        aulaTitulo: lesson.titulo,
        cursoTitulo: lesson.module.course.titulo,
        servidorNome: user.nome,
        matricula: user.matricula,
        timestamp: existingProgress.updatedAt,
      };
    }

    // Processar conclusão da aula (concede XP, calcula progresso, badges, certificados)
    const completionResult = await this.completeLesson(lessonId, user.id);

    // Log de auditoria
    await this.prisma.auditLog.create({
      data: {
        userId: user.id,
        acao: 'PRESENCA_AULA_CONFIRMADA',
        detalhes: `Presença confirmada na aula presencial: ${lesson.titulo} (Curso: ${lesson.module.course.titulo})`,
      },
    });

    return {
      success: true,
      alreadyConfirmed: false,
      message: 'Presença confirmada com sucesso na aula presencial!',
      aulaTitulo: lesson.titulo,
      cursoTitulo: lesson.module.course.titulo,
      servidorNome: user.nome,
      matricula: user.matricula,
      timestamp: new Date(),
      gainedXp: completionResult.gainedXp,
      courseProgress: completionResult.courseProgress,
    };
  }

  async getLessonPublicInfo(lessonId: string) {
    const lesson = await this.prisma.lesson.findFirst({
      where: { id: lessonId, deletedAt: null },
      include: {
        module: {
          select: {
            id: true,
            titulo: true,
            course: {
              select: {
                id: true,
                titulo: true,
                cargaHoraria: true,
                capaUrl: true,
                secretaria: true,
              },
            },
          },
        },
      },
    });

    if (!lesson) {
      throw new NotFoundException('Aula não encontrada.');
    }

    return {
      id: lesson.id,
      titulo: lesson.titulo,
      tipo: lesson.tipo,
      duracaoMin: lesson.duracaoMin,
      xp: lesson.xp,
      dataHoraAgendada: lesson.dataHoraAgendada,
      modulo: {
        id: lesson.module.id,
        titulo: lesson.module.titulo,
      },
      curso: lesson.module.course,
    };
  }

  async getLessonAttendances(lessonId: string) {
    const lesson = await this.prisma.lesson.findFirst({
      where: { id: lessonId, deletedAt: null },
      include: { module: true },
    });

    if (!lesson) {
      throw new NotFoundException('Aula não encontrada.');
    }

    const courseId = lesson.module.courseId;

    // Buscar todos os matriculados no curso
    const enrollments = await this.prisma.enrollment.findMany({
      where: { courseId, deletedAt: null },
      include: {
        user: {
          select: {
            id: true,
            nome: true,
            matricula: true,
            email: true,
            cargo: true,
            secretaria: true,
          },
        },
      },
      orderBy: { user: { nome: 'asc' } },
    });

    // Buscar progressos desta aula específica
    const progresses = await this.prisma.lessonProgress.findMany({
      where: {
        lessonId,
        completed: true,
      },
    });

    const progressMap = new Map(progresses.map((p) => [p.userId, p]));

    return {
      lesson: {
        id: lesson.id,
        titulo: lesson.titulo,
        tipo: lesson.tipo,
        duracaoMin: lesson.duracaoMin,
      },
      totalMatriculados: enrollments.length,
      totalPresentes: progresses.length,
      attendances: enrollments.map((enr) => {
        const prog = progressMap.get(enr.userId);
        return {
          enrollmentId: enr.id,
          userId: enr.user.id,
          nome: enr.user.nome,
          matricula: enr.user.matricula,
          email: enr.user.email,
          cargo: enr.user.cargo,
          secretaria: enr.user.secretaria?.sigla || 'Geral',
          presencaConfirmada: !!prog,
          presencaEm: prog ? prog.updatedAt : null,
        };
      }),
    };
  }

  async getCourseEnrollments(courseId: string) {
    const course = await this.prisma.course.findFirst({
      where: { id: courseId, deletedAt: null },
    });

    if (!course) {
      throw new NotFoundException('Curso não encontrado.');
    }

    const enrollments = await this.prisma.enrollment.findMany({
      where: { courseId, deletedAt: null },
      include: {
        user: {
          select: {
            id: true,
            nome: true,
            matricula: true,
            email: true,
            cargo: true,
            secretaria: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return enrollments.map((enr) => ({
      id: enr.id,
      userId: enr.user.id,
      nome: enr.user.nome,
      matricula: enr.user.matricula,
      email: enr.user.email,
      cargo: enr.user.cargo,
      secretaria: enr.user.secretaria?.sigla || 'Geral',
      progress: Math.round(enr.progress),
      statusConclusao: enr.statusConclusao,
      completedAt: enr.completedAt,
      createdAt: enr.createdAt,
    }));
  }

  // =========================================================================
  // HELPER INTERNO
  // =========================================================================
  private async syncCourseProgress(courseId: string) {
    const allLessonsCount = await this.prisma.lesson.count({
      where: { module: { courseId }, deletedAt: null },
    });

    const enrollments = await this.prisma.enrollment.findMany({
      where: { courseId },
    });

    for (const en of enrollments) {
      const completedCount = await this.prisma.lessonProgress.count({
        where: {
          userId: en.userId,
          lesson: { module: { courseId }, deletedAt: null },
          completed: true,
        },
      });
      const newProg = allLessonsCount === 0 ? 0 : Math.min(100, Math.round((completedCount / allLessonsCount) * 100));
      
      if (newProg !== en.progress) {
        await this.prisma.enrollment.update({
          where: { id: en.id },
          data: { progress: newProg },
        });
      }
    }
  }
}

