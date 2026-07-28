import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from 'src/plugins/database/services/prisma.service';
import { CertificateStatus, Prisma } from '@prisma/client';
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
  constructor(private readonly prisma: PrismaService) { }

  async findAll(search?: string, secretariaId?: string, categoria?: string, userId?: string) {
    const where: Prisma.CourseWhereInput = {
      isPublished: true,
      deletedAt: null,
    };

    const andConditions: Prisma.CourseWhereInput[] = [];

    // Busca por título ou descrição
    if (search) {
      andConditions.push({
        OR: [
          { titulo: { contains: search, mode: 'insensitive' } },
          { descricao: { contains: search, mode: 'insensitive' } },
        ]
      });
    }

    // Cursos da secretaria do usuário + cursos gerais
    if (secretariaId) { andConditions.push({ OR: [{ secretariaId }, { secretariaId: null }] }) }

    // Filtra categoria
    if (categoria && categoria !== 'Todas') { where.categoria = categoria }

    // Remove cursos já matriculados
    if (userId) { andConditions.push({ enrollments: { none: { userId } } }) }

    if (andConditions.length > 0) { where.AND = andConditions }

    const courses = await this.prisma.course.findMany({
      where,
      include: {
        secretaria: true,
        reviews: {
          select: {
            rating: true,
          },
        },
        _count: {
          select: {
            modules: true,
            enrollments: true,
            reviews: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return courses.map((course) => {
      const totalAvaliacoes = course._count.reviews;

      const mediaAvaliacoes =
        totalAvaliacoes > 0
          ? Number(
            (course.reviews.reduce((total, review) => total + review.rating, 0,) / totalAvaliacoes).toFixed(1),
          )
          : 0;

      return {
        id: course.id,
        titulo: course.titulo,
        descricao: course.descricao,
        cargaHoraria: course.cargaHoraria,
        categoria: course.categoria,
        capaUrl: course.capaUrl,
        secretaria: course.secretaria,
        modulosCount: course._count.modules,
        inscritosCount: course._count.enrollments,
        totalAvaliacoes,
        mediaAvaliacoes,
      };
    });
  }

  async getMyCourses(userId: string) {
    const enrollments = await this.prisma.enrollment.findMany({
      where: {
        userId,
      },
      include: {
        course: {
          include: {
            secretaria: true,

            reviews: {
              select: {
                userId: true,
                rating: true,
                comment: true,
              },
            },

            _count: {
              select: {
                reviews: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return enrollments.map((e) => {
      const totalAvaliacoes = e.course._count.reviews;

      const mediaAvaliacoes =
        totalAvaliacoes > 0
          ? Number(
            (
              e.course.reviews.reduce(
                (total, review) => total + review.rating,
                0,
              ) / totalAvaliacoes
            ).toFixed(1),
          )
          : 0;

      const myReview = e.course.reviews.find(
        (review) => review.userId === userId,
      );

      return {
        id: e.course.id,
        titulo: e.course.titulo,
        descricao: e.course.descricao,
        cargaHoraria: e.course.cargaHoraria,
        categoria: e.course.categoria,
        progresso: e.progress,

        secretaria: e.course.secretaria,

        myRating: myReview?.rating ?? 0,
        myComment: myReview?.comment ?? '',

        mediaAvaliacoes,
        totalAvaliacoes,
      };
    });
  }

  async getCourseRatings(courseId: string) {
    const course = await this.prisma.course.findFirst({
      where: {
        id: courseId,
        deletedAt: null,
      },
      select: {
        id: true,
        titulo: true,
      },
    });

    if (!course) {
      throw new NotFoundException('Curso não encontrado.');
    }

    const [summary, reviews] = await Promise.all([
      this.prisma.courseReview.aggregate({
        where: { courseId },
        _avg: {
          rating: true,
        },
        _count: {
          _all: true,
        },
      }),

      this.prisma.courseReview.findMany({
        where: { courseId },
        select: {
          id: true,
          rating: true,
          comment: true,
          createdAt: true,
          user: {
            select: {
              nome: true,
              cargo: true,
              secretaria: {
                select: {
                  nome: true,
                  sigla: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
    ]);

    return {
      course,
      totalAvaliacoes: summary._count._all,
      mediaAvaliacoes: Number((summary._avg.rating ?? 0).toFixed(1)),
      avaliacoes: reviews,
    };
  }

  async findOne(id: string, userId?: string) {
    const course = await this.prisma.course.findFirst({
      where: { id, deletedAt: null },
      include: {
        secretaria: true,
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
      },
    });

    if (!course) {
      throw new NotFoundException('Curso não encontrado.');
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
      isEnrolled,
      userProgress,
      completedLessonIds,
    };
  }

  async rateCourse(
    userId: string,
    courseId: string,
    dto: { rating: number; comment?: string },
  ) {
    console.log('=== RATE COURSE ===');
    console.log({ userId, courseId, dto });

    const course = await this.prisma.course.findFirst({
      where: {
        id: courseId,
        deletedAt: null,
      },
    });

    console.log('Curso encontrado:', course);

    if (!course) {
      throw new NotFoundException('Curso não encontrado.');
    }

    const review = await this.prisma.courseReview.upsert({
      where: {
        courseId_userId: {
          courseId,
          userId,
        },
      },
      update: {
        rating: dto.rating,
        comment: dto.comment,
      },
      create: {
        courseId,
        userId,
        rating: dto.rating,
        comment: dto.comment,
      },
    });

    console.log('Review salva:', review);

    return review;
  }

  async enroll(courseId: string, userId: string) {
    console.log('Enroll:', { courseId, userId });

    try {
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
    } catch (error) {
      console.error('Erro ao inscrever:', error);
      throw error;
    }
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

      gainedXp = lesson.tipo === 'QUIZ' ? 100 : 50;
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

    const isNowCompleted = progressPercentage >= 100 && !enrollment.completedAt;

    await this.prisma.enrollment.update({
      where: { id: enrollment.id },
      data: {
        progress: progressPercentage,
        completedAt: isNowCompleted ? new Date() : enrollment.completedAt,
      },
    });

    // Atualizar XP e Nível do Usuário
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    let newXp = (user?.xpPoints || 0) + gainedXp;
    let newLevel = Math.floor(newXp / 250) + 1;

    // Conclusão de Curso: Bônus de XP, Badges e Certificado Automatizado
    let newBadgeEarned: any = null;
    let newCertificateCode: string | null = null;

    if (isNowCompleted) {
      newXp += 200; // Bônus por concluir curso
      newLevel = Math.floor(newXp / 250) + 1;

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
          newXp += targetBadge.xpBonus;
          newLevel = Math.floor(newXp / 250) + 1;
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
      }
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { xpPoints: newXp, level: newLevel },
    });

    return {
      message: 'Aula concluída com sucesso!',
      gainedXp,
      newTotalXp: newXp,
      level: newLevel,
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

  async findAllAdmin() {
    return this.prisma.course.findMany({
      where: { deletedAt: null },
      include: {
        secretaria: true,
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

  async createCourse(dto: CreateCourseDto) {
    return this.prisma.course.create({
      data: {
        titulo: dto.titulo,
        descricao: dto.descricao,
        cargaHoraria: dto.cargaHoraria,
        categoria: dto.categoria || 'Geral',
        capaUrl: dto.capaUrl,
        secretariaId: dto.secretariaId || null,
        isPublished: dto.isPublished ?? true,
      },
    });
  }

  async updateCourse(id: string, dto: UpdateCourseDto) {
    const course = await this.prisma.course.findFirst({ where: { id, deletedAt: null } });
    if (!course) throw new NotFoundException('Curso não encontrado.');

    return this.prisma.course.update({
      where: { id },
      data: dto,
    });
  }

  async deleteCourse(id: string) {
    const course = await this.prisma.course.findFirst({ where: { id, deletedAt: null } });
    if (!course) throw new NotFoundException('Curso não encontrado.');

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

    return this.prisma.lesson.create({
      data: {
        titulo: dto.titulo,
        tipo: dto.tipo,
        conteudoUrl: dto.conteudoUrl,
        texto: dto.texto,
        quizData: dto.quizData,
        duracaoMin: dto.duracaoMin ?? 10,
        ordem: dto.ordem ?? count + 1,
        moduleId,
      },
    });
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
    const lesson = await this.prisma.lesson.findFirst({ where: { id: lessonId, deletedAt: null } });
    if (!lesson) throw new NotFoundException('Aula não encontrada.');

    return this.prisma.lesson.update({
      where: { id: lessonId },
      data: { deletedAt: new Date() },
    });
  }
}