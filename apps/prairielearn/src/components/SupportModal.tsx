import { html } from '@prairielearn/html';

import { config } from '../lib/config.js';

import { Modal } from './Modal.js';

export function SupportModal() {
  return Modal({
    id: 'supportModal',
    title: 'راهنمایی و ارتباط با کادر آموزشی درس',
    size: 'modal-lg',
    form: false,
    body: html`
      <div style="font-family: var(--font-persian);">
        <p class="text-muted">دانشجویان گرامی، جهت رفع اشکالات فنی یا سوالات درسی می‌توانید از کانال‌های ارتباطی زیر استفاده فرمایید:</p>
        <div class="row row-cols-1 row-cols-md-2 g-3">
          ${SupportOptionCard({
            title: 'کانال و گروه تلگرام حل تمرین',
            description: 'ارتباط مستقیم و سریع با دستیاران آموزشی (TAs)، اطلاعیه‌ها و پرسش و پاسخ.',
            href: 'https://t.me/iust_bp_fall2026',
            action: 'عضویت در گروه تلگرام',
            icon: 'bi-telegram',
          })}
          ${SupportOptionCard({
            title: 'مخزن پروژه در گیت‌هاب',
            description: 'دسترسی به کدهای نمونه، دستورالعمل‌ها، تست‌ها و اسلایدهای آموزشی درس مبانی برنامه‌نویسی.',
            href: 'https://github.com/ArsalanDalvand/PrairieLearn',
            action: 'مشاهده ریپازیتوری',
            icon: 'bi-github',
          })}
          ${SupportOptionCard({
            title: 'ایمیل کادر آموزشی (TA)',
            description: 'برای مکاتبات رسمی آموزشی، درخواست بررسی خاص نمرات یا اعلام موارد اضطراری.',
            href: 'mailto:bp-ta@iust.ac.ir',
            action: 'ارسال ایمیل به TA',
            icon: 'bi-envelope',
            newTab: false,
          })}
          ${SupportOptionCard({
            title: 'سایت دانشکده مهندسی کامپیوتر',
            description: 'پرتال اطلاع‌رسانی دانشکده مهندسی کامپیوتر دانشگاه علم و صنعت ایران.',
            href: 'http://ce.iust.ac.ir',
            action: 'ورود به سایت دانشکده',
            icon: 'bi-globe',
          })}
        </div>
      </div>
    `,
    footer: html`
      <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">بستن</button>
    `,
  });
}

function SupportOptionCard({
  title,
  description,
  href,
  action,
  icon,
  newTab = true,
}: {
  title: string;
  description: string;
  href: string;
  action: string;
  icon: string;
  newTab?: boolean;
}) {
  return html`
    <div class="col">
      <div class="card h-100">
        <div class="card-body d-flex flex-column">
          <h3 class="h5">${title}</h3>
          <p class="card-text">${description}</p>
          <a
            class="btn btn-primary mt-auto"
            href="${href}"
            ${newTab ? html`target="_blank" rel="noreferrer"` : ''}
          >
            <i class="bi ${icon} me-1" aria-hidden="true"></i>
            ${action}
          </a>
        </div>
      </div>
    </div>
  `;
}
