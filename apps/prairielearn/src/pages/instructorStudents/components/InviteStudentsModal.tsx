import { useMutation } from '@tanstack/react-query';
import clsx from 'clsx';
import { useState } from 'react';
import { Alert, Modal } from 'react-bootstrap';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { StudentLabelBadge } from '../../../components/StudentLabelBadge.js';
import { StudentLabelDropdown } from '../../../components/StudentLabelDropdown.js';
import type { StaffCourseInstance, StaffStudentLabel } from '../../../lib/client/safe-db-types.js';
import { computeStatus } from '../../../lib/publishing.js';
import { parseUniqueValuesFromString } from '../../../lib/string-util.js';

interface InviteStudentForm {
  uids: string;
}

const MAX_UIDS = 1000;

export function InviteStudentsModal({
  show,
  courseInstance,
  studentLabels,
  selfEnrollLink,
  onHide,
  onSubmit,
}: {
  show: boolean;
  courseInstance: StaffCourseInstance;
  studentLabels: StaffStudentLabel[];
  selfEnrollLink: string;
  onHide: () => void;
  onSubmit: (uids: string[], labelIds: string[]) => Promise<void>;
}) {
  const [selectedLabelIds, setSelectedLabelIds] = useState<Set<string>>(() => new Set());
  const {
    register,
    handleSubmit,
    clearErrors,
    reset,
    formState: { errors },
  } = useForm<InviteStudentForm>({
    mode: 'onSubmit',
    reValidateMode: 'onSubmit',
    defaultValues: { uids: '' },
  });

  const validateUidsFormat = (value: string): string | true => {
    let uids: string[] = [];
    try {
      uids = parseUniqueValuesFromString(value, MAX_UIDS);
    } catch (error) {
      return error instanceof Error ? error.message : 'خطایی رخ داد';
    }

    if (uids.length === 0) {
      return 'حداقل یک شناسه کاربری (UID) الزامی است';
    }

    const invalidUids = uids.filter((uid) => !z.email().safeParse(uid).success);

    if (invalidUids.length > 0) {
      return `شناسه‌های کاربری زیر نامعتبر هستند: «${invalidUids.join('»، «')}»`;
    }

    return true;
  };

  const saveMutation = useMutation({
    mutationFn: async (uids: string[]) => {
      return onSubmit(uids, [...selectedLabelIds]);
    },
    onSuccess: onHide,
  });

  const onFormSubmit = async (data: InviteStudentForm) => {
    const uids = parseUniqueValuesFromString(data.uids, MAX_UIDS);
    saveMutation.mutate(uids);
  };

  const resetModalState = () => {
    reset();
    clearErrors();
    setSelectedLabelIds(new Set());
    saveMutation.reset();
  };

  return (
    <Modal show={show} backdrop="static" onHide={onHide} onExited={resetModalState}>
      <Modal.Header closeButton>
        <Modal.Title>دعوت دانشجویان</Modal.Title>
      </Modal.Header>

      <form onSubmit={handleSubmit(onFormSubmit)}>
        <Modal.Body>
          {courseInstance.modern_publishing &&
            computeStatus(
              courseInstance.publishing_start_date,
              courseInstance.publishing_end_date,
            ) !== 'published' && (
              <Alert variant="warning">
                دانشجویان تا زمانی که ترم منتشر نشده باشد نمی‌توانند دعوت‌نامه را بپذیرند.
              </Alert>
            )}
          {saveMutation.isError && (
            <Alert variant="danger" dismissible onClose={() => saveMutation.reset()}>
              {saveMutation.error instanceof Error
                ? saveMutation.error.message
                : 'خطایی رخ داد'}
            </Alert>
          )}
          <div className="mb-0">
            <label htmlFor="invite-uids" className="form-label">
              شناسه‌های کاربری (UID)
            </label>
            <textarea
              id="invite-uids"
              className={clsx('form-control', errors.uids && 'is-invalid')}
              rows={5}
              defaultValue=""
              placeholder="student@example.com"
              aria-invalid={!!errors.uids}
              aria-errormessage={errors.uids ? 'invite-uids-error' : undefined}
              aria-describedby="invite-uids-help"
              {...register('uids', {
                validate: validateUidsFormat,
              })}
            />
            {errors.uids?.message && (
              <div className="invalid-feedback" id="invite-uids-error">
                {errors.uids.message}
              </div>
            )}
            <div className="form-text" id="invite-uids-help">
              در هر خط یک شناسه کاربری، یا جدا شده با کاما/فاصله وارد کنید. به دانشجویان درباره
              دعوت‌نامه اعلانی ارسال نمی‌شود: باید به آن‌ها اطلاع دهید برای پذیرش دعوت‌نامه به{' '}
              <a href="/" target="_blank" rel="noopener noreferrer">
                صفحه اصلی PrairieLearn
              </a>{' '}
              یا{' '}
              <a href={selfEnrollLink} target="_blank" rel="noopener noreferrer">
                لینک ثبت‌نام ترم
              </a>{' '}
              مراجعه کنند.
            </div>
          </div>
          {studentLabels.length > 0 && (
            <fieldset className="mt-3" disabled={saveMutation.isPending}>
              <legend className="form-label fs-6">برچسب‌ها</legend>
              <div className="d-flex flex-wrap align-items-center gap-2">
                <StudentLabelDropdown
                  labels={studentLabels}
                  selectedIds={selectedLabelIds}
                  buttonLabel="انتخاب برچسب‌ها"
                  disabled={saveMutation.isPending}
                  onToggle={(label) => {
                    setSelectedLabelIds((previous) => {
                      const next = new Set(previous);
                      if (next.has(label.id)) {
                        next.delete(label.id);
                      } else {
                        next.add(label.id);
                      }
                      return next;
                    });
                  }}
                />
                {studentLabels
                  .filter((label) => selectedLabelIds.has(label.id))
                  .map((label) => (
                    <StudentLabelBadge key={label.id} label={label} />
                  ))}
              </div>
              <div className="form-text">
                برچسب‌های انتخاب‌شده به دانشجویان جدید و دانشجویانی که قبلاً دعوت یا ثبت‌نام
                شده‌اند اضافه می‌شوند. برچسب‌های فعلی و وضعیت ثبت‌نام حفظ خواهد شد.
              </div>
            </fieldset>
          )}
        </Modal.Body>
        <Modal.Footer>
          <button
            type="button"
            className="btn btn-secondary"
            disabled={saveMutation.isPending}
            onClick={onHide}
          >
            انصراف
          </button>
          <button type="submit" className="btn btn-primary" disabled={saveMutation.isPending}>
            {saveMutation.isPending ? 'در حال دعوت...' : 'دعوت'}
          </button>
        </Modal.Footer>
      </form>
    </Modal>
  );
}
