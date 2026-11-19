import { html } from '@prairielearn/html';

import { Modal } from './Modal.js';

export function RegenerateInstanceModal({ csrfToken }: { csrfToken: string }) {
  return Modal({
    id: 'regenerateInstanceModal',
    title: 'بازتولید نمونه تکلیف / ارزیابی',
    body: html`
      <p class="text-danger">
        <strong>هشدار:</strong> بازتولید نمونه ارزیابی باعث اعمال آخرین تغییرات یا دریافت سوالات جدید می‌شود. پیشرفت و پاسخ‌های فعلی در این نمونه ارزیابی پاک خواهد شد.
      </p>
      <p>آیا از بازتولید نمونه تکلیف اطمینان دارید؟</p>
    `,
    footer: html`
      <input type="hidden" name="__csrf_token" value="${csrfToken}" />
      <input type="hidden" name="__action" value="regenerate_instance" />
      <button type="button" data-bs-dismiss="modal" class="btn btn-secondary">انصراف</button>
      <button type="submit" class="btn btn-danger">بازتولید نمونه تکلیف</button>
    `,
  });
}

export function RegenerateInstanceAlert() {
  return html`
    <div class="alert alert-warning border-warning alert-dismissible fade show" role="alert">
      <strong>پیام کادر آموزشی:</strong>
      برای اعمال آخرین تغییرات صورت سوالات، تست‌کیس‌ها یا دریافت نمونه جدید سوال، می‌توانید
      <!-- [html-validate-disable-block prefer-native-element] -->
      <a
        href="#"
        role="button"
        class="alert-link"
        data-bs-toggle="modal"
        data-bs-target="#regenerateInstanceModal"
      >
        نمونه ارزیابی خود را بازتولید (Regenerate) کنید
      </a>.

      <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="بستن"></button>
    </div>
  `;
}
