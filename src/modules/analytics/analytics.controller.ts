import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AnalyticsService } from './analytics.service';
import { JwtAtGuard, RolesGuard } from '../../common/guards';
import { Roles } from '../../common/decorators';
import { Role } from '@prisma/client';

@ApiTags('Analytics & Painel de Gestão')
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @ApiOperation({ summary: 'Painel executivo com métricas agregadas por secretaria e competências' })
  @ApiBearerAuth()
  @UseGuards(JwtAtGuard, RolesGuard)
  @Roles(Role.GESTOR_SECRETARIA, Role.ADMIN_RH_CETI)
  @Get('dashboard')
  async getDashboard(@Query('secretariaId') secretariaId?: string) {
    return this.analyticsService.getExecutiveDashboard(secretariaId);
  }

  @ApiOperation({ summary: 'Resumo de indicadores para a página de Administração' })
  @ApiBearerAuth()
  @UseGuards(JwtAtGuard, RolesGuard)
  @Roles(Role.ADMIN_RH_CETI, Role.GESTOR_SECRETARIA)
  @Get('admin-summary')
  async getAdminSummary() {
    return this.analyticsService.getAdminSummary();
  }
}
