import { html } from '@prairielearn/html';

import { PageLayout } from '../../../components/PageLayout.js';
import { type Course, type Institution } from '../../../lib/db-types.js';
import type { ResLocalsForPage } from '../../../lib/res-locals.js';

export function AdministratorInstitutionCourses({
  institution,
  courses,
  resLocals,
}: {
  institution: Institution;
  courses: Course[];
  resLocals: ResLocalsForPage<'plain'>;
}) {
  return PageLayout({
    resLocals: { ...resLocals, institution },
    pageTitle: 'درس‌ها - مدیریت موسسه',
    navContext: {
      type: 'administrator_institution',
      page: 'administrator_institution',
      subPage: 'courses',
    },
    content: html`
      <div class="table-responsive">
        <table class="table table-hover table-striped table-bordered" aria-label="درس‌ها">
          <thead>
            <tr>
              <th>نام</th>
              <th>محدودیت ثبت‌نام سالانه موثر</th>
            </tr>
          </thead>
          <tbody>
            ${courses.map((course) => {
              return html`
                <tr>
                  <td>
                    <a href="/pl/administrator/institution/${institution.id}/course/${course.id}">
                      ${course.short_name ?? '—'}: ${course.title ?? '—'}
                    </a>
                  </td>
                  <td>${course.yearly_enrollment_limit ?? institution.yearly_enrollment_limit}</td>
                </tr>
              `;
            })}
          </tbody>
        </table>
      </div>
    `,
  });
}
