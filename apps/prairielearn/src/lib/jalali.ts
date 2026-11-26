export interface JalaliDate {
  jy: number;
  jm: number;
  jd: number;
}

export interface GregorianDate {
  gy: number;
  gm: number;
  gd: number;
}

export interface JalaliDateTimeParts {
  jy: number;
  jm: number;
  jd: number;
  hour: number;
  minute: number;
  second: number;
}

export interface FormatJalaliFriendlyOptions {
  includeTz?: boolean;
  dateOnly?: boolean;
  timeFirst?: boolean;
}

export interface FormatIsoLocalAsJalaliOptions {
  includeSeconds?: boolean;
  persianDigits?: boolean;
}

export const JALALI_MONTH_NAMES = [
  'فروردین',
  'اردیبهشت',
  'خرداد',
  'تیر',
  'مرداد',
  'شهریور',
  'مهر',
  'آبان',
  'آذر',
  'دی',
  'بهمن',
  'اسفند',
] as const;

export const JALALI_WEEKDAY_SHORT = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'] as const;

const PERSIAN_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'] as const;

// Break years for the Jalali calendar leap-year cycle (Kazimierz Borkowski's algorithm).
const JALALI_BREAKS = [
  -61, 9, 38, 199, 426, 686, 756, 818, 1111, 1181, 1210, 1635, 2060, 2097, 2192, 2262, 2324, 2394,
  2456, 3178,
] as const;

function div(a: number, b: number): number {
  return Math.trunc(a / b);
}

function mod(a: number, b: number): number {
  return a - div(a, b) * b;
}

interface JalaliCalInfo {
  leap: number;
  gy: number;
  march: number;
}

/**
 * Computes leap-year offset and March equinox day in Gregorian year for a Jalali year.
 */
function jalCal(jy: number): JalaliCalInfo {
  const bl = JALALI_BREAKS.length;
  const gy = jy + 621;
  let leapJ = -14;
  let jp = JALALI_BREAKS[0];

  if (jy < jp || jy >= JALALI_BREAKS[bl - 1]) {
    throw new RangeError(`Jalali year out of supported range: ${jy}`);
  }

  let jump = 0;
  for (let i = 1; i < bl; i += 1) {
    const jm = JALALI_BREAKS[i];
    jump = jm - jp;
    if (jy < jm) {
      break;
    }
    leapJ = leapJ + div(jump, 33) * 8 + div(mod(jump, 33), 4);
    jp = jm;
  }

  let n = jy - jp;
  leapJ = leapJ + div(n, 33) * 8 + div(mod(n, 33) + 3, 4);
  if (mod(jump, 33) === 4 && jump - n === 4) {
    leapJ += 1;
  }

  const leapG = div(gy, 4) - div((div(gy, 100) + 1) * 3, 4) - 150;
  const march = 20 + leapJ - leapG;

  if (jump - n < 6) {
    n = n - jump + div(jump + 4, 33) * 33;
  }
  let leap = mod(mod(n + 1, 33) - 1, 4);
  if (leap === -1) {
    leap = 4;
  }

  return { leap, gy, march };
}

function g2d(gy: number, gm: number, gd: number): number {
  let d =
    div((gy + div(gm - 8, 6) + 100100) * 1461, 4) +
    div(153 * mod(gm + 9, 12) + 2, 5) +
    gd -
    34840408;
  d = d - div(div(gy + 100100 + div(gm - 8, 6), 100) * 3, 4) + 752;
  return d;
}

function d2g(jdn: number): GregorianDate {
  let j = 4 * jdn + 139361631;
  j = j + div(div(4 * jdn + 183187720, 146097) * 3, 4) * 4 - 3908;
  const i = div(mod(j, 1461), 4) * 5 + 308;
  const gd = div(mod(i, 153), 5) + 1;
  const gm = mod(div(i, 153), 12) + 1;
  const gy = div(j, 1461) - 100100 + div(8 - gm, 6);
  return { gy, gm, gd };
}

function j2d(jy: number, jm: number, jd: number): number {
  const r = jalCal(jy);
  return g2d(r.gy, 3, r.march) + (jm - 1) * 31 - div(jm, 7) * (jm - 7) + jd - 1;
}

function d2j(jdn: number): JalaliDate {
  const gy = d2g(jdn).gy;
  let jy = gy - 621;
  const r = jalCal(jy);
  const jdn1f = g2d(gy, 3, r.march);
  let k = jdn - jdn1f;
  let jm: number;
  let jd: number;

  if (k >= 0) {
    if (k <= 185) {
      jm = 1 + div(k, 31);
      jd = mod(k, 31) + 1;
      return { jy, jm, jd };
    }
    k -= 186;
  } else {
    jy -= 1;
    k += 179;
    if (r.leap === 1) {
      k += 1;
    }
  }

  jm = 7 + div(k, 30);
  jd = mod(k, 30) + 1;
  return { jy, jm, jd };
}

export function isJalaliLeapYear(jy: number): boolean {
  return jalCal(jy).leap === 0;
}

export function jalaliMonthLength(jy: number, jm: number): number {
  if (jm <= 6) return 31;
  if (jm <= 11) return 30;
  return isJalaliLeapYear(jy) ? 30 : 29;
}

export function gregorianToJalali(gy: number, gm: number, gd: number): JalaliDate {
  return d2j(g2d(gy, gm, gd));
}

export function jalaliToGregorian(jy: number, jm: number, jd: number): GregorianDate {
  return d2g(j2d(jy, jm, jd));
}

/**
 * Returns day of week in Persian week order: 0 = Saturday (شنبه) .. 6 = Friday (جمعه).
 */
export function getJalaliDayOfWeek(jy: number, jm: number, jd: number): number {
  const { gy, gm, gd } = jalaliToGregorian(jy, jm, jd);
  const jsDay = new Date(Date.UTC(gy, gm - 1, gd)).getUTCDay(); // 0=Sun..6=Sat
  return (jsDay + 1) % 7;
}

export function toPersianDigits(input: string | number): string {
  return String(input).replace(/\d/g, (d) => PERSIAN_DIGITS[Number(d)]);
}

export function toEnglishDigits(input: string): string {
  return input
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660));
}

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function pad4(n: number): string {
  return String(n).padStart(4, '0');
}

export function isoLocalToJalaliParts(isoStr: string): JalaliDateTimeParts | null {
  if (!isoStr || typeof isoStr !== 'string') return null;
  const match = isoStr
    .trim()
    .match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})(?::(\d{2}))?$/);
  if (!match) return null;

  const gy = Number(match[1]);
  const gm = Number(match[2]);
  const gd = Number(match[3]);
  const hour = Number(match[4]);
  const minute = Number(match[5]);
  const second = match[6] !== undefined ? Number(match[6]) : 0;

  if (
    gm < 1 ||
    gm > 12 ||
    gd < 1 ||
    gd > 31 ||
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59 ||
    second < 0 ||
    second > 59
  ) {
    return null;
  }

  const checkDate = new Date(Date.UTC(gy, gm - 1, gd));
  if (
    checkDate.getUTCFullYear() !== gy ||
    checkDate.getUTCMonth() + 1 !== gm ||
    checkDate.getUTCDate() !== gd
  ) {
    return null;
  }

  const { jy, jm, jd } = gregorianToJalali(gy, gm, gd);
  return { jy, jm, jd, hour, minute, second };
}

export function jalaliPartsToIsoLocal(parts: JalaliDateTimeParts): string {
  const { gy, gm, gd } = jalaliToGregorian(parts.jy, parts.jm, parts.jd);
  return `${pad4(gy)}-${pad2(gm)}-${pad2(gd)}T${pad2(parts.hour)}:${pad2(parts.minute)}:${pad2(parts.second)}`;
}

export function formatIsoLocalAsJalali(
  isoStr: string,
  options: FormatIsoLocalAsJalaliOptions = {},
): string {
  const { includeSeconds = true, persianDigits = true } = options;
  const parts = isoLocalToJalaliParts(isoStr);
  if (!parts) return '';

  const timeStr = includeSeconds
    ? `${pad2(parts.hour)}:${pad2(parts.minute)}:${pad2(parts.second)}`
    : `${pad2(parts.hour)}:${pad2(parts.minute)}`;
  const formatted = `${pad4(parts.jy)}/${pad2(parts.jm)}/${pad2(parts.jd)} - ${timeStr}`;
  return persianDigits ? toPersianDigits(formatted) : formatted;
}

export interface PlainDateTimeLike {
  toZonedDateTime: (timeZone: string) => { epochMilliseconds: number };
}

function resolveDate(date: Date | string | PlainDateTimeLike, timezone: string): Date | null {
  if (date instanceof Date) {
    return Number.isNaN(date.getTime()) ? null : date;
  }
  if (typeof date === 'string') {
    const parsed = new Date(date);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  if (date && typeof date === 'object' && typeof date.toZonedDateTime === 'function') {
    const ms = date.toZonedDateTime(timezone).epochMilliseconds;
    const parsed = new Date(ms);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }
  return null;
}

export function getTodayJalali(timezone = 'Asia/Tehran'): JalaliDate {
  const now = new Date();
  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(now);
    const map = Object.fromEntries(parts.map((p) => [p.type, p.value]));
    return gregorianToJalali(Number(map.year), Number(map.month), Number(map.day));
  } catch {
    return gregorianToJalali(now.getFullYear(), now.getMonth() + 1, now.getDate());
  }
}

export function formatJalaliFriendly(
  date: Date | string | PlainDateTimeLike,
  timezone = 'Asia/Tehran',
  options: FormatJalaliFriendlyOptions = {},
): string {
  const tz = timezone || 'Asia/Tehran';
  const { includeTz = true, dateOnly = false, timeFirst = false } = options;
  const resolved = resolveDate(date, tz);
  if (!resolved) return '';

  try {
    const faParts = new Intl.DateTimeFormat('fa-IR-u-ca-persian', {
      timeZone: tz,
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).formatToParts(resolved);

    const map = Object.fromEntries(faParts.map((p) => [p.type, p.value]));
    const datePart = `${map.day} ${map.month} ${map.year}`;
    const timePart = `${map.hour}:${map.minute}`;

    let result: string;
    if (dateOnly) {
      result = datePart;
    } else if (timeFirst) {
      result = `${timePart}، ${datePart}`;
    } else {
      result = `${datePart}، ${timePart}`;
    }

    if (includeTz) {
      const tzParts = new Intl.DateTimeFormat('en-US', {
        timeZone: tz,
        timeZoneName: 'short',
      }).formatToParts(resolved);
      const tzName = tzParts.find((p) => p.type === 'timeZoneName')?.value ?? tz;
      result = `${result} (${tzName})`;
    }

    return result;
  } catch {
    return resolved.toISOString();
  }
}

export function formatGregorianTooltip(
  date: Date | string | PlainDateTimeLike,
  timezone = 'Asia/Tehran',
): string {
  const tz = timezone || 'Asia/Tehran';
  const resolved = resolveDate(date, tz);
  if (!resolved) return '';

  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      hourCycle: 'h23',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).formatToParts(resolved);
    const map = Object.fromEntries(parts.map((p) => [p.type, p.value]));
    return `${map.year}-${map.month}-${map.day} ${map.hour}:${map.minute} (${tz})`;
  } catch {
    return resolved.toISOString();
  }
}
