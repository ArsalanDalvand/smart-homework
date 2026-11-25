import { html } from '@prairielearn/html';

import type { AssessmentSet } from '../lib/db-types.js';

export function AssessmentSetHeadingHtml({ assessment_set }: { assessment_set: AssessmentSet }) {
  if (!assessment_set.implicit) {
    return assessment_set.heading;
  }

  return html`
    ${assessment_set.name}
    <span class="text-muted">
      (ایجادشده به‌صورت خودکار از طریق استفاده در یک تکلیف/آزمون؛ برای سفارشی‌سازی این مجموعه ارزیابی را به فایل <code>infoCourse.json</code> خود اضافه کنید)
    </span>
  `;
}

export function AssessmentSetHeading({
  assessmentSet,
}: {
  assessmentSet: Pick<AssessmentSet, 'heading' | 'implicit' | 'name'>;
}) {
  if (!assessmentSet.implicit) {
    return <>{assessmentSet.heading}</>;
  }

  return (
    <>
      {assessmentSet.name}
      <span className="text-muted">
        {' '}
        (ایجادشده به‌صورت خودکار از طریق استفاده در یک تکلیف/آزمون؛ برای سفارشی‌سازی این مجموعه ارزیابی را ویرایش کنید)
      </span>
    </>
  );
}
