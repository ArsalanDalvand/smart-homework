import { z } from 'zod';

import { html } from '@prairielearn/html';

import { PageLayout } from '../../components/PageLayout.js';
import { formatGregorianTooltip, formatJalaliFriendly } from '../../lib/jalali.js';
import { compiledScriptTag } from '../../lib/assets.js';
import { GradingJobSchema, QuestionSchema, UserSchema, VariantSchema } from '../../lib/db-types.js';
import type { ResLocalsForPage } from '../../lib/res-locals.js';

export const GradingJobRowSchema = z.object({
  grading_job: GradingJobSchema,
  question_id: QuestionSchema.shape.id,
  question_qid: QuestionSchema.shape.qid,
  user_uid: UserSchema.shape.uid,
  variant_id: VariantSchema.shape.id,
  instance_question_id: VariantSchema.shape.instance_question_id,
  course_instance_id: VariantSchema.shape.course_instance_id,
});
export type GradingJobRow = z.infer<typeof GradingJobRowSchema>;

export function InstructorGradingJob({
  resLocals,
  gradingJobRow,
}: {
  resLocals: ResLocalsForPage<'course' | 'course-instance'>;
  gradingJobRow: GradingJobRow;
}) {
  const formatGradingJobDate = (date: Date | null) => {
    const tz = resLocals.course_instance?.display_timezone ?? resLocals.course.display_timezone;
    return date
      ? html`<span title="${formatGregorianTooltip(date, tz)}">${formatJalaliFriendly(date, tz)}</span>`
      : html`&mdash;`;
  };

  const variantLink =
    gradingJobRow.instance_question_id != null && gradingJobRow.course_instance_id
      ? `/pl/course_instance/${gradingJobRow.course_instance_id}/instance_question/${gradingJobRow.instance_question_id}?variant_id=${gradingJobRow.variant_id}`
      : `${resLocals.urlPrefix}/question/${gradingJobRow.question_id}/preview?variant_id=${gradingJobRow.variant_id}`;

  return PageLayout({
    resLocals,
    pageTitle: `گزارش تصحیح خودکار ${gradingJobRow.grading_job.id}`,
    navContext: {
      type: 'instructor',
      page: 'course_instance' in resLocals ? 'instance_admin' : 'course_admin',
    },
    headContent: compiledScriptTag('instructorGradingJobClient.ts'),
    content: html`
      <div class="card mb-4">
        <div class="card-header bg-primary text-white">
          <h1>گزارش تصحیح خودکار ${gradingJobRow.grading_job.id}</h1>
        </div>
        <div class="table-responsive">
          <table
            class="table table-sm table-hover two-column-description"
            aria-label="جزئیات گزارش تصحیح خودکار"
          >
            <tbody>
              <tr>
                <th>سوال</th>
                <td><a href="${variantLink}">${gradingJobRow.question_qid}</a></td>
              </tr>
              <tr>
                <th>کاربر</th>
                <td>${gradingJobRow.user_uid}</td>
              </tr>
              <tr>
                <th>زمان درخواست</th>
                <td>${formatGradingJobDate(gradingJobRow.grading_job.grading_requested_at)}</td>
              </tr>
              <tr>
                <th>زمان ارسال</th>
                <td>${formatGradingJobDate(gradingJobRow.grading_job.grading_submitted_at)}</td>
              </tr>
              <tr>
                <th>زمان دریافت</th>
                <td>${formatGradingJobDate(gradingJobRow.grading_job.grading_received_at)}</td>
              </tr>
              <tr>
                <th>زمان شروع</th>
                <td>${formatGradingJobDate(gradingJobRow.grading_job.grading_started_at)}</td>
              </tr>
              <tr>
                <th>زمان پایان</th>
                <td>${formatGradingJobDate(gradingJobRow.grading_job.grading_finished_at)}</td>
              </tr>
              <tr>
                <th>زمان نمره‌دهی</th>
                <td>${formatGradingJobDate(gradingJobRow.grading_job.graded_at)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      ${
        gradingJobRow.grading_job.s3_bucket && gradingJobRow.grading_job.s3_root_key
          ? html`
              <div class="card mb-4">
                <div class="card-header bg-primary text-white">فایل‌های قابل دانلود</div>
                <div class="table-responsive">
                  <table class="table table-sm table-hover" aria-label="فایل‌های قابل دانلود تصحیح خودکار">
                    <thead>
                      <tr>
                        <th>فایل</th>
                        <th>توضیحات</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${
                        resLocals.authz_data.has_course_permission_view
                          ? html` <tr>
                                <td>
                                  <a
                                    href="${resLocals.urlPrefix}/grading_job/${
                                      gradingJobRow.grading_job.id
                                    }/file/job.tar.gz"
                                  >
                                    job.tar.gz
                                  </a>
                                </td>
                                <td>
                                  شامل تمام فایل‌های مورد نیاز برای تصحیح؛ این فایل هنگام اجرا در
                                  مسیر <code>/grade</code> مانت می‌شود.
                                </td>
                              </tr>
                              <tr>
                                <td>
                                  <a
                                    href="${resLocals.urlPrefix}/grading_job/${
                                      gradingJobRow.grading_job.id
                                    }/file/archive.tar.gz"
                                    >archive.tar.gz</a
                                  >
                                </td>
                                <td>
                                  تصویری از وضعیت مسیر <code>/grade</code> پس از اجرای فرآیند تصحیح.
                                </td>
                              </tr>`
                          : ''
                      }
                      <tr>
                        <td>
                          <a
                            href="${resLocals.urlPrefix}/grading_job/${
                              gradingJobRow.grading_job.id
                            }/file/results.json"
                            >results.json</a
                          >
                        </td>
                        <td>
                          شامل نتایج تولیدشده توسط سامانه است که محتوای فایل
                          <code>results.json</code> و برخی فراداده‌های سامانه را در بر می‌گیرد.
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <a
                            href="${resLocals.urlPrefix}/grading_job/${
                              gradingJobRow.grading_job.id
                            }/file/output.log"
                            >output.log</a
                          >
                        </td>
                        <td>
                          شامل خروجی خام <code>stdout</code>/<code>stderr</code> برای این تصحیح است.
                          خطوطی که با <code>container&gt;</code> آغاز می‌شوند مربوط به کانتینر شما
                          هستند و بقیه خطوط گزارش‌های عیب‌یابی سامانه می‌باشند.
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            `
          : ''
      }

      <div class="card mb-4">
        <div class="card-header bg-primary text-white">خروجی تصحیح</div>
        <div class="card-body">
          ${
            gradingJobRow.grading_job.s3_bucket && gradingJobRow.grading_job.s3_root_key
              ? html`
                  <pre
                    class="bg-dark text-white rounded p-3 mb-0 d-none"
                    id="job-output"
                    data-output-url="${resLocals.urlPrefix}/grading_job/${
                      gradingJobRow.grading_job.id
                    }/file/output.log"
                  ></pre>
                  <div id="job-output-loading" class="w-100 text-center">
                    <i class="fa fa-spinner fa-spin fa-2x" aria-hidden="true"></i>
                    <span class="visually-hidden">در حال بارگذاری خروجی تصحیح…</span>
                  </div>
                `
              : gradingJobRow.grading_job.output
                ? html`
                    <pre class="bg-dark text-white rounded p-3 mb-0" id="job-output">
${gradingJobRow.grading_job.output}</pre>
                  `
                : html`
                    <pre class="bg-dark text-white rounded p-3 mb-0">
هیچ خروجی‌ای برای این تصحیح ثبت نشده است.</pre>
                  `
          }
        </div>
      </div>
    `,
  });
}
