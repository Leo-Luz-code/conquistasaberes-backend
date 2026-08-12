import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/plugins/database/services/prisma.service';
import { CreateLearningPathDto, UpdateLearningPathDto } from './dto';

@Injectable()
export class LearningPathsService {
  constructor(private readonly prisma: PrismaService) {}

  async getLearningPaths() {
    return this.prisma.learningPath.findMany({
      where: { deletedAt: null },
      include: {
        eixo: true,
        courses: {
          where: { isPublished: true, deletedAt: null },
          include: { secretaria: true },
        },
      },
      orderBy: { tituloTrilha: 'asc' },
    });
  }

  async findOne(id: string) {
    const trilha = await this.prisma.learningPath.findFirst({
      where: { id, deletedAt: null },
      include: {
        eixo: true,
        courses: {
          where: { deletedAt: null },
        },
      },
    });

    if (!trilha) {
      throw new NotFoundException('Trilha de aprendizagem não encontrada.');
    }

    return trilha;
  }

  async create(dto: CreateLearningPathDto) {
    return this.prisma.learningPath.create({
      data: {
        tituloTrilha: dto.tituloTrilha,
        cargaHorariaTotal: dto.cargaHorariaTotal,
        ...(dto.eixoId && { eixoId: dto.eixoId }),
      },
    });
  }

  async update(id: string, dto: UpdateLearningPathDto) {
    const trilhaExists = await this.prisma.learningPath.findFirst({
      where: { id, deletedAt: null },
    });

    if (!trilhaExists) {
      throw new NotFoundException('Trilha de aprendizagem não encontrada.');
    }

    return this.prisma.learningPath.update({
      where: { id },
      data: {
        ...(dto.tituloTrilha && { tituloTrilha: dto.tituloTrilha }),
        ...(dto.cargaHorariaTotal !== undefined && { cargaHorariaTotal: dto.cargaHorariaTotal }),
        ...(dto.eixoId !== undefined && { eixoId: dto.eixoId }), // can be null/undefined logic handled gracefully
      },
    });
  }

  async softDelete(id: string) {
    const trilhaExists = await this.prisma.learningPath.findFirst({
      where: { id, deletedAt: null },
    });

    if (!trilhaExists) {
      throw new NotFoundException('Trilha de aprendizagem não encontrada.');
    }

    return this.prisma.learningPath.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async linkCourses(id: string, courseIds: string[]) {
    // 1. Desvincular todos os cursos atualmente nesta trilha que não estão na lista
    await this.prisma.course.updateMany({
      where: { trilhaId: id, id: { notIn: courseIds } },
      data: { trilhaId: null },
    });

    // 2. Vincular os novos cursos (ou atualizar os que já estão)
    if (courseIds.length > 0) {
      await this.prisma.course.updateMany({
        where: { id: { in: courseIds } },
        data: { trilhaId: id },
      });
    }

    return { message: 'Cursos vinculados com sucesso.' };
  }
}
