import clsx from 'clsx';

import { OverlayTrigger } from '@prairielearn/ui';
import { assertNever } from '@prairielearn/utils';

import type { EnumEnrollmentStatus } from '../lib/db-types.js';

interface EnrollmentStatusIconProps {
  status: EnumEnrollmentStatus;
  type: 'badge' | 'text';
  className?: string;
}

function getIconClass(status: EnumEnrollmentStatus): string {
  switch (status) {
    case 'invited':
      return 'bi-envelope';
    case 'joined':
      return 'bi-person-check';
    case 'left':
      return 'bi-person-dash';
    case 'removed':
      return 'bi-person-dash';
    case 'rejected':
      return 'bi-x-circle';
    case 'blocked':
      return 'bi-slash-circle';
    default:
      return 'bi-question-circle';
  }
}

function getFriendlyStatus(status: EnumEnrollmentStatus): string {
  switch (status) {
    case 'invited':
      return 'دعوت‌شده';
    case 'joined':
      return 'عضو شده';
    case 'left':
      return 'خارج شده';
    case 'removed':
      return 'حذف شده';
    case 'rejected':
      return 'رد شده';
    case 'blocked':
      return 'مسدود شده';
    default:
      assertNever(status);
  }
}

function getBadgeClass(status: EnumEnrollmentStatus): string {
  switch (status) {
    case 'joined':
      return 'badge bg-success';
    case 'left':
      return 'badge bg-danger';
    case 'removed':
      return 'badge bg-danger';
    case 'rejected':
      return 'badge bg-danger';
    case 'blocked':
      return 'badge bg-danger';
    case 'invited':
      return 'badge bg-secondary';
    default:
      assertNever(status);
  }
}

function capitalize(word: string): string {
  if (word.length === 0) return word;
  return word.charAt(0).toUpperCase() + word.slice(1);
}

export function EnrollmentStatusIcon({
  status,
  type = 'text',
  className,
}: EnrollmentStatusIconProps) {
  const iconClass = getIconClass(status);
  return (
    <span
      className={clsx(
        'd-inline-flex align-items-center gap-1',
        type === 'badge' && getBadgeClass(status),
        className,
      )}
    >
      <i className={clsx('bi', iconClass)} aria-hidden="true" />
      <span className="text-nowrap">{capitalize(getFriendlyStatus(status))}</span>
      {status === 'rejected' && (
        <OverlayTrigger
          tooltip={{
            body: (
              <div>
                این دانشجو دعوت‌نامه پیوستن به درس را رد کرده است. تا زمانی که خودثبت‌نامی فعال است
                همچنان می‌تواند بپیوندد.
              </div>
            ),
            props: { id: 'rejected-info-tooltip' },
          }}
        >
          <i className="bi bi-info-circle" aria-hidden="true" />
        </OverlayTrigger>
      )}
    </span>
  );
}
