import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { LearningPathsService } from './learning-paths.service';
import { JwtAtGuard, RolesGuard } from '../../common/guards';
import { Roles } from '../../common/decorators';
import { Role } from '@prisma/client';
import { CreateLearningPathDto, UpdateLearningPathDto, LinkCoursesDto } from './dto';
import { Patch } from '@nestjs/common';

@ApiTags('Trilhas de Aprendizagem')
@Controller('learning-paths')
export class LearningPathsController {
  constructor(private readonly learningPathsService: LearningPathsService) {}

  @ApiOperation({ summary: 'Obter todas as trilhas de capacitação (Público/Autenticado)' })
  @Get()
  async getLearningPaths() {
    return this.learningPathsService.getLearningPaths();
  }

  @ApiOperation({ summary: 'Obter detalhes de uma trilha de aprendizagem' })
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.learningPathsService.findOne(id);
  }

  @ApiOperation({ summary: 'Criar uma nova trilha de aprendizagem' })
  @ApiBearerAuth()
  @UseGuards(JwtAtGuard, RolesGuard)
  @Roles(Role.ADMIN_RH_CETI)
  @Post()
  async create(@Body() dto: CreateLearningPathDto) {
    return this.learningPathsService.create(dto);
  }

  @ApiOperation({ summary: 'Atualizar uma trilha de aprendizagem' })
  @ApiBearerAuth()
  @UseGuards(JwtAtGuard, RolesGuard)
  @Roles(Role.ADMIN_RH_CETI)
  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateLearningPathDto) {
    return this.learningPathsService.update(id, dto);
  }

  @ApiOperation({ summary: 'Remover (Soft Delete) uma trilha de aprendizagem' })
  @ApiBearerAuth()
  @UseGuards(JwtAtGuard, RolesGuard)
  @Roles(Role.ADMIN_RH_CETI)
  @Delete(':id')
  async softDelete(@Param('id') id: string) {
    return this.learningPathsService.softDelete(id);
  }

  @ApiOperation({ summary: 'Vincular cursos a uma trilha de aprendizagem' })
  @ApiBearerAuth()
  @UseGuards(JwtAtGuard, RolesGuard)
  @Roles(Role.ADMIN_RH_CETI)
  @Patch(':id/courses')
  async linkCourses(@Param('id') id: string, @Body() dto: LinkCoursesDto) {
    return this.learningPathsService.linkCourses(id, dto.courseIds);
  }
}
