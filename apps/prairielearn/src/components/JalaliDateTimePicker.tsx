import clsx from 'clsx';
import { type Ref, useEffect, useMemo, useRef, useState } from 'react';

import {
  JALALI_MONTH_NAMES,
  JALALI_WEEKDAY_SHORT,
  type JalaliDateTimeParts,
  formatIsoLocalAsJalali,
  getJalaliDayOfWeek,
  getTodayJalali,
  isoLocalToJalaliParts,
  jalaliMonthLength,
  jalaliPartsToIsoLocal,
  toPersianDigits,
} from '../lib/jalali.js';

export interface JalaliDateTimePickerProps {
  value?: string | null;
  defaultValue?: string;
  onChange?: (isoString: string) => void;
  onBlur?: () => void;
  name?: string;
  id?: string;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  className?: string;
  placeholder?: string;
  timezone?: string;
  showSeconds?: boolean;
  'aria-invalid'?: boolean | 'true' | 'false';
  'aria-errormessage'?: string;
  'aria-describedby'?: string;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'data-testid'?: string;
  ref?: Ref<HTMLInputElement>;
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function normalizeIsoLocal(value: string | null | undefined): string {
  if (!value) return '';
  const trimmed = value.trim();
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(trimmed)) {
    return `${trimmed}:00`;
  }
  return trimmed;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES_SECONDS = Array.from({ length: 60 }, (_, i) => i);

export function JalaliDateTimePicker({
  value,
  defaultValue,
  onChange,
  onBlur,
  name,
  id,
  disabled = false,
  readOnly = false,
  required = false,
  className,
  placeholder = 'انتخاب تاریخ و زمان...',
  timezone = 'Asia/Tehran',
  showSeconds = true,
  'aria-invalid': ariaInvalid,
  'aria-errormessage': ariaErrormessage,
  'aria-describedby': ariaDescribedby,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledby,
  'data-testid': dataTestId,
  ref,
}: JalaliDateTimePickerProps) {
  const isControlled = value !== undefined;
  const [internalValue, setInternalValue] = useState<string>(() => normalizeIsoLocal(defaultValue));
  const currentIso = normalizeIsoLocal(isControlled ? value : internalValue);

  const selectedParts = useMemo(() => isoLocalToJalaliParts(currentIso), [currentIso]);
  const today = useMemo(() => getTodayJalali(timezone), [timezone]);

  const [isOpen, setIsOpen] = useState(false);
  const [viewYear, setViewYear] = useState<number>(() => selectedParts?.jy ?? today.jy);
  const [viewMonth, setViewMonth] = useState<number>(() => selectedParts?.jm ?? today.jm);

  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedParts) {
      setViewYear(selectedParts.jy);
      setViewMonth(selectedParts.jm);
    }
  }, [selectedParts?.jy, selectedParts?.jm]);

  useEffect(() => {
    if (!isOpen) return;

    const handleMouseDown = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        onBlur?.();
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        onBlur?.();
      }
    };

    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onBlur]);

  const emitChange = (nextIso: string) => {
    if (!isControlled) {
      setInternalValue(nextIso);
    }
    onChange?.(nextIso);
  };

  const commitParts = (parts: JalaliDateTimeParts) => {
    const maxDay = jalaliMonthLength(parts.jy, parts.jm);
    const clampedDay = Math.min(Math.max(1, parts.jd), maxDay);
    const nextIso = jalaliPartsToIsoLocal({ ...parts, jd: clampedDay });
    emitChange(nextIso);
  };

  const handleSelectDay = (day: number) => {
    commitParts({
      jy: viewYear,
      jm: viewMonth,
      jd: day,
      hour: selectedParts?.hour ?? 0,
      minute: selectedParts?.minute ?? 0,
      second: showSeconds ? (selectedParts?.second ?? 0) : 0,
    });
  };

  const handleTimeChange = (field: 'hour' | 'minute' | 'second', val: number) => {
    const base = selectedParts ?? {
      jy: today.jy,
      jm: today.jm,
      jd: today.jd,
      hour: 0,
      minute: 0,
      second: 0,
    };
    commitParts({
      ...base,
      [field]: val,
    });
  };

  const handlePrevMonth = () => {
    if (viewMonth === 1) {
      setViewYear((y) => y - 1);
      setViewMonth(12);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 12) {
      setViewYear((y) => y + 1);
      setViewMonth(1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const handleToday = () => {
    const t = getTodayJalali(timezone);
    setViewYear(t.jy);
    setViewMonth(t.jm);
    commitParts({
      jy: t.jy,
      jm: t.jm,
      jd: t.jd,
      hour: selectedParts?.hour ?? 0,
      minute: selectedParts?.minute ?? 0,
      second: showSeconds ? (selectedParts?.second ?? 0) : 0,
    });
  };

  const handleClear = () => {
    emitChange('');
    setIsOpen(false);
    onBlur?.();
  };

  const displayValue = useMemo(
    () => (currentIso ? formatIsoLocalAsJalali(currentIso, { includeSeconds: showSeconds }) : ''),
    [currentIso, showSeconds],
  );

  const gregorianCaption = currentIso ? currentIso.replace('T', ' ') : '';
  const inputTitle = gregorianCaption ? `میلادی: ${gregorianCaption}` : undefined;

  const daysInMonth = jalaliMonthLength(viewYear, viewMonth);
  const firstDayOffset = getJalaliDayOfWeek(viewYear, viewMonth, 1);
  const minYear = Math.min(1380, viewYear - 5);
  const maxYear = Math.max(1430, viewYear + 5);
  const years = Array.from({ length: maxYear - minYear + 1 }, (_, i) => minYear + i);

  const isInvalid =
    ariaInvalid === true ||
    ariaInvalid === 'true' ||
    (typeof className === 'string' && className.split(/\s+/).includes('is-invalid'));

  return (
    <div ref={containerRef} className="position-relative" dir="rtl">
      {name ? <input type="hidden" name={name} value={currentIso} /> : null}
      <div className={clsx('input-group', isInvalid && 'has-validation')}>
        <input
          ref={ref}
          id={id}
          type="text"
          readOnly
          required={required}
          disabled={disabled}
          dir="rtl"
          className={clsx('form-control', className)}
          style={{ cursor: disabled || readOnly ? 'default' : 'pointer', fontVariantNumeric: 'tabular-nums' }}
          value={displayValue}
          placeholder={placeholder}
          title={inputTitle}
          aria-invalid={ariaInvalid}
          aria-errormessage={ariaErrormessage}
          aria-describedby={ariaDescribedby}
          aria-label={ariaLabel}
          aria-labelledby={ariaLabelledby}
          aria-expanded={isOpen}
          aria-haspopup="dialog"
          data-testid={dataTestId}
          onClick={() => {
            if (!disabled && !readOnly) {
              setIsOpen((prev) => !prev);
            }
          }}
          onKeyDown={(e) => {
            if (disabled || readOnly) return;
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              setIsOpen((prev) => !prev);
            } else if (e.key === 'Escape' && isOpen) {
              e.preventDefault();
              setIsOpen(false);
              onBlur?.();
            }
          }}
        />
        <button
          type="button"
          className="btn btn-outline-secondary"
          disabled={disabled || readOnly}
          aria-label="انتخاب تاریخ شمسی"
          aria-expanded={isOpen}
          onClick={() => {
            if (!disabled && !readOnly) {
              setIsOpen((prev) => !prev);
            }
          }}
        >
          <i className="bi bi-calendar3" aria-hidden="true" />
        </button>
      </div>

      {isOpen && !disabled && !readOnly ? (
        <div
          role="dialog"
          aria-label="تقویم شمسی"
          className="card shadow position-absolute mt-1 p-3"
          style={{ zIndex: 1055, minWidth: '305px', maxWidth: '340px', right: 0 }}
          dir="rtl"
        >
          <div className="d-flex align-items-center justify-content-between gap-1 mb-2">
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary"
              onClick={handlePrevMonth}
              aria-label="ماه قبل"
            >
              <i className="bi bi-chevron-right" aria-hidden="true" />
            </button>
            <div className="d-flex align-items-center gap-1 flex-grow-1">
              <select
                className="form-select form-select-sm"
                aria-label="ماه"
                value={viewMonth}
                onChange={(e) => setViewMonth(Number(e.target.value))}
              >
                {JALALI_MONTH_NAMES.map((mName, idx) => (
                  <option key={mName} value={idx + 1}>
                    {mName}
                  </option>
                ))}
              </select>
              <select
                className="form-select form-select-sm"
                aria-label="سال"
                value={viewYear}
                onChange={(e) => setViewYear(Number(e.target.value))}
              >
                {years.map((yr) => (
                  <option key={yr} value={yr}>
                    {toPersianDigits(yr)}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary"
              onClick={handleNextMonth}
              aria-label="ماه بعد"
            >
              <i className="bi bi-chevron-left" aria-hidden="true" />
            </button>
          </div>

          <div
            className="mb-1 text-center text-muted small fw-semibold"
            style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px' }}
          >
            {JALALI_WEEKDAY_SHORT.map((wd) => (
              <div key={wd} className="py-1">
                {wd}
              </div>
            ))}
          </div>

          <div
            className="mb-3"
            style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px' }}
          >
            {Array.from({ length: firstDayOffset }, (_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {Array.from({ length: daysInMonth }, (_, i) => {
              const day = i + 1;
              const isSelected =
                selectedParts?.jy === viewYear &&
                selectedParts?.jm === viewMonth &&
                selectedParts?.jd === day;
              const isToday =
                today.jy === viewYear && today.jm === viewMonth && today.jd === day;

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => handleSelectDay(day)}
                  className={clsx(
                    'btn btn-sm p-1 text-center',
                    isSelected ? 'btn-primary text-white fw-bold' : 'btn-light border-0',
                    !isSelected && isToday && 'border border-primary fw-bold text-primary',
                  )}
                  style={{ fontVariantNumeric: 'tabular-nums' }}
                  aria-pressed={isSelected}
                >
                  {toPersianDigits(day)}
                </button>
              );
            })}
          </div>

          <div className="d-flex align-items-center justify-content-between gap-2 border-top pt-2 mb-2">
            <span className="small text-muted">زمان:</span>
            <div className="d-flex align-items-center gap-1" dir="ltr">
              <select
                className="form-select form-select-sm text-center"
                aria-label="ساعت"
                style={{ width: '64px' }}
                value={selectedParts?.hour ?? 0}
                onChange={(e) => handleTimeChange('hour', Number(e.target.value))}
              >
                {HOURS.map((h) => (
                  <option key={h} value={h}>
                    {toPersianDigits(pad2(h))}
                  </option>
                ))}
              </select>
              <span>:</span>
              <select
                className="form-select form-select-sm text-center"
                aria-label="دقیقه"
                style={{ width: '64px' }}
                value={selectedParts?.minute ?? 0}
                onChange={(e) => handleTimeChange('minute', Number(e.target.value))}
              >
                {MINUTES_SECONDS.map((m) => (
                  <option key={m} value={m}>
                    {toPersianDigits(pad2(m))}
                  </option>
                ))}
              </select>
              {showSeconds ? (
                <>
                  <span>:</span>
                  <select
                    className="form-select form-select-sm text-center"
                    aria-label="ثانیه"
                    style={{ width: '64px' }}
                    value={selectedParts?.second ?? 0}
                    onChange={(e) => handleTimeChange('second', Number(e.target.value))}
                  >
                    {MINUTES_SECONDS.map((s) => (
                      <option key={s} value={s}>
                        {toPersianDigits(pad2(s))}
                      </option>
                    ))}
                  </select>
                </>
              ) : null}
            </div>
          </div>

          <div className="d-flex align-items-center gap-2 mb-2">
            <button type="button" className="btn btn-sm btn-outline-primary" onClick={handleToday}>
              امروز
            </button>
            <button type="button" className="btn btn-sm btn-outline-danger" onClick={handleClear}>
              پاک کردن
            </button>
            <button
              type="button"
              className="btn btn-sm btn-primary me-auto"
              onClick={() => {
                setIsOpen(false);
                onBlur?.();
              }}
            >
              تایید
            </button>
          </div>

          <div className="text-muted small text-center border-top pt-2" dir="ltr">
            {gregorianCaption ? `میلادی: ${gregorianCaption}` : 'تاریخی انتخاب نشده است'}
          </div>
        </div>
      ) : null}
    </div>
  );
}
