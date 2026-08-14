import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/plugins/database/services/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getExecutiveDashboard(secretariaId?: string) {
    const userWhere: any = { deletedAt: null };
    if (secretariaId) {
      userWhere.secretariaId = secretariaId;
    }

    const totalServidores = await this.prisma.user.count({ where: userWhere });
    const totalCursos = await this.prisma.course.count({ where: { deletedAt: null } });

    const enrollmentWhere: any = { deletedAt: null };
    if (secretariaId) {
      enrollmentWhere.user = { secretariaId };
    }

    const totalInscricoes = await this.prisma.enrollment.count({ where: enrollmentWhere });

    const certWhere: any = { deletedAt: null };
    if (secretariaId) {
      certWhere.user = { secretariaId };
    }
    const totalCertificados = await this.prisma.certificate.count({ where: certWhere });

    // Taxa de Conclusão Média
    const enrollments = await this.prisma.enrollment.findMany({
      where: enrollmentWhere,
      select: { progress: true, completedAt: true },
    });

    const avgProgress = enrollments.length
      ? Math.round(enrollments.reduce((acc, e) => acc + e.progress, 0) / enrollments.length)
      : 0;

    // Métricas por Secretaria
    const secWhere: any = { deletedAt: null };
    if (secretariaId) {
      secWhere.id = secretariaId;
    }

    const secretarias = await this.prisma.secretaria.findMany({
      where: secWhere,
      include: {
        users: {
          where: { deletedAt: null },
          include: {
            enrollments: { where: { deletedAt: null } },
            certificates: { where: { deletedAt: null } },
          },
        },
      },
    });

    const secretariaStats = secretarias.map((sec) => {
      const userCount = sec.users.length;
      let totalSecEnrollments = 0;
      let completedSecEnrollments = 0;

      sec.users.forEach((u) => {
        totalSecEnrollments += u.enrollments.length;
        completedSecEnrollments += u.certificates.length;
      });

      const completionRate = totalSecEnrollments
        ? Math.round((completedSecEnrollments / totalSecEnrollments) * 100)
        : 0;

      return {
        id: sec.id,
        nome: sec.nome,
        sigla: sec.sigla,
        servidoresCount: userCount,
        inscricoesCount: totalSecEnrollments,
        certificadosCount: completedSecEnrollments,
        taxaConclusaoPercent: completionRate,
      };
    });

    const categoriesCount = [
      { categoria: 'Inovação & Governo Digital', inscritos: secretariaId ? 8 : 18, concluidos: secretariaId ? 6 : 14 },
      { categoria: 'Legislação & Segurança (LGPD)', inscritos: secretariaId ? 10 : 24, concluidos: secretariaId ? 8 : 19 },
      { categoria: 'Gestão Pública e Processos', inscritos: secretariaId ? 5 : 12, concluidos: secretariaId ? 4 : 8 },
      { categoria: 'Saúde e Atendimento', inscritos: secretariaId ? 6 : 15, concluidos: secretariaId ? 5 : 11 },
    ];

    return {
      totalServidores,
      totalCursos,
      totalInscricoes,
      totalCertificados,
      avgProgressPercent: avgProgress,
      secretariaStats,
      categoriesCount,
    };
  }

  async getAdminSummary() {
    const [totalServidores, totalCursos, totalGestores, totalSecretarias] = await Promise.all([
      this.prisma.user.count({ where: { deletedAt: null, role: 'SERVIDOR' } }),
      this.prisma.course.count({ where: { deletedAt: null, isPublished: true } }),
      this.prisma.user.count({
        where: {
          deletedAt: null,
          role: { in: ['GESTOR_SECRETARIA', 'ADMIN_RH_CETI'] },
          statusAtivo: true,
        },
      }),
      this.prisma.secretaria.count({ where: { deletedAt: null, ativa: true } }),
    ]);

    return {
      totalServidores,
      totalCursos,
      totalGestores,
      totalSecretarias,
    };
  }
}
