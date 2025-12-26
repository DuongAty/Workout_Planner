import { Injectable, Logger, LoggerService } from '@nestjs/common';

@Injectable()
export class AppLogger implements LoggerService {
  private readonly logger = new Logger();

  verbose(message: string, data?: unknown, context?: string) {
    this.logger.verbose(
      this.formatMessage(message, data),
      context ?? 'AppLogger',
    );
  }

  warn(message: string, data?: unknown, context?: string) {
    this.logger.warn(this.formatMessage(message, data), context ?? 'AppLogger');
  }

  log(message: string, context?: string) {
    this.logger.log(message, context ?? 'AppLogger');
  }

  error(message: string, trace?: string, context?: string) {
    this.logger.error(message, trace, context ?? 'AppLogger');
  }

  private formatMessage(message: string, data?: unknown): string {
    if (!data) return message;

    try {
      return `${message} | Data: ${JSON.stringify(data)}`;
    } catch {
      return `${message} | Data: [Unserializable]`;
    }
  }
}
