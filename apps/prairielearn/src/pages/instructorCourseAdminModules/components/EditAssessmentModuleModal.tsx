import clsx from 'clsx';
import { Modal } from 'react-bootstrap';
import { useForm } from 'react-hook-form';

import type { AssessmentModuleFormRow } from '../instructorCourseAdminModules.types.js';

export interface EditAssessmentModuleModalData {
  mode: 'create' | 'edit';
  assessmentModule: AssessmentModuleFormRow;
}

interface ModuleFormValues {
  name: string;
  heading: string;
}

export function EditAssessmentModuleModal({
  show,
  data,
  onHide,
  onExited,
  onSave,
  existingNames,
  lockName,
}: {
  show: boolean;
  data: EditAssessmentModuleModalData | null;
  onHide: () => void;
  onExited: () => void;
  onSave: (assessmentModule: AssessmentModuleFormRow) => void;
  existingNames: Set<string>;
  lockName: boolean;
}) {
  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<ModuleFormValues>({
    // Reactive values because this modal stays mounted while editing different modules.
    values: {
      name: data?.assessmentModule.name ?? '',
      heading: data?.assessmentModule.heading ?? '',
    },
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
  });

  const onFormSubmit = (formData: ModuleFormValues) => {
    if (!data) return;
    onSave({
      ...data.assessmentModule,
      // The Default module's name field is disabled, so keep its existing name.
      name: lockName ? data.assessmentModule.name : formData.name.trim(),
      heading: formData.heading.trim(),
    });
  };

  const nameValue = watch('name');
  const nameConflicts = show && !!nameValue.trim() && existingNames.has(nameValue.trim());

  return (
    <Modal
      show={show}
      onHide={onHide}
      onExited={() => {
        reset();
        onExited();
      }}
      dir="rtl"
    >
      <Modal.Header closeButton style={{ fontFamily: 'var(--font-persian)' }}>
        <Modal.Title>{data?.mode === 'create' ? 'افزودن پودمان جدید' : 'ویرایش پودمان'}</Modal.Title>
      </Modal.Header>
      <form onSubmit={handleSubmit(onFormSubmit)} style={{ fontFamily: 'var(--font-persian)' }}>
        <Modal.Body>
          <div className="mb-3">
            <label className="form-label" htmlFor="module-name">
              عنوان پودمان (کد اختصاری)
            </label>
            <input
              id="module-name"
              type="text"
              placeholder="مثال: Ch01, Intro, Advanced"
              defaultValue={data?.assessmentModule.name ?? ''}
              className={clsx('form-control', errors.name && 'is-invalid')}
              aria-invalid={errors.name ? true : undefined}
              aria-errormessage={errors.name ? 'module-name-error' : undefined}
              aria-describedby={nameConflicts ? 'module-name-warning' : undefined}
              disabled={lockName}
              {...register('name', {
                validate: (value) => value.trim().length > 0 || 'وارد کردن عنوان پودمان الزامی است',
              })}
            />
            {errors.name && (
              <div id="module-name-error" className="invalid-feedback d-block">
                {errors.name.message}
              </div>
            )}
            <small className="form-text text-muted">
              {lockName
                ? 'پودمان پیش‌فرض (Default) اجباری است و امکان تغییر نام آن وجود ندارد.'
                : 'نام کوتاه و اختصاری برای پودمان (ترجیحا ۱ تا ۳ کلمه)، به عنوان مثال "مقدمه" یا "فصل اول".'}
            </small>
            {nameConflicts && (
              <div
                id="module-name-warning"
                className="alert alert-warning mt-2 mb-0 py-2"
                role="alert"
              >
                <i className="fa fa-exclamation-triangle me-1" aria-hidden="true" /> یک پودمان دیگر با این نام وجود دارد.
              </div>
            )}
          </div>
          <div>
            <label className="form-label" htmlFor="module-heading">
              سربرگ نمایشی برای دانشجویان
            </label>
            <input
              id="module-heading"
              type="text"
              placeholder="مثال: فصل اول — مقدمات و مفاهیم پایه"
              defaultValue={data?.assessmentModule.heading ?? ''}
              className={clsx('form-control', errors.heading && 'is-invalid')}
              aria-invalid={errors.heading ? true : undefined}
              aria-errormessage={errors.heading ? 'module-heading-error' : undefined}
              {...register('heading', {
                validate: (value) => value.trim().length > 0 || 'وارد کردن سربرگ نمایشی پودمان الزامی است',
              })}
            />
            {errors.heading && (
              <div id="module-heading-error" className="invalid-feedback d-block">
                {errors.heading.message}
              </div>
            )}
            <small className="form-text text-muted">
              عنوان کامل پودمان که در بالای آزمون‌ها به دانشجویان نمایش داده می‌شود.
            </small>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <button className="btn btn-secondary" type="button" onClick={onHide}>
            انصراف
          </button>
          <button className="btn btn-primary" type="submit">
            {data?.mode === 'create' ? 'افزودن پودمان' : 'تایید و ذخیره'}
          </button>
        </Modal.Footer>
      </form>
    </Modal>
  );
}
