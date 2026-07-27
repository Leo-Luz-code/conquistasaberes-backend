<<<<<<< HEAD
import { Controller, Get, Post, Param, Query, UseGuards, Request, Body, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { CoursesService } from './courses.service';
import { JwtAtGuard } from '../../common/guards';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';
=======
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
} from './dto';
>>>>>>> main

@ApiTags('Catálogo de Cursos & AVA')
@Controller('courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) { }

<<<<<<< HEAD
  @ApiOperation({
    summary: 'Listar cursos disponíveis com filtros por busca, secretaria e categoria',
  })
  @ApiBearerAuth()
=======
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
>>>>>>> main
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'secretariaId', required: false, type: String })
  @ApiQuery({ name: 'categoria', required: false, type: String })
  @UseGuards(JwtAtGuard)
  @Get()
  async findAll(
    @Query('search') search?: string,
    @Query('secretariaId') secretariaId?: string,
    @Query('categoria') categoria?: string,
    @CurrentUser() user?: { sub?: string; id?: string },
  ) {
    const userId = user?.sub ?? user?.id;

    return this.coursesService.findAll(
      search,
      secretariaId,
      categoria,
      userId,
    );
  }

<<<<<<< HEAD
  @Get('my-courses')
=======
  @ApiOperation({ summary: 'Listar todos os cursos (Visão de Gestão/Admin)' })
  @ApiBearerAuth()
  @UseGuards(JwtAtGuard, RolesGuard)
  @Roles(Role.ADMIN_RH_CETI, Role.GESTOR_SECRETARIA)
  @Get('admin/all')
  async findAllAdmin() {
    return this.coursesService.findAllAdmin();
  }

  @ApiOperation({ summary: 'Listar secretarias municipais' })
  @Get('secretarias')
  async getSecretarias() {
    return this.coursesService.getSecretarias();
  }

  @ApiOperation({ summary: 'Detalhes completos do curso e plano de aulas com status do servidor' })
>>>>>>> main
  @ApiBearerAuth()
  @UseGuards(JwtAtGuard)
  async getMyCourses(@Request() req: any) {
    const userId = req.user?.sub ?? req.user?.id;
    return this.coursesService.getMyCourses(userId);
  }

  @ApiOperation({ summary: 'Listar avaliações de um curso' })
  @ApiBearerAuth()
  @UseGuards(JwtAtGuard)
  @Get(':id/ratings')
  async getCourseRatings(@Param('id') courseId: string) {
    return this.coursesService.getCourseRatings(courseId);
  }
  
  @ApiOperation({ summary: 'Detalhes completos do curso e plano de aulas com status do servidor' })
  @Get(':id')
  @ApiBearerAuth()
  @UseGuards(JwtAtGuard)
  async findOne(@Param('id') id: string, @Request() req: any) {
    return this.coursesService.findOne(id, req.user?.sub ?? req.user?.id);
  }

  @ApiOperation({ summary: 'Inscrever-se no curso' })
  @ApiBearerAuth()
  @UseGuards(JwtAtGuard)
  @Post(':id/enroll')
  async enroll(@Param('id') id: string, @Request() req: any) {
    console.log('JWT recebido:', req.user);

    const userId = req.user?.sub ?? req.user?.id;
    return this.coursesService.enroll(id, userId);
  }

  @ApiOperation({ summary: 'Concluir aula' })
  @ApiBearerAuth()
  @UseGuards(JwtAtGuard)
  @Post('lessons/:lessonId/complete')
  async completeLesson(@Param('lessonId') lessonId: string, @Request() req: any) {
    const userId = req.user?.sub ?? req.user?.id;
    return this.coursesService.completeLesson(lessonId, userId);
  }

  @ApiOperation({ summary: 'Avaliar e deixar feedback sobre o curso' })
  @ApiBearerAuth()
  @UseGuards(JwtAtGuard)
  @Post(':id/rate')
  async rateCourse(
    @Param('id') courseId: string,
    @Request() req: any,
    @Body() dto: { rating: number; comment?: string },
  ) {
    const userId = req.user.sub || req.user.id;
    return this.coursesService.rateCourse(userId, courseId, dto);
  }

  // =========================================================================
  // ENDPOINTS ADMINISTRATIVOS (CRIAÇÃO E EDIÇÃO DE CONTEÚDO)
  // =========================================================================

  @ApiOperation({ summary: 'Criar novo curso' })
  @ApiBearerAuth()
  @UseGuards(JwtAtGuard, RolesGuard)
  @Roles(Role.ADMIN_RH_CETI, Role.GESTOR_SECRETARIA)
  @Post()
  async createCourse(@Body() dto: CreateCourseDto) {
    return this.coursesService.createCourse(dto);
  }

  @ApiOperation({ summary: 'Atualizar curso existente' })
  @ApiBearerAuth()
  @UseGuards(JwtAtGuard, RolesGuard)
  @Roles(Role.ADMIN_RH_CETI, Role.GESTOR_SECRETARIA)
  @Put(':id')
  async updateCourse(@Param('id') id: string, @Body() dto: UpdateCourseDto) {
    return this.coursesService.updateCourse(id, dto);
  }

  @ApiOperation({ summary: 'Remover curso (Soft Delete)' })
  @ApiBearerAuth()
  @UseGuards(JwtAtGuard, RolesGuard)
  @Roles(Role.ADMIN_RH_CETI, Role.GESTOR_SECRETARIA)
  @Delete(':id')
  async deleteCourse(@Param('id') id: string) {
    return this.coursesService.deleteCourse(id);
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
}

