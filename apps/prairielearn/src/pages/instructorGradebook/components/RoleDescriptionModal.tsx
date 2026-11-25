import { html } from '@prairielearn/html';

import { Modal } from '../../../components/Modal.js';

export function RoleDescriptionModal() {
  return Modal({
    id: 'role-help',
    title: 'نقش‌ها',
    form: false,
    body: html`
      <ul>
        <li>
          <strong>کادر آموزشی (Staff)</strong> عضو کادر آموزشی درس است. بسته به تنظیمات درس، ممکن
          است اجازه مشاهده داده‌های همه کاربران و ویرایش اطلاعات سایر کاربران را داشته باشد.
        </li>
        <li>
          <strong>دانشجو (Student)</strong> دانشجوی شرکت‌کننده در کلاس است. آن‌ها تنها می‌توانند
          اطلاعات خود را ببینند و آزمون‌ها را انجام دهند.
        </li>
        <li>
          <strong>هیچ‌کدام (None)</strong> کاربری است که زمانی عضو درس بوده اما دیگر در درس ثبت‌نام
          نیست یا جزو کادر آموزشی نیست. او دیگر به درس دسترسی ندارد اما کارهای انجام‌شده‌اش در درس
          حفظ شده است.
        </li>
      </ul>
    `,
    footer: html`
      <button type="button" class="btn btn-primary" data-bs-dismiss="modal">بستن</button>
    `,
  });
}
