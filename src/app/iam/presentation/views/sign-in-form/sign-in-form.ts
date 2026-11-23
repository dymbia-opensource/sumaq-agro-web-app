import { Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { ErrorStateMatcher } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { IamStore } from '../../../application/iam.store';
import { SignInCommand } from '../../../domain/model/commands/sign-in.command';
import { AuthLayout } from '../../components/auth-layout/auth-layout';

/**
 * Collects credentials and triggers IAM sign-in.
 */
@Component({
  selector: 'app-sign-in-form',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    AuthLayout,
    TranslatePipe,
  ],
  templateUrl: './sign-in-form.html',
  styleUrl: './sign-in-form.css',
})
export class SignInForm {
  protected readonly store = inject(IamStore);
  protected readonly hidePassword = signal(true);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  /** Shows the errors of a field once the user left it or tried to submit. */
  protected readonly fieldErrorMatcher: ErrorStateMatcher = {
    isErrorState: (control, form) =>
      !!control?.invalid && (!!form?.submitted || (control.dirty && control.touched)),
  };

  /** Form-group for the sign-in form. */
  protected readonly form = new FormGroup({
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    password: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
  });

  constructor() {
    this.store.clearFeedback();
  }

  /** Shows or hides the password. */
  protected togglePassword(): void {
    this.hidePassword.update((hidden) => !hidden);
  }

  /** Performs the sign-in operation if the form is valid. */
  protected submit(): void {
    if (this.store.isLoading()) return;
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    this.store.signIn(
      new SignInCommand(this.form.getRawValue()),
      this.router,
      this.route.snapshot.queryParamMap.get('returnUrl'),
    );
  }
}
