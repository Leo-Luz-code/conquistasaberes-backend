import { Module } from '@nestjs/common';
import { EixosController } from './eixos.controller';
import { EixosService } from './eixos.service';

@Module({
  controllers: [EixosController],
  providers: [EixosService],
  exports: [EixosService],
})
export class EixosModule {}
