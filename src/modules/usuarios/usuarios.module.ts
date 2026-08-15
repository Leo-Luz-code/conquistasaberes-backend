import { PaginateService } from '../../shared/services/paginate.service';
import { UsuariosController } from './usuarios.controller';
import { UsuariosService } from './usuarios.service';
import { PassportModule } from '@nestjs/passport';
import { Module } from '@nestjs/common';

@Module({
  exports: [UsuariosService],
  controllers: [UsuariosController],
  providers: [UsuariosService, PaginateService],
  imports: [PassportModule.register({ defaultStrategy: 'jwt' })],
})
export class UsuariosModule {}
