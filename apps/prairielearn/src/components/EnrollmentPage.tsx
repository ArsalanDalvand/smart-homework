import type { EnrollmentIneligibilityReason } from '../lib/enrollment/eligibility.js';
import type { UntypedResLocals } from '../lib/res-locals.types.js';

import { PageLayout } from './PageLayout.js';

interface EnrollmentPageProps {
  reason: EnrollmentIneligibilityReason;
  resLocals: UntypedResLocals;
}

function BlockedEnrollment() {
  return (
    <div className="container">
      <div className="row justify-content-center">
        <div className="col-lg-8 col-xl-6">
          <div className="card">
            <div className="card-header bg-primary text-white">
              <h4 className="mb-0">ثبت‌نام مسدود شده است</h4>
            </div>
            <div className="card-body">
              <p>
                دسترسی شما به این درس مسدود شده است. اگر فکر می‌کنید به اشتباه مسدود شده‌اید، با
                مدرس خود تماس بگیرید.
              </p>
              <a href="/pl" className="btn btn-primary">
                بازگشت به صفحه اصلی
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SelfEnrollmentDisabled() {
  return (
    <div className="container">
      <div className="row justify-content-center">
        <div className="col-lg-8 col-xl-6">
          <div className="card">
            <div className="card-header bg-primary text-white">
              <h4 className="mb-0">خودثبت‌نامی در دسترس نیست</h4>
            </div>
            <div className="card-body">
              <p>
                خودثبت‌نامی برای این درس فعال نیست. اگر فکر می‌کنید باید فعال باشد، با مدرس خود تماس
                بگیرید.
              </p>
              <a href="/pl" className="btn btn-primary">
                بازگشت به صفحه اصلی
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SelfEnrollmentExpired() {
  return (
    <div className="container">
      <div className="row justify-content-center">
        <div className="col-lg-8 col-xl-6">
          <div className="card">
            <div className="card-header bg-primary text-white">
              <h4 className="mb-0">مهلت خودثبت‌نامی به پایان رسیده است</h4>
            </div>
            <div className="card-body">
              <p>
                مهلت خودثبت‌نامی برای این درس به پایان رسیده است. اگر فکر می‌کنید همچنان باید
                بتوانید ثبت‌نام کنید، با مدرس خود تماس بگیرید.
              </p>
              <a href="/pl" className="btn btn-primary">
                بازگشت به صفحه اصلی
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function InstitutionRestriction() {
  return (
    <div className="container">
      <div className="row justify-content-center">
        <div className="col-lg-8 col-xl-6">
          <div className="card">
            <div className="card-header bg-primary text-white">
              <h4 className="mb-0">محدودیت موسسه</h4>
            </div>
            <div className="card-body">
              <p>
                خودثبت‌نامی برای این درس محدود به کاربران همان موسسه است. اگر فکر می‌کنید باید
                بتوانید ثبت‌نام کنید، با مدرس خود تماس بگیرید.
              </p>
              <a href="/pl" className="btn btn-primary">
                بازگشت به صفحه اصلی
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function EnrollmentPage({ reason, resLocals }: EnrollmentPageProps) {
  const pageTitle =
    reason === 'blocked'
      ? 'ثبت‌نام مسدود شده است'
      : reason === 'self-enrollment-expired'
        ? 'مهلت خودثبت‌نامی به پایان رسیده است'
        : reason === 'institution-restriction'
          ? 'محدودیت موسسه'
          : 'خودثبت‌نامی در دسترس نیست';

  const content =
    reason === 'blocked' ? (
      <BlockedEnrollment />
    ) : reason === 'self-enrollment-expired' ? (
      <SelfEnrollmentExpired />
    ) : reason === 'institution-restriction' ? (
      <InstitutionRestriction />
    ) : (
      <SelfEnrollmentDisabled />
    );

  return PageLayout({
    resLocals,
    pageTitle,
    navContext: {
      type: 'student',
      page: 'enroll',
    },
    content,
  });
}
