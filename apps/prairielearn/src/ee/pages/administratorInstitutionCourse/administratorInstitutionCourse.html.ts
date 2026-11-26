import { z } from 'zod';

import { html } from '@prairielearn/html';

import { PageLayout } from '../../../components/PageLayout.js';
import { type Course, CourseInstanceSchema, type Institution } from '../../../lib/db-types.js';
import type { ResLocalsForPage } from '../../../lib/res-locals.js';

export const CourseInstanceRowSchema = z.object({
  course_instance: CourseInstanceSchema,
  enrollment_count: z.number(),
});
type CourseInstanceRow = z.infer<typeof CourseInstanceRowSchema>;

export function AdministratorInstitutionCourse({
  institution,
  course,
  rows,
  resLocals,
}: {
  institution: Institution;
  course: Course;
  rows: CourseInstanceRow[];
  resLocals: ResLocalsForPage<'plain'>;
}) {
  return PageLayout({
    resLocals: { ...resLocals, institution },
    pageTitle: `${course.short_name} - مدیریت موسسه`,
    navContext: {
      type: 'administrator_institution',
      page: 'administrator_institution',
      subPage: 'courses',
    },
    content: html`
      <nav aria-label="مسیر راهنما">
        <ol class="breadcrumb">
          <li class="breadcrumb-item">
            <a href="/pl/administrator/institution/${institution.id}/courses">درس‌ها</a>
          </li>
          <li class="breadcrumb-item active" aria-current="page">
            ${course.short_name}: ${course.title}
          </li>
        </ol>
      </nav>

      <p><a href="/pl/course/${course.id}">مشاهده به عنوان مدرس</a></p>

      <h2 class="h4">محدودیت‌ها</h2>
      <form method="POST" class="mb-3">
        <div class="mb-3">
          <label class="form-label" for="institution_course_instance_enrollment_limit">
            محدودیت ثبت‌نام ارائه درس برای موسسه
          </label>
          <input
            type="number"
            disabled
            class="form-control"
            id="institution_course_instance_enrollment_limit"
            value="${institution.course_instance_enrollment_limit}"
          />
          <small class="form-text text-muted">
            این محدودیت برای تمام ارائه‌های درسی که محدودیت ثبت‌نام اختصاصی ندارند اعمال می‌شود.
          </small>
        </div>

        <div class="mb-3">
          <label class="form-label" for="institution_yearly_enrollment_limit">
            محدودیت ثبت‌نام سالانه برای موسسه
          </label>
          <input
            type="number"
            disabled
            class="form-control"
            id="institution_yearly_enrollment_limit"
            value="${institution.yearly_enrollment_limit}"
          />
          <small class="form-text text-muted">
            این محدودیت برای تمام ثبت‌نام‌های موسسه این درس اعمال می‌شود.
          </small>
        </div>

        <div class="mb-3">
          <label class="form-label" for="course_instance_enrollment_limit">
            بازنویسی محدودیت ثبت‌نام ارائه درس
          </label>
          <input
            type="number"
            class="form-control"
            id="course_instance_enrollment_limit"
            name="course_instance_enrollment_limit"
            value="${course.course_instance_enrollment_limit}"
          />
          <small class="form-text text-muted">
            این محدودیت برای تمام ارائه‌های این درس اعمال می‌شود. اگر بازنویسی تنظیم نشود، از محدودیت سطح موسسه استفاده خواهد شد.
          </small>
        </div>

        <div class="mb-3">
          <label class="form-label" for="yearly_enrollment_limit">
            محدودیت ثبت‌نام سالانه برای درس
          </label>
          <input
            type="number"
            class="form-control"
            id="yearly_enrollment_limit"
            name="yearly_enrollment_limit"
            value="${course.yearly_enrollment_limit}"
          />
          <small class="form-text text-muted">
            این محدودیت فقط برای این درس اعمال می‌شود و
            <i><strong>علاوه بر</strong></i> محدودیت ثبت‌نام سالانه سطح موسسه محاسبه می‌گردد.
          </small>
        </div>

        <input type="hidden" name="__csrf_token" value="${resLocals.__csrf_token}" />
        <button type="submit" class="btn btn-primary">ذخیره</button>
      </form>

      <h2 class="h4">ارائه‌های درس</h2>
      <div class="table-responsive">
        <table class="table table-hover table-striped table-bordered" aria-label="ارائه‌های درس">
          <thead>
            <tr>
              <th>نام</th>
              <th>ثبت‌نام‌ها</th>
              <th>محدودیت ثبت‌نام موثر</th>
            </tr>
          </thead>
          <tbody>
            ${rows.map(({ course_instance, enrollment_count }) => {
              const isDeleted = course_instance.deleted_at !== null;
              return html`
                <tr>
                  <td>
                    <div class="d-flex align-items-center">
                      <a
                        href="/pl/administrator/institution/${institution.id}/course_instance/${course_instance.id}"
                        >${course_instance.short_name}: ${course_instance.long_name ?? '—'}</a
                      >
                      ${
                        isDeleted
                          ? html`<span class="badge text-bg-danger ms-2">حذف‌شده</span>`
                          : ''
                      }
                    </div>
                  </td>
                  <td>${enrollment_count}</td>
                  <td>
                    ${
                      course_instance.enrollment_limit ??
                      course.course_instance_enrollment_limit ??
                      institution.course_instance_enrollment_limit
                    }
                  </td>
                </tr>
              `;
            })}
          </tbody>
        </table>
      </div>
    `,
  });
}
