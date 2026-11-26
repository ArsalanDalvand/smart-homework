import { html } from '@prairielearn/html';

import type { AssessmentAuthzResult } from '../lib/assessment-access-control/authz-result.js';
import { formatJalaliFriendly, toPersianDigits } from '../lib/jalali.js';

import { formatStudentCreditDisplay } from './StudentAccessSchedules.js';

export function StudentDeadlineRadar({
  authzResult,
  displayTimezone,
}: {
  authzResult: AssessmentAuthzResult;
  displayTimezone: string;
}) {
  const timeline = authzResult.access_timeline;
  const tz = displayTimezone || 'Asia/Tehran';

  if (timeline.length === 0) {
    if (!authzResult.credit_date_string || authzResult.credit_date_string === 'None') {
      return '';
    }
    return html`
      <div class="se-deadline-radar mt-3" dir="rtl">
        <div class="d-flex flex-wrap align-items-center justify-content-between gap-2">
          <div class="d-flex align-items-center gap-2">
            <i class="bi bi-stopwatch text-primary" aria-hidden="true"></i>
            <span class="fw-bold small">وضعیت مهلت ارسال:</span>
            <span class="small sh-tabular">${formatStudentCreditDisplay(authzResult, tz)}</span>
          </div>
          ${
            authzResult.credit != null
              ? html`<span class="badge sh-chip-success sh-tabular">
                  ضریب نمره: ${toPersianDigits(authzResult.credit)}٪
                </span>`
              : ''
          }
        </div>
      </div>
    `;
  }

  const currentIdx = timeline.findIndex((seg) => seg.current);
  const currentSeg = currentIdx >= 0 ? timeline[currentIdx] : null;
  if (!currentSeg || currentSeg.kind === 'beforeRelease') {
    return '';
  }

  const submittableSteps = timeline.filter(
    (seg) => seg.kind !== 'beforeRelease' && seg.submittable && seg.credit > 0,
  );
  const nextSeg =
    currentIdx >= 0
      ? timeline
          .slice(currentIdx + 1)
          .find((seg) => seg.submittable && seg.credit > 0 && seg.endDate != null)
      : null;

  return html`
    <div class="se-deadline-radar mt-3" dir="rtl">
      <div class="d-flex flex-wrap align-items-center justify-content-between gap-2">
        <div class="d-flex flex-wrap align-items-center gap-2">
          <i class="bi bi-hourglass-split text-primary fs-5" aria-hidden="true"></i>
          ${
            currentSeg.endDate
              ? html`
                  <span class="se-countdown-chip">
                    <i class="bi bi-clock" aria-hidden="true"></i>
                    <span data-deadline-iso="${currentSeg.endDate.toISOString()}">
                      تا ${formatJalaliFriendly(currentSeg.endDate, tz, { includeTz: false })}
                    </span>
                    <span
                      >برای نمره
                      <bdi class="sh-tabular">${toPersianDigits(currentSeg.credit)}٪</bdi></span
                    >
                  </span>
                `
              : html`
                  <span class="badge sh-chip-success px-2 py-1 sh-tabular">
                    ارسال فعال با ضریب
                    <bdi class="sh-tabular">${toPersianDigits(currentSeg.credit)}٪</bdi>
                  </span>
                `
          }
          ${
            nextSeg?.endDate
              ? html`
                  <span class="small text-body-secondary">
                    ← سپس تا
                    <strong class="text-body">
                      ${formatJalaliFriendly(nextSeg.endDate, tz, { includeTz: false })}
                    </strong>
                    با ضریب
                    <strong
                      ><bdi class="sh-tabular">${toPersianDigits(nextSeg.credit)}٪</bdi></strong
                    >
                  </span>
                `
              : currentSeg.endDate
                ? html`
                    <span class="small text-body-secondary">
                      (پایان بازه فعلی:
                      ${formatJalaliFriendly(currentSeg.endDate, tz, { includeTz: false })})
                    </span>
                  `
                : ''
          }
        </div>
        <span class="badge sh-chip-primary sh-tabular">
          ضریب فعلی: <bdi class="sh-tabular">${toPersianDigits(currentSeg.credit)}٪</bdi>
        </span>
      </div>

      ${
        submittableSteps.length > 1
          ? html`
              <div class="d-flex flex-wrap align-items-center gap-2">
                ${submittableSteps.map(
                  (step) => html`
                    <span class="se-credit-step ${step.current ? 'is-active' : ''}">
                      <i
                        class="bi ${step.current ? 'bi-play-circle-fill' : 'bi-calendar-check'}"
                        aria-hidden="true"
                      ></i>
                      <bdi class="sh-tabular">${toPersianDigits(step.credit)}٪</bdi>
                      ${
                        step.endDate
                          ? html`<span
                              >تا
                              ${formatJalaliFriendly(step.endDate, tz, { includeTz: false })}</span
                            >`
                          : html`<span>باز بدون سقف</span>`
                      }
                    </span>
                  `,
                )}
              </div>
            `
          : ''
      }
    </div>
  `;
}

export interface DeadlineMiniItem {
  title: string;
  label: string;
  href: string;
  endDateIso: string;
  endDateJalali: string;
  credit: number;
}

export function StudentDeadlineRadarStrip({ items }: { items: DeadlineMiniItem[] }) {
  if (items.length === 0) return '';

  return html`
    <div class="se-section mb-4" dir="rtl">
      <div class="d-flex align-items-center gap-2 mb-2">
        <i class="bi bi-hourglass-split text-primary" aria-hidden="true"></i>
        <h2 class="h6 fw-bold mb-0">رادار ددلاین‌های پیش‌رو</h2>
      </div>
      <div class="se-radar-strip">
        ${items.map(
          (item) => html`
            <a
              href="${item.href}"
              class="text-decoration-none text-body se-radar-mini-card d-block"
            >
              <div class="d-flex justify-content-between align-items-center mb-1">
                <span class="fw-bold small text-truncate">
                  <span class="badge sh-chip-neutral me-1" dir="ltr">${item.label}</span>
                  ${item.title}
                </span>
                <span class="badge sh-chip-success flex-shrink-0 sh-tabular">
                  ${toPersianDigits(item.credit)}٪
                </span>
              </div>
              <div class="small text-primary fw-semibold" data-deadline-iso="${item.endDateIso}">
                تا ${item.endDateJalali}
              </div>
              <div class="text-secondary" style="font-size: 0.72rem;">
                مهلت: ${item.endDateJalali}
              </div>
            </a>
          `,
        )}
      </div>
    </div>
  `;
}
