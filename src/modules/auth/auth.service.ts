import { Injectable, Logger, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../../plugins/database/services/prisma.service';
import { AutenticaUsuarioDto } from './dto/autentica-usuario.dto';
import { JwtPayload } from '../../common/types';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async validateAndLogin(dto: AutenticaUsuarioDto) {
    const { identifier, senha } = dto;
    const cleanId = identifier.replace(/\D/g, '');

    // Buscar usuário por CPF, matricula ou email
    const user = await this.prisma.user.findFirst({
      where: {
        deletedAt: null,
        OR: [
          { cpf: cleanId.length === 11 ? cleanId : identifier },
          { matricula: identifier },
          { email: identifier },
        ],
      },
      include: {
        secretaria: true,
      },
    });

    if (!user) {
      this.logger.warn(`Tentativa de login com identificador inválido: ${identifier}`);
      throw new UnauthorizedException('CPF, Matrícula ou senha incorretos.');
    }

    const passwordMatches = await bcrypt.compare(senha, user.passwordHash);
    if (!passwordMatches) {
      this.logger.warn(`Senha incorreta para o usuário: ${user.cpf}`);
      throw new UnauthorizedException('CPF, Matrícula ou senha incorretos.');
    }

    // Gerar token JWT
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
      secretariaId: user.secretariaId,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('ACCESS_TOKEN_SECRET') || 'secret_key_pmvc_2026',
      expiresIn: this.configService.get<string>('ACCESS_TOKEN_EXPIRATION') || '24h',
    });

    // Registrar log de auditoria
    await this.prisma.auditLog.create({
      data: {
        userId: user.id,
        acao: 'LOGIN',
        detalhes: `Login realizado com sucesso via SSO por ${user.cpf}`,
      },
    });

    return {
      accessToken,
      user: {
        id: user.id,
        cpf: user.cpf,
        matricula: user.matricula,
        nome: user.nome,
        email: user.email,
        role: user.role,
        cargo: user.cargo,
        secretaria: user.secretaria,
        xpPoints: user.xpPoints,
        level: user.level,
        lgpdAccepted: user.lgpdAccepted,
        lgpdAcceptedAt: user.lgpdAcceptedAt,
      },
    };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      include: {
        secretaria: true,
        userBadges: {
          include: { badge: true },
        },
        certificates: {
          include: { course: true },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    return {
      id: user.id,
      cpf: user.cpf,
      matricula: user.matricula,
      nome: user.nome,
      email: user.email,
      role: user.role,
      cargo: user.cargo,
      secretaria: user.secretaria,
      xpPoints: user.xpPoints,
      level: user.level,
      lgpdAccepted: user.lgpdAccepted,
      lgpdAcceptedAt: user.lgpdAcceptedAt,
      badges: user.userBadges.map((ub) => ({
        ...ub.badge,
        earnedAt: ub.earnedAt,
      })),
      certificates: user.certificates.map((c) => ({
        id: c.id,
        codigoValidacao: c.codigoValidacao,
        courseTitle: c.course.titulo,
        issuedAt: c.issuedAt,
        status: c.status,
      })),
    };
  }

  async acceptLgpd(userId: string) {
    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        lgpdAccepted: true,
        lgpdAcceptedAt: new Date(),
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId,
        acao: 'ACEITE_LGPD',
        detalhes: 'Aceite dos termos de privacidade e proteção de dados LGPD da PMVC.',
      },
    });

    return {
      message: 'Termo LGPD aceito com sucesso.',
      lgpdAccepted: updatedUser.lgpdAccepted,
      lgpdAcceptedAt: updatedUser.lgpdAcceptedAt,
    };
  }

  async getPublicStats() {
    const [totalCursos, totalTrilhas] = await Promise.all([
      this.prisma.course.count({
        where: { isPublished: true, deletedAt: null },
      }),
      this.prisma.learningPath.count({
        where: { deletedAt: null },
      }),
    ]);

    return {
      totalCursos,
      totalTrilhas,
      cursosLabel: totalCursos > 0 ? (totalCursos >= 50 ? `+${totalCursos}` : `${totalCursos}`) : '+50',
      trilhasLabel: totalTrilhas > 0 ? `${totalTrilhas}` : '12',
      modalidadeLabel: '100%',
    };
  }
}
