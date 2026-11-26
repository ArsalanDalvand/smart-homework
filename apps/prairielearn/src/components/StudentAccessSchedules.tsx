import { type HtmlValue, escapeHtml, html } from '@prairielearn/html';

import type {
  AssessmentAuthzResult,
  LegacyAssessmentAccessRuleResult,
} from '../lib/assessment-access-control/authz-result.js';
import type { AccessTimelineEntry } from '../lib/assessment-access-control/timeline.js';
import { formatGregorianTooltip, formatJalaliFriendly, toPersianDigits } from '../lib/jalali.js';

function localizePercentLabel(raw: string): string {
  if (raw === 'None') return 'بدون اعتبار';
  return raw.replace(/\b(\d+)%/g, (_m, n: string) => `${toPersianDigits(n)}٪`);
}

function formatScheduleDate(date: Date | null | undefined, displayTimezone: string): HtmlValue {
  if (!date) return '—';
  return html`<span class="sh-tabular" title="${formatGregorianTooltip(date, displayTimezone)}"
    >${formatJalaliFriendly(date, displayTimezone)}</span
  >`;
}

export function formatStudentCreditDisplay(
  authzResult: AssessmentAuthzResult,
  displayTimezone: string,
): HtmlValue {
  const tz = displayTimezone || 'Asia/Tehran';
  const rawString = authzResult.credit_date_string ?? 'None';

  if (rawString.includes('(Staff override)')) {
    return html`<span class="sh-tabular">
      ${toPersianDigits(authzResult.credit ?? 100)}٪ (دسترسی کادر آموزشی)
    </span>`;
  }

  const curSeg = authzResult.access_timeline.find((s) => s.current && s.submittable);
  if (curSeg) {
    if (curSeg.endDate) {
      return html`<span class="sh-tabular" title="${formatGregorianTooltip(curSeg.endDate, tz)}"
        >${toPersianDigits(curSeg.credit)}٪ تا
        ${formatJalaliFriendly(curSeg.endDate, tz, { includeTz: false })}</span
      >`;
    }
    return html`<span class="sh-tabular">${toPersianDigits(curSeg.credit)}٪</span>`;
  }

  if (authzResult.active && authzResult.credit_end_date) {
    return html`<span
      class="sh-tabular"
      title="${formatGregorianTooltip(authzResult.credit_end_date, tz)}"
      >${toPersianDigits(authzResult.credit ?? 100)}٪ تا
      ${formatJalaliFriendly(authzResult.credit_end_date, tz, { includeTz: false })}</span
    >`;
  }

  if (!authzResult.active && authzResult.next_active_date) {
    return html`<span
      class="sh-tabular"
      title="${formatGregorianTooltip(authzResult.next_active_date, tz)}"
      >شروع از ${formatJalaliFriendly(authzResult.next_active_date, tz, { includeTz: false })}</span
    >`;
  }

  const localizedFallback = rawString
    .replace('(Staff override)', '(دسترسی کادر آموزشی)')
    .replace(' starting from ', ' از ')
    .replace(' until ', ' تا ');
  return html`<span class="sh-tabular">${localizePercentLabel(localizedFallback)}</span>`;
}

export function formatStudentNextActiveDisplay(
  authzResult: AssessmentAuthzResult,
  displayTimezone: string,
): HtmlValue | null {
  const tz = displayTimezone || 'Asia/Tehran';
  const releaseDate =
    authzResult.next_active_date ??
    authzResult.access_timeline.find((s) => s.kind === 'beforeRelease')?.endDate ??
    null;

  if (releaseDate) {
    return html`<span class="sh-tabular" title="${formatGregorianTooltip(releaseDate, tz)}"
      >${formatJalaliFriendly(releaseDate, tz, { includeTz: false })}</span
    >`;
  }

  return authzResult.next_active_time ?? null;
}

export function StudentAccessRulesSchedule({
  accessRules,
  displayTimezone = 'Asia/Tehran',
}: {
  accessRules: LegacyAssessmentAccessRuleResult[];
  displayTimezone?: string;
}) {
  return CreditSchedule({
    rows: accessRules.map((accessRule) => ({
      credit: localizePercentLabel(accessRule.credit),
      start: accessRule.start_date_raw
        ? formatScheduleDate(accessRule.start_date_raw, displayTimezone)
        : accessRule.start_date,
      end: accessRule.end_date_raw
        ? formatScheduleDate(accessRule.end_date_raw, displayTimezone)
        : accessRule.end_date,
    })),
  });
}

export function StudentAccessTimelineSchedule({
  accessTimeline,
  displayTimezone,
}: {
  accessTimeline: readonly AccessTimelineEntry[];
  displayTimezone: string;
}) {
  // Hide segments where submissions aren't allowed. Rendering a 0%-credit
  // after-last-deadline row reads as "keep submitting for 0 credit" when
  // submissions are actually forbidden. The resolver still emits these entries
  // so other consumers (e.g. instructor views) can show the full picture.
  const visibleEntries = accessTimeline.filter((entry) => entry.submittable);
  return CreditSchedule({
    rows: visibleEntries.map((entry) => ({
      credit: `${toPersianDigits(entry.credit)}٪`,
      start: formatScheduleDate(entry.startDate, displayTimezone),
      end: formatScheduleDate(entry.endDate, displayTimezone),
    })),
  });
}

function CreditSchedule({
  rows,
}: {
  rows: { credit: string; start: HtmlValue; end: HtmlValue }[];
}) {
  if (rows.length === 0) return '';

  const content = html`
    <div class="table-responsive" style="font-family: var(--font-persian);">
      <table class="table table-sm mb-0" aria-label="جدول زمان‌بندی اعتبار">
        <thead>
          <tr>
            <th scope="col">درصد اعتبار</th>
            <th scope="col">شروع</th>
            <th scope="col">مهلت تحویل</th>
          </tr>
        </thead>
        <tbody>
          ${rows.map(
            (row) => html`
              <tr>
                <td class="sh-tabular">${row.credit}</td>
                <td>${row.start}</td>
                <td>${row.end}</td>
              </tr>
            `,
          )}
        </tbody>
      </table>
    </div>
  `;

  return html`
    <button
      type="button"
      class="btn btn-xs btn-outline-secondary ms-1"
      data-bs-toggle="popover"
      data-bs-container="body"
      data-bs-html="true"
      data-bs-title="جدول زمان‌بندی مهلت‌ها"
      data-bs-content="${escapeHtml(content)}"
      data-bs-custom-class="popover-wide"
      data-bs-placement="bottom"
    >
      <i class="far fa-calendar-alt me-1" aria-hidden="true"></i> زمان‌بندی تحویل
    </button>
  `;
}
