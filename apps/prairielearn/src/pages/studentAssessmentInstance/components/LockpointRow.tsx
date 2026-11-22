import { formatDate } from '@prairielearn/formatter';
import { html } from '@prairielearn/html';

import type { InstanceQuestionRow } from '../studentAssessmentInstance.types.js';

export function LockpointRow({
  row,
  colspan,
  crossable,
  blockedByAdvanceScorePerc,
  isGroupAssessment,
  displayTimezone,
}: {
  row: InstanceQuestionRow;
  colspan: number;
  crossable: boolean;
  blockedByAdvanceScorePerc: boolean;
  isGroupAssessment: boolean;
  displayTimezone: string;
}) {
  if (row.lockpoint_crossed) {
    const parts: string[] = ['سوالات قبلی قفل شدند'];
    if (isGroupAssessment && row.lockpoint_crossed_authn_user_uid) {
      parts.push(`توسط ${row.lockpoint_crossed_authn_user_uid}`);
    }
    if (row.lockpoint_crossed_at) {
      parts.push(`در تاریخ ${formatDate(row.lockpoint_crossed_at, displayTimezone)}`);
    }

    return html`
      <tr class="table-light">
        <td colspan="${colspan}" class="py-2">
          <div class="d-flex">
            <i class="fas fa-check-circle text-success me-2 mt-1" aria-hidden="true"></i>
            <div>
              <span class="fw-bold">مرحله عطف</span>
              <small class="text-muted d-block">${parts.join(' ')}</small>
            </div>
          </div>
        </td>
      </tr>
    `;
  }

  if (crossable) {
    return html`
      <tr class="table-warning">
        <td colspan="${colspan}" class="py-2">
          <div
            class="d-flex flex-column flex-sm-row justify-content-between align-items-sm-center gap-2"
          >
            <div class="d-flex">
              <i class="fas fa-lock text-warning me-2 mt-1" aria-hidden="true"></i>
              <div>
                <span class="fw-bold">مرحله عطف</span>
                <small class="text-muted d-block">
                  پس از عبور از این مرحله، دیگر امکان ثبت پاسخ برای سوالات قبلی را نخواهید داشت.
                </small>
              </div>
            </div>
            <button
              type="button"
              class="btn btn-warning btn-sm text-nowrap"
              data-bs-toggle="modal"
              data-bs-target="#crossLockpointModal-${row.zone.id}"
            >
              عبور به سوالات بعدی
            </button>
          </div>
        </td>
      </tr>
    `;
  }

  return html`
    <tr class="table-light">
      <td colspan="${colspan}" class="py-2">
        <div class="d-flex">
          <i class="fas fa-lock text-secondary me-2 mt-1" aria-hidden="true"></i>
          <div>
            <span class="fw-bold text-muted">مرحله عطف</span>
            <small class="text-muted d-block">
              ${
                blockedByAdvanceScorePerc
                  ? 'برای عبور از این مرحله عطف، باید در سوال قبلی نمره بالاتری کسب نمایید.'
                  : 'جهت باز شدن این بخش، سوالات قبلی را تکمیل کنید.'
              }
            </small>
          </div>
        </div>
      </td>
    </tr>
  `;
}
