import {
  ExecutionContext,
  NestInterceptor,
  CallHandler,
  Injectable,
} from '@nestjs/common';
import { LoggingService } from '../../shared/services/logging.service';
import { Request, Response } from 'express';
import { tap } from 'rxjs/operators';
import { Observable } from 'rxjs';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly loggingService: LoggingService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const response = context.switchToHttp().getResponse<Response>();

    return next.handle().pipe(
      tap(() => {
        const { method, path, ip } = request;
        const userPayload = (request as any).user;
        const userId = userPayload?.sub || userPayload?.id;

        if (userId) {
          this.loggingService.createLog({
            userId,
            acao: `${method} ${path}`,
            detalhes: `Ação ${context.getHandler().name} no controller ${context.getClass().name} - Status ${response.statusCode}`,
            ipAddress: ip,
          });
        }
      }),
    );
  }
}
