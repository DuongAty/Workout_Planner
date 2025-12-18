import { Logger } from '@nestjs/common';

export class AppLogger {
  private static logger = new Logger('AppLog');
  static verbose(message: string, data?: any, context?: string) {
    const formattedData = data ? ` | Data: ${JSON.stringify(data)}` : '';
    this.logger.verbose(`${message}${formattedData} in ${context}`);
  }
  static warn(message: string, data?: any, context?: string) {
    const formattedData = data ? ` | Data: ${JSON.stringify(data)}` : '';
    this.logger.warn(`${message}${formattedData} in ${context}`);
  }
}
