import clsx from 'clsx';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';

import { CalculatorPreviewButton } from '../../../../components/CalculatorPreviewButton.js';
import { CalculatorTypeInput } from '../../../../components/CalculatorTypeInput.js';
import {
  type CalculatorType,
  type EnumAssessmentTool,
  EnumAssessmentToolSchema,
} from '../../../../schemas/infoAssessment.js';
import type { DetailState, ZoneAssessmentForm } from '../../types.js';
import {
  coerceToBoolean,
  coerceToNumber,
  coerceToOptionalString,
  commentToString,
  makeResetAndSave,
  parseCommentValue,
} from '../../utils/formHelpers.js';
import {
  computeZoneQuestionCount,
  getZoneMixedToolsWarning,
  getZonePointsMismatch,
  hasZoneChooseExceedsCount,
  validatePositiveInteger,
} from '../../utils/questions.js';
import { useAutoSave } from '../../utils/useAutoSave.js';

import { AdvancedFields, type AdvancedFieldsInheritance } from './AdvancedFields.js';
import { DetailSectionHeader } from './DetailSectionHeader.js';
import { FormField } from './FormField.js';
import { InheritableCheckboxField } from './InheritableCheckboxField.js';
import { InheritableRolesField } from './InheritableRolesField.js';

type ToolFormFields = Record<`tool_${EnumAssessmentTool}`, boolean | undefined>;

interface ZoneFormData extends ToolFormFields {
  title: string;
  calculatorType?: CalculatorType;
  maxPoints?: number;
  numberChoose?: number;
  bestQuestions?: number;
  lockpoint?: boolean;
  comment?: string;
  advanceScorePerc?: number;
  gradeRateMinutes?: number;
  allowRealTimeGrading?: boolean;
  canView?: string[];
  canSubmit?: string[];
}

export function ZoneDetailPanel({
  zone,
  zones,
  zoneIndex,
  idPrefix,
  state,
  onUpdate,
  onFormValidChange,
}: {
  zone: ZoneAssessmentForm;
  zones: ZoneAssessmentForm[];
  zoneIndex: number;
  idPrefix: string;
  state: DetailState;
  onUpdate: (zoneTrackingId: string, zone: Partial<ZoneAssessmentForm>) => void;
  onFormValidChange: (isValid: boolean) => void;
}) {
  const {
    editMode,
    assessmentType,
    assessmentDefaults,
    assessmentToolDefaults,
    assessmentCalculatorType,
    groupsConfigured,
    groupRoles,
    assessmentCanView,
    assessmentCanSubmit,
    groupsPageUrl,
  } = state;
  const formValues: ZoneFormData = {
    title: zone.title ?? '',
    calculatorType: zone.tools?.calculator?.type,
    maxPoints: zone.maxPoints ?? undefined,
    numberChoose: zone.numberChoose ?? undefined,
    bestQuestions: zone.bestQuestions ?? undefined,
    lockpoint: zone.lockpoint,
    comment: commentToString(zone.comment),
    advanceScorePerc: zone.advanceScorePerc ?? undefined,
    gradeRateMinutes: zone.gradeRateMinutes ?? undefined,
    // We do this so that `isDirty = false` when the value is inherited.
    allowRealTimeGrading: zone.allowRealTimeGrading ?? undefined,
    canView: zone.canView,
    canSubmit: zone.canSubmit,
    ...(Object.fromEntries(
      EnumAssessmentToolSchema.options.map((tool) => [
        `tool_${tool}` as const,
        zone.tools?.[tool] != null ? zone.tools[tool].enabled : undefined,
      ]),
    ) as ToolFormFields),
  };

  const {
    register,
    getValues,
    watch,
    setValue,
    trigger,
    formState: { errors, isDirty, isValid },
  } = useForm<ZoneFormData>({
    mode: 'onChange',
    values: formValues,
    // Prevent autosave from clobbering in-progress typing. Without this,
    // the autosave feedback loop (edit → save → parent state update →
    // values prop change → form reset) resets the input mid-keystroke.
    // This is safe because the only source of values changes while the
    // panel is open is autosave; switching entities remounts the component.
    resetOptions: { keepDirtyValues: true, keepErrors: true },
  });

  const zoneQuestionCount = computeZoneQuestionCount(zone.questions);

  // Revalidate fields that depend on external zone state (question count, etc.)
  // whenever those dependencies change. This also handles initial mount so that
  // pre-existing invalid values (e.g. from JSON) are flagged immediately.
  useEffect(() => {
    void trigger().then((valid) => {
      onFormValidChange(valid);
    });
  }, [zoneQuestionCount, trigger, onFormValidChange]);

  const handleSave = useCallback(
    (data: ZoneFormData) => {
      const tools: ZoneAssessmentForm['tools'] = {};
      let hasToolOverride = false;
      for (const tool of EnumAssessmentToolSchema.options) {
        const value = coerceToBoolean(data[`tool_${tool}`]);
        if (value != null) {
          tools[tool] = { enabled: value, type: data.calculatorType };
          hasToolOverride = true;
        }
      }

      onUpdate(zone.trackingId, {
        title: data.title || undefined,
        maxPoints: data.maxPoints,
        numberChoose: data.numberChoose,
        bestQuestions: data.bestQuestions,
        lockpoint: data.lockpoint,
        comment: parseCommentValue(data.comment),
        advanceScorePerc: data.advanceScorePerc,
        gradeRateMinutes: data.gradeRateMinutes,
        allowRealTimeGrading: data.allowRealTimeGrading,
        canView: data.canView,
        canSubmit: data.canSubmit,
        tools: hasToolOverride ? tools : undefined,
      });
    },
    [onUpdate, zone.trackingId],
  );

  const resetAndSave = useMemo(
    () => makeResetAndSave(handleSave, getValues),
    [handleSave, getValues],
  );

  useAutoSave({ isDirty, isValid, getValues, onSave: handleSave, watch, trigger });

  useEffect(() => {
    // oxlint-disable-next-line react-you-might-not-need-an-effect/no-pass-data-to-parent
    onFormValidChange(isValid);
  }, [isValid, onFormValidChange]);

  const advancedInheritance: AdvancedFieldsInheritance = {
    parentAdvanceScorePerc: assessmentDefaults.advanceScorePerc,
    parentGradeRateMinutes: assessmentDefaults.gradeRateMinutes,
    parentAllowRealTimeGrading: assessmentDefaults.allowRealTimeGrading,
    parentForceMaxPoints: undefined,
    advanceScorePercFromLabel: 'assessment',
    gradeRateMinutesFromLabel: 'assessment',
    allowRealTimeGradingFromLabel: 'assessment',
    forceMaxPointsFromLabel: 'assessment',
    watch,
    setValue,
    resetAndSave,
  };

  const Wrapper = editMode ? 'div' : 'dl';

  const [overriddenTools, setOverriddenTools] = useState(
    () => new Set(EnumAssessmentToolSchema.options.filter((tool) => zone.tools?.[tool] != null)),
  );

  const watchedCanView = watch('canView');
  const watchedCanSubmit = watch('canSubmit');
  const canViewOverridden = watchedCanView != null;
  const canSubmitOverridden = watchedCanSubmit != null;
  const hasRoles = groupRoles.length > 0;

  const zonePointsMismatch = getZonePointsMismatch(zone, assessmentType);
  const zoneChooseExceeds = hasZoneChooseExceedsCount(zone);
  const mixedToolsWarning = getZoneMixedToolsWarning({ zone, zones, assessmentToolDefaults });

  return (
    <div className="p-3">
      {zonePointsMismatch && (
        <div className="alert alert-warning small mb-3" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-1" aria-hidden="true" />
          {zonePointsMismatch.body}
        </div>
      )}
      {zoneChooseExceeds && (
        <div className="alert alert-warning small mb-3" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-1" aria-hidden="true" />
          تعداد انتخاب یا بهترین سوالات از تعداد سوالات موجود در این بخش بیشتر است.
        </div>
      )}
      <div className="text-muted small">
        {zoneQuestionCount} سوال قابل انتخاب در بخش
      </div>

      <DetailSectionHeader>تنظیمات</DetailSectionHeader>

      <Wrapper className={clsx(!editMode && 'mb-0')}>
        <FormField
          editMode={editMode}
          id={`${idPrefix}-title`}
          label="عنوان"
          viewValue={zone.title || <span className="text-muted">بدون عنوان</span>}
          helpText="نام نمایشی برای دانشجویان (اختیاری)."
        >
          {(aria) => (
            <input
              type="text"
              className="form-control form-control-sm"
              {...aria.inputProps}
              {...register('title')}
            />
          )}
        </FormField>

        <FormField
          editMode={editMode}
          id={`${idPrefix}-maxPoints`}
          label="حداکثر امتیاز"
          viewValue={zone.maxPoints}
          error={errors.maxPoints}
          helpText="حداکثر مجموع امتیاز از این بخش که در ارزیابی محاسبه می‌شود (برای نامحدود خالی بگذارید)."
          hideWhenEmpty
        >
          {(aria) => (
            <input
              type="number"
              step="any"
              className={clsx('form-control form-control-sm', aria.errorClass)}
              {...aria.inputProps}
              {...register('maxPoints', {
                setValueAs: coerceToNumber,
                validate: (v) => {
                  if (v != null && v < 0) return 'حداکثر امتیاز باید نامنفی باشد.';
                },
              })}
            />
          )}
        </FormField>

        <FormField
          editMode={editMode}
          id={`${idPrefix}-numberChoose`}
          label="تعداد انتخاب"
          viewValue={zone.numberChoose}
          error={errors.numberChoose}
          helpText="تعداد سوالاتی که از این بخش نمایش داده می‌شود (برای همه خالی بگذارید)."
          hideWhenEmpty
        >
          {(aria) => (
            <input
              type="number"
              className={clsx('form-control form-control-sm', aria.errorClass)}
              {...aria.inputProps}
              {...register('numberChoose', {
                setValueAs: coerceToNumber,
                validate: (v) => validatePositiveInteger(v, 'تعداد انتخاب'),
              })}
            />
          )}
        </FormField>

        <FormField
          editMode={editMode}
          id={`${idPrefix}-bestQuestions`}
          label="بهترین سوالات"
          viewValue={zone.bestQuestions}
          error={errors.bestQuestions}
          helpText="تنها N سوال با بالاترین امتیاز در این بخش در مجموع نمره محاسبه می‌شوند (برای همه خالی بگذارید)."
          hideWhenEmpty
        >
          {(aria) => (
            <input
              type="number"
              className={clsx('form-control form-control-sm', aria.errorClass)}
              {...aria.inputProps}
              {...register('bestQuestions', {
                setValueAs: coerceToNumber,
                validate: (v) => validatePositiveInteger(v, 'بهترین سوالات'),
              })}
            />
          )}
        </FormField>

        <FormField
          editMode={editMode}
          id={`${idPrefix}-comment`}
          label="یادداشت"
          viewValue={
            zone.comment != null ? (
              <span className="text-break">{commentToString(zone.comment)}</span>
            ) : undefined
          }
          helpText="یادداشت داخلی، به دانشجویان نمایش داده نمی‌شود."
          hideWhenEmpty
        >
          {(aria) => (
            <textarea
              className="form-control form-control-sm"
              {...aria.inputProps}
              rows={2}
              {...register('comment', { setValueAs: coerceToOptionalString })}
            />
          )}
        </FormField>
      </Wrapper>

      <DetailSectionHeader>ابزارها</DetailSectionHeader>
      <Wrapper className={clsx(!editMode && 'mb-0')}>
        {EnumAssessmentToolSchema.options.map((tool) => {
          const toolLabel = tool === 'calculator' ? 'ماشین‌حساب' : tool[0].toUpperCase() + tool.slice(1);
          const fieldName = `tool_${tool}` as const;
          const inheritedValue = assessmentToolDefaults[tool] ?? false;
          const isInherited = !overriddenTools.has(tool);
          const watchedValue = watch(fieldName);
          return (
            <div
              key={tool}
              className="d-flex flex-wrap align-items-center justify-content-between gap-3"
            >
              <InheritableCheckboxField
                id={`${idPrefix}-tool-${tool}`}
                label={toolLabel}
                helpText={`بازنویسی تنظیم سطح ارزیابی برای «${toolLabel}» در این بخش.`}
                editMode={editMode}
                isInherited={isInherited}
                inheritedValue={inheritedValue}
                inheritedFromLabel="assessment"
                viewValue={!isInherited ? !!watchedValue : undefined}
                registerProps={register(fieldName, { setValueAs: coerceToBoolean })}
                showResetButton={!isInherited}
                onOverride={() => {
                  setOverriddenTools((prev) => new Set(prev).add(tool));
                  setValue('calculatorType', assessmentCalculatorType, {
                    shouldDirty: true,
                  });
                  setValue(fieldName, inheritedValue, { shouldDirty: true });
                }}
                onReset={() => {
                  setOverriddenTools((prev) => {
                    const next = new Set(prev);
                    next.delete(tool);
                    return next;
                  });
                  setValue('calculatorType', undefined);
                  resetAndSave(fieldName);
                }}
              />
              {(isInherited ? inheritedValue : watchedValue) && (
                <CalculatorPreviewButton
                  type={
                    isInherited
                      ? (assessmentCalculatorType ?? 'advanced')
                      : (watch('calculatorType') ?? 'advanced')
                  }
                />
              )}
            </div>
          );
        })}
      </Wrapper>
      {(watch('tool_calculator') ?? assessmentToolDefaults.calculator) && (
        <CalculatorTypeInput
          id={`${idPrefix}-calculator-type`}
          value={
            overriddenTools.has('calculator')
              ? (watch('calculatorType') ?? 'advanced')
              : (assessmentCalculatorType ?? 'advanced')
          }
          disabled={!editMode || !overriddenTools.has('calculator')}
          onChange={(value) => setValue('calculatorType', value, { shouldDirty: true })}
        />
      )}
      {mixedToolsWarning && (
        <div className="alert alert-warning small mb-3" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-1" aria-hidden="true" />
          {mixedToolsWarning}
        </div>
      )}

      {groupsConfigured && (
        <>
          <DetailSectionHeader>دسترسی نقش‌ها</DetailSectionHeader>
          {hasRoles ? (
            <Wrapper className={clsx(!editMode && 'mb-0')}>
              <InheritableRolesField
                id={`${idPrefix}-canView`}
                label="مجاز به مشاهده"
                helpText="نقش‌های مجاز به مشاهده سوالات این بخش."
                editMode={editMode}
                isInherited={!canViewOverridden}
                inheritedValue={assessmentCanView}
                inheritedFromLabel="assessment"
                allRoles={groupRoles}
                value={watchedCanView ?? []}
                onChange={(next) => setValue('canView', next, { shouldDirty: true })}
                onOverride={() =>
                  setValue('canView', assessmentCanView ?? groupRoles, { shouldDirty: true })
                }
                onReset={() => {
                  setValue('canView', undefined);
                  resetAndSave('canView');
                }}
              />
              <InheritableRolesField
                id={`${idPrefix}-canSubmit`}
                label="مجاز به ارسال"
                helpText="نقش‌های مجاز به ارسال پاسخ برای سوالات این بخش."
                editMode={editMode}
                isInherited={!canSubmitOverridden}
                inheritedValue={assessmentCanSubmit}
                inheritedFromLabel="assessment"
                allRoles={groupRoles}
                value={watchedCanSubmit ?? []}
                onChange={(next) => setValue('canSubmit', next, { shouldDirty: true })}
                onOverride={() =>
                  setValue('canSubmit', assessmentCanSubmit ?? groupRoles, { shouldDirty: true })
                }
                onReset={() => {
                  setValue('canSubmit', undefined);
                  resetAndSave('canSubmit');
                }}
              />
            </Wrapper>
          ) : (
            <p className="text-muted small mb-3">
              هیچ <a href={groupsPageUrl}>نقش سفارشی</a> برای این ارزیابی تعریف نشده است.
            </p>
          )}
        </>
      )}

      <AdvancedFields
        register={register}
        errors={errors}
        idPrefix={idPrefix}
        variant="zone"
        editMode={editMode}
        inheritance={advancedInheritance}
        zoneIndex={zoneIndex}
        assessmentType={assessmentType}
      />
    </div>
  );
}
