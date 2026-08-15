import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SkillsService } from './skills.service';
import { JwtAtGuard } from '../../common/guards'; // Ajuste o caminho do seu guard conforme o projeto

@ApiTags('Skills')
@Controller('skills')
export class SkillsController {
  constructor(private readonly skillsService: SkillsService) {}

  @ApiOperation({ summary: 'Listar todas as habilidades cadastradas' })
  @ApiBearerAuth()
  @UseGuards(JwtAtGuard)
  @Get()
  async findAll() {
    return this.skillsService.findAll();
  }
}