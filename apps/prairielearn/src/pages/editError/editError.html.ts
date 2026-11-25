import { html } from '@prairielearn/html';

import { JobSequenceResultsHtml } from '../../components/JobSequenceResults.html.js';
import { PageLayout } from '../../components/PageLayout.js';
import { config } from '../../lib/config.js';
import type { EditOutcome } from '../../lib/editors.js';
import type { ResLocalsForPage } from '../../lib/res-locals.js';
import type { JobSequenceWithTokens } from '../../lib/server-jobs.types.js';

export function EditError({
  resLocals,
  jobSequence,
  outcome,
}: {
  resLocals: ResLocalsForPage<'course' | 'course-instance'>;
  jobSequence: JobSequenceWithTokens;
  outcome: EditOutcome;
}) {
  const { course, __csrf_token } = resLocals;
  const isWarning = outcome === 'sync_json_errors';

  return PageLayout({
    resLocals,
    pageTitle: 'خطای ویرایش',
    navContext: {
      type: 'plain',
      page: 'error',
    },
    headContent: html`
      <script type="module">
        // This script has type="module" so it's deferred until after the DOM is loaded.
        const button = document.getElementById('job-sequence-results-button');
        const results = document.getElementById('job-sequence-results');
        results.addEventListener('show.bs.collapse', () => {
          button.textContent = 'مخفی کردن جزئیات';
        });
        results.addEventListener('hide.bs.collapse', () => {
          button.textContent = 'نمایش جزئیات';
        });
      </script>
    `,
    content: html`
      <div class="card mb-4">
        <div
          class="card-header ${
            isWarning ? 'bg-warning' : 'bg-danger text-white'
          } d-flex align-items-center"
        >
          <h1>${isWarning ? 'هشدار ویرایش' : 'خطای ویرایش'}</h1>
          <button
            type="button"
            class="btn btn-light btn-sm ms-auto"
            data-bs-toggle="collapse"
            data-bs-target="#job-sequence-results"
            id="job-sequence-results-button"
          >
            نمایش جزئیات
          </button>
        </div>
        <div class="card-body">
          ${
            outcome === 'sync_json_errors'
              ? html`
                  <p>
                    تغییرات شما ذخیره شد${
                      config.fileEditorUseGit ? ' و به مخزن گیت‌هاب ارسال گردید' : ''
                    }، اما برخی از بخش‌های محتوای درس دارای خطا هستند که مانع همگام‌سازی صحیح شدند.
                    این موضوع ممکن است ناشی از ویرایش فعلی شما یا خطاهای از پیش موجود در سایر فایل‌ها باشد.
                  </p>
                `
              : html`
                  <p>ویرایش فایل با موفقیت به پایان نرسید.</p>
                  ${
                    outcome === 'sync_failed'
                      ? html`
                          <p>
                            به طور مشخص، تغییرات شما روی دیسک ذخیره شده${
                              config.fileEditorUseGit
                                ? ' و به مخزن گیت‌هاب ارسال گردیده است'
                                : ' است'
                            }، اما همگام‌سازی این تغییرات با پایگاه‌داده ناموفق بود. محتمل‌ترین علت،
                            وجود خطا در محتوای درس است. لطفاً محتوا را اصلاح کرده و سپس روی
                            <strong>دریافت از مخزن گیت‌هاب</strong> کلیک کنید تا دوباره تلاش شود.
                          </p>
                          <form method="POST">
                            <input type="hidden" name="__csrf_token" value="${__csrf_token}" />
                            <div class="mx-4">
                              <button name="__action" value="pull" class="btn btn-primary">
                                دریافت از مخزن گیت‌هاب
                              </button>
                            </div>
                          </form>
                        `
                      : html`<p>لطفاً به صفحه قبل بازگردید و دوباره تلاش کنید.</p>`
                  }
                `
          }
        </div>
      </div>

      <div class="collapse" id="job-sequence-results">
        ${JobSequenceResultsHtml({ course, jobSequence })}
      </div>
    `,
  });
}
