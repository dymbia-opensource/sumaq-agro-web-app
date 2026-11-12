import { Component, inject, signal } from '@angular/core';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { TranslatePipe } from '@ngx-translate/core';
import { IamStore } from '../../../application/iam.store';
import { SignUpCommand } from '../../../domain/model/commands/sign-up.command';
import { UserRole } from '../../../domain/model/value-objects/user-role';
import { AuthLayout } from '../../components/auth-layout/auth-layout';
import { ErrorStateMatcher } from '@angular/material/core';

const matchingPasswordsValidator: ValidatorFn = (group) => {
  const password = group.get('password')?.value;
  const confirmation = group.get('confirmPassword')?.value;

  if (!password || !confirmation) {
    return null;
  }

  return password === confirmation ? null : { passwordMismatch: true };
};

@Component({
  selector: 'app-sign-up-form',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatRadioModule,
    TranslatePipe,
    AuthLayout,
  ],
  templateUrl: './sign-up-form.html',
  styleUrl: './sign-up-form.css',
})
export class SignUpForm {
  protected readonly store = inject(IamStore);
  protected readonly hidePassword = signal(true);
  protected readonly hideConfirmPassword = signal(true);

  protected readonly fieldErrorMatcher: ErrorStateMatcher = {
    isErrorState: (control, form) =>
      !!control?.invalid && (!!form?.submitted || (control.dirty && control.touched)),
  };

  protected readonly confirmationErrorMatcher: ErrorStateMatcher = {
    isErrorState: (control, form) => {
      const interacted = !!(form?.submitted || (control?.dirty && control.touched));

      const invalid = !!(control?.invalid || control?.parent?.hasError('passwordMismatch'));

      return interacted && invalid;
    },
  };
  protected readonly roles: readonly UserRole[] = ['FARMER', 'COOPERATIVE_DIRECTOR', 'AGRONOMIST'];

  protected readonly form = new FormGroup(
    {
      role: new FormControl<UserRole>('FARMER', {
        nonNullable: true,
        validators: [Validators.required],
      }),
      firstName: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.pattern(/\S/), Validators.maxLength(100)],
      }),
      lastName: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.pattern(/\S/), Validators.maxLength(100)],
      }),
      email: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.email],
      }),
      password: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required, Validators.minLength(8)],
      }),
      confirmPassword: new FormControl('', {
        nonNullable: true,
        validators: [Validators.required],
      }),
    },
    { validators: matchingPasswordsValidator },
  );

  constructor() {
    this.store.clearFeedback();
  }

  protected togglePassword(): void {
    this.hidePassword.update((hidden) => !hidden);
  }

  protected toggleConfirmPassword(): void {
    this.hideConfirmPassword.update((hidden) => !hidden);
  }

  protected submit(): void {
    if (this.store.isLoading() || this.store.registrationCompleted()) return;

    this.form.markAllAsTouched();

    if (this.form.invalid) return;

    const { firstName, lastName, email, password, role } = this.form.getRawValue();

    this.store.signUp(new SignUpCommand({ firstName, lastName, email, password, role }));
  }
}
