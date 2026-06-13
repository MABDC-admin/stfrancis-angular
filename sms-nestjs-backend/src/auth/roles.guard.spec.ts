import { ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from './roles.guard';
import { ROLES_KEY } from './roles.decorator';

function contextWithUser(role?: string): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({ user: role ? { role } : undefined }),
    }),
    getHandler: () => contextWithUser,
    getClass: () => class TestController {},
  } as unknown as ExecutionContext;
}

describe('RolesGuard', () => {
  it('allows a request when no route roles are required', () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(undefined),
    } as unknown as Reflector;

    expect(
      new RolesGuard(reflector).canActivate(contextWithUser('FINANCE')),
    ).toBe(true);
  });

  it('allows admins to access routes for any role', () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(['REGISTRAR']),
    } as unknown as Reflector;

    expect(
      new RolesGuard(reflector).canActivate(contextWithUser('ADMIN')),
    ).toBe(true);
  });

  it('blocks authenticated users without the required role', () => {
    const reflector = {
      getAllAndOverride: jest.fn().mockReturnValue(['REGISTRAR']),
    } as unknown as Reflector;

    expect(
      new RolesGuard(reflector).canActivate(contextWithUser('FINANCE')),
    ).toBe(false);
  });

  it('reads route role metadata from handler and class', () => {
    const getAllAndOverride = jest.fn().mockReturnValue(['ADMIN']);
    const reflector = {
      getAllAndOverride,
    } as unknown as Reflector;

    new RolesGuard(reflector).canActivate(contextWithUser('ADMIN'));

    expect(getAllAndOverride).toHaveBeenCalledWith(ROLES_KEY, [
      expect.any(Function),
      expect.any(Function),
    ]);
  });
});
