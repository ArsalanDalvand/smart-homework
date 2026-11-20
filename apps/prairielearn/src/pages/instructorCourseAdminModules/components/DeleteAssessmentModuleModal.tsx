import { Modal } from 'react-bootstrap';

import type { AssessmentModuleFormRow } from '../instructorCourseAdminModules.types.js';

export type DeleteAssessmentModuleModalData = AssessmentModuleFormRow;

export function DeleteAssessmentModuleModal({
  show,
  data,
  onHide,
  onExited,
  onConfirm,
}: {
  show: boolean;
  data: DeleteAssessmentModuleModalData | null;
  onHide: () => void;
  onExited: () => void;
  onConfirm: (module: AssessmentModuleFormRow) => void;
}) {
  const count = data?.assessments.length ?? 0;

  return (
    <Modal show={show} onHide={onHide} onExited={onExited} dir="rtl">
      <Modal.Header closeButton style={{ fontFamily: 'var(--font-persian)' }}>
        <Modal.Title>حذف پودمان ارزیابی</Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ fontFamily: 'var(--font-persian)' }}>
        {data && (
          <p className="mb-0">
            با حذف پودمان <strong>{data.name}</strong>، تعداد {count} آزمون و تکلیف موجود در آن به پودمان{' '}
            <strong>پیش‌فرض (Default)</strong> منتقل خواهند شد. این تغییر پس از کلیک روی دکمه ذخیره اعمال می‌شود.
          </p>
        )}
      </Modal.Body>
      <Modal.Footer style={{ fontFamily: 'var(--font-persian)' }}>
        <button className="btn btn-secondary" type="button" onClick={onHide}>
          انصراف
        </button>
        <button
          className="btn btn-danger"
          type="button"
          onClick={() => {
            if (data) onConfirm(data);
          }}
        >
          حذف پودمان
        </button>
      </Modal.Footer>
    </Modal>
  );
}

DeleteAssessmentModuleModal.displayName = 'DeleteAssessmentModuleModal';
