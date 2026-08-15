import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../plugins/database/services/prisma.service';
import { CreateBibliotecaDto, ListLibraryDto, UpdateBibliotecaDto } from './dto/library.dto';

@Injectable()
export class LibraryService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: ListLibraryDto) {
    const { search, categoria, page = 1, limit = 8 } = query;
    const where = {
      deletedAt: null,
      ...(categoria && { categoria }),
      ...(search && {
        OR: [
          { titulo: { contains: search, mode: 'insensitive' as const } },
          { categoria: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
    };

    const [total, data] = await this.prisma.$transaction([
      this.prisma.biblioteca.count({ where }),
      this.prisma.biblioteca.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return {
      data,
      meta: { total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) },
    };
  }

  async getCategories() {
    const categories = await this.prisma.biblioteca.groupBy({
      by: ['categoria'],
      where: { deletedAt: null },
      _count: { _all: true },
      orderBy: { categoria: 'asc' },
    });

    return categories.map((item) => ({ categoria: item.categoria, total: item._count._all }));
  }

  async findOne(id: string) {
    const material = await this.prisma.biblioteca.findFirst({ where: { id, deletedAt: null } });
    if (!material) throw new NotFoundException('Material não encontrado.');
    return material;
  }

  async create(dto: CreateBibliotecaDto, uploadedUrl?: string) {
    const documentoUrl = uploadedUrl || dto.documentoUrl;
    if (!documentoUrl) {
      throw new BadRequestException('Envie um arquivo ou informe a URL do documento.');
    }

    return this.prisma.biblioteca.create({
      data: {
        titulo: dto.titulo.trim(),
        categoria: dto.categoria.trim(),
        documentoUrl,
      },
    });
  }

  async update(id: string, dto: UpdateBibliotecaDto, uploadedUrl?: string) {
    await this.findOne(id);
    return this.prisma.biblioteca.update({
      where: { id },
      data: {
        ...(dto.titulo && { titulo: dto.titulo.trim() }),
        ...(dto.categoria && { categoria: dto.categoria.trim() }),
        ...(uploadedUrl ? { documentoUrl: uploadedUrl } : dto.documentoUrl && { documentoUrl: dto.documentoUrl }),
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.biblioteca.update({ where: { id }, data: { deletedAt: new Date() } });
    return { message: 'Material removido com sucesso.' };
  }
}