import { type ChangeEvent } from 'react';
import { Alert, Button, Form } from 'react-bootstrap';
import {
  get,
  useController,
  useFieldArray,
  useFormContext,
  useFormState,
  useWatch,
} from 'react-hook-form';

import { RichSelect, type RichSelectItem } from '@prairielearn/ui';

import { MAX_ACCESS_CONTROL_PRAIRIETEST_EXAMS } from '../../../schemas/accessControl.js';

import { useAccessControlRuleEditable } from './AccessControlEditabilityContext.js';
import type { AccessControlFormData } from './types.js';

type AfterCompleteVisibilityMode =
  | 'show_questions_and_score'
  | 'show_score_only'
  | 'hide_questions_and_score';

const AFTER_COMPLETE_VISIBILITY_ITEMS: RichSelectItem<AfterCompleteVisibilityMode>[] = [
  {
    value: 'show_questions_and_score',
    label: 'نمایش سوالات و نمره',
    description:
      'دانشجویان پس از اتمام و تا زمانی که رزرو فعال است، سوالات، ارسال‌ها و نمره کل ارزیابی خود را می‌بینند',
  },
  {
    value: 'show_score_only',
    label: 'نمایش فقط نمره',
    description:
      'دانشجویان پس از اتمام و تا زمانی که رزرو فعال است، نمره کل ارزیابی خود را می‌بینند، اما سوالات و ارسال‌ها را نمی‌بینند',
  },
  {
    value: 'hide_questions_and_score',
    label: 'پنهان‌کردن سوالات و نمره',
    description:
      'دانشجویان پس از اتمام و تا زمانی که رزرو فعال است، سوالات، ارسال‌ها و نمره کل ارزیابی خود را نمی‌بینند',
  },
];

function getAfterCompleteVisibilityMode(
  questionsHidden: boolean,
  scoreHidden: boolean,
): AfterCompleteVisibilityMode {
  if (!questionsHidden) return 'show_questions_and_score';
  if (!scoreHidden) return 'show_score_only';
  return 'hide_questions_and_score';
}

function ExamAfterCompleteFields({ index }: { index: number }) {
  const ruleEditable = useAccessControlRuleEditable();
  const { field: questionsHiddenField } = useController<
    AccessControlFormData,
    `defaultRule.prairieTestExams.${number}.afterCompleteQuestionsHidden`
  >({
    name: `defaultRule.prairieTestExams.${index}.afterCompleteQuestionsHidden`,
  });
  const { field: scoreHiddenField } = useController<
    AccessControlFormData,
    `defaultRule.prairieTestExams.${number}.afterCompleteScoreHidden`
  >({
    name: `defaultRule.prairieTestExams.${index}.afterCompleteScoreHidden`,
  });
  const readOnly = useWatch<
    AccessControlFormData,
    `defaultRule.prairieTestExams.${number}.readOnly`
  >({
    name: `defaultRule.prairieTestExams.${index}.readOnly`,
  });

  const mode = getAfterCompleteVisibilityMode(questionsHiddenField.value, scoreHiddenField.value);
  const selectedDescription = AFTER_COMPLETE_VISIBILITY_ITEMS.find(
    (item) => item.value === mode,
  )?.description;

  const handleModeChange = (newMode: AfterCompleteVisibilityMode) => {
    questionsHiddenField.onChange(newMode !== 'show_questions_and_score');
    scoreHiddenField.onChange(newMode === 'hide_questions_and_score');
  };

  return (
    <div className="mt-3">
      <Form.Label className="fw-bold" htmlFor={`defaultRule-exam-after-complete-${index}`}>
        پس از اتمام
      </Form.Label>
      <RichSelect
        items={AFTER_COMPLETE_VISIBILITY_ITEMS}
        value={mode}
        aria-label="وضعیت نمایش پس از اتمام در طول رزرو"
        id={`defaultRule-exam-after-complete-${index}`}
        minWidth={300}
        disabled={!ruleEditable || readOnly}
        onChange={handleModeChange}
      />
      {!readOnly && selectedDescription && (
        <Form.Text className="text-muted d-block">{selectedDescription}</Form.Text>
      )}
      {readOnly && (
        <Form.Text className="text-muted d-block">
          سوالات، ارسال‌ها و نمره کل ارزیابی در طول رزروهای فقط-خواندنی همیشه نمایش داده می‌شوند.
        </Form.Text>
      )}
    </div>
  );
}

export function PrairieTestControlForm() {
  const ruleEditable = useAccessControlRuleEditable();
  const { register, setValue } = useFormContext<AccessControlFormData>();

  const {
    fields: examFields,
    append: appendExam,
    remove: removeExam,
  } = useFieldArray<AccessControlFormData, 'defaultRule.prairieTestExams'>({
    name: 'defaultRule.prairieTestExams',
  });

  const { errors } = useFormState();

  const addExamDisabled = examFields.length >= MAX_ACCESS_CONTROL_PRAIRIETEST_EXAMS;
  const addExamDisabledTitle = addExamDisabled
    ? `یک قانون می‌تواند حداکثر ${MAX_ACCESS_CONTROL_PRAIRIETEST_EXAMS} آزمون PrairieTest داشته باشد.`
    : undefined;

  const getExamUuidError = (index: number): string | undefined => {
    return get(errors, `defaultRule.prairieTestExams.${index}.examUuid`)?.message;
  };

  return (
    <div className="mt-2">
      {examFields.map((field, index) => (
        <div
          key={field.id}
          className="mb-3 border rounded p-3"
          style={{ borderColor: 'var(--bs-border-color)' }}
        >
          <Form.Group className="mb-3" controlId={`defaultRule-exam-uuid-${index}`}>
            <div className="d-flex justify-content-between align-items-center mb-2">
              <Form.Label className="mb-0">شناسه یکتای آزمون (Exam UUID)</Form.Label>
              {ruleEditable && (
                <Button
                  size="sm"
                  variant="outline-danger"
                  aria-label={`حذف آزمون ${index + 1}`}
                  onClick={() => removeExam(index)}
                >
                  <i className="bi bi-trash me-1" aria-hidden="true" />
                  حذف
                </Button>
              )}
            </div>
            <Form.Control
              type="text"
              isInvalid={!!getExamUuidError(index)}
              aria-invalid={!!getExamUuidError(index)}
              aria-errormessage={
                getExamUuidError(index) ? `defaultRule-exam-uuid-${index}-error` : undefined
              }
              aria-describedby={`defaultRule-exam-uuid-${index}-help`}
              defaultValue=""
              disabled={!ruleEditable}
              placeholder="مثلاً 11e89892-3eff-4d7f-90a2-221372f14e5c"
              {...register(`defaultRule.prairieTestExams.${index}.examUuid`)}
            />
            {getExamUuidError(index) && (
              <Form.Text
                id={`defaultRule-exam-uuid-${index}-error`}
                className="text-danger d-block"
                role="alert"
              >
                {getExamUuidError(index)}
              </Form.Text>
            )}
            <Form.Text id={`defaultRule-exam-uuid-${index}-help`} className="text-muted">
              این UUID را می‌توانید در تنظیمات آزمون در PrairieTest پیدا کنید.
            </Form.Text>
          </Form.Group>
          <Form.Group>
            <Form.Check
              type="checkbox"
              id={`defaultRule-exam-readonly-${index}`}
              label="حالت فقط-خواندنی"
              defaultChecked={false}
              disabled={!ruleEditable}
              {...register(`defaultRule.prairieTestExams.${index}.readOnly`, {
                onChange: (e: ChangeEvent<HTMLInputElement>) => {
                  if (e.target.checked) {
                    setValue(
                      `defaultRule.prairieTestExams.${index}.afterCompleteQuestionsHidden`,
                      false,
                      { shouldDirty: true, shouldValidate: true },
                    );
                    setValue(
                      `defaultRule.prairieTestExams.${index}.afterCompleteScoreHidden`,
                      false,
                      {
                        shouldDirty: true,
                        shouldValidate: true,
                      },
                    );
                  }
                },
              })}
              aria-describedby={`defaultRule-exam-readonly-${index}-help`}
            />
            <Form.Text id={`defaultRule-exam-readonly-${index}-help`} className="text-muted">
              در طول رزرو فقط-خواندنی، دانشجویان می‌توانند ارسال‌های قبلی خود را ببینند، اما
              نمی‌توانند پاسخ جدیدی ارسال کنند یا در صورت شروع نکردن، ارزیابی را آغاز کنند.
            </Form.Text>
          </Form.Group>
          <ExamAfterCompleteFields index={index} />
        </div>
      ))}
      {ruleEditable && (
        <>
          {addExamDisabledTitle && (
            <Alert variant="secondary" className="py-2 mb-2">
              {addExamDisabledTitle}
            </Alert>
          )}
          <Button
            size="sm"
            variant="outline-primary"
            disabled={addExamDisabled}
            title={addExamDisabledTitle}
            onClick={() => {
              appendExam({
                examUuid: '',
                readOnly: false,
                afterCompleteQuestionsHidden: false,
                afterCompleteScoreHidden: false,
              });
            }}
          >
            <i className="bi bi-plus-circle me-1" aria-hidden="true" />
            افزودن آزمون
          </Button>
        </>
      )}
    </div>
  );
}
