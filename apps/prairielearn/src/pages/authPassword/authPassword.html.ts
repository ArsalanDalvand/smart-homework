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
    options: {
      studentSurface: true,
    },
    content: html`
      <div class="mx-auto my-4" style="max-width: 440px;">
        <div class="card border shadow-sm rounded-4 overflow-hidden">
          <div class="card-body p-4">
            <div class="text-center mb-3">
              <div
                class="bg-primary-subtle text-primary rounded-circle d-inline-flex align-items-center justify-content-center mb-2"
                style="width: 52px; height: 52px;"
              >
                <i class="bi bi-shield-lock-fill fs-3" aria-hidden="true"></i>
              </div>
              <h1 class="h5 fw-bold mb-1">رمز عبور آزمون</h1>
              <p class="text-body-secondary small mb-0">
                برای دسترسی به این آزمون، وارد کردن رمز عبور الزامی است.
              </p>
            </div>

            ${
              passwordInvalid
                ? html`
                    <div
                      class="alert alert-danger py-2 px-3 small text-center d-flex align-items-center justify-content-center gap-2 mb-3"
                      role="alert"
                    >
                      <i class="bi bi-exclamation-circle-fill" aria-hidden="true"></i>
                      <span>رمز عبور قبلی نامعتبر یا منقضی شده است. لطفاً دوباره تلاش کنید.</span>
                    </div>
                  `
                : ''
            }

            <form method="POST">
              <input type="hidden" name="__csrf_token" value="${resLocals.__csrf_token}" />
              <div class="mb-3">
                <label class="form-label fw-semibold" for="password">رمز عبور</label>
                <input
                  type="password"
                  class="form-control"
                  dir="ltr"
                  id="password"
                  name="password"
                  autocomplete="off"
                  required
                />
              </div>
              <button type="submit" class="btn btn-primary w-100 py-2 fw-semibold">
                <i class="bi bi-unlock-fill me-1" aria-hidden="true"></i>
                تایید و ورود به آزمون
              </button>
            </form>
          </div>
        </div>
      </div>
    `,
  });
}
