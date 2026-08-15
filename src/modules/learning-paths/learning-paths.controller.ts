import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards, Request, Patch } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { LearningPathsService } from './learning-paths.service';
import { JwtAtGuard, RolesGuard } from '../../common/guards';
import { Roles } from '../../common/decorators';
import { Role } from '@prisma/client';
import { CreateLearningPathDto, UpdateLearningPathDto, LinkCoursesDto } from './dto';

@ApiTags('Trilhas de Aprendizagem')
@Controller('learning-paths')
export class LearningPathsController {
  constructor(private readonly learningPathsService: LearningPathsService) {}

  @ApiOperation({ summary: 'Obter todas as trilhas de capacitação' })
  @ApiBearerAuth()
  @UseGuards(JwtAtGuard)
  @Get()
  async getLearningPaths(@Request() req: any) {
    return this.learningPathsService.getLearningPaths(req.user?.sub);
  }

  @ApiOperation({ summary: 'Listar trilhas nas quais o servidor está inscrito' })
  @ApiBearerAuth()
  @UseGuards(JwtAtGuard)
  @Get('my-paths')
  async findMyLearningPaths(@Request() req: any) {
    return this.learningPathsService.findMyLearningPaths(req.user.sub);
  }

  @ApiOperation({ summary: 'Listar todas as trilhas para Gestão (com filtro por criador)' })
  @ApiBearerAuth()
  @UseGuards(JwtAtGuard, RolesGuard)
  @Roles(Role.ADMIN_RH_CETI, Role.GESTOR_SECRETARIA)
  @Get('admin/all')
  async getAdminLearningPaths(@Request() req: any) {
    return this.learningPathsService.getAdminLearningPaths(req.user?.sub, req.user?.role);
  }

  @ApiOperation({ summary: 'Obter detalhes de uma trilha de aprendizagem' })
  @ApiBearerAuth()
  @UseGuards(JwtAtGuard)
  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req: any) {
    return this.learningPathsService.findOne(id, req.user?.sub);
  }

  @ApiOperation({ summary: 'Listar servidores inscritos em uma trilha de aprendizagem' })
  @ApiBearerAuth()
  @UseGuards(JwtAtGuard, RolesGuard)
  @Roles(Role.ADMIN_RH_CETI, Role.GESTOR_SECRETARIA)
  @Get(':id/inscritos')
  async getEnrollments(@Param('id') id: string) {
    return this.learningPathsService.getLearningPathEnrollments(id);
  }

  @ApiOperation({ summary: 'Inscrever servidor em uma trilha de aprendizagem' })
  @ApiBearerAuth()
  @UseGuards(JwtAtGuard)
  @Post(':id/enroll')
  async enroll(@Param('id') id: string, @Request() req: any) {
    return this.learningPathsService.enroll(id, req.user.sub);
  }

  @ApiOperation({ summary: 'Criar uma nova trilha de aprendizagem' })
  @ApiBearerAuth()
  @UseGuards(JwtAtGuard, RolesGuard)
  @Roles(Role.ADMIN_RH_CETI, Role.GESTOR_SECRETARIA)
  @Post()
  async create(@Body() dto: CreateLearningPathDto, @Request() req: any) {
    return this.learningPathsService.create(dto, req.user?.sub);
  }

  @ApiOperation({ summary: 'Atualizar uma trilha de aprendizagem' })
  @ApiBearerAuth()
  @UseGuards(JwtAtGuard, RolesGuard)
  @Roles(Role.ADMIN_RH_CETI, Role.GESTOR_SECRETARIA)
  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateLearningPathDto, @Request() req: any) {
    return this.learningPathsService.update(id, dto, req.user?.sub, req.user?.role);
  }

  @ApiOperation({ summary: 'Remover (Soft Delete) uma trilha de aprendizagem' })
  @ApiBearerAuth()
  @UseGuards(JwtAtGuard, RolesGuard)
  @Roles(Role.ADMIN_RH_CETI, Role.GESTOR_SECRETARIA)
  @Delete(':id')
  async softDelete(@Param('id') id: string, @Request() req: any) {
    return this.learningPathsService.softDelete(id, req.user?.sub, req.user?.role);
  }

  @ApiOperation({ summary: 'Vincular cursos a uma trilha de aprendizagem' })
  @ApiBearerAuth()
  @UseGuards(JwtAtGuard, RolesGuard)
  @Roles(Role.ADMIN_RH_CETI, Role.GESTOR_SECRETARIA)
  @Patch(':id/courses')
  async linkCourses(@Param('id') id: string, @Body() dto: LinkCoursesDto, @Request() req: any) {
    return this.learningPathsService.linkCourses(id, dto.courseIds, req.user?.sub, req.user?.role);
  }
}
