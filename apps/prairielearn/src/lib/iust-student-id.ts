/**
 * IUST (Iran University of Science and Technology) Student & Staff ID Validator/Decoder.
 *
 * Verified against IUST Golestan student IDs:
 * - 1400+ entries (9 digits): YYY FF M SSS
 *   - YYY: 3-digit Shamsi entry year (400..410 -> 1400..1410)
 *   - FF:  2-digit faculty code (10..99, e.g. 44 = Math & CS, 52 = CE, 41 = EE, 43 = Mech)
 *   - M:   1-digit degree/track/shift code
 *   - SSS: 3-digit student serial (001..999)
 * - Pre-1400 entries (8 digits): YY FF M SSS (YY: 90..99 -> 1390..1399)
 * - Graduate/special cohorts (10 digits): starts with 400..410 or 90..99
 * - Faculty/Staff/TA personnel IDs (when isStaff=true): 5..12 digits
 */

const PERSIAN_DIGITS = '۰۱۲۳۴۵۶۷۸۹';
const ARABIC_DIGITS = '٠١٢٣٤٥٦٧٨٩';

export const IUST_FACULTY_CODES: Record<string, string> = {
  '44': 'دانشکده ریاضی و علوم کامپیوتر',
  '52': 'دانشکده مهندسی کامپیوتر',
  '41': 'دانشکده مهندسی برق',
  '42': 'دانشکده مهندسی عمران / علوم پایه',
  '43': 'دانشکده مهندسی مکانیک',
};

export function normalizeDigits(raw: string): string {
  return raw
    .replaceAll(/[۰-۹]/g, (d) => String(PERSIAN_DIGITS.indexOf(d)))
    .replaceAll(/[٠-٩]/g, (d) => String(ARABIC_DIGITS.indexOf(d)))
    .replaceAll(/[\s\u200B-\u200F\u202A-\u202E\uFEFF]/g, '');
}

export function toPersianDigits(input: string | number): string {
  return String(input).replaceAll(/\d/g, (d) => PERSIAN_DIGITS[Number(d)]);
}

export function isDummyNumberSequence(digits: string): boolean {
  if (digits.startsWith('000')) return true;
  if (/^(\d)\1+$/.test(digits)) return true;
  if (/^(\d{2})\1+$/.test(digits)) return true;
  const diffs = new Set<number>();
  for (let i = 1; i < digits.length; i++) {
    diffs.add((Number(digits[i]) - Number(digits[i - 1]) + 10) % 10);
  }
  if (diffs.size === 1 && (diffs.has(1) || diffs.has(9))) return true;
  return false;
}

export type IustUinValidation =
  | {
      ok: true;
      uin: string;
      isStaff: boolean;
      entryYear?: number;
      facultyCode?: string;
      facultyName?: string;
      summary: string;
    }
  | {
      ok: false;
      reason: 'FORMAT' | 'YEAR' | 'FAKE';
      message: string;
    };

export function validateIustUin(
  raw: string,
  options?: { isStaff?: boolean },
): IustUinValidation {
  const isStaff = Boolean(options?.isStaff);
  const uin = normalizeDigits(raw);

  if (!/^[0-9]+$/.test(uin)) {
    return {
      ok: false,
      reason: 'FORMAT',
      message: 'شماره دانشجویی / پرسنلی باید فقط شامل ارقام باشد.',
    };
  }

  if (isStaff) {
    if (uin.length < 5 || uin.length > 12) {
      return {
        ok: false,
        reason: 'FORMAT',
        message: 'کد پرسنلی باید بین ۵ تا ۱۲ رقم باشد.',
      };
    }
    if (isDummyNumberSequence(uin)) {
      return {
        ok: false,
        reason: 'FAKE',
        message: 'کد پرسنلی وارد شده معتبر به نظر نمی‌رسد.',
      };
    }
    return {
      ok: true,
      uin,
      isStaff: true,
      summary: 'کد پرسنلی / کادر آموزشی معتبر است',
    };
  }

  // Student ID mode (IUST Golestan: 8, 9, or 10 digits)
  if (uin.length < 8 || uin.length > 10) {
    return {
      ok: false,
      reason: 'FORMAT',
      message:
        'شماره دانشجویی دانشگاه علم و صنعت باید ۹ رقم (ورودی‌های ۱۴۰۰ به بعد، مثلاً 405441001) یا ۸ رقم (ورودی‌های قبل از ۱۴۰۰) باشد.',
    };
  }

  if (isDummyNumberSequence(uin)) {
    return {
      ok: false,
      reason: 'FAKE',
      message:
        'شماره دانشجویی وارد شده معتبر به نظر نمی‌رسد. لطفاً شماره دانشجویی واقعی گلستان خود را وارد کنید.',
    };
  }

  // 9-digit (1400+ standard IUST format: YYY FF M SSS)
  if (uin.length === 9) {
    const yearPrefix = Number(uin.slice(0, 3));
    if (yearPrefix < 400 || yearPrefix > 410) {
      return {
        ok: false,
        reason: 'YEAR',
        message:
          'سه رقم اول شماره دانشجویی ۹ رقمی باید سال ورود معتبر (۴۰۰ تا ۴۱۰، مثلاً 404 برای ورودی ۱۴۰۴) باشد.',
      };
    }
    const facultyCode = uin.slice(3, 5);
    const serial = uin.slice(6, 9);
    if (Number(facultyCode) < 10 || serial === '000') {
      return {
        ok: false,
        reason: 'FAKE',
        message: 'ساختار کد دانشکده یا شماره سریال دانشجویی نامعتبر است.',
      };
    }
    const entryYear = 1000 + yearPrefix;
    const facultyName = IUST_FACULTY_CODES[facultyCode];
    const summary = facultyName
      ? `ساختار معتبر علم و صنعت — ورودی ${toPersianDigits(entryYear)} | ${facultyName}`
      : `ساختار معتبر علم و صنعت — ورودی ${toPersianDigits(entryYear)} (کد دانشکده ${toPersianDigits(facultyCode)})`;
    return {
      ok: true,
      uin,
      isStaff: false,
      entryYear,
      facultyCode,
      facultyName,
      summary,
    };
  }

  // 8-digit (pre-1400 IUST format: YY FF M SSS)
  if (uin.length === 8) {
    const yearPrefix = Number(uin.slice(0, 2));
    if (yearPrefix < 90 || yearPrefix > 99) {
      return {
        ok: false,
        reason: 'YEAR',
        message:
          'دو رقم اول شماره دانشجویی ۸ رقمی باید سال ورود ۱۳۹۰ تا ۱۳۹۹ (۹۰ تا ۹۹) باشد؛ برای ورودی‌های ۱۴۰۰ به بعد شماره ۹ رقمی وارد کنید.',
      };
    }
    const facultyCode = uin.slice(2, 4);
    const serial = uin.slice(5, 8);
    if (Number(facultyCode) < 10 || serial === '000') {
      return {
        ok: false,
        reason: 'FAKE',
        message: 'ساختار شماره دانشجویی نامعتبر است.',
      };
    }
    const entryYear = 1300 + yearPrefix;
    const facultyName = IUST_FACULTY_CODES[facultyCode];
    const summary = facultyName
      ? `ساختار معتبر علم و صنعت — ورودی ${toPersianDigits(entryYear)} | ${facultyName}`
      : `ساختار معتبر علم و صنعت — ورودی ${toPersianDigits(entryYear)}`;
    return {
      ok: true,
      uin,
      isStaff: false,
      entryYear,
      facultyCode,
      facultyName,
      summary,
    };
  }

  // 10-digit (graduate / special cohorts)
  const y3 = Number(uin.slice(0, 3));
  const y2 = Number(uin.slice(0, 2));
  if (!((y3 >= 400 && y3 <= 410) || (y2 >= 90 && y2 <= 99))) {
    return {
      ok: false,
      reason: 'YEAR',
      message: 'پیش‌شماره سال ورود در شماره دانشجویی معتبر نیست.',
    };
  }
  const entryYear = y3 >= 400 && y3 <= 410 ? 1000 + y3 : 1300 + y2;
  return {
    ok: true,
    uin,
    isStaff: false,
    entryYear,
    summary: `ساختار معتبر علم و صنعت — ورودی ${toPersianDigits(entryYear)}`,
  };
}
