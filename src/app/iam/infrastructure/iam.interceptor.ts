import { HttpErrorResponse, HttpInterceptorFn } from "@angular/common/http";
import { inject } from "@angular/core";
import { catchError, throwError } from "rxjs";
import { environment } from "../../../environments/environment";
import { IamStore } from "../application/iam.store";

const apiBaseUrl = environment.platformProviderApiBaseUrl.replace(/\/+$/, "");

const publicUrls = new Set([
  apiBaseUrl + "/public/traceability",
  `${apiBaseUrl}${environment.platformProviderSignInEndpointPath}`,
  `${apiBaseUrl}${environment.platformProviderSignUpEndpointPath}`,
  `${apiBaseUrl}${environment.platformProviderPasswordRecoveryEndpointPath}`,
  `${apiBaseUrl}${environment.platformProviderPasswordRecoveryEndpointPath}/reset`,
]);

/**
 * Adds platform bearer credentials and invalidates the originating session on HTTP 401.
 */
export const iamInterceptor: HttpInterceptorFn = (request, next) => {
  const requestUrl = request.url.split(/[?#]/, 1)[0];

  const targetsPlatformApi =
    requestUrl === apiBaseUrl || requestUrl.startsWith(`${apiBaseUrl}/`);

  if (!targetsPlatformApi || publicUrls.has(requestUrl)) {
    return next(request);
  }

  const store = inject(IamStore);
  store.checkSessionExpiration();
  const token = store.currentToken();
  const participant = store.currentUser();

  if (!token || request.headers.has("Authorization")) {
    return next(request);
  }

  return next(
    request.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    }),
  ).pipe(
    catchError((error: unknown) => {
      // A late response must not sign out a newer session, even if its token is identical.
      if (
        error instanceof HttpErrorResponse &&
        error.status === 401 &&
        participant !== null &&
        store.currentUser() === participant
      ) {
        store.signOut();
      }

      return throwError(() => error);
    }),
  );
};
