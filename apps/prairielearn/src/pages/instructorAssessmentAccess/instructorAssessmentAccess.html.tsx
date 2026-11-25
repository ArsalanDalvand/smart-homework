import { z } from 'zod';

import { formatDate } from '@prairielearn/formatter';
import { html } from '@prairielearn/html';
import { Hydrate } from '@prairielearn/react/server';

import { CommentPopoverHtml } from '../../components/CommentPopover.js';
import { Modal } from '../../components/Modal.js';
import { PageLayout } from '../../components/PageLayout.js';
import type { AssessmentMigrationAnalysis } from '../../lib/assessment-access-control/migration.js';
import { compiledStylesheetTag } from '../../lib/assets.js';
import { extractPageContext } from '../../lib/client/page-context.js';
import { isRenderableComment } from '../../lib/comments.js';
import { config } from '../../lib/config.js';
import { AssessmentAccessRuleSchema } from '../../lib/db-types.js';
import type { ResLocalsForPage } from '../../lib/res-locals.js';
import type {
  AccessControlJsonWithId,
  PrairieTestExamMetadata,
} from '../../models/assessment-access-control-rules.js';

import {
  AssessmentAccessControl,
  type AssessmentAccessControlPermissions,
} from './components/AssessmentAccessControl.js';

export const AssessmentAccessRuleRowSchema = z.object({
  rule: AssessmentAccessRuleSchema,
  pt_course_id: z.string().nullable(),
  pt_course_name: z.string().nullable(),
  pt_exam_id: z.string().nullable(),
  pt_exam_name: z.string().nullable(),
});
type AssessmentAccessRuleRow = z.infer<typeof AssessmentAccessRuleRowSchema>;

interface MigrationPreview {
  beforeJson: string;
  afterJson: string;
  errors: string[];
  notes: string[];
  hasUidRules: boolean;
  isIncompatible: boolean;
  fallbackReleaseDate: string;
}

export function InstructorAssessmentAccess({
  resLocals,
  accessRules,
  migrationAnalysis,
  migrationPreview,
  origHash,
  canEdit,
}: {
  resLocals: ResLocalsForPage<'assessment'>;
  accessRules: AssessmentAccessRuleRow[];
  migrationAnalysis: AssessmentMigrationAnalysis | null;
  migrationPreview: MigrationPreview | null;
  origHash: string;
  canEdit: boolean;
}) {
  const showComments = accessRules.some((access_rule) =>
    isRenderableComment(access_rule.rule.json_comment),
  );
  return PageLayout({
    resLocals,
    pageTitle: 'کنترل دسترسی',
    navContext: {
      type: 'instructor',
      page: 'assessment',
      subPage: 'access',
    },
    options: {
      fullWidth: true,
    },
    content: html`
      <div class="card mb-4" style="font-family: var(--font-persian);">
        <div class="card-header bg-primary text-white d-flex align-items-center">
          <h1 class="h4 mb-0">${resLocals.assessment_set.name} ${resLocals.assessment.number}: قوانین دسترسی</h1>
          ${
            migrationPreview && canEdit
              ? html`
                  <button
                    type="button"
                    class="btn btn-light btn-sm ms-auto"
                    data-bs-toggle="modal"
                    data-bs-target="#migrationConfirmModal"
                  >
                    ${
                      migrationPreview.isIncompatible
                        ? 'مهاجرت و پاک‌سازی'
                        : 'مهاجرت به قالب جدید انتشار'
                    }
                  </button>
                `
              : ''
          }
        </div>

        <div class="alert alert-warning mb-0 rounded-0 border-start-0 border-end-0 border-top-0">
          ${
            migrationAnalysis && migrationAnalysis.errors.length > 0
              ? html`این آزمون از سیستم قدیمی قوانین دسترسی استفاده می‌کند. مهاجرت خودکار برای این آزمون در دسترس نیست.`
              : html`این آزمون از سیستم قدیمی قوانین دسترسی استفاده می‌کند. پیشنهاد می‌شود جهت مدیریت بهتر دسترسی‌ها به سیستم جدید مهاجرت نمایید.`
          }
        </div>

        <div class="table-responsive">
          <table class="table table-sm table-hover" aria-label="قوانین دسترسی آزمون">
            <thead>
              <tr>
                ${
                  showComments
                    ? html`<th style="width: 1%"><span class="visually-hidden">توضیحات</span></th>`
                    : ''
                }
                <th>حالت دسترسی</th>
                <th>شناسه‌ها (UIDs)</th>
                <th>تاریخ شروع</th>
                <th>تاریخ پایان</th>
                <th>فعال</th>
                <th>اعتبار نمره</th>
                <th>محدودیت زمانی</th>
                <th>رمز عبور</th>
                <th>سامانه آزمون</th>
              </tr>
            </thead>
            <tbody>
              ${accessRules.map((access_rule) => {
                // Only users with permission to view student data are allowed
                // to see the list of uids associated with an access rule. Note,
                // however, that any user with permission to view course code
                // (or with access to the course git repository) will be able to
                // see the list of uids, because these access rules are defined
                // in course code. This should be changed in future, to protect
                // student data. See https://github.com/PrairieLearn/PrairieLearn/issues/3342
                return html`
                  <tr>
                    ${
                      showComments
                        ? html`<td>${CommentPopoverHtml(access_rule.rule.json_comment)}</td>`
                        : ''
                    }
                    <td>${access_rule.rule.mode ?? '—'}</td>
                    <td>
                      ${
                        access_rule.rule.uids == null ||
                        resLocals.authz_data.has_course_instance_permission_view
                          ? (access_rule.rule.uids?.join(', ') ?? '—')
                          : html`
                              <button
                                type="button"
                                class="btn btn-xs btn-warning"
                                data-bs-toggle="popover"
                                data-bs-container="body"
                                data-bs-placement="auto"
                                data-bs-title="شناسه‌های پنهان"
                                data-bs-content="این قانون دسترسی مختص دانشجویان خاصی است. برای مشاهده آن‌ها به دسترسی مشاهده داده‌های دانشجو نیاز دارید."
                              >
                                پنهان
                              </button>
                            `
                      }
                    </td>
                    <td>
                      ${
                        access_rule.rule.start_date == null
                          ? '—'
                          : formatDate(
                              access_rule.rule.start_date,
                              resLocals.course_instance.display_timezone,
                            )
                      }
                    </td>
                    <td>
                      ${
                        access_rule.rule.end_date == null
                          ? '—'
                          : formatDate(
                              access_rule.rule.end_date,
                              resLocals.course_instance.display_timezone,
                            )
                      }
                    </td>
                    <td>${access_rule.rule.active ? 'بله' : 'خیر'}</td>
                    <td>
                      ${access_rule.rule.credit == null ? '—' : `${access_rule.rule.credit}%`}
                    </td>
                    <td>
                      ${
                        access_rule.rule.time_limit_min == null
                          ? '—'
                          : `${access_rule.rule.time_limit_min} دقیقه`
                      }
                    </td>
                    <td>${access_rule.rule.password ?? '—'}</td>
                    <td>
                      ${
                        access_rule.pt_exam_name
                          ? html`
                              <a
                                href="${config.ptHost}/pt/course/${access_rule.pt_course_id}/staff/exam/${access_rule.pt_exam_id}"
                              >
                                ${access_rule.pt_course_name}: ${access_rule.pt_exam_name}
                              </a>
                            `
                          : access_rule.rule.exam_uuid
                            ? config.devMode
                              ? access_rule.rule.exam_uuid
                              : html`
                                  <span class="text-danger">
                                    آزمون یافت نشد: ${access_rule.rule.exam_uuid}
                                  </span>
                                `
                            : html`&mdash;`
                      }
                    </td>
                  </tr>
                `;
              })}
            </tbody>
          </table>
        </div>
        <div class="card-footer">
          <small>
            راهنمای نحوه تغییر قوانین دسترسی در
            <a
              href="https://docs.prairielearn.com/assessment/accessControlLegacy/"
              target="_blank"
              rel="noreferrer"
              >مستندات PrairieLearn</a
            >
            موجود است. توجه داشته باشید که تغییر قوانین محدودیت زمانی بر آزمون‌های در حال اجرا تاثیر
            نمی‌گذارد؛ برای تغییر محدودیت زمانی این آزمون‌ها به
            <a href="${resLocals.urlPrefix}/assessment/${resLocals.assessment.id}/instances"
              >بخش دانشجویان</a
            >
            مراجعه کنید.</small
          >
        </div>
      </div>

      ${
        migrationPreview && canEdit
          ? MigrationConfirmModal({ migrationPreview, resLocals, origHash })
          : ''
      }
    `,
  });
}

function MigrationConfirmModal({
  migrationPreview,
  resLocals,
  origHash,
}: {
  migrationPreview: MigrationPreview;
  resLocals: ResLocalsForPage<'assessment'>;
  origHash: string;
}) {
  return Modal({
    id: 'migrationConfirmModal',
    title: 'مهاجرت به قالب جدید',
    size: 'modal-xl',
    content: html`
      <div class="modal-body">
        ${
          migrationPreview.isIncompatible
            ? html`
                <div class="alert alert-danger">
                  <i class="bi bi-exclamation-triangle-fill"></i>
                  قوانین دسترسی این آزمون به صورت خودکار قابل مهاجرت نیستند. ادامه دادن باعث
                  <strong>حذف تمام قوانین دسترسی فعلی</strong> و تغییر به قالب جدید بدون تنظیم
                  قانون دسترسی می‌شود. لازم است کنترل دسترسی را از ابتدا تنظیم کنید.
                </div>
              `
            : ''
        }
        ${
          migrationPreview.hasUidRules
            ? html`
                <div class="alert alert-warning">
                  <i class="bi bi-exclamation-triangle-fill"></i>
                  این آزمون دارای قوانین دسترسی مبتنی بر UID است که در هنگام مهاجرت حذف می‌شوند.
                  قوانین مبتنی بر UID در قالب جدید پشتیبانی نمی‌شوند.
                </div>
              `
            : ''
        }
        ${
          migrationPreview.errors.length > 0
            ? html`
                <div class="alert alert-danger">
                  <i class="bi bi-exclamation-triangle-fill"></i>
                  <ul class="mb-0 mt-1">
                    ${migrationPreview.errors.map((e) => html`<li>${e}</li>`)}
                  </ul>
                </div>
              `
            : ''
        }
        ${
          migrationPreview.notes.length > 0
            ? html`
                <div class="alert alert-info">
                  <i class="bi bi-info-circle-fill"></i>
                  <strong>نکات مهاجرت:</strong>
                  <ul class="mb-0 mt-1">
                    ${migrationPreview.notes.map((w) => html`<li>${w}</li>`)}
                  </ul>
                </div>
              `
            : ''
        }
        <p>
          برای جزئیات بیشتر درباره قالب جدید،
          <a
            href="https://docs.prairielearn.com/assessment/accessControl/"
            target="_blank"
            rel="noreferrer"
          >
            مستندات کنترل دسترسی
          </a>
          را ببینید.
        </p>
        <p class="text-muted small mb-2">
          فایل <code>infoAssessment.json</code> فعلی را با نسخه مهاجرت‌یافته در زیر مقایسه کنید.
          <strong>حالت قبلی</strong> قوانین قدیمی <code>allowAccess</code> و
          <strong>حالت جدید</strong> قالب جدید <code>accessControl</code> را که جایگزین آن‌ها
          می‌شود نشان می‌دهد.
        </p>
        <ul class="nav nav-tabs" role="tablist">
          <li class="nav-item" role="presentation">
            <button
              class="nav-link active"
              data-bs-toggle="tab"
              data-bs-target="#migration-before"
              type="button"
              role="tab"
              aria-controls="migration-before"
              aria-selected="true"
            >
              حالت قبلی
            </button>
          </li>
          <li class="nav-item" role="presentation">
            <button
              class="nav-link"
              data-bs-toggle="tab"
              data-bs-target="#migration-after"
              type="button"
              role="tab"
              aria-controls="migration-after"
              aria-selected="false"
            >
              حالت جدید
            </button>
          </li>
        </ul>
        <div class="tab-content border border-top-0 rounded-bottom">
          <div class="tab-pane fade show active p-3" id="migration-before" role="tabpanel">
            <pre
              style="max-height: 400px; overflow-y: auto;"
              class="mb-0"
              dir="ltr"
            ><code>${migrationPreview.beforeJson}</code></pre>
          </div>
          <div class="tab-pane fade p-3" id="migration-after" role="tabpanel">
            <pre
              style="max-height: 400px; overflow-y: auto;"
              class="mb-0"
              dir="ltr"
            ><code>${migrationPreview.afterJson}</code></pre>
          </div>
        </div>
      </div>
    `,
    footer: html`
      <input type="hidden" name="__action" value="migrate_access_control" />
      <input type="hidden" name="__csrf_token" value="${resLocals.__csrf_token}" />
      <input type="hidden" name="orig_hash" value="${origHash}" />
      <input
        type="hidden"
        name="fallback_release_date"
        value="${migrationPreview.fallbackReleaseDate}"
      />
      ${
        migrationPreview.isIncompatible
          ? html`<input type="hidden" name="migrate_strategy" value="clear" />`
          : ''
      }
      <small class="text-muted me-auto">
        این عملیات از طریق ویرایشگر فایل یا تاریخچه گیت قابل بازگردانی است.
      </small>
      <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">انصراف</button>
      <button
        type="submit"
        class="btn ${migrationPreview.isIncompatible ? 'btn-danger' : 'btn-primary'}"
      >
        ${migrationPreview.isIncompatible ? 'مهاجرت و پاک‌سازی' : 'تایید و اعمال مهاجرت'}
      </button>
    `,
  });
}

export function InstructorAssessmentAccessNew({
  resLocals,
  origHash,
  trpcCsrfToken,
  initialData,
  prairieTestExamMetadata,
  ptHost,
  permissions,
  hiddenEnrollmentRuleCount,
}: {
  resLocals: ResLocalsForPage<'assessment'>;
  origHash: string | null;
  trpcCsrfToken: string;
  initialData: AccessControlJsonWithId[];
  prairieTestExamMetadata: PrairieTestExamMetadata[];
  ptHost: string;
  permissions: AssessmentAccessControlPermissions;
  hiddenEnrollmentRuleCount: number;
}) {
  const pageContext = extractPageContext(resLocals, {
    pageType: 'courseInstance',
    accessType: 'instructor',
  });

  return PageLayout({
    resLocals,
    pageTitle: 'قوانین دسترسی و انتشار',
    headContent: [
      compiledStylesheetTag('splitPane.css'),
      compiledStylesheetTag('instructorAssessmentAccess.css'),
    ],
    navContext: {
      type: 'instructor',
      page: 'assessment',
      subPage: 'access',
    },
    options: {
      fullWidth: true,
      contentPadding: false,
    },
    content: (
      <Hydrate>
        <AssessmentAccessControl
          courseInstance={pageContext.course_instance}
          csrfToken={trpcCsrfToken}
          origHash={origHash}
          assessmentId={resLocals.assessment.id}
          isExam={resLocals.assessment.type === 'Exam'}
          hasExamAutoClose={
            resLocals.assessment.type === 'Exam' && (resLocals.assessment.auto_close ?? true)
          }
          initialData={initialData}
          prairieTestExamMetadata={prairieTestExamMetadata}
          ptHost={ptHost}
          permissions={permissions}
          hiddenEnrollmentRuleCount={hiddenEnrollmentRuleCount}
        />
      </Hydrate>
    ),
  });
}
