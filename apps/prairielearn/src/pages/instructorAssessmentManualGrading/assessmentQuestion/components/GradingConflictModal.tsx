import { Button, Modal } from 'react-bootstrap';

export type ConflictModalState = {
  type: 'conflict';
  conflictDetailsUrl: string;
} | null;

export function GradingConflictModal({
  modalState,
  onHide,
}: {
  modalState: ConflictModalState;
  onHide: () => void;
}) {
  return (
    <Modal show={modalState != null} onHide={onHide}>
      <Modal.Header closeButton>
        <Modal.Title>تداخل در تصحیح شناسایی شد</Modal.Title>
      </Modal.Header>

      <Modal.Body>
        <p>مصحح دیگری قبلاً این ارسال را تصحیح کرده است.</p>
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          بستن
        </Button>
        <Button variant="primary" href={modalState?.conflictDetailsUrl}>
          مشاهده جزئیات
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
