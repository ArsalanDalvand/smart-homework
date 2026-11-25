import { Form, InputGroup } from 'react-bootstrap';
import { useController, useWatch } from 'react-hook-form';

import { MAX_ACCESS_CONTROL_DURATION_MINUTES } from '../../../../schemas/accessControl.js';
import { useAccessControlRuleEditable } from '../AccessControlEditabilityContext.js';
import { FieldWrapper } from '../FieldWrapper.js';
import { ToggleTitle } from '../ToggleTitle.js';
import { useOverrideField } from '../hooks/useOverrideField.js';
import type { AccessControlFormData } from '../types.js';

function DurationDetails({
  value,
  onChange,
  idPrefix,
  error,
}: {
  value: number | null;
  onChange: (value: number | null) => void;
  idPrefix: string;
  error?: string;
}) {
  const ruleEditable = useAccessControlRuleEditable();
  return (
    <>
      {value !== null && (
        <>
          <InputGroup className="mt-2">
            <Form.Control
              type="number"
              aria-label="مدت زمان به دقیقه"
              aria-invalid={!!error}
              placeholder="مدت زمان به دقیقه"
              value={value === 0 ? '' : value}
              min={1}
              max={MAX_ACCESS_CONTROL_DURATION_MINUTES}
              isInvalid={!!error}
              aria-errormessage={error ? `${idPrefix}-duration-error` : undefined}
              disabled={!ruleEditable}
              onChange={({ currentTarget }) => {
                if (currentTarget.value === '') {
                  onChange(0);
                } else {
                  const num = Number(currentTarget.value);
                  if (Number.isFinite(num) && num >= 0) {
                    onChange(num);
                  }
                }
              }}
            />
            <InputGroup.Text>دقیقه</InputGroup.Text>
          </InputGroup>
          {error && (
            <Form.Text id={`${idPrefix}-duration-error`} className="text-danger" role="alert">
              {error}
            </Form.Text>
          )}
        </>
      )}
      {!error && (
        <Form.Text className="text-muted">
          {value !== null && value > 0
            ? `دانشجویان ${value} دقیقه برای تکمیل ارزیابی فرصت خواهند داشت.`
            : value !== null
              ? 'مدت زمان را به دقیقه وارد کنید.'
              : 'افزودن محدودیت زمانی به ارزیابی.'}
        </Form.Text>
      )}
    </>
  );
}

function DurationToggle({
  value,
  onChange,
  idPrefix,
}: {
  value: number | null;
  onChange: (value: number | null) => void;
  idPrefix: string;
}) {
  const ruleEditable = useAccessControlRuleEditable();
  return (
    <ToggleTitle
      id={`${idPrefix}-time-limit-enabled`}
      label="محدودیت زمانی"
      checked={value !== null}
      disabled={!ruleEditable}
      onChange={(checked) => onChange(checked ? 60 : null)}
    />
  );
}

export function DefaultDurationField() {
  const {
    field,
    fieldState: { error },
  } = useController<AccessControlFormData, 'defaultRule.durationMinutes'>({
    name: 'defaultRule.durationMinutes',
  });

  return (
    <Form.Group>
      <DurationToggle value={field.value} idPrefix="defaultRule" onChange={field.onChange} />
      <DurationDetails
        value={field.value}
        idPrefix="defaultRule"
        error={error?.message}
        onChange={field.onChange}
      />
    </Form.Group>
  );
}

export function OverrideDurationField({ index }: { index: number }) {
  const defaultRuleValue = useWatch<AccessControlFormData, 'defaultRule.durationMinutes'>({
    name: 'defaultRule.durationMinutes',
  });

  const {
    field,
    fieldState: { error },
  } = useController<AccessControlFormData, `overrides.${number}.durationMinutes`>({
    name: `overrides.${index}.durationMinutes`,
  });

  const { isOverridden, addOverride, removeOverride } = useOverrideField(index, 'durationMinutes');

  return (
    <FieldWrapper
      isOverridden={isOverridden}
      label="محدودیت زمانی"
      headerToggle={
        <DurationToggle
          value={field.value}
          idPrefix={`overrides-${index}`}
          onChange={field.onChange}
        />
      }
      onOverride={() => {
        field.onChange(defaultRuleValue);
        addOverride();
      }}
      onRemoveOverride={removeOverride}
    >
      <DurationDetails
        value={field.value}
        idPrefix={`overrides-${index}`}
        error={error?.message}
        onChange={field.onChange}
      />
    </FieldWrapper>
  );
}
