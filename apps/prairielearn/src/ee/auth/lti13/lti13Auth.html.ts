import { html } from '@prairielearn/html';

import { HeadContents } from '../../../components/HeadContents.js';
import { PageLayout } from '../../../components/PageLayout.js';
import { type Lti13Instance } from '../../../lib/db-types.js';
import type { UntypedResLocals } from '../../../lib/res-locals.types.js';

export function Lti13Test({
  resLocals,
  lti13_claims,
  userInfo,
  lti13_instance,
  url,
}: {
  resLocals: UntypedResLocals;
  lti13_claims: Record<string, any>;
  userInfo: {
    uin: string | null;
    uid: string | null;
    name: string | null;
    email: string | null;
  };
  lti13_instance: Lti13Instance;
  url: URL;
}) {
  return html`
    <!doctype html>
    <html lang="en">
      <head>
        ${HeadContents({ resLocals, pageTitle: 'آزمون LTI 1.3' })}
      </head>
      <body>
        <main id="content" class="container mb-4">
          <h1>آزمون احراز هویت LTI 1.3</h1>
          <p>
            پس از اطمینان از صحت تنظیمات، عبارت <code>?test</code> را از انتهای
            <a href="${url.href}">نشانی شروع اتصال OpenID</a>
            حذف کنید تا از این گزارش اشکال‌زدایی عبور کرده و وارد فرآیند احراز هویت شوید.
          </p>
          <h2>نگاشت ادعاهای (Claims) LTI 1.3</h2>
          <p>نگاشت‌های پیکربندی‌شده خروجی زیر را تولید کردند:</p>
          <ul>
            <li><b>شناسه کاربری (UID):</b> ${userInfo.uid} (<code>${lti13_instance.uid_attribute}</code>)</li>
            <li><b>شماره شناسایی (UIN):</b> ${userInfo.uin} (<code>${lti13_instance.uin_attribute}</code>)</li>
            <li><b>نام:</b> ${userInfo.name} (<code>${lti13_instance.name_attribute}</code>)</li>
            <li>
              <b>ایمیل:</b> ${userInfo.email} (<code>${lti13_instance.email_attribute}</code>)
            </li>
          </ul>
          <h2>تمامی ادعاهای LTI 1.3</h2>
          <pre><code>${JSON.stringify(lti13_claims, null, 2)}</code></pre>
        </main>
      </body>
    </html>
  `.toString();
}

export function Lti13AuthIframe({ parameters }: { parameters: Record<string, any> }) {
  return html`
    <!doctype html>
    <html lang="en">
      <head>
        ${HeadContents({ resLocals: {}, pageTitle: 'هدایت LTI 1.3' })}
      </head>
      <body>
        <main id="content" class="m-3">
          <form id="interceptForm" method="POST" action="" target="_blank">
            ${Object.entries(parameters).map(
              ([key, value]) =>
                html`<input type="hidden" name="${key}" value="${String(value)}" />`,
            )}
            <button id="submitButton" class="btn btn-primary mb-2">
              باز کردن سامانه در پنجره جدید
            </button>
          </form>
          <div id="message">در صورت بروز خطا در ورود، این صفحه را بازنشانی (Reload) کنید تا دوباره شروع شود.</div>

          <script>
            const form = document.getElementById('interceptForm');
            const button = document.getElementById('submitButton');
            const messageDiv = document.getElementById('message');

            form.addEventListener('submit', function () {
              button.disabled = true;
              button.textContent = 'سامانه در پنجره جدید باز شد';
              messageDiv.textContent = 'برای دسترسی مجدد به سامانه، این صفحه را بازنشانی کنید.';
            });
          </script>
        </main>
      </body>
    </html>
  `.toString();
}

export function Lti13AuthRequired({
  institution_id,
  resLocals,
}: {
  institution_id: string;
  resLocals: UntypedResLocals;
}) {
  return PageLayout({
    resLocals,
    pageTitle: 'تکمیل ورود به حساب',
    navContext: {
      type: 'plain',
      page: undefined,
    },
    options: {
      hideNavbarSessionControls: true,
      showFooter: true,
    },
    content: html`
      <div class="row justify-content-center py-4">
        <div class="col-md-8 col-lg-6">
          <div class="card shadow-sm">
            <div class="card-body p-4 text-center">
              <h1 class="h3 mb-3">تکمیل ورود به حساب</h1>
              <p class="text-body-secondary mb-4" style="text-wrap: balance;">
                برای تکمیل راه‌اندازی دسترسی خود، یک‌بار وارد شوید. پس از اتمام، به درس خود بازگردانده خواهید شد.
              </p>
              <a class="btn btn-primary" href="/pl/login?institution_id=${institution_id}">
                ادامه برای ورود
              </a>
            </div>
          </div>
        </div>
      </div>
    `,
  });
}
