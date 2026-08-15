import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../plugins/database/services/prisma.service';
import { BuscaTalentosDto } from './dto/busca-talentos.dto';

@Injectable()
export class TalentosService {
  constructor(private readonly prisma: PrismaService) {}

  private calcularScore(params: {
    xpPoints: number;
    badgesCount: number;
    certificatesCount: number;
  }) {
    const { xpPoints, badgesCount, certificatesCount } = params;
    return xpPoints * 0.3 + badgesCount * 10 + certificatesCount * 15;
  }

  async buscarTalentos(filtros: BuscaTalentosDto) {
    const { search, area, minLevel, possuiCertificado } = filtros;

    const users = await this.prisma.user.findMany({
      where: {
        deletedAt: null,
        statusAtivo: true,
        // 1. Pesquisa por nome ou cargo
        nome: search ? { contains: search, mode: 'insensitive' } : undefined,
        
        // 2. Filtro por Área (exemplo buscando no cargo ou atributo correspondente)
        cargo: area ? { contains: area, mode: 'insensitive' } : undefined,

        // 3. Filtro por Nível Mínimo do usuário
        level: minLevel ? { gte: minLevel } : undefined,

        // 4. Filtro por Certificado (se true, exige pelo menos 1 certificado EMITTED)
        certificates: possuiCertificado
          ? { some: { status: 'EMITTED' } }
          : undefined,
      },
      include: {
        secretaria: { select: { nome: true, sigla: true } },
        userBadges: { include: { badge: true } },
        certificates: { where: { status: 'EMITTED' } },
        userSkills: { include: { skill: true } },
      },
      orderBy: [{ xpPoints: 'desc' }, { level: 'desc' }],
      take: 30,
    });

    return users
      .map((u) => ({
        ...u,
        scoreDestaque: this.calcularScore({
          xpPoints: u.xpPoints,
          badgesCount: u.userBadges.length,
          certificatesCount: u.certificates.length,
        }),
      }))
      .sort((a, b) => b.scoreDestaque - a.scoreDestaque);
  }

  async getPerfilTalento(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId, deletedAt: null },
      include: {
        secretaria: true,
        userBadges: { include: { badge: true } },
        certificates: { where: { status: 'EMITTED' }, include: { course: true } },
        userSkills: { include: { skill: true } },
        enrollments: {
          where: { statusConclusao: 'CONCLUIDO', deletedAt: null },
          include: { course: true },
        },
      },
    });

    if (!user) return null;

    return {
      ...user,
      scoreDestaque: this.calcularScore({
        xpPoints: user.xpPoints,
        badgesCount: user.userBadges.length,
        certificatesCount: user.certificates.length,
      }),
    };
  }
}