import { inject } from '@angular/core';
import { CanActivateChildFn, CanActivateFn, Router } from '@angular/router';
import { IamStore } from '../application/iam.store';
import { UserRole } from '../domain/model/user-role';

/**
 * Blocks protected routes when no authenticated IAM session exists.
 *
 * @remarks
 * A route may also list the roles allowed to open it in `data.roles`; other
 * roles are sent to their own start page. The platform still checks every
 * request on its side.
 */
export const iamGuard: CanActivateFn & CanActivateChildFn = (route, state) => {
  const store = inject(IamStore);
  const router = inject(Router);
  store.checkSessionExpiration();
  const user = store.activeUser();
  if (!user) return router.createUrlTree(['/iam/sign-in'], { queryParams: { returnUrl: state.url } });
  const allowedRoles = route.data['roles'] as readonly UserRole[] | undefined;
  if (allowedRoles && !allowedRoles.includes(user.experience)) {
    return router.parseUrl(user.initialRoute);
  }
  return true;
};
