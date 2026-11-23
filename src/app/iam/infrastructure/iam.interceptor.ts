import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { IamStore } from '../application/iam.store';

/**
 * Adds IAM bearer credentials to outgoing HTTP requests when available.
 */
export const iamInterceptor: HttpInterceptorFn = (request, next) => {
  const store = inject(IamStore);
  // Get the token of the current session.
  const token = store.currentToken();
  // If the token exists, add it to the request headers. Otherwise, send the request as is.
  const handledRequest = token
    ? request.clone({ headers: request.headers.set('Authorization', `Bearer ${token}`) })
    : request;
  // Return the handled request.
  return next(handledRequest);
};
