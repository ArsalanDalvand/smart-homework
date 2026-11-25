import { html } from '@prairielearn/html';

import { PageLayout } from '../../components/PageLayout.js';
import { compiledScriptTag } from '../../lib/assets.js';
import type { UntypedResLocals } from '../../lib/res-locals.types.js';

export function ExternalImageCapture({
  variantId,
  fileName,
  resLocals,
}: {
  variantId: string;
  fileName: string;
  resLocals: UntypedResLocals;
}) {
  return PageLayout({
    resLocals,
    pageTitle: 'ثبت تصویر خارجی',
    navContext: {
      type: 'student',
      page: 'assessment_instance',
    },
    headContent: compiledScriptTag('externalImageCaptureClient.ts'),
    content: html`
      <form
        id="external-image-capture-form"
        method="POST"
        hx-post
        hx-trigger="submit"
        hx-swap="none"
        enctype="multipart/form-data"
        data-variant-id="${variantId}"
        data-variant-token="${resLocals.variantToken}"
        data-file-name="${fileName}"
      >
        <div id="external-image-capture-loading-container" class="d-flex align-items-center gap-2">
          <div class="spinning-wheel spinner-border">
            <span class="visually-hidden">در حال بارگذاری...</span>
          </div>
          <h1 class="d-flex align-items-center my-0">در حال بارگذاری...</h1>
        </div>
        <div
          id="external-image-capture-uploading-container"
          class="d-none align-items-center gap-2"
        >
          <div class="spinning-wheel spinner-border">
            <span class="visually-hidden">در حال بارگذاری فایل...</span>
          </div>
          <h1 class="d-flex align-items-center my-0">در حال ارسال...</h1>
        </div>
        <div id="external-image-capture-success-container" class="d-none">
          <h1 class="d-flex align-items-center gap-2">
            <i class="bi bi-check-circle-fill text-success me-2"></i>
            بارگذاری با موفقیت انجام شد
          </h1>
          <p>اکنون باید تصویر ثبت‌شده خود را در صفحه تکلیف/آزمون مشاهده کنید.</p>
        </div>
        <div id="external-image-capture-connection-failed-container" class="d-none">
          <h1 class="d-flex align-items-center gap-2">
            <i class="bi bi-x-circle-fill text-danger me-2"></i>
            اتصال برقرار نشد
          </h1>
          <p>امکان اتصال به سرور وجود ندارد. لطفاً دوباره تلاش کنید.</p>
        </div>
        <div id="external-image-capture-upload-failed-container" class="d-none">
          <h1 class="d-flex align-items-center gap-2">
            <i class="bi bi-x-circle-fill text-danger me-2"></i>
            بارگذاری ناموفق بود
          </h1>
          <p>هنگام ارسال فایل شما خطایی رخ داد.</p>
        </div>
        <div id="external-image-capture-form-container" class="d-none pb-4">
          <div id="form-items">
            <h1>ثبت تصویر</h1>

            <input type="hidden" name="__csrf_token" value="${resLocals.__csrf_token}" />
            <input type="hidden" name="file_name" value="${fileName}" />
            <input
              type="file"
              id="camera-input"
              name="file"
              accept="image/*"
              capture="environment"
              class="visually-hidden"
              required
            />
            <img
              id="image-preview"
              class="img-fluid rounded border border-secondary mb-3 w-100"
              style="display: none;"
              alt="پیش‌نمایش تصویر ثبت‌شده"
            />
            <p class="text-muted my-2">
              پیش از بارگذاری، مطمئن شوید عکس شما واضح، با نور کافی و نشان‌دهنده تمامی مراحل حل شما به صورت خوانا است.
            </p>
            <p class="text-muted">بعداً می‌توانید تصویر را برش دهید یا بچرخانید.</p>
          </div>
          <button type="submit" class="btn btn-primary d-none" id="upload-button" disabled>
            <i class="bi bi-check2 me-1"></i>
            <span>بارگذاری</span>
          </button>
          <label for="camera-input" style="cursor: pointer;">
            <button type="button" class="btn btn-primary pe-none">
              <i class="bi bi-camera-fill me-1"></i>
              <span>گرفتن عکس</span>
            </button>
          </label>
          <button type="button" class="btn btn-primary d-none" id="try-again-button">
            <i class="bi bi-arrow-counterclockwise me-1"></i>
            <span>تلاش مجدد</span>
          </button>
        </div>
      </form>
    `,
  });
}
