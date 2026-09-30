import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { Role } from './models';

export const authGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  return auth.isLoggedIn() ? true : inject(Router).parseUrl('/login');
};

/** Usage: { canActivate: [roleGuard], data: { roles: ['ADMIN'] } } */
export const roleGuard: CanActivateFn = route => {
  const auth = inject(AuthService);
  const roles = route.data['roles'] as Role[] | undefined;
  return !roles || auth.hasRole(...roles) ? true : inject(Router).parseUrl(auth.homeRoute());
};
