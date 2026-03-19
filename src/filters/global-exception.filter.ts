// src/common/filters/global-exception.filter.ts
import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { QueryFailedError } from 'typeorm';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string = 'Server Error';
    let errorDetail = 'Internal Server Error';
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse: any = exception.getResponse();
      message = exceptionResponse.message || exception.message;
      errorDetail = exceptionResponse.error || exception.name;
    } else if (exception instanceof QueryFailedError) {
      status = HttpStatus.BAD_REQUEST;
      const driverError = exception.driverError;

      if (driverError && driverError.code === '23505') {
        message = 'The data already exists in the system.';
        errorDetail = 'Conflict';
      } else {
        message = 'Database query error.';
        errorDetail = driverError.detail || driverError.message;
      }
    }
    response.status(status).json({
      statusCode: status,
      message: message,
      errors: errorDetail,
    });
  }
}
