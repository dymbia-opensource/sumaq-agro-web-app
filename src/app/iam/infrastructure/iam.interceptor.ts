import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { IamStore } from '../application/iam.store';

/**
 * Adds IAM bearer credentials to outgoing HTTP requests when available.
 *
 * @remarks
 * When the platform answers 401 to a request that carried the token, the
 * token is no longer valid (it lasts 30 minutes), so the user is signed out.
 */
export const iamInterceptor: HttpInterceptorFn = (request, next) => {
  const store = inject(IamStore);
  const router = inject(Router);
  // Get the token of the current session.
  const token = store.currentToken();
  // If the token exists, add it to the request headers. Otherwise, send the request as is.
  const handledRequest = token
    ? request.clone({ headers: request.headers.set('Authorization', `Bearer ${token}`) })
    : request;
  // Return the handled request.
  return next(handledRequest).pipe(
    catchError((error: unknown) => {
      if (
        token &&
        error instanceof HttpErrorResponse &&
        error.status === 401 &&
        store.currentToken() === token
      ) {
        store.signOut(router);
      }
      return throwError(() => error);
    }),
  );
};
