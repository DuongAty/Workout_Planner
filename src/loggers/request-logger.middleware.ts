import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { AppLogger } from './app-logger.service';
import * as jwt from 'jsonwebtoken';

@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  constructor(private readonly logger: AppLogger) {}

  use(req: Request, res: Response, next: NextFunction) {
    let userId = 'anonymous';
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const decoded: any = jwt.decode(token);
        userId = decoded?.sub || 'anonymous';
      } catch (err) {}
    }
    const message = `${req.method} ${req.originalUrl} - user:${userId}`;
    this.logger.log(message, RequestLoggerMiddleware.name);
    next();
  }
}
