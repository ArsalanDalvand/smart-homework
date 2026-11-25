import { Button } from 'react-bootstrap';

/**
 * Shown in the question tree when an assessment has no zones and the user is
 * not editing. The call-to-action adapts to whether the course has any
 * questions yet: if it does, the primary action adds existing questions (enter
 * edit mode, create the first zone, and open the picker); if it doesn't, the
 * primary action is to create the course's first question. Adding a shared
 * question to an empty course is still possible via the manual edit flow.
 */
export function AssessmentTreeEmptyState({
  canEdit,
  canAddQuestions,
  courseHasQuestions,
  questionCreateUrl,
  onAddFirstQuestions,
}: {
  canEdit: boolean;
  canAddQuestions: boolean;
  courseHasQuestions: boolean;
  questionCreateUrl: string;
  onAddFirstQuestions: () => void;
}) {
  return (
    <div
      className="d-flex flex-column align-items-center justify-content-center h-100 text-center p-4"
      style={{ textWrap: 'balance' }}
    >
      <i className="bi bi-card-checklist text-muted display-6 mb-2" aria-hidden="true" />
      <p className="fw-bold mb-1">این ارزیابی هنوز هیچ سوالی ندارد</p>
      {courseHasQuestions ? (
        <>
          <p className="text-muted mb-3">
            سوالات در بخش‌ها سازمان‌دهی می‌شوند. اطلاعات بیشتر را در{' '}
            <a
              href="https://docs.prairielearn.com/assessment/configuration/#question-specification"
              target="_blank"
              rel="noreferrer"
            >
              مستندات ارزیابی
            </a>{' '}
            ببینید.
          </p>
          {canAddQuestions && (
            <Button variant="primary" size="sm" type="button" onClick={onAddFirstQuestions}>
              <i className="bi bi-plus-lg me-1" aria-hidden="true" />
              افزودن سوالات
            </Button>
          )}
        </>
      ) : (
        <>
          <p className="text-muted mb-3">
            درس شما هنوز هیچ سوالی ندارد. اولین سوال خود را بسازید تا به این ارزیابی اضافه شود.
          </p>
          {canEdit && (
            <Button variant="primary" size="sm" href={questionCreateUrl}>
              <i className="bi bi-plus-lg me-1" aria-hidden="true" />
              ایجاد سوال
            </Button>
          )}
        </>
      )}
    </div>
  );
}
