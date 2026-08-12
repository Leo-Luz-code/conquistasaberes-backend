import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { EixosService } from './eixos.service';
import { JwtAtGuard, RolesGuard } from '../../common/guards';
import { Roles } from '../../common/decorators';
import { Role } from '@prisma/client';
import { CreateEixoDto, UpdateEixoDto } from './dto';

@ApiTags('Eixos de Conhecimento')
@Controller('eixos')
export class EixosController {
  constructor(private readonly eixosService: EixosService) {}

  @ApiOperation({ summary: 'Listar todos os eixos de conhecimento' })
  @ApiBearerAuth()
  @UseGuards(JwtAtGuard, RolesGuard)
  @Roles(Role.ADMIN_RH_CETI, Role.GESTOR_SECRETARIA)
  @Get()
  async findAll() {
    return this.eixosService.findAll();
  }

  @ApiOperation({ summary: 'Obter detalhes de um eixo de conhecimento com suas trilhas' })
  @ApiBearerAuth()
  @UseGuards(JwtAtGuard, RolesGuard)
  @Roles(Role.ADMIN_RH_CETI, Role.GESTOR_SECRETARIA)
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.eixosService.findOne(id);
  }

  @ApiOperation({ summary: 'Criar um novo eixo de conhecimento' })
  @ApiBearerAuth()
  @UseGuards(JwtAtGuard, RolesGuard)
  @Roles(Role.ADMIN_RH_CETI)
  @Post()
  async create(@Body() dto: CreateEixoDto) {
    return this.eixosService.create(dto);
  }

  @ApiOperation({ summary: 'Atualizar um eixo de conhecimento' })
  @ApiBearerAuth()
  @UseGuards(JwtAtGuard, RolesGuard)
  @Roles(Role.ADMIN_RH_CETI)
  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateEixoDto) {
    return this.eixosService.update(id, dto);
  }

  @ApiOperation({ summary: 'Remover (Soft Delete) um eixo de conhecimento' })
  @ApiBearerAuth()
  @UseGuards(JwtAtGuard, RolesGuard)
  @Roles(Role.ADMIN_RH_CETI)
  @Delete(':id')
  async softDelete(@Param('id') id: string) {
    return this.eixosService.softDelete(id);
  }
}
