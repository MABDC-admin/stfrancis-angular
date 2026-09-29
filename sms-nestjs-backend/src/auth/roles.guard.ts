import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from './public.decorator';
import { ROLES_KEY } from './roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const roles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!roles?.length) {
      return true;
    }

    const user = context
      .switchToHttp()
      .getRequest<{ user?: { role?: string } }>().user;
    const normalizedRoles = roles.map((role) => (role || '').toUpperCase().trim());
    const userRole = user?.role?.toUpperCase().trim();

    if (userRole === 'ADMIN') {
      return true;
    }

    return !!userRole && normalizedRoles.includes(userRole);
  }
}
