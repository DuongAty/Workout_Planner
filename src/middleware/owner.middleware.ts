// src/common/guards/owner.guard.ts
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';

@Injectable()
export class OwnerMiddleware implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (!user) {
      throw new UnauthorizedException('User not authenticated');
    }
    const resourceId = request.params.id;
    if (!resourceId) return true;
    if (user.id !== resourceId) {
      throw new ForbiddenException(
        'You do not have permission to edit this information.',
      );
    }
    return true;
  }
}