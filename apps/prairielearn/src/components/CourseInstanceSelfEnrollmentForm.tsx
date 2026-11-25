import clsx from 'clsx';
import { useEffect } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';

export interface SelfEnrollmentFormValues {
  self_enrollment_enabled: boolean;
  self_enrollment_use_enrollment_code: boolean;
}

/**
 * Form for editing self-enrollment settings for a course instance.
 *
 * This component must be wrapped in a <FormProvider> from react-hook-form. The parent component's form state should extend from
 * SelfEnrollmentFormValues.
 *
 * @param params
 * @param params.formId - An unique ID for the form on the page.
 */
export function CourseInstanceSelfEnrollmentForm({ formId }: { formId: string }) {
  const { register, setValue, control } = useFormContext<SelfEnrollmentFormValues>();

  const selfEnrollmentEnabled = useWatch({ control, name: 'self_enrollment_enabled' });
  const selfEnrollmentUseEnrollmentCode = useWatch({
    control,
    name: 'self_enrollment_use_enrollment_code',
  });

  // When self-enrollment is disabled, ensure use_enrollment_code is false
  useEffect(() => {
    if (!selfEnrollmentEnabled) {
      setValue('self_enrollment_use_enrollment_code', false);
    }
  }, [selfEnrollmentEnabled, setValue]);

  return (
    <>
      <div className="mb-3 form-check">
        <input
          className="form-check-input"
          type="checkbox"
          id={`${formId}-self-enrollment-enabled`}
          {...register('self_enrollment_enabled')}
        />
        <label className="form-check-label" htmlFor={`${formId}-self-enrollment-enabled`}>
          اجازه خودثبت‌نامی
        </label>
        <div className="small text-muted">
          اگر خودثبت‌نامی غیرفعال باشد، دانشجویان باید به این دوره دعوت شوند.
        </div>
      </div>

      <div className={clsx('mb-3 form-check', !selfEnrollmentEnabled && 'd-none')}>
        <input
          className="form-check-input"
          type="checkbox"
          id={`${formId}-self-enrollment-use-enrollment-code`}
          disabled={!selfEnrollmentEnabled}
          {...register('self_enrollment_use_enrollment_code')}
        />
        <input
          type="hidden"
          name="self-enrollment-use-enrollment-code"
          value={selfEnrollmentUseEnrollmentCode ? 'checked' : ''}
        />
        <label
          className="form-check-label"
          htmlFor={`${formId}-self-enrollment-use-enrollment-code`}
        >
          الزام کد ثبت‌نام برای خودثبت‌نامی
        </label>
        <div className="small text-muted">
          اگر کد ثبت‌نام الزامی نباشد، هر پیوند دوره یا تکلیف/آزمون امکان خودثبت‌نامی را فراهم می‌کند.
        </div>
      </div>
    </>
  );
}
