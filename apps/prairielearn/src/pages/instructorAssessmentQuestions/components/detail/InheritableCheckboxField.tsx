import type { UseFormRegisterReturn } from 'react-hook-form';

import type { InheritanceSource } from '../../types.js';
import { formatInheritanceSourceFa } from '../../utils/formHelpers.js';

export function InheritableCheckboxField({
  id,
  label,
  helpText,
  editMode = true,
  isInherited,
  inheritedValue,
  inheritedFromLabel,
  viewValue,
  registerProps,
  showResetButton,
  onOverride,
  onReset,
}: {
  id: string;
  label: string;
  helpText: string;
  editMode?: boolean;
  isInherited: boolean;
  inheritedValue: boolean;
  inheritedFromLabel: InheritanceSource;
  viewValue?: boolean;
  registerProps: UseFormRegisterReturn;
  showResetButton: boolean;
  onOverride: () => void;
  onReset: () => void;
}) {
  const sourceFa = formatInheritanceSourceFa(inheritedFromLabel);

  if (!editMode) {
    if (isInherited) {
      return (
        <>
          <dt>{label}</dt>
          <dd>
            {inheritedValue ? 'بله' : 'خیر'}{' '}
            <span className="text-muted">(به ارث برده‌شده از {sourceFa})</span>
          </dd>
        </>
      );
    }
    if (viewValue != null) {
      return (
        <>
          <dt>{label}</dt>
          <dd>{viewValue ? 'بله' : 'خیر'}</dd>
        </>
      );
    }
    return null;
  }

  if (isInherited) {
    return (
      <div className="mb-3 form-check">
        <input type="hidden" {...registerProps} />
        <input
          type="checkbox"
          className="form-check-input"
          id={id}
          checked={inheritedValue}
          disabled
        />
        <label htmlFor={id} className="form-check-label">
          {label}
        </label>
        <small className="form-text text-muted d-block">
          به ارث برده‌شده از {sourceFa}.{' '}
          <button
            type="button"
            className="btn btn-link btn-sm p-0 align-baseline"
            onClick={onOverride}
          >
            بازنویسی
          </button>
        </small>
      </div>
    );
  }

  return (
    <div className="mb-3 form-check">
      <input type="checkbox" className="form-check-input" id={id} {...registerProps} />
      <label htmlFor={id} className="form-check-label">
        {label}
      </label>
      <small id={`${id}-help`} className="form-text text-muted d-block">
        {showResetButton
          ? `بازنویسی مقدار ${sourceFa} (${inheritedValue ? 'روشن' : 'خاموش'}).`
          : helpText}
        {showResetButton && (
          <>
            {' '}
            <button
              type="button"
              className="btn btn-link btn-sm p-0 align-baseline"
              title={`بازنشانی به مقدار ${sourceFa}`}
              onClick={onReset}
            >
              بازنشانی
            </button>
          </>
        )}
      </small>
    </div>
  );
}
