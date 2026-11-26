import { html } from '@prairielearn/html';
import { hydrateHtml } from '@prairielearn/react/server';

import { PageLayout } from '../../../components/PageLayout.js';
import { type CreditPoolLimits } from '../../../lib/ai-grading-credits.js';
import { compiledScriptTag } from '../../../lib/assets.js';
import {
  type Course,
  type CourseInstance,
  type Institution,
  type PlanGrant,
} from '../../../lib/db-types.js';
import type { ResLocalsForPage } from '../../../lib/res-locals.js';
import { PlanGrantsEditor } from '../../lib/billing/components/PlanGrantsEditor.js';

import { AdminCreditPoolSection } from './AdminCreditPoolSection.js';

export function AdministratorInstitutionCourseInstance({
  institution,
  course,
  course_instance,
  planGrants,
  aiGradingEnabled,
  trpcCsrfToken,
  refundsEnabled,
  creditPoolLimits,
  resLocals,
}: {
  institution: Institution;
  course: Course;
  course_instance: CourseInstance;
  planGrants: PlanGrant[];
  aiGradingEnabled: boolean;
  trpcCsrfToken: string | null;
  refundsEnabled: boolean;
  creditPoolLimits: CreditPoolLimits;
  resLocals: ResLocalsForPage<'plain'>;
}) {
  const isDeleted = course_instance.deleted_at !== null;

  return PageLayout({
    resLocals: { ...resLocals, institution },
    pageTitle: `${course.short_name}، ${course_instance.short_name} - مدیریت موسسه`,
    headContent: compiledScriptTag('administratorInstitutionCourseInstanceClient.ts'),
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
          <li class="breadcrumb-item">
            <a href="/pl/administrator/institution/${institution.id}/course/${course.id}">
              ${course.short_name}: ${course.title}
            </a>
          </li>
          <li class="breadcrumb-item active" aria-current="page">
            ${course_instance.short_name}: ${course_instance.long_name ?? '—'}
          </li>
        </ol>
      </nav>
      ${
        isDeleted
          ? html`<div class="alert alert-danger" role="alert">
              <strong>این ارائه درس حذف شده است.</strong> امکان اعمال تغییر در آن وجود ندارد.
            </div>`
          : html`<p>
              <a href="/pl/course_instance/${course_instance.id}/instructor">مشاهده به عنوان مدرس</a>
            </p>`
      }

      <h2 class="h4">محدودیت‌ها</h2>
      <form method="POST" class="mb-3">
        <div class="mb-3">
          <label class="form-label" for="course_instance_enrollment_limit_from_institution">
            محدودیت ثبت‌نام از طرف موسسه
          </label>
          <input
            type="number"
            disabled
            class="form-control"
            id="course_instance_enrollment_limit_from_institution"
            value="${institution.course_instance_enrollment_limit}"
          />
          <small class="form-text text-muted">
            این محدودیت برای تمام ارائه‌های درسی که محدودیت ثبت‌نام اختصاصی ندارند اعمال می‌شود.
          </small>
        </div>

        <div class="mb-3">
          <label class="form-label" for="course_instance_enrollment_limit_from_course">
            محدودیت ثبت‌نام از طرف درس
          </label>
          <input
            type="number"
            disabled
            class="form-control"
            id="course_instance_enrollment_limit_from_course"
            value="${course.course_instance_enrollment_limit}"
          />
          <small class="form-text text-muted">
            این محدودیت برای تمام ارائه‌های درسی که محدودیت ثبت‌نام اختصاصی ندارند اعمال می‌شود.
          </small>
        </div>

        <div class="mb-3">
          <label class="form-label" for="enrollment_limit">بازنویسی محدودیت ثبت‌نام</label>
          <input
            type="number"
            class="form-control"
            id="enrollment_limit"
            name="enrollment_limit"
            value="${course_instance.enrollment_limit}"
            ${isDeleted ? 'disabled' : ''}
          />
          <small class="form-text text-muted">
            این محدودیت جایگزین محدودیت‌های سطح درس و موسسه می‌شود. در صورت تنظیم نشدن، از محدودیت درس یا موسسه (در صورت وجود) استفاده خواهد شد.
          </small>
        </div>
        ${
          isDeleted
            ? ''
            : html`
                <input type="hidden" name="__csrf_token" value="${resLocals.__csrf_token}" />
                <button
                  type="submit"
                  name="__action"
                  value="update_enrollment_limit"
                  class="btn btn-primary"
                >
                  ذخیره
                </button>
              `
        }
      </form>

      <h2 class="h4">طرح‌ها (Plans)</h2>
      ${PlanGrantsEditor({
        planGrants,
        // The basic plan is never available at the course instance level; it's only
        // used for student billing for enrollments.
        excludedPlanNames: ['basic'],
        csrfToken: resLocals.__csrf_token,
        disabled: isDeleted,
      })}
      ${
        aiGradingEnabled && trpcCsrfToken
          ? hydrateHtml(
              <AdminCreditPoolSection
                trpcCsrfToken={trpcCsrfToken}
                useCustomApiKeys={course_instance.ai_grading_use_custom_api_keys}
                isDeleted={isDeleted}
                refundsEnabled={refundsEnabled}
                creditPoolLimits={creditPoolLimits}
              />,
            )
          : ''
      }
    `,
  });
}
