import { Alert } from 'react-bootstrap';

export function ReviewSubmissionsAlert({ onDismiss }: { onDismiss?: () => void }) {
  return (
    <Alert variant="info" className="mb-3" dismissible={!!onDismiss} onClose={onDismiss}>
      <div className="d-flex flex-wrap align-items-center gap-2 gap-lg-3">
        <div className="d-flex align-items-center gap-2 flex-shrink-0">
          <i className="bi bi-stars fs-5" aria-hidden="true" />
          <strong>بررسی ارسال‌های تصحیح‌شده با هوش مصنوعی</strong>
        </div>
        <span className="small text-body-secondary">
          برای بررسی تصحیح هوش مصنوعی، یکی از نمونه‌های زیر را باز کنید.
        </span>
      </div>
    </Alert>
  );
}
