import { useState } from 'react';
import { Modal } from 'react-bootstrap';

import { ColorPicker } from '../../../components/ColorPicker.js';
import type { InstructorCourseAdminSetFormRow } from '../instructorCourseAdminSets.types.js';

export interface EditAssessmentSetModalData {
  mode: 'create' | 'edit';
  assessmentSet: InstructorCourseAdminSetFormRow;
}

export function EditAssessmentSetsModal({
  show,
  data,
  onHide,
  onExited,
  onSave,
  existingNames,
}: {
  show: boolean;
  data: EditAssessmentSetModalData | null;
  onHide: () => void;
  onExited: () => void;
  onSave: (assessmentSet: InstructorCourseAdminSetFormRow) => void;
  existingNames: Set<string>;
}) {
  const [assessmentSet, setAssessmentSet] = useState<InstructorCourseAdminSetFormRow | null>(null);

  function handleModalEntering() {
    if (!data) return;
    setAssessmentSet(data.assessmentSet);
  }

  function handleModalExited() {
    setAssessmentSet(null);
    onExited();
  }

  function handleSubmit(e: React.SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!assessmentSet) return;
    onSave(assessmentSet);
  }

  return (
    <Modal
      show={show}
      onHide={onHide}
      onEntering={handleModalEntering}
      onExited={handleModalExited}
      dir="rtl"
    >
      <Modal.Header closeButton style={{ fontFamily: 'var(--font-persian)' }}>
        <Modal.Title>
          {data?.mode === 'create' ? 'افزودن دسته ارزیابی جدید' : 'ویرایش دسته ارزیابی'}
        </Modal.Title>
      </Modal.Header>
      <form onSubmit={handleSubmit} style={{ fontFamily: 'var(--font-persian)' }}>
        <Modal.Body>
          {assessmentSet ? (
            <>
              <div className="d-flex flex-column align-items-center mb-4">
                <span className={`badge color-${assessmentSet.color}`}>
                  {assessmentSet.abbreviation || 'پیش‌نمایش'}
                </span>
              </div>
              <div className="mb-3">
                <label className="form-label" htmlFor="abbreviation">
                  نشان اختصاری (مخفف)
                </label>
                <input
                  type="text"
                  className="form-control"
                  id="abbreviation"
                  placeholder="مثال: HW, Exam, Quiz"
                  value={assessmentSet.abbreviation}
                  required
                  onChange={({ currentTarget }) =>
                    setAssessmentSet({
                      ...assessmentSet,
                      abbreviation: currentTarget.value,
                    })
                  }
                />
              </div>
              <div className="mb-3">
                <label className="form-label" htmlFor="name">
                  عنوان دسته ارزیابی
                </label>
                <input
                  type="text"
                  className="form-control"
                  id="name"
                  placeholder="مثال: تکالیف هفتگی، کوئیزها، آزمون میان‌ترم"
                  value={assessmentSet.name}
                  aria-describedby={
                    show && assessmentSet.name && existingNames.has(assessmentSet.name)
                      ? 'name-warning'
                      : undefined
                  }
                  required
                  onChange={({ currentTarget }) =>
                    setAssessmentSet({
                      ...assessmentSet,
                      name: currentTarget.value,
                    })
                  }
                />
                {show && assessmentSet.name && existingNames.has(assessmentSet.name) && (
                  <div
                    id="name-warning"
                    className="alert alert-warning mt-2 mb-0 py-2"
                    role="alert"
                  >
                    <i className="fa fa-exclamation-triangle me-1" aria-hidden="true" /> یک دسته ارزیابی دیگر با این نام وجود دارد.
                  </div>
                )}
              </div>
              <div className="mb-3">
                <label className="form-label" htmlFor="heading">
                  سربرگ دسته‌بندی
                </label>
                <input
                  type="text"
                  className="form-control"
                  id="heading"
                  placeholder="مثال: تکالیف سری اول"
                  value={assessmentSet.heading}
                  onChange={({ currentTarget }) =>
                    setAssessmentSet({
                      ...assessmentSet,
                      heading: currentTarget.value,
                    })
                  }
                />
              </div>
              <div className="mb-3">
                <label className="form-label" htmlFor="color">
                  رنگ نشان دسته
                </label>
                <ColorPicker
                  id="color"
                  value={assessmentSet.color}
                  required
                  onChange={(color) =>
                    setAssessmentSet({
                      ...assessmentSet,
                      color,
                    })
                  }
                />
              </div>
            </>
          ) : null}
        </Modal.Body>
        <Modal.Footer>
          <button className="btn btn-secondary" type="button" onClick={onHide}>
            انصراف
          </button>
          <button className="btn btn-primary" type="submit">
            {data?.mode === 'create' ? 'افزودن دسته' : 'تایید و ذخیره'}
          </button>
        </Modal.Footer>
      </form>
    </Modal>
  );
}
