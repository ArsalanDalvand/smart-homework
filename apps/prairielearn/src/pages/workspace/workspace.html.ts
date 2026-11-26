import { EncodedData } from '@prairielearn/browser-utils';
import { escapeHtml, html, unsafeHtml } from '@prairielearn/html';

import { Modal } from '../../components/Modal.js';
import { PageLayout } from '../../components/PageLayout.js';
import { assetPath, compiledScriptTag } from '../../lib/assets.js';
import type { UntypedResLocals } from '../../lib/res-locals.types.js';

const WORKSPACE_ENHANCER_SCRIPT = String.raw`(function () {
  var STATE_LABELS = {
    running: { label: 'در حال اجرا', cls: 'ws-state-running' },
    launching: { label: 'در حال راه‌اندازی...', cls: 'ws-state-launching' },
    stopped: { label: 'متوقف‌شده', cls: 'ws-state-stopped' },
    uninitialized: { label: 'آماده‌سازی...', cls: 'ws-state-launching' }
  };

  function syncStateUi() {
    var badge = document.getElementById('state');
    var pill = document.getElementById('ws-status-pill');
    if (!badge || !pill) return;
    var raw = (badge.textContent || '').trim().toLowerCase();
    var mapped = STATE_LABELS[raw];
    if (!mapped) return;
    pill.classList.remove('ws-state-running', 'ws-state-launching', 'ws-state-stopped');
    pill.classList.add(mapped.cls);
    if (badge.textContent !== mapped.label) {
      badge.textContent = mapped.label;
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    var badge = document.getElementById('state');
    if (badge && window.MutationObserver) {
      var obs = new MutationObserver(syncStateUi);
      obs.observe(badge, { childList: true, characterData: true, subtree: true });
      syncStateUi();
    }

    var fsBtn = document.getElementById('ws-fullscreen-btn');
    if (fsBtn) {
      function updateFsIcon() {
        var isFs = !!document.fullscreenElement;
        var ic = fsBtn.querySelector('i');
        var lbl = fsBtn.querySelector('span');
        if (ic) ic.className = isFs ? 'fas fa-compress' : 'fas fa-expand';
        if (lbl) lbl.textContent = isFs ? 'خروج از تمام‌صفحه' : 'تمام‌صفحه';
      }
      fsBtn.addEventListener('click', function () {
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen && document.documentElement.requestFullscreen().catch(function () {});
        } else {
          document.exitFullscreen && document.exitFullscreen().catch(function () {});
        }
      });
      document.addEventListener('fullscreenchange', updateFsIcon);
    }
  });
})();`;

export function Workspace({
  pageTitle,
  pageNote,
  navTitle,
  navTitleHref,
  showLogs,
  heartbeatIntervalSec,
  visibilityTimeoutSec,
  socketToken,
  resLocals,
}: {
  pageTitle?: string;
  pageNote?: string;
  navTitle: string;
  navTitleHref: string;
  showLogs: boolean;
  heartbeatIntervalSec: number;
  visibilityTimeoutSec: number;
  socketToken: string;
  resLocals: UntypedResLocals;
}) {
  const { workspace_id, urlPrefix, __csrf_token } = resLocals;

  return PageLayout({
    resLocals,
    pageTitle: pageTitle || 'محیط کاری ابری (VS Code)',
    navContext: {
      type: 'plain',
      page: 'workspace',
    },
    options: {
      fullWidth: true,
      fullHeight: true,
      pageNote,
      dataAttributes: {
        'socket-token': socketToken,
        'workspace-id': workspace_id,
        'heartbeat-interval-sec': heartbeatIntervalSec.toString(),
        'visibility-timeout-sec': visibilityTimeoutSec.toString(),
      },
      enableNavbar: false,
      contentPadding: false,
    },
    headContent: html`
      <link href="${assetPath('stylesheets/workspace.css')}" rel="stylesheet" />
      ${compiledScriptTag('workspaceClient.ts')}
      <script>${unsafeHtml(WORKSPACE_ENHANCER_SCRIPT)}</script>
      ${
        resLocals.assessment?.type === 'Exam' && resLocals.assessment_instance_remaining_ms
          ? html`${compiledScriptTag('examTimeLimitCountdown.ts')}
            ${EncodedData(
              {
                serverRemainingMS: resLocals.assessment_instance_remaining_ms,
                serverTimeLimitMS: resLocals.assessment_instance_time_limit_ms,
                serverUpdateURL: `/pl/course_instance/${resLocals.course_instance.id}/assessment_instance/${resLocals.assessment_instance.id}/time_remaining`,
                canTriggerFinish: false,
                showsTimeoutWarning: true,
                reloadOnFail: false,
                csrfToken: resLocals.__csrf_token,
              },
              'time-limit-data',
            )}`
          : ''
      }
    `,
    preContent: html`
      ${RebootModal({ __csrf_token })} ${ResetModal({ __csrf_token })}
      <nav class="navbar navbar-dark navbar-expand-lg ws-topbar" dir="rtl">
        <div class="container-fluid px-1 gap-2">
          <!-- Brand & Question Title -->
          <div class="d-flex align-items-center gap-2">
            <span class="ws-brand-icon" aria-hidden="true">
              <i class="fas fa-code"></i>
            </span>
            <div class="d-flex flex-column lh-sm">
              <h1 class="mb-0">
                <a href="${navTitleHref}" target="_blank" class="ws-title-link" dir="ltr">
                  ${navTitle}
                </a>
              </h1>
              <span class="ws-subtitle">محیط کدنویسی ابری VS Code</span>
            </div>
          </div>

          <!-- Live Workspace Status Pill -->
          <div class="d-flex align-items-center gap-2 me-2" role="status" aria-live="polite">
            <span id="ws-status-pill" class="ws-status-pill ws-state-launching">
              <span class="ws-status-dot" aria-hidden="true"></span>
              <span id="state" class="badge-workspace">
                <i class="fas fa-spinner fa-pulse"></i>
              </span>
            </span>
            <span id="message" class="ws-msg-pill"></span>
          </div>

          <!-- Center Save & Submit Hint (Desktop) -->
          <div class="d-none d-xl-flex align-items-center mx-auto">
            <div class="ws-save-tip">
              <i class="fas fa-circle-info text-info" aria-hidden="true"></i>
              <span>ذخیره با <kbd>Ctrl+S</kbd> ← سپس در تب سوال <strong>«ارسال و تصحیح خودکار»</strong> را بزنید</span>
            </div>
          </div>

          <button
            class="navbar-toggler border-secondary py-1 px-2"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#workspace-nav"
            aria-label="منوی ابزارها"
          >
            <span class="navbar-toggler-icon"></span>
          </button>

          <div class="collapse navbar-collapse flex-grow-0" id="workspace-nav">
            <ul class="navbar-nav align-items-lg-center gap-2 mt-2 mt-lg-0">
              ${
                resLocals.assessment?.type === 'Exam' && resLocals.assessment_instance_remaining_ms
                  ? html` <li class="nav-item">
                      <div id="countdownProgress"></div>
                      <div class="text-warning small fw-semibold">
                        زمان باقی‌مانده: <span id="countdownDisplay"></span>
                      </div>
                    </li>`
                  : ''
              }
              <li class="nav-item">
                <a href="${navTitleHref}" target="_blank" class="ws-btn ws-btn-primary">
                  <i class="fas fa-arrow-up-right-from-square" aria-hidden="true"></i>
                  <span>صفحه سوال</span>
                </a>
              </li>
              <li class="nav-item">
                <button type="button" id="ws-fullscreen-btn" class="ws-btn">
                  <i class="fas fa-expand" aria-hidden="true"></i>
                  <span>تمام‌صفحه</span>
                </button>
              </li>
              <li class="nav-item">
                <button
                  id="reboot"
                  type="button"
                  class="ws-btn"
                  data-bs-toggle="modal"
                  data-bs-target="#rebootModal"
                >
                  <i class="fas fa-rotate text-info" aria-hidden="true"></i>
                  <span>راه‌اندازی مجدد</span>
                </button>
              </li>
              <li class="nav-item">
                <button
                  id="reset"
                  type="button"
                  class="ws-btn ws-btn-danger"
                  data-bs-toggle="modal"
                  data-bs-target="#resetModal"
                >
                  <i class="fas fa-trash-can" aria-hidden="true"></i>
                  <span>بازنشانی</span>
                </button>
              </li>
              ${
                showLogs
                  ? html`
                      <li class="nav-item">
                        <a
                          class="ws-btn"
                          href="${urlPrefix}/workspace/${workspace_id}/logs"
                          target="_blank"
                        >
                          <i class="fas fa-terminal text-secondary" aria-hidden="true"></i>
                          <span>گزارش‌ها</span>
                        </a>
                      </li>
                    `
                  : null
              }
              <li class="nav-item">
                <button
                  type="button"
                  class="ws-btn"
                  data-bs-toggle="popover"
                  data-bs-container="body"
                  data-bs-placement="bottom"
                  data-bs-html="true"
                  data-bs-content="${escapeHtml(HelpButtonContents())}"
                  aria-label="راهنمای محیط کاری ابری"
                >
                  <i class="fas fa-circle-question text-info" aria-hidden="true"></i>
                </button>
              </li>
            </ul>
          </div>
        </div>
      </nav>
    `,
    content: html`
      <div
        id="loading"
        class="d-flex h-100 flex-grow justify-content-center align-items-center ws-state-screen p-3"
        dir="rtl"
      >
        <div class="ws-state-card text-center">
          <div class="ws-spinner-ring" aria-hidden="true"></div>
          <h2 class="h5 fw-bold text-white mb-2">در حال آماده‌سازی محیط VS Code ابری...</h2>
          <p class="small text-secondary mb-0">
            لطفاً چند ثانیه صبر کنید؛ فایل‌های تمرین شما به‌صورت خودکار بارگذاری می‌شوند.
          </p>
        </div>
      </div>
      <div
        id="stopped"
        class="d-none h-100 flex-grow flex-column justify-content-center align-items-center ws-state-screen p-3 text-center"
        dir="rtl"
      >
        <div class="ws-state-card">
          <i class="fas fa-moon fa-3x text-warning mb-3" aria-hidden="true"></i>
          <h2 class="h5 fw-bold text-white mb-2">محیط کاری ابری به دلیل عدم فعالیت متوقف شد</h2>
          <p class="small text-secondary mb-3">
            فایل‌ها و تغییرات شما به‌صورت خودکار ذخیره شده‌اند. برای ادامه کدنویسی، روی دکمه زیر کلیک کنید.
          </p>
          <button id="reload" class="btn btn-primary px-4">
            <i class="fas fa-play me-1" aria-hidden="true"></i>
            راه‌اندازی مجدد محیط کاری
          </button>
        </div>
      </div>
      <div
        id="failed"
        class="d-none h-100 flex-grow flex-column justify-content-center align-items-center ws-state-screen p-3 text-center"
        dir="rtl"
      >
        <div class="ws-state-card">
          <i class="fas fa-circle-exclamation fa-3x text-danger mb-3" aria-hidden="true"></i>
          <h2 class="h5 fw-bold text-white mb-2">بارگذاری محیط کاری ابری ناموفق بود</h2>
          <!-- The client reveals this frame, then writes the failure detail here,
               so role="alert" announces it. -->
          <p id="failed-message" class="small text-danger-emphasis mb-3" role="alert"></p>
          <button type="button" class="btn btn-outline-light btn-sm" onclick="location.reload()">
            <i class="fas fa-rotate me-1" aria-hidden="true"></i>
            تلاش مجدد
          </button>
        </div>
      </div>
      <iframe
        id="workspace"
        class="d-none flex-grow h-100 w-100 border-0"
        title="محیط کاری ابری VS Code"
      ></iframe>
    `,
  });
}

function ResetModal({ __csrf_token }: { __csrf_token: string }) {
  return Modal({
    id: 'resetModal',
    title: 'بازنشانی محیط کاری ابری',
    body: html`
      <div dir="rtl" class="text-end">
        <p class="fw-semibold">آیا از بازنشانی کامل محیط کاری مطمئن هستید؟</p>
        <ul class="fa-ul me-4 ms-0">
          <li class="mb-2">
            <span class="fa-li">
              <i class="fas fa-exclamation-triangle text-danger" aria-hidden="true"></i>
            </span>
            <strong class="text-danger">تمامی تغییرات فایل‌های شما پاک خواهد شد!</strong> محیط کاری
            به فایل‌های اولیه تمرین برمی‌گردد.
          </li>
          <li>
            <span class="fa-li"><i class="fas fa-window-restore text-primary" aria-hidden="true"></i></span>
            بازنشانی در همین زبانه انجام می‌شود.
          </li>
        </ul>
      </div>
    `,
    footer: html`
      <input type="hidden" name="__csrf_token" value="${__csrf_token}" />
      <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">انصراف</button>
      <button name="__action" value="reset" class="btn btn-danger">
        <i class="fas fa-trash-can me-1" aria-hidden="true"></i>
        تایید و بازنشانی
      </button>
    `,
  });
}

function RebootModal({ __csrf_token }: { __csrf_token: string }) {
  return Modal({
    id: 'rebootModal',
    title: 'راه‌اندازی مجدد محیط کاری ابری',
    body: html`
      <div dir="rtl" class="text-end">
        <p class="fw-semibold">آیا از راه‌اندازی مجدد محیط کاری مطمئن هستید؟</p>
        <ul class="fa-ul me-4 ms-0">
          <li class="mb-2">
            <span class="fa-li"><i class="fas fa-shield-halved text-success" aria-hidden="true"></i></span>
            فایل‌ها و کدهای ذخیره‌شده شما <strong>کاملاً محفوظ</strong> باقی می‌مانند.
          </li>
          <li>
            <span class="fa-li"><i class="fas fa-window-restore text-primary" aria-hidden="true"></i></span>
            محیط کاری ابری در همین زبانه مجدداً راه‌اندازی می‌شود.
          </li>
        </ul>
      </div>
    `,
    footer: html`
      <input type="hidden" name="__csrf_token" value="${__csrf_token}" />
      <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">انصراف</button>
      <button name="__action" value="reboot" class="btn btn-primary">
        <i class="fas fa-rotate me-1" aria-hidden="true"></i>
        راه‌اندازی مجدد
      </button>
    `,
  });
}

function HelpButtonContents() {
  return html`
    <ul class="list-group list-group-flush small" dir="rtl">
      <li class="list-group-item p-2">
        <div class="fw-bold mb-1">۱. ذخیره و ارسال برای داوری</div>
        <div class="text-secondary">
          پس از ویرایش کد در VS Code، فایل را با <code>Ctrl+S</code> ذخیره کنید، سپس به تب صفحه سوال برگردید و دکمه
          <span class="badge text-bg-primary">ارسال و تصحیح خودکار</span> را بزنید.
        </div>
      </li>
      <li class="list-group-item p-2">
        <div class="fw-bold mb-1">۲. راه‌اندازی مجدد</div>
        <div class="text-secondary">
          اگر محیط کند شد یا ترمینال هنگ کرد، دکمه <strong>راه‌اندازی مجدد</strong> را بزنید؛ فایل‌های ذخیره‌شده شما پاک نمی‌شوند.
        </div>
      </li>
      <li class="list-group-item p-2">
        <div class="fw-bold mb-1">۳. بازنشانی (Reset)</div>
        <div class="text-secondary">
          فایل‌ها را به نسخه اولیه تمرین برمی‌گرداند و <strong>تمامی تغییرات شما را حذف می‌کند</strong>.
        </div>
      </li>
    </ul>
  `;
}
