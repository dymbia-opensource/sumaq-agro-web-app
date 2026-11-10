import { inject } from '@angular/core';
import { CanActivateChildFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { IamStore } from '../../iam/application/iam.store';
import { SubscriptionsApi } from '../infrastructure/subscriptions-api';

/** Checks the current subscription before entering the workspace. */
export const activeSubscriptionGuard: CanActivateChildFn = (_route, state) => {
  const iam = inject(IamStore);
  const router = inject(Router);
  const subscriptionsApi = inject(SubscriptionsApi);

  const signIn = () =>
    router.createUrlTree(['/iam/sign-in'], {
      queryParams: { returnUrl: state.url },
    });

  iam.checkSessionExpiration();
  const user = iam.activeUser();
  if (!user) return signIn();

  const plans = router.createUrlTree(['/subscriptions/plans']);

  return subscriptionsApi.getSubscriptionByUserId(user.id).pipe(
    map((subscription) => {
      if (iam.activeUser()?.id !== user.id) return signIn();
      return subscription?.hasAccess() === true ? true : plans;
    }),
    catchError(() =>
      of(
        iam.activeUser()?.id === user.id
          ? router.createUrlTree(['/subscriptions/plans'], {
              queryParams: { accessCheck: 'failed' },
            })
          : signIn(),
      ),
    ),
  );
};
