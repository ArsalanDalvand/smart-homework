import { z } from 'zod';

import { compiledScriptTag } from '@prairielearn/compiled-assets';
import { type HtmlValue, html } from '@prairielearn/html';
import { type Timezone, formatTimezone } from '@prairielearn/utils/timezone';

import { PageLayout } from '../../../components/PageLayout.js';
import { type Institution, type PlanGrant } from '../../../lib/db-types.js';
import type { ResLocalsForPage } from '../../../lib/res-locals.js';
import { CourseRequestMessageSection } from '../../components/courseRequestMessage/CourseRequestMessageSection.js';
import { PlanGrantsEditor } from '../../lib/billing/components/PlanGrantsEditor.js';

export const InstitutionStatisticsSchema = z.object({
  course_count: z.number(),
  course_instance_count: z.number(),
  enrollment_count: z.number(),
});
type InstitutionStatistics = z.infer<typeof InstitutionStatisticsSchema>;

export function AdministratorInstitutionGeneral({
  institution,
  availableTimezones,
  statistics,
  planGrants,
  courseRequestMessage,
  courseRequestMessageHtml,
  githubCourseOwner,
  defaultGithubCourseOwner,
  resLocals,
}: {
  institution: Institution;
  availableTimezones: Timezone[];
  statistics: InstitutionStatistics;
  planGrants: PlanGrant[];
  courseRequestMessage: string | null;
  courseRequestMessageHtml: string;
  githubCourseOwner: string | null;
  defaultGithubCourseOwner: string;
  resLocals: ResLocalsForPage<'plain'>;
}) {
  return PageLayout({
    pageTitle: 'مدیریت موسسه',
    resLocals: {
      ...resLocals,
      institution,
    },
    headContent: html`
      ${compiledScriptTag('administratorInstitutionGeneralClient.ts')}
      <style>
        .card-grid {
          display: grid;
          grid-template-columns: repeat(1, 1fr);
          gap: 1rem;
        }

        @media (min-width: 768px) {
          .card-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }
      </style>
    `,
    navContext: {
      type: 'administrator_institution',
      page: 'administrator_institution',
      subPage: 'general',
    },
    content: html`
      <h2 class="h4">آمار</h2>
      <div class="card-grid mb-3">
        ${StatisticsCard({ title: 'درس‌ها', value: statistics.course_count })}
        ${StatisticsCard({
          title: 'ارائه‌های درس',
          value: statistics.course_instance_count,
        })}
        ${StatisticsCard({ title: 'ثبت‌نام‌ها', value: statistics.enrollment_count })}
      </div>
      <h2 class="h4">اطلاعات عمومی</h2>
      <form method="POST" class="mb-3">
        <div class="mb-3">
          <label class="form-label" for="short_name">نام کوتاه</label>
          <input
            type="text"
            class="form-control"
            id="short_name"
            name="short_name"
            value="${institution.short_name}"
          />
          <small id="short_name_help" class="form-text text-muted">
            یک نام کوتاه یا مخفف، مثلاً «illinois.edu» یا «ubc.ca». معمولاً این مقدار باید دامنه موسسه باشد.
          </small>
        </div>
        <div class="mb-3">
          <label class="form-label" for="long_name">نام کامل</label>
          <input
            type="text"
            class="form-control"
            id="long_name"
            name="long_name"
            value="${institution.long_name}"
          />
          <small id="long_name_help" class="form-text text-muted">
            نام کامل دانشگاه یا موسسه، مثلاً «دانشگاه صنعتی شریف».
          </small>
        </div>
        <div class="mb-3">
          <label class="form-label" for="display_timezone">منطقه زمانی</label>
          <select
            class="form-select"
            id="display_timezone"
            name="display_timezone"
            value="${institution.display_timezone}"
          >
            ${availableTimezones.map(
              (tz) => html`
                <option
                  value="${tz.name}"
                  ${institution.display_timezone === tz.name ? 'selected' : ''}
                >
                  ${formatTimezone(tz)}
                </option>
              `,
            )}
          </select>
          <small id="display_timezone_help" class="form-text text-muted">
            مناطق زمانی مجاز بر اساس
            <a
              href="https://en.wikipedia.org/wiki/List_of_tz_database_time_zones"
              target="_blank"
              rel="noreferrer"
              >پایگاه داده tz</a
            > هستند. بهتر است از منطقه زمانی مبتنی بر شهر هم‌زمان با موسسه استفاده کنید، مثلاً «Asia/Tehran».
          </small>
        </div>
        <div class="mb-3">
          <label class="form-label" for="uid_regexp">عبارت باقاعده UID</label>
          <input
            type="text"
            class="form-control"
            id="uid_regexp"
            name="uid_regexp"
            value="${institution.uid_regexp}"
          />
          <small id="uid_regexp_help" class="form-text text-muted">
            باید با بخش غیرنام‌کاربریِ UID کاربران مطابقت داشته باشد، مثلاً <code>@example\\.com$</code>. این مقدار باید یک عبارت باقاعده معتبر باشد که با <code>@</code> شروع و با <code>$</code> تمام شود. نقطه‌ها باید به صورت <code>\\.</code> اسکیپ شوند. برای عملکرد صحیح محدودیت‌های دسترسی مبتنی بر موسسه، تنظیم این مورد ضروری است.
          </small>
        </div>
        <h2 class="h4">محدودیت‌ها</h2>
        <div class="mb-3">
          <label class="form-label" for="course_instance_enrollment_limit">
            محدودیت ثبت‌نام ارائه درس
          </label>
          <input
            type="number"
            class="form-control"
            id="course_instance_enrollment_limit"
            name="course_instance_enrollment_limit"
            value="${institution.course_instance_enrollment_limit}"
            required
            aria-describedby="course_instance_enrollment_limit_help"
          />
          <small id="course_instance_enrollment_limit_help" class="form-text text-muted">
            حداکثر تعداد ثبت‌نام مجاز برای یک ارائه درس. این مقدار در سطح درس‌ها و ارائه‌های درس قابل بازنویسی است.
          </small>
        </div>
        <div class="mb-3">
          <label class="form-label" for="yearly_enrollment_limit">محدودیت ثبت‌نام سالانه</label>
          <input
            type="number"
            class="form-control"
            id="yearly_enrollment_limit"
            name="yearly_enrollment_limit"
            value="${institution.yearly_enrollment_limit}"
            required
            aria-describedby="yearly_enrollment_limit_help"
          />
          <small id="yearly_enrollment_limit_help" class="form-text text-muted">
            حداکثر تعداد ثبت‌نام مجاز در سال. این محدودیت به صورت متحرک (Rolling) اعمال می‌شود؛ یعنی ۳۶۵ روز گذشته از لحظه تلاش دانشجو برای ثبت‌نام محاسبه می‌گردد.
          </small>
        </div>
        <input type="hidden" name="__csrf_token" value="${resLocals.__csrf_token}" />
        <button
          type="submit"
          name="__action"
          value="update_enrollment_limits"
          class="btn btn-primary"
        >
          ذخیره
        </button>
      </form>

      ${CourseRequestMessageSection({
        csrfToken: resLocals.__csrf_token,
        description: html`
          این پیام به کاربران این موسسه در
          <a href="/pl/request_course">صفحه درخواست درس</a> نمایش داده می‌شود. قالب‌بندی Markdown پشتیبانی می‌شود؛ تگ‌های HTML رندر نمی‌شوند.
        `,
        courseRequestMessage,
        courseRequestMessageHtml,
      })}

      <h2 class="h4">GitHub</h2>
      <form method="POST" class="mb-3">
        <div class="mb-3">
          <label class="form-label" for="github_course_owner">سازمان پیش‌فرض GitHub</label>
          <input
            type="text"
            class="form-control"
            id="github_course_owner"
            name="github_course_owner"
            value="${githubCourseOwner ?? ''}"
            placeholder="${defaultGithubCourseOwner}"
            aria-describedby="github_course_owner_help"
          />
          <small id="github_course_owner_help" class="form-text text-muted">
            هنگامی که درخواست‌های درس تاییدشده برای این موسسه به درس تبدیل می‌شوند، مخازن در این سازمان GitHub ایجاد خواهند شد. برای استفاده از پیش‌فرض سامانه (<code>${defaultGithubCourseOwner}</code>) خالی بگذارید. با ذخیره کردن، عضویت فعال حساب سیستمی در این سازمان بررسی می‌شود.
          </small>
        </div>
        <input type="hidden" name="__csrf_token" value="${resLocals.__csrf_token}" />
        <button
          type="submit"
          name="__action"
          value="update_github_course_owner"
          class="btn btn-primary"
        >
          ذخیره
        </button>
      </form>

      <h2 class="h4">طرح‌ها (Plans)</h2>
      ${PlanGrantsEditor({
        planGrants,
        // The basic plan is never available at the institution level; it's only
        // used for student billing for enrollments.
        excludedPlanNames: ['basic'],
        csrfToken: resLocals.__csrf_token,
      })}
    `,
  });
}

function StatisticsCard({ title, value }: { title: string; value: HtmlValue }) {
  return html`
    <div class="card d-flex flex-column p-3 align-items-center">
      <span class="h4">${value}</span>
      <span class="text-muted">${title}</span>
    </div>
  `;
}
