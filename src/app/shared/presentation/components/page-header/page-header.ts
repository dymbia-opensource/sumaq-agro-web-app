import { Component, computed, inject, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { IamStore } from '../../../../iam/application/iam.store';
import { homeCrumbFor, navigationLabelFor } from '../../../infrastructure/navigation-config';

/** One step of the breadcrumb: an i18n key and, optionally, the route it opens. */
export interface Breadcrumb {
  label: string;
  link?: string;
}

/**
 * Header of a page: breadcrumb, title and subtitle.
 *
 * @remarks
 * The last breadcrumb is the current page. The first one is added here: it is
 * the start page of the visitor's role, so a page shared by several roles does
 * not send a cooperative director to the producer dashboard. A step that the
 * role's own menu also leads to takes the wording of that menu. Buttons placed
 * between the tags (for example a "View all" link) are shown at the right of
 * the title.
 */
@Component({
  selector: 'app-page-header',
  imports: [RouterLink, MatIconModule, TranslatePipe],
  templateUrl: './page-header.html',
  styleUrl: './page-header.css',
})
export class PageHeader {
  private readonly session = inject(IamStore);

  /** Path from the start page of the role to the current page. */
  readonly breadcrumbs = input<Breadcrumb[]>([]);

  /** Title of the page, already translated. */
  readonly title = input.required<string>();

  /** Text under the title, already translated. */
  readonly subtitle = input<string>();

  /** Smaller title, for pages with a long title. */
  readonly compact = input(false);

  /** Breadcrumb shown: the start page of the role, then the declared steps. */
  protected readonly trail = computed<Breadcrumb[]>(() => {
    const experience = this.session.activeUser()?.experience;
    const steps = this.breadcrumbs();
    if (!experience) return steps;

    const home = homeCrumbFor(experience);
    const named = steps.map((step) =>
      step.link ? { ...step, label: navigationLabelFor(experience, step.link) ?? step.label } : step,
    );

    return named[0]?.link === home.link ? named : [home, ...named];
  });
}
