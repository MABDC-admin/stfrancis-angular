import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { dashboardPathForRole } from './role-redirect.util';

export const roleGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  
  const expectedRoles = (route.data['roles'] as Array<string> | undefined)?.map((role) =>
    (role || '').toUpperCase(),
  );
  const userRole = auth.getUserRole()?.toUpperCase();

  if (!userRole) {
    router.navigate(['/auth/login']);
    return false;
  }

  if (expectedRoles && !expectedRoles.includes(userRole) && userRole !== 'ADMIN') {
    router.navigate([dashboardPathForRole(userRole)]);
    return false;
  }

  return true;
};
