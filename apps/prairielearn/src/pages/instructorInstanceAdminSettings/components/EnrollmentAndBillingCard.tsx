import { Alert, Card } from 'react-bootstrap';

import type { EnrollmentCapacity } from '../../../ee/models/enrollment.js';

export interface EnrollmentAndBillingCardProps {
  studentBillingEnabled: boolean;
  studentComputeBillingEnabled: boolean;
  enrollmentCount: number;
  capacity: EnrollmentCapacity | null;
  enrollmentLimitReached: boolean;
}

export function EnrollmentAndBillingCard({
  studentBillingEnabled,
  studentComputeBillingEnabled,
  enrollmentCount,
  capacity,
  enrollmentLimitReached,
}: EnrollmentAndBillingCardProps) {
  return (
    <Card aria-labelledby="enrollment-and-billing-heading">
      <Card.Body>
        <h2 id="enrollment-and-billing-heading" className="h5 card-title mb-3">
          ثبت‌نام و صورت‌حساب
        </h2>
        <h3 className="h6">
          {studentBillingEnabled
            ? 'صورت‌حساب دانشجویی فعال است'
            : studentComputeBillingEnabled
              ? 'صورت‌حساب دانشجویی برای امکانات محاسباتی'
              : 'پرداخت دانشجو الزامی نیست'}
        </h3>
        {studentBillingEnabled ? (
          <p className="mb-0">دانشجویان برای دسترسی به این ترم هزینه پرداخت می‌کنند.</p>
        ) : !studentComputeBillingEnabled ? (
          <p className="mb-0">دانشجویان می‌توانند بدون پرداخت هزینه در درس ثبت‌نام کنند.</p>
        ) : null}
        {studentComputeBillingEnabled && (
          <p className="mb-0">دانشجویان برای تصحیح خارجی و محیط‌های کاری (Workspaces) هزینه پرداخت می‌کنند.</p>
        )}
        {studentBillingEnabled && (
          <p className="mt-3 mb-0">
            {enrollmentCount.toLocaleString('fa-IR')} ثبت‌نام
          </p>
        )}
        {capacity && (
          <div className="mt-3">
            <h3 className="h6">سقف مجاز ثبت‌نام</h3>
            <p className="mb-0">
              {capacity.used.toLocaleString('fa-IR')} از {capacity.limit.toLocaleString('fa-IR')}{' '}
              ثبت‌نام استفاده شده{' · '}
              <strong>{capacity.remaining.toLocaleString('fa-IR')} باقی‌مانده</strong>
            </p>
            {capacity.annualLimitSource && (
              <p className="mt-2 mb-0">
                ظرفیت باقی‌مانده به دلیل سقف ثبت‌نام مشترک {capacity.annualLimitSource} در سال گذشته محدود شده است.
              </p>
            )}
            {capacity.paid > 0 && (
              <p className="small text-muted mt-2 mb-0">
                دانشجویانی که دسترسی خود را به صورت فردی خریداری کرده یا تحت حمایت مالی هستند، از این سهمیه استفاده نمی‌کنند.
              </p>
            )}
          </div>
        )}
        {enrollmentLimitReached && (
          <Alert variant="warning" className="mt-3 mb-0">
            {capacity
              ? 'سقف مجاز ثبت‌نام تکمیل شده است. برای افزایش آن با پشتیبانی تماس بگیرید.'
              : 'محدودیت ثبت‌نام تکمیل شده است. برای امکان ثبت‌نام‌های بیشتر با پشتیبانی تماس بگیرید.'}
          </Alert>
        )}
      </Card.Body>
    </Card>
  );
}
