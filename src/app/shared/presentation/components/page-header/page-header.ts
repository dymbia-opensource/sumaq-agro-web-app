import { Component, computed, inject, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { Router, RouterLink } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { IamStore } from '../../../../iam/application/iam.store';
import { navigationFor, navigationLabelFor } from '../../../infrastructure/navigation-config';

/** One step of the breadcrumb: an i18n key and, optionally, the route it opens. */
export interface Breadcrumb {
  label: string;
  link?: string;
}

/**
 * Header of a page: breadcrumb, title and subtitle.
 *
 * @remarks
 * The breadcrumb starts at the section of the side menu the page belongs to
 * and ends at the current page, which is not a link. It is only shown on
 * subpages (two steps or more): on a page of the menu the title and the
 * highlighted menu option already say where the visitor is. A page that some
 * roles reach from another section (the inspections, from the producer's
 * inbox) and other roles open from their own menu shows no trail to the
 * latter. A step that the
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

  /** Path of the page that renders this header, without query string. */
  private readonly path = inject(Router).url.split(/[?#]/)[0];

  /** Path from the menu section of the page to the current page. */
  readonly breadcrumbs = input<Breadcrumb[]>([]);

  /** Title of the page, already translated. */
  readonly title = input.required<string>();

  /** Text under the title, already translated. */
  readonly subtitle = input<string>();

  /** Smaller title, for pages with a long title. */
  readonly compact = input(false);

  /** Breadcrumb shown: the declared steps, only on subpages. */
  protected readonly trail = computed<Breadcrumb[]>(() => {
    const steps = this.breadcrumbs();
    if (steps.length < 2) return [];
    const experience = this.session.activeUser()?.experience;
    if (!experience) return steps;
    const menu = navigationFor(experience).flatMap((section) => section.options);
    if (menu.some((option) => option.link === this.path)) return [];
    return steps.map((step) =>
      step.link ? { ...step, label: navigationLabelFor(experience, step.link) ?? step.label } : step,
    );
  });
}
