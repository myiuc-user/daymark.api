import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const startTime = Date.now();
    const userId = request.user?.id || 'anonymous';
    const ip = request.ip || request.connection.remoteAddress;

    return next.handle().pipe(
      tap(() => {
        const duration = Date.now() - startTime;
        const statusCode = context.switchToHttp().getResponse().statusCode;
        const statusColor = statusCode >= 400 ? '🔴' : statusCode >= 300 ? '🟡' : '🟢';
        console.log(
          `[${new Date().toLocaleTimeString()}] ${statusColor} ${request.method.padEnd(6)} ${request.path} | ${statusCode} (${duration}ms)`
        );
      })
    );
  }
}
