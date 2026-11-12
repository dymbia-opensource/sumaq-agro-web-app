import { Component, effect, inject, signal, untracked } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { ErrorStateMatcher } from '@angular/material/core';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { IamStore } from '../../../application/iam.store';
import { SignInCommand } from '../../../domain/model/commands/sign-in.command';
import { AuthLayout } from '../../components/auth-layout/auth-layout';
import { TranslatePipe } from '@ngx-translate/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthNavigationService } from '../../../infrastructure/auth-navigation.service';
import {
  DevelopmentDemoAccount,
  getDevelopmentDemoAccounts,
} from '../../../infrastructure/mock/development-demo-accounts';

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
  protected readonly demoAccounts = getDevelopmentDemoAccounts();
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly navigation = inject(AuthNavigationService);

  constructor() {
    this.store.clearFeedback();
    effect(() => {
      if (!this.store.hasActiveUser()) return;

      untracked(() => {
        const destination = this.navigation.destination(
          this.route.snapshot.queryParamMap.get('returnUrl'),
        );
        void this.router.navigateByUrl(destination, { replaceUrl: true });
      });
    });
  }
  protected readonly fieldErrorMatcher: ErrorStateMatcher = {
    isErrorState: (control, form) =>
      !!control?.invalid && (!!form?.submitted || (control.dirty && control.touched)),
  };

  protected readonly form = new FormGroup({
    email: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    password: new FormControl('', {
      nonNullable: true,
      validators: [Validators.required],
    }),
  });

  protected togglePassword(): void {
    this.hidePassword.update((hidden) => !hidden);
  }

  protected fillDemoAccount(account: DevelopmentDemoAccount): void {
    if (this.store.isLoading()) return;
    this.store.clearFeedback();
    this.form.setValue({ email: account.email, password: account.password });
    this.form.markAsPristine();
    this.form.markAsUntouched();
    this.hidePassword.set(true);
  }

  protected submit(): void {
    if (this.store.isLoading()) return;

    this.form.markAllAsTouched();

    if (this.form.invalid) return;

    this.store.signIn(new SignInCommand(this.form.getRawValue()));
  }
}
