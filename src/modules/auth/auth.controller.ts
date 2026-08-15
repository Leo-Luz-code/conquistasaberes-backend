import { Controller, Post, Body, Get, UseGuards, Request, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { AutenticaUsuarioDto } from './dto/autentica-usuario.dto';
import { JwtAtGuard } from '../../common/guards';

@ApiTags('Autenticação SSO')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @ApiOperation({ summary: 'Login unificado SSO por CPF, Matrícula ou E-mail' })
  @ApiResponse({ status: 200, description: 'Autenticação realizada com sucesso.' })
  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(@Body() dto: AutenticaUsuarioDto) {
    return this.authService.validateAndLogin(dto);
  }

  @ApiOperation({ summary: 'Perfil do servidor autenticado' })
  @ApiBearerAuth()
  @UseGuards(JwtAtGuard)
  @Get('profile')
  async getProfile(@Request() req: any) {
    return this.authService.getProfile(req.user.sub);
  }

  @ApiOperation({ summary: 'Aceite do termo de consentimento LGPD' })
  @ApiBearerAuth()
  @UseGuards(JwtAtGuard)
  @Post('accept-lgpd')
  async acceptLgpd(@Request() req: any) {
    return this.authService.acceptLgpd(req.user.sub);
  }

  @ApiOperation({ summary: 'Obter informações do servidor e IP local dinâmico' })
  @Get('server-info')
  getServerInfo(@Request() req: any) {
    const { getLocalIpAddress } = require('../../common/utils/network.util');
    const localIp = getLocalIpAddress();
    const protocol = req.headers['x-forwarded-proto'] || req.protocol || 'http';
    const host = req.get('host') || `${localIp}:3001`;
    return {
      localIp,
      backendUrl: `${protocol}://${host}`,
      frontendPort: 8080,
    };
  }

  @ApiOperation({ summary: 'Estatísticas públicas para a tela inicial / login (sem autenticação)' })
  @Get('public-stats')
  async getPublicStats() {
    return this.authService.getPublicStats();
  }
}
