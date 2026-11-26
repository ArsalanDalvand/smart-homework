import { Modal } from 'react-bootstrap';

import { SHORT_NAME_PATTERN } from '../../../../lib/short-name.js';

export function FinalizeModal({
  csrfToken,
  show,
  onHide,
  defaultTitle,
  defaultQid,
}: {
  csrfToken: string;
  show: boolean;
  onHide: () => void;
  defaultTitle?: string;
  defaultQid?: string;
}) {
  return (
    <Modal show={show} size="lg" backdrop="static" onHide={onHide}>
      <Modal.Header closeButton>
        <Modal.Title>نهایی‌سازی سوال</Modal.Title>
      </Modal.Header>
      <form method="POST" autoComplete="off">
        <Modal.Body>
          <div className="alert alert-primary" role="alert">
            پس از نهایی‌سازی سوال، می‌توانید از آن در آزمون‌ها و تکالیف استفاده کرده و ویرایش‌های دستی انجام دهید.
          </div>
          <div className="mb-3">
            <label htmlFor="question-title" className="form-label">
              عنوان
            </label>
            <input
              type="text"
              className="form-control"
              id="question-title"
              name="title"
              defaultValue={defaultTitle}
              required
            />
            <div className="form-text text-muted">
              عنوان سوال به شکلی که در بانک سوالات نمایش داده می‌شود، مثلاً «جمع دو عدد تصادفی».
            </div>
          </div>
          <div className="mb-3">
            <label htmlFor="question-qid" className="form-label">
              شناسه سوال (QID)
            </label>
            <input
              type="text"
              className="form-control"
              id="question-qid"
              name="qid"
              defaultValue={defaultQid}
              pattern={SHORT_NAME_PATTERN}
              required
            />
            <div className="form-text text-muted">
              یک شناسه یکتا که برای افزودن این سوال به آزمون‌ها و تکالیف استفاده می‌شود، مثلاً{' '}
              <code>add-random-numbers</code>.
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <input type="hidden" name="__action" value="save_question" />
          <input type="hidden" name="__csrf_token" value={csrfToken} />
          <button type="button" className="btn btn-secondary" onClick={onHide}>
            بستن
          </button>
          <button type="submit" className="btn btn-primary">
            نهایی‌سازی سوال
          </button>
        </Modal.Footer>
      </form>
    </Modal>
  );
}
