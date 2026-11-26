import clsx from 'clsx';
import { useState } from 'react';
import { Button, Form, InputGroup, Modal } from 'react-bootstrap';
import { type Control, Controller, type UseFormTrigger, useWatch } from 'react-hook-form';

import { OverlayTrigger } from '@prairielearn/ui';

import { CopyButton } from '../../../components/CopyButton.js';
import { JalaliDateTimePicker } from '../../../components/JalaliDateTimePicker.js';
import { StudentLinkSharing } from '../../../components/LinkSharing.js';
import { QRCodeModal } from '../../../components/QRCodeModal.js';
import type { StaffInstitution } from '../../../lib/client/safe-db-types.js';
import type { SettingsFormValues } from '../instructorInstanceAdminSettings.types.js';

function SelfEnrollmentCode({ enrollmentCode }: { enrollmentCode: string }) {
  const enrollmentCodeDashed =
    enrollmentCode.slice(0, 3) + '-' + enrollmentCode.slice(3, 6) + '-' + enrollmentCode.slice(6);

  return (
    <div className="mb-3">
      <label className="form-label" htmlFor="self_enrollment_code">
        کد ثبت‌نام خودکار
      </label>
      <InputGroup>
        <Form.Control
          id="self_enrollment_code"
          value={enrollmentCodeDashed}
          style={{ fontFamily: 'monospace', fontSize: '1.1em', letterSpacing: '0.1em' }}
          disabled
        />
        <CopyButton
          text={enrollmentCodeDashed}
          ariaLabel="کپی کد ثبت‌نام خودکار"
          className="btn-sm btn-outline-secondary"
        />
      </InputGroup>
      <small className="form-text text-muted">
        دانشجویان می‌توانند با وارد کردن این کد در صفحه اصلی یا پس از کلیک روی هر لینک مربوط به این
        ترم، در درس ثبت‌نام کنند.
      </small>
    </div>
  );
}

function SelfEnrollmentLink({
  selfEnrollLink,
  csrfToken,
  canEdit,
}: {
  selfEnrollLink: string;
  csrfToken: string;
  canEdit: boolean;
}) {
  const [showQR, setShowQR] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  return (
    <>
      <div className="mb-0">
        <label className="form-label" htmlFor="self_enrollment_link">
          لینک ثبت‌نام خودکار
        </label>
        <InputGroup>
          <Form.Control id="self_enrollment_link" value={selfEnrollLink} disabled />
          <CopyButton
            text={selfEnrollLink}
            ariaLabel="کپی لینک ثبت‌نام خودکار"
            className="btn-sm btn-outline-secondary"
          />
          <OverlayTrigger
            tooltip={{
              body: 'مشاهده کد QR',
              props: { id: 'self-enrollment-link-qr-code-tooltip' },
            }}
          >
            <Button
              size="sm"
              variant="outline-secondary"
              aria-label="کد QR لینک ثبت‌نام خودکار"
              onClick={() => setShowQR(true)}
            >
              <i className="bi bi-qr-code-scan" />
            </Button>
          </OverlayTrigger>
          {canEdit && (
            <OverlayTrigger
              tooltip={{
                body: 'تولید مجدد',
                props: { id: 'self-enrollment-link-regenerate-tooltip' },
              }}
            >
              <Button
                size="sm"
                variant="outline-secondary"
                aria-label="تولید لینک ثبت‌نام خودکار جدید"
                onClick={() => setShowConfirm(true)}
              >
                <i className="bi bi-arrow-repeat" />
              </Button>
            </OverlayTrigger>
          )}
        </InputGroup>
        <small className="form-text text-muted">
          دانشجویان می‌توانند از این لینک برای ثبت‌نام فوری در درس استفاده کنند. همچنین می‌توانند با
          وارد کردن کد ثبت‌نام در هر لینک مربوط به این ترم، ثبت‌نام نمایند.
        </small>
      </div>

      <QRCodeModal
        id="selfEnrollmentLinkModal"
        title="کد QR لینک ثبت‌نام خودکار"
        content={selfEnrollLink}
        show={showQR}
        onHide={() => setShowQR(false)}
      />
      <Modal show={showConfirm} backdrop="static" onHide={() => setShowConfirm(false)}>
        <Modal.Header closeButton>
          <Modal.Title>تولید لینک ثبت‌نام خودکار جدید</Modal.Title>
        </Modal.Header>
        <form method="POST">
          <Modal.Body>
            <div>
              آیا از تولید لینک ثبت‌نام خودکار جدید اطمینان دارید؟{' '}
              <strong>لینک فعلی غیرفعال خواهد شد.</strong> این عملیات قابل بازگشت نیست.
            </div>
          </Modal.Body>
          <Modal.Footer>
            <input type="hidden" name="__action" value="generate_enrollment_code" />
            <input type="hidden" name="__csrf_token" value={csrfToken} />
            <Button variant="secondary" type="button" onClick={() => setShowConfirm(false)}>
              انصراف
            </Button>
            <Button variant="danger" type="submit">
              تولید لینک جدید
            </Button>
          </Modal.Footer>
        </form>
      </Modal>
    </>
  );
}

export function SelfEnrollmentSettings({
  control,
  trigger,
  canEdit,
  hasModernPublishing,
  studentLink,
  selfEnrollLink,
  enrollmentCode,
  csrfToken,
  institution,
}: {
  control: Control<SettingsFormValues>;
  trigger: UseFormTrigger<SettingsFormValues>;
  canEdit: boolean;
  hasModernPublishing: boolean;
  studentLink: string;
  selfEnrollLink: string;
  enrollmentCode: string;
  csrfToken: string;
  institution: StaffInstitution;
}) {
  const selfEnrollmentEnabled = useWatch({ control, name: 'self_enrollment_enabled' });
  const selfEnrollmentUseEnrollmentCode = useWatch({
    control,
    name: 'self_enrollment_use_enrollment_code',
  });
  const selfEnrollmentRestrictToInstitution = useWatch({
    control,
    name: 'self_enrollment_restrict_to_institution',
  });
  const selfEnrollmentEnabledBeforeDateEnabled = useWatch({
    control,
    name: 'self_enrollment_enabled_before_date_enabled',
  });
  const selfEnrollmentEnabledBeforeDate = useWatch({
    control,
    name: 'self_enrollment_enabled_before_date',
  });

  const {
    invalid: selfEnrollmentEnabledBeforeDateInvalid,
    error: selfEnrollmentEnabledBeforeDateError,
  } = control.getFieldState('self_enrollment_enabled_before_date');

  return (
    <>
      {!hasModernPublishing ? (
        <div className="alert alert-warning">
          شما در حال استفاده از قوانین دسترسی برای کنترل دسترسی به این ترم هستید. برای دسترسی به
          امکانات بیشتر مدیریت ثبت‌نام،{' '}
          <a
            href="https://docs.prairielearn.com/courseInstance/#migrating-from-allowaccess"
            className="alert-link"
            target="_blank"
            rel="noreferrer"
          >
            به سیستم انتشار مهاجرت کنید
          </a>
          .
        </div>
      ) : null}

      <div className="mb-3 form-check">
        <input
          className="form-check-input"
          type="checkbox"
          id="self_enrollment_enabled"
          disabled={!canEdit || !hasModernPublishing}
          defaultChecked={selfEnrollmentEnabled}
          {...control.register('self_enrollment_enabled')}
        />
        {(!canEdit || !hasModernPublishing) && (
          <input
            type="hidden"
            name="self_enrollment_enabled"
            value={selfEnrollmentEnabled ? 'checked' : ''}
          />
        )}
        <label className="form-check-label" htmlFor="self_enrollment_enabled">
          امکان ثبت‌نام خودکار
        </label>
        <div className="small text-muted">
          اگر ثبت‌نام خودکار غیرفعال باشد، دانشجویان باید به این ترم دعوت شوند.
        </div>
      </div>

      <div className={clsx('mb-3 form-check', !selfEnrollmentEnabled && 'd-none')}>
        <input
          className={clsx('form-check-input')}
          type="checkbox"
          id="self_enrollment_use_enrollment_code"
          disabled={!canEdit || !selfEnrollmentEnabled || !hasModernPublishing}
          defaultChecked={selfEnrollmentUseEnrollmentCode}
          {...control.register('self_enrollment_use_enrollment_code')}
        />
        {(!canEdit || !selfEnrollmentEnabled || !hasModernPublishing) && (
          <input
            type="hidden"
            name="self_enrollment_use_enrollment_code"
            value={selfEnrollmentUseEnrollmentCode ? 'checked' : ''}
          />
        )}
        <label className="form-check-label" htmlFor="self_enrollment_use_enrollment_code">
          الزام کد ثبت‌نام برای ثبت‌نام خودکار
        </label>
        <div className="small text-muted">
          اگر کد ثبت‌نام الزامی نباشد، هر لینک مربوط به ترم یا آزمون امکان ثبت‌نام خودکار را فراهم
          می‌کند.
        </div>
      </div>

      <div className={clsx('mb-3 form-check', !selfEnrollmentEnabled && 'd-none')}>
        <input
          className={clsx('form-check-input')}
          type="checkbox"
          id="self_enrollment_restrict_to_institution"
          disabled={!canEdit || !selfEnrollmentEnabled || !hasModernPublishing}
          defaultChecked={selfEnrollmentRestrictToInstitution}
          {...control.register('self_enrollment_restrict_to_institution')}
        />
        {(!canEdit || !selfEnrollmentEnabled || !hasModernPublishing) && (
          <input
            type="hidden"
            name="self_enrollment_restrict_to_institution"
            value={selfEnrollmentRestrictToInstitution ? 'checked' : ''}
          />
        )}
        <label className="form-check-label" htmlFor="self_enrollment_restrict_to_institution">
          محدود کردن ثبت‌نام خودکار به مؤسسه «{institution.long_name}»
        </label>
        <div className="small text-muted">
          اگر محدودیت مؤسسه غیرفعال باشد، کاربران از هر مؤسسه‌ای می‌توانند به صورت خودکار ثبت‌نام
          کنند.
        </div>
      </div>

      <div className={clsx('mb-3 form-check', !selfEnrollmentEnabled && 'd-none')}>
        <input
          className={clsx('form-check-input')}
          type="checkbox"
          id="disable_self_enrollment_after_date"
          disabled={!canEdit || !hasModernPublishing || !selfEnrollmentEnabled}
          defaultChecked={selfEnrollmentEnabledBeforeDateEnabled}
          {...control.register('self_enrollment_enabled_before_date_enabled', {
            onChange: async (event) => {
              if (!event.target.checked) {
                await trigger('self_enrollment_enabled_before_date');
              }
            },
          })}
        />
        {(!canEdit || !hasModernPublishing || !selfEnrollmentEnabled) && (
          <input
            type="hidden"
            name="self_enrollment_enabled_before_date_enabled"
            value={selfEnrollmentEnabledBeforeDateEnabled ? 'checked' : ''}
          />
        )}
        <label className="form-check-label" htmlFor="disable_self_enrollment_after_date">
          مهلت نهایی ثبت‌نام خودکار
        </label>
        <div className="small text-muted">
          در صورت تنظیم، ثبت‌نام خودکار پس از این تاریخ غیرفعال می‌شود. توصیه می‌کنیم این تاریخ را
          برابر با مهلت حذف و اضافه دانشگاه تنظیم کنید.
        </div>

        <div className="mt-2">
          <Controller
            control={control}
            name="self_enrollment_enabled_before_date"
            defaultValue={selfEnrollmentEnabledBeforeDate}
            rules={{
              validate: (value, { self_enrollment_enabled_before_date_enabled }) => {
                if (self_enrollment_enabled_before_date_enabled && !value) {
                  return 'تاریخ الزامی است';
                }
                return true;
              },
            }}
            render={({ field }) => {
              const isDisabled =
                !canEdit ||
                !selfEnrollmentEnabledBeforeDateEnabled ||
                !hasModernPublishing ||
                !selfEnrollmentEnabled;
              return (
                <JalaliDateTimePicker
                  aria-label="مهلت نهایی ثبت‌نام خودکار"
                  name={isDisabled ? undefined : field.name}
                  value={field.value ?? ''}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  disabled={isDisabled}
                  className={clsx(selfEnrollmentEnabledBeforeDateInvalid && 'is-invalid')}
                  aria-invalid={selfEnrollmentEnabledBeforeDateInvalid}
                  aria-errormessage={
                    selfEnrollmentEnabledBeforeDateInvalid
                      ? 'self-enrollment-enabled-before-date-error'
                      : undefined
                  }
                />
              );
            }}
          />
        </div>
        {(!canEdit ||
          !selfEnrollmentEnabledBeforeDateEnabled ||
          !hasModernPublishing ||
          !selfEnrollmentEnabled) && (
          <input
            type="hidden"
            name="self_enrollment_enabled_before_date"
            value={`${selfEnrollmentEnabledBeforeDate}`}
          />
        )}
        {selfEnrollmentEnabledBeforeDateError && (
          <div className="invalid-feedback d-block" id="self-enrollment-enabled-before-date-error">
            {selfEnrollmentEnabledBeforeDateError.message}
          </div>
        )}
      </div>

      {selfEnrollmentEnabled && selfEnrollmentUseEnrollmentCode ? (
        <>
          <SelfEnrollmentCode enrollmentCode={enrollmentCode} />
          <SelfEnrollmentLink
            selfEnrollLink={selfEnrollLink}
            csrfToken={csrfToken}
            canEdit={canEdit}
          />
        </>
      ) : (
        <StudentLinkSharing
          studentLink={studentLink}
          studentLinkMessage={`این لینکی است که دانشجویان برای ${selfEnrollmentEnabled ? 'دسترسی به درس' : 'پذیرش دعوت‌نامه'} از آن استفاده خواهند کرد. می‌توانید این لینک را کپی کرده و با دانشجویان به اشتراک بگذارید.`}
        />
      )}
    </>
  );
}
