import { HttpErrorResponse, HttpInterceptorFn, HttpResponse } from '@angular/common/http';
import { defer, delay, of, switchMap, throwError } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { SignInRequest } from '../requests/sign-in.request';
import { SignUpRequest } from '../requests/sign-up.request';
import { SignInResponse } from '../responses/sign-in.response';
import { SignUpResponse } from '../responses/sign-up.response';
import { getDevelopmentDemoAccounts } from './development-demo-accounts';
import { UserRoleAssembler } from '../assemblers/user-role.assembler';

interface MockAccount {
  readonly user: SignUpResponse;
  readonly password: string;
  readonly profile?: SignUpRequest['profile'];
}

const accounts = new Map<string, MockAccount>(
  getDevelopmentDemoAccounts().map((account) => [
    account.email,
    {
      user: {
        id: account.id,
        email: account.email,
        roles: [UserRoleAssembler.toResource(account.role)],
      },
      password: account.password,
    },
  ]),
);

let nextUserId = Date.now();

const signInUrl =
  `${environment.platformProviderApiBaseUrl}` + `${environment.platformProviderSignInEndpointPath}`;

const signUpUrl =
  `${environment.platformProviderApiBaseUrl}` + `${environment.platformProviderSignUpEndpointPath}`;

const supportedRoles = new Set(['ROLE_FARMER', 'ROLE_COOPERATIVE_DIRECTOR', 'ROLE_AGRONOMIST']);

function failure(status: number, url: string) {
  return throwError(
    () =>
      new HttpErrorResponse({
        status,
        url,
      }),
  );
}

/**
 * Simulates authentication in development.
 * Registered accounts and profile details remain in memory until reload.
 */
export const mockAuthenticationInterceptor: HttpInterceptorFn = (request, next) => {
  if (environment.production || !environment.useMockAuthentication || request.method !== 'POST') {
    return next(request);
  }

  if (request.url === signUpUrl) {
    return of(null).pipe(
      delay(400),
      switchMap(() =>
        defer(() => {
          const body = request.body as SignUpRequest | null;

          const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';

          const firstName =
            typeof body?.profile?.firstName === 'string' ? body.profile.firstName.trim() : '';

          const lastName =
            typeof body?.profile?.lastName === 'string' ? body.profile.lastName.trim() : '';

          if (
            !email ||
            typeof body?.password !== 'string' ||
            body.password.length < 8 ||
            !firstName ||
            !lastName ||
            firstName.length > 100 ||
            lastName.length > 100 ||
            !Array.isArray(body.roles) ||
            body.roles.length !== 1 ||
            !supportedRoles.has(body.roles[0])
          ) {
            return failure(400, request.url);
          }

          if (accounts.has(email)) {
            return failure(409, request.url);
          }

          const user: SignUpResponse = {
            id: nextUserId++,
            email,
            roles: [...body.roles],
          };

          accounts.set(email, {
            user,
            password: body.password,
            profile: {
              firstName,
              lastName,
            },
          });

          return of(
            new HttpResponse<SignUpResponse>({
              status: 201,
              body: user,
            }),
          );
        }),
      ),
    );
  }

  if (request.url === signInUrl) {
    return of(null).pipe(
      delay(400),
      switchMap(() =>
        defer(() => {
          const body = request.body as SignInRequest | null;

          const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : '';

          const account = email ? accounts.get(email) : undefined;

          if (!account || account.password !== body?.password) {
            return failure(401, request.url);
          }

          const response: SignInResponse = {
            ...account.user,
            fullName: account.profile
              ? [account.profile.firstName, account.profile.lastName].join(' ')
              : undefined,
            token: `mock-session-${crypto.randomUUID()}`,
          };

          return of(
            new HttpResponse<SignInResponse>({
              status: 200,
              body: response,
            }),
          );
        }),
      ),
    );
  }

  return next(request);
};
