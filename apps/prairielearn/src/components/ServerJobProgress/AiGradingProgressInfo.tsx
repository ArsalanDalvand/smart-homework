import { ServerJobsProgressInfo } from './ServerJobProgressBars.js';
import type { JobProgressWithStatus } from './useServerJobProgress.js';

const STATUS_ICONS = { inProgress: 'bi-stars' };

const STATUS_TEXT = {
  inProgress: 'تصحیح با هوش مصنوعی در حال انجام است',
  stopping: 'در حال توقف تصحیح با هوش مصنوعی…',
  stopped: 'تصحیح با هوش مصنوعی متوقف شد',
  complete: 'تصحیح با هوش مصنوعی تکمیل شد',
  failed: 'تصحیح با هوش مصنوعی ناموفق بود',
};

const STOP_CONFIRMATION = {
  title: 'توقف تصحیح با هوش مصنوعی',
  body: 'ارسال‌های در حال تصحیح به پایان می‌رسند و بقیه نادیده گرفته می‌شوند.',
  confirmLabel: 'توقف تصحیح',
  cancelLabel: 'ادامه تصحیح',
};

export function AiGradingProgressInfo({
  jobsProgress,
  courseInstanceId,
  hasCourseInstancePermissionEdit,
  onDismissCompleteJobSequence,
  onStopJobSequence,
}: {
  jobsProgress: JobProgressWithStatus[];
  courseInstanceId: string;
  hasCourseInstancePermissionEdit: boolean;
  onDismissCompleteJobSequence: (jobSequenceId: string) => void;
  onStopJobSequence: (jobSequenceId: string) => void;
}) {
  if (hasCourseInstancePermissionEdit) {
    return (
      <ServerJobsProgressInfo
        itemNames="ارسال تصحیح‌شده"
        jobsProgress={jobsProgress}
        courseInstanceId={courseInstanceId}
        statusIcons={STATUS_ICONS}
        statusText={STATUS_TEXT}
        stopConfirmation={STOP_CONFIRMATION}
        stoppable
        onDismissCompleteJobSequence={onDismissCompleteJobSequence}
        onStopJobSequence={onStopJobSequence}
      />
    );
  }
  return (
    <ServerJobsProgressInfo
      itemNames="ارسال تصحیح‌شده"
      jobsProgress={jobsProgress}
      courseInstanceId={courseInstanceId}
      statusIcons={STATUS_ICONS}
      statusText={STATUS_TEXT}
      onDismissCompleteJobSequence={onDismissCompleteJobSequence}
    />
  );
}
