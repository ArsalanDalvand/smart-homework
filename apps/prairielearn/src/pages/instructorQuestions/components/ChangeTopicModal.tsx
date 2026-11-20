import { useMutation } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { Button, Modal } from 'react-bootstrap';

import { getAppError } from '@prairielearn/trpc/client';

import type { SafeQuestionsPageData } from '../../../components/QuestionsTable.shared.js';
import type { PublicTopic } from '../../../lib/client/safe-db-types.js';
import { useTRPC } from '../../../trpc/course/context.js';
import type { QuestionsError } from '../../../trpc/course/questions.js';

import { BulkQuestionErrorAlert } from './BulkQuestionErrorAlert.js';
import { SelectedQuestionList } from './SelectedQuestionList.js';
import { useInvalidateQuestionsList } from './useInvalidateQuestionsList.js';

function describeChangeResult({
  changedCount,
  unchangedCount,
}: {
  changedCount: number;
  unchangedCount: number;
}) {
  if (changedCount === 0) {
    return 'تمامی سوالات انتخاب‌شده از قبل به این مبحث اختصاص دارند.';
  }

  const parts = [
    `مبحث آموزشی ${changedCount} سوال با موفقیت تغییر یافت.`,
  ];
  if (unchangedCount > 0) {
    parts.push(
      `${unchangedCount} سوال از قبل به این مبحث اختصاص داشتند.`,
    );
  }
  return parts.join(' ');
}

export function ChangeTopicModal({
  show,
  onHide,
  selectedQuestions,
  questionIds,
  topics,
  urlPrefix,
  clearSelection,
  onActionSuccess,
}: {
  show: boolean;
  onHide: () => void;
  selectedQuestions: SafeQuestionsPageData[];
  questionIds: string[];
  topics: PublicTopic[];
  urlPrefix: string;
  clearSelection: () => void;
  onActionSuccess: (message: string) => void;
}) {
  const trpc = useTRPC();
  const invalidateQuestionsList = useInvalidateQuestionsList();

  const sortedTopics = useMemo(
    () => [...topics].sort((a, b) => a.name.localeCompare(b.name)),
    [topics],
  );
  const initialTopic = sortedTopics.at(0)?.name ?? '';
  const [topic, setTopic] = useState(() => initialTopic);

  const mutation = useMutation({
    ...trpc.questions.changeTopic.mutationOptions(),
    onSuccess: async ({ changedCount, unchangedCount }) => {
      await invalidateQuestionsList();
      onActionSuccess(describeChangeResult({ changedCount, unchangedCount }));
      clearSelection();
      onHide();
    },
  });

  const appError = getAppError<QuestionsError['ChangeTopic']>(mutation.error);
  const canSubmit = topic !== '';

  return (
    <Modal
      show={show}
      size="lg"
      aria-labelledby="bulk-change-topic-modal-title"
      onHide={onHide}
      onExited={() => {
        mutation.reset();
        setTopic(initialTopic);
      }}
      contentClassName="text-end"
      dir="rtl"
      style={{ fontFamily: 'var(--font-persian)' }}
    >
      <Modal.Header closeButton>
        <Modal.Title id="bulk-change-topic-modal-title">تغییر مبحث آموزشی سوالات</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="mb-3">
          <label className="form-label" htmlFor="bulk-change-topic-select">
            مبحث آموزشی
          </label>
          <select
            id="bulk-change-topic-select"
            className="form-select"
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
          >
            {sortedTopics.map((courseTopic) => (
              <option key={courseTopic.name} value={courseTopic.name}>
                {courseTopic.name}
              </option>
            ))}
          </select>
        </div>

        <SelectedQuestionList questions={selectedQuestions} />

        <BulkQuestionErrorAlert error={appError} urlPrefix={urlPrefix} />
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          انصراف
        </Button>
        <Button
          variant="primary"
          disabled={!canSubmit || mutation.isPending}
          onClick={() => mutation.mutate({ questionIds, topic })}
        >
          {mutation.isPending ? 'در حال تغییر مبحث…' : 'تغییر مبحث'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
