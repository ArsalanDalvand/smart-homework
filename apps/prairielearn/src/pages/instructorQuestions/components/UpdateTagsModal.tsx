import { useMutation } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { Button, Modal } from 'react-bootstrap';

import { getAppError } from '@prairielearn/trpc/client';

import type { SafeQuestionsPageData } from '../../../components/QuestionsTable.shared.js';
import { TagBadge } from '../../../components/TagBadge.js';
import type { PublicTag } from '../../../lib/client/safe-db-types.js';
import { useTRPC } from '../../../trpc/course/context.js';
import type { QuestionsError } from '../../../trpc/course/questions.js';

import { BulkQuestionErrorAlert } from './BulkQuestionErrorAlert.js';
import { SelectedQuestionList } from './SelectedQuestionList.js';
import { useInvalidateQuestionsList } from './useInvalidateQuestionsList.js';

type Mode = 'add' | 'remove';

const MODE_CONFIG: Record<
  Mode,
  {
    idPrefix: string;
    title: string;
    submitLabel: string;
    submitVariant: 'primary' | 'danger';
    noChangeMessage: string;
    changedMessageVerb: string;
    unchangedMessageVerb: string;
  }
> = {
  add: {
    idPrefix: 'bulk-add-tags',
    title: 'افزودن برچسب‌ها',
    submitLabel: 'افزودن برچسب‌ها',
    submitVariant: 'primary',
    noChangeMessage: 'تمامی سوالات انتخاب‌شده از قبل این برچسب‌ها را دارند.',
    changedMessageVerb: 'برچسب‌ها افزوده شدند به',
    unchangedMessageVerb: 'از قبل تمامی برچسب‌های انتخابی را داشتند',
  },
  remove: {
    idPrefix: 'bulk-remove-tags',
    title: 'حذف برچسب‌ها',
    submitLabel: 'حذف برچسب‌ها',
    submitVariant: 'danger',
    noChangeMessage: 'هیچ‌یک از سوالات انتخاب‌شده برچسب‌های مشخص‌شده را نداشتند.',
    changedMessageVerb: 'برچسب‌ها حذف شدند از',
    unchangedMessageVerb: 'فاقد برچسب‌های انتخابی بودند',
  },
};

function buildSuccessMessage({
  mode,
  changedCount,
  unchangedCount,
}: {
  mode: Mode;
  changedCount: number;
  unchangedCount: number;
}) {
  const config = MODE_CONFIG[mode];
  if (changedCount === 0) return config.noChangeMessage;

  const parts = [
    `${config.changedMessageVerb} ${changedCount} سوال.`,
  ];
  if (unchangedCount > 0) {
    parts.push(
      `${unchangedCount} سوال ${config.unchangedMessageVerb}.`,
    );
  }
  return parts.join(' ');
}

export function UpdateTagsModal({
  mode,
  show,
  onHide,
  selectedQuestions,
  questionIds,
  tags,
  urlPrefix,
  clearSelection,
  onActionSuccess,
}: {
  mode: Mode;
  show: boolean;
  onHide: () => void;
  selectedQuestions: SafeQuestionsPageData[];
  questionIds: string[];
  tags: PublicTag[];
  urlPrefix: string;
  clearSelection: () => void;
  onActionSuccess: (message: string) => void;
}) {
  const config = MODE_CONFIG[mode];
  const trpc = useTRPC();
  const invalidateQuestionsList = useInvalidateQuestionsList();

  const sortedTags = useMemo(() => [...tags].sort((a, b) => a.name.localeCompare(b.name)), [tags]);
  const removableTagNames = useMemo(
    () =>
      new Set(
        selectedQuestions
          .flatMap((question) => question.tags ?? [])
          .map((questionTag) => questionTag.name),
      ),
    [selectedQuestions],
  );
  const availableTags = useMemo(
    () =>
      mode === 'remove' ? sortedTags.filter((tag) => removableTagNames.has(tag.name)) : sortedTags,
    [mode, removableTagNames, sortedTags],
  );
  const availableTagNames = useMemo(
    () => new Set(availableTags.map((tag) => tag.name)),
    [availableTags],
  );
  const [selectedTagNames, setSelectedTagNames] = useState<Set<string>>(() => new Set());

  const mutationOptions =
    mode === 'add'
      ? trpc.questions.addTags.mutationOptions()
      : trpc.questions.removeTags.mutationOptions();

  const mutation = useMutation({
    ...mutationOptions,
    onSuccess: async ({ changedCount, unchangedCount }) => {
      await invalidateQuestionsList();
      onActionSuccess(buildSuccessMessage({ mode, changedCount, unchangedCount }));
      clearSelection();
      onHide();
    },
  });

  const appError = getAppError<QuestionsError['AddTags'] | QuestionsError['RemoveTags']>(
    mutation.error,
  );
  const selectedAvailableTagNames = [...selectedTagNames].filter((tag) =>
    availableTagNames.has(tag),
  );

  return (
    <Modal
      show={show}
      size="lg"
      aria-labelledby={`${config.idPrefix}-modal-title`}
      onHide={onHide}
      onExited={() => {
        mutation.reset();
        setSelectedTagNames(new Set());
      }}
      contentClassName="text-end"
      dir="rtl"
      style={{ fontFamily: 'var(--font-persian)' }}
    >
      <Modal.Header closeButton>
        <Modal.Title id={`${config.idPrefix}-modal-title`}>{config.title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <fieldset className="mb-3">
          <legend className="form-label">برچسب‌ها</legend>
          {sortedTags.length === 0 ? (
            <div className="text-muted">هیچ برچسبی برای این درس تعریف نشده است.</div>
          ) : availableTags.length === 0 ? (
            <div className="text-muted">هیچ‌یک از سوالات انتخابی برچسبی برای حذف کردن ندارند.</div>
          ) : (
            <div className="d-flex flex-column gap-1">
              {availableTags.map((tag, index) => {
                const checkboxId = `${config.idPrefix}-tag-${index}`;
                return (
                  <div key={tag.name} className="form-check">
                    <input
                      type="checkbox"
                      className="form-check-input"
                      id={checkboxId}
                      checked={selectedTagNames.has(tag.name)}
                      onChange={() => {
                        setSelectedTagNames((previous) => {
                          const next = new Set(previous);
                          if (next.has(tag.name)) {
                            next.delete(tag.name);
                          } else {
                            next.add(tag.name);
                          }
                          return next;
                        });
                      }}
                    />
                    <label className="form-check-label" htmlFor={checkboxId}>
                      <TagBadge tag={tag} />
                    </label>
                  </div>
                );
              })}
            </div>
          )}
        </fieldset>

        <SelectedQuestionList questions={selectedQuestions} />

        <BulkQuestionErrorAlert error={appError} urlPrefix={urlPrefix} />
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          انصراف
        </Button>
        <Button
          variant={config.submitVariant}
          disabled={selectedAvailableTagNames.length === 0 || mutation.isPending}
          onClick={() => mutation.mutate({ questionIds, tags: selectedAvailableTagNames })}
        >
          {mutation.isPending
            ? mode === 'add'
              ? 'در حال افزودن برچسب‌ها…'
              : 'در حال حذف برچسب‌ها…'
            : config.submitLabel}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
