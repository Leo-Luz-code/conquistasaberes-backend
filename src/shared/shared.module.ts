import { DatabaseModule } from '../plugins/database/database.module';
import { PaginateService } from './services/paginate.service';
import { LoggingService } from './services/logging.service';
import { Global, Logger, Module } from '@nestjs/common';

@Global()
@Module({
  providers: [Logger, LoggingService, PaginateService],
  exports: [LoggingService, PaginateService],
  imports: [DatabaseModule],
})
export class SharedModule {}
