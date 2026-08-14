import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/plugins/database/services/prisma.service';

@Injectable()
export class GamificationService {
  constructor(private readonly prisma: PrismaService) {}

  async getUserGamification(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        secretaria: true,
        userBadges: {
          include: { badge: true },
        },
      },
    });

    const allBadges = await this.prisma.badge.findMany({
      where: { deletedAt: null },
    });

    const earnedBadgeIds = new Set(user?.userBadges.map((ub) => ub.badgeId) || []);

    const badgesFormatted = allBadges.map((b) => ({
      ...b,
      earned: earnedBadgeIds.has(b.id),
      earnedAt: user?.userBadges.find((ub) => ub.badgeId === b.id)?.earnedAt || null,
    }));

    return {
      xpPoints: user?.xpPoints || 0,
      level: user?.level || 1,
      nextLevelXp: ((user?.level || 1) * 250),
      badges: badgesFormatted,
    };
  }

  async getLeaderboard() {
    // Top 10 Servidores por XP
    const topUsers = await this.prisma.user.findMany({
      where: { deletedAt: null },
      take: 10,
      orderBy: { xpPoints: 'desc' },
      select: {
        id: true,
        nome: true,
        cargo: true,
        xpPoints: true,
        level: true,
        secretaria: { select: { nome: true, sigla: true } },
      },
    });

    // Ranking por Secretaria (XP acumulado dos servidores)
    const secretarias = await this.prisma.secretaria.findMany({
      where: { deletedAt: null },
      include: {
        users: {
          where: { deletedAt: null },
          select: { xpPoints: true },
        },
      },
    });

    const topSecretarias = secretarias
      .map((sec) => {
        const totalXp = sec.users.reduce((acc, u) => acc + u.xpPoints, 0);
        return {
          id: sec.id,
          nome: sec.nome,
          sigla: sec.sigla,
          totalXp,
          servidoresCount: sec.users.length,
        };
      })
      .sort((a, b) => b.totalXp - a.totalXp);

    return {
      topUsers,
      topSecretarias,
    };
  }

  async processLessonCompletion(userId: string, gainedXp: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('Usuário não encontrado.');
    }

    const oldLevel = user.level;
    const currentXp = user.xpPoints;
    const newXp = currentXp + gainedXp;
    
    let newLevel = Math.floor(0.1 * Math.sqrt(newXp)) + 1;
    if (newLevel < 1) newLevel = 1;

    const leveledUp = newLevel > oldLevel;

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        xpPoints: newXp,
        level: newLevel,
      },
    });

    return {
      newXp,
      newLevel,
      leveledUp,
    };
  }
}
