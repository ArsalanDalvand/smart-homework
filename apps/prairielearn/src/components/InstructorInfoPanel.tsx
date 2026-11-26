import { formatInterval } from '@prairielearn/formatter';
import { type HtmlValue, html } from '@prairielearn/html';
import { DateFromISOString, IntervalSchema } from '@prairielearn/zod';

import { formatGregorianTooltip, formatJalaliFriendly } from '../lib/jalali.js';

import {
  type Assessment,
  type AssessmentInstance,
  type Course,
  type CourseInstance,
  type Group,
  type InstanceQuestion,
  type Question,
  type User,
  type Variant,
} from '../lib/db-types.js';

import type { QuestionContext } from './QuestionContainer.types.js';

export function InstructorInfoPanel({
  course,
  course_instance,
  assessment,
  assessment_instance,
  instance_question,
  assignedGrader,
  lastGrader,
  question,
  variant,
  instance_group,
  instance_group_uid_list,
  instance_user,
  authz_data,
  question_is_shared,
  questionContext,
  csrfToken,
}: {
  course: Course;
  course_instance?: CourseInstance;
  assessment?: Assessment;
  assessment_instance?: AssessmentInstance;
  instance_question?: InstanceQuestion;
  assignedGrader?: User | null;
  lastGrader?: User | null;
  question?: Question;
  variant?: Variant;
  instance_group?: Group | null;
  instance_group_uid_list?: string[] | null;
  instance_user?: User | null;
  authz_data: Record<string, any>;
  question_is_shared?: boolean;
  questionContext: QuestionContext;
  csrfToken: string;
}) {
  // Here, we are only checking if the effective user is an instructor. We are
  // not attempting to check if this user has permission to view student data.
  // That check would have already been made (when necessary) before granting
  // access to the page on which this partial is included (an assessment
  // instance or question instance). We don't need this check when the question
  // is being previewed publicly because the public preview page already checks
  // for the necessary permissions.
  if (
    questionContext !== 'public' &&
    !authz_data.has_course_permission_preview &&
    !authz_data.has_course_instance_permission_view
  ) {
    return '';
  }

  const timeZone = course_instance?.display_timezone ?? course.display_timezone;

  return html`
    <div class="card mb-3 border-warning">
      <div class="card-header bg-warning">
        <h2>اطلاعات کادر آموزشی</h2>
      </div>
      ${ListGroup([
        InstanceUserInfo({ instance_user, instance_group, instance_group_uid_list }),
        QuestionInfo({
          course,
          course_instance,
          question,
          variant,
          question_is_shared,
          questionContext,
          hasCoursePermissionPreview: authz_data.has_course_permission_preview,
        }),
        VariantInfo({ variant, timeZone, questionContext }),
        IssueReportButton({ variant, csrfToken, questionContext }),
        AssessmentInstanceInfo({ assessment, assessment_instance, timeZone }),
        ManualGradingInfo({
          instance_question,
          assignedGrader,
          lastGrader,
          assessment,
          questionContext,
        }),
      ])}
      <div class="card-footer small text-muted">این بخش تنها برای اساتید و دستیاران آموزشی قابل مشاهده است.</div>
    </div>
  `;
}

function ListGroup(children: HtmlValue[]) {
  const filteredChildren = children.filter((child) => !!child);

  return html`
    <div class="list-group list-group-flush">
      ${filteredChildren.map((child) => html`<div class="list-group-item py-3">${child}</div>`)}
    </div>
  `;
}

function InstanceUserInfo({
  instance_user,
  instance_group,
  instance_group_uid_list,
}: {
  instance_user?: User | null;
  instance_group?: Group | null;
  instance_group_uid_list?: string[] | null;
}) {
  if (instance_user == null && instance_group == null) return '';
  return html`
    <div>
      <details>
        <summary>
          <h3 class="card-title ${instance_group != null ? 'h5' : 'd-inline-block h5 mb-0'}">
            ${instance_group != null ? 'مشخصات گروه' : 'مشخصات دانشجو'}
          </h3>
        </summary>
        ${
          instance_group != null
            ? html`
                <div class="d-flex flex-wrap">
                  <div class="pe-1">${instance_group.name}</div>
                  <div class="pe-1">(${instance_group_uid_list?.join(', ')})</div>
                </div>
              `
            : html`
                <div class="d-flex flex-wrap mt-2">
                  <div class="pe-1">${instance_user?.name}</div>
                  <div class="pe-1 text-muted" dir="ltr">(${instance_user?.uid})</div>
                </div>
              `
        }
      </details>
    </div>
  `;
}

function QuestionInfo({
  course,
  course_instance,
  question,
  variant,
  question_is_shared,
  questionContext,
  hasCoursePermissionPreview,
}: {
  course: Course;
  course_instance?: CourseInstance;
  question?: Question;
  variant?: Variant;
  question_is_shared?: boolean;
  questionContext: QuestionContext;
  hasCoursePermissionPreview: boolean;
}) {
  if (question == null || variant == null) return '';

  const questionPreviewUrl = `/pl/${
    course_instance != null
      ? `course_instance/${course_instance.id}/instructor`
      : `course/${course.id}`
  }/question/${question.id}?variant_seed=${variant.variant_seed}`;
  const publicPreviewUrl = `/pl/public/course/${question.course_id}/question/${question.id}/preview`;

  const sharingQid =
    course.example_course || !question.share_publicly
      ? question.qid
      : `@${course.sharing_name}/${question.qid}`;

  return html`
    <h3 class="card-title h5">اطلاعات سوال</h3>

    <div class="d-flex flex-wrap align-items-center">
      <div class="pe-2">شناسه سوال (QID):</div>
      <div dir="ltr">
        ${
          questionContext === 'public'
            ? html`<a href="${publicPreviewUrl}?variant_seed=${variant.variant_seed}">
                ${sharingQid}
              </a>`
            : hasCoursePermissionPreview
              ? html`<a href="${questionPreviewUrl}">${question.qid}</a>`
              : html`<span>${question.qid}</span>`
        }
      </div>
    </div>

    ${
      question.title?.trim()
        ? html`
            <div class="d-flex flex-wrap align-items-center mt-1">
              <div class="pe-2">عنوان سوال:</div>
              <div>${question.title}</div>
            </div>
          `
        : ''
    }
  `;
}

function VariantInfo({
  variant,
  timeZone,
  questionContext,
}: {
  variant?: Variant;
  timeZone: string;
  questionContext: QuestionContext;
}) {
  if (variant == null) return '';

  const duration =
    typeof variant.duration === 'string'
      ? IntervalSchema.parse(variant.duration)
      : (variant.duration ?? 0);
  const date =
    typeof variant.date === 'string' ? DateFromISOString.parse(variant.date) : variant.date;

  return html`
    <h3 class="card-title h5">گونه سوال</h3>
    ${
      questionContext !== 'public'
        ? html`
            <div class="d-flex flex-wrap align-items-center">
              <div class="pe-2">زمان شروع:</div>
              <div>${date ? html`<span title="${formatGregorianTooltip(date, timeZone)}">${formatJalaliFriendly(date, timeZone)}</span>` : '(نامشخص)'}</div>
            </div>
            <div class="d-flex flex-wrap align-items-center mt-1">
              <div class="pe-2">مدت زمان:</div>
              <div dir="ltr">${formatInterval(duration)}</div>
            </div>
          `
        : ''
    }
    <div class="d-flex flex-wrap mt-2">
      <details class="pe-1">
        <summary>نمایش / عدم نمایش پاسخ مرجع</summary>
        <pre class="mt-2 mb-0" dir="ltr"><code>${JSON.stringify(variant.true_answer, null, 2)}</code></pre>
      </details>
    </div>
  `;
}

function AssessmentInstanceInfo({
  assessment,
  assessment_instance,
  timeZone,
}: {
  assessment?: Assessment;
  assessment_instance?: AssessmentInstance;
  timeZone: string;
}) {
  if (assessment == null || assessment_instance == null) return '';

  const instructorUrlPrefix = `/pl/course_instance/${assessment.course_instance_id}/instructor`;

  const duration =
    typeof assessment_instance.duration === 'string'
      ? IntervalSchema.parse(assessment_instance.duration)
      : (assessment_instance.duration ?? 0);
  const date =
    typeof assessment_instance.date === 'string'
      ? DateFromISOString.parse(assessment_instance.date)
      : assessment_instance.date;

  return html`
    <h3 class="card-title h5">نمونه تکلیف / آزمون</h3>
    <div class="d-flex flex-wrap align-items-center">
      <div class="pe-2">شناسه ارزیابی:</div>
      <div dir="ltr">
        <a href="${instructorUrlPrefix}/assessment/${assessment.id}">${assessment.tid}</a>
      </div>
    </div>

    <div class="d-flex flex-wrap align-items-center mt-1">
      <div class="pe-2">زمان شروع:</div>
      <div>${date ? html`<span title="${formatGregorianTooltip(date, timeZone)}">${formatJalaliFriendly(date, timeZone)}</span>` : '(نامشخص)'}</div>
    </div>

    <div class="d-flex flex-wrap align-items-center mt-1">
      <div class="pe-2">مدت زمان:</div>
      <div dir="ltr">${formatInterval(duration)}</div>
    </div>

    <div class="pt-2">
      <a href="${instructorUrlPrefix}/assessment_instance/${assessment_instance.id}" class="btn btn-sm btn-outline-secondary">
        <i class="fa fa-history me-1"></i> مشاهده لاگ ارزیابی
      </a>
    </div>
  `;
}

function ManualGradingInfo({
  instance_question,
  assignedGrader,
  lastGrader,
  assessment,
  questionContext,
}: {
  instance_question?: InstanceQuestion | null;
  assignedGrader?: User | null;
  lastGrader?: User | null;
  assessment?: Assessment | null;
  questionContext: QuestionContext;
}) {
  if (
    instance_question == null ||
    assessment == null ||
    instance_question.status === 'unanswered'
  ) {
    return '';
  }

  const manualGradingUrl = `/pl/course_instance/${assessment.course_instance_id}/instructor/assessment/${assessment.id}/manual_grading/instance_question/${instance_question.id}`;

  return html`
    <h3 class="card-title h5">تصحیح دستی</h3>

    <div class="d-flex flex-wrap align-items-center">
      <div class="pe-2">وضعیت:</div>
      <div>${instance_question.requires_manual_grading ? 'نیازمند تصحیح' : 'تصحیح‌شده'}</div>
    </div>

    ${
      instance_question.requires_manual_grading
        ? html`
            <div class="d-flex flex-wrap align-items-center mt-1">
              <div class="pe-2">مصحح محول‌شده:</div>
              <div>
                ${
                  assignedGrader?.name
                    ? `${assignedGrader.name} (${assignedGrader.uid})`
                    : (assignedGrader?.uid ?? 'تعیین‌نشده')
                }
              </div>
            </div>
          `
        : ''
    }
    ${
      lastGrader
        ? html`
            <div class="d-flex flex-wrap align-items-center mt-1">
              <div class="pe-2">تصحیح‌شده توسط:</div>
              <div>
                ${lastGrader.name ? `${lastGrader.name} (${lastGrader.uid})` : lastGrader.uid}
              </div>
            </div>
          `
        : ''
    }
    ${
      questionContext !== 'manual_grading'
        ? html`
            <div class="pt-2">
              <a href="${manualGradingUrl}" class="btn btn-sm btn-outline-warning">
                <i class="fa fa-pencil me-1"></i> ثبت نمره دستی
              </a>
            </div>
          `
        : ''
    }
  `;
}

function IssueReportButton({
  variant,
  csrfToken,
  questionContext,
}: {
  variant?: Variant | null;
  csrfToken: string;
  questionContext: QuestionContext;
}) {
  if (
    variant == null ||
    questionContext === 'student_exam' ||
    questionContext === 'student_homework' ||
    questionContext === 'public'
  ) {
    return '';
  }

  return html`
    <button
      class="btn btn-sm btn-outline-danger w-100"
      type="button"
      data-bs-toggle="collapse"
      data-bs-target="#issueCollapse"
      aria-expanded="false"
      aria-controls="issueCollapse"
    >
      <i class="fa fa-bug me-1"></i> گزارش اشکال در این سوال
    </button>
    <div class="collapse" id="issueCollapse">
      <form method="POST" class="mt-3">
        <div class="mb-3">
          <textarea
            class="form-control"
            rows="5"
            name="description"
            placeholder="شرح اشکال و خطای مشاهده‌شده در سوال..."
            required
          ></textarea>
        </div>
        <input type="hidden" name="__variant_id" value="${variant.id}" />
        <input type="hidden" name="__csrf_token" value="${csrfToken}" />
        <button type="submit" class="btn btn-sm btn-danger" name="__action" value="report_issue">
          ثبت گزارش اشکال
        </button>
      </form>
    </div>
  `;
}
