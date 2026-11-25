import { html } from '@prairielearn/html';

import { type User } from '../lib/db-types.js';
import type { UntypedResLocals } from '../lib/res-locals.types.js';

import type { NavContext } from './Navbar.types.js';
import { PageLayout } from './PageLayout.js';

export function InsufficientCoursePermissionsCardPage({
  resLocals,
  courseOwners,
  pageTitle,
  navContext,
  requiredPermissions,
}: {
  resLocals: UntypedResLocals;
  courseOwners: User[];
  pageTitle: string;
  navContext: NavContext;
  requiredPermissions: string;
}) {
  return PageLayout({
    resLocals,
    pageTitle,
    navContext,
    content: InsufficientCoursePermissionsCard({
      courseOwners,
      pageTitle,
      requiredPermissions,
      hasCoursePermissionOwn: resLocals.authz_data.has_course_permission_own,
      urlPrefix: resLocals.urlPrefix,
    }),
  });
}

function InsufficientCoursePermissionsCard({
  courseOwners,
  pageTitle,
  requiredPermissions,
  hasCoursePermissionOwn,
  urlPrefix,
}: {
  courseOwners: User[];
  pageTitle: string;
  requiredPermissions: string;
  hasCoursePermissionOwn: boolean;
  urlPrefix: string;
}) {
  return html`<div class="card mb-4">
    <div class="card-header bg-primary text-white">
      <h1>${pageTitle}</h1>
    </div>
    <div class="card-body">
      <p>
        شما مجوز مشاهده این صفحه را ندارید. این صفحه حداقل به سطح دسترسی
        «${requiredPermissions}» برای این درس نیاز دارد.
      </p>
      ${
        hasCoursePermissionOwn
          ? html`<p>
              می‌توانید دسترسی‌های لازم را در
              <a href="${urlPrefix}/course_admin/staff">صفحه کادر آموزشی</a>
              به خودتان اعطا کنید.
            </p>`
          : courseOwners.length > 0
            ? html`
                <p>برای درخواست دسترسی با یکی از مالکان درس زیر تماس بگیرید.</p>
                <ul>
                  ${courseOwners.map(
                    (owner) => html` <li>${owner.uid} ${owner.name ? `(${owner.name})` : ''}</li> `,
                  )}
                </ul>
              `
            : ''
      }
    </div>
  </div>`;
}
