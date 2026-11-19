import { formatDate } from '@prairielearn/formatter';
import { html } from '@prairielearn/html';

import { PageLayout } from '../../components/PageLayout.js';
import { config } from '../../lib/config.js';
import { type NewsItem } from '../../lib/db-types.js';
import { isEnterprise } from '../../lib/license.js';
import type { ResLocalsForPage } from '../../lib/res-locals.js';

export function AdministratorSettings({
  resLocals,
  newsItems,
}: {
  resLocals: ResLocalsForPage<'plain'>;
  newsItems: NewsItem[];
}) {
  const showAiSettings =
    isEnterprise() &&
    config.aiQuestionGenerationOpenAiApiKey &&
    config.aiQuestionGenerationOpenAiOrganization;

  return PageLayout({
    resLocals,
    pageTitle: 'Administrator Settings',
    navContext: {
      type: 'administrator',
      page: 'admin',
      subPage: 'settings',
    },
    options: {
      fullWidth: true,
    },
    headContent: html`
      <script type="module">
        // This script has type="module" so it's deferred until after the DOM is loaded.
        const invalidateButton = document.getElementById('invalidate-render-cache');
        const confirmInvalidateContainer = document.getElementById(
          'confirm-invalidate-cache-container',
        );
        const cancelInvalidateButton = document.getElementById('cancel-invalidate-render-cache');
        invalidateButton.addEventListener('click', () => {
          confirmInvalidateContainer.classList.remove('d-none');
          invalidateButton.classList.add('d-none');
        });
        cancelInvalidateButton.addEventListener('click', () => {
          invalidateButton.classList.remove('d-none');
          confirmInvalidateContainer.classList.add('d-none');
        });
      </script>
    `,
    content: html`
      <h1 class="visually-hidden">تنظیمات سرور و کش سامانه</h1>
      <!-- Chunk generation -->
      <div class="card mb-4" style="font-family: var(--font-persian);">
        <div class="card-header bg-primary text-white d-flex align-items-center">
          <h2 class="h5 mb-0">تولید بسته‌ها و چانک‌های استاتیک</h2>
        </div>
        <div class="card-body">
          <form name="generate_chunks_form" method="POST">
            <input type="hidden" name="__action" value="generate_chunks" />
            <input type="hidden" name="__csrf_token" value="${resLocals.__csrf_token}" />
            <div class="mb-3">
              <label class="form-label" for="generateChunksCourseIds">شناسه درس‌ها (Course IDs):</label>
              <input
                type="text"
                class="form-control"
                id="generateChunksCourseIds"
                name="course_ids"
                placeholder="1,2,3"
                dir="ltr"
              />
            </div>
            <button type="submit" class="btn btn-primary">تولید مجدد چانک‌ها</button>
          </form>
        </div>
      </div>

      <!-- Actions -->
      <div class="card mb-4" style="font-family: var(--font-persian);">
        <div class="card-header bg-primary text-white">
          <h2 class="h5 mb-0">عملیات مدیریت سیستم</h2>
        </div>
        <div class="card-body">
          <form name="invalidate-question-cache-form" method="POST">
            <input type="hidden" name="__action" value="invalidate_question_cache" />
            <input type="hidden" name="__csrf_token" value="${resLocals.__csrf_token}" />
            <button id="invalidate-render-cache" type="button" class="btn btn-danger">
              پاک‌سازی حافظه کش رندر سوالات
            </button>
            <div id="confirm-invalidate-cache-container" class="confirm-invalidate-cache d-none mt-2">
              <button id="confirm-invalidate-render-cache" type="submit" class="btn btn-danger me-2">
                تایید پاک‌سازی کش
              </button>
              <button id="cancel-invalidate-render-cache" type="button" class="btn btn-secondary">
                انصراف
              </button>
            </div>
          </form>
          ${
            config.newsFeedUrl
              ? html`
                  <hr />
                  <form method="POST" class="d-inline">
                    <input type="hidden" name="__action" value="sync_news_feed" />
                    <input type="hidden" name="__csrf_token" value="${resLocals.__csrf_token}" />
                    <button type="submit" class="btn btn-primary">همگام‌سازی اخبار</button>
                  </form>
                `
              : ''
          }
        </div>
      </div>

      ${
        newsItems.length > 0
          ? html`
              <div class="card mb-4" style="font-family: var(--font-persian);">
                <div class="card-header bg-primary text-white d-flex align-items-center">
                  <h2 class="h5 mb-0">اخبار و اطلاعیه‌های سیستم</h2>
                </div>
                <div class="table-responsive">
                  <table class="table table-sm table-hover table-striped" aria-label="اخبار سیستم">
                    <thead>
                      <tr>
                        <th>عنوان</th>
                        <th>تاریخ انتشار</th>
                        <th>وضعیت</th>
                        <th>عملیات</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${newsItems.map(
                        (item) => html`
                          <tr>
                            <td class="align-middle">
                              <a href="${item.link}" target="_blank" rel="noopener noreferrer">
                                ${item.title}
                              </a>
                            </td>
                            <td class="align-middle">${formatDate(item.pub_date, 'UTC')}</td>
                            <td class="align-middle">
                              ${
                                item.managed_by === 'admin' && item.hidden_at != null
                                  ? html`<span class="badge bg-secondary">پنهان توسط مدیر</span>`
                                  : item.managed_by === 'sync' && item.hidden_at != null
                                    ? html`<span class="badge bg-secondary">پنهان توسط سیستم</span>`
                                    : html`<span class="badge bg-success">نمایان</span>`
                              }
                            </td>
                            <td class="align-middle">
                              ${
                                item.hidden_at == null
                                  ? html`
                                      <form method="POST" class="d-inline">
                                        <input
                                          type="hidden"
                                          name="__action"
                                          value="hide_news_item"
                                        />
                                        <input
                                          type="hidden"
                                          name="__csrf_token"
                                          value="${resLocals.__csrf_token}"
                                        />
                                        <input
                                          type="hidden"
                                          name="news_item_id"
                                          value="${item.id}"
                                        />
                                        <button type="submit" class="btn btn-sm btn-outline-danger">
                                          پنهان‌سازی
                                        </button>
                                      </form>
                                    `
                                  : html`
                                      <form method="POST" class="d-inline">
                                        <input
                                          type="hidden"
                                          name="__action"
                                          value="unhide_news_item"
                                        />
                                        <input
                                          type="hidden"
                                          name="__csrf_token"
                                          value="${resLocals.__csrf_token}"
                                        />
                                        <input
                                          type="hidden"
                                          name="news_item_id"
                                          value="${item.id}"
                                        />
                                        <button
                                          type="submit"
                                          class="btn btn-sm btn-outline-secondary"
                                        >
                                          نمایش مجدد
                                        </button>
                                      </form>
                                    `
                              }
                            </td>
                          </tr>
                        `,
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            `
          : ''
      }
      ${
        showAiSettings
          ? html`
              <div class="card mb-4" style="font-family: var(--font-persian);">
                <div class="card-header bg-primary text-white">
                  <h2 class="h5 mb-0">مدل‌های زبانی هوش مصنوعی (LLM)</h2>
                </div>
                <div class="card-body">
                  <form method="POST">
                    <input type="hidden" name="__csrf_token" value="${resLocals.__csrf_token}" />
                    <button class="btn btn-primary" name="__action" value="sync_context_documents">
                      همگام‌سازی مجدد مستندات کانتکست
                    </button>

                    ${
                      config.devMode
                        ? html`
                            <hr />
                            <p class="text-muted">
                              آزمون هوش مصنوعی با تولید سوالات نمونه از پرامپت‌ها و سنجش کیفیت آن‌ها توسط مدل زبانی و مقایسه با استانداردهای مرجع انجام می‌پذیرد.
                            </p>
                            <button
                              class="btn btn-primary"
                              name="__action"
                              value="benchmark_question_generation"
                            >
                              آزمون و ارزیابی کیفیت تولید هوشمند سوال
                            </button>
                          `
                        : ''
                    }
                  </form>
                </div>
              </div>
            `
          : ''
      }

      <div class="card mb-4" style="font-family: var(--font-persian);" dir="rtl">
        <div class="card-header bg-primary text-white">
          <h2 class="h5 mb-0">محیط آزمون استایل‌ها و رنگ‌های سیستم</h2>
        </div>
        <div class="card-body">
          <p class="text-muted">
            این بخش جهت بررسی استایل‌های فوکوس، تضاد رنگی و انطباق با استانداردهای دسترسی‌پذیری رابط کاربری طراحی شده است.
          </p>
          <div class="mb-4" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
            <button type="button" class="btn btn-primary">اصلی (Primary)</button>
            <button type="button" class="btn btn-secondary">ثانویه (Secondary)</button>
            <button type="button" class="btn btn-success">موفقیت (Success)</button>
            <button type="button" class="btn btn-danger">خطر (Danger)</button>
            <button type="button" class="btn btn-warning">هشدار (Warning)</button>
            <button type="button" class="btn btn-info">اطلاعات (Info)</button>
            <button type="button" class="btn btn-light">روشن (Light)</button>
            <button type="button" class="btn btn-med-light">روشن میانه</button>
            <button type="button" class="btn btn-dark">تیره (Dark)</button>
            <button type="button" class="btn btn-link">پیوند (Link)</button>
          </div>
          <div class="mb-4" style="display: grid; grid-template-columns: 1fr 1fr; gap: 1rem;">
            <button type="button" class="btn btn-outline-primary">اصلی (Outline)</button>
            <button type="button" class="btn btn-outline-secondary">ثانویه (Outline)</button>
            <button type="button" class="btn btn-outline-success">موفقیت (Outline)</button>
            <button type="button" class="btn btn-outline-danger">خطر (Outline)</button>
            <button type="button" class="btn btn-outline-warning">هشدار (Outline)</button>
            <button type="button" class="btn btn-outline-info">اطلاعات (Outline)</button>
            <button type="button" class="btn btn-outline-dark">تیره (Outline)</button>
          </div>
          <div class="mb-4 p-4 bg-dark rounded">
            <button type="button" class="btn btn-outline-light">روشن روی تیره (Light)</button>
          </div>
          <h3>نشان‌های رنگی سفارشی</h3>
          <div class="mb-4 d-flex flex-wrap gap-2">
            <span class="badge color-red1">قرمز ۱</span>
            <span class="badge color-red2">قرمز ۲</span>
            <span class="badge color-red3">قرمز ۳</span>
            <span class="badge color-pink1">صورتی ۱</span>
            <span class="badge color-pink2">صورتی ۲</span>
            <span class="badge color-pink3">صورتی ۳</span>
            <span class="badge color-purple1">بنفش ۱</span>
            <span class="badge color-purple2">بنفش ۲</span>
            <span class="badge color-purple3">بنفش ۳</span>
            <span class="badge color-blue1">آبی ۱</span>
            <span class="badge color-blue2">آبی ۲</span>
            <span class="badge color-blue3">آبی ۳</span>
            <span class="badge color-turquoise1">فیروزه‌ای ۱</span>
            <span class="badge color-turquoise2">فیروزه‌ای ۲</span>
            <span class="badge color-turquoise3">فیروزه‌ای ۳</span>
            <span class="badge color-green1">سبز ۱</span>
            <span class="badge color-green2">سبز ۲</span>
            <span class="badge color-green3">سبز ۳</span>
            <span class="badge color-yellow1">زرد ۱</span>
            <span class="badge color-yellow2">زرد ۲</span>
            <span class="badge color-yellow3">زرد ۳</span>
            <span class="badge color-orange1">نارنجی ۱</span>
            <span class="badge color-orange2">نارنجی ۲</span>
            <span class="badge color-orange3">نارنجی ۳</span>
            <span class="badge color-brown1">قهوه‌ای ۱</span>
            <span class="badge color-brown2">قهوه‌ای ۲</span>
            <span class="badge color-brown3">قهوه‌ای ۳</span>
            <span class="badge color-gray1">خاکستری ۱</span>
            <span class="badge color-gray2">خاکستری ۲</span>
            <span class="badge color-gray3">خاکستری ۳</span>
          </div>
          <h3>نشان‌های کپسولی رنگی</h3>
          <div class="mb-4 d-flex flex-wrap gap-2">
            <span class="badge rounded-pill color-red1">قرمز ۱</span>
            <span class="badge rounded-pill color-red2">قرمز ۲</span>
            <span class="badge rounded-pill color-red3">قرمز ۳</span>
            <span class="badge rounded-pill color-pink1">صورتی ۱</span>
            <span class="badge rounded-pill color-pink2">صورتی ۲</span>
            <span class="badge rounded-pill color-pink3">صورتی ۳</span>
            <span class="badge rounded-pill color-purple1">بنفش ۱</span>
            <span class="badge rounded-pill color-purple2">بنفش ۲</span>
            <span class="badge rounded-pill color-purple3">بنفش ۳</span>
            <span class="badge rounded-pill color-blue1">آبی ۱</span>
            <span class="badge rounded-pill color-blue2">آبی ۲</span>
            <span class="badge rounded-pill color-blue3">آبی ۳</span>
            <span class="badge rounded-pill color-turquoise1">فیروزه‌ای ۱</span>
            <span class="badge rounded-pill color-turquoise2">فیروزه‌ای ۲</span>
            <span class="badge rounded-pill color-turquoise3">فیروزه‌ای ۳</span>
            <span class="badge rounded-pill color-green1">سبز ۱</span>
            <span class="badge rounded-pill color-green2">سبز ۲</span>
            <span class="badge rounded-pill color-green3">سبز ۳</span>
            <span class="badge rounded-pill color-yellow1">زرد ۱</span>
            <span class="badge rounded-pill color-yellow2">زرد ۲</span>
            <span class="badge rounded-pill color-yellow3">زرد ۳</span>
            <span class="badge rounded-pill color-orange1">نارنجی ۱</span>
            <span class="badge rounded-pill color-orange2">نارنجی ۲</span>
            <span class="badge rounded-pill color-orange3">نارنجی ۳</span>
            <span class="badge rounded-pill color-brown1">قهوه‌ای ۱</span>
            <span class="badge rounded-pill color-brown2">قهوه‌ای ۲</span>
            <span class="badge rounded-pill color-brown3">قهوه‌ای ۳</span>
            <span class="badge rounded-pill color-gray1">خاکستری ۱</span>
            <span class="badge rounded-pill color-gray2">خاکستری ۲</span>
            <span class="badge rounded-pill color-gray3">خاکستری ۳</span>
          </div>
          <h3>نشان‌های دکمه‌ای قابل کلیک</h3>
          <div class="mb-4 d-flex flex-wrap gap-2">
            <button type="button" class="btn btn-badge color-red1">قرمز ۱</button>
            <button type="button" class="btn btn-badge color-red2">قرمز ۲</button>
            <button type="button" class="btn btn-badge color-red3">قرمز ۳</button>
            <button type="button" class="btn btn-badge color-pink1">صورتی ۱</button>
            <button type="button" class="btn btn-badge color-pink2">صورتی ۲</button>
            <button type="button" class="btn btn-badge color-pink3">صورتی ۳</button>
            <button type="button" class="btn btn-badge color-purple1">بنفش ۱</button>
            <button type="button" class="btn btn-badge color-purple2">بنفش ۲</button>
            <button type="button" class="btn btn-badge color-purple3">بنفش ۳</button>
            <button type="button" class="btn btn-badge color-blue1">آبی ۱</button>
            <button type="button" class="btn btn-badge color-blue2">آبی ۲</button>
            <button type="button" class="btn btn-badge color-blue3">آبی ۳</button>
            <button type="button" class="btn btn-badge color-turquoise1">فیروزه‌ای ۱</button>
            <button type="button" class="btn btn-badge color-turquoise2">فیروزه‌ای ۲</button>
            <button type="button" class="btn btn-badge color-turquoise3">فیروزه‌ای ۳</button>
            <button type="button" class="btn btn-badge color-green1">سبز ۱</button>
            <button type="button" class="btn btn-badge color-green2">سبز ۲</button>
            <button type="button" class="btn btn-badge color-green3">سبز ۳</button>
            <button type="button" class="btn btn-badge color-yellow1">زرد ۱</button>
            <button type="button" class="btn btn-badge color-yellow2">زرد ۲</button>
            <button type="button" class="btn btn-badge color-yellow3">زرد ۳</button>
            <button type="button" class="btn btn-badge color-orange1">نارنجی ۱</button>
            <button type="button" class="btn btn-badge color-orange2">نارنجی ۲</button>
            <button type="button" class="btn btn-badge color-orange3">نارنجی ۳</button>
            <button type="button" class="btn btn-badge color-brown1">قهوه‌ای ۱</button>
            <button type="button" class="btn btn-badge color-brown2">قهوه‌ای ۲</button>
            <button type="button" class="btn btn-badge color-brown3">قهوه‌ای ۳</button>
            <button type="button" class="btn btn-badge color-gray1">خاکستری ۱</button>
            <button type="button" class="btn btn-badge color-gray2">خاکستری ۲</button>
            <button type="button" class="btn btn-badge color-gray3">خاکستری ۳</button>
          </div>
          <h3>دکمه‌های شفاف (Ghost Button)</h3>
          <p class="text-muted">
            این سبک دکمه برای مواردی کاربرد دارد که وزن بصری کمتری نسبت به دکمه‌های معمولی مدنظر است، مانند تریگرهای پاپ‌اور و منوها.
          </p>
          <div>
            <button type="button" class="btn btn-xs btn-ghost">بسیار کوچک</button>
            <button type="button" class="btn btn-sm btn-ghost">کوچک</button>
            <button type="button" class="btn btn-ghost">پیش‌فرض</button>
            <button type="button" class="btn btn-lg btn-ghost">بزرگ</button>
          </div>
        </div>
      </div>
    `,
  });
}
