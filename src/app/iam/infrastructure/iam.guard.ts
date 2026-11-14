import { inject } from '@angular/core';
import { CanActivateChildFn, CanActivateFn, Router } from '@angular/router';
import { IamStore } from '../application/iam.store';
import {UserRole} from '../domain/model/value-objects/user-role';

/**
 * Checks session validity and the active role required by a route.
 * The backend must enforce authentication and authorization.
 */
export const iamGuard: CanActivateFn & CanActivateChildFn = (route, state) => {
  const store = inject(IamStore);
  const router = inject(Router);

  store.checkSessionExpiration();

  const user = store.activeUser();

  if (!user) {
    return router.createUrlTree(['/sign-in'], {
      queryParams: {
        returnUrl: state.url,
      },
    });
  }

  const allowedRoles = route.data['roles'] as readonly UserRole[] | undefined;

  if (allowedRoles && !allowedRoles.includes(user.experience)) {
    return router.parseUrl(user.initialRoute);
  }

  return true;
};
