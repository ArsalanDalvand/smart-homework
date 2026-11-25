import { Alert, Button, Form } from 'react-bootstrap';
import { get, useController, useFormState, useWatch } from 'react-hook-form';

import { OverlayTrigger, RichSelect, type RichSelectItem } from '@prairielearn/ui';

import { useAccessControlRuleEditable } from './AccessControlEditabilityContext.js';
import { FieldWrapper } from './FieldWrapper.js';
import { useOverrideField } from './hooks/useOverrideField.js';
import {
  type AccessControlFormData,
  type DefaultRuleData,
  type QuestionVisibilityValue,
  type ScoreVisibilityValue,
} from './types.js';
import { endOfDayDatetime, startOfDayDatetime, tomorrowDate } from './utils/dateUtils.js';
import { DATE_REQUIRED_MESSAGE, isDateFieldEmpty } from './validation.js';

type HideQuestionsMode =
  | 'show_questions'
  | 'hide_questions_forever'
  | 'hide_questions_until_date'
  | 'hide_questions_between_dates';
type HideScoreMode = 'show_score' | 'hide_score_forever' | 'hide_score_until_date';

const QUESTION_VISIBILITY_ITEMS: RichSelectItem<HideQuestionsMode>[] = [
  {
    value: 'hide_questions_forever',
    label: 'پنهان‌کردن همیشگی سوالات',
    description: 'سوالات و پاسخ‌های ارسال‌شده پس از پایان آزمون هرگز قابل مشاهده نخواهند بود',
  },
  {
    value: 'show_questions',
    label: 'نمایش سوالات پس از پایان',
    description:
      'دانشجویان می‌توانند بلافاصله پس از اتمام ارزیابی، سوالات و پاسخ‌های ارسال‌شده خود را مرور کنند',
  },
  {
    value: 'hide_questions_between_dates',
    label: 'نمایش سوالات بین دو تاریخ',
    description:
      'سوالات و پاسخ‌های ارسال‌شده بین این دو تاریخ قابل مشاهده بوده و پیش و پس از آن پنهان هستند',
  },
  {
    value: 'hide_questions_until_date',
    label: 'نمایش سوالات پس از تاریخ مشخص',
    description:
      'سوالات و پاسخ‌های ارسال‌شده پس از اتمام پنهان بوده و از این تاریخ به بعد قابل مشاهده می‌شوند',
  },
];

const SCORE_VISIBILITY_ITEMS: RichSelectItem<HideScoreMode>[] = [
  {
    value: 'hide_score_forever',
    label: 'پنهان‌کردن همیشگی نمره',
    description: 'نمره کل ارزیابی پس از اتمام هرگز قابل مشاهده نخواهد بود',
  },
  {
    value: 'show_score',
    label: 'نمایش نمره پس از پایان',
    description:
      'دانشجویان می‌توانند بلافاصله پس از اتمام ارزیابی نمره کل خود را مشاهده کنند',
  },
  {
    value: 'hide_score_until_date',
    label: 'نمایش نمره پس از تاریخ مشخص',
    description:
      'نمره کل ارزیابی پس از اتمام پنهان بوده و از این تاریخ به بعد قابل مشاهده می‌شود',
  },
];

function defaultRuleHasCompletionMechanism(
  rule: Pick<
    DefaultRuleData,
    'dateControlEnabled' | 'due' | 'lateDeadlines' | 'durationMinutes' | 'prairieTestExams'
  > & { hasExamAutoClose: boolean },
): boolean {
  const hasDateControlMechanism =
    rule.dateControlEnabled &&
    (rule.due.date !== null || rule.lateDeadlines.length > 0 || rule.durationMinutes !== null);
  return hasDateControlMechanism || rule.prairieTestExams.length > 0 || rule.hasExamAutoClose;
}

function getHideQuestionsMode(value: QuestionVisibilityValue): HideQuestionsMode {
  if (!value.hidden) return 'show_questions';
  if (value.visibleFromDate === undefined) return 'hide_questions_forever';
  if (value.visibleUntilDate === undefined) return 'hide_questions_until_date';
  return 'hide_questions_between_dates';
}

function getHideScoreMode(value: ScoreVisibilityValue): HideScoreMode {
  if (!value.hidden) return 'show_score';
  if (value.visibleFromDate === undefined) return 'hide_score_forever';
  return 'hide_score_until_date';
}

function QuestionVisibilityInput({
  value,
  onChange,
  idPrefix,
  hasPrairieTest = false,
  hasCompletionMechanism = true,
  error,
  visibleFromDateError,
  visibleUntilDateError,
  displayTimezone,
}: {
  value: QuestionVisibilityValue;
  onChange: (value: QuestionVisibilityValue) => void;
  idPrefix: string;
  hasPrairieTest?: boolean;
  hasCompletionMechanism?: boolean;
  error?: string;
  visibleFromDateError?: string;
  visibleUntilDateError?: string;
  displayTimezone: string;
}) {
  const ruleEditable = useAccessControlRuleEditable();
  const hideQuestionsMode = getHideQuestionsMode(value);
  const selectedDescription = QUESTION_VISIBILITY_ITEMS.find(
    (item) => item.value === hideQuestionsMode,
  )?.description;

  const handleModeChange = (newMode: HideQuestionsMode) => {
    switch (newMode) {
      case 'show_questions':
        onChange({ hidden: false });
        break;
      case 'hide_questions_forever':
        onChange({ hidden: true });
        break;
      case 'hide_questions_between_dates': {
        const tomorrow = tomorrowDate(displayTimezone);
        onChange({
          hidden: true,
          visibleFromDate: startOfDayDatetime(tomorrow),
          visibleUntilDate: endOfDayDatetime(tomorrow.add({ weeks: 2 })),
        });
        break;
      }
      case 'hide_questions_until_date': {
        const tomorrow = tomorrowDate(displayTimezone);
        onChange({ hidden: true, visibleFromDate: startOfDayDatetime(tomorrow) });
        break;
      }
    }
  };

  const visibleFromDateEmpty = isDateFieldEmpty(value.visibleFromDate);
  const visibleFromDateInvalid = visibleFromDateEmpty || !!visibleFromDateError;
  const visibleUntilDateEmpty = isDateFieldEmpty(value.visibleUntilDate);
  const visibleUntilDateInvalid = visibleUntilDateEmpty || !!visibleUntilDateError;

  return (
    <Form.Group className="d-flex flex-column gap-3">
      <div>
        <RichSelect
          items={QUESTION_VISIBILITY_ITEMS}
          value={hideQuestionsMode}
          aria-label="وضعیت نمایش سوالات"
          id={`${idPrefix}-question-visibility-mode`}
          minWidth={300}
          disabled={!ruleEditable}
          errorMessage={error}
          onChange={handleModeChange}
        />
        {selectedDescription && (
          <Form.Text className="text-muted d-block">{selectedDescription}</Form.Text>
        )}
      </div>
      {hideQuestionsMode === 'hide_questions_between_dates' && (
        <div className="d-flex flex-column gap-3">
          <div>
            <Form.Label htmlFor={`${idPrefix}-show-questions-between-start`}>
              نمایش سوالات از تاریخ
            </Form.Label>
            <Form.Control
              id={`${idPrefix}-show-questions-between-start`}
              type="datetime-local"
              step={1}
              value={value.visibleFromDate ?? ''}
              isInvalid={visibleFromDateInvalid}
              disabled={!ruleEditable}
              aria-invalid={visibleFromDateInvalid}
              aria-errormessage={
                visibleFromDateInvalid
                  ? `${idPrefix}-show-questions-between-start-error`
                  : undefined
              }
              onChange={({ currentTarget }) =>
                onChange({
                  hidden: true,
                  visibleFromDate: currentTarget.value,
                  visibleUntilDate: value.visibleUntilDate,
                })
              }
            />
            {visibleFromDateInvalid && (
              <Form.Control.Feedback
                type="invalid"
                id={`${idPrefix}-show-questions-between-start-error`}
              >
                {visibleFromDateEmpty ? DATE_REQUIRED_MESSAGE : visibleFromDateError}
              </Form.Control.Feedback>
            )}
          </div>
          <div>
            <Form.Label htmlFor={`${idPrefix}-hide-questions-between-end`}>
              پنهان‌کردن مجدد سوالات در تاریخ
            </Form.Label>
            <Form.Control
              id={`${idPrefix}-hide-questions-between-end`}
              type="datetime-local"
              step={1}
              value={value.visibleUntilDate ?? ''}
              isInvalid={visibleUntilDateInvalid}
              disabled={!ruleEditable}
              aria-invalid={visibleUntilDateInvalid}
              aria-errormessage={
                visibleUntilDateInvalid ? `${idPrefix}-hide-questions-between-end-error` : undefined
              }
              onChange={({ currentTarget }) =>
                onChange({
                  hidden: true,
                  visibleFromDate: value.visibleFromDate,
                  visibleUntilDate: currentTarget.value,
                })
              }
            />
            {visibleUntilDateInvalid && (
              <Form.Control.Feedback
                type="invalid"
                id={`${idPrefix}-hide-questions-between-end-error`}
              >
                {visibleUntilDateEmpty ? DATE_REQUIRED_MESSAGE : visibleUntilDateError}
              </Form.Control.Feedback>
            )}
          </div>
        </div>
      )}
      {hideQuestionsMode === 'hide_questions_until_date' && (
        <div>
          <Form.Control
            id={`${idPrefix}-show-questions-date`}
            type="datetime-local"
            step={1}
            aria-label="نمایش سوالات در تاریخ"
            value={value.visibleFromDate ?? ''}
            isInvalid={visibleFromDateInvalid}
            disabled={!ruleEditable}
            aria-invalid={visibleFromDateInvalid}
            aria-errormessage={
              visibleFromDateInvalid ? `${idPrefix}-show-questions-date-error` : undefined
            }
            onChange={({ currentTarget }) =>
              onChange({ hidden: true, visibleFromDate: currentTarget.value })
            }
          />
          {visibleFromDateInvalid && (
            <Form.Control.Feedback type="invalid" id={`${idPrefix}-show-questions-date-error`}>
              {visibleFromDateEmpty ? DATE_REQUIRED_MESSAGE : visibleFromDateError}
            </Form.Control.Feedback>
          )}
        </div>
      )}
      {hasPrairieTest && hideQuestionsMode === 'show_questions' && (
        <Alert variant="warning" className="mb-0">
          نمایش سوالات پس از اتمام هنگام اتصال به آزمون‌های PrairieTest توصیه نمی‌شود. دانشجویان ممکن
          است بتوانند محتوای آزمون را پس از بسته شدن ارزیابی خود مشاهده کنند.
        </Alert>
      )}
      {!hasPrairieTest && hasCompletionMechanism && hideQuestionsMode !== 'show_questions' && (
        <Alert variant="info" className="mb-0">
          اگر این ارزیابی امتحان نیست، نمایش سوالات را روی «نمایش سوالات پس از پایان» قرار دهید تا
          دانشجویان بتوانند کار خود را مرور کنند.
        </Alert>
      )}
    </Form.Group>
  );
}

function ScoreVisibilityInput({
  value,
  onChange,
  idPrefix,
  error,
  visibleFromDateError,
  displayTimezone,
}: {
  value: ScoreVisibilityValue;
  onChange: (value: ScoreVisibilityValue) => void;
  idPrefix: string;
  error?: string;
  visibleFromDateError?: string;
  displayTimezone: string;
}) {
  const ruleEditable = useAccessControlRuleEditable();
  const hideScoreMode = getHideScoreMode(value);
  const selectedDescription = SCORE_VISIBILITY_ITEMS.find(
    (item) => item.value === hideScoreMode,
  )?.description;

  const handleModeChange = (newMode: HideScoreMode) => {
    switch (newMode) {
      case 'show_score':
        onChange({ hidden: false });
        break;
      case 'hide_score_forever':
        onChange({ hidden: true });
        break;
      case 'hide_score_until_date': {
        const tomorrow = tomorrowDate(displayTimezone);
        onChange({ hidden: true, visibleFromDate: startOfDayDatetime(tomorrow) });
        break;
      }
    }
  };

  const visibleFromDateEmpty = isDateFieldEmpty(value.visibleFromDate);
  const visibleFromDateInvalid = visibleFromDateEmpty || !!visibleFromDateError;

  return (
    <Form.Group className="d-flex flex-column gap-3">
      <div>
        <RichSelect
          items={SCORE_VISIBILITY_ITEMS}
          value={hideScoreMode}
          aria-label="وضعیت نمایش نمره"
          id={`${idPrefix}-score-visibility-mode`}
          minWidth={300}
          disabled={!ruleEditable}
          errorMessage={error}
          onChange={handleModeChange}
        />
        {selectedDescription && (
          <Form.Text className="text-muted d-block">{selectedDescription}</Form.Text>
        )}
      </div>
      {hideScoreMode === 'hide_score_until_date' && (
        <div>
          <Form.Control
            id={`${idPrefix}-show-score-date`}
            type="datetime-local"
            step={1}
            aria-label="نمایش نمره در تاریخ"
            value={value.visibleFromDate ?? ''}
            isInvalid={visibleFromDateInvalid}
            disabled={!ruleEditable}
            aria-invalid={visibleFromDateInvalid}
            aria-errormessage={
              visibleFromDateInvalid ? `${idPrefix}-show-score-date-error` : undefined
            }
            onChange={({ currentTarget }) =>
              onChange({ hidden: true, visibleFromDate: currentTarget.value })
            }
          />
          {visibleFromDateInvalid && (
            <Form.Control.Feedback type="invalid" id={`${idPrefix}-show-score-date-error`}>
              {visibleFromDateEmpty ? DATE_REQUIRED_MESSAGE : visibleFromDateError}
            </Form.Control.Feedback>
          )}
        </div>
      )}
    </Form.Group>
  );
}

const infoPopoverConfig = {
  header: 'چه زمانی ارزیابی «تکمیل‌شده» محسوب می‌شود؟',
  body: (
    <>
      <p>
        این تنظیمات زمانی اعمال می‌شوند که دیگر امکان ارسال پاسخ وجود نداشته باشد: پس از ددلاین
        نهایی، هنگام اتمام محدودیت زمانی، یا زمانی که نمونه ارزیابی دانشجو به صورت دستی یا توسط
        بسته‌شدن خودکار امتحان بسته شود. اگر ارسال پس از ددلاین مجاز باشد، این تنظیمات تنها پس از
        بسته شدن نمونه ارزیابی دانشجو یا پایان محدودیت زمانی اعمال می‌شوند.
      </p>
      <p>
        زمان تکمیل ممکن است بین دانشجویان بر اساس زمان شروع یا شرایط ویژه آن‌ها متفاوت باشد.
      </p>
      <p>
        زمانی که دانشجو یک رزرو فعال در PrairieTest دارد، تنظیمات هر امتحان در PrairieTest
        وضعیت نمایش را تعیین می‌کند.
      </p>
    </>
  ),
  props: { id: 'after-complete-info-popover' },
};

function AfterCompleteCard({
  title = 'پس از اتمام',
  hasPrairieTest,
  children,
}: {
  title?: string;
  hasPrairieTest: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="section-header mb-3">
        <div className="d-flex align-items-center">
          <strong>{title}</strong>
          <OverlayTrigger trigger="click" placement="auto" popover={infoPopoverConfig}>
            <Button
              variant="link"
              size="sm"
              className="ms-2 p-0"
              aria-label="چه زمانی ارزیابی تکمیل‌شده محسوب می‌شود؟"
            >
              <i className="bi bi-info-circle" aria-hidden="true" />
            </Button>
          </OverlayTrigger>
        </div>
        <div className="text-muted small mt-1">
          کنترل نمایش سوالات و نمره پس از آنکه دانشجویان دیگر نتوانند پاسخی برای ارزیابی ارسال
          کنند.
        </div>
      </div>
      <div className="d-flex flex-column gap-3">
        {hasPrairieTest && (
          <Alert variant="info" className="mb-0">
            در طول رزروهای فعال PrairieTest، تنظیمات نمایش خود امتحان اعمال می‌شود.
          </Alert>
        )}
        {children}
      </div>
    </div>
  );
}

export function DefaultAfterCompleteForm({
  title,
  displayTimezone,
  isExam,
  hasExamAutoClose,
}: {
  title?: string;
  displayTimezone: string;
  isExam: boolean;
  hasExamAutoClose: boolean;
}) {
  const { field: qvField } = useController<AccessControlFormData, 'defaultRule.questionVisibility'>(
    {
      name: 'defaultRule.questionVisibility',
    },
  );

  const { field: svField } = useController<AccessControlFormData, 'defaultRule.scoreVisibility'>({
    name: 'defaultRule.scoreVisibility',
  });

  const { errors } = useFormState<AccessControlFormData>();
  const qvVisibleFromError: string | undefined = get(
    errors,
    'defaultRule.questionVisibility.visibleFromDate',
  )?.message;
  const qvError: string | undefined = get(errors, 'defaultRule.questionVisibility')?.message;
  const visibleUntilDateError: string | undefined = get(
    errors,
    'defaultRule.questionVisibility.visibleUntilDate',
  )?.message;
  const svVisibleFromError: string | undefined = get(
    errors,
    'defaultRule.scoreVisibility.visibleFromDate',
  )?.message;
  const svError: string | undefined = get(errors, 'defaultRule.scoreVisibility')?.message;

  const dateControlEnabled = useWatch<AccessControlFormData, 'defaultRule.dateControlEnabled'>({
    name: 'defaultRule.dateControlEnabled',
  });
  const due = useWatch<AccessControlFormData, 'defaultRule.due'>({ name: 'defaultRule.due' });
  const lateDeadlines = useWatch<AccessControlFormData, 'defaultRule.lateDeadlines'>({
    name: 'defaultRule.lateDeadlines',
  });
  const durationMinutes = useWatch<AccessControlFormData, 'defaultRule.durationMinutes'>({
    name: 'defaultRule.durationMinutes',
  });
  const prairieTestExams = useWatch<AccessControlFormData, 'defaultRule.prairieTestExams'>({
    name: 'defaultRule.prairieTestExams',
  });
  const hasPrairieTest = prairieTestExams.length > 0;
  const hasCompletionMechanism = defaultRuleHasCompletionMechanism({
    dateControlEnabled,
    due,
    lateDeadlines,
    durationMinutes,
    prairieTestExams,
    hasExamAutoClose,
  });
  const automaticCompletionMechanisms = isExam
    ? 'ددلاین اصلی، محدودیت زمانی، ددلاین تاخیر، آزمون PrairieTest یا بسته‌شدن خودکار امتحان'
    : 'ددلاین اصلی، محدودیت زمانی، ددلاین تاخیر یا آزمون PrairieTest';

  return (
    <AfterCompleteCard title={title} hasPrairieTest={hasPrairieTest}>
      {!hasCompletionMechanism && (
        <Alert variant="info" className="mb-0">
          بدون {automaticCompletionMechanisms}، این تنظیمات تنها در صورتی اعمال می‌شوند که مدرس به
          صورت دستی نمونه ارزیابی دانشجو را ببندد.
        </Alert>
      )}
      <div>
        <Form.Label className="fw-bold" htmlFor="defaultRule-score-visibility-mode">
          نمایش نمره پس از اتمام
        </Form.Label>
        <ScoreVisibilityInput
          value={svField.value}
          idPrefix="defaultRule"
          error={svError}
          visibleFromDateError={svVisibleFromError}
          displayTimezone={displayTimezone}
          onChange={svField.onChange}
        />
      </div>
      <div>
        <Form.Label className="fw-bold" htmlFor="defaultRule-question-visibility-mode">
          نمایش سوالات پس از اتمام
        </Form.Label>
        <QuestionVisibilityInput
          value={qvField.value}
          idPrefix="defaultRule"
          hasPrairieTest={hasPrairieTest}
          hasCompletionMechanism={hasCompletionMechanism}
          error={qvError}
          visibleFromDateError={qvVisibleFromError}
          visibleUntilDateError={visibleUntilDateError}
          displayTimezone={displayTimezone}
          onChange={qvField.onChange}
        />
      </div>
    </AfterCompleteCard>
  );
}

export function OverrideAfterCompleteForm({
  index,
  title,
  displayTimezone,
}: {
  index: number;
  title?: string;
  displayTimezone: string;
}) {
  const defaultRuleQV = useWatch<AccessControlFormData, 'defaultRule.questionVisibility'>({
    name: 'defaultRule.questionVisibility',
  });
  const defaultRuleSV = useWatch<AccessControlFormData, 'defaultRule.scoreVisibility'>({
    name: 'defaultRule.scoreVisibility',
  });
  const prairieTestExams = useWatch<AccessControlFormData, 'defaultRule.prairieTestExams'>({
    name: 'defaultRule.prairieTestExams',
  });
  const hasPrairieTest = prairieTestExams.length > 0;

  const { errors } = useFormState<AccessControlFormData>();
  const qvVisibleFromError: string | undefined = get(
    errors,
    `overrides.${index}.questionVisibility.visibleFromDate`,
  )?.message;
  const qvError: string | undefined = get(errors, `overrides.${index}.questionVisibility`)?.message;
  const visibleUntilDateError: string | undefined = get(
    errors,
    `overrides.${index}.questionVisibility.visibleUntilDate`,
  )?.message;
  const svVisibleFromError: string | undefined = get(
    errors,
    `overrides.${index}.scoreVisibility.visibleFromDate`,
  )?.message;
  const svError: string | undefined = get(errors, `overrides.${index}.scoreVisibility`)?.message;

  const {
    isOverridden: qvOverridden,
    addOverride: addQvOverride,
    removeOverride: removeQvOverride,
  } = useOverrideField(index, 'questionVisibility');
  const {
    isOverridden: svOverridden,
    addOverride: addSvOverride,
    removeOverride: removeSvOverride,
  } = useOverrideField(index, 'scoreVisibility');

  const { field: qvField } = useController<
    AccessControlFormData,
    `overrides.${number}.questionVisibility`
  >({
    name: `overrides.${index}.questionVisibility`,
  });
  const { field: svField } = useController<
    AccessControlFormData,
    `overrides.${number}.scoreVisibility`
  >({
    name: `overrides.${index}.scoreVisibility`,
  });

  return (
    <AfterCompleteCard title={title} hasPrairieTest={hasPrairieTest}>
      <div>
        <FieldWrapper
          isOverridden={svOverridden}
          label="نمایش نمره پس از اتمام"
          onOverride={() => {
            svField.onChange({ ...defaultRuleSV });
            addSvOverride();
          }}
          onRemoveOverride={removeSvOverride}
        >
          <ScoreVisibilityInput
            value={svField.value}
            idPrefix={`overrides-${index}`}
            error={svError}
            visibleFromDateError={svVisibleFromError}
            displayTimezone={displayTimezone}
            onChange={svField.onChange}
          />
        </FieldWrapper>
      </div>
      <div>
        <FieldWrapper
          isOverridden={qvOverridden}
          label="نمایش سوالات پس از اتمام"
          onOverride={() => {
            qvField.onChange({ ...defaultRuleQV });
            addQvOverride();
          }}
          onRemoveOverride={removeQvOverride}
        >
          <QuestionVisibilityInput
            value={qvField.value}
            idPrefix={`overrides-${index}`}
            hasPrairieTest={hasPrairieTest}
            error={qvError}
            visibleFromDateError={qvVisibleFromError}
            visibleUntilDateError={visibleUntilDateError}
            displayTimezone={displayTimezone}
            onChange={qvField.onChange}
          />
        </FieldWrapper>
      </div>
    </AfterCompleteCard>
  );
}
