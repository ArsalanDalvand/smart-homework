import { html } from '@prairielearn/html';

import { getInstanceQuestionUrl } from '../../../lib/client/url.js';
import type { InstanceQuestionRow } from '../studentAssessmentInstance.types.js';

export function RowLabel({
  courseInstanceId,
  row,
  userGroupRoles,
  rowLabelText,
  hasStatusColumn,
}: {
  courseInstanceId: string;
  row: InstanceQuestionRow;
  userGroupRoles: string | null;
  rowLabelText: string;
  hasStatusColumn: boolean;
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
    lockMessage =
      'به دلیل عبور از مرحله عطف، دیگر امکان ارسال پاسخ برای این سوال وجود ندارد.';
  }

  return html`
    ${
      showLink
        ? html`
            <a
              href="${getInstanceQuestionUrl({
                courseInstanceId,
                instanceQuestionId: row.instance_question.id,
              })}"
              >${rowLabelText}</a
            >
          `
        : html`<span class="text-muted">${rowLabelText}</span>`
    }
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
  `;
}
