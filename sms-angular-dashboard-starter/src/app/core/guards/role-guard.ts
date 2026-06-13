import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const roleGuard: CanActivateFn = (route, state) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  
  const expectedRoles = route.data['roles'] as Array<string>;
  const userRole = auth.getUserRole();

  if (!userRole) {
    router.navigate(['/auth/login']);
    return false;
  }

  if (expectedRoles && !expectedRoles.includes(userRole) && userRole !== 'ADMIN') {
    // Redirect to dashboard if unauthorized but logged in
    router.navigate(['/registrar-finance/dashboard']);
    return false;
  }

  return true;
};
