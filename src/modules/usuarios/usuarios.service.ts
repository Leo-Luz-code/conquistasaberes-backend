import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../plugins/database/services/prisma.service';
import { BuscaUsuarioFilterDto } from './dto/busca-usuarios.dto';
import { CriaUsuarioDto } from './dto/cria-usuario.dto';
import { AtualizaUsuarioDto } from './dto/atualiza-usuario.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UsuariosService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(dto: BuscaUsuarioFilterDto) {
    const pagina = dto.pagina ? Math.max(1, Number(dto.pagina)) : 1;
    const itensPorPagina = dto.itensPorPagina ? Math.max(1, Number(dto.itensPorPagina)) : 10;
    const where: any = { deletedAt: null };

    if (dto.busca) {
      const cleanBusca = dto.busca.trim();
      where.OR = [
        { nome: { contains: cleanBusca, mode: 'insensitive' } },
        { email: { contains: cleanBusca, mode: 'insensitive' } },
        { matricula: { contains: cleanBusca, mode: 'insensitive' } },
        { cpf: { contains: cleanBusca, mode: 'insensitive' } },
      ];
    }

    if (dto.filtro && dto.valor) {
      const filtros = dto.filtro.split(',');
      const valores = dto.valor.split(',');

      filtros.forEach((f, index) => {
        const v = valores[index];
        if (!v) return;
        if (f === 'nivel') {
          if (v === 'ADMIN') where.role = 'ADMIN_RH_CETI';
          else if (v === 'USUARIO') where.role = 'SERVIDOR';
          else where.role = v;
        } else if (f === 'situacao') {
          if (v === 'ATIVO') where.statusAtivo = true;
          else if (v === 'INATIVO') where.statusAtivo = false;
        }
      });
    }

    const totalItens = await this.prisma.user.count({ where });

    if (totalItens === 0) {
      return { data: [], maxPag: 1, total: 0, pagina, itensPorPagina };
    }

    const maxPag = Math.max(1, Math.ceil(totalItens / itensPorPagina));
    const safePagina = Math.min(pagina, maxPag);
    const skip = (safePagina - 1) * itensPorPagina;
    const take = itensPorPagina;

    const users = await this.prisma.user.findMany({
      where,
      include: { secretaria: true },
      orderBy: { nome: 'asc' },
      skip,
      take,
    });

    const data = users.map((u) => ({
      id: u.id,
      cpf: u.cpf,
      matricula: u.matricula,
      nome: u.nome,
      email: u.email,
      role: u.role,
      cargo: u.cargo,
      secretaria: u.secretaria,
      xpPoints: u.xpPoints,
      level: u.level,
      lgpdAccepted: u.lgpdAccepted,
      statusAtivo: u.statusAtivo,
    }));

    return {
      data,
      maxPag,
      total: totalItens,
      pagina: safePagina,
      itensPorPagina,
    };
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
      include: {
        secretaria: true,
        userBadges: { include: { badge: true } },
        certificates: { include: { course: true } },
      },
    });

    if (!user) {
      throw new NotFoundException('Servidor não encontrado.');
    }

    return user;
  }

  async create(dto: CriaUsuarioDto) {
    const passwordHash = await bcrypt.hash(dto.senha, 10);

    const user = await this.prisma.user.create({
      data: {
        cpf: dto.cpf,
        matricula: dto.matricula,
        nome: dto.nome,
        email: dto.email,
        cargo: dto.cargo,
        secretariaId: dto.secretariaId,
        role: dto.role,
        passwordHash,
        statusAtivo: dto.statusAtivo ?? true,
      },
    });

    const { passwordHash: _, ...result } = user;
    return result;
  }

  async update(id: string, dto: AtualizaUsuarioDto) {
    const userExists = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
    });

    if (!userExists) {
      throw new NotFoundException('Servidor não encontrado.');
    }

    const data: any = { ...dto };

    if (dto.senha) {
      data.passwordHash = await bcrypt.hash(dto.senha, 10);
      delete data.senha;
    } else {
      delete data.senha;
    }

    const user = await this.prisma.user.update({
      where: { id },
      data,
    });

    const { passwordHash: _, ...result } = user;
    return result;
  }

  async softDelete(id: string) {
    const userExists = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
    });

    if (!userExists) {
      throw new NotFoundException('Servidor não encontrado.');
    }

    return this.prisma.user.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
