import { Modal } from 'react-bootstrap';

import { uiStrings } from '../../../lib/branding.js';

interface GenerateTokenModalProps {
  show: boolean;
  csrfToken: string;
  onClose: () => void;
}

export function GenerateTokenModal({ show, csrfToken, onClose }: GenerateTokenModalProps) {
  return (
    <Modal show={show} onHide={onClose} contentClassName="text-end" dir="rtl">
      <Modal.Header closeButton style={{ fontFamily: 'var(--font-persian)' }}>
        <Modal.Title>{uiStrings.userSettings.generateTokenModalTitle}</Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ fontFamily: 'var(--font-persian)' }}>
        <form method="POST" id="generate-token-form">
          <input type="hidden" name="__action" value="token_generate" />
          <input type="hidden" name="__csrf_token" value={csrfToken} />
          <div className="mb-3">
            <label className="form-label d-block text-end" htmlFor="token_name">
              {uiStrings.userSettings.tokenNameLabel}
            </label>
            <input
              type="text"
              className="form-control text-end"
              id="token_name"
              name="token_name"
              placeholder={uiStrings.userSettings.tokenNamePlaceholder}
              autoComplete="off"
              required
            />
          </div>
        </form>
      </Modal.Body>
      <Modal.Footer className="d-flex justify-content-between" style={{ fontFamily: 'var(--font-persian)' }}>
        <button type="button" className="btn btn-secondary" onClick={onClose}>
          {uiStrings.common.cancel}
        </button>
        <button type="submit" className="btn btn-primary" form="generate-token-form">
          {uiStrings.userSettings.generateTokenSubmit}
        </button>
      </Modal.Footer>
    </Modal>
  );
}

GenerateTokenModal.displayName = 'GenerateTokenModal';

