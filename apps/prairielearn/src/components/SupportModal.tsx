import { html } from '@prairielearn/html';

import { platformBranding, uiStrings } from '../lib/branding.js';
import { config } from '../lib/config.js';

import { Modal } from './Modal.js';

export function SupportModal() {
  return Modal({
    id: 'supportModal',
    title: `راهنمایی و پشتیبانی ${platformBranding.brandShortName}`,
    size: 'modal-lg',
    form: false,
    body: html`
      <div style="font-family: var(--font-persian);">
        <p class="text-muted">
          دانشجویان، اساتید و دستیاران گرامی دانشگاه‌ها، دانشکده‌ها و مراکز آموزشی، جهت دریافت راهنمایی یا رفع اشکال از مسیرهای زیر استفاده فرمایید:
        </p>
        <div class="row row-cols-1 row-cols-md-2 g-3">
          ${SupportOptionCard({
            title: 'راهنمای جامع تدریس و طراحی سوال',
            description: 'مستندات آموزشی نحوه طراحی سوالات تستی و تشریحی، آزمون‌ها و تصحیح خودکار برای اساتید و دستیاران.',
            href: platformBranding.docsUrl,
            action: 'مشاهده مستندات راهنما',
            icon: 'bi-book',
          })}
          ${SupportOptionCard({
            title: 'مخزن سامانه در گیت‌هاب',
            description: 'دسترسی به سورس‌کد سامانه ارزیابی هوشمند، گزارش باگ‌ها و مشارکت در توسعه قابلیت‌های پلتفرم.',
            href: platformBranding.repoUrl,
            action: 'مشاهده ریپازیتوری',
            icon: 'bi-github',
          })}
          ${SupportOptionCard({
            title: 'پشتیبانی فنی و ارتباط با مدیران',
            description: 'ارتباط با تیم فنی جهت ایجاد درس جدید، دسترسی‌های اساتید و گزارش اشکالات احتمالی سامانه.',
            href: `mailto:${platformBranding.supportEmail}`,
            action: 'ارسال ایمیل به پشتیبانی',
            icon: 'bi-envelope',
            newTab: false,
          })}
          ${SupportOptionCard({
            title: platformBranding.portalName,
            description: 'دسترسی به تقویم آموزشی، سامانه مدیریت آموزش و ارتباط با اداره آموزش دانشکده‌ها.',
            href: platformBranding.portalUrl,
            action: 'ورود به پرتال دانشگاه',
            icon: 'bi-globe',
          })}
        </div>
      </div>
    `,
    footer: html`
      <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">${uiStrings.common.close}</button>
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
