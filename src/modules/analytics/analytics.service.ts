import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/plugins/database/services/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  async getExecutiveDashboard(secretariaId?: string) {
    const isFiltered = Boolean(secretariaId && secretariaId !== 'TODAS');
    const userWhere: any = { deletedAt: null };
    if (isFiltered) {
      userWhere.secretariaId = secretariaId;
    }

    // 1. Contagens de Servidores
    const totalServidores = await this.prisma.user.count({ where: userWhere });
    const servidoresAtivosCount = await this.prisma.user.count({
      where: { ...userWhere, statusAtivo: true },
    });

    // 2. Contagens de Cursos
    const courseWhere: any = { deletedAt: null, isPublished: true };
    if (isFiltered) {
      courseWhere.OR = [{ secretariaId }, { secretariaId: null }];
    }
    const totalCursos = await this.prisma.course.count({ where: courseWhere });

    // 3. Matrículas e Certificados
    const enrollmentWhere: any = { deletedAt: null };
    if (isFiltered) {
      enrollmentWhere.user = { secretariaId };
    }

    const [totalInscricoes, enrollments] = await Promise.all([
      this.prisma.enrollment.count({ where: enrollmentWhere }),
      this.prisma.enrollment.findMany({
        where: enrollmentWhere,
        select: { userId: true, progress: true, statusConclusao: true, completedAt: true, createdAt: true },
      }),
    ]);

    const certWhere: any = { deletedAt: null, status: 'EMITTED' };
    if (isFiltered) {
      certWhere.user = { secretariaId };
    }
    const totalCertificados = await this.prisma.certificate.count({ where: certWhere });

    // Servidores únicos com pelo menos 1 matrícula
    const servidoresComInscricao = new Set(enrollments.map((e) => e.userId)).size;
    const taxaEngajamento = totalServidores > 0
      ? Math.round((servidoresComInscricao / totalServidores) * 100)
      : (enrollments.length > 0 ? 100 : 0);

    // Média de progresso
    const avgProgress = enrollments.length
      ? Math.round(enrollments.reduce((acc, e) => acc + e.progress, 0) / enrollments.length)
      : (totalCertificados > 0 ? 100 : 0);

    // 4. Status das Matrículas (Donut Chart)
    let concluidosCount = 0;
    let emAndamentoCount = 0;
    let naoIniciadosCount = 0;

    enrollments.forEach((e) => {
      if (e.progress >= 100 || e.statusConclusao === 'CONCLUIDO') {
        concluidosCount++;
      } else if (e.progress > 0) {
        emAndamentoCount++;
      } else {
        naoIniciadosCount++;
      }
    });

    // Se não houver matrículas ainda, usar fallback baseado nos servidores
    const statusMatriculas = {
      concluidos: concluidosCount,
      emAndamento: emAndamentoCount,
      naoIniciados: naoIniciadosCount,
      total: enrollments.length,
    };

    // 5. Conclusão por Curso (Bar Chart)
    const courses = await this.prisma.course.findMany({
      where: courseWhere,
      take: 6,
      orderBy: { createdAt: 'asc' },
      include: {
        enrollments: {
          where: {
            deletedAt: null,
            ...(isFiltered ? { user: { secretariaId } } : {}),
          },
        },
        certificates: {
          where: {
            deletedAt: null,
            ...(isFiltered ? { user: { secretariaId } } : {}),
          },
        },
      },
    });

    const cursosStats = courses.map((c) => {
      const inscritos = c.enrollments.length;
      const concluidos = c.certificates.length;
      const taxa = inscritos > 0 ? Math.round((concluidos / inscritos) * 100) : (concluidos > 0 ? 100 : 0);
      return {
        id: c.id,
        titulo: c.titulo,
        categoria: c.categoria,
        totalInscritos: inscritos,
        concluidos,
        taxaConclusaoPercent: taxa,
      };
    });

    // 6. Trilhas de Aprendizagem (Adesão Real por Servidores Distintos)
    const trilhas = await this.prisma.learningPath.findMany({
      where: { deletedAt: null },
      take: 6,
      include: {
        courses: {
          where: { deletedAt: null },
          select: { id: true },
        },
        enrollments: {
          where: {
            deletedAt: null,
            ...(isFiltered ? { user: { secretariaId } } : {}),
          },
          select: { userId: true },
        },
      },
    });

    const trilhasStats = await Promise.all(
      trilhas.map(async (t) => {
        const courseIds = t.courses.map((c) => c.id);

        const courseEnrollments = courseIds.length
          ? await this.prisma.enrollment.findMany({
              where: {
                courseId: { in: courseIds },
                deletedAt: null,
                ...(isFiltered ? { user: { secretariaId } } : {}),
              },
              select: { userId: true },
            })
          : [];

        // Contar servidores únicos distintos que participam da trilha
        const uniqueUserIds = new Set<string>();
        t.enrollments.forEach((e) => uniqueUserIds.add(e.userId));
        courseEnrollments.forEach((e) => uniqueUserIds.add(e.userId));

        const totalInscritosTrilha = uniqueUserIds.size;
        const taxaAdesao = totalServidores > 0
          ? Math.min(100, Math.round((totalInscritosTrilha / totalServidores) * 100))
          : 0;

        return {
          id: t.id,
          tituloTrilha: t.tituloTrilha,
          totalCursos: t.courses.length,
          totalInscritos: totalInscritosTrilha,
          taxaAdesaoPercent: taxaAdesao,
        };
      }),
    );

    // 7. Ranking Real dos Servidores (Top Servidores)
    const topUsers = await this.prisma.user.findMany({
      where: {
        deletedAt: null,
        ...(isFiltered ? { secretariaId } : {}),
      },
      take: 8,
      orderBy: { xpPoints: 'desc' },
      select: {
        id: true,
        nome: true,
        cargo: true,
        xpPoints: true,
        level: true,
        secretariaId: true,
        secretaria: { select: { id: true, nome: true, sigla: true } },
      },
    });

    const rankingServidores = topUsers.map((u) => ({
      id: u.id,
      nome: u.nome,
      cargo: u.cargo || 'Servidor Municipal',
      pontos: u.xpPoints,
      level: u.level,
      secretariaSigla: u.secretaria?.sigla || 'PMVC',
      secretariaNome: u.secretaria?.nome || 'Prefeitura Municipal',
      secretariaId: u.secretariaId || '',
    }));

    // 8. Engajamento Mensal Real (Volume de Atividades nos últimos 5 meses)
    const mesesNomes = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
    const now = new Date();
    const inicioCincoMeses = new Date(now.getFullYear(), now.getMonth() - 4, 1);
    const engajamentoMeses: { mes: string; acessos: number }[] = [];

    const secUserIds = isFiltered
      ? (
          await this.prisma.user.findMany({
            where: { secretariaId, deletedAt: null },
            select: { id: true },
          })
        ).map((u) => u.id)
      : [];

    const [logsAudit, progressosAulas] = await Promise.all([
      this.prisma.auditLog.findMany({
        where: {
          createdAt: { gte: inicioCincoMeses },
          deletedAt: null,
          ...(isFiltered ? { user: { secretariaId } } : {}),
        },
        select: { createdAt: true },
      }),
      this.prisma.lessonProgress.findMany({
        where: {
          createdAt: { gte: inicioCincoMeses },
          deletedAt: null,
          ...(isFiltered ? { userId: { in: secUserIds } } : {}),
        },
        select: { createdAt: true },
      }),
    ]);

    for (let i = 4; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const mesIndex = d.getMonth();
      const mesAno = d.getFullYear();
      const mesNome = mesesNomes[mesIndex];

      const matriculasNoMes = enrollments.filter((e) => {
        const dt = new Date(e.createdAt);
        return dt.getMonth() === mesIndex && dt.getFullYear() === mesAno;
      }).length;

      const logsNoMes = logsAudit.filter((l) => {
        const dt = new Date(l.createdAt);
        return dt.getMonth() === mesIndex && dt.getFullYear() === mesAno;
      }).length;

      const aulasNoMes = progressosAulas.filter((p) => {
        const dt = new Date(p.createdAt);
        return dt.getMonth() === mesIndex && dt.getFullYear() === mesAno;
      }).length;

      // Soma de todas as interações reais (matrículas + aulas assistidas + acessos/ações)
      const totalAtividades = matriculasNoMes + logsNoMes + aulasNoMes;

      engajamentoMeses.push({
        mes: mesNome,
        acessos: totalAtividades,
      });
    }

    // 9. Pendências de capacitação
    const servidoresSemInscricao = Math.max(0, totalServidores - servidoresComInscricao);

    // 10. Métricas por Secretaria
    const secWhere: any = { deletedAt: null };
    if (isFiltered) {
      secWhere.id = secretariaId;
    }

    const secretarias = await this.prisma.secretaria.findMany({
      where: secWhere,
      include: {
        users: {
          where: { deletedAt: null },
          include: {
            enrollments: { where: { deletedAt: null } },
            certificates: { where: { deletedAt: null, status: 'EMITTED' } },
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

    return {
      totalServidores,
      servidoresAtivos: servidoresAtivosCount,
      totalCursos,
      totalInscricoes,
      totalCertificados,
      taxaEngajamento,
      avgProgressPercent: avgProgress,
      cursosStats,
      statusMatriculas,
      trilhasStats,
      rankingServidores,
      engajamentoMeses,
      servidoresSemInscricao,
      secretariaStats,
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
