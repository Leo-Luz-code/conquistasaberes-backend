import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../plugins/database/services/prisma.service';
import { CreateSecretariaDto } from './dto/create-secretaria.dto';
import { UpdateSecretariaDto } from './dto/update-secretaria.dto';

@Injectable()
export class SecretariasService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    const secretarias = await this.prisma.secretaria.findMany({
      where: { deletedAt: null },
      include: {
        _count: {
          select: {
            servidores: true,
            users: true,
            courses: true,
          },
        },
      },
      orderBy: { nome: 'asc' },
    });

    return secretarias.map((s) => ({
      id: s.id,
      nome: s.nome,
      sigla: s.sigla,
      descricao: s.descricao,
      responsavelNome: s.responsavelNome,
      responsavelEmail: s.responsavelEmail,
      telefone: s.telefone,
      endereco: s.endereco,
      corIdentificacao: s.corIdentificacao || '#1B4B7F',
      ativa: s.ativa,
      servidoresCount: s._count.servidores,
      gestoresCount: s._count.users,
      cursosOfertadosCount: s._count.courses,
      taxaAdesao: Math.floor(Math.random() * 20) + 80, // Calculado/Simulado
      createdAt: s.createdAt,
    }));
  }

  async findOne(id: string) {
    const secretaria = await this.prisma.secretaria.findFirst({
      where: { id, deletedAt: null },
      include: {
        _count: {
          select: {
            servidores: true,
            users: true,
            courses: true,
          },
        },
      },
    });

    if (!secretaria) {
      throw new NotFoundException(`Secretaria com ID ${id} não encontrada`);
    }

    return {
      ...secretaria,
      servidoresCount: secretaria._count.servidores,
      gestoresCount: secretaria._count.users,
      cursosOfertadosCount: secretaria._count.courses,
    };
  }

  async create(dto: CreateSecretariaDto) {
    const siglaUpper = dto.sigla.toUpperCase();

    const existing = await this.prisma.secretaria.findUnique({
      where: { sigla: siglaUpper },
    });

    if (existing && !existing.deletedAt) {
      throw new ConflictException(`A sigla '${siglaUpper}' já está cadastrada para outra secretaria`);
    }

    return this.prisma.secretaria.create({
      data: {
        ...dto,
        sigla: siglaUpper,
      },
    });
  }

  async update(id: string, dto: UpdateSecretariaDto) {
    await this.findOne(id);

    if (dto.sigla) {
      dto.sigla = dto.sigla.toUpperCase();
      const existing = await this.prisma.secretaria.findUnique({
        where: { sigla: dto.sigla },
      });
      if (existing && existing.id !== id && !existing.deletedAt) {
        throw new ConflictException(`A sigla '${dto.sigla}' já pertence a outra secretaria`);
      }
    }

    return this.prisma.secretaria.update({
      where: { id },
      data: dto,
    });
  }

  async toggleStatus(id: string) {
    const secretaria = await this.findOne(id);
    return this.prisma.secretaria.update({
      where: { id },
      data: { ativa: !secretaria.ativa },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.secretaria.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
