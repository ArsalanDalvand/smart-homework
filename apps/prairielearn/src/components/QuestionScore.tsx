import { type HtmlValue, escapeHtml, html, joinHtml } from '@prairielearn/html';
import { run } from '@prairielearn/run';

import type {
  Assessment,
  AssessmentInstance,
  AssessmentQuestion,
  InstanceQuestion,
  Question,
  Variant,
} from '../lib/db-types.js';
import { formatPoints } from '../lib/format.js';
import { toPersianDigits } from '../lib/jalali.js';
import type { SimpleVariantWithScore } from '../models/variant.js';

import { ExamQuestionAvailablePoints } from './ExamQuestionAvailablePoints.js';
import { ExamQuestionStatus } from './ExamQuestionStatus.js';
import { QuestionVariantHistory } from './QuestionVariantHistory.js';

interface QuestionScorePanelContentProps {
  instance_question: InstanceQuestion;
  assessment: Assessment;
  assessment_question: AssessmentQuestion;
  question: Question;
  assessment_instance: AssessmentInstance;
  variant?: Variant;
  instance_question_info: {
    question_number: string | null;
    previous_variants?: SimpleVariantWithScore[] | null;
  };
  allowGradeLeftMs: number;
}

export function QuestionScorePanel(
  props: QuestionScorePanelContentProps & {
    authz_result?: { authorized_edit: boolean | null };
    csrfToken: string;
  },
) {
  const { instance_question_info, variant, assessment, authz_result, csrfToken } = props;

  return html`
    <div class="card mb-4" id="question-score-panel" style="font-family: var(--font-persian);">
      <div class="card-header bg-secondary text-white">
        <h2>سوال ${instance_question_info.question_number}</h2>
      </div>
      ${QuestionScorePanelContent(props)}
      ${
        variant != null && assessment.allow_issue_reporting
          ? html`
              <div class="card-footer">
                ${
                  authz_result?.authorized_edit === false
                    ? html`
                        <div class="alert alert-warning mb-0" role="alert">
                          شما در حال مشاهده نمونه سوال کاربر دیگری هستید و مجاز به گزارش خطا نیستید.
                        </div>
                      `
                    : IssueReportingPanel({ variant, csrfToken })
                }
              </div>
            `
          : ''
      }
    </div>
  `;
}

export function QuestionScorePanelContent({
  instance_question,
  assessment,
  assessment_question,
  question,
  assessment_instance,
  instance_question_info,
  variant,
  allowGradeLeftMs,
}: QuestionScorePanelContentProps) {
  const hasAutoAndManualPoints =
    assessment_question.max_auto_points &&
    (assessment_question.max_manual_points ||
      instance_question.manual_points ||
      instance_question.requires_manual_grading);

  return html`
    <table
      class="table table-sm two-column-description-no-header"
      aria-label="نمره سوال"
      id="question-score-panel-content"
    >
      <tbody>
        ${
          assessment.type === 'Exam'
            ? html`
                <tr>
                  <td>وضعیت:</td>
                  <td>
                    ${ExamQuestionStatus({
                      instance_question,
                      assessment_question,
                      allowGradeLeftMs,
                    })}
                  </td>
                </tr>
              `
            : ''
        }
        ${
          assessment.type === 'Homework'
            ? html`
                ${
                  assessment_question.max_auto_points
                    ? html`
                        <tr>
                          <td>ارزش سوال:</td>
                          <td>${QuestionValue({ instance_question, assessment_question })}</td>
                        </tr>
                      `
                    : ''
                }
                ${
                  !question.single_variant ||
                  (instance_question_info.previous_variants?.length ?? 0) > 1
                    ? html`
                        <tr>
                          <td colspan="2" class="text-wrap">
                            تمام گونه‌ها و تلاش‌ها:
                            ${QuestionVariantHistory({
                              courseInstanceId: assessment.course_instance_id,
                              instanceQuestionId: instance_question.id,
                              previousVariants: instance_question_info.previous_variants,
                              currentVariantId: variant?.id,
                            })}
                          </td>
                        </tr>
                      `
                    : ''
                }
              `
            : assessment_question.max_auto_points
              ? html`
                  <tr>
                    <td>نمره در دسترس:</td>
                    <td>
                      ${ExamQuestionAvailablePoints({
                        open: !!assessment_instance.open && instance_question.open,
                        currentWeight:
                          (instance_question.points_list_original?.[
                            instance_question.number_attempts
                          ] ?? 0) - (assessment_question.max_manual_points ?? 0),
                        pointsList: instance_question.points_list?.map(
                          (p) => p - (assessment_question.max_manual_points ?? 0),
                        ),
                        highestSubmissionScore: instance_question.highest_submission_score,
                      })}
                    </td>
                  </tr>
                `
              : ''
        }
        ${
          hasAutoAndManualPoints
            ? html`
                <tr>
                  <td>تصحیح خودکار:</td>
                  <td>
                    ${InstanceQuestionPoints({
                      instance_question,
                      assessment_question,
                      component: 'auto',
                    })}
                  </td>
                </tr>
                <tr>
                  <td>تصحیح دستی:</td>
                  <td>
                    ${InstanceQuestionPoints({
                      instance_question,
                      assessment_question,
                      component: 'manual',
                    })}
                  </td>
                </tr>
              `
            : ''
        }
        <tr>
          <td>مجموع نمرات:</td>
          <td>
            ${InstanceQuestionPoints({
              instance_question,
              assessment_question,
              component: 'total',
            })}
          </td>
        </tr>
        ${
          !hasAutoAndManualPoints && assessment_question.max_points
            ? html`
                <tr>
                  <td colspan="2" class="text-end">
                    <small>
                      ${
                        !assessment_question.max_auto_points
                          ? 'سوال نیازمند تصحیح دستی'
                          : 'سوال مجهز به تصحیح خودکار'
                      }
                    </small>
                  </td>
                </tr>
              `
            : ''
        }
      </tbody>
    </table>
  `;
}

function IssueReportingPanel({ variant, csrfToken }: { variant: Variant; csrfToken: string }) {
  return html`
    <button
      class="btn btn-xs btn-secondary"
      type="button"
      data-bs-toggle="collapse"
      data-bs-target="#issueCollapse"
      aria-expanded="false"
      aria-controls="issueCollapse"
    >
      <i class="fa fa-bug me-1"></i> گزارش اشکال در سوال
      <i class="far fa-caret-square-down ms-1"></i>
    </button>
    <div class="collapse" id="issueCollapse">
      <form method="POST">
        <p class="small mt-3">
          این فرم صرفاً برای گزارش اشکالات احتمالی در صورت مسئله، متغیرها یا تست‌کیس‌ها است. برای
          راهنمایی علمی یا اشکال در کد خود از کانال یا گروه حل تمرین استفاده نمایید.
        </p>
        <div class="mb-3">
          <textarea
            class="form-control"
            rows="5"
            name="description"
            placeholder="شرح دقیق اشکال مشاهده‌شده در این سوال..."
            required
          ></textarea>
        </div>
        <input type="hidden" name="__variant_id" value="${variant.id}" />
        <input type="hidden" name="__csrf_token" value="${csrfToken}" />
        <div class="mb-3 text-end">
          <button type="submit" class="btn btn-sm btn-warning" name="__action" value="report_issue">
            ارسال گزارش اشکال
          </button>
        </div>
      </form>
    </div>
  `;
}

export function InstanceQuestionPoints({
  instance_question,
  assessment_question,
  component,
}: {
  instance_question: Pick<
    InstanceQuestion,
    | 'auto_points'
    | 'manual_points'
    | 'points'
    | 'status'
    | 'requires_manual_grading'
    | 'last_grader'
    | 'used_for_grade'
  >;
  assessment_question: Pick<
    AssessmentQuestion,
    'max_auto_points' | 'max_manual_points' | 'max_points'
  >;
  component: 'manual' | 'auto' | 'total';
}) {
  const points =
    component === 'auto'
      ? instance_question.auto_points
      : component === 'manual'
        ? instance_question.manual_points
        : instance_question.points;
  const maxPoints =
    component === 'auto'
      ? assessment_question.max_auto_points
      : component === 'manual'
        ? assessment_question.max_manual_points
        : assessment_question.max_points;
  const pointsPending =
    (['saved', 'grading'].includes(instance_question.status ?? '') && component !== 'manual') ||
    (instance_question.requires_manual_grading && component !== 'auto');

  // Special case: if this is a manually-graded question in the saved state, don't show
  // a "pending" badge for auto points, since there aren't any pending auto points.
  if (
    instance_question.status === 'saved' &&
    component === 'auto' &&
    !assessment_question.max_auto_points &&
    assessment_question.max_manual_points
  ) {
    return html`&mdash;`;
  }

  return html`
    <span
      class="text-nowrap sh-tabular ${instance_question.used_for_grade === false ? 'text-muted' : ''}"
      dir="ltr"
    >
      ${
        // If the question is unanswered show a dash instead of 0 points, unless
        // the question was manually graded or a regrading process forced the
        // points to be increased.
        instance_question.status === 'unanswered' &&
        instance_question.last_grader == null &&
        instance_question.points === 0
          ? html`&mdash;`
          : pointsPending
            ? html`<span class="badge text-bg-info">در حال تصحیح</span>`
            : !points && !maxPoints
              ? html`&mdash;`
              : html`<span data-testid="awarded-points"
                  >${toPersianDigits(formatPoints(points))}</span
                >`
      }
      ${
        maxPoints
          ? html`<small> / <span class="text-muted">${toPersianDigits(maxPoints)}</span></small>`
          : ''
      }
      ${
        instance_question.used_for_grade === false && component === 'total' && (points ?? 0) !== 0
          ? html`
              <button
                type="button"
                class="btn btn-xs"
                data-bs-toggle="tooltip"
                aria-label="در نمره لحاظ نمی‌شود"
                title="این بخش تنها بهترین سوالات را در نمره محاسبه می‌کند و این سوال در نمره لحاظ نشده است."
              >
                <i class="far fa-question-circle" aria-hidden="true"></i>
              </button>
            `
          : ''
      }
    </span>
  `;
}

function QuestionValue({
  instance_question,
  assessment_question,
}: {
  instance_question: InstanceQuestion;
  assessment_question: AssessmentQuestion;
}) {
  const initAutoPoints =
    (assessment_question.init_points ?? 0) - (assessment_question.max_manual_points ?? 0);

  const currentAutoValue =
    (instance_question.current_value ?? 0) - (assessment_question.max_manual_points ?? 0);

  const bestCurrentScore = run(() => {
    const variantPoints = instance_question.variants_points_list.at(-1);
    if (variantPoints == null) return 0;
    if (variantPoints < initAutoPoints) return (variantPoints / initAutoPoints) * 100;
    return 0;
  });

  const popoverContent = run(() => {
    const parts: HtmlValue[] = [
      html` <p>در صورت نزدیک‌تر شدن به پاسخ صحیح، این سوال به شما نمره جزئی اعطا می‌کند.</p> `,
    ];

    if (bestCurrentScore === 0) {
      parts.push(html`
        <p>
          اگر در ارسال بعدی نمره ۱۰۰٪ کسب کنید، ${toPersianDigits(formatPoints(currentAutoValue))}
          امتیاز اضافه به شما تعلق می‌گیرد.
        </p>
        <p class="mb-0">
          اگر در ارسال بعدی نمره‌ای کمتر از ۱۰۰٪ کسب کنید، به میزان
          <code>${formatPoints(initAutoPoints)} * score / 100</code> امتیاز اضافه دریافت خواهید کرد.
        </p>
      `);
    } else {
      if (instance_question.some_perfect_submission) {
        parts.push(html`
          <p>
            بالاترین نمره ارسال شما پس از آخرین ارسال ۱۰۰٪، برابر با
            ${toPersianDigits(formatPoints(bestCurrentScore))}٪ است.
          </p>
        `);
      } else {
        parts.push(
          html`<p>
            بالاترین نمره ارسال شما تاکنون ${toPersianDigits(formatPoints(bestCurrentScore))}٪ است.
          </p>`,
        );
      }

      const perfectAdditionalPoints = (currentAutoValue * (100 - bestCurrentScore)) / 100;
      parts.push(html`
        <p>
          اگر در ارسال بعدی نمره ۱۰۰٪ کسب کنید،
          ${toPersianDigits(formatPoints(perfectAdditionalPoints))} امتیاز اضافه به شما تعلق می‌گیرد.
        </p>
        <p>
          اگر در ارسال بعدی نمره‌ای بین ${toPersianDigits(formatPoints(bestCurrentScore))}٪ تا ۱۰۰٪
          کسب کنید، به میزان
          <code>
            ${formatPoints(currentAutoValue)} * (score - ${formatPoints(bestCurrentScore)}) / 100
          </code>
          امتیاز اضافه دریافت خواهید کرد.
        </p>
        <p class="mb-0">
          اگر در ارسال بعدی نمره‌ای کمتر از ${toPersianDigits(formatPoints(bestCurrentScore))}٪ کسب
          کنید، برای آن ارسال امتیاز اضافه‌ای دریافت نخواهید کرد.
        </p>
      `);
    }

    return joinHtml(parts);
  });

  return html`
    <span class="sh-tabular">${toPersianDigits(formatPoints(currentAutoValue))}</span>
    <button
      type="button"
      class="btn btn-xs js-value-popover"
      data-bs-toggle="popover"
      data-bs-container="body"
      data-bs-html="true"
      data-bs-title="توضیح ارزش سوال"
      data-bs-content="${escapeHtml(popoverContent)}"
      data-bs-placement="auto"
    >
      <i class="fa fa-question-circle" aria-hidden="true"></i>
    </button>
  `;
}
