import { html } from '@prairielearn/html';

import { PageLayout } from '../../../components/PageLayout.js';
import { type User } from '../../../lib/db-types.js';
import type { UntypedResLocals } from '../../../lib/res-locals.types.js';

export function Terms({ user, resLocals }: { user: User; resLocals: UntypedResLocals }) {
  return PageLayout({
    resLocals,
    pageTitle: 'شرایط و ضوابط',
    navContext: {
      type: 'plain',
      page: 'home',
    },
    content: html`
      <h1>شرایط و ضوابط</h1>
      ${
        user.terms_accepted_at
          ? html`
              <p>
                شما پیش‌تر آخرین نسخه
                <a href="https://www.prairielearn.com/legal/terms">شرایط استفاده از خدمات</a> و
                <a href="https://www.prairielearn.com/legal/privacy">سیاست حفظ حریم خصوصی</a> را پذیرفته‌اید.
              </p>
              <a href="/" class="btn btn-primary">ادامه به سامانه</a>
            `
          : html`
              <p>
                برای ادامه، لطفاً آخرین نسخه
                <a href="https://www.prairielearn.com/legal/terms">شرایط استفاده از خدمات</a> و
                <a href="https://www.prairielearn.com/legal/privacy">سیاست حفظ حریم خصوصی</a> را بپذیرید.
              </p>
              <form method="POST">
                <input type="hidden" name="__csrf_token" value="${resLocals.__csrf_token}" />
                <button type="submit" class="btn btn-primary" name="__action" value="accept_terms">
                  پذیرش و ادامه
                </button>
              </form>
            `
      }
    `,
  });
}
