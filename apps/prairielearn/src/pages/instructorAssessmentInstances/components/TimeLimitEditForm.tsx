import { Temporal } from '@js-temporal/polyfill';
import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';
import { Alert, Button } from 'react-bootstrap';

import { formatDate } from '@prairielearn/formatter';
import { getAppError } from '@prairielearn/trpc/client';
import { assertNever } from '@prairielearn/utils';

import { JalaliDateTimePicker } from '../../../components/JalaliDateTimePicker.js';
import { useTRPC } from '../../../trpc/assessment/context.js';

import { useInvalidateAssessmentInstancesList } from './useInvalidateAssessmentInstancesList.js';

type TimeLimitAction =
  | 'set_total'
  | 'set_rem'
  | 'set_exact'
  | 'add'
  | 'subtract'
  | 'remove'
  | 'expire';

export function formatTimeDisplay(value: string): string {
  switch (value) {
    case 'Expired':
      return 'منقضی شده';
    case 'Closed':
      return 'بسته شده';
    case 'Closed (pending grading)':
      return 'بسته شده (در انتظار تصحیح)';
    case 'Open (no time limit)':
      return 'باز (بدون محدودیت زمان)';
    case '< 1 min':
      return 'کمتر از ۱ دقیقه';
    default:
      return value.endsWith(' min') ? `${value.slice(0, -4)} دقیقه` : value;
  }
}

function TimeLimitExplanation({ action }: { action: TimeLimitAction }) {
  let explanation = '';
  switch (action) {
    case 'set_total':
      explanation =
        'به‌روزرسانی محدودیت زمان کل، زمان مشخص‌شده را بر اساس زمان شروع ارزیابی تنظیم می‌کند.';
      break;
    case 'set_rem':
      explanation =
        'به‌روزرسانی زمان باقی‌مانده، زمان مشخص‌شده را بر اساس زمان فعلی تنظیم می‌کند.';
      break;
    case 'set_exact':
      explanation = 'این گزینه زمان دقیق بسته شدن ارزیابی را تنظیم می‌کند.';
      break;
    case 'add':
      explanation = 'این گزینه مقدار زمان مشخص‌شده را به زمان باقی‌مانده اضافه می‌کند.';
      break;
    case 'subtract':
      explanation = 'این گزینه مقدار زمان مشخص‌شده را از زمان باقی‌مانده کم می‌کند.';
      break;
    case 'remove':
      explanation = 'این گزینه محدودیت زمان را حذف کرده و ارزیابی باز می‌ماند.';
      break;
    case 'expire':
      explanation =
        'این گزینه محدودیت زمان را منقضی می‌کند و دانشجویان دیگر قادر به ارسال پاسخ نخواهند بود.';
      break;
    default:
      assertNever(action);
  }
  return <small className="form-text text-muted">{explanation}</small>;
}

/** Data for the single instance targeted by the inline ✎ pencil. */
interface TimeLimitSingleRow {
  open: boolean;
  total_time: string;
  total_time_sec: number | null;
  time_remaining: string;
  time_remaining_sec: number | null;
  date: string;
}

export function TimeLimitEditForm({
  mode,
  assessmentInstanceIds,
  targetDescription,
  hasOpenInstance,
  hasClosedInstance,
  hasTimeLimitInstance,
  singleRow,
  timezone,
  onSuccess,
  onCancel,
}: {
  mode: 'single' | 'bulk';
  assessmentInstanceIds: string[] | null;
  targetDescription?: string;
  /** Whether the targeted instances include at least one open instance. */
  hasOpenInstance: boolean;
  /** Whether the targeted instances include at least one closed instance. */
  hasClosedInstance: boolean;
  /** Whether the targeted instances include at least one instance with a time limit. */
  hasTimeLimitInstance: boolean;
  /** Present only in single mode; describes the row behind the ✎ pencil. */
  singleRow?: TimeLimitSingleRow;
  timezone: string;
  onSuccess: () => void;
  onCancel: () => void;
}) {
  const trpc = useTRPC();
  const invalidateList = useInvalidateAssessmentInstancesList();
  const mutation = useMutation({
    ...trpc.assessmentInstances.setTimeLimit.mutationOptions(),
    onSuccess: async () => {
      await invalidateList();
      onSuccess();
    },
  });
  const appError = getAppError<never>(mutation.error);

  const canAddSubtract =
    mode === 'single' ? singleRow?.time_remaining_sec != null : hasTimeLimitInstance;

  const [form, setForm] = useState<{
    action: TimeLimitAction;
    /**
     * Kept as the raw input string so in-progress edits (empty, trailing dot)
     * aren't collapsed to NaN; parsed to a number only when used.
     */
    time_add: string;
    date: string;
    reopen_closed: boolean;
    reopen_without_limit: boolean;
  }>(() => ({
    action: canAddSubtract ? 'add' : 'set_total',
    time_add: '5',
    date: Temporal.Now.zonedDateTimeISO(timezone).toPlainDateTime().toString().slice(0, 16),
    reopen_closed: false,
    reopen_without_limit: true,
  }));
  const timeAddValue = Number.parseFloat(form.time_add);

  // In single mode a closed instance shows the re-open radios; choosing
  // "re-open without time limit" hides the time-limit options entirely.
  const showReopenRadios = mode === 'single' && singleRow != null && !singleRow.open;
  const showTimeLimitOptions = mode === 'bulk' || singleRow?.open || !form.reopen_without_limit;
  const showTimeAddInput =
    showTimeLimitOptions &&
    form.action !== 'set_exact' &&
    form.action !== 'remove' &&
    form.action !== 'expire';

  const showRemove =
    mode === 'bulk' ||
    (singleRow != null && singleRow.open && singleRow.time_remaining !== 'Open (no time limit)');
  const showExpire =
    mode === 'bulk'
      ? hasOpenInstance
      : singleRow != null && singleRow.open && singleRow.time_remaining !== 'Expired';

  function updateFormState<T extends keyof typeof form>(key: T, value: (typeof form)[T]) {
    setForm({ ...form, [key]: value });
  }

  function proposedClosingTime() {
    if (singleRow == null || !Number.isFinite(timeAddValue)) return null;
    const totalTime = Math.round(singleRow.total_time_sec ?? 0);

    try {
      let startDate = Temporal.Instant.from(singleRow.date).toZonedDateTimeISO(timezone);
      if (form.action === 'set_total') {
        startDate = startDate.add({ minutes: timeAddValue });
      } else if (form.action === 'set_rem') {
        startDate = Temporal.Now.zonedDateTimeISO(timezone).add({ minutes: timeAddValue });
      } else if (form.action === 'add') {
        startDate = startDate.add({ seconds: totalTime }).add({ minutes: timeAddValue });
      } else if (form.action === 'subtract') {
        startDate = startDate.add({ seconds: totalTime }).subtract({ minutes: timeAddValue });
      }

      return formatDate(new Date(startDate.epochMilliseconds), timezone);
    } catch (err) {
      // Errors here may be due to large values or invalid inputs.
      console.error('Error calculating proposed closing time:', err);
      return null;
    }
  }

  function handleSubmit() {
    const reopenWithoutLimit = showReopenRadios && form.reopen_without_limit;
    const action = reopenWithoutLimit ? 'reopen_without_limit' : form.action;
    const actionUsesTimeAdd =
      action === 'set_total' || action === 'set_rem' || action === 'add' || action === 'subtract';
    mutation.mutate({
      assessmentInstanceIds,
      action,
      time_add: actionUsesTimeAdd ? timeAddValue : undefined,
      date: form.date,
      // In single mode we always re-open the targeted instance (matching the
      // legacy ✎ behavior). In bulk mode this is the explicit checkbox.
      reopen_closed: mode === 'single' ? true : form.reopen_closed,
    });
  }

  const showProposedClosingTime =
    mode === 'single' &&
    (singleRow?.open || !form.reopen_without_limit) &&
    (form.action === 'set_total' ||
      form.action === 'set_rem' ||
      form.action === 'add' ||
      form.action === 'subtract');

  return (
    <form
      name="set-time-limit-form"
      onSubmit={(e) => {
        e.preventDefault();
        handleSubmit();
      }}
    >
      {showReopenRadios ? (
        <div>
          <div className="form-check">
            <input
              className="form-check-input"
              type="radio"
              name="reopen_without_limit"
              id="reopen_without_limit"
              checked={form.reopen_without_limit}
              onChange={() => updateFormState('reopen_without_limit', true)}
            />
            <label className="form-check-label" htmlFor="reopen_without_limit">
              بازگشایی بدون محدودیت زمان
            </label>
          </div>
          <div className="form-check">
            <input
              className="form-check-input"
              type="radio"
              name="reopen_without_limit"
              id="reopen_with_limit"
              checked={!form.reopen_without_limit}
              onChange={() => updateFormState('reopen_without_limit', false)}
            />
            <label className="form-check-label" htmlFor="reopen_with_limit">
              بازگشایی با محدودیت زمان
            </label>
          </div>
        </div>
      ) : null}
      {mode === 'single' && singleRow ? (
        <p>
          محدودیت زمان کل: {formatTimeDisplay(singleRow.total_time)}
          <br />
          زمان باقی‌مانده: {formatTimeDisplay(singleRow.time_remaining)}
        </p>
      ) : (
        <p>{targetDescription}</p>
      )}
      {showTimeLimitOptions ? (
        <p>
          <select
            className="form-select select-time-limit"
            name="action"
            aria-label="گزینه‌های محدودیت زمان"
            value={form.action}
            onChange={(e) => updateFormState('action', e.currentTarget.value as TimeLimitAction)}
          >
            {canAddSubtract ? (
              mode === 'bulk' && hasOpenInstance ? (
                <>
                  <option value="add">افزودن به آزمون‌های دارای محدودیت زمان</option>
                  <option value="subtract">کاهش از آزمون‌های دارای محدودیت زمان</option>
                </>
              ) : (
                <>
                  <option value="add">افزودن</option>
                  <option value="subtract">کاهش</option>
                </>
              )
            ) : null}
            <option value="set_total">تنظیم محدودیت زمان کل</option>
            <option value="set_rem">تنظیم زمان باقی‌مانده</option>
            <option value="set_exact">تنظیم زمان دقیق بسته شدن</option>
            {showRemove ? <option value="remove">حذف محدودیت زمان</option> : null}
            {showExpire ? <option value="expire">منقضی کردن محدودیت زمان</option> : null}
          </select>
          <TimeLimitExplanation action={form.action} />
        </p>
      ) : null}
      {showTimeAddInput ? (
        <div className="input-group mb-2">
          <input
            className="form-control time-limit-field"
            type="number"
            name="time_add"
            aria-label="مقدار زمان"
            value={form.time_add}
            required
            onChange={(e) => updateFormState('time_add', e.currentTarget.value)}
          />
          <span className="input-group-text time-limit-field">دقیقه</span>
        </div>
      ) : null}
      {showTimeLimitOptions && form.action === 'set_exact' ? (
        <div className="d-flex align-items-stretch gap-2 date-picker mb-2">
          <div className="flex-grow-1">
            <JalaliDateTimePicker
              className="date-picker"
              name="date"
              aria-label="تاریخ و ساعت بسته شدن"
              value={form.date}
              timezone={timezone}
              required
              onChange={(val) => updateFormState('date', val)}
            />
          </div>
          <span className="input-group-text date-picker">{timezone}</span>
        </div>
      ) : null}
      {showProposedClosingTime ? <p>زمان پیشنهادی بسته شدن: {proposedClosingTime()}</p> : null}
      {mode === 'bulk' && hasClosedInstance ? (
        <div className="form-check mb-2">
          <input
            className="form-check-input"
            type="checkbox"
            name="reopen_closed"
            checked={form.reopen_closed}
            id="reopen_closed"
            onChange={(e) => updateFormState('reopen_closed', e.currentTarget.checked)}
          />
          <label className="form-check-label" htmlFor="reopen_closed">
            آزمون‌های بسته‌شده نیز بازگشایی شوند
          </label>
        </div>
      ) : null}
      {appError ? (
        <Alert variant="danger" className="mt-2 mb-2">
          {appError.message}
        </Alert>
      ) : null}
      <div className="btn-toolbar justify-content-end">
        <Button type="button" variant="secondary" className="me-2" onClick={onCancel}>
          انصراف
        </Button>
        <Button type="submit" variant="primary" disabled={mutation.isPending}>
          {mutation.isPending ? 'در حال ذخیره...' : 'تنظیم'}
        </Button>
      </div>
    </form>
  );
}
