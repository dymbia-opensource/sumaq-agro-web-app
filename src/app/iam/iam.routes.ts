import { Routes } from '@angular/router';

export const iamRoutes: Routes = [
  {
    path: 'forgot-password',
    loadComponent: () =>
      import('./presentation/views/forgot-password-form/forgot-password-form').then(
        (m) => m.ForgotPasswordForm,
      ),
    title: 'Recuperar acceso | SumaqAgro',
  },
  {
    path: 'reset-password',
    loadComponent: () =>
      import('./presentation/views/reset-password-form/reset-password-form').then(
        (m) => m.ResetPasswordForm,
      ),
    title: 'Restablecer contraseña | SumaqAgro',
  },
  {
    path: 'sign-in',
    loadComponent: () =>
      import('./presentation/views/sign-in-form/sign-in-form').then((m) => m.SignInForm),
    title: 'Iniciar sesión | SumaqAgro',
  },
  {
    path: 'sign-up',
    loadComponent: () =>
      import('./presentation/views/sign-up-form/sign-up-form').then((m) => m.SignUpForm),
    title: 'Crear cuenta | SumaqAgro',
  },
];
