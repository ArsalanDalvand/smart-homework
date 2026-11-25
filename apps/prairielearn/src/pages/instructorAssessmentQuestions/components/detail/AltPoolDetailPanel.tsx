import clsx from 'clsx';
import { useCallback, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';

import type { DetailState, ZoneAssessmentForm, ZoneQuestionBlockForm } from '../../types.js';
import {
  coerceToNumber,
  coerceToOptionalString,
  commentToString,
  formatPoints,
  makeResetAndSave,
  parseCommentValue,
  parsePointsListValue,
  validateNonIncreasingPoints,
  validatePointsListFormat,
} from '../../utils/formHelpers.js';
import {
  type QuestionMetadataMap,
  getSharedTags,
  getSharedTopic,
  hasAltPoolChooseExceedsCount,
  hasPointsMismatch,
  hasUnavailableQuestions,
  resolveRolePermissionCascade,
  validatePositiveInteger,
} from '../../utils/questions.js';
import { useAutoSave } from '../../utils/useAutoSave.js';

import { AdvancedFields, type AdvancedFieldsInheritance } from './AdvancedFields.js';
import { DetailSectionHeader } from './DetailSectionHeader.js';
import { FormField } from './FormField.js';
import { InheritableRolesField } from './InheritableRolesField.js';

interface AltPoolFormData {
  numberChoose?: number;
  comment?: string;
  autoPoints?: number | number[];
  maxAutoPoints?: number;
  manualPoints?: number;
  triesPerVariant?: number;
  advanceScorePerc?: number;
  gradeRateMinutes?: number;
  forceMaxPoints?: boolean;
  allowRealTimeGrading?: boolean;
  canView?: string[];
  canSubmit?: string[];
}

export function AltPoolDetailPanel({
  zoneQuestionBlock,
  zone,
  questionMetadata,
  idPrefix,
  state,
  onUpdate,
  onFormValidChange,
  onDismissBanner,
}: {
  zoneQuestionBlock: ZoneQuestionBlockForm;
  zone: ZoneAssessmentForm;
  questionMetadata: QuestionMetadataMap;
  idPrefix: string;
  state: DetailState;
  onUpdate: (
    questionTrackingId: string,
    question: Partial<ZoneQuestionBlockForm> | Partial<AltPoolFormData>,
  ) => void;
  onFormValidChange: (isValid: boolean) => void;
  onDismissBanner: (trackingId: string) => void;
}) {
  const {
    editMode,
    assessmentType,
    constantQuestionValue,
    assessmentDefaults,
    groupsConfigured,
    groupRoles,
    assessmentCanView,
    assessmentCanSubmit,
    groupsPageUrl,
  } = state;
  const alternativeCount = zoneQuestionBlock.alternatives?.length ?? 0;

  const sharedTopic = getSharedTopic(zoneQuestionBlock.alternatives ?? [], questionMetadata);
  const sharedTags = getSharedTags(zoneQuestionBlock.alternatives ?? [], questionMetadata);

  const {
    register,
    getValues,
    watch,
    setValue,
    trigger,
    formState: { errors, isDirty, isValid },
  } = useForm<AltPoolFormData>({
    mode: 'onChange',
    values: {
      numberChoose: zoneQuestionBlock.numberChoose ?? undefined,
      comment: commentToString(zoneQuestionBlock.comment),
      autoPoints: zoneQuestionBlock.autoPoints ?? undefined,
      maxAutoPoints: zoneQuestionBlock.maxAutoPoints ?? undefined,
      manualPoints: zoneQuestionBlock.manualPoints ?? undefined,
      triesPerVariant: zoneQuestionBlock.triesPerVariant ?? undefined,
      advanceScorePerc: zoneQuestionBlock.advanceScorePerc ?? undefined,
      gradeRateMinutes: zoneQuestionBlock.gradeRateMinutes ?? undefined,
      forceMaxPoints: editMode
        ? (zoneQuestionBlock.forceMaxPoints ?? false)
        : zoneQuestionBlock.forceMaxPoints,
      allowRealTimeGrading: zoneQuestionBlock.allowRealTimeGrading ?? undefined,
      canView: zoneQuestionBlock.canView,
      canSubmit: zoneQuestionBlock.canSubmit,
    },
    // Prevent autosave from clobbering in-progress typing. Without this,
    // the autosave feedback loop (edit → save → parent state update →
    // values prop change → form reset) resets the input mid-keystroke.
    // This is safe because the only source of values changes while the
    // panel is open is autosave; switching entities remounts the component.
    resetOptions: { keepDirtyValues: true, keepErrors: true },
  });

  useEffect(() => {
    // Alternatives can be deleted from the tree while this panel is open.
    // Revalidate immediately so numberChoose errors update without extra input.
    // We use the result of trigger() directly because formState.isValid may
    // not update until user interaction with mode: 'onChange'.
    void trigger().then((valid) => {
      onFormValidChange(valid);
    });
  }, [alternativeCount, trigger, onFormValidChange]);

  const handleSave = useCallback(
    (data: AltPoolFormData) =>
      onUpdate(zoneQuestionBlock.trackingId, {
        ...data,
        comment: parseCommentValue(data.comment),
        forceMaxPoints: data.forceMaxPoints || undefined,
        allowRealTimeGrading: data.allowRealTimeGrading,
      }),
    [onUpdate, zoneQuestionBlock.trackingId],
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

  const parentAdvanceScorePerc = zone.advanceScorePerc ?? assessmentDefaults.advanceScorePerc;
  const parentGradeRateMinutes = zone.gradeRateMinutes ?? assessmentDefaults.gradeRateMinutes;
  const parentAllowRealTimeGrading =
    zone.allowRealTimeGrading ?? assessmentDefaults.allowRealTimeGrading;
  const advancedInheritance: AdvancedFieldsInheritance = {
    parentAdvanceScorePerc,
    parentGradeRateMinutes,
    parentAllowRealTimeGrading,
    // forceMaxPoints never has a parent for alt pools; it's only defined at the alt pool level
    parentForceMaxPoints: undefined,
    advanceScorePercFromLabel: zone.advanceScorePerc != null ? 'zone' : 'assessment',
    gradeRateMinutesFromLabel: zone.gradeRateMinutes != null ? 'zone' : 'assessment',
    allowRealTimeGradingFromLabel: zone.allowRealTimeGrading != null ? 'zone' : 'assessment',
    forceMaxPointsFromLabel: 'assessment',
    watch,
    setValue,
    resetAndSave,
  };

  const watchedCanView = watch('canView');
  const watchedCanSubmit = watch('canSubmit');
  const canViewOverridden = watchedCanView != null;
  const canSubmitOverridden = watchedCanSubmit != null;
  const hasRoles = groupRoles.length > 0;
  const canViewParent = resolveRolePermissionCascade([
    { value: zone.canView, source: 'zone' },
    { value: assessmentCanView, source: 'assessment' },
  ]);
  const canSubmitParent = resolveRolePermissionCascade([
    { value: zone.canSubmit, source: 'zone' },
    { value: assessmentCanSubmit, source: 'assessment' },
  ]);

  const watchedAutoPoints = watch('autoPoints');
  const autoPointsPlaceholder =
    watchedAutoPoints == null
      ? ''
      : String(Array.isArray(watchedAutoPoints) ? watchedAutoPoints[0] : watchedAutoPoints);

  const pointsMismatch =
    zoneQuestionBlock.alternatives != null &&
    hasPointsMismatch(zoneQuestionBlock.alternatives, assessmentType, zoneQuestionBlock);
  const chooseExceeds = hasAltPoolChooseExceedsCount(zoneQuestionBlock);
  const hasAutoGradedWithOnlyManualPoints =
    zoneQuestionBlock.alternatives?.some((alt) => {
      const metadata = questionMetadata[alt.id];
      if (!metadata || metadata.question.grading_method === 'Manual') return false;
      const effectiveManualPoints = alt.manualPoints ?? zoneQuestionBlock.manualPoints;
      const effectiveAutoPoints = alt.autoPoints ?? zoneQuestionBlock.autoPoints;
      return effectiveManualPoints != null && effectiveAutoPoints == null;
    }) ?? false;

  const Wrapper = editMode ? 'div' : 'dl';
  const membershipLocked = hasUnavailableQuestions(zoneQuestionBlock, questionMetadata);
  const hasLegacyPoints =
    zoneQuestionBlock.points != null ||
    zoneQuestionBlock.maxPoints != null ||
    zoneQuestionBlock.alternatives?.some((alt) => alt.points != null || alt.maxPoints != null);

  return (
    <div className="p-3">
      {pointsMismatch && (
        <div className="alert alert-warning small mb-3" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-1" aria-hidden="true" />
          دانشجویان مجموع امتیاز متفاوتی دریافت خواهند کرد زیرا این مجموعه دارای گزینه‌های جایگزین با مقادیر امتیاز متفاوت است.
        </div>
      )}
      {chooseExceeds && (
        <div className="alert alert-warning small mb-3" role="alert">
          <i className="bi bi-exclamation-triangle-fill me-1" aria-hidden="true" />
          تعداد انتخاب از تعداد گزینه‌های جایگزین موجود در این مجموعه بیشتر است.
        </div>
      )}
      {zoneQuestionBlock.pointsDistributedInfoBanner &&
        !state.dismissedBanners.has(zoneQuestionBlock.trackingId) && (
          <div className="alert alert-info small mb-3 alert-dismissible" role="alert">
            <i className="bi bi-info-circle-fill me-1" aria-hidden="true" />
            این مجموعه هم شامل سوالات با تصحیح خودکار و هم شامل سوالات با تصحیح دستی است. امتیازها بر اساس روش تصحیح هر سوال به گزینه‌های جایگزین جداگانه توزیع شده‌اند.
            <button
              type="button"
              className="btn-close"
              aria-label="بستن"
              onClick={() => onDismissBanner(zoneQuestionBlock.trackingId)}
            />
          </div>
        )}
      {hasAutoGradedWithOnlyManualPoints && (
        <div className="alert alert-info small mb-3" role="alert">
          <i className="bi bi-info-circle-fill me-1" aria-hidden="true" />
          یک یا چند گزینه جایگزین در این مجموعه دارای تصحیح خودکار هستند اما فقط امتیاز دستی دارند. نتایج تصحیح خودکار آن سوالات در نمره لحاظ نخواهد شد.
        </div>
      )}
      <div className="d-flex flex-column gap-2">
        <div className="text-muted small">
          {alternativeCount} گزینه جایگزین در مجموعه
        </div>
        {sharedTopic && (
          <div>
            <div className="text-muted small mb-1">موضوع مشترک بین گزینه‌های جایگزین</div>
            <span className={`badge color-${sharedTopic.color}`}>{sharedTopic.name}</span>
          </div>
        )}
        {sharedTags.length > 0 && (
          <div>
            <div className="text-muted small mb-1">برچسب‌های مشترک بین گزینه‌های جایگزین</div>
            <div className="d-flex flex-wrap gap-1">
              {sharedTags.map((tag) => (
                <span key={tag.name} className={`badge color-${tag.color}`}>
                  {tag.name}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      <DetailSectionHeader>تنظیمات</DetailSectionHeader>

      {membershipLocked && (
        <p className="text-muted small">
          گزینه‌های جایگزین این مجموعه تا زمانی که سوالات به‌صورت محلی در دسترس نباشند، فقط خواندنی هستند.
        </p>
      )}

      {(zoneQuestionBlock.points != null || zoneQuestionBlock.maxPoints != null) && (
        <dl className={clsx(editMode ? 'mb-3' : 'mb-2')}>
          {zoneQuestionBlock.points != null && (
            <>
              <dt>امتیاز (پیش‌فرض)</dt>
              <dd>{formatPoints(zoneQuestionBlock.points)}</dd>
            </>
          )}
          {zoneQuestionBlock.maxPoints != null && (
            <>
              <dt>حداکثر امتیاز (پیش‌فرض)</dt>
              <dd>{formatPoints(zoneQuestionBlock.maxPoints)}</dd>
            </>
          )}
        </dl>
      )}

      <Wrapper className={clsx(!editMode && 'mb-0')}>
        <FormField
          editMode={editMode}
          id={`${idPrefix}-numberChoose`}
          label="تعداد انتخاب"
          viewValue={zoneQuestionBlock.numberChoose ?? 'همه'}
          error={errors.numberChoose}
          helpText={`تعداد سوالاتی که از میان ${alternativeCount} گزینه جایگزین به‌صورت تصادفی برای هر دانشجو انتخاب می‌شود (برای همه خالی بگذارید).`}
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

        {assessmentType === 'Homework' ? (
          <>
            <FormField
              editMode={editMode && !hasLegacyPoints}
              id={`${idPrefix}-autoPoints`}
              label="امتیاز خودکار (پیش‌فرض)"
              viewValue={formatPoints(zoneQuestionBlock.autoPoints)}
              error={errors.autoPoints}
              helpText={
                <>
                  امتیاز اختصاص‌یافته به بخش تصحیح خودکار.{' '}
                  {constantQuestionValue
                    ? 'هر پاسخ صحیح این مقدار امتیاز دارد.'
                    : 'هر پاسخ صحیح پیاپی امتیاز بیشتری دارد؛ پاسخ نادرست مقدار را بازنشانی می‌کند.'}{' '}
                  <a
                    href="https://docs.prairielearn.com/assessment/configuration/#question-points-for-homework-assessments"
                    target="_blank"
                    rel="noreferrer"
                  >
                    اطلاعات بیشتر درباره امتیاز سوالات
                  </a>
                </>
              }
              hideWhenEmpty
            >
              {(aria) => (
                <input
                  type="number"
                  className={clsx('form-control form-control-sm', aria.errorClass)}
                  {...aria.inputProps}
                  step="any"
                  {...register('autoPoints', {
                    setValueAs: coerceToNumber,
                    deps: ['maxAutoPoints'],
                    validate: (v, formValues) => {
                      if (typeof v === 'number' && v < 0) {
                        return 'امتیاز خودکار باید نامنفی باشد.';
                      }
                      const maxPoints = formValues.maxAutoPoints;
                      if (typeof v === 'number' && v === 0 && maxPoints != null && maxPoints > 0) {
                        return 'وقتی حداکثر امتیاز خودکار بیشتر از ۰ است، امتیاز خودکار نمی‌تواند ۰ باشد.';
                      }
                      if (typeof v === 'number' && typeof maxPoints === 'number' && v > maxPoints) {
                        return 'امتیاز خودکار نمی‌تواند از حداکثر امتیاز خودکار بیشتر باشد.';
                      }
                    },
                  })}
                />
              )}
            </FormField>
            <FormField
              editMode={editMode && !hasLegacyPoints}
              id={`${idPrefix}-maxAutoPoints`}
              label="حداکثر امتیاز خودکار (پیش‌فرض)"
              viewValue={
                zoneQuestionBlock.maxAutoPoints != null
                  ? String(zoneQuestionBlock.maxAutoPoints)
                  : undefined
              }
              error={errors.maxAutoPoints}
              helpText="حداکثر مجموع امتیاز تصحیح خودکار."
              hideWhenEmpty
            >
              {(aria) => (
                <input
                  type="number"
                  step="any"
                  className={clsx('form-control form-control-sm', aria.errorClass)}
                  {...aria.inputProps}
                  placeholder={autoPointsPlaceholder}
                  {...register('maxAutoPoints', {
                    setValueAs: coerceToNumber,
                    deps: ['autoPoints'],
                    validate: (v, formValues) => {
                      if (v != null && v < 0) return 'حداکثر امتیاز خودکار باید نامنفی باشد.';
                      const points = formValues.autoPoints;
                      if (typeof points === 'number' && points === 0 && v != null && v > 0) {
                        return 'وقتی امتیاز خودکار ۰ است، حداکثر امتیاز خودکار باید ۰ یا خالی باشد.';
                      }
                      if (typeof points === 'number' && typeof v === 'number' && v < points) {
                        return 'حداکثر امتیاز خودکار باید حداقل برابر با امتیاز خودکار باشد.';
                      }
                    },
                  })}
                />
              )}
            </FormField>
            <FormField
              editMode={editMode && !hasLegacyPoints}
              id={`${idPrefix}-manualPoints`}
              label="امتیاز دستی (پیش‌فرض)"
              viewValue={
                zoneQuestionBlock.manualPoints != null
                  ? String(zoneQuestionBlock.manualPoints)
                  : undefined
              }
              error={errors.manualPoints}
              helpText="امتیاز دستی پیش‌فرض که توسط گزینه‌های جایگزین به ارث برده می‌شود مگر اینکه بازنویسی شود."
              hideWhenEmpty
            >
              {(aria) => (
                <input
                  type="number"
                  step="any"
                  className={clsx('form-control form-control-sm', aria.errorClass)}
                  {...aria.inputProps}
                  {...register('manualPoints', {
                    setValueAs: coerceToNumber,
                    validate: (v) => {
                      if (v != null && v < 0) return 'امتیاز دستی باید نامنفی باشد.';
                    },
                  })}
                />
              )}
            </FormField>
            <FormField
              editMode={editMode}
              id={`${idPrefix}-triesPerVariant`}
              label="تعداد تلاش در هر نسخه (پیش‌فرض)"
              viewValue={
                zoneQuestionBlock.triesPerVariant != null
                  ? String(zoneQuestionBlock.triesPerVariant)
                  : undefined
              }
              error={errors.triesPerVariant}
              helpText="تعداد پیش‌فرض دفعات مجاز ارسال پاسخ برای هر نسخه، که توسط گزینه‌های جایگزین به ارث برده می‌شود مگر اینکه بازنویسی شود."
              hideWhenEmpty
            >
              {(aria) => (
                <input
                  type="number"
                  className={clsx('form-control form-control-sm', aria.errorClass)}
                  {...aria.inputProps}
                  {...register('triesPerVariant', {
                    setValueAs: coerceToNumber,
                    validate: (v) => validatePositiveInteger(v, 'تعداد تلاش در هر نسخه'),
                  })}
                />
              )}
            </FormField>
          </>
        ) : (
          <>
            <FormField
              editMode={editMode && !hasLegacyPoints}
              id={`${idPrefix}-points`}
              label="امتیاز خودکار (پیش‌فرض)"
              viewValue={formatPoints(zoneQuestionBlock.autoPoints)}
              error={errors.autoPoints}
              helpText='امتیاز خودکار پیش‌فرض که توسط گزینه‌های جایگزین به ارث برده می‌شود مگر اینکه بازنویسی شود، به‌صورت فهرست جداشده با ویرگول (مثلاً "10, 5, 2, 1").'
              hideWhenEmpty
            >
              {(aria) => (
                <input
                  type="text"
                  className={clsx('form-control form-control-sm', aria.errorClass)}
                  {...aria.inputProps}
                  {...register('autoPoints', {
                    setValueAs: parsePointsListValue,
                    validate: {
                      format: (v) => validatePointsListFormat(v),
                      nonIncreasing: (v) => validateNonIncreasingPoints(v),
                    },
                  })}
                />
              )}
            </FormField>
            <FormField
              editMode={editMode && !hasLegacyPoints}
              id={`${idPrefix}-manualPoints`}
              label="امتیاز دستی (پیش‌فرض)"
              viewValue={
                zoneQuestionBlock.manualPoints != null
                  ? String(zoneQuestionBlock.manualPoints)
                  : undefined
              }
              error={errors.manualPoints}
              helpText="امتیاز دستی پیش‌فرض که توسط گزینه‌های جایگزین به ارث برده می‌شود مگر اینکه بازنویسی شود."
              hideWhenEmpty
            >
              {(aria) => (
                <input
                  type="number"
                  step="any"
                  className={clsx('form-control form-control-sm', aria.errorClass)}
                  {...aria.inputProps}
                  {...register('manualPoints', {
                    setValueAs: coerceToNumber,
                    validate: (v) => {
                      if (v != null && v < 0) return 'امتیاز دستی باید نامنفی باشد.';
                    },
                  })}
                />
              )}
            </FormField>
          </>
        )}

        <FormField
          editMode={editMode}
          id={`${idPrefix}-comment`}
          label="یادداشت"
          viewValue={
            zoneQuestionBlock.comment != null ? (
              <span className="text-break">{commentToString(zoneQuestionBlock.comment)}</span>
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

      {groupsConfigured && (
        <>
          <DetailSectionHeader>دسترسی نقش‌ها</DetailSectionHeader>
          {hasRoles ? (
            <Wrapper className={clsx(!editMode && 'mb-0')}>
              <InheritableRolesField
                id={`${idPrefix}-canView`}
                label="مجاز به مشاهده"
                helpText="نقش‌های مجاز به مشاهده گزینه‌های جایگزین در این مجموعه."
                editMode={editMode}
                isInherited={!canViewOverridden}
                inheritedValue={canViewParent.value}
                inheritedFromLabel={canViewParent.source}
                allRoles={groupRoles}
                value={watchedCanView ?? []}
                onChange={(next) => setValue('canView', next, { shouldDirty: true })}
                onOverride={() =>
                  setValue('canView', canViewParent.value ?? groupRoles, { shouldDirty: true })
                }
                onReset={() => {
                  setValue('canView', undefined);
                  resetAndSave('canView');
                }}
              />
              <InheritableRolesField
                id={`${idPrefix}-canSubmit`}
                label="مجاز به ارسال"
                helpText="نقش‌های مجاز به ارسال پاسخ برای گزینه‌های جایگزین در این مجموعه."
                editMode={editMode}
                isInherited={!canSubmitOverridden}
                inheritedValue={canSubmitParent.value}
                inheritedFromLabel={canSubmitParent.source}
                allRoles={groupRoles}
                value={watchedCanSubmit ?? []}
                onChange={(next) => setValue('canSubmit', next, { shouldDirty: true })}
                onOverride={() =>
                  setValue('canSubmit', canSubmitParent.value ?? groupRoles, { shouldDirty: true })
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
        variant="altPool"
        editMode={editMode}
        inheritance={advancedInheritance}
        assessmentType={assessmentType}
      />
    </div>
  );
}
