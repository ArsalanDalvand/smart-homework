import { useFormContext } from 'react-hook-form';

import type { EnumCourseInstanceRole } from '../lib/db-types.js';

export interface PermissionsFormValues {
  course_instance_permission: EnumCourseInstanceRole;
}

/**
 * Form for selecting initial course instance permissions.
 *
 * This component must be wrapped in a <FormProvider> from react-hook-form. The parent component's form state should extend from
 * PermissionsFormValues.
 *
 * @param params
 * @param params.formId - A unique ID for the form on the page.
 */
export function CourseInstancePermissionsForm({ formId }: { formId: string }) {
  const { register } = useFormContext<PermissionsFormValues>();

  return (
    <>
      <div className="mb-3 form-check">
        <input
          className="form-check-input"
          type="radio"
          id={`${formId}-permission-none`}
          value="None"
          {...register('course_instance_permission')}
        />
        <label className="form-check-label" htmlFor={`${formId}-permission-none`}>
          بدون دسترسی
        </label>
        <div className="small text-muted">هیچ دسترسی‌ای به این دوره نخواهید داشت.</div>
      </div>

      <div className="mb-3 form-check">
        <input
          className="form-check-input"
          type="radio"
          id={`${formId}-permission-viewer`}
          value="Student Data Viewer"
          {...register('course_instance_permission')}
        />
        <label className="form-check-label" htmlFor={`${formId}-permission-viewer`}>
          مشاهده‌گر اطلاعات دانشجویان
        </label>
        <div className="small text-muted">قادر به مشاهده اطلاعات و نمرات دانشجویان خواهید بود.</div>
      </div>

      <div className="mb-3 form-check">
        <input
          className="form-check-input"
          type="radio"
          id={`${formId}-permission-editor`}
          value="Student Data Editor"
          {...register('course_instance_permission')}
        />
        <label className="form-check-label" htmlFor={`${formId}-permission-editor`}>
          ویرایشگر اطلاعات دانشجویان
        </label>
        <div className="small text-muted">
          قادر به مشاهده و ویرایش اطلاعات و نمرات دانشجویان و مدیریت ثبت‌نام‌ها خواهید بود.
        </div>
      </div>
    </>
  );
}
