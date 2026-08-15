import { Controller, Get, Param, Query, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TalentosService } from './talentos.service';
import { BuscaTalentosDto } from './dto/busca-talentos.dto';
import { JwtAtGuard } from '../../common/guards';

@ApiTags('Talentos')
@Controller('talentos')
export class TalentosController {
  constructor(private readonly talentosService: TalentosService) {}

  @ApiOperation({ summary: 'Buscar servidores em destaque por XP, badges, certificados e área' })
  @ApiBearerAuth()
  @UseGuards(JwtAtGuard)
  @Get()
  async buscarTalentos(@Query() filtros: BuscaTalentosDto) {
    return this.talentosService.buscarTalentos(filtros);
  }

  @ApiOperation({ summary: 'Obter perfil de destaque detalhado de um servidor' })
  @ApiBearerAuth()
  @UseGuards(JwtAtGuard)
  @Get(':userId')
  async getPerfilTalento(@Param('userId') userId: string) {
    return this.talentosService.getPerfilTalento(userId);
  }
}