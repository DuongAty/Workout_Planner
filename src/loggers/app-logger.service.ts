import { Injectable, LoggerService } from '@nestjs/common';
import * as winston from 'winston';
import { fileFormat, winstonConfig } from './winston.config';

@Injectable()
export class AppLogger implements LoggerService {
  private readonly logger: winston.Logger;
  private context?: string;

  constructor() {
    this.logger = winston.createLogger(winstonConfig);
    this.logger.add(this.createFileTransport('controller'));
    this.logger.add(this.createFileTransport('service'));
    this.logger.add(this.createFileTransport('middleware'));
  }

  private detectType(context?: string): string {
    if (!context) return 'general';
    if (context.includes('Controller')) return 'controller';
    if (context.includes('Service')) return 'service';
    if (context.includes('Middleware')) return 'middleware';
    return 'general';
  }

  private createFileTransport(type: string) {
    return new winston.transports.DailyRotateFile({
      level: 'info',
      filename: `logs/${type}/${type}-%DATE%.log`,
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d',
      auditFile: 'logs/.audit.json',
      format: winston.format.combine(
        winston.format((info) => {
          if (info.type === type) return info;
          return false;
        })(),
        winston.format.timestamp(),
        fileFormat,
      ),
    });
  }
  setContext(context: string) {
    this.context = context;
  }
  log(message: string, context?: string) {
    const type = this.detectType(context);
    this.logger.info(message, {
      context,
      type,
    });
  }

  logData(message: string, data?: unknown, context?: string) {
    const type = this.detectType(context);
    this.logger.info(message, {
      context,
      type,
      data,
    });
  }

  warn(message: string, data?: unknown, context?: string) {
    const type = this.detectType(context);
    this.logger.warn(message, {
      context,
      type,
      data,
    });
  }
  error(message: string, trace?: string, data?: unknown, context?: string) {
    const type = this.detectType(context);
    this.logger.error(message, {
      context,
      type,
      data,
      trace,
    });
  }
  middleware(message: string, data?: unknown, context?: string) {
    const type = this.detectType(context);
    this.logger.info(message, {
      context,
      type,
      data,
    });
  }
  verbose(message: string, data?: unknown, context?: string) {
    const type = this.detectType(context);
    this.logger.info(message, {
      context,
      type,
      data,
    });
  }
}
