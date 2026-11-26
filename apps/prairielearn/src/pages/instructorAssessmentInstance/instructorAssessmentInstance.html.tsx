import { UAParser } from 'ua-parser-js';
import { z } from 'zod';

import { formatInterval } from '@prairielearn/formatter';
import { escapeHtml, html } from '@prairielearn/html';
import { hydrateHtml } from '@prairielearn/react/server';
import { run } from '@prairielearn/run';
import { DateFromISOString, IdSchema } from '@prairielearn/zod';

import { EditQuestionPointsScoreButtonHtml } from '../../components/EditQuestionPointsScore.js';
import { formatGregorianTooltip, formatJalaliFriendly } from '../../lib/jalali.js';
import { Modal } from '../../components/Modal.js';
import { PageLayout } from '../../components/PageLayout.js';
import { InstanceQuestionPoints } from '../../components/QuestionScore.js';
import { ScorebarHtml } from '../../components/Scorebar.js';
import { type InstanceLogEntry } from '../../lib/assessment.js';
import { compiledScriptTag, nodeModulesAssetPath } from '../../lib/assets.js';
import { getInstanceQuestionUrl, getQuestionUrl } from '../../lib/client/url.js';
import {
  type Assessment,
  AssessmentQuestionSchema,
  type ClientFingerprint,
  InstanceQuestionSchema,
  VariantSchema,
} from '../../lib/db-types.js';
import { formatFloat, formatPoints } from '../../lib/format.js';
import { idsEqual } from '../../lib/id.js';
import type { ResLocalsForPage } from '../../lib/res-locals.js';
import type { AssessmentInstanceActionRow } from '../instructorAssessmentInstances/instructorAssessmentInstances.types.js';

import { InstructorAssessmentInstanceActions } from './components/InstructorAssessmentInstanceActions.js';

export const AssessmentInstanceStatsSchema = z.object({
  assessment_instance_id: IdSchema,
  average_submission_score: z.number().nullable(),
  client_fingerprint_id_change_count: z.number(),
  first_submission_score: z.number().nullable(),
  incremental_submission_points_array: z.array(z.number().nullable()).nullable(),
  incremental_submission_score_array: z.array(z.number().nullable()).nullable(),
  instance_question_id: IdSchema,
  last_submission_score: z.number().nullable(),
  max_submission_score: z.number().nullable(),
  number: z.string().nullable(),
  qid: z.string(),
  question_id: IdSchema,
  some_nonzero_submission: z.boolean().nullable(),
  some_perfect_submission: z.boolean().nullable(),
  some_submission: z.boolean().nullable(),
  submission_score_array: z.array(z.number().nullable()).nullable(),
  title: z.string().nullable(),
});
type AssessmentInstanceStats = z.infer<typeof AssessmentInstanceStatsSchema>;

export const InstanceQuestionRowSchema = InstanceQuestionSchema.extend({
  instructor_question_number: z.string(),
  assessment_question: AssessmentQuestionSchema,
  last_variant_id: VariantSchema.shape.id.nullable(),
  last_variant_seed: VariantSchema.shape.variant_seed.nullable(),
  lockpoint: z.boolean(),
  lockpoint_crossed: z.boolean(),
  lockpoint_crossed_at: DateFromISOString.nullable(),
  lockpoint_crossed_authn_user_uid: z.string().nullable(),
  qid: z.string().nullable(),
  question_id: IdSchema,
  question_number: z.string(),
  question_title: z.string().nullable(),
  row_order: z.number(),
  start_new_zone: z.boolean(),
  zone_best_questions: z.number().nullable(),
  zone_has_best_questions: z.boolean(),
  zone_has_max_points: z.boolean(),
  zone_id: IdSchema,
  zone_max_points: z.number().nullable(),
  zone_title: z.string().nullable(),
});
type InstanceQuestionRow = z.infer<typeof InstanceQuestionRowSchema>;

const FINGERPRINT_COLORS = ['red2', 'orange2', 'green2', 'blue2', 'turquoise2', 'purple2'];

export function InstructorAssessmentInstance({
  resLocals,
  logCsvFilename,
  assessment_instance_stats,
  instance_questions,
  assessmentInstanceLog,
  actionRow,
  trpcCsrfToken,
}: {
  resLocals: ResLocalsForPage<'assessment-instance'>;
  logCsvFilename: string;
  assessment_instance_stats: AssessmentInstanceStats[];
  instance_questions: InstanceQuestionRow[];
  assessmentInstanceLog: InstanceLogEntry[];
  actionRow: AssessmentInstanceActionRow;
  trpcCsrfToken: string;
}) {
  const headingLabel = resLocals.instance_group
    ? html`${resLocals.instance_group.name} <i class="fas fa-users"></i>`
    : html`${resLocals.instance_user.name} (${resLocals.instance_user.uid})`;

  return PageLayout({
    resLocals,
    pageTitle: resLocals.instance_group?.name ?? resLocals.instance_user?.uid ?? '',
    navContext: {
      type: 'instructor',
      page: 'assessment',
      subPage: 'assessment_instance',
    },
    options: {
      fullWidth: true,
    },
    headContent: html`
      <link
        href="${nodeModulesAssetPath('tablesorter/dist/css/theme.bootstrap.min.css')}"
        rel="stylesheet"
      />
      ${compiledScriptTag('instructorAssessmentInstanceClient.ts')}
      <script src="${nodeModulesAssetPath(
          'tablesorter/dist/js/jquery.tablesorter.min.js',
        )}"></script>
      <script src="${nodeModulesAssetPath(
          'tablesorter/dist/js/jquery.tablesorter.widgets.min.js',
        )}"></script>
    `,
    content: html`
      <h1 class="visually-hidden">
        نمونه ${resLocals.assessment_instance_label} برای
        ${
          resLocals.instance_group
            ? html`${resLocals.instance_group.name}`
            : html`${resLocals.instance_user.name}`
        }
      </h1>
      ${ResetQuestionVariantsModal({
        assessment: resLocals.assessment,
        csrfToken: resLocals.__csrf_token,
      })}
      ${ExamResetNotSupportedModal({ assessment: resLocals.assessment })}
      <div class="card mb-4">
        <div
          class="card-header bg-primary text-white d-flex align-items-center justify-content-between"
          style="font-family: var(--font-persian);"
        >
          <h2 class="mb-0 h4">خلاصه وضعیت ${resLocals.assessment_instance_label}: ${headingLabel}</h2>
          ${
            resLocals.authz_data.has_course_instance_permission_edit &&
            resLocals.instance_group?.deleted_at == null
              ? hydrateHtml(
                  <InstructorAssessmentInstanceActions
                    instance={actionRow}
                    courseInstanceId={resLocals.course_instance.id}
                    assessmentId={resLocals.assessment.id}
                    trpcCsrfToken={trpcCsrfToken}
                    timezone={resLocals.course_instance.display_timezone}
                  />,
                )
              : ''
          }
        </div>
        <div class="table-responsive">
          <table
            class="table table-sm table-hover two-column-description"
            aria-label="خلاصه وضعیت آزمون دانشجو"
          >
            <tbody>
              ${
                resLocals.instance_group
                  ? html`
                      <tr>
                        <th>نام گروه</th>
                        <td colspan="2">${resLocals.instance_group.name}</td>
                      </tr>
                      <tr>
                        <th>اعضای گروه</th>
                        <td colspan="2">${resLocals.instance_group_uid_list.join(', ')}</td>
                      </tr>
                    `
                  : html`
                      <tr>
                        <th>شناسه کاربری (UID / ایمیل)</th>
                        <td colspan="2">${resLocals.instance_user.uid}</td>
                      </tr>
                      <tr>
                        <th>نام و نام خانوادگی</th>
                        <td colspan="2">${resLocals.instance_user.name}</td>
                      </tr>
                      <tr>
                        <th>نقش</th>
                        <td colspan="2">${resLocals.instance_role}</td>
                      </tr>
                    `
              }
              <tr>
                <th>نوبت آزمون</th>
                <td colspan="2">
                  ${resLocals.assessment_instance.number} (<a
                    href="/pl/course_instance/${
                      resLocals.course_instance.id
                    }/assessment_instance/${resLocals.assessment_instance.id}"
                    >مشاهده از دید فراگیر</a
                  >)
                </td>
              </tr>
              ${
                resLocals.instance_user
                  ? html`
                      <tr>
                        <th>تغییرات اثرانگشت کلاینت</th>
                        <td colspan="2">
                          ${resLocals.assessment_instance.client_fingerprint_id_change_count}
                          <button
                            type="button"
                            class="btn btn-xs btn-ghost"
                            id="fingerprintDescriptionPopover"
                            data-bs-toggle="popover"
                            data-bs-container="body"
                            data-bs-html="false"
                            data-bs-title="تغییرات اثرانگشت دستگاه کلاینت"
                            data-bs-content="اثرانگشت کلاینت شامل ثبت آدرس IP، مشخصات مرورگر و نشست کاربری در طول مدت آزمون است. تغییر مکرر این مشخصات ممکن است نشان‌دهنده ورود همزمان چند نفر به یک آزمون باشد."
                          >
                            <i class="fa fa-question-circle"></i>
                          </button>
                        </td>
                      </tr>
                    `
                  : ''
              }

              <tr>
                <th>نمره کل / امتیازات</th>
                <td colspan="2">
                  <span id="total-points">
                    ${formatPoints(resLocals.assessment_instance.points)}
                  </span>
                  <small>
                    /<span id="total-max-points" class="text-muted"
                      >${formatPoints(resLocals.assessment_instance.max_points)}
                    </span>
                  </small>
                  ${
                    resLocals.authz_data.has_course_instance_permission_edit
                      ? html`
                          <button
                            type="button"
                            class="btn btn-xs btn-secondary"
                            id="editTotalPointsButton"
                            data-bs-toggle="popover"
                            data-bs-container="body"
                            data-bs-html="true"
                            data-bs-placement="auto"
                            data-bs-title="ویرایش نمره کل"
                            data-bs-content="${escapeHtml(
                              EditTotalPointsForm({
                                resLocals,
                              }),
                            )}"
                          >
                            <i class="fa fa-edit" aria-hidden="true"></i>
                          </button>
                        `
                      : ''
                  }
                </td>
              </tr>
              <tr>
                <th>درصد نمره</th>
                <td class="align-middle" style="width: 20%;">
                  ${ScorebarHtml(resLocals.assessment_instance.score_perc)}
                </td>
                <td class="align-middle" style="width: 100%;">
                  ${
                    resLocals.authz_data.has_course_instance_permission_edit
                      ? html`
                          <button
                            type="button"
                            class="btn btn-xs btn-secondary"
                            id="editTotalScorePercButton"
                            data-bs-toggle="popover"
                            data-bs-container="body"
                            data-bs-html="true"
                            data-bs-placement="auto"
                            data-bs-title="ویرایش درصد نمره کل"
                            data-bs-content="${escapeHtml(
                              EditTotalScorePercForm({
                                resLocals,
                              }),
                            )}"
                          >
                            <i class="fa fa-edit" aria-hidden="true"></i>
                          </button>
                        `
                      : ''
                  }
                </td>
              </tr>
              <tr>
                <th>محاسبه در آمار</th>
                <td colspan="2">
                  ${
                    resLocals.assessment_instance.include_in_statistics
                      ? html`
                          لحاظ‌شده در آمار
                          <button
                            type="button"
                            class="btn btn-xs btn-ghost"
                            data-bs-toggle="popover"
                            data-bs-container="body"
                            data-bs-html="true"
                            data-bs-title="لحاظ‌شده در آمار"
                            data-bs-content="نتایج این آزمون در محاسبات آماری سوالات و آزمون لحاظ می‌گردد."
                          >
                            <i class="fa fa-question-circle"></i>
                          </button>
                        `
                      : html`
                          لحاظ‌نشده در آمار
                          <button
                            type="button"
                            class="btn btn-xs btn-ghost"
                            data-bs-toggle="popover"
                            data-bs-container="body"
                            data-bs-html="true"
                            data-bs-title="لحاظ‌نشده در آمار"
                            data-bs-content="این آزمون به دلیل ثبت توسط کادر آموزشی در آمار دانشجویان لحاظ نمی‌شود."
                          >
                            <i class="fa fa-question-circle"></i>
                          </button>
                        `
                  }
                </td>
              </tr>
              <tr>
                <th>زمان شروع آزمون</th>
                <td colspan="2">
                  ${html`<span title="${formatGregorianTooltip(resLocals.assessment_instance.date!, resLocals.course_instance.display_timezone)}">${formatJalaliFriendly(resLocals.assessment_instance.date!, resLocals.course_instance.display_timezone)}</span>`}
                </td>
              </tr>
              <tr>
                <th>مدت زمان آزمون</th>
                <td colspan="2">${formatInterval(resLocals.assessment_instance.duration ?? 0)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="card mb-4" style="font-family: var(--font-persian);">
        <div class="card-header bg-primary text-white">
          <h2 class="h5 mb-0">سوالات آزمون ${resLocals.assessment_instance_label}: ${headingLabel}</h2>
        </div>

        <div class="table-responsive">
          <table
            id="instanceQuestionList"
            class="table table-sm table-hover"
            aria-label="سوالات آزمون"
          >
            <thead>
              <tr>
                <th>سوال از دید فراگیر</th>
                <th>سوال از دید مدرس</th>
                <th class="text-center">نمره خودکار</th>
                <th class="text-center">نمره تصحیح دستی</th>
                <th class="text-center">امتیاز نهایی</th>
                <th class="text-center" colspan="2" scope="colgroup">درصد نمره</th>
                <th><!--Manual grading column --></th>
                <th class="text-end">عملیات</th>
              </tr>
            </thead>
            ${run(() => {
              const zoneGroups: InstanceQuestionRow[][] = [];
              instance_questions.forEach((instance_question) => {
                if (instance_question.start_new_zone || zoneGroups.length === 0) {
                  zoneGroups.push([instance_question]);
                } else {
                  zoneGroups[zoneGroups.length - 1].push(instance_question);
                }
              });

              let previousZoneHadInfo = false;

              return zoneGroups.map((zoneRows) => {
                const firstQuestion = zoneRows[0];
                const zoneHasInfo =
                  firstQuestion.zone_title != null ||
                  firstQuestion.zone_has_max_points ||
                  firstQuestion.zone_has_best_questions;

                // Show zone info if this zone has info, or if the previous zone
                // had info (blank zone info to visually separate).
                const showZoneInfo = zoneHasInfo || previousZoneHadInfo;

                previousZoneHadInfo = zoneHasInfo;

                return html`
                  <tbody>
                    ${
                      firstQuestion.lockpoint
                        ? html`
                            <tr>
                              <td colspan="9" class="bg-light">
                                ${
                                  firstQuestion.lockpoint_crossed
                                    ? html`
                                        نقطه قفل (Lockpoint) توسط
                                        ${
                                          firstQuestion.lockpoint_crossed_authn_user_uid ??
                                          'کاربر ناشناس'
                                        }
                                        ${
                                          firstQuestion.lockpoint_crossed_at
                                            ? html`در زمان
                                              ${html`<span title="${formatGregorianTooltip(firstQuestion.lockpoint_crossed_at, resLocals.course_instance.display_timezone)}">${formatJalaliFriendly(firstQuestion.lockpoint_crossed_at, resLocals.course_instance.display_timezone)}</span>`}`
                                            : ''
                                        }
                                        عبور داده شد
                                      `
                                    : html`نقطه قفل (Lockpoint) هنوز عبور داده نشده است`
                                }
                              </td>
                            </tr>
                          `
                        : ''
                    }
                    ${
                      showZoneInfo
                        ? html`
                            <tr>
                              <th colspan="9" scope="rowgroup">
                                ${
                                  zoneHasInfo
                                    ? (() => {
                                        const constraints = [
                                          firstQuestion.zone_has_max_points
                                            ? `حداکثر ${firstQuestion.zone_max_points} امتیاز`
                                            : null,
                                          firstQuestion.zone_has_best_questions
                                            ? `${firstQuestion.zone_best_questions} سوال برتر`
                                            : null,
                                        ].filter(Boolean);

                                        if (firstQuestion.zone_title) {
                                          // Title with optional constraints in parentheses
                                          return constraints.length > 0
                                            ? `${firstQuestion.zone_title} (${constraints.join(', ')})`
                                            : firstQuestion.zone_title;
                                        } else {
                                          // No title - capitalize the first constraint
                                          const text = constraints.join(', ');
                                          return text;
                                        }
                                      })()
                                    : html`&nbsp;`
                                }
                              </th>
                            </tr>
                          `
                        : ''
                    }
                    ${zoneRows.map(
                      (instance_question) => html`
                        <tr>
                          <td>
                            S-${instance_question.question_number}. (<a
                              href="${getInstanceQuestionUrl({
                                courseInstanceId: resLocals.course_instance.id,
                                instanceQuestionId: instance_question.id,
                                variantId: instance_question.last_variant_id,
                              })}"
                              >نمای دانشجو</a
                            >)
                          </td>
                          <td>
                            I-${instance_question.instructor_question_number}.
                            ${instance_question.qid}
                            ${
                              resLocals.authz_data.has_course_permission_preview
                                ? html`
                                    (<a
                                      href="${getQuestionUrl({
                                        courseInstanceId: resLocals.course_instance.id,
                                        questionId: instance_question.question_id,
                                        variantSeed: instance_question.last_variant_seed,
                                      })}"
                                      >نمای مدرس</a
                                    >)
                                  `
                                : ''
                            }
                          </td>
                          <td class="text-center">
                            ${InstanceQuestionPoints({
                              instance_question,
                              assessment_question: instance_question.assessment_question,
                              component: 'auto',
                            })}
                            ${
                              resLocals.authz_data.has_course_instance_permission_edit
                                ? EditQuestionPointsScoreButtonHtml({
                                    field: 'auto_points',
                                    instance_question,
                                    assessment_question: instance_question.assessment_question,
                                    urlPrefix: resLocals.urlPrefix,
                                    csrfToken: resLocals.__csrf_token,
                                  })
                                : ''
                            }
                          </td>
                          <td class="text-center">
                            ${InstanceQuestionPoints({
                              instance_question,
                              assessment_question: instance_question.assessment_question,
                              component: 'manual',
                            })}
                            ${
                              resLocals.authz_data.has_course_instance_permission_edit
                                ? EditQuestionPointsScoreButtonHtml({
                                    field: 'manual_points',
                                    instance_question,
                                    assessment_question: instance_question.assessment_question,
                                    urlPrefix: resLocals.urlPrefix,
                                    csrfToken: resLocals.__csrf_token,
                                  })
                                : ''
                            }
                          </td>
                          <td class="text-center">
                            ${InstanceQuestionPoints({
                              instance_question,
                              assessment_question: instance_question.assessment_question,
                              component: 'total',
                            })}
                            ${
                              resLocals.authz_data.has_course_instance_permission_edit
                                ? EditQuestionPointsScoreButtonHtml({
                                    field: 'points',
                                    instance_question,
                                    assessment_question: instance_question.assessment_question,
                                    urlPrefix: resLocals.urlPrefix,
                                    csrfToken: resLocals.__csrf_token,
                                  })
                                : ''
                            }
                          </td>
                          <td class="text-center text-nowrap" style="padding-top: 0.65rem;">
                            ${ScorebarHtml(instance_question.score_perc)}
                          </td>
                          <td style="width: 1em;">
                            ${
                              resLocals.authz_data.has_course_instance_permission_edit
                                ? EditQuestionPointsScoreButtonHtml({
                                    field: 'score_perc',
                                    instance_question,
                                    assessment_question: instance_question.assessment_question,
                                    urlPrefix: resLocals.urlPrefix,
                                    csrfToken: resLocals.__csrf_token,
                                  })
                                : ''
                            }
                          </td>
                          <td class="text-nowrap" style="width: 1em;">
                            ${
                              resLocals.authz_data.has_course_instance_permission_edit &&
                              instance_question.status !== 'unanswered'
                                ? html`
                                    <a
                                      class="btn btn-xs btn-secondary"
                                      href="${resLocals.urlPrefix}/assessment/${
                                        resLocals.assessment.id
                                      }/manual_grading/instance_question/${instance_question.id}"
                                      >تصحیح دستی</a
                                    >
                                  `
                                : ''
                            }
                          </td>
                          <td class="text-end">
                            <div class="dropdown js-question-actions">
                              <button
                                type="button"
                                class="btn btn-secondary btn-xs dropdown-toggle"
                                data-bs-toggle="dropdown"
                                aria-haspopup="true"
                                aria-expanded="false"
                              >
                                عملیات <span class="caret"></span>
                              </button>
                              <div class="dropdown-menu dropdown-menu-end">
                                ${
                                  resLocals.authz_data.has_course_instance_permission_edit
                                    ? html`
                                        <button
                                          class="dropdown-item"
                                          data-bs-toggle="modal"
                                          data-bs-target="${
                                            resLocals.assessment.type === 'Exam'
                                              ? '#examResetNotSupportedModal'
                                              : '#resetQuestionVariantsModal'
                                          }"
                                          data-instance-question-id="${instance_question.id}"
                                        >
                                          بازنشانی نسخه‌های سوال
                                        </button>
                                      `
                                    : html`
                                        <button class="dropdown-item disabled" disabled>
                                          نیازمند دسترسی ویرایشگر
                                        </button>
                                      `
                                }
                              </div>
                            </div>
                          </td>
                        </tr>
                      `,
                    )}
                  </tbody>
                `;
              });
            })}
          </table>
        </div>
      </div>

      <div class="card mb-4">
        <div class="card-header bg-primary text-white">
          <h2>آمار ${resLocals.assessment_instance_label}: ${headingLabel}</h2>
        </div>
        <div class="table-responsive">
          <table
            id="instanceQuestionStatsTable"
            class="table table-sm table-hover tablesorter"
            aria-label="آمار آزمون دانشجو"
          >
            <thead>
              <tr>
                <th>سوال از دید مدرس</th>
                <th>دارای ارسال</th>
                <th>دارای ارسال کامل</th>
                <th>دارای ارسال غیرصفر</th>
                <th>نمره اولین ارسال</th>
                <th>نمره آخرین ارسال</th>
                <th>بیشترین نمره ارسال</th>
                <th>میانگین نمره ارسال‌ها</th>
              </tr>
            </thead>
            <tbody>
              ${assessment_instance_stats.map((row) => {
                const instance_question = instance_questions.find((iq) =>
                  idsEqual(iq.id, row.instance_question_id),
                );
                return html`
                  <tr>
                    <td>
                      I-${row.number}.
                      ${
                        resLocals.authz_data.has_course_permission_preview
                          ? html`
                              <a
                                href="${getQuestionUrl({
                                  courseInstanceId: resLocals.course_instance.id,
                                  questionId: row.question_id,
                                  variantSeed: instance_question?.last_variant_seed,
                                })}"
                                >${row.qid}</a
                              >
                            `
                          : row.qid
                      }
                    </td>
                    <td>${row.some_submission}</td>
                    <td>${row.some_perfect_submission}</td>
                    <td>${row.some_nonzero_submission}</td>
                    <td>${formatFloat(row.first_submission_score, 2)}</td>
                    <td>${formatFloat(row.last_submission_score, 2)}</td>
                    <td>${formatFloat(row.max_submission_score, 2)}</td>
                    <td>${formatFloat(row.average_submission_score, 2)}</td>
                  </tr>
                `;
              })}
            </tbody>
          </table>
        </div>
        <script>
          $(function () {
            $('#loginstanceQuestionStatsTable').tablesorter({
              theme: 'bootstrap',
              widthFixed: true,
              headerTemplate: '{content} {icon}',
              widgets: ['uitheme'],
            });
          });
        </script>
      </div>

      <div class="card mb-4">
        <div class="card-header bg-primary text-white">
          <h2>گزارش رویدادهای ${resLocals.assessment_instance_label}: ${headingLabel}</h2>
        </div>
        <div class="card-body">
          <small>
            برای مرتب‌سازی روی عنوان ستون کلیک کنید. برای مرتب‌سازی فرعی، کلید Shift را نگه داشته و
            روی ستون دوم کلیک کنید. فایل
            <a
              href="${resLocals.urlPrefix}/assessment_instance/${
                resLocals.assessment_instance.id
              }/${logCsvFilename}"
              >${logCsvFilename}</a
            >
            را دانلود کنید. فایل‌های آپلودشده توسط دانشجو در بالا یا در فایل CSV نمایش داده نمی‌شوند.
            فایل‌های دانشجو را می‌توان از تب
            <a href="${resLocals.urlPrefix}/assessment/${resLocals.assessment.id}/downloads"
              >فایل‌های قابل دانلود</a
            >
            دریافت کرد.
          </small>
        </div>

        <div class="table-responsive">
          <table
            id="logTable"
            class="table table-sm table-hover tablesorter"
            aria-label="گزارش رویدادهای آزمون دانشجو"
          >
            <thead>
              <tr>
                <th>زمان</th>
                <th>کاربر</th>
                ${resLocals.instance_user ? html`<th>اثرانگشت</th>` : ''}
                <th>رویداد</th>
                <th>سوال از دید مدرس</th>
                <th>سوال از دید دانشجو</th>
                <th>داده‌ها</th>
              </tr>
            </thead>
            <tbody>
              ${assessmentInstanceLog.map((row, index) => {
                return html`
                  <tr>
                    <td class="text-nowrap">
                      ${html`<span title="${formatGregorianTooltip(row.event_date, resLocals.course_instance.display_timezone)}">${formatJalaliFriendly(row.event_date, resLocals.course_instance.display_timezone)}</span>`}
                    </td>
                    <td>${row.auth_user_uid ?? html`&mdash;`}</td>
                    ${
                      resLocals.instance_user
                        ? row.client_fingerprint && row.client_fingerprint_number !== null
                          ? html`
                              <td>
                                <button
                                  type="button"
                                  class="btn btn-badge color-${
                                    FINGERPRINT_COLORS[row.client_fingerprint_number % 6]
                                  }"
                                  id="fingerprintPopover${row.client_fingerprint.id}-${index}"
                                  data-bs-toggle="popover"
                                  data-bs-container="body"
                                  data-bs-html="true"
                                  data-bs-placement="auto"
                                  data-bs-title="اثرانگشت ${row.client_fingerprint_number}"
                                  data-bs-custom-class="popover-wide"
                                  data-bs-content="${escapeHtml(
                                    FingerprintContent({ fingerprint: row.client_fingerprint }),
                                  )}"
                                >
                                  ${row.client_fingerprint_number}
                                </button>
                              </td>
                            `
                          : html`<td>&mdash;</td>`
                        : ''
                    }
                    <td><span class="badge color-${row.event_color}">${row.event_name}</span></td>
                    <td>
                      ${run(() => {
                        if (!row.qid || !row.question_id) return '';
                        // Instructor question number may be null if this
                        // question was deleted from the assessment after the
                        // event was logged
                        const number =
                          row.instructor_question_number != null
                            ? `${row.instructor_question_number}. `
                            : '';
                        const text = `${number}${row.qid}`;
                        if (!resLocals.authz_data.has_course_permission_preview) return text;
                        return html`
                          <a
                            href="${getQuestionUrl({
                              courseInstanceId: resLocals.course_instance.id,
                              questionId: row.question_id,
                              variantSeed: row.variant_seed,
                            })}"
                            >${text}</a
                          >
                        `;
                      })}
                    </td>
                    <td>
                      ${
                        row.student_question_number
                          ? row.instance_question_id && row.variant_id
                            ? html`
                                <a
                                  href="${getInstanceQuestionUrl({
                                    courseInstanceId: resLocals.course_instance.id,
                                    instanceQuestionId: row.instance_question_id,
                                    variantId: row.variant_id,
                                  })}"
                                >
                                  S-${row.student_question_number}#${row.variant_number}
                                </a>
                              `
                            : html`S-${row.student_question_number}`
                          : ''
                      }
                    </td>
                    ${
                      row.event_name !== 'External grading results'
                        ? html`<td style="word-break: break-all;">
                            ${row.data != null ? JSON.stringify(row.data) : ''}
                          </td>`
                        : html`
                            <td>
                              <a
                                class="btn btn-primary"
                                href="${resLocals.urlPrefix}/grading_job/${row.data?.id}"
                              >
                                مشاهده گزارش داوری خودکار ${row.data?.id}
                              </a>
                            </td>
                          `
                    }
                  </tr>
                `;
              })}
            </tbody>
          </table>
        </div>
        <script>
          $(function () {
            $('#logTable').tablesorter({
              theme: 'bootstrap',
              widthFixed: true,
              headerTemplate: '{content} {icon}',
              widgets: ['uitheme'],
            });
          });
        </script>
        <div class="card-footer">
          <small>
            فایل
            <a
              href="${resLocals.urlPrefix}/assessment_instance/${
                resLocals.assessment_instance.id
              }/${logCsvFilename}"
              >${logCsvFilename}</a
            >
            را دانلود کنید. فایل‌های آپلودشده توسط دانشجو در بالا یا در فایل CSV نمایش داده نمی‌شوند.
            فایل‌های دانشجو را می‌توان از تب
            <a href="${resLocals.urlPrefix}/assessment/${resLocals.assessment.id}/downloads"
              >فایل‌های قابل دانلود</a
            >
            دریافت کرد.
          </small>
        </div>
      </div>
    `,
  });
}

function FingerprintContent({ fingerprint }: { fingerprint: ClientFingerprint }) {
  const { browser, device, os } = UAParser(fingerprint.user_agent ?? undefined);
  return html`
    <div>
      آدرس IP:
      <a
        href="https://client.rdap.org/?type=ip&object=${fingerprint.ip_address}"
        target="_blank"
        rel="noreferrer"
      >
        ${fingerprint.ip_address}
      </a>
    </div>
    <div>شناسه نشست (Session ID): ${fingerprint.user_session_id}</div>
    <div>مشخصات مرورگر (User Agent):</div>
    <ul>
      ${browser.name ? html`<li>مرورگر: ${browser.name} ${browser.version ?? ''}</li>` : ''}
      ${device.type ? html`<li>نوع دستگاه: ${device.type}</li>` : ''}
      ${device.vendor ? html`<li>دستگاه: ${device.vendor} ${device.model ?? ''}</li>` : ''}
      ${os.name ? html`<li>سیستم‌عامل: ${os.name} ${os.version ?? ''}</li>` : ''}
      <li>خام: <code>${fingerprint.user_agent}</code></li>
    </ul>
  `;
}

function EditTotalPointsForm({
  resLocals,
}: {
  resLocals: ResLocalsForPage<'assessment-instance'>;
}) {
  return html`
    <form name="edit-total-points-form" method="POST">
      <input type="hidden" name="__action" value="edit_total_points" />
      <input type="hidden" name="__csrf_token" value="${resLocals.__csrf_token}" />
      <input
        type="hidden"
        name="assessment_instance_id"
        value="${resLocals.assessment_instance.id}"
      />
      <div class="mb-3">
        <div class="input-group">
          <input
            type="text"
            class="form-control"
            name="points"
            value="${resLocals.assessment_instance.points}"
            aria-label="نمره کل"
          />
          <span class="input-group-addon">/${resLocals.assessment_instance.max_points}</span>
        </div>
      </div>
      <p>
        <small>
          در صورت پاسخ‌گویی دانشجو به سوالات دیگر، این تغییر بازنویسی خواهد شد.
        </small>
      </p>
      <div class="text-end">
        <button type="button" class="btn btn-secondary" data-bs-dismiss="popover">انصراف</button>
        <button type="submit" class="btn btn-primary">تغییر</button>
      </div>
    </form>
  `;
}

function EditTotalScorePercForm({
  resLocals,
}: {
  resLocals: ResLocalsForPage<'assessment-instance'>;
}) {
  return html`
    <form name="edit-total-score-perc-form" method="POST">
      <input type="hidden" name="__action" value="edit_total_score_perc" />
      <input type="hidden" name="__csrf_token" value="${resLocals.__csrf_token}" />
      <input
        type="hidden"
        name="assessment_instance_id"
        value="${resLocals.assessment_instance.id}"
      />
      <div class="mb-3">
        <div class="input-group">
          <input
            type="text"
            class="form-control"
            name="score_perc"
            value="${resLocals.assessment_instance.score_perc}"
            aria-label="درصد نمره کل"
          />
          <span class="input-group-addon">%</span>
        </div>
      </div>
      <p>
        <small>
          در صورت پاسخ‌گویی دانشجو به سوالات دیگر، این تغییر بازنویسی خواهد شد.
        </small>
      </p>
      <div class="text-end">
        <button type="button" class="btn btn-secondary" data-bs-dismiss="popover">انصراف</button>
        <button type="submit" class="btn btn-primary">تغییر</button>
      </div>
    </form>
  `;
}

function ResetQuestionVariantsModal({
  csrfToken,
  assessment,
}: {
  csrfToken: string;
  assessment: Assessment;
}) {
  return Modal({
    id: 'resetQuestionVariantsModal',
    title: 'تایید بازنشانی نسخه‌های سوال',
    body: html`
      <p>
        آیا مطمئن هستید که می‌خواهید تمام نسخه‌های فعلی این سوال را برای این
        ${assessment.team_work ? 'گروه' : 'دانشجو'} بازنشانی کنید؟
        <strong>تمام تلاش‌های تصحیح‌نشده از بین خواهند رفت.</strong>
      </p>
      <p>
        این ${assessment.team_work ? 'گروه' : 'دانشجو'} در مراجعه بعدی خود به این سوال، نسخه جدیدی
        دریافت خواهد کرد.
      </p>
    `,
    footer: html`
      <input type="hidden" name="__action" value="reset_question_variants" />
      <input type="hidden" name="__csrf_token" value="${csrfToken}" />
      <input type="hidden" name="unsafe_instance_question_id" class="js-instance-question-id" />
      <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">انصراف</button>
      <button type="submit" class="btn btn-danger">بازنشانی نسخه‌های سوال</button>
    `,
  });
}

function ExamResetNotSupportedModal({ assessment }: { assessment: Assessment }) {
  return Modal({
    id: 'examResetNotSupportedModal',
    title: 'پشتیبانی نمی‌شود',
    body: html`
      <p>بازنشانی نسخه‌های سوال برای ارزیابی‌های از نوع آزمون (Exam) پشتیبانی نمی‌شود.</p>
      <p class="mb-0">
        گزینه‌های جایگزین مانند حذف نمونه آزمون را در نظر بگیرید تا
        ${assessment.team_work ? 'گروه' : 'دانشجو'} بتواند از ابتدا شروع کند.
      </p>
    `,
    footer: html`
      <button type="button" class="btn btn-primary" data-bs-dismiss="modal">بستن</button>
    `,
  });
}
