import { Modal } from 'react-bootstrap';

import { uiStrings } from '../../../lib/branding.js';
import type { UserAccessToken } from '../../../lib/client/safe-db-types.js';

interface DeleteTokenModalProps {
  token: UserAccessToken | null;
  csrfToken: string;
  onClose: () => void;
}

export function DeleteTokenModal({ token, csrfToken, onClose }: DeleteTokenModalProps) {
  return (
    <Modal show={token !== null} onHide={onClose} contentClassName="text-end" dir="rtl">
      <Modal.Header closeButton style={{ fontFamily: 'var(--font-persian)' }}>
        <Modal.Title>{uiStrings.userSettings.deleteTokenModalTitle}</Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ fontFamily: 'var(--font-persian)' }}>
        <form method="POST" id="delete-token-form">
          <input type="hidden" name="__action" value="token_delete" />
          <input type="hidden" name="__csrf_token" value={csrfToken} />
          <input type="hidden" name="token_id" value={token?.id ?? ''} />
          <p className="mb-0 text-danger">
            {uiStrings.userSettings.deleteTokenWarning}
          </p>
        </form>
      </Modal.Body>
      <Modal.Footer className="d-flex justify-content-between" style={{ fontFamily: 'var(--font-persian)' }}>
        <button type="button" className="btn btn-secondary" onClick={onClose}>
          {uiStrings.common.cancel}
        </button>
        <button type="submit" className="btn btn-danger" form="delete-token-form">
          {uiStrings.userSettings.deleteTokenSubmit}
        </button>
      </Modal.Footer>
    </Modal>
  );
}

DeleteTokenModal.displayName = 'DeleteTokenModal';

