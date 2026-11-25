import clsx from 'clsx';
import { useState } from 'react';
import type {
  FieldError,
  FieldErrors,
  UseFormRegister,
  UseFormSetValue,
  UseFormWatch,
} from 'react-hook-form';

import type { EnumAssessmentType } from '../../../../lib/db-types.js';
import type { InheritanceSource } from '../../types.js';
import { coerceToBoolean, coerceToNumber } from '../../utils/formHelpers.js';

import { DetailSectionHeader } from './DetailSectionHeader.js';
import { FormCheckField, FormField } from './FormField.js';
import { InheritableCheckboxField } from './InheritableCheckboxField.js';
import { InheritableField } from './InheritableField.js';

const HELP_TEXT = {
  advanceScorePerc: {
    question: 'حداقل درصد نمره لازم برای باز شدن سوال بعدی.',
    altPool: 'حداقل درصد نمره پیش‌فرض برای باز شدن سوال بعدی.',
    zone: 'حداقل درصد نمره پیش‌فرض برای باز شدن سوال بعدی.',
  },
  gradeRateMinutes: {
    question: 'حداقل زمان بین تلاش‌های تصحیح.',
    altPool: 'حداقل زمان بین تلاش‌های تصحیح برای سوالات این مجموعه.',
    zone: 'حداقل زمان بین تلاش‌های تصحیح برای سوالات این بخش.',
  },
  allowRealTimeGrading: {
    question: 'اجازه به دانشجویان برای مشاهده نتایج تصحیح در حین امتحان (فقط امتحانات).',
    altPool: 'اجازه به دانشجویان برای مشاهده نتایج تصحیح در حین امتحان (فقط امتحانات).',
    zone: 'اجازه به دانشجویان برای مشاهده نتایج تصحیح در حین امتحان برای سوالات این بخش (فقط امتحانات).',
  },
} as const;

/**
 * Each `*FromLabel` identifies which ancestor level a field's inherited value
 * comes from (displayed as "Inherited from {label}"). The label is only shown
 * when the corresponding `parent*` value is non-null; when `parent*` is
 * undefined the label is never displayed, so its value is irrelevant.
 *
 * For `forceMaxPoints` specifically, only alt pools define this property —
 * zones and assessments do not — so `parentForceMaxPoints` is `undefined`
 * everywhere except inside an alt pool. The `forceMaxPointsFromLabel` fallback
 * is therefore never displayed outside of alt pools.
 */
export interface AdvancedFieldsInheritance {
  parentAdvanceScorePerc: number | undefined;
  parentGradeRateMinutes: number | undefined;
  parentAllowRealTimeGrading: boolean | undefined;
  parentForceMaxPoints: boolean | undefined;
  advanceScorePercFromLabel: InheritanceSource;
  gradeRateMinutesFromLabel: InheritanceSource;
  allowRealTimeGradingFromLabel: InheritanceSource;
  forceMaxPointsFromLabel: InheritanceSource;
  watch: UseFormWatch<any>;
  setValue: UseFormSetValue<any>;
  resetAndSave: (field: string) => void;
}

export function AdvancedFields({
  register,
  errors,
  idPrefix,
  variant,
  editMode = true,
  inheritance,
  zoneIndex,
  assessmentType,
}: {
  register: UseFormRegister<any>;
  errors?: FieldErrors;
  idPrefix: string;
  variant: 'question' | 'altPool' | 'zone';
  editMode?: boolean;
  inheritance: AdvancedFieldsInheritance;
  zoneIndex?: number;
  assessmentType: EnumAssessmentType;
}) {
  const advanceScorePercRegisterProps = register('advanceScorePerc', {
    setValueAs: coerceToNumber,
    validate: (v) => {
      if (v == null) return;
      if (v < 0 || v > 100) return 'درصد نمره پیشرفت باید بین ۰ تا ۱۰۰ باشد.';
    },
  });

  const gradeRateMinutesRegisterProps = register('gradeRateMinutes', {
    setValueAs: coerceToNumber,
    validate: (v) => {
      if (v == null) return;
      if (v < 0) return 'فاصله زمانی تصحیح باید نامنفی باشد.';
    },
  });

  const watchedAdvanceScorePerc = inheritance.watch('advanceScorePerc');
  const watchedGradeRateMinutes = inheritance.watch('gradeRateMinutes');
  const watchedForceMaxPoints = inheritance.watch('forceMaxPoints');
  const watchedAllowRealTimeGrading = inheritance.watch('allowRealTimeGrading');
  const watchedLockpoint = variant === 'zone' ? inheritance.watch('lockpoint') : undefined;

  // Track which inheritable fields are in "override" mode. Initialized from
  // the form values at mount; toggled only by Override/Reset buttons. This
  // prevents the field from switching back to inherited mode when the user
  // clears it via backspace.
  const [overriddenFields, setOverriddenFields] = useState(() => ({
    advanceScorePerc: watchedAdvanceScorePerc !== undefined,
    gradeRateMinutes: watchedGradeRateMinutes !== undefined,
    forceMaxPoints: watchedForceMaxPoints !== undefined,
    allowRealTimeGrading: watchedAllowRealTimeGrading !== undefined,
  }));

  // In view mode, hide entire section if all effective values are null
  if (!editMode) {
    const effectiveAdvanceScorePerc = watchedAdvanceScorePerc ?? inheritance.parentAdvanceScorePerc;
    const effectiveGradeRateMinutes = watchedGradeRateMinutes ?? inheritance.parentGradeRateMinutes;
    const effectiveForceMaxPoints = watchedForceMaxPoints ?? inheritance.parentForceMaxPoints;
    const effectiveAllowRealTimeGrading =
      watchedAllowRealTimeGrading ?? inheritance.parentAllowRealTimeGrading;

    if (
      effectiveAdvanceScorePerc == null &&
      effectiveGradeRateMinutes == null &&
      effectiveForceMaxPoints == null &&
      (assessmentType === 'Homework' || effectiveAllowRealTimeGrading == null) &&
      !watchedLockpoint
    ) {
      return null;
    }
  }

  const renderLockpoint = () => {
    return (
      <FormCheckField
        editMode={editMode}
        id={`${idPrefix}-lockpoint`}
        label="نقطه قفل (Lockpoint)"
        viewValue={!!watchedLockpoint}
        error={errors?.lockpoint as FieldError | undefined}
        helpText="یک مانع یک‌طرفه ایجاد می‌کند؛ عبور از آن تمام بخش‌های قبلی را فقط-خواندنی می‌کند."
        hideWhenEmpty
      >
        {(aria) => (
          <input
            type="checkbox"
            className={clsx('form-check-input', aria.errorClass)}
            {...aria.inputProps}
            {...register('lockpoint', {
              validate: (v) => {
                if (v && zoneIndex === 0) {
                  return 'اولین بخش نمی‌تواند نقطه قفل باشد.';
                }
              },
            })}
          />
        )}
      </FormCheckField>
    );
  };

  const renderAdvanceScorePerc = () => {
    if (inheritance.parentAdvanceScorePerc != null) {
      const isInherited = !overriddenFields.advanceScorePerc;
      return (
        <InheritableField
          id={`${idPrefix}-advanceScorePerc`}
          label="درصد نمره پیشرفت"
          inputType="number"
          step="any"
          editMode={editMode}
          isInherited={isInherited}
          inheritedDisplayValue={String(inheritance.parentAdvanceScorePerc)}
          viewValue={
            !isInherited && watchedAdvanceScorePerc != null
              ? `${watchedAdvanceScorePerc}%`
              : undefined
          }
          registerProps={advanceScorePercRegisterProps}
          error={errors?.advanceScorePerc as FieldError | undefined}
          helpText={HELP_TEXT.advanceScorePerc[variant]}
          inheritedValueLabel={String(inheritance.parentAdvanceScorePerc)}
          inheritedFromLabel={inheritance.advanceScorePercFromLabel}
          showResetButton={!isInherited}
          onOverride={() => {
            setOverriddenFields((prev) => ({ ...prev, advanceScorePerc: true }));
            inheritance.setValue('advanceScorePerc', inheritance.parentAdvanceScorePerc, {
              shouldDirty: true,
              shouldValidate: true,
            });
          }}
          onReset={() => {
            setOverriddenFields((prev) => ({ ...prev, advanceScorePerc: false }));
            inheritance.resetAndSave('advanceScorePerc');
          }}
        />
      );
    }

    const viewValue = watchedAdvanceScorePerc != null ? `${watchedAdvanceScorePerc}%` : undefined;

    return (
      <FormField
        editMode={editMode}
        id={`${idPrefix}-advanceScorePerc`}
        label="درصد نمره پیشرفت"
        viewValue={viewValue}
        error={errors?.advanceScorePerc as FieldError | undefined}
        helpText={HELP_TEXT.advanceScorePerc[variant]}
        hideWhenEmpty
      >
        {(aria) => (
          <input
            type="number"
            step="any"
            className={clsx('form-control form-control-sm', aria.errorClass)}
            {...aria.inputProps}
            {...advanceScorePercRegisterProps}
          />
        )}
      </FormField>
    );
  };

  const renderGradeRateMinutes = () => {
    if (inheritance.parentGradeRateMinutes != null) {
      const isInherited = !overriddenFields.gradeRateMinutes;
      return (
        <InheritableField
          id={`${idPrefix}-gradeRateMinutes`}
          label="فاصله زمانی تصحیح (دقیقه)"
          inputType="number"
          step="any"
          editMode={editMode}
          isInherited={isInherited}
          inheritedDisplayValue={String(inheritance.parentGradeRateMinutes)}
          viewValue={
            !isInherited && watchedGradeRateMinutes != null
              ? String(watchedGradeRateMinutes)
              : undefined
          }
          registerProps={gradeRateMinutesRegisterProps}
          error={errors?.gradeRateMinutes as FieldError | undefined}
          helpText={HELP_TEXT.gradeRateMinutes[variant]}
          inheritedValueLabel={String(inheritance.parentGradeRateMinutes)}
          inheritedFromLabel={inheritance.gradeRateMinutesFromLabel}
          showResetButton={!isInherited}
          onOverride={() => {
            setOverriddenFields((prev) => ({ ...prev, gradeRateMinutes: true }));
            inheritance.setValue('gradeRateMinutes', inheritance.parentGradeRateMinutes, {
              shouldDirty: true,
              shouldValidate: true,
            });
          }}
          onReset={() => {
            setOverriddenFields((prev) => ({ ...prev, gradeRateMinutes: false }));
            inheritance.resetAndSave('gradeRateMinutes');
          }}
        />
      );
    }

    const viewValue = watchedGradeRateMinutes != null ? String(watchedGradeRateMinutes) : undefined;

    return (
      <FormField
        editMode={editMode}
        id={`${idPrefix}-gradeRateMinutes`}
        label="فاصله زمانی تصحیح (دقیقه)"
        viewValue={viewValue}
        error={errors?.gradeRateMinutes as FieldError | undefined}
        helpText={HELP_TEXT.gradeRateMinutes[variant]}
        hideWhenEmpty
      >
        {(aria) => (
          <input
            type="number"
            className={clsx('form-control form-control-sm', aria.errorClass)}
            step="any"
            {...aria.inputProps}
            {...gradeRateMinutesRegisterProps}
          />
        )}
      </FormField>
    );
  };

  const renderForceMaxPoints = () => {
    if (inheritance.parentForceMaxPoints != null) {
      const isInherited = !overriddenFields.forceMaxPoints;
      return (
        <InheritableCheckboxField
          id={`${idPrefix}-forceMaxPoints`}
          label="اعمال حداکثر امتیاز"
          helpText="اعطای حداکثر امتیاز هنگام تصحیح مجدد ارزیابی. برای اصلاح سوالات معیوب استفاده می‌شود."
          editMode={editMode}
          isInherited={isInherited}
          inheritedValue={inheritance.parentForceMaxPoints}
          inheritedFromLabel={inheritance.forceMaxPointsFromLabel}
          viewValue={!isInherited ? !!watchedForceMaxPoints : undefined}
          registerProps={register('forceMaxPoints', { setValueAs: coerceToBoolean })}
          showResetButton={!isInherited}
          onOverride={() => {
            setOverriddenFields((prev) => ({ ...prev, forceMaxPoints: true }));
            inheritance.setValue('forceMaxPoints', inheritance.parentForceMaxPoints, {
              shouldDirty: true,
            });
          }}
          onReset={() => {
            setOverriddenFields((prev) => ({ ...prev, forceMaxPoints: false }));
            inheritance.resetAndSave('forceMaxPoints');
          }}
        />
      );
    }

    return (
      <FormCheckField
        editMode={editMode}
        id={`${idPrefix}-forceMaxPoints`}
        label="اعمال حداکثر امتیاز"
        viewValue={!!watchedForceMaxPoints}
        helpText="اعطای حداکثر امتیاز هنگام تصحیح مجدد ارزیابی. برای اصلاح سوالات معیوب استفاده می‌شود."
        hideWhenEmpty
      >
        {(aria) => (
          <input
            type="checkbox"
            className={clsx('form-check-input', aria.errorClass)}
            {...aria.inputProps}
            {...register('forceMaxPoints', { setValueAs: coerceToBoolean })}
          />
        )}
      </FormCheckField>
    );
  };

  const renderAllowRealTimeGrading = () => {
    if (inheritance.parentAllowRealTimeGrading != null) {
      const isInherited = !overriddenFields.allowRealTimeGrading;
      return (
        <InheritableCheckboxField
          id={`${idPrefix}-allowRealTimeGrading`}
          label="اجازه تصحیح هم‌زمان"
          helpText={HELP_TEXT.allowRealTimeGrading[variant]}
          editMode={editMode}
          isInherited={isInherited}
          inheritedValue={inheritance.parentAllowRealTimeGrading}
          inheritedFromLabel={inheritance.allowRealTimeGradingFromLabel}
          viewValue={!isInherited ? !!watchedAllowRealTimeGrading : undefined}
          registerProps={register('allowRealTimeGrading', { setValueAs: coerceToBoolean })}
          showResetButton={!isInherited}
          onOverride={() => {
            setOverriddenFields((prev) => ({ ...prev, allowRealTimeGrading: true }));
            inheritance.setValue('allowRealTimeGrading', inheritance.parentAllowRealTimeGrading, {
              shouldDirty: true,
            });
          }}
          onReset={() => {
            setOverriddenFields((prev) => ({ ...prev, allowRealTimeGrading: false }));
            inheritance.resetAndSave('allowRealTimeGrading');
          }}
        />
      );
    }

    return (
      <FormCheckField
        editMode={editMode}
        id={`${idPrefix}-allowRealTimeGrading`}
        label="اجازه تصحیح هم‌زمان"
        viewValue={!!watchedAllowRealTimeGrading}
        helpText={HELP_TEXT.allowRealTimeGrading[variant]}
        hideWhenEmpty
      >
        {(aria) => (
          <input
            type="checkbox"
            className={clsx('form-check-input', aria.errorClass)}
            {...aria.inputProps}
            {...register('allowRealTimeGrading', { setValueAs: coerceToBoolean })}
          />
        )}
      </FormCheckField>
    );
  };

  const fields = (
    <>
      {variant === 'zone' && renderLockpoint()}
      {renderAdvanceScorePerc()}
      {renderGradeRateMinutes()}
      {variant !== 'zone' && renderForceMaxPoints()}
      {assessmentType !== 'Homework' && renderAllowRealTimeGrading()}
    </>
  );

  return (
    <>
      <DetailSectionHeader>پیشرفته</DetailSectionHeader>
      {editMode ? fields : <dl className="mb-0">{fields}</dl>}
    </>
  );
}
