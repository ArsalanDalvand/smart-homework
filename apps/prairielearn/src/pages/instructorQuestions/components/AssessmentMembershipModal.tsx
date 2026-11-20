import { useMutation, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Button, Modal } from 'react-bootstrap';

import { getAppError } from '@prairielearn/trpc/client';
import { AppErrorAlert } from '@prairielearn/trpc/react';

import type { SafeQuestionsPageData } from '../../../components/QuestionsTable.shared.js';
import type { PublicCourseInstance } from '../../../lib/client/safe-db-types.js';
import { useTRPC } from '../../../trpc/course/context.js';
import type { QuestionsError } from '../../../trpc/course/questions.js';

import { AssessmentChecklist } from './AssessmentChecklist.js';
import { BulkQuestionErrorAlert } from './BulkQuestionErrorAlert.js';
import { SelectedQuestionList } from './SelectedQuestionList.js';
import { useInvalidateQuestionsList } from './useInvalidateQuestionsList.js';

type Mode = 'add' | 'remove';

interface ModeConfig {
  idPrefix: string;
  title: string;
  submitVariant: 'primary' | 'danger';
  submitVerb: string;
  emptyMessage: string;
  /** Whether to offer assessments the selected questions are not yet in. */
  includeAssessmentsWithoutQuestions: boolean;
  /** Message when no assessment was actually changed. */
  noChangeMessage: string;
  /** Leading clause of the success message, completed with the affected count. */
  successVerb: string;
  /** Appended when some assessments skipped some questions. */
  partialSkipMessage: string;
}

const MODE_CONFIG: Record<Mode, ModeConfig> = {
  add: {
    idPrefix: 'bulk-add-assessment',
    title: 'افزودن سوالات انتخاب‌شده به آزمون‌ها',
    submitVariant: 'primary',
    submitVerb: 'افزودن به',
    emptyMessage: 'این دوره هیچ آزمونی ندارد.',
    includeAssessmentsWithoutQuestions: true,
    noChangeMessage: 'تمامی سوالات انتخاب‌شده از قبل در آزمون‌های مشخص‌شده وجود داشتند.',
    successVerb: 'سوالات انتخاب‌شده افزوده شدند به',
    partialSkipMessage: 'برخی سوالات از قبل در یک یا چند آزمون وجود داشتند.',
  },
  remove: {
    idPrefix: 'bulk-remove-assessment',
    title: 'حذف سوالات انتخاب‌شده از آزمون‌ها',
    submitVariant: 'danger',
    submitVerb: 'حذف از',
    emptyMessage: 'هیچ‌کدام از سوالات انتخاب‌شده در آزمون‌های این دوره قرار ندارند.',
    includeAssessmentsWithoutQuestions: false,
    noChangeMessage: 'هیچ‌یک از سوالات انتخاب‌شده در آزمون‌های مشخص‌شده وجود نداشتند.',
    successVerb: 'سوالات انتخاب‌شده حذف شدند از',
    partialSkipMessage: 'برخی سوالات در یک یا چند آزمون وجود نداشتند.',
  },
};

/**
 * Add or remove the selected questions to/from assessments in a chosen course
 * instance. The add and remove flows are structurally identical — they differ
 * only in which mutation runs, which assessments are offered, and the wording —
 * so they share this component, parameterized by `mode`.
 */
export function AssessmentMembershipModal({
  mode,
  show,
  onHide,
  selectedQuestions,
  questionIds,
  courseInstances,
  currentCourseInstanceId,
  urlPrefix,
  clearSelection,
  onActionSuccess,
}: {
  mode: Mode;
  show: boolean;
  onHide: () => void;
  selectedQuestions: SafeQuestionsPageData[];
  questionIds: string[];
  courseInstances: PublicCourseInstance[];
  currentCourseInstanceId?: string;
  urlPrefix: string;
  clearSelection: () => void;
  onActionSuccess: (message: string) => void;
}) {
  const config = MODE_CONFIG[mode];
  const trpc = useTRPC();
  const invalidateQuestionsList = useInvalidateQuestionsList();
  const initialCourseInstanceId = currentCourseInstanceId ?? courseInstances.at(0)?.id ?? '';
  const [courseInstanceId, setCourseInstanceId] = useState(() => initialCourseInstanceId);
  const [selectedAssessmentIds, setSelectedAssessmentIds] = useState<Set<string>>(() => new Set());

  const resetModalState = () => {
    setCourseInstanceId(initialCourseInstanceId);
    setSelectedAssessmentIds(new Set());
  };

  const assessmentsQuery = useQuery({
    ...trpc.questions.listAssessments.queryOptions(
      { courseInstanceId, questionIds },
      { enabled: show && courseInstanceId !== '' },
    ),
  });
  // For removal, only offer assessments that reference at least one selected
  // question, since a question can only be removed from an assessment it is in.
  const assessments = (assessmentsQuery.data ?? []).filter(
    (assessment) => config.includeAssessmentsWithoutQuestions || assessment.referencedCount > 0,
  );

  const toggleAssessment = (assessmentId: string) => {
    setSelectedAssessmentIds((prev) => {
      const next = new Set(prev);
      if (next.has(assessmentId)) {
        next.delete(assessmentId);
      } else {
        next.add(assessmentId);
      }
      return next;
    });
  };

  const mutationOptions =
    mode === 'add'
      ? trpc.questions.addToAssessment.mutationOptions()
      : trpc.questions.removeFromAssessment.mutationOptions();
  const mutation = useMutation({
    ...mutationOptions,
    onSuccess: async ({ results, affectedAssessmentCount }) => {
      await invalidateQuestionsList();
      const parts: string[] = [];
      if (affectedAssessmentCount === 0) {
        parts.push(config.noChangeMessage);
      } else {
        parts.push(
          `${config.successVerb} ${affectedAssessmentCount} آزمون.`,
        );
        if (results.some((result) => result.skippedCount > 0)) {
          parts.push(config.partialSkipMessage);
        }
      }
      onActionSuccess(parts.join(' '));
      clearSelection();
      onHide();
    },
  });
  const appError = getAppError<
    QuestionsError['AddToAssessment'] | QuestionsError['RemoveFromAssessment']
  >(mutation.error);
  const selectedCount = selectedAssessmentIds.size;
  const canSubmit = selectedCount > 0;

  return (
    <Modal
      show={show}
      size="lg"
      aria-labelledby={`${config.idPrefix}-modal-title`}
      onHide={onHide}
      onExited={() => {
        mutation.reset();
        resetModalState();
      }}
      contentClassName="text-end"
      dir="rtl"
      style={{ fontFamily: 'var(--font-persian)' }}
    >
      <Modal.Header closeButton>
        <Modal.Title id={`${config.idPrefix}-modal-title`}>{config.title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <AppErrorAlert
          error={getAppError<QuestionsError['ListAssessments']>(assessmentsQuery.error)}
          render={{ UNKNOWN: ({ message }) => <>خطا در دریافت لیست آزمون‌ها: {message}</> }}
        />
        <div className="mb-3">
          <label className="form-label" htmlFor={`${config.idPrefix}-course-instance`}>
            دوره / ترم تحصیلی
          </label>
          <select
            id={`${config.idPrefix}-course-instance`}
            className="form-select"
            value={courseInstanceId}
            onChange={(e) => {
              setCourseInstanceId(e.target.value);
              setSelectedAssessmentIds(new Set());
            }}
          >
            {courseInstances.map((courseInstance) => (
              <option key={courseInstance.id} value={courseInstance.id}>
                {courseInstance.short_name}
              </option>
            ))}
          </select>
        </div>

        <AssessmentChecklist
          idPrefix={config.idPrefix}
          assessments={assessments}
          isLoading={assessmentsQuery.isLoading}
          selectedAssessmentIds={selectedAssessmentIds}
          emptyMessage={config.emptyMessage}
          onToggle={toggleAssessment}
        />

        <SelectedQuestionList questions={selectedQuestions} />
        <BulkQuestionErrorAlert error={appError} urlPrefix={urlPrefix} />
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          انصراف
        </Button>
        <Button
          variant={config.submitVariant}
          disabled={!canSubmit || mutation.isPending}
          onClick={() =>
            mutation.mutate({ questionIds, assessmentIds: [...selectedAssessmentIds] })
          }
        >
          {config.submitVerb} {selectedCount} آزمون
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
