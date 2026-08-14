import { Module } from '@nestjs/common';
import { TalentosController } from './talentos.controller';
import { TalentosService } from './talentos.service';

@Module({
  controllers: [TalentosController],
  providers: [TalentosService],
  exports: [TalentosService],
})
export class TalentosModule {}