import { EncodedData } from '@prairielearn/browser-utils';
import { type HtmlValue, html, unsafeHtml } from '@prairielearn/html';
import { assertNever } from '@prairielearn/utils';

import { Modal } from '../../components/Modal.js';
import { PageLayout } from '../../components/PageLayout.js';
import { compiledScriptTag } from '../../lib/assets.js';
import { type CourseRequest } from '../../lib/db-types.js';
import {
  GITHUB_USERNAME_MAX_LENGTH,
  GITHUB_USERNAME_PATTERN,
  GITHUB_USERNAME_VALIDATION_MESSAGE,
} from '../../lib/github-utils.js';
import type { ResLocalsForPage } from '../../lib/res-locals.js';
import { DEFAULT_INSTITUTION_SHORT_NAME } from '../../models/institution.js';

import type { CourseRequestRow, Lti13CourseRequestInput } from './instructorRequestCourse.types.js';

export function RequestCourse({
  rows,
  lti13Info,
  institutionMessageHtml,
  resLocals,
}: {
  rows: CourseRequestRow[];
  lti13Info: Lti13CourseRequestInput;
  institutionMessageHtml: string;
  resLocals: ResLocalsForPage<'plain'>;
}) {
  return PageLayout({
    pageTitle: 'درخواست ایجاد درس جدید',
    resLocals,
    navContext: {
      type: 'plain',
      page: 'request_course',
    },
    headContent: compiledScriptTag('instructorRequestCourseClient.ts'),
    content: html`
      <div class="mx-auto" style="max-width: 1000px; font-family: var(--font-persian);">
        <h1 class="h2 mb-3">درخواست ایجاد درس یا دوره آموزشی جدید</h1>
        ${CourseRequestsCard({ rows })} ${EncodedData(lti13Info, 'course-request-lti13-info')}
        ${Modal({
          id: 'fill-course-request-lti13-modal',
          title: `تکمیل خودکار با اطلاعات ${lti13Info?.['cr-institution'] ?? 'سامانه آموزشی'}؟`,
          form: false,
          body: html`
            <p>
              به نظر می‌رسد از یک درس در سامانه آموزشی دیگر متصل شده‌اید. آیا مایلید فرم درخواست با اطلاعات دریافتی تکمیل گردد؟
            </p>
            <p>(پس از تکمیل خودکار، امکان ویرایش تمام فیلدها وجود دارد.)</p>
          `,
          footer: html`
            <button type="button" class="btn btn-success" id="fill-course-request-lti13-info">
              تکمیل خودکار فرم
            </button>
            <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">
              صرف‌نظر
            </button>
          `,
        })}
        ${CourseNewRequestForm({
          csrfToken: resLocals.__csrf_token,
          isDefaultInstitution:
            resLocals.authn_institution.short_name === DEFAULT_INSTITUTION_SHORT_NAME,
          institutionName: resLocals.authn_institution.long_name,
          institutionMessageHtml,
          userEmail: resLocals.authn_user.email,
        })}
      </div>
    `,
  });
}

function InstitutionMessageCard({
  institutionMessageHtml,
  institutionName,
}: {
  institutionMessageHtml: string;
  institutionName: string;
}): HtmlValue {
  if (!institutionMessageHtml) {
    return '';
  }
  return html`
    <div class="card mb-4" data-testid="institution-message-card">
      <div class="card-header d-flex align-items-center">
        <h2 class="h5 mb-0">اطلاعیه از طرف «${institutionName}»</h2>
      </div>
      <div class="card-body">${unsafeHtml(institutionMessageHtml)}</div>
    </div>
  `;
}

function CourseRequestsCard({ rows }: { rows: CourseRequestRow[] }): HtmlValue {
  if (rows.length === 0) {
    return '';
  }

  return html`
    <div class="card mb-4">
      <div class="card-header bg-primary text-white d-flex align-items-center">
        <h2 class="h5 mb-0">سوابق درخواست‌های درس شما</h2>
      </div>
      <div class="table-responsive">
        <table class="table table-sm table-hover table-striped" aria-label="درخواست‌های درس">
          <thead>
            <tr>
              <th>کد درس</th>
              <th>عنوان درس</th>
              <th>وضعیت</th>
              <th>جزئیات</th>
            </tr>
          </thead>
          <tbody>
            ${rows.map(({ course_request, approved_by_user }) => {
              let details = '';
              switch (course_request.approved_status) {
                case 'approved':
                  if (approved_by_user) {
                    details = `تایید شده توسط ${approved_by_user.name}`;
                  } else {
                    details = 'تایید خودکار';
                  }
                  break;
                case 'denied':
                  details = `رد شده توسط ${approved_by_user?.name ?? 'مدیر سامانه'}`;
                  break;
              }

              return html`
                <tr>
                  <td dir="ltr" style="text-align: right;">${course_request.short_name}</td>
                  <td>${course_request.title}</td>
                  <td>${ApprovalStatusIcon({ status: course_request.approved_status })}</td>
                  <td>${details}</td>
                </tr>
              `;
            })}
          </tbody>
        </table>
      </div>
    </div>
  `;
}

function CourseNewRequestForm({
  csrfToken,
  isDefaultInstitution,
  institutionName,
  institutionMessageHtml,
  userEmail,
}: {
  csrfToken: string;
  isDefaultInstitution: boolean;
  institutionName: string;
  institutionMessageHtml: string;
  userEmail: string | null;
}): HtmlValue {
  return html`
    <form class="question-form" name="course-request" method="POST">
      <p class="text-muted">
        این فرم برای مدرسان، اساتید و طراحان آموزشی جهت راه‌اندازی و تعریف درس یا دوره جدید در سامانه ارزیابی هوشمند است. فراگیران و دانشجویان گرامی <strong>نباید</strong> این فرم را پر کنند و جهت شرکت در آزمون‌ها یا حل تمرین، باید از طریق کد دوره که توسط مدرس ارائه می‌شود عضو شوند.
      </p>

      ${InstitutionMessageCard({ institutionMessageHtml, institutionName })}
      ${institutionMessageHtml ? '' : html`<hr class="my-3" />`}
      <h2 class="h5 mb-3">اطلاعات متقاضی (مدرس / طراح)</h2>
      <div class="row">
        <div class="mb-3 col-md-6">
          <label class="form-label" for="cr-firstname">نام</label>
          <input
            type="text"
            class="form-control"
            name="cr-firstname"
            id="cr-firstname"
            minlength="1"
            required
          />
        </div>
        <div class="mb-3 col-md-6">
          <label class="form-label" for="cr-lastname">نام خانوادگی</label>
          <input
            type="text"
            class="form-control"
            name="cr-lastname"
            id="cr-lastname"
            minlength="1"
            required
          />
        </div>
      </div>
      ${
        isDefaultInstitution
          ? html`
              <div class="row">
                <div class="mb-3 col-md-6">
                  <label class="form-label" for="cr-institution">موسسه، سازمان یا واحد آموزشی</label>
                  <input
                    type="text"
                    class="form-control"
                    name="cr-institution"
                    id="cr-institution"
                    placeholder="مثال: دپارتمان مهندسی نرم‌افزار، آموزشگاه یا موسسه"
                    minlength="1"
                    required
                  />
                  <small class="form-text text-muted">
                    نام موسسه، سازمان یا واحد آموزشی برگزارکننده.
                  </small>
                </div>
                <div class="mb-3 col-md-6">
                  <label class="form-label" for="cr-email">ایمیل رسمی / سازمانی</label>
                  <input
                    type="email"
                    class="form-control text-start"
                    name="cr-email"
                    id="cr-email"
                    dir="ltr"
                    aria-invalid="false"
                    aria-errormessage="cr-email-warning"
                    placeholder="instructor@example.com"
                    minlength="1"
                    required
                  />
                  <small class="form-text text-muted">
                    لطفاً از ایمیل معتبر و رسمی سازمانی خود استفاده فرمایید.
                  </small>
                  <div
                    class="d-none alert alert-warning mt-2 mb-0"
                    id="cr-email-warning"
                    role="alert"
                  >
                    این ایمیل مشابه ایمیل سازمانی به نظر نمی‌رسد. لطفاً از ایمیل معتبر رسمی استفاده فرمایید.
                  </div>
                </div>
              </div>
            `
          : html`
              <div class="row">
                <div class="mb-3 col-md-6">
                  <label class="form-label" for="cr-institution">موسسه / مرکز آموزشی</label>
                  <input
                    type="text"
                    class="form-control"
                    name="cr-institution"
                    id="cr-institution"
                    disabled
                    value="${institutionName}"
                  />
                  <small class="form-text text-muted">
                    بر اساس حساب کاربری وارد شده شما در سامانه تنظیم شده است.
                  </small>
                </div>
                <div class="mb-3 col-md-6">
                  <label class="form-label" for="cr-email">ایمیل سازمانی / رسمی</label>
                  <input
                    type="text"
                    class="form-control"
                    name="cr-email"
                    id="cr-email"
                    dir="ltr"
                    disabled
                    value="${userEmail ?? 'Unavailable'}"
                  />
                </div>
              </div>
            `
      }
      <hr class="my-3" />
      <h2 class="h5 mb-3">مشخصات درس یا دوره پیشنهادی</h2>
      <div class="mb-3">
        <label class="form-label" for="cr-shortname">کد یا نام اختصاری دوره (Course Rubric and Number)</label>
        <input
          type="text"
          class="form-control"
          name="cr-shortname"
          id="cr-shortname"
          aria-invalid="false"
          placeholder="CS 101"
          dir="ltr"
          pattern="[a-zA-Z]+ [a-zA-Z0-9]+"
          required
        />
        <small class="form-text text-muted">
          ساختار استاندارد: حروف بزرگ لاتین به همراه فاصله و شماره دوره (مانند CS 101 یا MATH 240).
        </small>
        <div class="d-none alert alert-danger mt-2 mb-0" id="cr-shortname-owned" role="alert">
          شما در حال حاضر دسترسی به درسی با این کد را دارید. اگر می‌خواهید دوره جدیدی ارائه دهید، نیازی به ثبت درخواست دوره جدید نیست.
        </div>
        <div class="d-none alert alert-warning mt-2 mb-0" id="cr-shortname-exists" role="alert">
          دوره‌ای با این کد قبلاً در این مرکز ثبت شده است. در صورت تمایل می‌توانید با مدرس آن دوره جهت اشتراک‌گذاری سوالات ارتباط بگیرید.
        </div>
      </div>
      <div class="mb-3">
        <label class="form-label" for="cr-title">عنوان کامل و رسمی درس یا دوره</label>
        <input
          type="text"
          class="form-control"
          name="cr-title"
          id="cr-title"
          aria-invalid="false"
          placeholder="مثال: مبانی برنامه‌نویسی پایتون، ریاضیات یا طراحی سیستم"
          minlength="1"
          maxlength="75"
          required
        />
        <small class="form-text text-muted">
          عنوان کامل دوره یا درس آموزشی.
        </small>
      </div>
      <div class="mb-3">
        <label class="form-label" for="cr-ghuser">نام کاربری گیت‌هاب (اختیاری جهت همگام‌سازی سوالات)</label>
        <input
          type="text"
          class="form-control"
          name="cr-ghuser"
          id="cr-ghuser"
          dir="ltr"
          placeholder="username"
          maxlength="${GITHUB_USERNAME_MAX_LENGTH}"
          pattern="${GITHUB_USERNAME_PATTERN}"
          title="${GITHUB_USERNAME_VALIDATION_MESSAGE}"
          aria-describedby="cr-ghuser-help"
        />
        <small class="form-text text-muted" id="cr-ghuser-help">
          در صورت ارائه نام کاربری گیت‌هاب، دسترسی به مخزن سوالات و کدهای درس برای شما فعال خواهد شد تا بتوانید در سیستم شخصی خود نیز سوالات را طراحی و همگام‌سازی نمایید.
        </small>
      </div>
      <hr class="my-3" />
      <h2 class="h5 mb-3">اطلاعات تکمیلی درخواست</h2>
      <div class="mb-3">
        <label class="form-label" id="cr-referral-source-label" for="cr-referral-source">
          نحوه آشنایی با سامانه ارزیابی هوشمند
        </label>
        <select
          class="form-select"
          name="cr-referral-source"
          id="cr-referral-source"
          aria-labelledby="cr-referral-source-label"
          required
        >
          <option value="" disabled selected>انتخاب نمایید...</option>
          <option value="I've used PrairieLearn before">قبلاً در سایر دوره‌ها یا مراکز آموزشی استفاده کرده‌ام</option>
          <option value="Word of mouth">توصیه سایر مدرسان، همکاران یا اساتید</option>
          <option value="Web search">معرفی در اینترنت و موتورهای جستجو</option>
          <option value="Conference or workshop">کارگاه‌ها، وبینارها و رویدادهای آموزشی</option>
          <option value="Publication">مقالات و پژوهش‌های آموزش نوین و ارزیابی</option>
          <option value="other">سایر موارد...</option>
        </select>
        <input
          type="text"
          class="form-control mt-2 d-none"
          name="cr-referral-source-other"
          id="cr-referral-source-other"
          aria-labelledby="cr-referral-source-label"
          placeholder="شرح مختصر..."
        />
      </div>
      <div class="mb-3">
        <label class="form-label" for="role-instructor">نقش شما در این دوره</label>
        <ul class="list-group">
          <li class="list-group-item">
            <input type="radio" id="role-instructor" name="cr-role" value="instructor" />
            <label for="role-instructor" class="mb-0 form-check-label ms-2">
              مدرس / استاد اصلی دوره (Instructor)
            </label>
          </li>
          <li class="list-group-item">
            <input type="radio" id="role-ta" name="cr-role" value="ta" />
            <label for="role-ta" class="mb-0 form-check-label ms-2">
              دستیار آموزشی یا همکار تدریس (TA)
            </label>
          </li>
          <li class="list-group-item">
            <input type="radio" id="role-admin" name="cr-role" value="admin" />
            <label for="role-admin" class="mb-0 form-check-label ms-2">
              مدیر آموزش یا کارشناس مرکز
            </label>
          </li>
          <li class="list-group-item">
            <input type="radio" id="role-student" name="cr-role" value="student" />
            <label for="role-student" class="mb-0 form-check-label ms-2">دانشجو / فراگیر</label>
          </li>
        </ul>
        <div
          class="d-none role-comment role-comment-ta role-comment-admin alert alert-warning mt-3 mb-0"
          role="alert"
        >
          <strong>درخواست ایجاد دوره جدید باید توسط مدرس اصلی دوره تایید گردد.</strong> لطفاً از مدرس دوره بخواهید این فرم را ثبت نماید.
        </div>
        <div
          class="d-none role-comment role-comment-student alert alert-warning mt-3 mb-0"
          role="alert"
        >
          <strong>این فرم مختص مدرسان و برگزارکنندگان است.</strong> لطفاً جهت دسترسی به آزمون‌ها و محتوا، از مدرس دوره کد ورود را دریافت فرمایید.
        </div>
      </div>
      <input type="hidden" name="__csrf_token" value="${csrfToken}" />
      <button class="btn btn-primary" type="submit" disabled>ثبت نهایی درخواست دوره</button>
    </form>
  `;
}

function ApprovalStatusIcon({ status }: { status: CourseRequest['approved_status'] }) {
  switch (status) {
    case 'pending':
    case 'creating':
    case 'failed':
      return html`<span class="badge text-bg-secondary">
        <i class="fa fa-clock me-1"></i> در انتظار بررسی</span
      >`;
    case 'approved':
      return html`<span class="badge text-bg-success"> <i class="fa fa-check me-1"></i> تایید شده</span>`;
    case 'denied':
      return html`<span class="badge text-bg-danger"><i class="fa fa-times me-1"></i> رد شده</span>`;
    default:
      assertNever(status);
  }
}
