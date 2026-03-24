import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { instanceToPlain } from 'class-transformer';
import { map } from 'rxjs';

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler) {
    const response = context.switchToHttp().getResponse();
    const statusCode = response.statusCode;

    return next.handle().pipe(
      map((res) => {
        if (res && res.data && res.meta) {
          return {
            statusCode,
            message: res.message || 'Suscess',
            data: instanceToPlain(res.data),
            meta: res.meta,
          };
        }
        if (
          res &&
          res.data &&
          (res.total !== undefined || res.totalPages !== undefined)
        ) {
          return {
            statusCode,
            message: res.message || 'Suscess',
            data: instanceToPlain(res.data),
            meta: {
              total: res.total,
              totalPages: res.totalPages,
              page: res.page,
            },
          };
        }

        // 3. Trường hợp trả về data thông thường
        return {
          statusCode,
          message: res?.message || 'Suscess',
          data: instanceToPlain(res?.data !== undefined ? res.data : res),
        };
      }),
    );
  }
}
