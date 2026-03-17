import * as winston from 'winston';
import 'winston-daily-rotate-file';

const { combine, timestamp, printf, colorize } = winston.format;
export const consoleFormat = printf((info) => {
  const { timestamp, level, message, context } = info;
  return `[${timestamp}] [${level}] [${context || 'App'}] ${message}`;
});

export const fileFormat = printf(
  ({ timestamp, level, message, context, data }) => {
    return JSON.stringify({
      context: context,
      level,
      message,
      data: data || {},
      timestamp,
    });
  },
);
export const winstonConfig: winston.LoggerOptions = {
  level: 'info',
  format: combine(timestamp({ format: 'YYYY-MM-DD HH:mm:ss' })),
  transports: [
    new winston.transports.Console({
      format: combine(
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        colorize({ all: true }),
        consoleFormat,
      ),
    }),
  ],
};
