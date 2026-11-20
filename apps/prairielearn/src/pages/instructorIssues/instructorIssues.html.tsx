import { formatDistance } from 'date-fns';
import { z } from 'zod';

import { formatDate } from '@prairielearn/formatter';
import { DateFromISOString, IdSchema } from '@prairielearn/zod';

import { AssessmentBadge } from '../../components/AssessmentBadge.js';
import { Pager } from '../../components/Pager.js';
import {
  AssessmentSetSchema,
  CourseInstanceSchema,
  type Issue,
  IssueSchema,
  QuestionSchema,
  UserSchema,
  VariantSchema,
} from '../../lib/db-types.js';
import { issueMailtoLink } from '../../lib/issues.shared.js';

export const PAGE_SIZE = 100;

export const IssueRowSchema = IssueSchema.extend({
  course_instance_short_name: CourseInstanceSchema.shape.short_name.nullable(),
  course_instance_id: IdSchema.nullable(),
  display_timezone: CourseInstanceSchema.shape.display_timezone,
  assessment_id: IdSchema.nullable(),
  assessment: z
    .object({
      label: z.string(),
      assessment_id: IdSchema,
      color: AssessmentSetSchema.shape.color,
      deleted_at: DateFromISOString.nullable(),
    })
    .nullable(),
  assessment_instance_id: IdSchema.nullable(),
  question_qid: QuestionSchema.shape.qid.nullable(),
  user_name: UserSchema.shape.name.nullable(),
  user_email: UserSchema.shape.email.nullable(),
  user_uid: UserSchema.shape.uid.nullable(),
  variant_seed: VariantSchema.shape.variant_seed.nullable(),
  issue_count: z.number(),
});
type IssueRow = z.infer<typeof IssueRowSchema>;
type IssueComputedRow = IssueRow & {
  showUser: boolean;
  hideAssessmentLink: boolean;
};

const commonQueries = {
  allOpenQuery: 'is:open',
  allClosedQuery: 'is:closed',
  allManuallyReportedQuery: 'is:manually-reported',
  allAutomaticallyReportedQuery: 'is:automatically-reported',
};

const formattedCommonQueries = Object.fromEntries(
  Object.entries(commonQueries).map(([key, value]) => [key, `?q=${encodeURIComponent(value)}`]),
);

export function InstructorIssues({
  issues,
  filterQuery,
  openFilteredIssuesCount,
  openCount,
  closedCount,
  chosenPage,
  urlPrefix,
  csrfToken,
  hasCoursePermissionEdit,
  hasCoursePermissionPreview,
}: {
  issues: IssueComputedRow[];
  filterQuery: string;
  openFilteredIssuesCount: number;
  openCount: number;
  closedCount: number;
  chosenPage: number;
  urlPrefix: string;
  csrfToken: string;
  hasCoursePermissionEdit: boolean;
  hasCoursePermissionPreview: boolean;
}) {
  const issueCount = issues[0]?.issue_count ?? 0;

  return (
    <>
      {hasCoursePermissionEdit && (
        <CloseMatchingIssuesModal
          openFilteredIssuesCount={openFilteredIssuesCount}
          issues={issues}
          csrfToken={csrfToken}
        />
      )}
      <FilterHelpModal />

      <div className="card mb-4" style={{ fontFamily: 'var(--font-persian)' }}>
        <div className="card-header bg-primary text-white">
          <div className="d-flex flex-row align-items-center mb-2">
            <div className="d-flex flex-column">
              <h1 className="h6 fw-normal mb-0">گزارش‌های اشکال (Issues)</h1>
              <small>
                <a href={formattedCommonQueries.allOpenQuery} className="me-3 text-white text-decoration-none">
                  <i className="fa fa-exclamation-circle me-1" /> {openCount} مورد باز
                </a>
                <a href={formattedCommonQueries.allClosedQuery} className="text-white text-decoration-none">
                  <i className="fa fa-check-circle me-1" /> {closedCount} مورد بسته
                </a>
              </small>
            </div>
            {hasCoursePermissionEdit && openFilteredIssuesCount > 0 && (
              <button
                className="btn btn-sm btn-danger ms-auto"
                data-bs-toggle="modal"
                data-bs-target="#closeMatchingIssuesModal"
              >
                <i className="fa fa-times me-1" aria-hidden="true" /> بستن اشکالات منطبق
              </button>
            )}
          </div>
          <form method="GET">
            <div className="input-group">
              <button
                className="btn btn-med-light dropdown-toggle"
                type="button"
                data-bs-toggle="dropdown"
                aria-haspopup="true"
                aria-expanded="false"
              >
                فیلترها
              </button>
              <div className="dropdown-menu">
                <a className="dropdown-item" href={formattedCommonQueries.allOpenQuery}>
                  اشکالات باز
                </a>
                <a className="dropdown-item" href={formattedCommonQueries.allClosedQuery}>
                  اشکالات بسته
                </a>
                <a className="dropdown-item" href={formattedCommonQueries.allManuallyReportedQuery}>
                  گزارش‌های دستی فراگیران
                </a>
                <a
                  className="dropdown-item"
                  href={formattedCommonQueries.allAutomaticallyReportedQuery}
                >
                  گزارش‌های خودکار سامانه
                </a>
              </div>
              <input
                type="text"
                className="form-control"
                name="q"
                defaultValue={filterQuery}
                placeholder="جستجو در میان گزارش‌های اشکال..."
                aria-label="جستجو در میان گزارش‌های اشکال"
              />
              <button
                className="btn btn-med-light"
                type="submit"
                data-bs-toggle="tooltip"
                data-bs-title="جستجو"
                aria-label="جستجو"
              >
                <i className="fa fa-search" aria-hidden="true" />
              </button>
              <a
                className="btn btn-med-light"
                href={`${urlPrefix}/course_admin/issues?q=`}
                data-bs-toggle="tooltip"
                data-bs-title="پاک‌سازی فیلترها"
                aria-label="پاک‌سازی فیلترها"
              >
                <i className="fa fa-times" aria-hidden="true" />
              </a>
              <button
                className="btn btn-med-light"
                type="button"
                aria-label="راهنمای فیلترها"
                data-bs-toggle="modal tooltip"
                data-bs-target="#filterHelpModal"
                data-bs-title="راهنمای فیلترها"
              >
                <i className="fa fa-question-circle" aria-hidden="true" />
              </button>
            </div>
          </form>
        </div>

        {issues.length === 0 ? (
          <div className="card-body">
            <div className="text-center text-muted py-4">هیچ گزارش اشکالی با شرایط جستجوی فعلی یافت نشد.</div>
          </div>
        ) : (
          <div className="list-group list-group-flush">
            {issues.map((row) => (
              <IssueRow
                key={row.id}
                issue={row}
                urlPrefix={urlPrefix}
                hasCoursePermissionEdit={hasCoursePermissionEdit}
                hasCoursePermissionPreview={hasCoursePermissionPreview}
                csrfToken={csrfToken}
              />
            ))}
          </div>
        )}
        {issueCount > PAGE_SIZE && (
          <div className="card-body">
            <Pager
              extraQueryParams={`q=${encodeURIComponent(filterQuery)}`}
              chosenPage={chosenPage}
              count={issueCount}
              pageSize={PAGE_SIZE}
            />
          </div>
        )}
      </div>
    </>
  );
}

function IssueRow({
  issue,
  urlPrefix,
  hasCoursePermissionPreview,
  hasCoursePermissionEdit,
  csrfToken,
}: {
  issue: IssueComputedRow;
  urlPrefix: string;
  hasCoursePermissionPreview: boolean;
  hasCoursePermissionEdit: boolean;
  csrfToken: string;
}) {
  // oxlint-disable-next-line react/purity -- server-rendered only, no re-renders
  const now = Date.now();
  const mailtoLink = issueMailtoLink(issue);
  const userUid = issue.user_uid || '-';
  const userUidLink = mailtoLink ? <a href={mailtoLink}>{userUid}</a> : userUid;
  const questionPreviewUrl = `${urlPrefix}/question/${issue.question_id}/`;
  const studentViewUrl = `/pl/course_instance/${issue.course_instance_id}/instance_question/${issue.instance_question_id}/?variant_id=${issue.variant_id}`;
  const manualGradingUrl = `/pl/course_instance/${issue.course_instance_id}/instructor/assessment/${issue.assessment_id}/manual_grading/instance_question/${issue.instance_question_id}`;
  const assessmentInstanceUrl = `/pl/course_instance/${issue.course_instance_id}/instructor/assessment_instance/${issue.assessment_instance_id}`;

  return (
    <div
      className="list-group-item issue-list-item d-flex flex-row align-items-center"
      data-testid="issue-list-item"
    >
      <div style={{ minWidth: 0 }}>
        {issue.open ? (
          <i
            className="fa fa-exclamation-circle text-danger issue-status-icon"
            data-testid="issue-status-open"
          />
        ) : (
          <i
            className="fa fa-check-circle text-success issue-status-icon"
            data-testid="issue-status-closed"
          />
        )}
        <div className="d-block">
          <strong dir="ltr">{issue.question_qid}</strong>{' '}
          {!issue.instance_question_id ? (
            // Issue not associated to an instance question (originates from question preview)
            hasCoursePermissionPreview ? (
              <>
                (
                <a href={`${questionPreviewUrl}?variant_id=${issue.variant_id}`}>مشاهده مدرس</a>
                )
              </>
            ) : (
              <button
                type="button"
                className="badge text-bg-warning badge-sm"
                data-bs-toggle="tooltip"
                data-bs-html="true"
                title="این اشکال در جریان یک آزمون ثبت نشده است و شما به صورت مستقیم به این سوال دسترسی ندارید. دسترسی به درس توسط مالک درس در بخش کادر آموزشی قابل اعطا می‌باشد."
              >
                عدم دسترسی کافی
              </button>
            )
          ) : issue.showUser ? (
            (hasCoursePermissionPreview || !issue.assessment?.deleted_at) && (
              <>
                (
                {hasCoursePermissionPreview && (
                  <a href={`${questionPreviewUrl}?variant_id=${issue.variant_id}`}>
                    مشاهده مدرس
                  </a>
                )}
                {!issue.assessment?.deleted_at && (
                  <>
                    {hasCoursePermissionPreview && <>, </>}
                    <a href={studentViewUrl}>مشاهده فراگیر</a>،{' '}
                    <a href={manualGradingUrl}>تصحیح دستی</a>،{' '}
                    <a href={assessmentInstanceUrl}>جزئیات آزمون</a>
                  </>
                )}
                )
              </>
            )
          ) : (
            <>
              {hasCoursePermissionPreview && (
                <>
                  (
                  <a href={`${questionPreviewUrl}?variant_seed=${issue.variant_seed}`}>
                    مشاهده مدرس
                  </a>
                  ){' '}
                </>
              )}
              <button
                type="button"
                className="badge text-bg-warning badge-sm"
                data-bs-toggle="tooltip"
                data-bs-html="true"
                title={`این اشکال در دوره «${issue.course_instance_short_name}» ثبت شده است و شما به داده‌های فراگیران این دوره دسترسی ندارید. دسترسی به اطلاعات فراگیران توسط مالک درس در بخش کادر آموزشی قابل تنظیم است.`}
              >
                عدم دسترسی به داده‌های فراگیران
              </button>
            </>
          )}
        </div>
        <p className="mb-0" style={{ whiteSpace: 'pre-wrap' }}>
          {getFormattedMessage(issue)}
        </p>
        <small className="text-muted me-2">
          #{issue.id} ثبت شده{' '}
          {issue.date && (
            <span title={formatDate(issue.date, issue.display_timezone)}>
              {formatDistance(issue.date, now, { addSuffix: true })}
            </span>
          )}{' '}
          {issue.showUser && issue.user_id != null && (
            <>
              {issue.manually_reported ? 'توسط' : 'برای'} {issue.user_name || '-'} ({userUidLink})
            </>
          )}
        </small>
        <span className="d-inline-flex flex-wrap align-items-center gap-1">
          {issue.manually_reported ? (
            <span className="badge text-bg-info">گزارش دستی فراگیر</span>
          ) : (
            <span className="badge text-bg-warning">گزارش خودکار سامانه</span>
          )}
          {issue.assessment &&
            (issue.assessment.deleted_at ? (
              <span className="badge color-red3">{issue.assessment.label} (حذف‌شده)</span>
            ) : (
              issue.course_instance_id && (
                <AssessmentBadge
                  courseInstanceId={issue.course_instance_id}
                  hideLink={issue.hideAssessmentLink}
                  assessment={issue.assessment}
                />
              )
            ))}
          {issue.course_instance_short_name && (
            <span className="badge text-bg-dark">{issue.course_instance_short_name}</span>
          )}
        </span>
      </div>
      {hasCoursePermissionEdit && (
        <div className="ms-auto ps-4">
          <IssueActionButton issue={issue} csrfToken={csrfToken} />
        </div>
      )}
    </div>
  );
}

function getFormattedMessage(issue: Issue) {
  if (!issue.student_message) return '—';
  if (issue.manually_reported) return `"${issue.student_message}"`;
  return issue.student_message;
}

function CloseMatchingIssuesModal({
  openFilteredIssuesCount,
  issues,
  csrfToken,
}: {
  openFilteredIssuesCount: number;
  issues: IssueRow[];
  csrfToken: string;
}) {
  return (
    <form method="POST" autoComplete="off">
      <div
        className="modal fade"
        tabIndex={-1}
        role="dialog"
        id="closeMatchingIssuesModal"
        aria-labelledby="closeMatchingIssuesModal-title"
      >
        <div className="modal-dialog modal-lg" role="document" style={{ fontFamily: 'var(--font-persian)' }}>
          <div className="modal-content">
            <div className="modal-header">
              <h2 className="modal-title h4" id="closeMatchingIssuesModal-title">
                بستن اشکالات منطبق بر فیلتر
              </h2>
            </div>
            <div className="modal-body">
              <p>
                آیا از بستن <strong>{openFilteredIssuesCount}</strong> گزارش اشکال باز موجود در این صفحه اطمینان دارید؟
              </p>
            </div>
            <div className="modal-footer">
              <input type="hidden" name="__action" value="close_matching" />
              <input type="hidden" name="__csrf_token" value={csrfToken} />
              <input
                type="hidden"
                name="unsafe_issue_ids"
                value={issues.map((issue) => issue.id).join(',')}
              />
              <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">
                انصراف
              </button>
              <button type="submit" className="btn btn-danger">
                بستن اشکالات
              </button>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}

function FilterHelpModal() {
  return (
    <div
      className="modal fade"
      tabIndex={-1}
      role="dialog"
      id="filterHelpModal"
      aria-labelledby="filterHelpModal-title"
    >
      <div className="modal-dialog modal-lg" role="document" style={{ fontFamily: 'var(--font-persian)' }}>
        <div className="modal-content">
          <div className="modal-header">
            <h2 className="modal-title h4" id="filterHelpModal-title">
              راهنمای فیلتر و جستجوی اشکالات
            </h2>
          </div>
          <div className="modal-body">
            <p>
              می‌توانید گزارش‌های اشکال را با استفاده از الگوها و پیشوندهای زیر جستجو و فیلتر نمایید:
            </p>
            <div className="table-responsive">
              <table className="table table-bordered table-striped" aria-label="راهنمای فیلترهای جستجو">
                <thead>
                  <tr>
                    <th>عبارت فیلتر</th>
                    <th>توضیحات و کاربرد</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td dir="ltr">
                      <code>is:open</code>
                    </td>
                    <td>نمایش تمامی اشکالات در وضعیت باز</td>
                  </tr>
                  <tr>
                    <td dir="ltr">
                      <code>is:closed</code>
                    </td>
                    <td>نمایش تمامی اشکالات در وضعیت بسته</td>
                  </tr>
                  <tr>
                    <td dir="ltr">
                      <code>is:manually-reported</code>
                    </td>
                    <td>نمایش اشکالاتی که به صورت دستی توسط فراگیران گزارش شده‌اند</td>
                  </tr>
                  <tr>
                    <td dir="ltr">
                      <code>is:automatically-reported</code>
                    </td>
                    <td>نمایش اشکالاتی که به صورت خودکار توسط سامانه ثبت شده‌اند</td>
                  </tr>
                  <tr>
                    <td dir="ltr">
                      <code>
                        assessment:<em>short_name</em>
                      </code>
                    </td>
                    <td>
                      نمایش اشکالات مربوط به یک آزمون خاص؛ استفاده از <code>*</code> به عنوان کاراکتر عام مجاز است. مانند <code>assessment:HW*</code>
                    </td>
                  </tr>
                  <tr>
                    <td dir="ltr">
                      <code>
                        ci:<em>short_name</em>
                      </code>
                    </td>
                    <td>
                      نمایش اشکالات مربوط به یک دوره یا ترم تحصیلی خاص مانند <code>ci:Fall2026</code>
                    </td>
                  </tr>
                  <tr>
                    <td dir="ltr">
                      <code>
                        qid:<em>QID</em>
                      </code>
                    </td>
                    <td>
                      نمایش اشکالات مربوط به یک شناسه سوال مانند <code>qid:python/circle-area</code>
                    </td>
                  </tr>
                  <tr>
                    <td dir="ltr">
                      <code>
                        user:<em>UID</em>
                      </code>
                    </td>
                    <td>
                      نمایش اشکالات گزارش شده توسط فراگیر با شناسه کاربری / ایمیل مشخص
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <h3 className="h5 mt-3">جستجوی متنی</h3>
            <p>
              با وارد کردن هرگونه واژه یا عبارت، متن پیام گزارش فراگیران جستجو می‌شود.
            </p>

            <h3 className="h5 mt-3">نفی شرایط فیلتر</h3>
            <p>
              با قرار دادن علامت منفی (<code>-</code>) قبل از هر عبارت، آن شرط نفی می‌شود. برای مثال: <code>-is:manually-reported</code>
            </p>

            <h3 className="h5 mt-3">ترکیب شروط</h3>
            <p>می‌توانید چند عبارت را با فاصله در کنار هم قرار دهید:</p>
            <pre dir="ltr" className="bg-light p-2 rounded">
              <code>is:open qid:python/circle-area خطا در تست</code>
            </pre>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-primary" data-bs-dismiss="modal">
              بستن
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function IssueActionButton({ issue, csrfToken }: { issue: Issue; csrfToken: string }) {
  return (
    <form method="POST" style={{ whiteSpace: 'nowrap' }}>
      <input type="hidden" name="__csrf_token" value={csrfToken} />
      <input type="hidden" name="issue_id" value={issue.id} />
      <div className="btn-group btn-group-sm">
        {issue.open ? (
          <button
            className="btn btn-outline-secondary"
            name="__action"
            value="close"
            aria-label="بستن اشکال"
            data-bs-toggle="tooltip"
            data-bs-placement="top"
            data-bs-title="بستن اشکال"
          >
            <i className="fa fa-times" aria-hidden="true" />
          </button>
        ) : (
          <button
            className="btn btn-outline-secondary"
            name="__action"
            value="open"
            aria-label="بازگشایی مجدد اشکال"
            data-bs-toggle="tooltip"
            data-bs-placement="top"
            data-bs-title="بازگشایی مجدد اشکال"
          >
            <i className="fa fa-rotate-right" aria-hidden="true" />
          </button>
        )}
      </div>
    </form>
  );
}
