import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from '@nestjs/common';

import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';

import { EventsService } from './events.service';

import { JwtAtGuard } from '../../common/guards';

import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { CheckinDto } from './dto/checkin.dto';

@ApiTags('Eventos & Palestras')
@Controller('events')
export class EventsController {
  constructor(
    private readonly eventsService: EventsService,
  ) {}

  // =========================================================
  // CHECK-IN DE PRESENÇA (PÚBLICO VIA QR CODE)
  // =========================================================
  @ApiOperation({
    summary: 'Confirmar presença de servidor em evento via QR Code',
  })
  @Post(':id/checkin')
  async checkin(
    @Param('id') eventId: string,
    @Body() dto: CheckinDto,
  ) {
    return this.eventsService.checkin(eventId, dto.matricula);
  }

  // =========================================================
  // EVENTOS PÚBLICOS / CATÁLOGO
  // =========================================================

  @ApiOperation({
    summary: 'Listar eventos disponíveis',
  })
  @ApiQuery({
    name: 'secretariaId',
    required: false,
    type: String,
  })
  @ApiQuery({
    name: 'categoria',
    required: false,
    type: String,
  })
  @ApiQuery({
    name: 'modalidade',
    required: false,
    type: String,
  })
  @Get()
  async findAll(
    @Query('secretariaId') secretariaId?: string,
    @Query('categoria') categoria?: string,
    @Query('modalidade') modalidade?: string,
  ) {
    return this.eventsService.findAll({
      secretariaId,
      categoria,
      modalidade,
    });
  }

  // =========================================================
  // MINHAS INSCRIÇÕES
  //
  // IMPORTANTE: precisa vir ANTES de qualquer rota com :id
  // (findOne, getEnrollments, etc.), senão o Express casa
  // "me" como se fosse um :id e essa rota nunca é alcançada.
  // =========================================================

  @ApiOperation({
    summary: 'Listar eventos em que o usuário logado está inscrito',
  })
  @ApiBearerAuth()
  @UseGuards(JwtAtGuard)
  @Get('me/enrollments')
  async getMyEnrollments(@Request() req: any) {
    const userId = req.user.sub || req.user.id;

    return this.eventsService.findMyEnrollments(userId);
  }

  // =========================================================
  // EVENTO ESPECÍFICO
  // =========================================================

  @ApiOperation({
    summary: 'Buscar evento por ID',
  })
  @Get(':id')
  async findOne(
    @Param('id') id: string,
  ) {
    return this.eventsService.findOne(id);
  }

  // =========================================================
  // CRIAÇÃO
  // =========================================================

  @ApiOperation({
  summary: 'Criar novo evento',
  })
  @ApiBearerAuth()
  @UseGuards(JwtAtGuard)
  @Post()
  async create(
    @Body() dto: CreateEventDto,
    @Request() req: any,
  ) {
    const userId = req.user.sub || req.user.id;

    return this.eventsService.create(
      dto,
      userId,
    );
  }

  // =========================================================
  // ATUALIZAÇÃO
  // =========================================================

  @ApiOperation({
    summary: 'Atualizar evento',
  })
  @ApiBearerAuth()
  @UseGuards(JwtAtGuard)
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateEventDto,
    @Request() req: any,
  ) {
    const userId = req.user.sub || req.user.id;

    return this.eventsService.update(
      id,
      userId,
      dto,
    );
  }

  // =========================================================
  // EXCLUSÃO
  // =========================================================

  @ApiOperation({
    summary: 'Excluir evento',
  })
  @ApiBearerAuth()
  @UseGuards(JwtAtGuard)
  @Delete(':id')
  async remove(
    @Param('id') id: string,
    @Request() req: any,
  ) {
    const userId = req.user.sub || req.user.id;

    return this.eventsService.remove(
      id,
      userId,
    );
  }

  // =========================================================
  // INSCRIÇÕES
  // =========================================================

  @ApiOperation({
    summary: 'Listar inscritos de um evento',
  })
  @ApiBearerAuth()
  @UseGuards(JwtAtGuard)
  @Get(':id/enrollments')
  async getEnrollments(
    @Param('id') eventId: string,
    @Request() req: any,
  ) {
    const userId = req.user.sub || req.user.id;

    return this.eventsService.getEnrollments(
      eventId,
      userId,
    );
  }

  // =========================================================
  // INSCRIÇÃO DO SERVIDOR
  // =========================================================

  @ApiOperation({
    summary: 'Inscrever servidor em evento',
  })
  @ApiBearerAuth()
  @UseGuards(JwtAtGuard)
  @Post(':id/enroll')
  async enroll(
    @Param('id') eventId: string,
    @Request() req: any,
  ) {
    const userId = req.user.sub || req.user.id;

    return this.eventsService.enroll(
      eventId,
      userId,
    );
  }

  // =========================================================
  // CANCELAR INSCRIÇÃO
  // =========================================================

  @ApiOperation({
    summary: 'Cancelar inscrição em evento',
  })
  @ApiBearerAuth()
  @UseGuards(JwtAtGuard)
  @Delete(':id/enroll')
  async unenroll(
    @Param('id') eventId: string,
    @Request() req: any,
  ) {
    const userId = req.user.sub || req.user.id;

    return this.eventsService.unenroll(
      eventId,
      userId,
    );
  }
}