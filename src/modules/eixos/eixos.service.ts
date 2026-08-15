import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/plugins/database/services/prisma.service';
import { CreateEixoDto, UpdateEixoDto } from './dto';

@Injectable()
export class EixosService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.eixoConhecimento.findMany({
      where: { deletedAt: null },
      orderBy: { nomeEixo: 'asc' },
    });
  }

  async findOne(id: string) {
    const eixo = await this.prisma.eixoConhecimento.findFirst({
      where: { id, deletedAt: null },
      include: {
        trilhas: {
          where: { deletedAt: null },
          orderBy: { tituloTrilha: 'asc' },
        },
      },
    });

    if (!eixo) {
      throw new NotFoundException('Eixo de conhecimento não encontrado.');
    }

    return eixo;
  }

  async create(dto: CreateEixoDto) {
    return this.prisma.eixoConhecimento.create({
      data: {
        nomeEixo: dto.nomeEixo,
        descricao: dto.descricao,
      },
    });
  }

  async update(id: string, dto: UpdateEixoDto) {
    const eixoExists = await this.prisma.eixoConhecimento.findFirst({
      where: { id, deletedAt: null },
    });

    if (!eixoExists) {
      throw new NotFoundException('Eixo de conhecimento não encontrado.');
    }

    return this.prisma.eixoConhecimento.update({
      where: { id },
      data: {
        ...(dto.nomeEixo && { nomeEixo: dto.nomeEixo }),
        ...(dto.descricao && { descricao: dto.descricao }),
      },
    });
  }

  async softDelete(id: string) {
    const eixoExists = await this.prisma.eixoConhecimento.findFirst({
      where: { id, deletedAt: null },
    });

    if (!eixoExists) {
      throw new NotFoundException('Eixo de conhecimento não encontrado.');
    }

    return this.prisma.eixoConhecimento.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
