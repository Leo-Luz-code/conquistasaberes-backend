import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { GamificationService } from './gamification.service';
import { JwtAtGuard, RolesGuard } from '../../common/guards';
import { Roles } from '../../common/decorators';
import { Role } from '@prisma/client';
import { CreateBadgeDto, UpdateBadgeDto } from './dto';

@ApiTags('Gamificação & Ranking')
@Controller('gamification')
export class GamificationController {
  constructor(private readonly gamificationService: GamificationService) {}

  @ApiOperation({ summary: 'Listar todas as medalhas e conquistas (Badges)' })
  @Get('badges')
  async findAllBadges() {
    return this.gamificationService.findAllBadges();
  }

  @ApiOperation({ summary: 'Criar nova medalha/conquista (Badge)' })
  @ApiBearerAuth()
  @UseGuards(JwtAtGuard, RolesGuard)
  @Roles(Role.ADMIN_RH_CETI)
  @Post('badges')
  async createBadge(@Body() dto: CreateBadgeDto) {
    return this.gamificationService.createBadge(dto);
  }

  @ApiOperation({ summary: 'Atualizar medalha/conquista (Badge)' })
  @ApiBearerAuth()
  @UseGuards(JwtAtGuard, RolesGuard)
  @Roles(Role.ADMIN_RH_CETI)
  @Put('badges/:id')
  async updateBadge(@Param('id') id: string, @Body() dto: UpdateBadgeDto) {
    return this.gamificationService.updateBadge(id, dto);
  }

  @ApiOperation({ summary: 'Remover medalha/conquista (Soft Delete)' })
  @ApiBearerAuth()
  @UseGuards(JwtAtGuard, RolesGuard)
  @Roles(Role.ADMIN_RH_CETI)
  @Delete('badges/:id')
  async deleteBadge(@Param('id') id: string) {
    return this.gamificationService.deleteBadge(id);
  }

  @ApiOperation({ summary: 'Obter XP, Nível e conquistas do servidor autenticado' })
  @ApiBearerAuth()
  @UseGuards(JwtAtGuard)
  @Get('my-status')
  async getMyStatus(@Request() req: any) {
    return this.gamificationService.getUserGamification(req.user.sub);
  }

  @ApiOperation({ summary: 'Ranking individual e intersecretarial por pontuação de XP' })
  @Get('leaderboard')
  async getLeaderboard() {
    return this.gamificationService.getLeaderboard();
  }
}
