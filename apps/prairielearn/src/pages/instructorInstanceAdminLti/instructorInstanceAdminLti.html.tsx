import { z } from 'zod';

import { escapeHtml, html } from '@prairielearn/html';

import { PageLayout } from '../../components/PageLayout.js';
import { formatGregorianTooltip, formatJalaliFriendly } from '../../lib/jalali.js';
import { config } from '../../lib/config.js';
import { AssessmentSchema, LtiCredentialSchema, LtiLinkSchema } from '../../lib/db-types.js';
import { idsEqual } from '../../lib/id.js';
import { isEnterprise } from '../../lib/license.js';
import type { UntypedResLocals } from '../../lib/res-locals.types.js';

export const LtiDataSchema = z.object({
  assessments: z
    .array(
      z.object({
        assessment_id: AssessmentSchema.shape.id,
        label: z.string(),
        title: AssessmentSchema.shape.title,
        tid: AssessmentSchema.shape.tid,
      }),
    )
    .nullable(),
  lti_credentials: z
    .array(
      z.object({
        ...LtiCredentialSchema.pick({
          id: true,
          course_instance_id: true,
          consumer_key: true,
          secret: true,
          created_at: true,
          deleted_at: true,
        }).shape,
      }),
    )
    .nullable(),
  lti_links: z
    .array(
      z.object({
        ...LtiLinkSchema.pick({
          id: true,
          resource_link_title: true,
          resource_link_description: true,
          assessment_id: true,
          created_at: true,
        }).shape,
      }),
    )
    .nullable(),
});
type LtiData = z.infer<typeof LtiDataSchema>;

export function InstructorInstanceAdminLti({
  assessments,
  lti_credentials,
  lti_links,
  resLocals,
}: {
  assessments: LtiData['assessments'];
  lti_credentials: LtiData['lti_credentials'];
  lti_links: LtiData['lti_links'];
  resLocals: UntypedResLocals;
}) {
  return PageLayout({
    resLocals,
    pageTitle: 'تنظیمات LTI',
    navContext: {
      type: 'instructor',
      page: 'instance_admin',
      subPage: 'lti',
    },
    options: {
      fullWidth: true,
    },
    content: html`
      <div class="card mb-4">
        <div class="card-header bg-primary text-white">
          <h1>تنظیمات LTI</h1>
        </div>
        <div class="card-body">
          <p>
            استاندارد LTI (Learning Tools Interoperability) به وب‌سایت‌های آموزش آنلاین دیگر اجازه
            می‌دهد آزمون‌های PrairieLearn را در خود تعبیه کنند. PrairieLearn به عنوان یک
            <em>ارائه‌دهنده ابزار (Tool Provider)</em> برای LTI عمل می‌کند. برای اطلاعات بیشتر به
            <a
              href="https://www.imsglobal.org/basic-overview-how-lti-works"
              target="_blank"
              rel="noreferrer"
            >
              نمای کلی LTI
            </a>
            مراجعه کنید.
          </p>
          <p>
            <strong>
              این نسخه از LTI منسوخ شده است.
              ${
                isEnterprise()
                  ? html`برای اطلاعات بیشتر درباره روش‌های یکپارچه‌سازی جدیدتر، تب «اتصال‌های LMS»
                    را ببینید.`
                  : html`برای روش‌های یکپارچه‌سازی جدیدتر با مدیران سامانه مشورت کنید.`
              }
            </strong>
          </p>
          ${
            !resLocals.lti11_enabled
              ? html`<p><em>نسخه LTI 1.1 برای این ترم فعال نیست.</em></p>`
              : ''
          }
        </div>
      </div>

      ${
        resLocals.lti11_enabled
          ? html`
              ${LtiCredentialCard({
                lti_credentials,
                csrfToken: resLocals.__csrf_token,
                timezone: resLocals.course_instance.display_timezone,
              })}
              ${LtiLinkTargetsCard({
                lti_links,
                assessments,
                csrfToken: resLocals.__csrf_token,
                timezone: resLocals.course_instance.display_timezone,
              })}
            `
          : ''
      }
    `,
  });
}

function LtiCredentialCard({
  lti_credentials,
  csrfToken,
  timezone,
}: {
  lti_credentials: LtiData['lti_credentials'];
  csrfToken: string;
  timezone: string;
}) {
  return html`
    <div class="card mb-4">
      <div class="card-header bg-primary text-white">اعتبارنامه‌های LTI</div>
      <div class="card-body">
        <p class="mb-0">
          از این اعتبارنامه‌ها در سامانه مدیریت یادگیری (LMS) خود برای اتصال به این ترم استفاده
          کنید. یک اعتبارنامه را می‌توان برای چندین لینک به اشتراک گذاشت.
        </p>
      </div>

      <div class="table-responsive">
        <table class="table table-sm table-hover" aria-label="اعتبارنامه‌های LTI">
          <thead>
            <tr>
              <th>نشانی راه‌اندازی (Launch URL)</th>
              <th>کلید مصرف‌کننده (Consumer key)</th>
              <th>رمز مشترک (Shared secret)</th>
              <th>تاریخ ایجاد</th>
              <th>تاریخ حذف</th>
            </tr>
          </thead>
          <tbody>
            ${
              lti_credentials
                ? lti_credentials.map(
                    (tc) => html`
                      <tr>
                        <td>
                          <code>${config.ltiRedirectUrl}</code>
                          <button
                            type="button"
                            class="btn btn-sm btn-ghost js-copy-button"
                            data-clipboard-text="${config.ltiRedirectUrl}"
                            aria-label="کپی نشانی تغییرمسیر در حافظه"
                          >
                            <i class="bi bi-clipboard"></i>
                          </button>
                        </td>
                        <td>
                          <code>${tc.consumer_key}</code>
                          <button
                            type="button"
                            class="btn btn-sm btn-ghost js-copy-button"
                            data-clipboard-text="${tc.consumer_key}"
                            aria-label="کپی کلید مصرف‌کننده در حافظه"
                          >
                            <i class="bi bi-clipboard"></i>
                          </button>
                        </td>
                        <td>
                          <code>${tc.secret}</code>
                          <button
                            type="button"
                            class="btn btn-sm btn-ghost js-copy-button"
                            data-clipboard-text="${tc.secret}"
                            aria-label="کپی رمز مشترک در حافظه"
                          >
                            <i class="bi bi-clipboard"></i>
                          </button>
                        </td>
                        <td>${html`<span title="${formatGregorianTooltip(tc.created_at!, timezone)}">${formatJalaliFriendly(tc.created_at!, timezone)}</span>`}</td>
                        <td>
                          ${
                            tc.deleted_at != null
                              ? html`<span title="${formatGregorianTooltip(tc.deleted_at, timezone)}">${formatJalaliFriendly(tc.deleted_at, timezone)}</span>`
                              : html`
                                  <button
                                    type="button"
                                    class="btn btn-sm btn-danger"
                                    data-bs-toggle="popover"
                                    data-bs-container="body"
                                    data-bs-html="true"
                                    data-bs-placement="auto"
                                    data-bs-title="تأیید حذف"
                                    data-bs-content="${escapeHtml(html`
                                      <form method="post">
                                        <input type="hidden" name="__action" value="lti_del_cred" />
                                        <input
                                          type="hidden"
                                          name="__csrf_token"
                                          value="${csrfToken}"
                                        />
                                        <input type="hidden" name="lti_link_id" value="${tc.id}" />
                                        <input
                                          type="submit"
                                          class="btn btn-danger"
                                          value="حذف"
                                        />
                                      </form>
                                    `)}"
                                  >
                                    حذف
                                  </button>
                                `
                          }
                        </td>
                      </tr>
                    `,
                  )
                : html`
                    <tr>
                      <td colspan="5">
                        <em>هیچ اعتبارنامه LTI ایجاد نشده است.</em>
                      </td>
                    </tr>
                  `
            }
          </tbody>
        </table>
      </div>

      <div class="card-body">
        <form method="post">
          <input type="hidden" name="__action" value="lti_new_cred" />
          <input type="hidden" name="__csrf_token" value="${csrfToken}" />
          <button type="submit" class="btn btn-success">ایجاد اعتبارنامه LTI جدید</button>
        </form>
      </div>
    </div>
  `;
}

function LtiLinkTargetsCard({
  lti_links,
  assessments,
  csrfToken,
  timezone,
}: {
  lti_links: LtiData['lti_links'];
  assessments: LtiData['assessments'];
  csrfToken: string;
  timezone: string;
}) {
  return html`
    <div class="card mb-4">
      <div class="card-header bg-primary text-white">مقصد لینک‌های LTI</div>
      <div class="card-body">
        <p>
          لینک‌های LTI یک آزمون در LMS شما را مستقیماً به یک آزمون در PrairieLearn متصل می‌کنند.
          این کار برای به‌روزرسانی نمرات توسط PrairieLearn در LMS شما ضروری است.
        </p>
        <p class="mb-0">
          برای ایجاد لینک، ابتدا لینک را در LMS خود ساخته و باز کنید، سپس آن را در اینجا تنظیم نمایید.
        </p>
      </div>

      <div class="table-responsive">
        <table class="table table-sm table-hover" aria-label="مقصد لینک‌های LTI">
          <thead>
            <tr>
              <th>اطلاعات لینک</th>
              <th>آزمون</th>
              <th>اولین مشاهده لینک</th>
            </tr>
          </thead>
          <tbody>
            ${
              lti_links
                ? lti_links.map(
                    (link) => html`
                      <tr>
                        <td title="${link.resource_link_description}">
                          ${link.resource_link_title}
                        </td>
                        <td>
                          <form method="post">
                            <input type="hidden" name="__action" value="lti_link_target" />
                            <input type="hidden" name="__csrf_token" value="${csrfToken}" />
                            <input type="hidden" name="lti_link_id" value="${link.id}" />
                            <select
                              class="form-select"
                              onchange="this.form.submit();"
                              name="newAssessment"
                            >
                              <option value="" ${!link.assessment_id ? 'selected' : ''}>
                                -- هیچ‌کدام
                              </option>
                              ${assessments?.map(
                                (a) => html`
                                  <option
                                    value="${a.assessment_id}"
                                    ${
                                      link.assessment_id &&
                                      idsEqual(link.assessment_id, a.assessment_id)
                                        ? 'selected'
                                        : ''
                                    }
                                  >
                                    ${a.label}: ${a.title} (${a.tid})
                                  </option>
                                `,
                              )}
                            </select>
                          </form>
                        </td>
                        <td>${html`<span title="${formatGregorianTooltip(link.created_at, timezone)}">${formatJalaliFriendly(link.created_at, timezone)}</span>`}</td>
                      </tr>
                    `,
                  )
                : html`
                    <tr>
                      <td colspan="3">
                        <em>هیچ لینک LTI ایجاد نشده است.</em>
                      </td>
                    </tr>
                  `
            }
          </tbody>
        </table>
      </div>
    </div>
  `;
}
