import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../plugins/database/services/prisma.service';

@Injectable()
export class ForumService {
  constructor(private readonly prisma: PrismaService) {}

  // No getPosts, inclua os comentários:
  async getPosts(courseId?: string) {
    const where: any = { deletedAt: null };
    if (courseId) where.courseId = courseId;

    const posts = await this.prisma.forumPost.findMany({
      where,
      include: {
        user: { select: { id: true, nome: true, cargo: true, secretaria: { select: { sigla: true } } } },
        comments: {
          include: {
            user: { select: { id: true, nome: true, cargo: true, secretaria: { select: { sigla: true } } } },
          },
          orderBy: { createdAt: 'asc' },
        },
        course: { select: { id: true, titulo: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return posts.map((p) => ({
      id: p.id,
      titulo: p.titulo,
      conteudo: p.conteudo,
      autor: p.user?.nome || 'Servidor Municipal',
      cargo: p.user?.cargo,
      secretariaSigla: p.user?.secretaria?.sigla || 'PMVC',
      createdAt: p.createdAt,
      comments: p.comments.map((c) => ({
        id: c.id,
        conteudo: c.conteudo,
        autor: c.user?.nome || 'Servidor Municipal',
        secretariaSigla: c.user?.secretaria?.sigla || 'PMVC',
        createdAt: c.createdAt,
      })),
    }));
  }

  // Método para adicionar resposta:
  async addComment(postId: string, userId: string, conteudo: string) {
    return this.prisma.forumComment.create({
      data: {
        postId,
        userId,
        conteudo,
      },
    });
  }

  async createPost(userId: string, dto: { titulo: string; conteudo: string; courseId?: string }) {
    const post = await this.prisma.forumPost.create({
      data: {
        titulo: dto.titulo,
        conteudo: dto.conteudo,
        courseId: dto.courseId || null,
        userId,
      },
      include: {
        user: { select: { nome: true, cargo: true } },
      },
    });

    return post;
  }

  async updatePost(postId: string, userId: string, dto: { titulo?: string; conteudo?: string }) {
    const post = await this.prisma.forumPost.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException('Postagem não encontrada');
    
    // Opcional: Garante que apenas o próprio autor pode editar
    if (post.userId !== userId) {
      throw new ForbiddenException('Você não tem permissão para editar este post');
    }

    return this.prisma.forumPost.update({
      where: { id: postId },
      data: {
        titulo: dto.titulo,
        conteudo: dto.conteudo,
      },
    });
  }

  async deletePost(postId: string, userId: string) {
    // 1. Verifica se o post existe
    const post = await this.prisma.forumPost.findUnique({
      where: { id: postId },
    });

    if (!post) {
      throw new NotFoundException('Postagem não encontrada');
    }

    // 2. Deleta a postagem diretamente no banco de dados
    return this.prisma.forumPost.delete({
      where: { id: postId },
    });
  }
}
