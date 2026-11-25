import { Button, Modal } from 'react-bootstrap';

export function AiGradingUnavailableModal({ show, onHide }: { show: boolean; onHide: () => void }) {
  return (
    <Modal show={show} onHide={onHide}>
      <Modal.Header closeButton>
        <Modal.Title>تصحیح با هوش مصنوعی در دسترس نیست</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>
          تصحیح با هوش مصنوعی تنها برای سوالاتی پشتیبانی می‌شود که دارای بخش تصحیح دستی هستند.
          برای فعال‌سازی تصحیح دستی، مقدار <code>manualPoints</code> را غیرصفر تنظیم کنید.
        </p>
        <p className="mb-0">
          برای اطلاعات بیشتر،{' '}
          <a
            href="https://docs.prairielearn.com/manualGrading/"
            target="_blank"
            rel="noopener noreferrer"
          >
            مستندات تصحیح دستی
          </a>{' '}
          را مشاهده کنید.
        </p>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          بستن
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
