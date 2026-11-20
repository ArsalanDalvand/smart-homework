import { html } from '@prairielearn/html';

import { platformBranding, uiStrings } from '../lib/branding.js';
import { config } from '../lib/config.js';

import { Modal } from './Modal.js';

export function SupportModal() {
  return Modal({
    id: 'supportModal',
    title: `${uiStrings.support.title} ${platformBranding.brandShortName}`,
    size: 'modal-lg',
    form: false,
    body: html`
      <div style="font-family: var(--font-persian);">
        <p class="text-muted">
          ${uiStrings.support.intro}
        </p>
        <div class="row row-cols-1 row-cols-md-2 g-3">
          ${SupportOptionCard({
            title: uiStrings.support.docsTitle,
            description: uiStrings.support.docsDesc,
            href: platformBranding.docsUrl,
            action: uiStrings.support.docsAction,
            icon: 'bi-book',
          })}
          ${SupportOptionCard({
            title: uiStrings.support.repoTitle,
            description: uiStrings.support.repoDesc,
            href: platformBranding.repoUrl,
            action: uiStrings.support.repoAction,
            icon: 'bi-github',
          })}
          ${SupportOptionCard({
            title: uiStrings.support.contactTitle,
            description: uiStrings.support.contactDesc,
            href: `mailto:${platformBranding.supportEmail}`,
            action: uiStrings.support.contactAction,
            icon: 'bi-envelope',
            newTab: false,
          })}
          ${SupportOptionCard({
            title: `ارتباط با توسعه‌دهنده (${platformBranding.developer.name})`,
            description: `پشتیبانی فنی مستقیم، مشارکت و ارسال بازخورد via ${platformBranding.developer.email} (${platformBranding.developer.affiliation})`,
            href: platformBranding.developer.telegramUrl,
            action: `پیام در تلگرام (${platformBranding.developer.telegram})`,
            icon: 'bi-telegram',
          })}
          ${SupportOptionCard({
            title: platformBranding.portalName,
            description: uiStrings.support.portalDesc,
            href: platformBranding.portalUrl,
            action: uiStrings.support.portalAction,
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
