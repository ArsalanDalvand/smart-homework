import { useRef, useState } from 'react';
import { Modal, Overlay, Tooltip } from 'react-bootstrap';
import { FormProvider, useForm } from 'react-hook-form';
import z from 'zod';

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
import {
  type PublicCourse,
  type PublicCourseInstance,
  RawPublicQuestionSchema,
} from '../../../lib/client/safe-db-types.js';

export const SafeCopyTargetSchema = z.object({
  id: z.string(),
  short_name: z.string().nullable(),
  copy_url: z.string(),
  __csrf_token: z.string(),
});
export type SafeCopyTarget = z.infer<typeof SafeCopyTargetSchema>;

export const SafeQuestionForCopySchema = RawPublicQuestionSchema.extend({
  should_copy: z.boolean().optional(),
});
export type SafeQuestionForCopy = z.infer<typeof SafeQuestionForCopySchema>;

export function CopyCourseInstanceModal({
  course,
  courseInstance,
  courseInstanceCopyTargets,
  questionsForCopy,
  isAdministrator,
}: {
  course: PublicCourse;
  courseInstance: PublicCourseInstance;
  courseInstanceCopyTargets: SafeCopyTarget[] | null;
  questionsForCopy: SafeQuestionForCopy[];
  isAdministrator: boolean;
}) {
  const [show, setShow] = useState(false);
  const [selectedCourseId, setSelectedCourseId] = useState(
    courseInstanceCopyTargets?.[0]?.id ?? '',
  );
  const buttonRef = useRef<HTMLButtonElement>(null);
  // Calculate question stats
  const questionsToCopy = questionsForCopy.filter((q) => q.should_copy).length;
  const questionsToLink = questionsForCopy.filter((q) => !q.should_copy).length;

  // Find the selected course data
  const selectedCourse = courseInstanceCopyTargets?.find((c) => c.id === selectedCourseId);

  interface CopyFormValues
    extends PublishingFormValues, SelfEnrollmentFormValues, PermissionsFormValues {}

  const defaultValues: CopyFormValues = {
    start_date: '',
    end_date: '',
    self_enrollment_enabled: courseInstance.self_enrollment_enabled,
    self_enrollment_use_enrollment_code: courseInstance.self_enrollment_use_enrollment_code,
    course_instance_permission: isAdministrator ? 'None' : 'Student Data Editor',
  };

  const methods = useForm<CopyFormValues>({
    defaultValues,
  });

  // Don't render anything if copy targets is null
  if (!courseInstanceCopyTargets) {
    return null;
  }

  const canCopy = courseInstanceCopyTargets.length > 0;
  const hasSharingName = course.sharing_name !== null;

  return (
    <>
      <Overlay placement="bottom" show={!hasSharingName && show} target={buttonRef}>
        <Tooltip show={!hasSharingName && show}>
          برای این درس نام اشتراک‌گذاری (Sharing Name) تنظیم نشده است. امکان کپی کردن این دوره به درس شما وجود ندارد.
        </Tooltip>
      </Overlay>
      <button
        ref={buttonRef}
        className="btn btn-sm btn-outline-light"
        type="button"
        aria-label="کپی کردن دوره"
        onClick={() => setShow(!show)}
      >
        <i className="fa fa-clone" />
        <span className="d-none d-sm-inline">کپی کردن دوره</span>
      </button>

      <Modal show={show && hasSharingName} size="lg" onHide={() => setShow(false)}>
        <Modal.Header closeButton>
          <Modal.Title>کپی کردن دوره</Modal.Title>
        </Modal.Header>
        {canCopy ? (
          <form
            method="POST"
            action={selectedCourse?.copy_url}
            id="copy-course-instance-form"
            onSubmit={() => setShow(false)}
          >
            <input type="hidden" name="__csrf_token" value={selectedCourse?.__csrf_token ?? ''} />
            <input type="hidden" name="course_instance_id" value={courseInstance.id} />

            <Modal.Body>
              <p>
                این دوره می‌تواند به هر درسی که در آن دسترسی ویرایش دارید کپی شود. یکی از درس‌های خود را برای کپی کردن این دوره انتخاب کنید.
              </p>
              <select
                className="form-select"
                name="to_course_id"
                aria-label="درس مقصد"
                value={selectedCourseId}
                required
                onChange={(e) => setSelectedCourseId(e.currentTarget.value)}
              >
                {courseInstanceCopyTargets.map((copyTarget) => (
                  <option key={copyTarget.id} value={copyTarget.id}>
                    {copyTarget.short_name}
                  </option>
                ))}
              </select>
              <hr />
              در صورت کپی کردن این دوره به درس شما:
              <ul>
                <li>
                  <strong>{questionsToCopy}</strong> سوال به درس شما کپی خواهد شد.
                </li>
                <li>
                  <strong>{questionsToLink}</strong> سوال از درس {course.short_name} برای استفاده در درس شما پیوند (لینک) داده خواهد شد.
                </li>
              </ul>
              <hr />
              <FormProvider {...methods}>
                <h3 className="h5">تنظیمات انتشار</h3>
                <p className="text-muted small">
                  وضعیت انتشار اولیه دوره جدید خود را انتخاب کنید. این تنظیم بعداً قابل تغییر است.
                </p>
                <CourseInstancePublishingForm
                  displayTimezone={courseInstance.display_timezone}
                  canEdit={true}
                  originalStartDate={null}
                  originalEndDate={null}
                  showButtons={false}
                  formId="copy-course-instance"
                />

                <hr />

                <h3 className="h5">تنظیمات ثبت‌نام خودکار</h3>
                <p className="text-muted small">
                  تنظیمات ثبت‌نام خودکار (Self-enrollment) را برای دوره جدید خود پیکربندی کنید. این مورد بعداً قابل تغییر است.
                </p>
                <CourseInstanceSelfEnrollmentForm formId="copy-course-instance" />

                <hr />

                <h3 className="h5">دسترسی‌های دوره</h3>
                <p className="text-muted small">
                  دسترسی‌های اولیه خود را برای این دوره انتخاب کنید. این مورد بعداً قابل تغییر است.
                </p>
                <CourseInstancePermissionsForm formId="copy-course-instance" />
              </FormProvider>
            </Modal.Body>

            <Modal.Footer>
              <button type="button" className="btn btn-secondary" onClick={() => setShow(false)}>
                بستن
              </button>
              <button
                type="submit"
                name="__action"
                value="copy_course_instance"
                className="btn btn-primary"
              >
                کپی کردن دوره
              </button>
            </Modal.Footer>
          </form>
        ) : (
          <>
            <Modal.Body>
              <p>
                به دلیل نداشتن دسترسی ویرایش در هیچ درسی، امکان کپی کردن این دوره را ندارید. اگر هنوز درسی ندارید،{' '}
                <a href="/pl/request_course">درخواست ایجاد درس</a> ثبت کنید؛ در غیر این صورت با مالک درسی که انتظار داشتید به آن دسترسی داشته باشید تماس بگیرید.
              </p>
            </Modal.Body>
            <Modal.Footer>
              <button type="button" className="btn btn-secondary" onClick={() => setShow(false)}>
                بستن
              </button>
            </Modal.Footer>
          </>
        )}
      </Modal>
    </>
  );
}

CopyCourseInstanceModal.displayName = 'CopyCourseInstanceModal';
