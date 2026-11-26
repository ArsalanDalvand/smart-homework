import clsx from 'clsx';
import { useState } from 'react';

import { type PlanName, planGrantsMatchPlanFeatures } from '../../../lib/billing/plans-types.js';

interface InstructorInstanceAdminBillingInput {
  /** The current state */
  initialRequiredPlans: PlanName[];

  /** The desired state */
  desiredRequiredPlans: PlanName[];

  /** Grants for the institution */
  institutionPlanGrants: PlanName[];

  /** Grants for the course instance */
  courseInstancePlanGrants: PlanName[];

  /** Current count of students enrolled in the course instance */
  enrollmentCount: number;

  /** Maximum students that can be enrolled in the course instance */
  enrollmentLimit: number;

  /** Whether the fields are editable by the user */
  editable: boolean;
}

interface InstructorInstanceAdminBillingState {
  studentBillingEnabled: boolean;
  studentBillingCanChange: boolean;
  studentBillingDidChange: boolean;
  studentBillingAlert: AlertProps | null;
  computeEnabled: boolean;
  computeCanChange: boolean;
  computeDidChange: boolean;
  computeAlert: AlertProps | null;
}

interface InstructorInstanceAdminBillingFormProps extends InstructorInstanceAdminBillingInput {
  enrollmentLimitSource: 'course_instance' | 'institution';
  externalGradingQuestionCount: number;
  workspaceQuestionCount: number;
  csrfToken: string;
}

interface AlertProps {
  message: string;
  color: 'success' | 'warning' | 'danger';
}

export function instructorInstanceAdminBillingState({
  initialRequiredPlans,
  desiredRequiredPlans,
  institutionPlanGrants,
  courseInstancePlanGrants,
  editable,
  enrollmentCount,
  enrollmentLimit,
}: InstructorInstanceAdminBillingInput): InstructorInstanceAdminBillingState {
  const studentBillingInitialEnabled = initialRequiredPlans.includes('basic');
  const studentBillingEnabled = desiredRequiredPlans.includes('basic');
  const computeEnabledByInstitution = planGrantsMatchPlanFeatures(institutionPlanGrants, [
    'compute',
  ]);
  const computeEnabledByCourseInstance = planGrantsMatchPlanFeatures(courseInstancePlanGrants, [
    'compute',
  ]);
  const computeEnabled =
    (!studentBillingEnabled && (computeEnabledByInstitution || computeEnabledByCourseInstance)) ||
    desiredRequiredPlans.includes('compute');

  let studentBillingCanChange = editable;
  const studentBillingDidChange =
    initialRequiredPlans.includes('basic') !== desiredRequiredPlans.includes('basic');
  let studentBillingAlert: AlertProps | null = null;
  if (studentBillingInitialEnabled && enrollmentCount > enrollmentLimit) {
    studentBillingCanChange = false;
    studentBillingAlert = {
      message: [
        `در حال حاضر ${enrollmentCount} ثبت‌نام در این درس وجود دارد که از سقف ${enrollmentLimit} بیشتر است.`,
        'برای غیرفعال کردن صورت‌حساب دانشجویی، ابتدا ثبت‌نام‌های مازاد را حذف کنید.',
      ].join(' '),
      color: 'warning',
    };
  }

  let computeCanChange = editable;
  const computeDidChange =
    initialRequiredPlans.includes('compute') !== desiredRequiredPlans.includes('compute');
  let computeAlert: AlertProps | null = null;
  if (!studentBillingEnabled && (computeEnabledByInstitution || computeEnabledByCourseInstance)) {
    computeCanChange = false;
    computeAlert = {
      message:
        'این ارائه درس هم‌اکنون بدون نیاز به پرداخت اضافه به امکانات محاسباتی دسترسی دارد.',
      color: 'success',
    };
  }

  return {
    studentBillingEnabled,
    studentBillingCanChange,
    studentBillingDidChange,
    studentBillingAlert,
    computeEnabled,
    computeCanChange,
    computeDidChange,
    computeAlert,
  };
}

export function InstructorInstanceAdminBillingForm({
  enrollmentCount,
  enrollmentLimit,
  enrollmentLimitSource,
  externalGradingQuestionCount,
  workspaceQuestionCount,
  editable,
  csrfToken,
  initialRequiredPlans,
  institutionPlanGrants,
  courseInstancePlanGrants,
}: InstructorInstanceAdminBillingFormProps) {
  const initialBasicPlanEnabled = initialRequiredPlans.includes('basic');
  const initialComputePlanEnabled = initialRequiredPlans.includes('compute');

  const [basicPlanEnabled, setBasicPlanEnabled] = useState(initialBasicPlanEnabled);
  const [computePlanEnabled, setComputePlanEnabled] = useState(initialComputePlanEnabled);

  const requiredPlans: PlanName[] = [];
  if (basicPlanEnabled) requiredPlans.push('basic');
  if (computePlanEnabled) requiredPlans.push('compute');

  const {
    studentBillingEnabled,
    studentBillingCanChange,
    studentBillingDidChange,
    studentBillingAlert,
    computeEnabled,
    computeCanChange,
    computeDidChange,
    computeAlert,
  } = instructorInstanceAdminBillingState({
    initialRequiredPlans,
    desiredRequiredPlans: requiredPlans,
    institutionPlanGrants,
    courseInstancePlanGrants,
    editable,
    enrollmentCount,
    enrollmentLimit,
  });

  const showEnableAlert =
    (studentBillingEnabled && studentBillingDidChange) || (computeEnabled && computeDidChange);

  const enrollmentLimitPercentage = Math.min(100, (enrollmentCount / enrollmentLimit) * 100);
  const enrollmentLimitExceeded = enrollmentCount > enrollmentLimit;

  // Make the colored portion of the progress bar at least 2% wide at all
  // times to ensure that it's not just a gray box.
  const enrollmentLimitProgressBarPercentage = Math.max(2, enrollmentLimitPercentage);
  const enrollmentLimitProgressBarColor = enrollmentLimitExceeded
    ? 'bg-danger'
    : enrollmentLimitPercentage > 90
      ? 'bg-warning'
      : 'bg-primary';

  return (
    <form method="POST" className="js-billing-form">
      <h2 className="h4">Enrollments</h2>
      <div className="mb-3">
        <div className="d-flex flex-row align-items-center">
          <span className="me-2">
            {formatEnrollmentCount(enrollmentCount, enrollmentLimit, studentBillingEnabled)}
          </span>
          <div
            className={clsx('progress flex-grow-1', { 'd-none': studentBillingEnabled })}
            style={{ maxWidth: '100px' }}
          >
            <div
              className={clsx('progress-bar', enrollmentLimitProgressBarColor)}
              role="progressbar"
              style={{ width: `${enrollmentLimitProgressBarPercentage}%` }}
              aria-valuenow={enrollmentCount}
              aria-valuemin={0}
              aria-valuemax={enrollmentLimit}
            />
          </div>
        </div>
        <div className="small text-muted">
          {enrollmentLimitExplanation({
            studentBillingEnabled,
            enrollmentLimit,
            enrollmentLimitSource,
          })}
        </div>
      </div>

      <div className="form-check">
        <input
          className="form-check-input"
          type="checkbox"
          name="student_billing_enabled"
          checked={studentBillingEnabled}
          disabled={!studentBillingCanChange}
          value="1"
          id="studentBillingEnabled"
          onChange={(e) => setBasicPlanEnabled(e.currentTarget.checked)}
        />
        <label className="form-check-label" htmlFor="studentBillingEnabled">
          فعال‌سازی صورت‌حساب دانشجویی برای ثبت‌نام‌ها
        </label>
        <p className="small text-muted">
          با فعال‌سازی صورت‌حساب دانشجویی، دانشجویان برای دسترسی به ارائه درس شما هزینه پرداخت می‌کنند. فعال کردن این گزینه به ارائه درس اجازه می‌دهد از محدودیت‌های ثبت‌نام معمول فراتر برود.
        </p>
        {studentBillingAlert && <Alert {...studentBillingAlert} />}
      </div>

      <h2 className="h4">امکانات</h2>
      <p>
        اگر درس شما به امکانات خاصی نیاز دارد، می‌توانید آن‌ها را فعال کنید تا دانشجویان بتوانند هزینه آن‌ها را بپردازند.
      </p>

      <div className="form-check">
        <input
          className="form-check-input"
          type="checkbox"
          name="compute_enabled"
          checked={computeEnabled}
          disabled={!computeCanChange}
          value="1"
          id="computeEnabled"
          onChange={(e) => setComputePlanEnabled(e.currentTarget.checked)}
        />
        <label className="form-check-label" htmlFor="computeEnabled">
          تصحیح خارجی (External grading) و محیط‌های کاری (Workspaces)
        </label>
        <p className="small text-muted">
          دانشجویان قادر خواهند بود از سوالاتی که دارای تصحیح خارجی و/یا محیط کاری هستند استفاده کنند.
          این درس دارای <strong>{pluralizeQuestionCount(externalGradingQuestionCount)}</strong>{' '}
          با تصحیح خارجی و{' '}
          <strong>{pluralizeQuestionCount(workspaceQuestionCount)}</strong> با محیط کاری است.
        </p>
        {computeAlert && <Alert {...computeAlert} />}
      </div>

      {showEnableAlert && (
        <div className="alert alert-warning" role="alert">
          تمام دانشجویانی که هم‌اکنون در درس شما ثبت‌نام کرده‌اند تا زمان پرداخت هزینه امکانات بالا دسترسی خود را از دست خواهند داد. اگر درس شما در حال برگزاری است، پیش از فعال‌سازی صورت‌حساب دانشجویی تاثیر آن را به دقت بررسی کرده و این تغییر را به دانشجویان اطلاع دهید.
        </div>
      )}

      <input type="hidden" name="__csrf_token" value={csrfToken} />
      <button type="submit" className="btn btn-primary" disabled={!editable}>
        ذخیره
      </button>
    </form>
  );
}

InstructorInstanceAdminBillingForm.displayName = 'InstructorInstanceAdminBillingForm';

function Alert(props: AlertProps) {
  return <div className={clsx('alert', `alert-${props.color}`)}>{props.message}</div>;
}

function enrollmentLimitExplanation({
  studentBillingEnabled,
  enrollmentLimit,
  enrollmentLimitSource,
}: {
  studentBillingEnabled: boolean;
  enrollmentLimit: number;
  enrollmentLimitSource: 'course_instance' | 'institution';
}): string {
  if (studentBillingEnabled) {
    return 'صورت‌حساب دانشجویی برای ثبت‌نام‌ها فعال است، بنابراین محدودیت ثبت‌نام وجود ندارد.';
  }

  if (enrollmentLimitSource === 'course_instance') {
    return `این ارائه درس دارای محدودیت ثبت‌نام ${enrollmentLimit} نفر است.`;
  }

  return `موسسه این درس برای هر ارائه درس محدودیت ثبت‌نام ${enrollmentLimit} نفر دارد.`;
}

function pluralizeQuestionCount(count: number) {
  return `${count} سوال`;
}

function formatEnrollmentCount(
  enrollmentCount: number,
  enrollmentLimit: number,
  studentBillingEnabled: boolean,
) {
  if (studentBillingEnabled) {
    // Student billing doesn't have a limit, so don't show it.
    return `${enrollmentCount} ثبت‌نام`;
  } else {
    return `${enrollmentCount} / ${enrollmentLimit} ثبت‌نام`;
  }
}
