import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { instanceToPlain } from 'class-transformer';
import { map } from 'rxjs/operators';

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler) {
    const response = context.switchToHttp().getResponse();
    const statusCode = response.statusCode;

    return next.handle().pipe(
      map((res) => {
        if (
          res &&
          res.data &&
          (res.total !== undefined || res.totalPages !== undefined)
        ) {
          return {
            statusCode,
            message: res.message || 'Suscess',
            data: instanceToPlain(res.data !== undefined ? res.data : res),
            meta: {
              total: res.total,
              totalPages: res.totalPages,
              page: res.page,
            },
          };
        }
        return {
          statusCode,
          message: res?.message || 'Suscess',
          data: res?.data !== undefined ? res.data : res,
        };
      }),
    );
  }
}
