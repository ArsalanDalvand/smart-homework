import { z } from 'zod';

import { html } from '@prairielearn/html';
import { renderHtml } from '@prairielearn/react';

import { AssessmentOpenInstancesAlert } from '../../../components/AssessmentOpenInstancesAlert.js';
import { Modal } from '../../../components/Modal.js';
import { PageLayout } from '../../../components/PageLayout.js';
import { compiledScriptTag } from '../../../lib/assets.js';
import { AssessmentQuestionSchema, type User } from '../../../lib/db-types.js';
import { idsEqual } from '../../../lib/id.js';
import type { ResLocalsForPage } from '../../../lib/res-locals.js';

export const ManualGradingQuestionSchema = AssessmentQuestionSchema.extend({
  qid: z.string(),
  title: z.string(),
  number: z.string().nullable(),
  alternative_pool_number: z.number(),
  alternative_pool_size: z.coerce.number(),
  num_instance_questions: z.coerce.number(),
  num_instance_questions_to_grade: z.coerce.number(),
  num_instance_questions_assigned: z.coerce.number(),
  num_instance_questions_unassigned: z.coerce.number(),
  assigned_graders: z
    .array(z.object({ id: z.number(), name: z.string().nullable(), uid: z.string() }))
    .nullable(),
  actual_graders: z
    .array(z.object({ id: z.number(), name: z.string().nullable(), uid: z.string() }))
    .nullable(),
  num_open_instances: z.coerce.number(),
});
type ManualGradingQuestion = z.infer<typeof ManualGradingQuestionSchema>;

export function ManualGradingAssessment({
  resLocals,
  questions,
  courseStaff,
  num_open_instances,
  adminFeaturesEnabled,
}: {
  resLocals: ResLocalsForPage<'assessment'>;
  questions: ManualGradingQuestion[];
  courseStaff: User[];
  num_open_instances: number;
  adminFeaturesEnabled: boolean;
}) {
  return PageLayout({
    resLocals,
    pageTitle: 'تصحیح دستی',
    navContext: {
      type: 'instructor',
      page: 'assessment',
      subPage: 'manual_grading',
    },
    options: {
      fullWidth: true,
    },
    headContent: html`
      ${compiledScriptTag('instructorAssessmentManualGradingAssessmentClient.ts')}
    `,
    preContent: html`
      ${
        resLocals.authz_data.has_course_instance_permission_edit
          ? GraderAssignmentModal({ courseStaff, csrfToken: resLocals.__csrf_token })
          : ''
      }
    `,
    content: (
      <>
        <AssessmentOpenInstancesAlert
          numOpenInstances={num_open_instances}
          assessmentId={resLocals.assessment.id}
          urlPrefix={resLocals.urlPrefix}
        />
        <div className="card mb-4">
          <div className="card-header bg-primary text-white align-items-center justify-content-between d-flex gap-2">
            <h1>
              {resLocals.assessment_set.name} {resLocals.assessment.number}: صف تصحیح دستی
            </h1>
            {adminFeaturesEnabled && questions.length > 0 && (
              <div
                className="d-flex align-items-center gap-2"
                // React doesn't let us emit raw event handlers, so
                // instead we render these buttons inside a `dangerouslySetInnerHTML` block.

                // oxlint-disable-next-line react/no-danger
                dangerouslySetInnerHTML={{
                  __html: html`
                    <form method="POST" class="d-inline">
                      <input type="hidden" name="__action" value="export_ai_grading_statistics" />
                      <input type="hidden" name="__csrf_token" value="${resLocals.__csrf_token}" />
                      <button
                        type="submit"
                        class="btn btn-sm btn-light grading-tag-button"
                        aria-label="خروجی آمار تصحیح با هوش مصنوعی"
                      >
                        <i class="bi bi-download" aria-hidden="true"></i>
                        خروجی آمار تصحیح با هوش مصنوعی
                      </button>
                    </form>
                    <form method="POST" class="d-inline">
                      <input type="hidden" name="__action" value="ai_grade_all" />
                      <input type="hidden" name="__csrf_token" value="${resLocals.__csrf_token}" />
                      <button
                        type="submit"
                        class="btn btn-sm btn-light grading-tag-button"
                        aria-label="تصحیح تمام سوالات با هوش مصنوعی"
                      >
                        <i class="bi bi-stars" aria-hidden="true"></i>
                        تصحیح تمام سوالات با هوش مصنوعی
                      </button>
                    </form>
                    <form method="POST" class="d-inline">
                      <input type="hidden" name="__action" value="delete_ai_grading_data" />
                      <input type="hidden" name="__csrf_token" value="${resLocals.__csrf_token}" />
                      <button
                        type="submit"
                        class="btn btn-sm btn-light grading-tag-button"
                        aria-label="حذف تمام داده‌های تصحیح هوش مصنوعی"
                        data-bs-toggle="tooltip"
                        data-bs-title="حذف تمام نتایج تصحیح هوش مصنوعی برای سوالات این ارزیابی"
                      >
                        حذف داده‌های تصحیح هوش مصنوعی
                      </button>
                    </form>
                  `.toString(),
                }}
              />
            )}
          </div>

          <div className="table-responsive">
            <table
              id="instanceQuestionGradingTable"
              className="table table-sm table-hover"
              aria-label="سوالات برای تصحیح دستی"
            >
              <thead>
                <tr>
                  <th>سوال</th>
                  <th>شناسه سوال (QID)</th>
                  <th>نمره خودکار</th>
                  <th>نمره دستی</th>
                  <th colSpan={2} scope="colgroup">
                    ارسال‌های نیازمند تصحیح
                  </th>
                  <th>تخصیص داده‌شده به</th>
                  <th>تصحیح‌شده توسط</th>
                  <th>عملیات</th>
                </tr>
              </thead>
              <tbody>
                {questions.map((question) => (
                  <AssessmentQuestionRow
                    key={question.id}
                    resLocals={resLocals}
                    question={question}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </>
    ),
  });
}

function AssessmentQuestionRow({
  resLocals,
  question,
}: {
  resLocals: ResLocalsForPage<'assessment'>;
  question: ManualGradingQuestion;
}) {
  const showGradingButton =
    resLocals.authz_data.has_course_instance_permission_edit &&
    question.num_instance_questions_assigned + question.num_instance_questions_unassigned > 0;
  const currentUserName = resLocals.authz_data.user.name ?? resLocals.authz_data.user.uid;
  const otherAssignedGraders = (question.assigned_graders || [])
    .filter((u) => !idsEqual(u.id, resLocals.authz_data.user.id))
    .map((u) => u.name ?? u.uid);
  const gradingUrl = `${resLocals.urlPrefix}/assessment/${resLocals.assessment.id}/manual_grading/assessment_question/${question.id}`;

  return (
    <tr>
      <td className="align-middle">
        <a href={gradingUrl}>
          {question.alternative_pool_number}.
          {question.alternative_pool_size === 1 ? '' : `${question.number_in_alternative_group}.`}{' '}
          {question.title}
        </a>
        {question.manual_rubric_id != null && (
          // TODO: Fix this
          // oxlint-disable-next-line jsx-a11y/anchor-is-valid
          <a
            href="#"
            className="ms-2 text-info"
            data-bs-toggle="tooltip"
            data-bs-title="این سوال دارای معیار نمره‌دهی (Rubric) است"
          >
            <i className="fas fa-list-check" />
          </a>
        )}
      </td>
      <td className="align-middle">{question.qid}</td>
      <td className="text-center align-middle">
        {question.max_auto_points
          ? resLocals.assessment.type === 'Exam'
            ? (question.points_list || [question.max_manual_points ?? 0])
                .map((p) => p - (question.max_manual_points ?? 0))
                .join(',')
            : (question.init_points ?? 0) - (question.max_manual_points ?? 0)
          : '—'}
      </td>
      <td className="text-center align-middle">{question.max_manual_points || '—'}</td>
      <td className="text-center align-middle" data-testid="iq-to-grade-count">
        {question.num_instance_questions_to_grade} / {question.num_instance_questions}
      </td>
      <td className="align-middle">
        <ProgressBar
          partial={question.num_instance_questions_to_grade}
          total={question.num_instance_questions}
        />
      </td>
      <td className="align-middle">
        {question.num_instance_questions_assigned > 0 && (
          <>
            <strong className="bg-warning rounded px-1">{currentUserName}</strong>
            {otherAssignedGraders.length > 0 && ', '}
          </>
        )}
        {otherAssignedGraders.join(', ')}
        {question.num_instance_questions_unassigned > 0 && (
          <>
            <small className="text-muted">
              ({question.num_instance_questions_unassigned} تخصیص‌نیافته)
            </small>
            {resLocals.authz_data.has_course_instance_permission_edit && (
              <button
                type="button"
                className="btn btn-sm btn-ghost"
                data-bs-toggle="modal"
                data-bs-target="#grader-assignment-modal"
                data-assessment-question-id={question.id}
                aria-label="تخصیص به مصححین"
              >
                <i className="fas fa-pencil" />
              </button>
            )}
          </>
        )}
      </td>
      <td className="align-middle">
        {(question.actual_graders || []).map((u) => u.name ?? u.uid).join(', ')}
      </td>
      <td className="align-middle">
        {showGradingButton && (
          <a className="btn btn-xs btn-primary" href={`${gradingUrl}/next_ungraded`}>
            تصحیح ارسال بعدی
          </a>
        )}
      </td>
    </tr>
  );
}

function ProgressBar({ partial, total }: { partial: number | null; total: number | null }) {
  if (total == null || total <= 0) return null;
  const progress = Math.floor(100 * (1 - (partial ?? 0) / total));
  return (
    <div className="progress border" style={{ minWidth: '4em', maxWidth: '10em' }}>
      <div className="progress-bar bg-light" style={{ width: `${progress}%` }} />
      <div className="progress-bar bg-danger" style={{ width: `${100 - progress}%` }} />
    </div>
  );
}

function GraderAssignmentModal({
  csrfToken,
  courseStaff,
}: {
  csrfToken: string;
  courseStaff: User[];
}) {
  return Modal({
    id: 'grader-assignment-modal',
    title: 'تخصیص نمونه‌های سوال به مصححین',
    body: renderHtml(
      courseStaff.length > 0 ? (
        <>
          <p>تخصیص نمونه‌های سوال به مصححین زیر:</p>
          {courseStaff.map((staff) => (
            <div key={staff.id} className="form-check">
              <input
                type="checkbox"
                id={`grader-assignment-${staff.id}`}
                name="assigned_grader"
                value={staff.id}
                className="form-check-input"
              />
              <label className="form-check-label" htmlFor={`grader-assignment-${staff.id}`}>
                {staff.name ? `${staff.name} (${staff.uid})` : staff.uid}
              </label>
            </div>
          ))}
          <div className="mt-3 mb-0 small alert alert-info">
            تنها نمونه‌های سوالی که نیازمند تصحیح هستند و هنوز به مصححی تخصیص داده نشده‌اند تغییر
            خواهند کرد. در صورت انتخاب بیش از یک مصحح، نمونه‌ها به‌صورت تصادفی بین مصححین تقسیم
            می‌شوند.
          </div>
        </>
      ) : (
        <p>
          در حال حاضر هیچ عضو کادر آموزشی با دسترسی ویرایشگر به این دوره تخصیص داده نشده است.
        </p>
      ),
    ),
    footer: renderHtml(
      <>
        <input type="hidden" name="unsafe_assessment_question_id" value="" />
        <input type="hidden" name="__csrf_token" value={csrfToken} />
        <input type="hidden" name="__action" value="assign_graders" />
        <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">
          انصراف
        </button>
        <button type="submit" className="btn btn-primary" disabled={courseStaff.length === 0}>
          تخصیص
        </button>
      </>,
    ),
  });
}
