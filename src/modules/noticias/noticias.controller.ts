import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { NoticiasService } from './noticias.service';
import { CreateNoticiaDto } from './dto/create-noticia.dto';
import { UpdateNoticiaDto } from './dto/update-noticia.dto';
import { JwtAtGuard } from '../../common/guards/jwt-at.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Role } from '@prisma/client';

@ApiTags('Notícias e Comunicados')
@Controller('noticias')
export class NoticiasController {
  constructor(private readonly noticiasService: NoticiasService) {}

  @ApiOperation({ summary: 'Listar todas as notícias para o portal de notícias ou painel' })
  @ApiResponse({ status: 200, description: 'Lista de notícias retornada com sucesso' })
  @Get()
  findAll(
    @Query('onlyPublished') onlyPublished?: string,
    @Query('secretariaId') secretariaId?: string,
  ) {
    const isPublished = onlyPublished === 'true';
    return this.noticiasService.findAll(isPublished, secretariaId);
  }

  @ApiOperation({ summary: 'Obter detalhes e conteúdo completo de uma notícia' })
  @ApiResponse({ status: 200, description: 'Detalhes da notícia' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.noticiasService.findOne(id);
  }

  @ApiOperation({ summary: 'Criar nova notícia/comunicado' })
  @ApiResponse({ status: 201, description: 'Notícia criada com sucesso' })
  @ApiBearerAuth()
  @UseGuards(JwtAtGuard, RolesGuard)
  @Roles(Role.ADMIN_RH_CETI)
  @Post()
  create(@Body() dto: CreateNoticiaDto) {
    return this.noticiasService.create(dto);
  }

  @ApiOperation({ summary: 'Atualizar dados de uma notícia existente' })
  @ApiResponse({ status: 200, description: 'Notícia atualizada' })
  @ApiBearerAuth()
  @UseGuards(JwtAtGuard, RolesGuard)
  @Roles(Role.ADMIN_RH_CETI)
  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateNoticiaDto) {
    return this.noticiasService.update(id, dto);
  }

  @ApiOperation({ summary: 'Alternar status de publicação (Publicada / Rascunho)' })
  @ApiResponse({ status: 200, description: 'Status de publicação alternado' })
  @ApiBearerAuth()
  @UseGuards(JwtAtGuard, RolesGuard)
  @Roles(Role.ADMIN_RH_CETI)
  @Patch(':id/toggle-status')
  toggleStatus(@Param('id') id: string) {
    return this.noticiasService.toggleStatus(id);
  }

  @ApiOperation({ summary: 'Alternar se a notícia é o destaque principal do banner' })
  @ApiResponse({ status: 200, description: 'Destaque alternado' })
  @ApiBearerAuth()
  @UseGuards(JwtAtGuard, RolesGuard)
  @Roles(Role.ADMIN_RH_CETI)
  @Patch(':id/toggle-destaque')
  toggleDestaque(@Param('id') id: string) {
    return this.noticiasService.toggleDestaque(id);
  }

  @ApiOperation({ summary: 'Remover notícia (Soft Delete)' })
  @ApiResponse({ status: 200, description: 'Notícia removida' })
  @ApiBearerAuth()
  @UseGuards(JwtAtGuard, RolesGuard)
  @Roles(Role.ADMIN_RH_CETI)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.noticiasService.remove(id);
  }
}
