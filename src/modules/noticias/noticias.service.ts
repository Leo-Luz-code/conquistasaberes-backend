import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../plugins/database/services/prisma.service';
import { CreateNoticiaDto } from './dto/create-noticia.dto';
import { UpdateNoticiaDto } from './dto/update-noticia.dto';

@Injectable()
export class NoticiasService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(onlyPublished = false, secretariaId?: string) {
    const whereClause: any = { deletedAt: null };
    if (onlyPublished) {
      whereClause.publicada = true;
    }
    if (secretariaId) {
      // Retorna notícias destinadas a toda a prefeitura (null) OU destinadas especificamente a esta secretaria
      whereClause.OR = [
        { secretariaAlvoId: null },
        { secretariaAlvoId: secretariaId },
      ];
    }

    const noticias = await this.prisma.noticia.findMany({
      where: whereClause,
      include: {
        secretariaAlvo: {
          select: {
            id: true,
            sigla: true,
            nome: true,
          },
        },
      },
      orderBy: { dataPublicacao: 'desc' },
    });

    return noticias.map((n) => ({
      ...n,
      secretariaAlvoSigla: n.secretariaAlvo ? n.secretariaAlvo.sigla : 'Todas as Secretarias',
    }));
  }

  async findOne(id: string) {
    const noticia = await this.prisma.noticia.findFirst({
      where: { id, deletedAt: null },
      include: {
        secretariaAlvo: true,
      },
    });

    if (!noticia) {
      throw new NotFoundException(`Notícia com ID ${id} não encontrada`);
    }

    // Incrementa contagem de visualizações
    await this.prisma.noticia.update({
      where: { id },
      data: { visualizacoes: { increment: 1 } },
    });

    return {
      ...noticia,
      secretariaAlvoSigla: noticia.secretariaAlvo ? noticia.secretariaAlvo.sigla : 'Todas as Secretarias',
    };
  }

  async create(dto: CreateNoticiaDto) {
    if (dto.destaque) {
      // Remove destaque de notícias anteriores
      await this.prisma.noticia.updateMany({
        where: { destaque: true },
        data: { destaque: false },
      });
    }

    return this.prisma.noticia.create({
      data: {
        titulo: dto.titulo,
        subtitulo: dto.subtitulo,
        conteudo: dto.conteudo,
        categoria: dto.categoria || 'Geral',
        capaUrl: dto.capaUrl || 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?q=80&w=800&auto=format&fit=crop',
        destaque: dto.destaque ?? false,
        publicada: dto.publicada ?? true,
        autorNome: dto.autorNome || 'Assessoria CETI',
        secretariaAlvoId: dto.secretariaAlvoId || null,
      },
    });
  }

  async update(id: string, dto: UpdateNoticiaDto) {
    await this.findOne(id);

    if (dto.destaque) {
      await this.prisma.noticia.updateMany({
        where: { destaque: true, id: { not: id } },
        data: { destaque: false },
      });
    }

    return this.prisma.noticia.update({
      where: { id },
      data: dto,
    });
  }

  async toggleStatus(id: string) {
    const noticia = await this.findOne(id);
    return this.prisma.noticia.update({
      where: { id },
      data: { publicada: !noticia.publicada },
    });
  }

  async toggleDestaque(id: string) {
    const noticia = await this.findOne(id);
    const novoStatus = !noticia.destaque;

    if (novoStatus) {
      await this.prisma.noticia.updateMany({
        where: { destaque: true },
        data: { destaque: false },
      });
    }

    return this.prisma.noticia.update({
      where: { id },
      data: { destaque: novoStatus },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.noticia.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }
}
