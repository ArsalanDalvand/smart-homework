import { html } from '@prairielearn/html';

import { PageLayout } from '../../components/PageLayout.js';
import type { UntypedResLocals } from '../../lib/res-locals.types.js';

export function AuthPassword({
  resLocals,
  passwordInvalid,
}: {
  resLocals: UntypedResLocals;
  passwordInvalid: boolean;
}) {
  return PageLayout({
    resLocals,
    pageTitle: 'رمز عبور',
    navContext: {
      type: 'plain',
      page: 'password',
    },
    content: html`
      <h1 class="visually-hidden">رمز عبور آزمون</h1>
      <div class="card mb-4">
        <div class="card-body">
          <p class="text-center">برای دسترسی به این آزمون، وارد کردن رمز عبور الزامی است.</p>

          ${
            passwordInvalid
              ? html`
                  <p class="text-center text-danger">
                    رمز عبور قبلی نامعتبر یا منقضی شده است. لطفاً دوباره تلاش کنید.
                  </p>
                `
              : ''
          }

          <form method="POST">
            <input type="hidden" name="__csrf_token" value="${resLocals.__csrf_token}" />
            <div class="mb-3">
              <label class="form-label" for="password">رمز عبور</label>
              <input
                type="password"
                class="form-control"
                id="password"
                name="password"
                autocomplete="off"
                required
              />
            </div>
            <button type="submit" class="btn btn-primary">تایید</button>
          </form>
        </div>
      </div>
    `,
  });
}
