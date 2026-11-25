import { Button, Modal } from 'react-bootstrap';

export function ExamResetNotSupportedModal({
  show,
  onHide,
  onExited,
}: {
  show: boolean;
  onHide: () => void;
  onExited: () => void;
}) {
  return (
    <Modal show={show} size="lg" backdrop="static" onHide={onHide} onExited={onExited}>
      <Modal.Header closeButton>
        <Modal.Title>پشتیبانی نمی‌شود</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>بازنشانی نسخه‌های سوال برای ارزیابی‌های نوع امتحان (Exam) پشتیبانی نمی‌شود.</p>
        <p className="mb-0">
          گزینه‌های جایگزین مانند حذف نمونه‌های ارزیابی را برای شروع مجدد دانشجویان در نظر بگیرید.
        </p>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="primary" onClick={onHide}>
          بستن
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
