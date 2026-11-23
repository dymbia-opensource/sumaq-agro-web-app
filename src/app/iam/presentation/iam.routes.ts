import { Routes } from '@angular/router';

const signInForm = () => import('./views/sign-in-form/sign-in-form').then((m) => m.SignInForm);
const signUpForm = () => import('./views/sign-up-form/sign-up-form').then((m) => m.SignUpForm);
const forgotPasswordForm = () =>
  import('./views/forgot-password-form/forgot-password-form').then((m) => m.ForgotPasswordForm);
const resetPasswordForm = () =>
  import('./views/reset-password-form/reset-password-form').then((m) => m.ResetPasswordForm);

/**
 * Route tree for IAM presentation views.
 *
 * @remarks
 * The emails of the platform link to `/reset-password?token=...` (password
 * recovery) and `/sign-up?invitationToken=...` (agronomist invitation).
 */
export const iamRoutes: Routes = [
  { path: 'sign-in', loadComponent: signInForm, title: 'iam.signIn.title' },
  { path: 'sign-up', loadComponent: signUpForm, title: 'iam.signUp.title' },
  { path: 'forgot-password', loadComponent: forgotPasswordForm, title: 'iam.recovery.forgot.title' },
  { path: 'reset-password', loadComponent: resetPasswordForm, title: 'iam.recovery.reset.title' },
];
