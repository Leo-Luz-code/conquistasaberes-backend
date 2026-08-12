import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UsuariosService } from './usuarios.service';
import { JwtAtGuard, RolesGuard } from '../../common/guards';
import { Roles } from '../../common/decorators';
import { Role } from '@prisma/client';
import { CriaUsuarioDto } from './dto/cria-usuario.dto';
import { AtualizaUsuarioDto } from './dto/atualiza-usuario.dto';
import { BuscaUsuarioFilterDto } from './dto/busca-usuarios.dto';

@ApiTags('Gestão de Servidores & Perfis')
@Controller('usuarios')
export class UsuariosController {
  constructor(private readonly usuariosService: UsuariosService) {}

  @ApiOperation({ summary: 'Listar servidores municipais com paginação e filtros (Apenas Gestores de Secretaria e Admin CETI)' })
  @ApiBearerAuth()
  @UseGuards(JwtAtGuard, RolesGuard)
  @Roles(Role.GESTOR_SECRETARIA, Role.ADMIN_RH_CETI)
  @Get()
  async findAll(@Query() dto: BuscaUsuarioFilterDto) {
    return this.usuariosService.findAll(dto);
  }

  @ApiOperation({ summary: 'Detalhes do perfil do servidor' })
  @ApiBearerAuth()
  @UseGuards(JwtAtGuard)
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.usuariosService.findOne(id);
  }

  @ApiOperation({ summary: 'Criar um novo servidor' })
  @ApiBearerAuth()
  @UseGuards(JwtAtGuard, RolesGuard)
  @Roles(Role.ADMIN_RH_CETI)
  @Post()
  async create(@Body() dto: CriaUsuarioDto) {
    return this.usuariosService.create(dto);
  }

  @ApiOperation({ summary: 'Atualizar um servidor' })
  @ApiBearerAuth()
  @UseGuards(JwtAtGuard, RolesGuard)
  @Roles(Role.ADMIN_RH_CETI)
  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: AtualizaUsuarioDto) {
    return this.usuariosService.update(id, dto);
  }

  @ApiOperation({ summary: 'Deletar (soft delete) um servidor' })
  @ApiBearerAuth()
  @UseGuards(JwtAtGuard, RolesGuard)
  @Roles(Role.ADMIN_RH_CETI)
  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.usuariosService.softDelete(id);
  }
}
