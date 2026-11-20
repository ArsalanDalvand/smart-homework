import { useMutation } from '@tanstack/react-query';
import clsx from 'clsx';
import { Alert, Modal } from 'react-bootstrap';
import { FormProvider, useForm } from 'react-hook-form';

import {
  CourseInstancePermissionsForm,
  type PermissionsFormValues,
} from '../../../components/CourseInstancePermissionsForm.js';
import {
  CourseInstancePublishingForm,
  type PublishingFormValues,
} from '../../../components/CourseInstancePublishingForm.js';
import {
  CourseInstanceSelfEnrollmentForm,
  type SelfEnrollmentFormValues,
} from '../../../components/CourseInstanceSelfEnrollmentForm.js';
import { CourseInstanceShortNameDescription } from '../../../components/ShortNameDescriptions.js';
import type { StaffCourse } from '../../../lib/client/safe-db-types.js';
import { getCourseEditErrorUrl, getCourseInstanceSettingsUrl } from '../../../lib/client/url.js';
import { validateShortName } from '../../../lib/short-name.js';

interface CreateFormValues
  extends PublishingFormValues, SelfEnrollmentFormValues, PermissionsFormValues {
  short_name: string;
  long_name: string;
}

export function CreateCourseInstanceModal({
  show,
  onHide,
  course,
  csrfToken,
  isAdministrator,
}: {
  show: boolean;
  onHide: () => void;
  course: StaffCourse;
  csrfToken: string;
  isAdministrator: boolean;
}) {
  const methods = useForm<CreateFormValues>({
    defaultValues: {
      short_name: '',
      long_name: '',
      start_date: '',
      end_date: '',
      self_enrollment_enabled: true,
      self_enrollment_use_enrollment_code: true,
      course_instance_permission: isAdministrator ? 'None' : 'Student Data Editor',
    },
    mode: 'onSubmit',
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = methods;

  const createMutation = useMutation({
    mutationFn: async (data: CreateFormValues) => {
      const body = {
        __csrf_token: csrfToken,
        __action: 'add_course_instance',
        short_name: data.short_name.trim(),
        long_name: data.long_name.trim(),
        start_date: data.start_date,
        end_date: data.end_date,
        self_enrollment_enabled: data.self_enrollment_enabled,
        self_enrollment_use_enrollment_code: data.self_enrollment_use_enrollment_code,
        course_instance_permission: data.course_instance_permission,
      };

      const resp = await fetch(window.location.pathname, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(body),
      });

      const result = await resp.json();
      if (!resp.ok) {
        if (result.job_sequence_id) {
          // Redirect to the error page
          window.location.href = getCourseEditErrorUrl(course.id, result.job_sequence_id);
          return null;
        }

        throw new Error(result.error);
      }

      return result;
    },
    onSuccess: (data) => {
      if (data?.course_instance_id) {
        window.location.href = getCourseInstanceSettingsUrl(data.course_instance_id);
      }
    },
  });

  const onFormSubmit = async (data: CreateFormValues) => {
    createMutation.mutate(data);
  };

  return (
    <Modal
      show={show}
      backdrop="static"
      size="lg"
      dir="rtl"
      onHide={() => {
        createMutation.reset();
        reset();
        onHide();
      }}
    >
      <Modal.Header closeButton style={{ fontFamily: 'var(--font-persian)' }}>
        <Modal.Title>تعریف و افزودن دوره جدید (ترم)</Modal.Title>
      </Modal.Header>
      <FormProvider {...methods}>
        <form onSubmit={handleSubmit(onFormSubmit)} style={{ fontFamily: 'var(--font-persian)' }}>
          <Modal.Body className="text-end">
            {createMutation.isError && (
              <Alert variant="danger" dismissible onClose={() => createMutation.reset()}>
                {createMutation.error.message}
              </Alert>
            )}

            <div className="mb-3">
              <label className="form-label" htmlFor="create-long-name">
                عنوان کامل دوره / ترم
              </label>
              <input
                id="create-long-name"
                type="text"
                placeholder="مثال: نیم‌سال اول ۱۴۰۵-۱۴۰۶ (Fall 2026)"
                className={clsx('form-control text-end', errors.long_name && 'is-invalid')}
                aria-describedby="create-long-name-help"
                aria-invalid={!!errors.long_name}
                aria-errormessage={errors.long_name ? 'create-long-name-error' : undefined}
                {...register('long_name', {
                  required: 'وارد کردن عنوان کامل الزامی است',
                })}
              />
              <small id="create-long-name-help" className="form-text text-muted">
                عنوان رسمی دوره یا ترم تحصیلی که برای دانشجویان نمایش داده می‌شود.
              </small>
              {errors.long_name && (
                <div className="invalid-feedback" id="create-long-name-error">
                  {errors.long_name.message}
                </div>
              )}
            </div>

            <div className="mb-3">
              <label className="form-label" htmlFor="create-short-name">
                نام اختصاری / کد ترم (حروف انگلیسی)
              </label>
              <input
                id="create-short-name"
                type="text"
                dir="ltr"
                placeholder="Fall2026"
                className={clsx('form-control font-monospace', errors.short_name && 'is-invalid')}
                aria-describedby="create-short-name-help"
                aria-invalid={!!errors.short_name}
                aria-errormessage={errors.short_name ? 'create-short-name-error' : undefined}
                {...register('short_name', {
                  required: 'وارد کردن نام اختصاری الزامی است',
                  validate: (value) => {
                    const result = validateShortName(value);
                    return result.valid || result.message;
                  },
                })}
              />
              <small id="create-short-name-help" className="form-text text-muted">
                کد یکتای ترم بدون فاصله (مانند Fall2026 یا 1405-1).
              </small>
              {errors.short_name && (
                <div className="invalid-feedback" id="create-short-name-error">
                  {errors.short_name.message}
                </div>
              )}
            </div>

            <hr />

            <h3 className="h5">تنظیمات انتشار و دسترسی زمانی</h3>
            <p className="text-muted small">
              بازه زمانی انتشار و دسترسی اولیه به این دوره را مشخص کنید (این تنظیمات بعداً نیز قابل تغییر است).
            </p>

            <CourseInstancePublishingForm
              displayTimezone={course.display_timezone}
              canEdit={true}
              originalStartDate={null}
              originalEndDate={null}
              showButtons={false}
              formId="create-course-instance"
            />

            <hr />

            <h3 className="h5">تنظیمات ثبت‌نام مستقیم فراگیران</h3>
            <p className="text-muted small">
              امکان ثبت‌نام دانشجویان با کد دعوت یا تایید دستی کادر آموزشی.
            </p>

            <CourseInstanceSelfEnrollmentForm formId="create-course-instance" />

            <hr />

            <h3 className="h5">دسترسی‌ها و مجوزهای کادر آموزشی</h3>
            <p className="text-muted small">
              سطح دسترسی اولیه برای این دوره را مشخص کنید.
            </p>

            <CourseInstancePermissionsForm formId="create-course-instance" />
          </Modal.Body>

          <Modal.Footer className="d-flex justify-content-between">
            <button
              type="button"
              className="btn btn-secondary"
              disabled={createMutation.isPending}
              onClick={() => {
                createMutation.reset();
                reset();
                onHide();
              }}
            >
              انصراف
            </button>
            <button type="submit" className="btn btn-primary" disabled={createMutation.isPending}>
              {createMutation.isPending ? 'در حال ایجاد دوره...' : 'ایجاد و ثبت دوره'}
            </button>
          </Modal.Footer>
        </form>
      </FormProvider>
    </Modal>
  );
}
