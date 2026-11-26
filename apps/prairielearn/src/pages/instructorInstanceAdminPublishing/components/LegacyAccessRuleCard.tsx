import { run } from '@prairielearn/run';

import { CommentPopover } from '../../../components/CommentPopover.js';
import { FriendlyDate } from '../../../components/FriendlyDate.js';
import type { CourseInstance, CourseInstanceAccessRule } from '../../../lib/db-types.js';

export function LegacyAccessRuleCard({
  accessRules,
  showComments,
  courseInstance,
  hasCourseInstancePermissionView,
}: {
  accessRules: CourseInstanceAccessRule[];
  showComments: boolean;
  courseInstance: CourseInstance;
  hasCourseInstancePermissionView: boolean;
}) {
  return (
    <>
      <div className="alert alert-warning" role="alert">
        <strong>قوانین دسترسی قدیمی فعال است:</strong> این ترم از سیستم قدیمی{' '}
        <code>allowAccess</code> استفاده می‌کند. برای استفاده از سیستم انتشار جدید، ابتدا باید بخش{' '}
        <code>allowAccess</code> را از پیکربندی ترم حذف کنید. برای اطلاعات بیشتر لطفاً{' '}
        <a
          href="https://docs.prairielearn.com/courseInstance/#migrating-from-allowaccess"
          target="_blank"
          rel="noreferrer"
        >
          مستندات مهاجرت
        </a>{' '}
        را مشاهده کنید.
      </div>
      <div className="card mb-4">
        <div className="card-header bg-primary text-white d-flex align-items-center justify-content-between">
          <h1>قوانین دسترسی</h1>
        </div>

        <div className="table-responsive">
          <table className="table table-sm table-hover" aria-label="قوانین دسترسی">
            <thead>
              <tr>
                {showComments && (
                  <th style={{ width: '1%' }}>
                    <span className="visually-hidden">توضیحات</span>
                  </th>
                )}
                <th>شناسه‌های کاربری (UID)</th>
                <th>تاریخ شروع</th>
                <th>تاریخ پایان</th>
                <th>مؤسسه</th>
              </tr>
            </thead>
            <tbody>
              {accessRules.map((accessRule) => (
                <AccessRuleRow
                  key={accessRule.id}
                  accessRule={accessRule}
                  timeZone={courseInstance.display_timezone}
                  hasCourseInstancePermissionView={hasCourseInstancePermissionView}
                  showComments={showComments}
                />
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

function AccessRuleRow({
  accessRule,
  timeZone,
  hasCourseInstancePermissionView,
  showComments,
}: {
  accessRule: CourseInstanceAccessRule;
  timeZone: string;
  hasCourseInstancePermissionView: boolean;
  showComments: boolean;
}) {
  const uidContent = run(() => {
    if (accessRule.uids == null) {
      return '—';
    }

    if (hasCourseInstancePermissionView) {
      return accessRule.uids.join(', ');
    }

    // Only users with permission to view student data are allowed to
    // see the list of uids associated with an access rule. Note,
    // however, that any user with permission to view course code (or
    // with access to the course git repository) will be able to see the
    // list of uids, because these access rules are defined in course
    // code. This should be changed in future, to protect student data.
    return (
      <button
        type="button"
        className="btn btn-xs btn-warning"
        data-bs-toggle="popover"
        data-bs-container="body"
        data-bs-placement="auto"
        data-bs-title="شناسه‌های کاربری پنهان"
        data-bs-content="این قانون دسترسی مخصوص دانشجویان خاص است. برای مشاهده آن‌ها باید دسترسی مشاهده اطلاعات دانشجویان را داشته باشید."
      >
        پنهان
      </button>
    );
  });

  return (
    <tr>
      {showComments && (
        <td>
          <CommentPopover comment={accessRule.json_comment} />
        </td>
      )}
      <td>{uidContent}</td>
      <td>{accessRule.start_date == null ? '—' : <FriendlyDate date={accessRule.start_date} timezone={timeZone} />}</td>
      <td>{accessRule.end_date == null ? '—' : <FriendlyDate date={accessRule.end_date} timezone={timeZone} />}</td>
      <td>{accessRule.institution ?? '—'}</td>
    </tr>
  );
}
