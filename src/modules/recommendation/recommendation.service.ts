import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../plugins/database/services/prisma.service';

@Injectable()
export class RecommendationService {
  constructor(private readonly prisma: PrismaService) {}

  async getRecommendations(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        secretaria: true,
        enrollments: { select: { courseId: true } },
      },
    });

    if (!user) {
      return [];
    }

    const enrolledCourseIds = new Set(user.enrollments.map((e) => e.courseId));

    // Cursos recomendados:
    // 1. Cursos direcionados especificamente para a Secretaria do servidor
    // 2. Cursos de temas prioritários municipais (Inovação, LGPD, Governança)
    // 3. Cursos mais acessados na prefeitura que o servidor ainda não se inscreveu

    const courses = await this.prisma.course.findMany({
      where: {
        isPublished: true,
        deletedAt: null,
        id: { notIn: Array.from(enrolledCourseIds) },
      },
      include: {
        secretaria: true,
        _count: { select: { enrollments: true } },
      },
      take: 6,
    });

    return courses.map((course) => {
      let score = 50; // Pontuação base
      let matchReason = 'Recomendado para Capacitação Geral PMVC';

      if (course.secretariaId === user.secretariaId) {
        score += 40;
        matchReason = `Especialmente recomendado para a ${user.secretaria.sigla}`;
      }

      if (user.cargo.toLowerCase().includes('técnico') || user.cargo.toLowerCase().includes('coordenad')) {
        if (course.categoria.includes('Inovação') || course.categoria.includes('Legislação')) {
          score += 25;
          matchReason = `Excelente para desenvolver competências no cargo de ${user.cargo}`;
        }
      }

      return {
        id: course.id,
        titulo: course.titulo,
        descricao: course.descricao,
        cargaHoraria: course.cargaHoraria,
        categoria: course.categoria,
        capaUrl: course.capaUrl,
        secretaria: course.secretaria,
        score,
        matchReason,
      };
    }).sort((a, b) => b.score - a.score);
  }
}
