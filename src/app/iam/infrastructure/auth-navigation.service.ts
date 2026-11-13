import { inject, Service } from '@angular/core';
import { PRIMARY_OUTLET, Router, UrlTree } from '@angular/router';
import { IamStore } from '../application/iam.store';

const PRIVATE_CONTEXTS = new Set([
  'field-management',
  'crop-health',
  'profiles',
  'harvest-certification',
]);

/** Resolves post-login destinations. Route guards still enforce access rules. */
@Service()
export class AuthNavigationService {
  private readonly router = inject(Router);
  private readonly session = inject(IamStore);

  destination(returnUrl: string | null): UrlTree {
    const fallback = this.router.parseUrl(
      this.session.activeUser()?.initialRoute ?? '/sign-in',
    );

    if (
      !this.session.hasActiveUser() ||
      !returnUrl ||
      !returnUrl.startsWith('/') ||
      returnUrl.startsWith('//') ||
      /[\\\u0000-\u0020]/.test(returnUrl)
    ) {
      return fallback;
    }

    try {
      const tree = this.router.parseUrl(returnUrl);
      const primary = tree.root.children[PRIMARY_OUTLET];

      // Only plain primary-outlet paths within private contexts are accepted.
      if (
        !primary ||
        Object.keys(tree.root.children).length !== 1 ||
        primary.hasChildren() ||
        !PRIVATE_CONTEXTS.has(primary.segments[0]?.path) ||
        primary.segments.some(
          (segment) =>
            Object.keys(segment.parameters).length > 0 ||
            /[/\\\u0000-\u0020]/.test(segment.path) ||
            segment.path === '.' ||
            segment.path === '..',
        )
      ) {
        return fallback;
      }

      return tree;
    } catch {
      return fallback;
    }
  }

  signOut(): void {
    this.session.signOut();

    void this.router.navigateByUrl('/sign-in', {
      replaceUrl: true,
    });
  }
}
