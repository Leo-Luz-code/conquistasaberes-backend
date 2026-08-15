import {
  BadRequestException, ConflictException, ForbiddenException, Injectable, NotFoundException,
} from '@nestjs/common';

import { PrismaService } from 'src/plugins/database/services/prisma.service';

import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';

@Injectable()
export class EventsService {
  constructor(private readonly prisma: PrismaService) {}

  // =========================================================
  // LISTAR EVENTOS
  // =========================================================
  async findAll(filters?: { secretariaId?: string; categoria?: string; modalidade?: string }) {
    return this.prisma.event.findMany({
      where: {
        deletedAt: null, isPublished: true,
        ...(filters?.secretariaId && { secretariaId: filters.secretariaId }),
        ...(filters?.categoria && { categoria: filters.categoria }),
        ...(filters?.modalidade && { modalidade: filters.modalidade }),
      },
      include: {
        secretaria: true,
        _count: { select: { inscricoes: { where: { deletedAt: null } } } },
      },
      orderBy: { dataInicio: 'asc' },
    });
  }

  // =========================================================
  // BUSCAR EVENTO
  // =========================================================
  async findOne(id: string) {
    const event = await this.prisma.event.findFirst({
      where: { id, deletedAt: null },
      include: {
        secretaria: true,
        inscricoes: {
          where: { deletedAt: null },
          include: { user: true },
          orderBy: { createdAt: 'desc' },
        },
        _count: { select: { inscricoes: { where: { deletedAt: null } } } },
      },
    });

    if (!event) {
      throw new NotFoundException('Evento não encontrado.');
    }

    return event;
  }

  // =========================================================
  // CRIAR EVENTO
  // =========================================================
  async create(dto: CreateEventDto, userId: string) {
    await this.validateDates(dto.dataInicio, dto.dataFim);

    if (dto.secretariaId) {
      await this.validateSecretariaAccess(
        userId,
        dto.secretariaId,
      );
    }

    return this.prisma.event.create({
      data: {
        titulo: dto.titulo,
        descricao: dto.descricao,
        categoria: dto.categoria ?? 'Palestra',
        dataInicio: new Date(dto.dataInicio),
        dataFim: new Date(dto.dataFim),
        local: dto.local,
        modalidade: dto.modalidade ?? 'PRESENCIAL',
        vagas: dto.vagas,
        capaUrl: dto.capaUrl,
        secretariaId: dto.secretariaId ?? null,
        isPublished: dto.isPublished ?? true,
      },
    });
  }

  // =========================================================
  // ATUALIZAR
  // =========================================================
  async update(id: string, userId: string, dto: UpdateEventDto) {
    const event = await this.prisma.event.findFirst({
      where: { id, deletedAt: null },
    });

    if (!event) {
      throw new NotFoundException('Evento não encontrado.');
    }

    await this.validateEventAccess(event, userId);

    if (dto.dataInicio && dto.dataFim) {
      await this.validateDates(dto.dataInicio, dto.dataFim);
    }

    const data: any = {};

    if (dto.titulo !== undefined) data.titulo = dto.titulo;
    if (dto.descricao !== undefined) data.descricao = dto.descricao;
    if (dto.categoria !== undefined) data.categoria = dto.categoria;
    if (dto.dataInicio !== undefined) data.dataInicio = new Date(dto.dataInicio);
    if (dto.dataFim !== undefined) data.dataFim = new Date(dto.dataFim);
    if (dto.local !== undefined) data.local = dto.local;
    if (dto.modalidade !== undefined) data.modalidade = dto.modalidade;
    if (dto.vagas !== undefined) data.vagas = dto.vagas;
    if (dto.capaUrl !== undefined) data.capaUrl = dto.capaUrl;

    if (dto.secretariaId !== undefined) {
      await this.validateSecretariaAccess(userId, dto.secretariaId);
      data.secretariaId = dto.secretariaId;
    }

    if (dto.isPublished !== undefined) data.isPublished = dto.isPublished;

    return this.prisma.event.update({
      where: { id },
      data,
      include: {
        secretaria: true,
        _count: { select: { inscricoes: { where: { deletedAt: null } } } },
      },
    });
  }

  // =========================================================
  // EXCLUIR
  // =========================================================
  async remove(id: string, userId: string) {
    const event = await this.prisma.event.findFirst({
      where: { id, deletedAt: null },
    });

    if (!event) {
      throw new NotFoundException('Evento não encontrado.');
    }

    await this.validateEventAccess(event, userId);

    /*
     * Soft delete.
     *
     * Mantemos o registro para preservar
     * histórico das inscrições.
     */
    return this.prisma.event.update({
      where: { id },
      data: { deletedAt: new Date(), isPublished: false },
    });
  }

  // =========================================================
  // INSCRIÇÕES
  // =========================================================
  async getEnrollments(eventId: string, userId: string) {
    const event = await this.prisma.event.findFirst({
      where: { id: eventId, deletedAt: null },
    });

    if (!event) {
      throw new NotFoundException('Evento não encontrado.');
    }

    await this.validateEventAccess(event, userId);

    return this.prisma.eventEnrollment.findMany({
      where: { eventId, deletedAt: null },
      include: {
        user: {
          select: {
            id: true,
            nome: true,
            matricula: true,
            email: true,
            cargo: true,
            secretaria: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  // =========================================================
  // CHECK-IN DE PRESENÇA (PÚBLICO VIA QR CODE / MATRÍCULA)
  // =========================================================
  async checkin(eventId: string, matricula: string) {
    const cleanIdentifier = matricula.trim();

    const event = await this.prisma.event.findFirst({
      where: { id: eventId, deletedAt: null },
    });

    if (!event) {
      throw new NotFoundException('Evento não encontrado.');
    }

    // Localizar usuário por matrícula ou CPF
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { matricula: cleanIdentifier },
          { cpf: cleanIdentifier },
        ],
        deletedAt: null,
      },
    });

    if (!user) {
      throw new NotFoundException(
        `Nenhum servidor foi localizado com a matrícula/identificador "${cleanIdentifier}".`,
      );
    }

    // Verificar se o servidor está inscrito no evento
    const enrollment = await this.prisma.eventEnrollment.findFirst({
      where: {
        eventId,
        userId: user.id,
        deletedAt: null,
      },
    });

    if (!enrollment) {
      throw new BadRequestException(
        `O servidor ${user.nome} (Matrícula: ${user.matricula}) não está inscrito no evento "${event.titulo}". É necessário realizar a inscrição antes de confirmar a presença.`,
      );
    }

    // Se já tiver confirmado presença anteriormente
    if (enrollment.presencaValidada) {
      const dataFormatada = enrollment.presencaValidadaEm
        ? new Date(enrollment.presencaValidadaEm).toLocaleString('pt-BR')
        : 'data anterior';

      return {
        success: true,
        alreadyConfirmed: true,
        message: `Presença já havia sido confirmada anteriormente (${dataFormatada}).`,
        eventTitle: event.titulo,
        servidorNome: user.nome,
        matricula: user.matricula,
        timestamp: enrollment.presencaValidadaEm || enrollment.updatedAt,
      };
    }

    // Atualizar presença
    const now = new Date();
    const updated = await this.prisma.eventEnrollment.update({
      where: { id: enrollment.id },
      data: {
        presencaValidada: true,
        presencaValidadaEm: now,
      },
    });

    // Log de auditoria
    await this.prisma.auditLog.create({
      data: {
        userId: user.id,
        acao: 'PRESENCA_EVENTO_CONFIRMADA',
        detalhes: `Presença confirmada no evento: ${event.titulo}`,
      },
    });

    return {
      success: true,
      alreadyConfirmed: false,
      message: 'Presença confirmada com sucesso!',
      eventTitle: event.titulo,
      servidorNome: user.nome,
      matricula: user.matricula,
      timestamp: now,
    };
  }

  async findMyEnrollments(userId: string) {
    const enrollments = await this.prisma.eventEnrollment.findMany({
      where: { userId, deletedAt: null },
      select: { eventId: true },
    });

    return enrollments.map((e) => e.eventId);
  }

  // =========================================================
  // INSCREVER SERVIDOR
  // =========================================================
  async enroll(eventId: string, userId: string) {
    const event = await this.prisma.event.findFirst({
      where: { id: eventId, deletedAt: null, isPublished: true },
      include: {
        _count: { select: { inscricoes: { where: { deletedAt: null } } } },
      },
    });

    if (!event) {
      throw new NotFoundException('Evento não encontrado ou não está disponível.');
    }

    if (event.dataInicio <= new Date()) {
      throw new BadRequestException('Não é possível se inscrever em um evento que já começou.');
    }

    if (event.vagas && event._count.inscricoes >= event.vagas) {
      throw new BadRequestException('Não há mais vagas disponíveis.');
    }

    const existing = await this.prisma.eventEnrollment.findFirst({
      where: { userId, eventId, deletedAt: null },
    });

    if (existing) {
      throw new ConflictException('Você já está inscrito neste evento.');
    }

    /*
     * Caso tenha existido uma inscrição anterior
     * que foi cancelada, podemos restaurá-la.
     */
    const deleted = await this.prisma.eventEnrollment.findFirst({
      where: { userId, eventId, deletedAt: { not: null } },
    });

    if (deleted) {
      return this.prisma.eventEnrollment.update({
        where: { id: deleted.id },
        data: { deletedAt: null, presencaValidada: false },
      });
    }

    return this.prisma.eventEnrollment.create({
      data: { userId, eventId },
    });
  }

  // =========================================================
  // CANCELAR INSCRIÇÃO
  // =========================================================
  async unenroll(eventId: string, userId: string) {
    const enrollment = await this.prisma.eventEnrollment.findFirst({
      where: { eventId, userId, deletedAt: null },
    });

    if (!enrollment) {
      throw new NotFoundException('Inscrição não encontrada.');
    }

    return this.prisma.eventEnrollment.update({
      where: { id: enrollment.id },
      data: { deletedAt: new Date() },
    });
  }

  // =========================================================
  // VALIDAÇÕES
  // =========================================================
  private async validateDates(dataInicio: string, dataFim: string) {
    const inicio = new Date(dataInicio);
    const fim = new Date(dataFim);

    if (Number.isNaN(inicio.getTime()) || Number.isNaN(fim.getTime())) {
      throw new BadRequestException('Data de início ou término inválida.');
    }

    if (fim <= inicio) {
      throw new BadRequestException('A data de término deve ser posterior à data de início.');
    }
  }

  // =========================================================
  // AUTORIZAÇÃO
  // =========================================================
  private async validateEventAccess(
    event: any,
    userId: string,
  ) {
    const user = await this.getUserWithAccess(userId);

    // ADMIN_RH_CETI pode gerenciar qualquer evento
    if (user.isAdmin) {
      return;
    }

    // Apenas gestor da secretaria pode gerenciar eventos
    if (user.role !== 'GESTOR_SECRETARIA') {
      throw new ForbiddenException(
        'Você não possui permissão para gerenciar eventos.',
      );
    }

    // Gestor só pode gerenciar eventos da própria secretaria
    if (
      !event.secretariaId ||
      user.secretariaId !== event.secretariaId
    ) {
      throw new ForbiddenException(
        'Você não possui permissão para gerenciar este evento.',
      );
    }
  }  

  private async validateSecretariaAccess(
    userId: string,
    secretariaId?: string,
  ) {
    const user = await this.getUserWithAccess(userId);

    if (user.isAdmin) {
      return;
    }

    if (user.role !== 'GESTOR_SECRETARIA') {
      throw new ForbiddenException(
        'Apenas gestores de secretaria podem criar eventos.',
      );
    }

    if (!secretariaId) {
      throw new ForbiddenException(
        'A secretaria do evento deve ser informada.',
      );
    }

    if (user.secretariaId !== secretariaId) {
      throw new ForbiddenException(
        'Você não possui permissão para criar eventos nesta secretaria.',
      );
    }
  }

  private async getUserWithAccess(userId: string) {
    /*
     * Ajuste os nomes dos campos abaixo
     * caso seu model User utilize outra estrutura
     * para role/secretaria.
     */
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
        secretariaId: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    return {
      ...user,
      isAdmin: user.role === 'ADMIN_RH_CETI',
    };
  }
}
