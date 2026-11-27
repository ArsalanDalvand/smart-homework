import { type HtmlValue, html, joinHtml } from '@prairielearn/html';

import { getInstanceQuestionUrl } from '../../../lib/client/url.js';
import { toPersianDigits } from '../../../lib/jalali.js';
import type { QuestionClassStat } from '../../../lib/student-engagement.js';
import type { FirstBloodOwner } from '../../../lib/student-gamification.js';
import type { InstanceQuestionRow } from '../studentAssessmentInstance.types.js';

const EN_PAREN_REGEX = /\([A-Za-z][^()]*[A-Za-z0-9]\)/g;

function formatBidiQuestionLabel(text: string): HtmlValue {
  const parts: HtmlValue[] = [];
  let lastIndex = 0;
  for (const match of text.matchAll(EN_PAREN_REGEX)) {
    const start = match.index;
    if (start > lastIndex) {
      parts.push(html`${text.slice(lastIndex, start)}`);
    }
    parts.push(html`<bdi dir="ltr">${match[0]}</bdi>`);
    lastIndex = start + match[0].length;
  }
  if (lastIndex === 0) return text;
  if (lastIndex < text.length) {
    parts.push(html`${text.slice(lastIndex)}`);
  }
  return joinHtml(parts);
}

export function RowLabel({
  courseInstanceId,
  row,
  userGroupRoles,
  rowLabelText,
  hasStatusColumn,
  questionStat = null,
  isOneShot = false,
  isFirstBlood = false,
  firstBloodOwner = null,
  currentUserId = null,
  showFirstBloodHunt = false,
}: {
  courseInstanceId: string;
  row: InstanceQuestionRow;
  userGroupRoles: string | null;
  rowLabelText: string;
  hasStatusColumn: boolean;
  questionStat?: QuestionClassStat | null;
  isOneShot?: boolean;
  isFirstBlood?: boolean;
  firstBloodOwner?: FirstBloodOwner | null;
  currentUserId?: string | null;
  showFirstBloodHunt?: boolean;
}) {
  let lockMessage: string | null = null;
  let showLink = true;

  if (row.question_access_mode === 'blocked_sequence') {
    showLink = false;
    lockMessage =
      row.prev_question_access_mode === 'blocked_sequence'
        ? 'پیش از دسترسی به این سوال، باید سوال قبلی تکمیل گردد.'
        : `برای باز شدن این سوال باید حداقل ${row.prev_advance_score_perc}٪ نمره را در «${row.prev_title}» کسب کنید.`;
  } else if (row.question_access_mode === 'blocked_lockpoint') {
    showLink = false;
  } else if (!(row.group_role_permissions?.can_view ?? true)) {
    showLink = false;
    lockMessage = `نقش فعلی گروهی شما (${userGroupRoles}) دسترسی به این سوال را محدود کرده است.`;
  } else if (row.question_access_mode === 'read_only_lockpoint') {
    lockMessage = 'به دلیل عبور از مرحله عطف، دیگر امکان ارسال پاسخ برای این سوال وجود ندارد.';
  }

  const isSolved =
    (row.instance_question.highest_submission_score ?? 0) >= 0.9999 ||
    (row.instance_question.score_perc ?? 0) >= 99.99;
  const isPartial =
    !isSolved &&
    (row.instance_question.number_attempts > 0 || (row.instance_question.score_perc ?? 0) > 0);
  const statusIconClass = !showLink
    ? 'bi bi-lock-fill text-body-secondary'
    : isSolved
      ? 'bi bi-check-circle-fill text-success'
      : isPartial
        ? 'bi bi-circle-half text-warning'
        : 'bi bi-circle text-body-secondary';

  const renderedLabel = formatBidiQuestionLabel(rowLabelText);

  return html`
    <span class="d-inline-flex align-items-center gap-2 min-w-0">
      <i class="${statusIconClass} flex-shrink-0" aria-hidden="true"></i>
      ${
        showLink
          ? html`
              <a
                href="${getInstanceQuestionUrl({
                  courseInstanceId,
                  instanceQuestionId: row.instance_question.id,
                })}"
                class="sh-q-link text-break"
                >${renderedLabel}</a
              >
            `
          : html`<span class="text-body-secondary text-break">${renderedLabel}</span>`
      }
    </span>
    ${
      // On exams, blocked_lockpoint questions show "Locked" in the Status column,
      // so we skip the inline badge to avoid duplication. On homeworks (no Status
      // column), we render the badge here instead.
      row.question_access_mode === 'blocked_lockpoint' && !hasStatusColumn
        ? html`
            <span class="badge bg-secondary ms-1" data-testid="locked-instance-question-row">
              قفل شده
            </span>
          `
        : lockMessage != null
          ? html`
              <button
                type="button"
                class="btn btn-xs border text-secondary ms-1"
                data-bs-toggle="popover"
                data-bs-container="body"
                data-bs-html="true"
                data-bs-content="${lockMessage}"
                data-testid="locked-instance-question-row"
                aria-label="Locked"
              >
                <i class="fas fa-lock" aria-hidden="true"></i>
              </button>
            `
          : ''
    }
    ${
      row.file_count > 0
        ? html`
            <button
              type="button"
              class="btn btn-xs border text-secondary ms-1"
              data-bs-toggle="popover"
              data-bs-container="body"
              data-bs-html="true"
              data-bs-content="یادداشت‌های شخصی: ${row.file_count}"
              aria-label="Has personal note attachments"
            >
              <i class="fas fa-paperclip"></i>
            </button>
          `
        : ''
    }
    ${
      questionStat && questionStat.attemptedCount >= 1
        ? html`
            <span
              class="se-qstat-pill ${
                questionStat.solveRatePerc >= 70
                  ? 'se-qstat-easy'
                  : questionStat.solveRatePerc >= 40
                    ? 'se-qstat-medium'
                    : 'se-qstat-hard'
              }"
              title="بر اساس ${toPersianDigits(questionStat.attemptedCount)} دانشجوی شرکت‌کننده"
            >
              <i class="fas fa-users" aria-hidden="true"></i>
              <span>${toPersianDigits(questionStat.solveRatePerc)}٪ حل کرده‌اند</span>
              ${
                questionStat.avgAttempts > 0
                  ? html`<span>• میانگین ${toPersianDigits(questionStat.avgAttempts)} تلاش</span>`
                  : ''
              }
            </span>
          `
        : ''
    }
    ${
      isOneShot
        ? html`
            <span class="sh-honor-chip sh-en-term" title="حل کامل این سوال در اولین ارسال">
              <i class="bi bi-lightning-charge-fill text-warning" aria-hidden="true"></i>
              One-Shot
            </span>
          `
        : ''
    }
    ${
      isFirstBlood || (firstBloodOwner && currentUserId && firstBloodOwner.userId === currentUserId)
        ? html`
            <span
              class="sh-fb-mine-chip"
              dir="rtl"
              title="شما نفر اول کلاس در حل کامل این سوال شدید!"
            >
              <i class="bi bi-lightning-fill" aria-hidden="true"></i>
              <bdi dir="ltr" class="sh-en-term">First Blood</bdi>
              <span>: شما!</span>
            </span>
          `
        : firstBloodOwner
          ? html`
              <span class="sh-fb-claimed-chip" dir="rtl" title="نفر اول کلاس در حل کامل این سوال">
                <i class="bi bi-trophy-fill text-warning" aria-hidden="true"></i>
                <bdi dir="ltr" class="sh-en-term">First Blood</bdi>
                <span>: ${firstBloodOwner.displayName}</span>
              </span>
            `
          : showFirstBloodHunt && showLink
            ? html`
                <span
                  class="sh-fb-open-chip"
                  dir="rtl"
                  title="هنوز کسی این سوال را ۱۰۰٪ حل نکرده — نفر اول +۶۰ XP می‌گیرد"
                >
                  <i class="bi bi-lightning-charge-fill" aria-hidden="true"></i>
                  <span>شکار اول</span>
                  <bdi dir="ltr" class="sh-en-term">+${toPersianDigits(60)} XP</bdi>
                </span>
              `
            : ''
    }
  `;
}
