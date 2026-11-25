import { assertNever } from '@prairielearn/utils';

import { JobItemStatus } from '../../../../lib/serverJobProgressSocket.shared.js';

export function GradingStatusCell({
  aiGradingMode,
  requiresGrading,
  instanceQuestionId,
  displayedStatuses,
}: {
  aiGradingMode: boolean;
  requiresGrading: boolean;
  instanceQuestionId: string;
  displayedStatuses: Record<string, JobItemStatus | undefined>;
}) {
  const aiGradingStatus = displayedStatuses[instanceQuestionId];
  if (!aiGradingMode || aiGradingStatus === undefined) {
    return requiresGrading ? 'نیازمند تصحیح' : 'تصحیح‌شده';
  }
  return <AiGradingStatusCell aiGradingStatus={aiGradingStatus} />;
}

/**
 * In the manual instance question grading table,
 * when an instance question is being AI graded,
 * this cell displays its grading status.
 */
function AiGradingStatusCell({ aiGradingStatus }: { aiGradingStatus: JobItemStatus }) {
  switch (aiGradingStatus) {
    case JobItemStatus.queued:
      return (
        <span className="d-flex align-items-center gap-2">
          <i className="bi bi-clock text-secondary" aria-hidden="true" />
          <span>در صف تصحیح با هوش مصنوعی</span>
        </span>
      );
    case JobItemStatus.in_progress:
      return (
        <span className="d-flex align-items-center gap-2">
          <div className="spinner-grow spinner-grow-sm text-secondary bg-secondary" role="status">
            <span className="visually-hidden">در حال بارگذاری...</span>
          </div>
          <span>در حال تصحیح با هوش مصنوعی...</span>
        </span>
      );
    case JobItemStatus.failed:
      return (
        <span className="d-flex align-items-center gap-2">
          <i className="bi bi-exclamation-octagon-fill text-danger" aria-hidden="true" />
          <span>تصحیح با هوش مصنوعی ناموفق بود</span>
        </span>
      );
    case JobItemStatus.complete:
      return (
        <span className="d-flex align-items-center gap-2">
          <i className="bi bi-check-circle-fill text-success" aria-hidden="true" />
          <span>تصحیح با هوش مصنوعی کامل شد</span>
        </span>
      );
    default:
      assertNever(aiGradingStatus);
  }
}
