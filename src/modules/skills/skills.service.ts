import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../plugins/database/services/prisma.service';

@Injectable()
export class SkillsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.skill.findMany({
      orderBy: { nome: 'asc' },
    });
  }
}