import clsx from 'clsx';

import { ansiToHtml } from '../lib/chalk.js';

export function SyncErrorsAndWarnings({
  authzData,
  exampleCourse,
  syncErrors,
  syncWarnings,
  fileEditUrl,
  context,
}: {
  authzData: { has_course_permission_edit: boolean };
  exampleCourse: boolean;
  syncErrors: string | null;
  syncWarnings: string | null;
  fileEditUrl: string;
  context: 'course' | 'question' | 'course instance' | 'assessment';
}) {
  if (!authzData.has_course_permission_edit) {
    return null;
  }
  if (!syncErrors && !syncWarnings) {
    return null;
  }

  const syncErrorsAnsified = syncErrors ? ansiToHtml(syncErrors) : null;
  const syncWarningsAnsified = syncWarnings ? ansiToHtml(syncWarnings) : null;
  const infoFileName = fileEditUrl.split('/').pop();
  const contextLabel = {
    course: 'درس',
    question: 'سوال',
    'course instance': 'دوره آموزشی',
    assessment: 'تکلیف/آزمون',
  }[context];

  return (
    <>
      {syncErrors ? (
        <div className="alert alert-danger" role="alert">
          <h2 className="h5 alert-heading">خطای همگام‌سازی</h2>
          <p>
            در همگام‌سازی این {contextLabel} خطایی رخ داد؛ اطلاعاتی که در زیر مشاهده می‌کنید ممکن
            است با فایل <code>{infoFileName}</code> این {contextLabel} ناسازگار باشد. لطفاً خطا را
            برطرف کرده و دوباره همگام‌سازی کنید.
          </p>
          <pre
            className={clsx('text-white', 'rounded', 'p-3', exampleCourse && 'mb-0')}
            style={{ backgroundColor: 'black' }}
          >
            {syncErrorsAnsified && (
              /* oxlint-disable-next-line react/no-danger */
              <code dangerouslySetInnerHTML={{ __html: syncErrorsAnsified }} />
            )}
          </pre>
          {exampleCourse ? (
            ''
          ) : (
            <a className="btn btn-primary" href={fileEditUrl}>
              <i className="fa fa-edit" />
              <span className="d-none d-sm-inline">
                ویرایش <code>{infoFileName}</code> برای رفع این خطا
              </span>
            </a>
          )}
        </div>
      ) : (
        ''
      )}
      {syncWarnings ? (
        <div className="alert alert-warning" role="alert">
          <h2 className="h5 alert-heading">هشدار همگام‌سازی</h2>
          <p>
            این هشدارها مانع از همگام‌سازی این {contextLabel} نمی‌شوند، اما همچنان باید بررسی و
            برطرف شوند.
          </p>
          <pre
            className={clsx('text-white', 'rounded', 'p-3', exampleCourse && 'mb-0')}
            style={{ backgroundColor: 'black' }}
          >
            {syncWarningsAnsified && (
              /* oxlint-disable-next-line react/no-danger */
              <code dangerouslySetInnerHTML={{ __html: syncWarningsAnsified }} />
            )}
          </pre>
          {exampleCourse ? (
            ''
          ) : (
            <a className="btn btn-primary" href={fileEditUrl}>
              <i className="fa fa-edit" />
              <span className="d-none d-sm-inline">
                ویرایش <code>{infoFileName}</code> برای رفع این هشدار
              </span>
            </a>
          )}
        </div>
      ) : (
        ''
      )}
    </>
  );
}
