import { Controller, Get, Post, Param, Query, UseGuards, Request, Body, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { CoursesService } from './courses.service';
import { JwtAtGuard } from '../../common/guards';
import { CurrentUser } from 'src/common/decorators/current-user.decorator';

@ApiTags('Catálogo de Cursos & AVA')
@Controller('courses')
export class CoursesController {
  constructor(private readonly coursesService: CoursesService) { }

  @ApiOperation({
    summary: 'Listar cursos disponíveis com filtros por busca, secretaria e categoria',
  })
  @ApiBearerAuth()
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

  @Get('my-courses')
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
}
