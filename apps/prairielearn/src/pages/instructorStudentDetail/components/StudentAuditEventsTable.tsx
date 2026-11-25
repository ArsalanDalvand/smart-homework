import { FriendlyDate } from '../../../components/FriendlyDate.js';
import { type StaffAuditEvent } from '../../../lib/client/safe-db-types.js';
import { type SupportedActionsForTable } from '../../../models/audit-event.types.js';

interface StudentAuditEventsTableProps {
  events: StaffAuditEvent[];
}

function renderEnrollmentEventText(event: StaffAuditEvent): string {
  const { action_detail } = event;

  if (!action_detail) {
    return 'رویداد ثبت‌نام';
  }

  const detailMap: Record<SupportedActionsForTable<'enrollments'>, string> = {
    implicit_joined: 'ثبت‌نام در درس',
    explicit_joined: 'ثبت‌نام در درس',
    invited: 'دعوت به درس',
    invited_by_manual_sync: 'دعوت به درس (همگام‌سازی دستی فهرست دانشجویان)',
    invitation_accepted: 'پذیرش دعوت‌نامه',
    invitation_rejected: 'رد دعوت‌نامه',
    identity_merged: 'ادغام هویت ثبت‌نام',
    blocked: 'مسدودشده از درس',
    unblocked: 'ثبت‌نام مجدد در درس (رفع مسدودیت)',
    unblocked_by_manual_sync: 'رفع مسدودیت (همگام‌سازی دستی فهرست دانشجویان)',
    left: 'خروج دانشجو از درس',
    removed: 'حذف از درس توسط استاد',
    removed_by_manual_sync: 'حذف از درس (همگام‌سازی دستی فهرست دانشجویان)',
    reenrolled_by_manual_sync: 'ثبت‌نام مجدد (همگام‌سازی دستی فهرست دانشجویان)',
    reenrolled_by_instructor: 'ثبت‌نام مجدد در درس توسط استاد',

    // You can never actually see these states since canceling an invitation
    // hard-deletes the enrollment.
    invitation_deleted: 'لغو دعوت‌نامه',
    invitation_deleted_by_manual_sync: 'لغو دعوت‌نامه (همگام‌سازی دستی فهرست دانشجویان)',
  };

  const detail = detailMap[action_detail as SupportedActionsForTable<'enrollments'>];
  if (!detail) {
    throw new Error(`Unknown action detail: ${action_detail}`);
  }
  return detail;
}

function renderLabelEventText(event: StaffAuditEvent): string {
  const { action_detail, context } = event;
  const labelName = String(
    (context as Record<string, unknown> | null)?.label_name ?? 'برچسب ناشناس',
  );

  if (!action_detail) {
    return 'رویداد برچسب';
  }

  const detailMap: Record<SupportedActionsForTable<'student_label_enrollments'>, string> = {
    enrollment_added: `برچسب «${labelName}» اضافه شد`,
    enrollment_removed: `برچسب «${labelName}» حذف شد`,
  };

  const detail = detailMap[action_detail as SupportedActionsForTable<'student_label_enrollments'>];
  if (!detail) {
    throw new Error(`Unknown action detail: ${action_detail}`);
  }
  return detail;
}

function renderEventText(event: StaffAuditEvent): string {
  if (event.table_name === 'enrollments') {
    return renderEnrollmentEventText(event);
  }
  if (event.table_name === 'student_label_enrollments') {
    return renderLabelEventText(event);
  }
  return 'رویداد ناشناس';
}

export function StudentAuditEventsTable({ events }: StudentAuditEventsTableProps) {
  if (events.length === 0) {
    return (
      <>
        <div className="card-body">
          <div className="text-muted">هیچ رویداد ممیزی یافت نشد.</div>
        </div>
        <div className="card-footer text-muted small">
          رویدادی را نمی‌بینید؟ رویدادهای ثبت‌نام پیش از اکتبر ۲۰۲۵ ثبت نمی‌شدند.
        </div>
      </>
    );
  }

  // TODO: if/when we add more audit events to this table, consider adding
  // search/filter functionality to help the user find specific events.
  return (
    <>
      <table className="table table-sm table-hover" aria-label="رویدادهای ممیزی دانشجو">
        <thead>
          <tr>
            <th>تاریخ</th>
            <th>رویداد</th>
          </tr>
        </thead>
        <tbody>
          {events.map((e) => (
            <tr key={e.id}>
              <td className="align-middle">
                <FriendlyDate date={e.date} />
              </td>
              <td className="align-middle">{renderEventText(e)}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="card-footer text-muted small">
        رویدادی را نمی‌بینید؟ رویدادهای ثبت‌نام پیش از اکتبر ۲۰۲۵ ثبت نمی‌شدند.
      </div>
    </>
  );
}
