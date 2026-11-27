import { type FlashMessageType, flash } from '@prairielearn/flash';
import { type HtmlValue, html, unsafeHtml } from '@prairielearn/html';
import { run } from '@prairielearn/run';

import { getEffectiveBrandName, platformBranding, uiStrings } from '../lib/branding.js';
import { config } from '../lib/config.js';
import { toPersianDigits } from '../lib/jalali.js';
import { isEnterprise } from '../lib/license.js';
import type { UntypedResLocals } from '../lib/res-locals.types.js';
import type { StudentNavbarPulse } from '../lib/student-gamification.js';
import { type UserAvatarMeta } from '../lib/student-profile.js';
import {
  getInitialsFromName,
  getUserAvatarUrl,
  resolveAvatarIconClass,
} from '../lib/student-profile.shared.js';
import type { Override } from '../middlewares/authzCourseOrInstance.js';
import { generateCsrfToken } from '../middlewares/csrfToken.js';

import { Modal } from './Modal.js';
import type { NavPage, NavbarType } from './Navbar.types.js';
import { SupportModal } from './SupportModal.js';

export function Navbar({
  resLocals,
  navPage,
  navbarType,
  sideNavEnabled = false,
  hideSessionControls = false,
  showInstructorSupport = false,
  courseAgentPanel,
  isStudentSurface = false,
}: {
  resLocals: UntypedResLocals;
  navPage?: NavPage;
  navbarType?: NavbarType;
  /**
   * Indicates if the side nav is enabled for the current page.
   */
  sideNavEnabled?: boolean;
  /** Whether to hide all controls associated with the current session. */
  hideSessionControls?: boolean;
  /** Enables instructor support on pages without a course authorization context. */
  showInstructorSupport?: boolean;
  courseAgentPanel?: HtmlValue;
  isStudentSurface?: boolean;
}) {
  const navbarResLocals = hideSessionControls ? {} : resLocals;
  const { __csrf_token, course } = navbarResLocals;
  navPage ??= navbarResLocals.navPage;
  navbarType ??= navbarResLocals.navbarType;

  const showSupport =
    !!navbarResLocals.authn_user &&
    !navbarResLocals.lockdown_browser &&
    navbarType !== 'public' &&
    (showInstructorSupport ||
      navbarResLocals.authn_is_administrator ||
      navbarResLocals.is_institution_administrator ||
      (!course?.example_course &&
        (navbarResLocals.authz_data?.authn_has_course_permission_preview ||
          navbarResLocals.authz_data?.authn_has_course_instance_permission_view)));

  return html`
    ${
      config.devMode && __csrf_token
        ? // Unit tests often need access to the CSRF token even when the page contains
          // no form - for example, to confirm that a POST with a prohibited
          // action is denied. For convenience, we include the CSRF token here, on
          // all pages. We do this only in devMode and only for the purpose of
          // testing.
          html`
            <!-- DO NOT RELY ON OR USE THIS CSRF TOKEN FOR ANYTHING OTHER THAN UNIT TESTS! -->
            <span id="test_csrf_token" hidden>${__csrf_token}</span>
          `
        : ''
    }

    <nav
      class="container-fluid bg-primary visually-hidden-focusable"
      aria-label="پیوند پرش و راهنمای دسترسی‌پذیری"
    >
      <a href="#content" class="d-inline-flex p-2 m-2 text-white">پرش به محتوای اصلی</a>
      <a
        href="https://docs.prairielearn.com/student-guide/accessibility/"
        class="d-inline-flex p-2 m-2 text-white"
        target="_blank"
        rel="noreferrer"
      >
        راهنمای دسترسی‌پذیری
      </a>
    </nav>

    ${
      config.announcementHtml
        ? html`
            <div
              class="alert alert-${config.announcementColor ?? 'primary'} mb-0 rounded-0 text-center"
            >
              ${unsafeHtml(config.announcementHtml)}
            </div>
          `
        : ''
    }

    <nav
      class="${
        isStudentSurface
          ? 'navbar navbar-expand-lg sh-navbar'
          : 'navbar navbar-dark bg-dark navbar-expand-md'
      }"
      aria-label="ناوبری سراسری"
    >
      <div class="container-fluid position-relative">
        ${
          sideNavEnabled
            ? html`
                <button
                  id="side-nav-mobile-toggler"
                  class="navbar-toggler"
                  type="button"
                  aria-expanded="false"
                  aria-label="باز/بسته کردن منوی کناری"
                >
                  <span class="navbar-toggler-icon"></span>
                </button>
              `
            : ''
        }
        ${
          isStudentSurface
            ? html`
                <a
                  class="navbar-brand d-flex align-items-center gap-2"
                  href="/"
                  aria-label="${uiStrings.nav.brandAria}"
                >
                  <span class="sh-brand-mark" aria-hidden="true">
                    <i class="bi bi-code-square"></i>
                  </span>
                  <span class="navbar-brand-label">
                    <span class="d-inline d-md-none">${platformBranding.brandShortName}</span>
                    <span class="d-none d-md-inline">
                      ${getEffectiveBrandName(resLocals.institution)}
                    </span>
                  </span>
                </a>
                <div class="d-flex align-items-center gap-2 order-lg-3">
                  ${
                    navbarType === 'student' &&
                    navbarResLocals.student_xp_pulse &&
                    navbarResLocals.authz_data?.mode !== 'Exam' &&
                    navbarResLocals.urlPrefix
                      ? StudentPulsePill({
                          pulse: navbarResLocals.student_xp_pulse as StudentNavbarPulse,
                          urlPrefix: navbarResLocals.urlPrefix,
                        })
                      : ''
                  }
                  <button
                    type="button"
                    class="sh-theme-toggle"
                    data-sh-theme-toggle
                    aria-label="تغییر به حالت تاریک"
                    title="تغییر به حالت تاریک"
                    aria-pressed="false"
                  >
                    <i class="bi bi-moon sh-icon-moon" aria-hidden="true"></i>
                    <i class="bi bi-sun sh-icon-sun" aria-hidden="true"></i>
                  </button>
                  <button
                    id="course-nav-toggler"
                    class="navbar-toggler d-lg-none"
                    type="button"
                    data-bs-toggle="collapse"
                    data-bs-target="#course-nav"
                    data-bs-animation="false"
                    aria-expanded="false"
                    aria-label="باز/بسته کردن منوی ناوبری"
                  >
                    <i class="bi bi-list fs-4" aria-hidden="true"></i>
                  </button>
                </div>
              `
            : html`
                <a
                  class="navbar-brand d-flex align-items-center gap-2 text-truncate"
                  style="max-width: 65vw; min-width: 0;"
                  href="/"
                  aria-label="${uiStrings.nav.brandAria}"
                >
                  <i
                    class="fas fa-graduation-cap text-info fs-5 flex-shrink-0"
                    aria-hidden="true"
                  ></i>
                  <span class="navbar-brand-label text-truncate">
                    <span class="d-inline d-md-none">${platformBranding.brandShortName}</span>
                    <span class="d-none d-md-inline"
                      >${getEffectiveBrandName(resLocals.institution)}</span
                    >
                  </span>
                  <span class="navbar-brand-hover-label">
                    ${uiStrings.common.home} <i class="fa fa-angle-left" aria-hidden="true"></i>
                  </span>
                </a>
                <div class="d-flex d-md-none align-items-center gap-2">
                  ${courseAgentPanel ? html`<div id="course-agent-mobile-launcher" class="d-flex"></div>` : ''}
                  <button
                    id="course-nav-toggler"
                    class="navbar-toggler"
                    type="button"
                    data-bs-toggle="collapse"
                    data-bs-target="#course-nav"
                    data-bs-animation="false"
                    aria-expanded="false"
                    aria-label="باز/بسته کردن منوی ناوبری"
                  >
                    <span
                      class="${sideNavEnabled ? 'bi bi-person-circle' : 'navbar-toggler-icon'}"
                    ></span>
                  </button>
                </div>
              `
        }
        <div
          id="course-nav"
          class="collapse navbar-collapse mobile-collapsed ${isStudentSurface ? 'order-lg-2' : ''}"
        >
          <ul class="nav navbar-nav me-auto" id="main-nav">
            ${NavbarByType({
              resLocals: navbarResLocals,
              navPage,
              navbarType,
              isStudentSurface,
            })}
          </ul>

          <div class="d-md-flex align-items-md-stretch">
            ${
              config.devMode
                ? html`
                    <a
                      id="navbar-load-from-disk"
                      class="btn btn-success btn-sm mb-2 mb-md-0"
                      href="/pl/loadFromDisk"
                    >
                      همگام‌سازی دیسک
                    </a>
                  `
                : ''
            }
            ${ReportCheatingControl({ resLocals: navbarResLocals, navPage })}
            ${EndExamControl({ resLocals: navbarResLocals })}
            ${
              showSupport
                ? html`
                    <button
                      type="button"
                      class="${
                        isStudentSurface
                          ? 'sh-nav-icon-btn ms-lg-2 me-lg-2 mb-2 mb-lg-0'
                          : 'btn btn-outline-light btn-sm ms-md-2 me-md-2 mb-2 mb-md-0'
                      }"
                      style="${
                        isStudentSurface
                          ? ''
                          : '--bs-btn-color: var(--bs-navbar-color); --bs-btn-border-color: var(--bs-navbar-color)'
                      }"
                      data-bs-toggle="modal tooltip"
                      data-bs-target="#supportModal"
                      data-bs-title="راهنمایی و پشتیبانی سامانه یادگیری"
                      aria-label="راهنمایی"
                    >
                      ${
                        isStudentSurface
                          ? html`<i class="bi bi-question-circle" aria-hidden="true"></i>`
                          : 'راهنمایی'
                      }
                    </button>
                  `
                : ''
            }
            ${
              courseAgentPanel
                ? html`<div class="d-none d-md-flex flex-shrink-0 me-md-2">
                    ${courseAgentPanel}
                  </div>`
                : ''
            }
          </div>
          ${
            hideSessionControls
              ? ''
              : UserDropdownMenu({
                  resLocals: navbarResLocals,
                  navPage,
                  navbarType,
                  isStudentSurface,
                })
          }
        </div>
      </div>
    </nav>

    ${showSupport ? SupportModal() : ''}
    ${
      navbarType === 'instructor' && course?.announcement_html && course.announcement_color
        ? html`
            <div class="alert alert-${course.announcement_color} mb-0 rounded-0 text-center">
              ${unsafeHtml(course.announcement_html)}
            </div>
          `
        : ''
    }
    ${FlashMessages()}
  `;
}

/**
 * Renders an "End exam" control when the user is in a LockDown Browser
 * session. The button opens a confirmation modal whose form POSTs to
 * `/pl/end-exam`; that handler looks up the student's active
 * LDB-required reservation, mints a short-lived JWT, calls PT
 * server-to-server to end the reservation, and redirects into PT's
 * close flow to exit LockDown Browser.
 *
 * PL's CSRF token is bound to the request URL, so we mint one specifically
 * for `/pl/end-exam` rather than reusing `resLocals.__csrf_token` (which
 * is bound to the current page's URL and would be rejected on submit).
 */
function EndExamControl({ resLocals }: { resLocals: UntypedResLocals }) {
  if (!resLocals.lockdown_browser) return '';
  const endExamCsrfToken = generateCsrfToken({
    url: '/pl/end-exam',
    authnUserId: resLocals.authn_user.id,
  });
  return html`
    <button
      type="button"
      class="btn btn-danger btn-sm ms-2 me-2 mb-2 mb-md-0"
      data-bs-toggle="modal"
      data-bs-target="#endExamModal"
    >
      پایان آزمون
    </button>
    ${EndExamModal({ csrfToken: endExamCsrfToken })}
  `;
}

function EndExamModal({ csrfToken }: { csrfToken: string }) {
  return Modal({
    title: 'پایان و ثبت نهایی آزمون',
    id: 'endExamModal',
    formAction: '/pl/end-exam',
    formClass: 'js-end-exam-form',
    body: html`
      <p class="js-end-exam-confirm">
        آیا از پایان دادن به آزمون خود اطمینان دارید؟ لطفاً فقط در صورتی که تمام پاسخ‌های خود را بررسی
        و ذخیره کرده‌اید این گزینه را تایید فرمایید. با این کار، مرورگر آزمون بسته خواهد شد.
      </p>
      <div
        class="js-end-exam-loading d-none d-flex align-items-center text-muted"
        aria-live="polite"
      >
        <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
        در حال ثبت و بستن آزمون…
      </div>
      <div class="js-end-exam-error alert alert-danger d-flex mb-0 d-none" role="alert">
        <i class="bi bi-exclamation-triangle-fill me-2 fs-5" aria-hidden="true"></i>
        <div>
          <strong>خطا در پایان دادن به آزمون.</strong>
          <div>
            لطفاً مجدداً تلاش نمایید یا از مراقب آزمون خود بخواهید تا جلسه آزمون شما را به پایان
            برساند.
          </div>
        </div>
      </div>
    `,
    footer: html`
      <input type="hidden" name="__csrf_token" value="${csrfToken}" />
      <button type="button" class="btn btn-secondary js-end-exam-cancel" data-bs-dismiss="modal">
        انصراف
      </button>
      <button type="submit" class="btn btn-danger js-end-exam-submit">
        <span
          class="spinner-border spinner-border-sm me-1 js-end-exam-submit-spinner d-none"
          role="status"
          aria-hidden="true"
        ></span>
        <span class="js-end-exam-submit-label">پایان قطعی آزمون</span>
      </button>
    `,
  });
}

function ReportCheatingControl({
  resLocals,
  navPage,
}: {
  resLocals: UntypedResLocals;
  navPage: NavPage;
}) {
  if (
    navPage !== 'assessment_instance' ||
    resLocals.authz_result?.mode !== 'Exam' ||
    resLocals.prairietest_reservation_info?.cheating_report_reservation_id == null
  ) {
    return '';
  }
  const reportCheatingCsrfToken = generateCsrfToken({
    url: '/pl/report-cheating',
    authnUserId: resLocals.authn_user.id,
  });
  return html`
    <button
      type="button"
      class="btn btn-outline-light btn-sm ms-2 me-2 mb-2 mb-md-0"
      data-bs-toggle="modal"
      data-bs-target="#reportCheatingModal"
    >
      گزارش تخلف در آزمون
    </button>
    ${ReportCheatingModal({ csrfToken: reportCheatingCsrfToken })}
  `;
}

function ReportCheatingModal({ csrfToken }: { csrfToken: string }) {
  return Modal({
    title: 'گزارش تخلف در جلسه آزمون',
    id: 'reportCheatingModal',
    formAction: '/pl/report-cheating',
    formClass: 'js-report-cheating-form',
    body: html`
      <div class="js-report-cheating-fields">
        <p>
          در صورتی که نقض قوانین آزمون (مانند استفاده از تلفن همراه، برگه تقلب یا سایر موارد
          غیرمجاز) را مشاهده کرده‌اید، جزئیات آن را در کادر زیر بنویسید. این گزارش کاملاً محرمانه بوده
          و تنها برای کادر آموزشی و مراقبان آزمون ارسال خواهد شد.
        </p>
        <div class="mb-0">
          <label class="form-label" for="report-cheating-text">شرح تخلف مشاهده شده:</label>
          <textarea
            class="form-control"
            id="report-cheating-text"
            name="report"
            rows="4"
            maxlength="10000"
            required
            aria-invalid="false"
            aria-errormessage="report-cheating-error"
          ></textarea>
        </div>
      </div>
      <div class="alert alert-success d-none js-report-cheating-success" role="status"></div>
      <div
        id="report-cheating-error"
        class="alert alert-danger d-none js-report-cheating-error"
        role="alert"
        aria-live="assertive"
      ></div>
      <div class="text-muted d-none js-report-cheating-loading" aria-live="polite">
        <span class="spinner-border spinner-border-sm me-2" aria-hidden="true"></span>
        در حال ارسال گزارش…
      </div>
    `,
    footer: html`
      <input type="hidden" name="__csrf_token" value="${csrfToken}" />
      <button
        type="button"
        class="btn btn-secondary js-report-cheating-cancel"
        data-bs-dismiss="modal"
      >
        انصراف
      </button>
      <button type="submit" class="btn btn-primary js-report-cheating-submit">
        <span class="js-report-cheating-submit-label">ارسال گزارش محرمانه</span>
      </button>
    `,
  });
}

function NavbarByType({
  resLocals,
  navPage,
  navbarType,
  isStudentSurface = false,
}: {
  resLocals: UntypedResLocals;
  navPage: NavPage;
  navbarType: NavbarType;
  isStudentSurface?: boolean;
}) {
  if (navbarType === 'student') {
    return NavbarStudent({ resLocals, navPage, isStudentSurface });
  } else if (navbarType === 'public') {
    return NavbarPublic({ resLocals });
  } else {
    return NavbarButtons({
      resLocals,
      navPage,
      navbarType,
    });
  }
}

function UserDropdownMenu({
  resLocals,
  navPage,
  navbarType,
  isStudentSurface = false,
}: {
  resLocals: UntypedResLocals;
  navPage: NavPage;
  navbarType: NavbarType;
  isStudentSurface?: boolean;
}) {
  const {
    authz_data,
    authn_user,
    viewType,
    course_instance,
    access_as_administrator,
    authn_is_administrator,
  } = resLocals;

  let displayedName: HtmlValue;
  if (authz_data) {
    displayedName = run(() => {
      const name = authz_data.user.name || authz_data.user.uid;
      if (authz_data.mode != null && authz_data.mode !== 'Public') {
        return `${name} (${authz_data.mode})`;
      }
      return name;
    });
  } else if (authn_user) {
    displayedName = authn_user.name || authn_user.uid;
  } else {
    displayedName = '(بدون کاربر)';
  }

  if (
    navbarType === 'student' &&
    course_instance &&
    (authz_data?.authn_has_course_permission_preview ||
      authz_data?.authn_has_course_instance_permission_view)
  ) {
    displayedName = html`${displayedName}
    ${
      isStudentSurface
        ? html`<span class="sh-role-pill ms-1">دانشجو</span>`
        : html`<span class="badge text-bg-warning">دانشجو</span>`
    }`;
  } else if (authz_data?.overrides?.length > 0) {
    displayedName = html`${displayedName}
    ${
      isStudentSurface
        ? html`<span class="sh-role-pill ms-1">سفارشی‌شده</span>`
        : html`<span class="badge text-bg-warning">سفارشی‌شده</span>`
    }`;
  } else if (navbarType === 'instructor') {
    displayedName = html`${displayedName} <span class="badge text-bg-success">کادر آموزشی</span>`;
  }

  const effectiveAvatarUser = authz_data?.user ?? authn_user;
  const isSelfAvatar = Boolean(
    effectiveAvatarUser && authn_user && effectiveAvatarUser.id === authn_user.id,
  );
  const avatarMeta = isSelfAvatar
    ? (resLocals.authn_user_avatar_meta as UserAvatarMeta | null | undefined)
    : null;
  const avatarRawName = effectiveAvatarUser?.name || effectiveAvatarUser?.uid || 'د';
  const avatarInitials = getInitialsFromName(avatarRawName);
  const avatarIcon = resolveAvatarIconClass(avatarMeta?.avatarPreset);
  const avatarColor = avatarMeta?.avatarColor ?? 'cobalt';
  const avatarUrl = effectiveAvatarUser
    ? getUserAvatarUrl(effectiveAvatarUser.id, avatarMeta?.avatarVersion)
    : null;
  const navAvatarHtml = effectiveAvatarUser
    ? html`<span
        class="sh-avatar sh-nav-avatar sh-av-color-${avatarColor} me-2"
        ${isSelfAvatar ? html`data-sh-my-avatar data-user-id="${effectiveAvatarUser.id}"` : ''}
        data-initials="${avatarInitials}"
        data-icon-class="${avatarIcon}"
        aria-hidden="true"
      >
        ${
          avatarUrl
            ? html`<img src="${avatarUrl}" class="sh-avatar-img" alt="" />`
            : avatarIcon
              ? html`<i class="${avatarIcon}"></i>`
              : html`<span>${avatarInitials}</span>`
        }
      </span>`
    : '';

  return html`
    <ul
      class="nav navbar-nav"
      id="username-nav"
      data-access-as-administrator="${access_as_administrator?.toString()}"
      data-view-type="${viewType ?? null}"
      data-authn-course-role="${authz_data?.authn_course_role}"
      data-authn-course-instance-role="${authz_data?.authn_course_instance_role}"
      data-has-instructor-access="${authz_data?.user_with_requested_uid_has_instructor_access_to_course_instance?.toString()}"
    >
      <li class="nav-item dropdown mb-2 mb-md-0 ${navPage === 'effective' ? 'active' : ''}">
        <a
          class="nav-link dropdown-toggle d-flex align-items-center"
          id="navbarDropdown"
          href="#"
          role="button"
          data-bs-auto-close="outside"
          data-bs-toggle="dropdown"
          aria-haspopup="true"
          aria-expanded="false"
        >
          ${navAvatarHtml}
          <span>${displayedName}</span>
        </a>
        <div class="dropdown-menu dropdown-menu-end">
          ${
            authn_is_administrator
              ? html`
                  <button type="button" class="dropdown-item" id="navbar-administrator-toggle">
                    ${access_as_administrator ? 'غیرفعال‌سازی دسترسی مدیر' : 'فعال‌سازی دسترسی مدیر'}
                  </button>

                  <div class="dropdown-divider"></div>
                `
              : ''
          }
          ${ViewTypeMenu({ resLocals })} ${AuthnOverrides({ resLocals, navbarType })}
          ${
            authz_data?.mode === 'Exam'
              ? html`
                  <div class="dropdown-item-text">
                    حالت آزمون فعال است. دسترسی‌های شما به آزمون جاری محدود می‌باشد.
                  </div>
                  <div class="dropdown-divider"></div>
                `
              : ''
          }
          ${
            (!authz_data || authz_data?.mode === 'Public') &&
            (!isStudentSurface ||
              authn_is_administrator ||
              authz_data?.authn_has_course_permission_preview ||
              authz_data?.authn_has_course_instance_permission_view)
              ? html`<a class="dropdown-item" href="/pl/request_course">درخواست ایجاد درس جدید</a>`
              : ''
          }
          ${
            authz_data?.mode !== 'Exam'
              ? html`<a class="dropdown-item" href="/pl/settings#public-profile">
                  <i class="bi bi-person-circle me-2" aria-hidden="true"></i>پروفایل و عکس من
                </a>`
              : ''
          }
          <a class="dropdown-item" href="/pl/settings">تنظیمات</a>
          <a class="dropdown-item" href="/pl/logout">خروج از حساب</a>
        </div>
      </li>
    </ul>
  `;
}

function FlashMessages() {
  const globalFlashColors = {
    notice: 'info',
    success: 'success',
    warning: 'warning',
    error: 'danger',
  } as const;

  // We might fail to fetch flash messages if this ends up running before the
  // flash middleware has run for this particular request. In that case, we
  // just assume that there are no flash messages.
  const flashMessages = run(() => {
    try {
      return flash(Object.keys(globalFlashColors) as FlashMessageType[]);
    } catch {
      return [];
    }
  });

  return flashMessages.map(
    ({ type, message }) => html`
      <div
        class="alert alert-${
          globalFlashColors[type]
        } border-start-0 border-end-0 rounded-0 mt-0 mb-0 alert-dismissible fade show"
        role="alert"
      >
        ${unsafeHtml(message)}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="بستن"></button>
      </div>
    `,
  );
}

function ViewTypeMenu({ resLocals }: { resLocals: UntypedResLocals }) {
  const {
    viewType,
    course,
    course_instance,
    authz_data,
    assessment,
    question,
    assessment_instance,
    urlPrefix,
  } = resLocals;

  // If we're working with an example course, only allow changing the effective
  // user if the authenticated user is an administrator or we are in development mode.
  if (course?.example_course && !config.devMode && !authz_data?.authn_is_administrator) {
    return '';
  }

  // Only show "View type" menu(s) if the following two things are true:
  // - The authn user was given access to a course instance (so, both viewType and authz_data also exist).
  // - In particular, the authn user has instructor access to this course instance.
  if (
    viewType == null ||
    !course_instance ||
    !(
      authz_data.authn_has_course_permission_preview ||
      authz_data.authn_has_course_instance_permission_view
    )
  ) {
    return '';
  }

  // Note that the effective user may still have been denied access. In this
  // case, urlPrefix may not be consistent with the page that the effective user
  // was trying to access (instead, it will be consistent with a "plain" page).
  // So, to be safe, we use config.urlPrefix and construct all full URLs by hand.
  let instructorLink = '#';
  let studentLink = '#';
  if (viewType === 'instructor') {
    if (assessment?.id) {
      studentLink = `/pl/course_instance/${course_instance.id}/assessment/${assessment.id}`;
    } else {
      studentLink = `/pl/course_instance/${course_instance.id}/assessments`;
    }
  } else {
    if (question?.id) {
      instructorLink = `${urlPrefix}/instructor/question/${question.id}`;
    } else if (assessment_instance?.assessment_id) {
      instructorLink = `${urlPrefix}/instructor/assessment/${assessment_instance.assessment_id}`;
    } else if (assessment?.id) {
      instructorLink = `${urlPrefix}/instructor/assessment/${assessment.id}`;
    } else {
      instructorLink = `${urlPrefix}/instructor/instance_admin`;
    }
  }

  let headingAuthnViewTypeMenu = 'حالت نمایش';
  if (authz_data.authn_user.uid !== authz_data.user.uid) {
    headingAuthnViewTypeMenu = 'مشاهده به‌عنوان';
    if (authz_data.authn_user.name) {
      headingAuthnViewTypeMenu += ` ${authz_data.authn_user.name} (${authz_data.authn_user.uid})`;
    } else {
      headingAuthnViewTypeMenu += ` ${authz_data.authn_user.uid}`;
    }
  }

  let authnViewTypeMenuChecked = '';
  if (authz_data.authn_user.uid === authz_data.user.uid) {
    if (viewType === 'instructor') {
      if (
        authz_data.has_course_permission_preview ||
        authz_data.has_course_instance_permission_view
      ) {
        authnViewTypeMenuChecked = 'instructor';
      }
    } else if (
      authz_data.has_course_permission_preview ||
      authz_data.has_course_instance_permission_view
    ) {
      authnViewTypeMenuChecked = 'student-no-rules';
    } else {
      authnViewTypeMenuChecked = 'student';
    }
  }

  let headingViewTypeMenu = '';
  let viewTypeMenuChecked = '';
  if (authz_data.authn_user.uid !== authz_data.user.uid) {
    headingViewTypeMenu = 'مشاهده به‌عنوان';
    if (authz_data.user.name) {
      headingViewTypeMenu += ` ${authz_data.user.name} (${authz_data.user.uid})`;
    } else {
      headingViewTypeMenu += ` ${authz_data.user.uid}`;
    }

    if (viewType === 'instructor') {
      if (
        authz_data.has_course_permission_preview ||
        authz_data.has_course_instance_permission_view
      ) {
        viewTypeMenuChecked = 'instructor';
      }
    } else if (
      authz_data.has_course_permission_preview ||
      authz_data.has_course_instance_permission_view
    ) {
      viewTypeMenuChecked = 'student-no-rules';
    } else {
      viewTypeMenuChecked = 'student';
    }
  }

  return html`
    ${
      authz_data?.overrides?.length > 0 && authnViewTypeMenuChecked === 'instructor'
        ? html`
            <a class="dropdown-item" href="${instructorLink}" id="navbar-reset-view">
              بازنشانی به نمای پیش‌فرض کادر آموزشی
              <span class="badge text-bg-success">استاد</span>
            </a>

            <div class="dropdown-divider"></div>
          `
        : ''
    }

    <h6 class="dropdown-header">${headingAuthnViewTypeMenu}</h6>

    <a
      class="dropdown-item viewtype-dropdown-item"
      href="${instructorLink}"
      id="navbar-user-view-authn-instructor"
    >
      <span class="${authnViewTypeMenuChecked !== 'instructor' ? 'invisible' : ''}">&check;</span>
      <span class="ps-3">
        ${
          authz_data?.overrides?.length > 0 && authnViewTypeMenuChecked === 'instructor'
            ? 'نمای سفارشی‌شده کادر آموزشی'
            : 'نمای کادر آموزشی'
        }
        <span class="badge text-bg-success ms-1">استاد</span>
      </span>
    </a>

    <a
      class="dropdown-item viewtype-dropdown-item"
      href="${studentLink}"
      id="navbar-user-view-authn-student"
    >
      <span class="${authnViewTypeMenuChecked !== 'student' ? 'invisible' : ''}">&check;</span>
      <span class="ps-3">نمای دانشجو <span class="badge text-bg-warning ms-1">دانشجو</span></span>
    </a>

    <a
      class="dropdown-item viewtype-dropdown-item"
      href="${studentLink}"
      id="navbar-user-view-authn-student-no-rules"
    >
      <span class="${authnViewTypeMenuChecked !== 'student-no-rules' ? 'invisible' : ''}">
        &check;
      </span>
      <span class="ps-3">
        نمای دانشجو بدون محدودیت‌های دسترسی
        <span class="badge text-bg-warning ms-1">دانشجو</span>
      </span>
    </a>

    ${
      authz_data.authn_user.uid !== authz_data.user.uid
        ? html`
            <div class="dropdown-divider"></div>
            <h6 class="dropdown-header">${headingViewTypeMenu}</h6>

            ${
              authz_data.user_with_requested_uid_has_instructor_access_to_course_instance
                ? html`
                    <a
                      class="dropdown-item"
                      href="${instructorLink}"
                      id="navbar-user-view-instructor"
                    >
                      <span class="${viewTypeMenuChecked !== 'instructor' ? 'invisible' : ''}">
                        &check;
                      </span>
                      <span class="ps-3">نمای کادر آموزشی</span>
                    </a>
                  `
                : ''
            }

            <a class="dropdown-item" href="${studentLink}" id="navbar-user-view-student">
              <span class="${viewTypeMenuChecked !== 'student' ? 'invisible' : ''}"> &check; </span>
              <span class="ps-3">نمای دانشجو</span>
            </a>

            <a class="dropdown-item" href="${studentLink}" id="navbar-user-view-student-no-rules">
              <span class="${viewTypeMenuChecked !== 'student-no-rules' ? 'invisible' : ''}">
                &check;
              </span>
              <span class="ps-3">نمای دانشجو بدون محدودیت‌های دسترسی</span>
            </a>
          `
        : ''
    }

    <div class="dropdown-divider"></div>
  `;
}

function AuthnOverrides({
  resLocals,
  navbarType,
}: {
  resLocals: UntypedResLocals;
  navbarType: NavbarType;
}) {
  const { authz_data, urlPrefix, course, course_instance } = resLocals;

  // If we're working with an example course, only allow changing the effective
  // user if the authenticated user is an administrator or we are in development mode.
  if (course?.example_course && !config.devMode && !authz_data?.authn_is_administrator) {
    return '';
  }

  if (
    !authz_data?.authn_has_course_permission_preview &&
    !authz_data?.authn_has_course_instance_permission_view
  ) {
    return '';
  }

  let effectiveUserUrl = `${urlPrefix}/effectiveUser`;
  if (navbarType !== 'student' && navbarType !== 'instructor') {
    // The only way for authz_data to exist, for authn_has_course_permission_preview to be true,
    // and for navbarType to be neither student nor instructor, is if we are in a course or course
    // instance and if the effective user does not have access.
    //
    // In this case, we still want a link to the "Change effective user" page, but we need to
    // construct this link from scratch, because urlPrefix corresponds neither to the student
    // page route nor the instructor page route (it gets set after successful authorization).
    //
    // It is ok to use the instructor route only to the effectiveUser page - this will redirect
    // to the student route if necessary.
    if (course_instance) {
      effectiveUserUrl = `/pl/course_instance/${course_instance.id}/instructor/effectiveUser`;
    } else {
      effectiveUserUrl = `/pl/course/${course.id}/effectiveUser`;
    }
  }

  return html`
    <h6 class="dropdown-header">کاربر مجازی (تست دسترسی‌ها)</h6>

    <form class="dropdown-item-text d-flex flex-nowrap js-effective-uid-form">
      <input
        id="effective-uid"
        type="email"
        placeholder="student@iust.ac.ir"
        class="form-control form-control-sm me-2 flex-grow-1 js-effective-uid-input"
        aria-label="شناسه کاربری (UID)"
      />
      <button
        type="submit"
        class="btn btn-primary btn-sm text-nowrap js-effective-uid-button"
        disabled
      >
        تغییر کاربر
      </button>
    </form>

    ${
      authz_data?.overrides?.length > 0
        ? html`
            <div class="dropdown-item-text">
              <div class="list-group small text-nowrap">
                ${authz_data.overrides.map(
                  (override: Override) => html`
                    <div class="list-group-item list-group-item-warning small p-2">
                      <div class="d-flex flex-row justify-content-between align-items-center">
                        <div class="p-0 me-4">
                          <ul class="list-unstyled">
                            <li class="fw-bold">${override.name}</li>
                            <li>${override.value}</li>
                          </ul>
                        </div>
                        <div>
                          <button
                            class="btn btn-xs btn-warning js-remove-override"
                            type="button"
                            data-override-cookie="${override.cookie}"
                          >
                            <i class="fas fa-times me-1"></i>
                            حذف
                          </button>
                        </div>
                      </div>
                    </div>
                  `,
                )}
              </div>
            </div>
          `
        : ''
    }

    <a class="dropdown-item" href="${effectiveUserUrl}">تنظیمات پیشرفته هویت و نقش&hellip;</a>

    <div class="dropdown-divider"></div>
  `;
}

function NavbarButton({
  text,
  href,
  active = false,
  showArrow = true,
}: {
  text: string;
  href: string;
  active?: boolean;
  showArrow?: boolean;
}) {
  return html`
    <li class="nav-item">
      <a class="nav-link ${active ? 'active' : ''}" href="${href}">${text}</a>
    </li>
    ${
      showArrow
        ? html`<li class="nav-item d-none d-lg-block" aria-hidden="true">
            <span class="nav-link disabled px-0" style="color: var(--bs-nav-link-color);">
              &larr;
            </span>
          </li>`
        : ''
    }
  `;
}

function NavbarButtons({
  resLocals,
  navPage,
  navbarType,
}: {
  resLocals: UntypedResLocals;
  navPage: NavPage;
  navbarType: NavbarType;
}) {
  // When no institution or course is set, show links to the home page and the global admin page.
  if (
    !resLocals.institution &&
    !resLocals.course &&
    navPage !== 'admin' &&
    navbarType === 'plain'
  ) {
    return html`
      ${NavbarButton({
        text: 'صفحه اصلی',
        href: '/',
        showArrow: false,
      })}
      ${
        resLocals.is_administrator
          ? NavbarButton({
              text: 'مدیریت سامانه',
              href: '/pl/administrator/admins',
              showArrow: false,
            })
          : ''
      }
    `;
  }

  const allNavbarButtons = [{ text: 'صفحه اصلی', href: '/' }];

  if (resLocals.is_administrator) {
    allNavbarButtons.push({ text: 'مدیریت سامانه', href: '/pl/administrator/admins' });
  }

  if (resLocals.institution) {
    if (resLocals.is_administrator) {
      allNavbarButtons.push(
        { text: 'دانشکده‌ها و موسسات', href: '/pl/administrator/institutions' },
        {
          text: resLocals.institution.short_name,
          href: isEnterprise()
            ? `/pl/administrator/institution/${resLocals.institution.id}`
            : '/pl/administrator/institutions',
        },
      );
    } else if (resLocals.is_institution_administrator) {
      allNavbarButtons.push({
        text: resLocals.institution.short_name,
        href: `/pl/institution/${resLocals.institution.id}/admin/admins`,
      });
    }
  }

  if (resLocals.course) {
    if (resLocals.institution) {
      if (resLocals.is_administrator) {
        allNavbarButtons.push({
          text: 'درس‌ها',
          href: isEnterprise()
            ? `/pl/administrator/institution/${resLocals.institution.id}/courses`
            : '/pl/administrator/courses',
        });
      } else if (resLocals.is_institution_administrator) {
        allNavbarButtons.push({
          text: 'درس‌ها',
          href: `/pl/institution/${resLocals.institution.id}/admin/courses`,
        });
      }
    }
    allNavbarButtons.push({
      text: resLocals.course.short_name,
      href: `/pl/course/${resLocals.course.id}/course_admin/instances`,
    });
  }

  if (resLocals.course_instance) {
    allNavbarButtons.push({
      text: resLocals.course_instance.short_name,
      href: `/pl/course_instance/${resLocals.course_instance.id}/instructor/instance_admin/assessments`,
    });
  }

  return html`
    ${allNavbarButtons.map((navbarButton, index) =>
      NavbarButton({
        text: navbarButton.text,
        href: navbarButton.href,
        showArrow: index < allNavbarButtons.length - 1,
        active: index === allNavbarButtons.length - 1,
      }),
    )}
  `;
}

function NavbarStudent({
  resLocals,
  navPage,
  isStudentSurface = false,
}: {
  resLocals: UntypedResLocals;
  navPage: NavPage;
  isStudentSurface?: boolean;
}) {
  const { course, course_instance, assessment_instance, assessment_instance_label, urlPrefix } =
    resLocals;

  if (!isStudentSurface) {
    return html`
      <li class="nav-item navbar-text me-4">
        ${course?.short_name ?? ''}, ${course_instance?.short_name ?? ''}
      </li>

      <li class="nav-item ${navPage === 'assessments' ? 'active' : ''}">
        <a class="nav-link" href="${urlPrefix}/assessments">تکالیف و ارزیابی‌ها</a>
      </li>
      <li class="nav-item ${navPage === 'gradebook' ? 'active' : ''}">
        <a class="nav-link" href="${urlPrefix}/gradebook">کارنامه و نمرات</a>
      </li>
      ${
        resLocals.student_leaderboard_enabled
          ? html`
              <li class="nav-item ${navPage === 'leaderboard' ? 'active' : ''}">
                <a class="nav-link" href="${urlPrefix}/leaderboard">
                  <i class="fas fa-trophy me-1 text-warning" aria-hidden="true"></i>جدول امتیازات
                </a>
              </li>
            `
          : ''
      }
      ${
        assessment_instance_label != null && assessment_instance != null
          ? html`
              <li class="nav-item ${navPage === 'assessment_instance' ? 'active' : ''}">
                <a
                  class="nav-link"
                  href="${urlPrefix}/assessment_instance/${assessment_instance.id}"
                >
                  ${assessment_instance_label}
                </a>
              </li>
            `
          : ''
      }
    `;
  }

  return html`
    <li class="nav-item d-flex align-items-center ms-lg-2 me-lg-1 my-1 my-lg-0">
      <span class="sh-course-pill">
        <span dir="ltr">${course?.short_name ?? ''}</span>
        ${
          course_instance?.short_name
            ? html`<span class="d-none d-xl-inline" aria-hidden="true">•</span>
                <span class="d-none d-xl-inline" dir="ltr">${course_instance.short_name}</span>`
            : ''
        }
      </span>
    </li>

    <li class="nav-item ${navPage === 'assessments' ? 'active' : ''}">
      <a
        class="nav-link ${navPage === 'assessments' ? 'active' : ''}"
        ${navPage === 'assessments' ? html`aria-current="page"` : ''}
        href="${urlPrefix}/assessments"
      >
        <i class="bi bi-journal-text" aria-hidden="true"></i>
        <span>تکالیف</span>
      </a>
    </li>
    <li class="nav-item ${navPage === 'gradebook' ? 'active' : ''}">
      <a
        class="nav-link ${navPage === 'gradebook' ? 'active' : ''}"
        ${navPage === 'gradebook' ? html`aria-current="page"` : ''}
        href="${urlPrefix}/gradebook"
      >
        <i class="bi bi-bar-chart-line" aria-hidden="true"></i>
        <span>کارنامه</span>
      </a>
    </li>
    ${
      resLocals.student_skill_tree_enabled && resLocals.authz_data?.mode !== 'Exam'
        ? html`
            <li class="nav-item ${navPage === 'skills' ? 'active' : ''}">
              <a
                class="nav-link ${navPage === 'skills' ? 'active' : ''}"
                ${navPage === 'skills' ? html`aria-current="page"` : ''}
                href="${urlPrefix}/skills"
              >
                <i class="bi bi-diagram-3" aria-hidden="true"></i>
                <span>درخت مهارت</span>
              </a>
            </li>
          `
        : ''
    }
    ${
      resLocals.student_leaderboard_enabled && resLocals.authz_data?.mode !== 'Exam'
        ? html`
            <li class="nav-item ${navPage === 'leaderboard' ? 'active' : ''}">
              <a
                class="nav-link ${navPage === 'leaderboard' ? 'active' : ''}"
                ${navPage === 'leaderboard' ? html`aria-current="page"` : ''}
                href="${urlPrefix}/leaderboard"
              >
                <i class="bi bi-trophy" aria-hidden="true"></i>
                <span>امتیازات</span>
              </a>
            </li>
          `
        : ''
    }
    ${
      assessment_instance_label != null && assessment_instance != null
        ? html`
            <li class="nav-item ${navPage === 'assessment_instance' ? 'active' : ''}">
              <a
                class="nav-link ${navPage === 'assessment_instance' ? 'active' : ''}"
                ${navPage === 'assessment_instance' ? html`aria-current="page"` : ''}
                href="${urlPrefix}/assessment_instance/${assessment_instance.id}"
              >
                <i class="bi bi-file-earmark-code" aria-hidden="true"></i>
                <span>${assessment_instance_label}</span>
              </a>
            </li>
          `
        : ''
    }
  `;
}

function StudentPulsePill({ pulse, urlPrefix }: { pulse: StudentNavbarPulse; urlPrefix: string }) {
  return html`
    <a
      href="${urlPrefix}/gradebook#tab-achievements"
      class="sh-pulse-pill d-none d-sm-inline-flex"
      title="${pulse.levelTitle} — ${toPersianDigits(pulse.totalXp)} XP (${toPersianDigits(pulse.unlockedCount)} دستاورد)"
    >
      <span class="sh-pulse-lv sh-en-term sh-tabular">Lv.${pulse.level}</span>
      <span class="sh-pulse-bar" aria-hidden="true">
        <span class="sh-pulse-bar-fill" style="width: ${pulse.progressPerc}%"></span>
      </span>
      ${
        pulse.currentStreakDays > 0
          ? html`
              <span class="sh-pulse-streak sh-tabular">
                <i class="bi bi-fire" aria-hidden="true"></i>
                <span>${toPersianDigits(pulse.currentStreakDays)}</span>
              </span>
            `
          : ''
      }
    </a>
  `;
}

function NavbarPublic({ resLocals }: { resLocals: UntypedResLocals }) {
  const { course } = resLocals;
  return html`
    <li class="nav-item btn-group">
      <a
        class="nav-link"
        aria-label="پیوند به صفحه نمایش تمام سوالات عمومی این درس."
        href="/pl/public/course/${course?.id}/questions"
      >
        ${course?.short_name ?? ''}
      </a>
    </li>
  `;
}
