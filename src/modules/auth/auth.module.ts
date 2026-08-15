import {
  RefreshTokenStrategy,
  AccessTokenStrategy,
  LocalStrategy,
} from './strategies';
import { UsuariosModule } from '../usuarios/usuarios.module';
import { AuthController } from './auth.controller';
import { PassportModule } from '@nestjs/passport';
import { Logger, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { JwtModule } from '@nestjs/jwt';
import { LocalAuthGuard } from '../../common/guards';

@Module({
  imports: [
    UsuariosModule,
    PassportModule,
    JwtModule.registerAsync({
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('ACCESS_TOKEN_SECRET'),
        signOptions: {
          expiresIn: configService.get<string>('ACCESS_TOKEN_EXPIRATION'),
          algorithm: 'HS512', // Usando o algoritmo mais robusto HS512 para assinatura, fica a sua escolha o algoritmo
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [
    Logger,
    AuthService,
    LocalStrategy,
    LocalAuthGuard,
    AccessTokenStrategy,
    RefreshTokenStrategy,
  ],
})
export class AuthModule {}
