import { PrismaService } from '../../plugins/database/services/prisma.service';
import { Injectable } from '@nestjs/common';

export type CreateLogDto = {
  userId?: string;
  acao: string;
  detalhes?: string;
  ipAddress?: string;
};

@Injectable()
export class LoggingService {
  constructor(private readonly prisma: PrismaService) {}

  async createLog(logData: CreateLogDto): Promise<void> {
    try {
      if (!logData.userId) return;

      // Valida se o usuário existe na base antes de inserir o log (previne Foreign Key Violation caso o token seja de um seed anterior)
      const userExists = await this.prisma.user.findUnique({
        where: { id: logData.userId },
        select: { id: true },
      });

      if (!userExists) {
        return;
      }

      await this.prisma.auditLog.create({
        data: {
          userId: logData.userId,
          acao: logData.acao || 'HTTP_REQUEST',
          detalhes: logData.detalhes || '',
          ipAddress: logData.ipAddress || '127.0.0.1',
        },
      });
    } catch (error: any) {
      // Ignora silenciosamente erros de Foreign Key caso o usuário tenha sido removido durante o ciclo da requisição
      if (error?.code === 'P2003') {
        return;
      }
      console.warn('Falha não crítica ao salvar log de auditoria:', error?.message || error);
    }
  }
}
