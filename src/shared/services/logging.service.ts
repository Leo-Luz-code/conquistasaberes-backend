import { PrismaService } from '../../plugins/database/services/prisma.service';
import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

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
      if (logData.userId) {
        await this.prisma.auditLog.create({
          data: {
            userId: logData.userId,
            acao: logData.acao || 'HTTP_REQUEST',
            detalhes: logData.detalhes || '',
            ipAddress: logData.ipAddress || '127.0.0.1',
          },
        });
      }
    } catch (error) {
      console.error('Failed to save audit log:', error);
    }
  }
}
