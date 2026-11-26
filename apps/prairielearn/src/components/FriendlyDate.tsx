import { type Temporal } from '@js-temporal/polyfill';
import { type FC, createContext, use } from 'react';

import { type formatDate, type formatDateFriendly, formatDateISO } from '@prairielearn/formatter';

import { formatGregorianTooltip, formatJalaliFriendly } from '../lib/jalali.js';

export interface FriendlyDateProps {
  date: Date | Temporal.PlainDateTime;
  timezone?: string;
  options?: Parameters<typeof formatDateFriendly>[2];
  fullOptions?: Parameters<typeof formatDate>[2];
  tooltip?: boolean;
}

export const FriendlyDate: FC<FriendlyDateProps> = ({
  date,
  timezone = null,
  options,
  tooltip = false,
}) => {
  const timezoneContext = use(TimezoneContext);
  const resolvedTimezone = timezone ?? timezoneContext;

  const friendlyString = formatJalaliFriendly(date, resolvedTimezone, {
    includeTz: options?.includeTz,
    dateOnly: options?.dateOnly,
    timeFirst: options?.timeFirst,
  });
  const gregorianTooltip = formatGregorianTooltip(date, resolvedTimezone);

  return (
    <time
      dateTime={formatDateISO(date, resolvedTimezone, { includeMs: true })}
      title={gregorianTooltip}
      data-bs-toggle={tooltip ? 'tooltip' : undefined}
      data-bs-title={tooltip ? gregorianTooltip : undefined}
      style={{ fontVariantNumeric: 'tabular-nums' }}
    >
      {friendlyString}
    </time>
  );
};

export const TimezoneContext = createContext<string>('UTC');
