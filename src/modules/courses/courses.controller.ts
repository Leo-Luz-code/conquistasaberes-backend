import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards, Request, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery, ApiBody, ApiConsumes } from '@nestjs/swagger';
import { CoursesService } from './courses.service';
import { JwtAtGuard, RolesGuard } from '../../common/guards';
import { Roles } from '../../common/decorators';
import { Role } from '@prisma/client';
import {
  CreateCourseDto,
  UpdateCourseDto,
  CreateModuleDto,
  UpdateModuleDto,
  CreateLessonDto,
  UpdateLessonDto,
  CheckinLessonDto,
} from './dto';

@ApiTags('Catálogo de Cursos & AVA')
@Controller('courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) {}

  @ApiOperation({ summary: 'Fazer upload de arquivo (PDF ou Capa do Curso)' })
  @ApiBearerAuth()
  @UseGuards(JwtAtGuard, RolesGuard)
  @Roles(Role.ADMIN_RH_CETI, Role.GESTOR_SECRETARIA)
  @Post('upload')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: (req, file, cb) => {
          const uploadPath = './uploads';
          if (!existsSync(uploadPath)) {
            mkdirSync(uploadPath, { recursive: true });
          }
          cb(null, uploadPath);
        },
        filename: (req, file, cb) => {
          const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
          const ext = extname(file.originalname);
          cb(null, `${uniqueSuffix}${ext}`);
        },
      }),
    }),
  )
  uploadFile(@UploadedFile() file: any) {
    if (!file) {
      return { url: null };
    }
    return {
      url: `/uploads/${file.filename}`,
      originalname: file.originalname,
      size: file.size,
    };
  }


  @ApiOperation({ summary: 'Listar cursos disponíveis com filtros por busca, secretaria e categoria' })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'secretariaId', required: false, type: String })
  @ApiQuery({ name: 'categoria', required: false, type: String })
  @Get()
  async findAll(
    @Query('search') search?: string,
    @Query('secretariaId') secretariaId?: string,
    @Query('categoria') categoria?: string,
  ) {
    return this.coursesService.findAll(search, secretariaId, categoria);
  }

  @ApiOperation({ summary: 'Listar todos os cursos (Visão de Gestão/Admin)' })
  @ApiBearerAuth()
  @UseGuards(JwtAtGuard, RolesGuard)
  @Roles(Role.ADMIN_RH_CETI, Role.GESTOR_SECRETARIA)
  @Get('admin/all')
  async findAllAdmin(@Request() req: any) {
    return this.coursesService.findAllAdmin(req.user?.sub, req.user?.role);
  }

  @ApiOperation({ summary: 'Listar secretarias municipais' })
  @Get('secretarias')
  async getSecretarias() {
    return this.coursesService.getSecretarias();
  }

  // Dor #1 & #2: Cursos do servidor com progresso real (deve vir antes de :id)
  @ApiOperation({ summary: 'Listar cursos nos quais o servidor está matriculado (com progresso e status)' })
  @ApiQuery({ name: 'sync', required: false, type: Boolean })
  @ApiBearerAuth()
  @UseGuards(JwtAtGuard)
  @Get('my-courses')
  async findMyCourses(@Request() req: any, @Query('sync') sync?: string) {
    return this.coursesService.findMyCourses(req.user.sub, sync === 'true');
  }

  @ApiOperation({ summary: 'Detalhes completos do curso e plano de aulas com status do servidor' })
  @ApiBearerAuth()
  @UseGuards(JwtAtGuard)
  @Get(':id')
  async findOne(@Param('id') id: string, @Request() req: any) {
    return this.coursesService.findOne(id, req.user?.sub);
  }

  @ApiOperation({ summary: 'Inscrever-se no curso' })
  @ApiBearerAuth()
  @UseGuards(JwtAtGuard)
  @Post(':id/enroll')
  async enroll(@Param('id') id: string, @Request() req: any) {
    return this.coursesService.enroll(id, req.user.sub);
  }

  @ApiOperation({ summary: 'Concluir aula, computar XP, progresso e verificar prêmios/certificados' })
  @ApiBearerAuth()
  @UseGuards(JwtAtGuard)
  @Post('lessons/:lessonId/complete')
  async completeLesson(@Param('lessonId') lessonId: string, @Request() req: any) {
    return this.coursesService.completeLesson(lessonId, req.user.sub);
  }

  // =========================================================================
  // ENDPOINTS ADMINISTRATIVOS (CRIAÇÃO E EDIÇÃO DE CONTEÚDO)
  // =========================================================================

  @ApiOperation({ summary: 'Criar novo curso' })
  @ApiBearerAuth()
  @UseGuards(JwtAtGuard, RolesGuard)
  @Roles(Role.ADMIN_RH_CETI, Role.GESTOR_SECRETARIA)
  @Post()
  async createCourse(@Body() dto: CreateCourseDto, @Request() req: any) {
    return this.coursesService.createCourse(dto, req.user?.sub);
  }

  @ApiOperation({ summary: 'Atualizar curso existente' })
  @ApiBearerAuth()
  @UseGuards(JwtAtGuard, RolesGuard)
  @Roles(Role.ADMIN_RH_CETI, Role.GESTOR_SECRETARIA)
  @Put(':id')
  async updateCourse(@Param('id') id: string, @Body() dto: UpdateCourseDto, @Request() req: any) {
    return this.coursesService.updateCourse(id, dto, req.user?.sub, req.user?.role);
  }

  @ApiOperation({ summary: 'Remover curso (Soft Delete)' })
  @ApiBearerAuth()
  @UseGuards(JwtAtGuard, RolesGuard)
  @Roles(Role.ADMIN_RH_CETI, Role.GESTOR_SECRETARIA)
  @Delete(':id')
  async deleteCourse(@Param('id') id: string, @Request() req: any) {
    return this.coursesService.deleteCourse(id, req.user?.sub, req.user?.role);
  }

  @ApiOperation({ summary: 'Criar módulo no curso' })
  @ApiBearerAuth()
  @UseGuards(JwtAtGuard, RolesGuard)
  @Roles(Role.ADMIN_RH_CETI, Role.GESTOR_SECRETARIA)
  @Post(':courseId/modules')
  async createModule(@Param('courseId') courseId: string, @Body() dto: CreateModuleDto) {
    return this.coursesService.createModule(courseId, dto);
  }

  @ApiOperation({ summary: 'Atualizar módulo' })
  @ApiBearerAuth()
  @UseGuards(JwtAtGuard, RolesGuard)
  @Roles(Role.ADMIN_RH_CETI, Role.GESTOR_SECRETARIA)
  @Put('modules/:moduleId')
  async updateModule(@Param('moduleId') moduleId: string, @Body() dto: UpdateModuleDto) {
    return this.coursesService.updateModule(moduleId, dto);
  }

  @ApiOperation({ summary: 'Remover módulo (Soft Delete)' })
  @ApiBearerAuth()
  @UseGuards(JwtAtGuard, RolesGuard)
  @Roles(Role.ADMIN_RH_CETI, Role.GESTOR_SECRETARIA)
  @Delete('modules/:moduleId')
  async deleteModule(@Param('moduleId') moduleId: string) {
    return this.coursesService.deleteModule(moduleId);
  }

  @ApiOperation({ summary: 'Criar aula no módulo' })
  @ApiBearerAuth()
  @UseGuards(JwtAtGuard, RolesGuard)
  @Roles(Role.ADMIN_RH_CETI, Role.GESTOR_SECRETARIA)
  @Post('modules/:moduleId/lessons')
  async createLesson(@Param('moduleId') moduleId: string, @Body() dto: CreateLessonDto) {
    return this.coursesService.createLesson(moduleId, dto);
  }

  @ApiOperation({ summary: 'Atualizar aula' })
  @ApiBearerAuth()
  @UseGuards(JwtAtGuard, RolesGuard)
  @Roles(Role.ADMIN_RH_CETI, Role.GESTOR_SECRETARIA)
  @Put('lessons/:lessonId')
  async updateLesson(@Param('lessonId') lessonId: string, @Body() dto: UpdateLessonDto) {
    return this.coursesService.updateLesson(lessonId, dto);
  }

  @ApiOperation({ summary: 'Remover aula (Soft Delete)' })
  @ApiBearerAuth()
  @UseGuards(JwtAtGuard, RolesGuard)
  @Roles(Role.ADMIN_RH_CETI, Role.GESTOR_SECRETARIA)
  @Delete('lessons/:lessonId')
  async deleteLesson(@Param('lessonId') lessonId: string) {
    return this.coursesService.deleteLesson(lessonId);
  }

  // =========================================================================
  // PRESENÇAS E CONTROLE DE MATRÍCULAS (CHECK-IN E GESTÃO)
  // =========================================================================

  @ApiOperation({ summary: 'Obter informações públicas da aula para página de check-in' })
  @Get('lessons/:lessonId/public-info')
  async getLessonPublicInfo(@Param('lessonId') lessonId: string) {
    return this.coursesService.getLessonPublicInfo(lessonId);
  }

  @ApiOperation({ summary: 'Confirmar presença do servidor em aula presencial via QR Code' })
  @Post('lessons/:lessonId/checkin')
  async checkinLesson(
    @Param('lessonId') lessonId: string,
    @Body() dto: CheckinLessonDto,
  ) {
    return this.coursesService.checkinLesson(lessonId, dto.matricula);
  }

  @ApiOperation({ summary: 'Listar presenças de uma aula presencial (Visão Admin/Gestor)' })
  @ApiBearerAuth()
  @UseGuards(JwtAtGuard, RolesGuard)
  @Roles(Role.ADMIN_RH_CETI, Role.GESTOR_SECRETARIA)
  @Get('lessons/:lessonId/attendances')
  async getLessonAttendances(@Param('lessonId') lessonId: string) {
    return this.coursesService.getLessonAttendances(lessonId);
  }

  @ApiOperation({ summary: 'Listar todos os servidores matriculados no curso (Visão Admin/Gestor)' })
  @ApiBearerAuth()
  @UseGuards(JwtAtGuard, RolesGuard)
  @Roles(Role.ADMIN_RH_CETI, Role.GESTOR_SECRETARIA)
  @Get(':id/enrollments')
  async getCourseEnrollments(@Param('id') courseId: string) {
    return this.coursesService.getCourseEnrollments(courseId);
  }
}


