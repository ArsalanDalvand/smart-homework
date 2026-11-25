import { escapeHtml, html } from '@prairielearn/html';

import { formatPoints, formatPointsOrList } from '../lib/format.js';

export function ExamQuestionAvailablePoints({
  open,
  pointsList,
  highestSubmissionScore,
  currentWeight,
}: {
  open: boolean;
  pointsList?: number[];
  highestSubmissionScore?: number | null;
  currentWeight: number;
}) {
  if (!open || pointsList == null || pointsList.length === 0) return html`&mdash;`;

  const bestScore = Math.floor((highestSubmissionScore ?? 0) * 100);
  const popoverContent = html`
    <p>
      شما ${pointsList.length} تلاش باقی‌مانده برای این سوال دارید.
    </p>
    <p>
      اگر در ارسال بعدی نمره ۱۰۰٪ کسب کنید، ${formatPoints(pointsList[0])} امتیاز اضافه به شما
      تعلق می‌گیرد.
    </p>
    ${
      bestScore > 0
        ? html`
            <p>
              اگر در ارسال بعدی نمره‌ای کمتر از ${bestScore}% کسب کنید، امتیاز اضافه‌ای دریافت
              نخواهید کرد، اما امتیازهایی که قبلاً کسب کرده‌اید حفظ می‌شوند.
            </p>
            <p class="mb-0">
              اگر در ارسال بعدی نمره‌ای بین ${bestScore}% تا ۱۰۰٪ کسب کنید، به میزان
              <code>(${formatPoints(currentWeight)} * (score - ${bestScore})/100)</code>
              امتیاز اضافه دریافت خواهید کرد.
            </p>
          `
        : html`
            <p class="mb-0">
              اگر در ارسال بعدی نمره‌ای کمتر از ۱۰۰٪ کسب کنید، به میزان
              <code>(${formatPoints(currentWeight)} * score / 100)</code>
              امتیاز اضافه دریافت خواهید کرد.
            </p>
          `
    }
  `;

  return html`
    ${
      pointsList.length === 1
        ? formatPoints(pointsList[0])
        : html`${formatPoints(pointsList[0])},
            <span class="text-muted">${formatPointsOrList(pointsList.slice(1))}</span>`
    }
    <button
      type="button"
      class="btn btn-xs btn-ghost js-available-points-popover"
      data-bs-toggle="popover"
      data-bs-container="body"
      data-bs-html="true"
      data-bs-title="توضیح امتیازهای قابل کسب"
      data-bs-content="${escapeHtml(popoverContent)}"
      data-bs-placement="auto"
    >
      <i class="fa fa-question-circle" aria-hidden="true"></i>
    </button>
  `;
}
