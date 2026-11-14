import { inject } from '@angular/core';
import { CanActivateChildFn, Router } from '@angular/router';
import { IamStore } from '../../iam/application/iam.store';
import { homeRouteFor, roleCanOpen } from './navigation-config';

/**
 * Keeps every visitor inside the pages their own menu leads to.
 *
 * @remarks
 * A role that opens a page of another segment is returned to its own start
 * page instead of being shown a view built for somebody else, so the side menu
 * always marks where the visitor is. Signing in is the responsibility of
 * `iamGuard`, which runs first.
 */
export const roleGuard: CanActivateChildFn = (_route, state) => {
  const user = inject(IamStore).activeUser();
  if (!user || roleCanOpen(user.experience, state.url)) return true;

  return inject(Router).createUrlTree([homeRouteFor(user.experience)]);
};
