import clsx from 'clsx';
import { useState } from 'react';
import { Modal } from 'react-bootstrap';

import { OverlayTrigger, useModalState } from '@prairielearn/ui';

import { AssessmentBadge } from '../../../components/AssessmentBadge.js';
import type { EditableCourse, SelectedAssessments } from '../instructorQuestionSettings.types.js';

function CopyQuestionPopover({
  editableCourses,
  courseId,
  csrfToken,
  onCancel,
}: {
  editableCourses: EditableCourse[];
  courseId: string;
  csrfToken: string;
  onCancel: () => void;
}) {
  return (
    <form name="copy-question-form" method="POST" dir="rtl" style={{ fontFamily: 'var(--font-persian)' }}>
      <input type="hidden" name="__action" value="copy_question" />
      <input type="hidden" name="__csrf_token" value={csrfToken} />
      <div className="mb-3">
        <label className="form-label" htmlFor="to-course-id-select">
          نسخه کپی‌شده سوال به این درس افزوده خواهد شد:
        </label>
        <select
          className="form-select"
          id="to-course-id-select"
          name="to_course_id"
          defaultValue={courseId}
          required
        >
          {editableCourses.map((c) => (
            <option key={c.id} value={c.id}>
              {c.short_name}
            </option>
          ))}
        </select>
      </div>
      <div className="d-flex justify-content-between">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>
          انصراف
        </button>
        <button type="submit" className="btn btn-primary">
          تایید و کپی
        </button>
      </div>
    </form>
  );
}

function DeleteQuestionModal({
  qid,
  assessmentsWithQuestion,
  csrfToken,
  show,
  onHide,
  onExited,
}: {
  qid: string;
  assessmentsWithQuestion: SelectedAssessments[];
  csrfToken: string;
  show: boolean;
  onHide: () => void;
  onExited: () => void;
}) {
  return (
    <Modal show={show} onHide={onHide} onExited={onExited} dir="rtl">
      <Modal.Header closeButton style={{ fontFamily: 'var(--font-persian)' }}>
        <Modal.Title>حذف سوال</Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ fontFamily: 'var(--font-persian)' }}>
        <p>
          آیا از حذف دائمی سوال <strong dir="ltr">{qid}</strong> اطمینان دارید؟
        </p>
        {assessmentsWithQuestion.length > 0 && (
          <>
            <p>این سوال از آزمون‌ها و ارزیابی‌های زیر نیز حذف خواهد شد:</p>
            <ul className="list-group my-4">
              {assessmentsWithQuestion.map((aWithQ) => (
                <li key={aWithQ.course_instance_id} className="list-group-item">
                  <div className="h6">
                    {aWithQ.short_name} ({aWithQ.long_name ?? <i>ناشناس</i>})
                  </div>
                  {aWithQ.assessments.map((assessment) => (
                    <AssessmentBadge
                      key={assessment.assessment_id}
                      courseInstanceId={aWithQ.course_instance_id}
                      assessment={assessment}
                    />
                  ))}
                </li>
              ))}
            </ul>
          </>
        )}
      </Modal.Body>
      <Modal.Footer style={{ fontFamily: 'var(--font-persian)' }}>
        <form method="POST">
          <input type="hidden" name="__action" value="delete_question" />
          <input type="hidden" name="__csrf_token" value={csrfToken} />
          <button type="button" className="btn btn-secondary me-2" onClick={onHide}>
            انصراف
          </button>
          <button type="submit" className="btn btn-danger">
            حذف قطعی سوال
          </button>
        </form>
      </Modal.Footer>
    </Modal>
  );
}

export function QuestionSettingsCardFooter({
  canEdit,
  canCopy,
  editableCourses,
  courseId,
  qid,
  assessmentsWithQuestion,
  csrfToken,
  questionGHLink,
}: {
  canEdit: boolean;
  canCopy: boolean;
  editableCourses: EditableCourse[];
  courseId: string;
  qid: string;
  assessmentsWithQuestion: SelectedAssessments[];
  csrfToken: string;
  questionGHLink: string | null;
}) {
  const [showCopyPopover, setShowCopyPopover] = useState(false);
  const deleteModalState = useModalState();

  if (!questionGHLink && !canCopy && !canEdit) return null;

  const rows: { key: string; node: React.ReactNode }[] = [];

  if (questionGHLink) {
    rows.push({
      key: 'github',
      node: (
        <>
          <div>
            <div className="fw-semibold">مشاهده سورس‌کد در گیت‌هاب</div>
            <div className="text-muted small">
              باز کردن فایل‌های منبع این سوال در مخزن گیت درس.
            </div>
          </div>
          <a
            className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center gap-2 ms-3"
            target="_blank"
            rel="noreferrer"
            aria-label="مشاهده در گیت‌هاب"
            href={questionGHLink}
          >
            <i className="bi bi-github" aria-hidden="true" />
            مشاهده در گیت‌هاب
          </a>
        </>
      ),
    });
  }

  if (canCopy) {
    rows.push({
      key: 'copy',
      node: (
        <>
          <div>
            <div className="fw-semibold">ایجاد نسخه کپی از این سوال</div>
            <div className="text-muted small">
              یک نسخه رونوشت از این سوال ایجاد کنید تا به عنوان پیش‌نویس سوال جدید استفاده شود.
            </div>
          </div>
          <OverlayTrigger
            trigger="click"
            placement="auto"
            show={showCopyPopover}
            popover={{
              props: { id: 'copyQuestionPopover' },
              header: 'کپی کردن این سوال',
              body: (
                <CopyQuestionPopover
                  editableCourses={editableCourses}
                  courseId={courseId}
                  csrfToken={csrfToken}
                  onCancel={() => setShowCopyPopover(false)}
                />
              ),
            }}
            onToggle={setShowCopyPopover}
          >
            <button
              type="button"
              className="btn btn-sm btn-outline-primary ms-3"
              id="copyQuestionButton"
            >
              <i className="bi bi-copy me-1" aria-hidden="true" /> کپی سوال
            </button>
          </OverlayTrigger>
        </>
      ),
    });
  }

  if (canEdit) {
    rows.push({
      key: 'delete',
      node: (
        <>
          <div>
            <div className="fw-semibold">حذف این سوال</div>
            <div className="text-muted small">حذف دائمی این سوال و فایل‌های مرتبط با آن.</div>
          </div>
          <button
            type="button"
            className="btn btn-sm btn-outline-danger ms-3"
            onClick={() => deleteModalState.showWithData(null)}
          >
            <i className="bi bi-trash me-1" aria-hidden="true" /> حذف سوال
          </button>
        </>
      ),
    });
  }

  return (
    <div className="card" style={{ fontFamily: 'var(--font-persian)' }}>
      <div className="card-body p-0">
        <h2 className="h5 card-title mb-0 px-3 py-3">مدیریت و عملیات روی سوال</h2>
        {rows.map((row, index) => (
          <div
            key={row.key}
            className={clsx(
              'd-flex flex-wrap justify-content-between align-items-center gap-2 px-3 py-3',
              index > 0 && 'border-top',
            )}
          >
            {row.node}
          </div>
        ))}
      </div>
      {canEdit && (
        <DeleteQuestionModal
          qid={qid}
          assessmentsWithQuestion={assessmentsWithQuestion}
          csrfToken={csrfToken}
          show={deleteModalState.show}
          onHide={deleteModalState.hide}
          onExited={deleteModalState.onExited}
        />
      )}
    </div>
  );
}

QuestionSettingsCardFooter.displayName = 'QuestionSettingsCardFooter';
