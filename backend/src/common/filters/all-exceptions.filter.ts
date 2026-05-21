import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    // Determine the HTTP status code
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    // Log the error internally (useful for debugging, hidden from user)
    this.logger.error(
      `[${request.method}] ${request.url} - Status: ${status}`,
      exception instanceof Error ? exception.stack : 'Unknown Error',
    );

    // Format the response sent to the client
    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      // If it's a known HTTP exception (like bad request/validation), return its message
      // Otherwise, return a generic message to prevent leaking DB schema or stack traces
      message:
        exception instanceof HttpException
          ? exception.getResponse()
          : 'Internal server error',
    };

    // If the response is an object (like validation errors array), extract the message properly
    if (typeof errorResponse.message === 'object' && errorResponse.message !== null) {
        errorResponse.message = (errorResponse.message as any).message || errorResponse.message;
    }

    response.status(status).json(errorResponse);
  }
}
