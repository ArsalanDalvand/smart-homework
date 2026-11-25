import { Modal } from 'react-bootstrap';

export function ResetQuestionVariantsModal({
  csrfToken,
  assessmentQuestionId,
  show,
  onHide,
  onExited,
}: {
  csrfToken: string;
  assessmentQuestionId: string;
  show: boolean;
  onHide: () => void;
  onExited: () => void;
}) {
  return (
    <Modal show={show} size="lg" backdrop="static" onHide={onHide} onExited={onExited}>
      <Modal.Header closeButton>
        <Modal.Title>تایید بازنشانی نسخه‌های سوال</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>
          آیا از بازنشانی تمام نسخه‌های فعلی این سوال مطمئن هستید؟{' '}
          <strong>تمامی تلاش‌های نمره‌داده‌نشده از بین خواهند رفت.</strong>
        </p>
        <p>دانشجویان در مراجعه بعدی به این سوال، نسخه جدیدی دریافت خواهند کرد.</p>
      </Modal.Body>
      <Modal.Footer>
        <form method="POST">
          <input type="hidden" name="__action" value="reset_question_variants" />
          <input type="hidden" name="__csrf_token" value={csrfToken} />
          <input type="hidden" name="unsafe_assessment_question_id" value={assessmentQuestionId} />
          <button type="button" className="btn btn-secondary me-1" onClick={onHide}>
            انصراف
          </button>
          <button type="submit" className="btn btn-danger">
            بازنشانی نسخه‌های سوال
          </button>
        </form>
      </Modal.Footer>
    </Modal>
  );
}
