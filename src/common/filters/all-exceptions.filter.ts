import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let error = 'INTERNAL_SERVER_ERROR';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();
      message = (exceptionResponse as any).message || exception.message;
      error = (exceptionResponse as any).error || 'HTTP_EXCEPTION';
    } else if (exception instanceof Error) {
      message = exception.message;
      error = exception.constructor.name;
    }

    console.error(`[${new Date().toISOString()}] ${status} - ${error}: ${message}`);

    response.status(status).json({
      statusCode: status,
      error,
      message,
      timestamp: new Date().toISOString()
    });
  }
}
