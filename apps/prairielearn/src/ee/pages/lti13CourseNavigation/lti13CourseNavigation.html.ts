import { html } from '@prairielearn/html';

import { Modal } from '../../../components/Modal.js';
import { PageLayout } from '../../../components/PageLayout.js';
import { type Course } from '../../../lib/db-types.js';
import type { ResLocalsForPage } from '../../../lib/res-locals.js';
import { STUDENT_ROLE } from '../../lib/lti13-memberships.js';

export function Lti13CourseNavigationInstructor({
  courseName,
  resLocals,
  courses,
  lti13_instance_id,
}: {
  courseName: string;
  resLocals: ResLocalsForPage<'plain'>;
  courses: Course[];
  lti13_instance_id: string;
}): string {
  return PageLayout({
    resLocals,
    pageTitle: 'LTI 1.3 - درس',
    navContext: { type: 'plain', page: 'lti13_course_navigation' },
    content: html`
      ${TerminologyModal()}
      <h1>به سامانه خوش آمدید</h1>
      <p>
        برای تکمیل یکپارچه‌سازی درس خود، باید
        <strong>${courseName}</strong> را به یک ارائه درس در سامانه متصل کنید.
      </p>

      ${
        courses.length === 0
          ? html`<p>
              <strong>
                شما در هیچ درسی دسترسی مالک یا ویرایشگر ندارید.
              </strong>
            </p>`
          : html`
              <div class="mb-3">
                <form method="POST" id="link_form">
                  <input type="hidden" name="__csrf_token" value="${resLocals.__csrf_token}" />

                  <label class="form-label" for="connect_course">
                    یک درس در سامانه انتخاب کنید:
                  </label>
                  <select
                    id="connect_course"
                    class="form-select mb-3"
                    name="unsafe_course_id"
                    hx-get="/pl/lti13_instance/${lti13_instance_id}/course_navigation/course_instances"
                    hx-include="#link_form"
                    hx-target="#course_instances"
                    required
                  >
                    <option selected disabled value="">برای ادامه یک درس انتخاب کنید</option>
                    ${courses.map((c) => {
                      return html`<option value="${c.id}">${c.short_name}: ${c.title}</option>`;
                    })}
                  </select>
                  <label class="form-label" for="course_instances">
                    یک ارائه درس برای اتصال انتخاب کنید:
                  </label>
                  <select
                    id="course_instances"
                    name="unsafe_course_instance_id"
                    class="form-select mb-3"
                    required
                  >
                    <option selected disabled value="">ابتدا درس را انتخاب کنید</option>
                  </select>
                  <button type="submit" class="btn btn-primary">اتصال ارائه درس</button>
                </form>
              </div>
            `
      }

      <p>
        <details>
          <summary>چرا درس یا ارائه‌های درس من اینجا نمایش داده نمی‌شوند؟</summary>
          <p>
            برای اتصال درس باید دسترسی <strong>ویرایشگر (Editor)</strong> درس و دسترسی <strong>ویرایشگر داده‌های دانشجو (Student Data Editor)</strong> ارائه درس را داشته باشید.
          </p>
        </details>
      </p>
      <p>
        اگر به یک درس جدید نیاز دارید،
        <a href="/pl/request_course">از اینجا درخواست دهید</a>.
      </p>

      <p>
        اگر به ارائه درس جدیدی نیاز دارید، ابتدا آن را در سامانه ایجاد کنید و سپس دوباره به این صفحه برگردید.
      </p>
      <button
        type="button"
        class="btn btn-link"
        data-bs-toggle="modal"
        data-bs-target="#terminology-modal"
      >
        تازه‌وارد هستید؟ با اصطلاحات سامانه آشنا شوید
      </button>
    `,
  });
}

export function Lti13CourseNavigationNotReady({
  courseName,
  resLocals,
  ltiRoles,
}: {
  courseName: string;
  resLocals: ResLocalsForPage<'plain'>;
  ltiRoles: string[];
}): string {
  return PageLayout({
    resLocals,
    pageTitle: 'LTI 1.3 - درس',
    navContext: { type: 'student', page: 'lti13_course_navigation' },
    content: html`
      <h1 class="h1">به سامانه خوش آمدید</h1>
      <h2 class="h2">... اما درس شما هنوز آماده نیست!</h2>

      <p>مدرس هنوز درس ${courseName} را در سامانه پیکربندی نکرده است.</p>
      <p>لطفاً بعداً دوباره مراجعه کنید.</p>
      <p>
        <a href="/pl" class="btn btn-primary">
          <i class="fa fa-home" aria-hidden="true"></i>
          صفحه اصلی سامانه
        </a>
      </p>
      ${
        ltiRoles.includes(STUDENT_ROLE)
          ? ''
          : html`
              <div class="card">
                <div class="card-header bg-info">اطلاعات اشکال‌زدایی</div>
                <div class="card-body">
                  <p>
                    شما مجوز لازم برای یکپارچه‌سازی ارائه‌های درس را ندارید. برای انجام این کار نقش مدرس یا طراح (و نه دستیار آموزشی) در LMS مورد نیاز است.
                  </p>
                  <p>نقش‌های شما که از LMS دریافت شده است:</p>
                  <ul class="mb-0">
                    ${ltiRoles.map((role) => html`<li><code>${role}</code></li>`)}
                  </ul>
                </div>
              </div>
            `
      }
    `,
  });
}

export function Lti13CourseNavigationDone({
  resLocals,
  lti13_instance_id,
}: {
  resLocals: ResLocalsForPage<'plain'>;
  lti13_instance_id: string;
}): string {
  return PageLayout({
    resLocals,
    pageTitle: 'LTI 1.3 - درس',
    navContext: { type: 'plain', page: 'lti13_course_navigation' },
    content: html`
      <h1 class="h1">به سامانه خوش آمدید</h1>

      <p>
        <strong>همه‌چیز آماده است.</strong> دفعه بعد که شما یا دانشجویان روی پیوند در LMS کلیک کنید، مستقیماً به ارائه درس در سامانه هدایت خواهید شد.
      </p>

      <div class="alert alert-warning">
        قوانین دسترسی (<code>allowAccess</code>) ارائه درس و آزمون‌ها همچنان اعمال می‌شوند و ممکن است نیاز به پیکربندی داشته باشند.
      </div>

      <p>برای تغییر این اتصال، به صفحه LTI 1.3 ارائه درس خود بروید.</p>

      <p>
        <a href="/pl/lti13_instance/${lti13_instance_id}/course_navigation" class="btn btn-primary">
          ادامه به ارائه درس
        </a>
      </p>
    `,
  });
}

function TerminologyModal() {
  return Modal({
    id: 'terminology-modal',
    title: 'آشنایی با مفاهیم سامانه',
    body: html`
      <p>
        در سامانه، یک <strong>درس (Course)</strong> مجموعه‌ای از سوالات و ارائه‌های درس است و دربرگیرنده اجراهای مختلف یک درس در ترم‌های گوناگون است. مواردی که در طول چند ترم مشترک هستند در سطح درس قرار می‌گیرند.
      </p>

      <p>
        یک <strong>ارائه درس (Course instance)</strong> اجرای مشخصی از یک درس است که شامل آزمون‌ها، ثبت‌نام‌ها، نمرات و غیره می‌شود؛ مانند یک ترم تحصیلی.
      </p>

      <p class="fst-italic">
        مثال: یک درس ممکن است ریاضی ۱۰۱ باشد و ارائه درس آن ریاضی ۱۰۱ پاییز ۱۴۰۲ باشد.
      </p>

      <p>
        برای اطلاعات بیشتر،
        <a href="https://docs.prairielearn.com/" target="_blank" rel="noreferrer"
          >راهنمای کاربری سامانه</a
        > را مشاهده کنید.
      </p>
    `,
  });
}
