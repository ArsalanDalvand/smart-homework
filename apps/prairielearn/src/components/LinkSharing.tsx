import { useState } from 'react';
import { Button, Form, InputGroup } from 'react-bootstrap';

import { OverlayTrigger } from '@prairielearn/ui';

import { CopyButton } from './CopyButton.js';
import { QRCodeModal } from './QRCodeModal.js';

export function PublicLinkSharing({
  publicLink,
  sharingMessage,
  publicLinkMessage,
}: {
  publicLink: string;
  sharingMessage: string;
  publicLinkMessage: string;
}) {
  const [showQR, setShowQR] = useState(false);
  return (
    <>
      <p>
        <span className="badge color-green3 me-1">عمومی</span>
        {sharingMessage}
      </p>
      <div className="mb-3">
        <label htmlFor="publicLink">پیوند عمومی</label>
        <InputGroup>
          <Form.Control
            type="text"
            id="publicLink"
            className="bg-body-secondary"
            value={publicLink}
            readOnly
          />
          <CopyButton
            text={publicLink}
            ariaLabel="کپی پیوند عمومی"
            className="btn-sm btn-outline-secondary"
          />
          <Button
            size="sm"
            variant="outline-secondary"
            aria-label="رمزینه QR پیوند عمومی"
            onClick={() => setShowQR(true)}
          >
            <i className="fas fa-qrcode" />
          </Button>
        </InputGroup>
        <small className="form-text text-muted">{publicLinkMessage}</small>
      </div>
      <QRCodeModal
        id="publicLinkModal"
        title="رمزینه QR پیوند عمومی"
        content={publicLink}
        show={showQR}
        onHide={() => setShowQR(false)}
      />
    </>
  );
}

export function StudentLinkSharing({
  studentLink,
  studentLinkMessage,
}: {
  studentLink: string;
  studentLinkMessage: string;
}) {
  const [showQR, setShowQR] = useState(false);
  return (
    <div className="mb-0">
      <label className="form-label" htmlFor="student_link">
        پیوند دانشجو
      </label>
      <InputGroup>
        <Form.Control
          type="text"
          id="student_link"
          className="bg-body-secondary"
          value={studentLink}
          readOnly
        />
        <CopyButton
          text={studentLink}
          ariaLabel="کپی پیوند دانشجو"
          className="btn-sm btn-outline-secondary"
        />
        <OverlayTrigger
          tooltip={{
            body: 'مشاهده رمزینه QR',
            props: { id: 'student-link-qr-code-tooltip' },
          }}
        >
          <Button
            size="sm"
            variant="outline-secondary"
            aria-label="رمزینه QR پیوند دانشجو"
            onClick={() => setShowQR(true)}
          >
            <i className="bi bi-qr-code-scan" />
          </Button>
        </OverlayTrigger>
      </InputGroup>
      <small className="form-text text-muted">{studentLinkMessage}</small>
      <QRCodeModal
        id="studentLinkModal"
        title="رمزینه QR پیوند دانشجو"
        content={studentLink}
        show={showQR}
        onHide={() => setShowQR(false)}
      />
    </div>
  );
}
