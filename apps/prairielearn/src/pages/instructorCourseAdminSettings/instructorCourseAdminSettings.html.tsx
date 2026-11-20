import type { ReactNode } from 'react';

import { type Timezone, formatTimezone } from '@prairielearn/utils/timezone';

import { GitHubButton } from '../../components/GitHubButton.js';
import type { PageAuthzData } from '../../lib/authz-data-lib.js';
import type { Course, Institution } from '../../lib/db-types.js';

export function InstructorCourseAdminSettings({
  aiQuestionGenerationEnabled,
  aiQuestionGenerationCourseToggleEnabled,
  authzData,
  availableTimezones,
  course,
  courseGHLink,
  courseInfoExists,
  coursePathExists,
  csrfToken,
  githubAccess,
  institution,
  origHash,
  urlPrefix,
}: {
  aiQuestionGenerationEnabled: boolean;
  aiQuestionGenerationCourseToggleEnabled: boolean;
  authzData: PageAuthzData;
  availableTimezones: Timezone[];
  course: Course;
  courseGHLink: string | null;
  courseInfoExists: boolean;
  coursePathExists: boolean;
  csrfToken: string;
  githubAccess: ReactNode;
  institution: Institution;
  origHash: string;
  urlPrefix: string;
}) {
  const disabled =
    !courseInfoExists || !authzData.has_course_permission_edit || course.example_course;
  return (
    <div className="card mb-4" style={{ fontFamily: 'var(--font-persian)' }}>
      <div className="card-header bg-primary text-white d-flex align-items-center justify-content-between">
        <h1 className="h4 mb-0">تنظیمات عمومی درس</h1>
        <GitHubButton gitHubLink={courseGHLink} />
      </div>
      <div className="card-body">
        {(!courseInfoExists || !coursePathExists) && (
          <CourseDirectoryMissingAlert
            authzData={authzData}
            course={course}
            coursePathExists={coursePathExists}
            courseInfoExists={courseInfoExists}
            csrfToken={csrfToken}
            urlPrefix={urlPrefix}
          />
        )}
        <form name="edit-course-settings-form" method="POST">
          <input type="hidden" name="__csrf_token" value={csrfToken} />
          <input type="hidden" name="orig_hash" value={origHash} />
          <div className="mb-3">
            <label className="form-label" htmlFor="title">
              عنوان کامل درس
            </label>
            <input
              type="text"
              className="form-control"
              id="title"
              name="title"
              defaultValue={course.title ?? ''}
              disabled={disabled}
              required
            />
            <small className="form-text text-muted">
              عنوان رسمی و کامل درس مطابق با سرفصل و برنامه‌ریزی مصوب آموزشی.
            </small>
          </div>
          <div className="mb-3">
            <label className="form-label" htmlFor="short_name">
              نام اختصاری (کد درس)
            </label>
            <input
              type="text"
              className="form-control"
              id="short_name"
              name="short_name"
              defaultValue={course.short_name ?? ''}
              disabled={disabled}
              dir="ltr"
              required
            />
            <small className="form-text text-muted">
              شناسه یا کد اختصاری درس (مانند "MATH 101" یا "IUST-BP").
            </small>
          </div>
          <div className="mb-3">
            <label className="form-label" htmlFor="display_timezone">
              منطقه زمانی رسمی (Timezone)
            </label>
            <select
              className="form-select"
              id="display_timezone"
              name="display_timezone"
              defaultValue={course.display_timezone}
              disabled={disabled}
              dir="ltr"
            >
              {availableTimezones.map((tz) => (
                <option key={tz.name} value={tz.name}>
                  {formatTimezone(tz)}
                </option>
              ))}
            </select>
            <small className="form-text text-muted">
              منطقه زمانی مرجع جهت ثبت زمان شروع و پایان آزمون‌ها و دوره‌ها.
            </small>
          </div>
          <div className="mb-3">
            <label className="form-label" htmlFor="institution">
              دانشگاه / موسسه آموزشی
            </label>
            <input
              type="text"
              className="form-control"
              id="institution"
              name="institution"
              value={`${institution.short_name} (${institution.long_name})`}
              disabled
            />
            <small className="form-text text-muted">
              دانشگاه یا موسسه آموزشی مالک این درس.
            </small>
          </div>
          <div className="mb-3">
            <label className="form-label" htmlFor="path">
              مسیر فایل‌های درس روی سرور
            </label>
            <input
              type="text"
              className="form-control font-monospace"
              id="path"
              name="path"
              value={course.path}
              disabled
              dir="ltr"
            />
            <small className="form-text text-muted">
              محل ذخیره‌سازی فایل‌های پیکربندی و محتوای درس روی دیسک سرور.
            </small>
          </div>
          <div className="mb-3">
            <label className="form-label" htmlFor="repository">
              مخزن گیت (Git Repository)
            </label>
            <span className="input-group">
              <input
                type="text"
                className="form-control font-monospace"
                id="repository"
                name="repository"
                value={course.repository ?? ''}
                disabled
                dir="ltr"
              />
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary js-copy-button"
                data-clipboard-text={course.repository}
                aria-label="کپی آدرس مخزن"
                disabled={!course.repository}
              >
                <i className="bi bi-clipboard" />
              </button>
            </span>
            <small className="form-text text-muted">
              آدرس مخزن گیت متصل به این درس جهت همگام‌سازی محتوا.
            </small>
          </div>
          <div className="mb-3">
            <label className="form-label" htmlFor="branch">
              شاخه کاری گیت (Branch)
            </label>
            <input
              type="text"
              className="form-control font-monospace"
              id="branch"
              name="branch"
              value={course.branch}
              disabled
              dir="ltr"
            />
            <small className="form-text text-muted">شاخه فعال در مخزن گیت این درس.</small>
          </div>
          {githubAccess}
          <div className="form-check mb-3">
            <input
              type="checkbox"
              className="form-check-input"
              id="show_getting_started"
              name="show_getting_started"
              defaultChecked={course.show_getting_started}
            />
            <label className="form-check-label" htmlFor="show_getting_started">
              نمایش راهنمای شروع سریع و چک‌لیست راه‌اندازی درس
            </label>
          </div>
          <div className="form-check mb-3">
            {course.questions_receive_user_data &&
              (!authzData.has_course_permission_own || course.example_course) && (
                <input type="hidden" name="questions_receive_user_data" value="on" />
              )}
            <input
              type="checkbox"
              className="form-check-input"
              id="questions_receive_user_data"
              name="questions_receive_user_data"
              defaultChecked={course.questions_receive_user_data}
              disabled={!authzData.has_course_permission_own || course.example_course}
            />
            <label className="form-check-label" htmlFor="questions_receive_user_data">
              اجازه دسترسی کدهای سوال به مشخصات و هویت دانشجو
            </label>
            <div className="small text-muted">
              در صورت فعال‌بودن، کدهای سوالات می‌توانند هویت دانشجو (نام و شناسه) را جهت شخصی‌سازی سوال دریافت نمایند.
            </div>
          </div>
          {aiQuestionGenerationCourseToggleEnabled && (
            <div className="form-check mb-3">
              <input
                type="checkbox"
                className="form-check-input"
                name="ai_question_generation"
                value="1"
                id="ai_question_generation_toggle"
                defaultChecked={aiQuestionGenerationEnabled}
              />
              <label
                className="form-check-label d-flex align-items-center"
                htmlFor="ai_question_generation_toggle"
              >
                فعال‌سازی دستیار هوش مصنوعی مولد سوال
                <span className="badge rounded-pill text-bg-success ms-2">پیش‌نمایش آزمایشی</span>
              </label>
              <div className="small text-muted">
                امکان طراحی و تولید هوشمند صورت و کدهای سوال با دستور متنی و پرامپت.
              </div>
            </div>
          )}
          <EditActions
            coursePathExists={coursePathExists}
            courseInfoExists={courseInfoExists}
            hasCoursePermissionView={authzData.has_course_permission_view}
            hasCoursePermissionEdit={authzData.has_course_permission_edit}
            exampleCourse={course.example_course}
            urlPrefix={urlPrefix}
            navPage="course_admin"
          />
        </form>
      </div>
    </div>
  );
}

function CourseDirectoryMissingAlert({
  authzData,
  course,
  coursePathExists,
  courseInfoExists,
  csrfToken,
  urlPrefix,
}: {
  authzData: Record<string, any>;
  course: Course;
  coursePathExists: boolean;
  courseInfoExists: boolean;
  csrfToken: string;
  urlPrefix: string;
}) {
  if (!authzData.has_course_permission_edit || course.example_course) {
    return null;
  }
  if (!coursePathExists) {
    return (
      <div className="alert alert-danger">
        پوشه فایل‌های درس روی سرور یافت نشد. ابتدا باید{' '}
        <a href={`${urlPrefix}/course_admin/syncs`}>درس را همگام‌سازی نمایید</a>.
      </div>
    );
  } else if (!courseInfoExists) {
    return (
      <form name="add-configuration-form" method="POST" className="alert alert-danger">
        فایل پیکربندی <code>infoCourse.json</code> یافت نشد. برای تنظیمات درس باید{' '}
        <input type="hidden" name="__csrf_token" value={csrfToken} />
        <button
          name="__action"
          value="add_configuration"
          className="btn btn-link btn-link-inline mt-n1 p-0 border-0"
        >
          این فایل را ایجاد کنید
        </button>
        .
      </form>
    );
  }
}

function EditActions({
  coursePathExists,
  courseInfoExists,
  hasCoursePermissionView,
  hasCoursePermissionEdit,
  exampleCourse,
  urlPrefix,
  navPage,
}: {
  coursePathExists: boolean;
  courseInfoExists: boolean;
  hasCoursePermissionView: boolean;
  hasCoursePermissionEdit: boolean;
  exampleCourse: boolean;
  urlPrefix: string;
  navPage: string;
}) {
  if (!coursePathExists || !courseInfoExists || !hasCoursePermissionView) {
    return null;
  }

  if (!hasCoursePermissionEdit || exampleCourse) {
    return (
      <p className="mb-0">
        <a href={`${urlPrefix}/${navPage}/file_view/infoCourse.json`}>مشاهده تنظیمات درس </a>
        در فایل <code>infoCourse.json</code>
      </p>
    );
  }

  return (
    <div>
      <div className="d-flex gap-2">
        <button
          id="save-button"
          type="submit"
          className="btn btn-primary mb-2"
          name="__action"
          value="update_configuration"
        >
          ذخیره تغییرات
        </button>
        <button id="cancel-button" type="button" className="btn btn-secondary mb-2">
          انصراف
        </button>
      </div>
      <p className="mb-0">
        <a
          data-testid="edit-course-configuration-link"
          href={`${urlPrefix}/${navPage}/file_edit/infoCourse.json`}
        >
          ویرایش مستقیم فایل پیکربندی درس
        </a>{' '}
        در <code>infoCourse.json</code>
      </p>
    </div>
  );
}
