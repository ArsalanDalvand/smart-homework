import { OverrideAfterCompleteForm } from './AfterCompleteForm.js';
import { OverrideDateControlForm } from './DateControlForm.js';

export function OverrideRuleContent({
  index,
  displayTimezone,
  isExam,
}: {
  index: number;
  displayTimezone: string;
  isExam: boolean;
}) {
  return (
    <div className="d-flex flex-column gap-3">
      <OverrideDateControlForm
        index={index}
        title="کنترل تاریخ و زمان"
        description="کنترل دسترسی و اعتبار نمره ارزیابی بر اساس زمان‌بندی"
        displayTimezone={displayTimezone}
        isExam={isExam}
      />

      <OverrideAfterCompleteForm
        index={index}
        title="پس از اتمام"
        displayTimezone={displayTimezone}
      />
    </div>
  );
}
