import { z } from 'zod';

import * as sqldb from '@prairielearn/postgres';

import {
  JALALI_MONTH_NAMES,
  getTodayJalali,
  jalaliToGregorian,
  toPersianDigits,
} from './jalali.js';
import { invalidateStudentGamificationCache } from './student-gamification.js';

const sql = sqldb.loadSqlEquiv(import.meta.url);

export const DAILY_PULSE_XP_REWARD = 25;

export interface DailyPulsePuzzle {
  id: string;
  topicFa: string;
  difficultyFa: string;
  promptFa: string;
  codeSnippet: string;
  options: [string, string, string, string];
  correctIndex: 0 | 1 | 2 | 3;
  explanationFa: string;
}

export interface DailyPulseState {
  puzzle: DailyPulsePuzzle;
  jalaliDayKey: string;
  jalaliDateLabel: string;
  attempt: {
    selectedOption: number;
    isCorrect: boolean;
  } | null;
  xpReward: number;
}

export const DAILY_PULSE_PUZZLES: readonly DailyPulsePuzzle[] = [
  {
    id: 'pulse-01',
    topicFa: 'عملگرها و تقسیم صحیح',
    difficultyFa: 'ساده',
    promptFa: 'خروجی دقیق این کد پایتون چیست؟',
    codeSnippet: 'print(-7 // 2, 7 // 2)',
    options: ['-3 3', '-4 3', '-3.5 3.5', '-4 4'],
    correctIndex: 1,
    explanationFa:
      'در پایتون عملگر // همیشه به سمت منفی بی‌نهایت گرد می‌کند (Floor Division)؛ پس -7 // 2 برابر -4 می‌شود.',
  },
  {
    id: 'pulse-02',
    topicFa: 'باقی‌مانده اعداد منفی',
    difficultyFa: 'متوسط',
    promptFa: 'خروجی عبارت زیر در پایتون کدام است؟',
    codeSnippet: 'print(-7 % 3)',
    options: ['-1', '1', '2', '-2'],
    correctIndex: 2,
    explanationFa:
      'در پایتون علامت باقی‌مانده (%) همواره با علامت مقسوم‌علیه یکی است: -7 = (-3) * 3 + 2، پس خروجی 2 است.',
  },
  {
    id: 'pulse-03',
    topicFa: 'تقدم عملگرها',
    difficultyFa: 'ساده',
    promptFa: 'تقدم توان و منفی یکانی چه خروجی‌ای تولید می‌کند؟',
    codeSnippet: 'print(-2 ** 2, (-2) ** 2)',
    options: ['4 4', '-4 4', '4 -4', '-4 -4'],
    correctIndex: 1,
    explanationFa:
      'عملگر توان (**) تقدم بالاتری نسبت به علامت منفی یکانی دارد؛ بنابراین -2 ** 2 به صورت -(2 ** 2) محاسبه می‌شود.',
  },
  {
    id: 'pulse-04',
    topicFa: 'مقایسه‌های زنجیره‌ای',
    difficultyFa: 'ساده',
    promptFa: 'نتیجه این دو مقایسه زنجیره‌ای چیست؟',
    codeSnippet: 'print(1 < 3 < 2, 1 < 2 <= 2)',
    options: ['False True', 'True True', 'False False', 'خطای نحوی (SyntaxError)'],
    correctIndex: 0,
    explanationFa:
      'عبارت 1 < 3 < 2 معادل (1 < 3) and (3 < 2) است که False می‌شود، اما 1 < 2 <= 2 برقرار است.',
  },
  {
    id: 'pulse-05',
    topicFa: 'رشته‌ها',
    difficultyFa: 'ساده',
    promptFa: 'خروجی کد زیر چیست؟',
    codeSnippet: 's = "ha" * 2 + "!"\nprint(len(s), s)',
    options: ['4 haha!', '5 haha!', '3 ha2!', '5 ha!ha!'],
    correctIndex: 1,
    explanationFa:
      'تکرار رشته با * ابتدا "haha" را می‌سازد و با "!" جمع می‌شود؛ رشته نهایی "haha!" به طول ۵ کاراکتر است.',
  },
  {
    id: 'pulse-06',
    topicFa: 'برش رشته (Slicing)',
    difficultyFa: 'متوسط',
    promptFa: 'گام منفی در Slicing چه رشته‌ای چاپ می‌کند؟',
    codeSnippet: 'word = "PYTHON"\nprint(word[::-2])',
    options: ['PTO', 'NOH', 'NHY', 'YHN'],
    correctIndex: 2,
    explanationFa:
      'با گام -2 از آخرین کاراکتر (N) شروع کرده و یکی در میان به عقب می‌رویم: N، سپس H، سپس Y.',
  },
  {
    id: 'pulse-07',
    topicFa: 'محدوده Slicing',
    difficultyFa: 'متوسط',
    promptFa: 'اگر اندیس پایان یا شروع از طول رشته بیشتر باشد چه می‌شود؟',
    codeSnippet: 's = "python"\nprint(s[2:99], len(s[10:]))',
    options: ['IndexError رخ می‌دهد', 'thon 0', 'hon 0', 'thon 6'],
    correctIndex: 1,
    explanationFa:
      'برش (Slice) در پایتون هرگز خطای IndexError نمی‌دهد؛ s[2:99] برابر "thon" و s[10:] یک رشته تهی به طول 0 است.',
  },
  {
    id: 'pulse-08',
    topicFa: 'باگ‌یابی (Immutable str)',
    difficultyFa: 'ساده',
    promptFa: 'اشکال یا نتیجه اجرای این قطعه کد چیست؟',
    codeSnippet: 'name = "ali"\nname[0] = "A"\nprint(name)',
    options: ['Ali چاپ می‌شود', 'ali چاپ می‌شود', 'خطای TypeError می‌دهد', 'خطای IndexError می‌دهد'],
    correctIndex: 2,
    explanationFa:
      'رشته‌ها در پایتون تغییرناپذیر (Immutable) هستند؛ برای تغییر حرف اول باید رشته جدید ساخت (مثلاً "A" + name[1:]).',
  },
  {
    id: 'pulse-09',
    topicFa: 'تابع range',
    difficultyFa: 'ساده',
    promptFa: 'لیست ساخته‌شده توسط این range کدام است؟',
    codeSnippet: 'print(list(range(10, 2, -3)))',
    options: ['[10, 7, 4, 1]', '[10, 7, 4]', '[10, 7]', '[9, 6, 3]'],
    correctIndex: 1,
    explanationFa:
      'تولید اعداد از ۱۰ با گام -3 آغاز می‌شود (۱۰، ۷، ۴) و پیش از رسیدن به مرز ۲ متوقف می‌گردد.',
  },
  {
    id: 'pulse-10',
    topicFa: 'ساختار for-else',
    difficultyFa: 'متوسط',
    promptFa: 'در این حلقه چه متنی چاپ می‌شود؟',
    codeSnippet: 'for i in range(3):\n    if i == 5:\n        break\nelse:\n    print("OK")',
    options: ['هیچ‌چیز چاپ نمی‌شود', 'OK چاپ می‌شود', '۳ بار OK چاپ می‌شود', 'خطای SyntaxError'],
    correctIndex: 1,
    explanationFa:
      'بخش else حلقه for زمانی اجرا می‌شود که حلقه بدون برخورد به break به پایان طبیعی برسد.',
  },
  {
    id: 'pulse-11',
    topicFa: 'ساختار for-else و break',
    difficultyFa: 'متوسط',
    promptFa: 'خروجی دقیق این حلقه کدام است؟',
    codeSnippet:
      'for x in [2, 4, 6]:\n    if x == 4:\n        print("A")\n        break\nelse:\n    print("B")',
    options: ['A و سپس B', 'فقط A', 'فقط B', 'هیچ‌چیز'],
    correctIndex: 1,
    explanationFa: 'به محض اجرای break در مقدار x = 4، حلقه قطع شده و بلوک else دیگر اجرا نمی‌شود.',
  },
  {
    id: 'pulse-12',
    topicFa: 'باگ‌یابی while و continue',
    difficultyFa: 'چالشی',
    promptFa: 'در حین اجرای کد زیر چه اتفاقی می‌افتد؟',
    codeSnippet: 'i = 0\nwhile i < 3:\n    if i == 1:\n        continue\n    print(i)\n    i += 1',
    options: [
      'اعداد 0 و 2 چاپ می‌شوند',
      'اعداد 0 و 1 و 2 چاپ می‌شوند',
      'پس از چاپ 0 وارد حلقه بی‌نهایت می‌شود',
      'اصلاً چیزی چاپ نمی‌شود',
    ],
    correctIndex: 2,
    explanationFa:
      'وقتی i به 1 می‌رسد، دستور continue قبل از i += 1 اجرا شده و باعث می‌شود i برای همیشه 1 بماند!',
  },
  {
    id: 'pulse-13',
    topicFa: 'ارجاع لیست‌ها (Aliasing)',
    difficultyFa: 'ساده',
    promptFa: 'خروجی کد زیر پس از append چیست؟',
    codeSnippet: 'a = [1, 2, 3]\nb = a\nb.append(4)\nprint(len(a), a[-1])',
    options: ['3 3', '4 4', '4 3', '3 4'],
    correctIndex: 1,
    explanationFa:
      'انتساب b = a یک کپی جدید نمی‌سازد؛ هر دو نام به یک لیست واحد در حافظه اشاره می‌کنند.',
  },
  {
    id: 'pulse-14',
    topicFa: 'کپی سطحی با Slice',
    difficultyFa: 'ساده',
    promptFa: 'این بار خروجی چه خواهد بود؟',
    codeSnippet: 'a = [10, 20]\nb = a[:]\nb[0] = 99\nprint(a[0], b[0])',
    options: ['99 99', '10 99', '99 20', '10 20'],
    correctIndex: 1,
    explanationFa:
      'عبارت a[:] یک کپی مستقل (Shallow Copy) از لیست می‌سازد، بنابراین تغییر b[0] روی a اثری ندارد.',
  },
  {
    id: 'pulse-15',
    topicFa: 'تله ماتریس [[0]*2]*3',
    difficultyFa: 'چالشی',
    promptFa: 'این باگ معروف ماتریس در پایتون چه چاپی می‌دهد؟',
    codeSnippet: 'm = [[0] * 2] * 3\nm[0][1] = 7\nprint(m[2][1])',
    options: ['0', '7', 'None', 'خطای TypeError'],
    correctIndex: 1,
    explanationFa:
      'ضرب * 3 هر سه سطر را به یک لیست داخلی مشترک ارجاع می‌دهد! راه درست: [[0] * 2 for _ in range(3)].',
  },
  {
    id: 'pulse-16',
    topicFa: 'متدهای لیست (pop)',
    difficultyFa: 'ساده',
    promptFa: 'مقدار x و وضعیت نهایی nums چیست؟',
    codeSnippet: 'nums = [10, 20, 30]\nx = nums.pop(1)\nprint(x, nums)',
    options: ['10 [20, 30]', '20 [10, 30]', '30 [10, 20]', 'None [10, 30]'],
    correctIndex: 1,
    explanationFa:
      'متد pop(1) عنصر اندیس ۱ یعنی 20 را از لیست حذف کرده و همان مقدار را برمی‌گرداند.',
  },
  {
    id: 'pulse-17',
    topicFa: 'باگ‌یابی sort() در پایتون',
    difficultyFa: 'متوسط',
    promptFa: 'خروجی print(res, arr[0]) چیست؟',
    codeSnippet: 'arr = [3, 1, 2]\nres = arr.sort()\nprint(res, arr[0])',
    options: ['[1, 2, 3] 1', '[1, 2, 3] 3', 'None 1', 'None 3'],
    correctIndex: 2,
    explanationFa:
      'متد list.sort() لیست را درجا (In-place) مرتب می‌کند و مقدار None برمی‌گرداند؛ برای گرفتن لیست جدید از sorted() استفاده کنید.',
  },
  {
    id: 'pulse-18',
    topicFa: 'تاپل تک‌عضوی (Tuple)',
    difficultyFa: 'متوسط',
    promptFa: 'نوع داده‌های t1 و t2 کدام است؟',
    codeSnippet: 't1 = (5)\nt2 = (5,)\nprint(type(t1).__name__, type(t2).__name__)',
    options: ['tuple tuple', 'int int', 'int tuple', 'tuple int'],
    correctIndex: 2,
    explanationFa:
      'پرانتز بدون کاما مثل (5) فقط گروه ریاضی است و یک int می‌سازد؛ کامای پایانی در (5,) آن را به tuple تبدیل می‌کند.',
  },
  {
    id: 'pulse-19',
    topicFa: 'باز کردن دنباله‌ها (Unpacking)',
    difficultyFa: 'متوسط',
    promptFa: 'متغیر b چه مقداری می‌گیرد؟',
    codeSnippet: 'a, *b, c = [1, 2, 3, 4, 5]\nprint(b)',
    options: ['(2, 3, 4)', '[2, 3, 4]', '2', '[2, 3, 4, 5]'],
    correctIndex: 1,
    explanationFa:
      'عملگر ستاره (*b) در Unpacking همیشه مقادیر میانی باقی‌مانده را در قالب یک list جمع‌آوری می‌کند.',
  },
  {
    id: 'pulse-20',
    topicFa: 'دیکشنری و متد get',
    difficultyFa: 'ساده',
    promptFa: 'حاصل جمع با get در این کد چیست؟',
    codeSnippet: 'd = {"a": 1}\nprint(d.get("b", 0) + d.get("a", 0))',
    options: ['خطای KeyError', '0', '1', 'None'],
    correctIndex: 2,
    explanationFa:
      'وقتی کلید "b" وجود ندارد، d.get("b", 0) به جای خطا مقدار پیش‌فرض 0 را برمی‌گرداند و جمع با 1 برابر 1 می‌شود.',
  },
  {
    id: 'pulse-21',
    topicFa: 'مجموعه‌ها (Set)',
    difficultyFa: 'ساده',
    promptFa: 'اندازه مجموعه ساخته‌شده از "banana" چند است؟',
    codeSnippet: 's = set("banana")\nprint(len(s))',
    options: ['6', '4', '3', '2'],
    correctIndex: 2,
    explanationFa:
      'مجموعه (set) عناصر تکراری را حذف می‌کند؛ کاراکترهای یکتا عبارت‌اند از b و a و n (۳ کاراکتر).',
  },
  {
    id: 'pulse-22',
    topicFa: 'ارزیابی کوتاه‌مدار (Short-Circuit)',
    difficultyFa: 'متوسط',
    promptFa: 'عملگرهای or و and در پایتون چه چیزی برمی‌گردانند؟',
    codeSnippet: 'print("" or "Python", 0 and "Code")',
    options: ['True False', 'Python 0', '"" "Code"', 'True 0'],
    correctIndex: 1,
    explanationFa:
      'در پایتون or اولین مقدار Truthy ("Python") و and اولین مقدار Falsy (0) را عیناً برمی‌گردانند.',
  },
  {
    id: 'pulse-23',
    topicFa: 'مقایسه == در برابر is',
    difficultyFa: 'متوسط',
    promptFa: 'خروجی مقایسه دو لیست مساوی اما مجزا چیست؟',
    codeSnippet: 'x = [1, 2]\ny = [1, 2]\nprint(x == y, x is y)',
    options: ['True True', 'False False', 'True False', 'False True'],
    correctIndex: 2,
    explanationFa:
      'عملگر == محتوا را مقایسه می‌کند (True)، ولی is یکسان بودن نشانی حافظه دو شیء مجزا را بررسی می‌کند (False).',
  },
  {
    id: 'pulse-24',
    topicFa: 'توابع بدون return',
    difficultyFa: 'ساده',
    promptFa: 'خروجی اجرای این تابع و print(res) چیست؟',
    codeSnippet: 'def add_print(a, b):\n    print(a + b)\n\nres = add_print(2, 3)\nprint(res)',
    options: ['فقط 5', '5 و سپس 5', '5 و سپس None', 'فقط None'],
    correctIndex: 2,
    explanationFa:
      'تابع داخل خود 5 را چاپ می‌کند، اما چون دستور return ندارد مقدار None را به res برمی‌گرداند.',
  },
  {
    id: 'pulse-25',
    topicFa: 'تله پیش‌فرض تغییرپذیر در تابع',
    difficultyFa: 'چالشی',
    promptFa: 'دو فراخوانی متوالی این تابع چه خروجی‌ای می‌دهند؟',
    codeSnippet:
      'def f(val, lst=[]):\n    lst.append(val)\n    return lst\n\nprint(f(1))\nprint(f(2))',
    options: ['[1] و [2]', '[1] و [1, 2]', '[1, 2] و [1, 2]', 'خطای ValueError'],
    correctIndex: 1,
    explanationFa:
      'مقدار پیش‌فرض lst=[] فقط یک بار هنگام تعریف تابع ساخته می‌شود و بین فراخوانی‌ها مشترک می‌ماند!',
  },
  {
    id: 'pulse-26',
    topicFa: 'حوزه متغیرها (Scope)',
    difficultyFa: 'ساده',
    promptFa: 'مقدار x سراسری پس از اجرای تابع g() چیست؟',
    codeSnippet: 'x = 10\ndef g():\n    x = 5\n    return x\nprint(g(), x)',
    options: ['5 5', '5 10', '10 10', 'خطای UnboundLocalError'],
    correctIndex: 1,
    explanationFa:
      'متغیر x = 5 داخل تابع یک متغیر محلی جدید است و بدون کلمه کلیدی global روی x بیرون تغییری نمی‌دهد.',
  },
  {
    id: 'pulse-27',
    topicFa: 'توابع بازگشتی (Recursion)',
    difficultyFa: 'متوسط',
    promptFa: 'خروجی فراخوانی rec(5) کدام عدد است؟',
    codeSnippet:
      'def rec(n):\n    if n <= 0:\n        return 0\n    return n + rec(n - 2)\n\nprint(rec(5))',
    options: ['8', '9', '10', '15'],
    correctIndex: 1,
    explanationFa:
      'گام‌های بازگشت: 5 + rec(3) = 5 + (3 + rec(1)) = 5 + 3 + (1 + rec(-1)) = 5 + 3 + 1 + 0 = 9.',
  },
  {
    id: 'pulse-28',
    topicFa: 'List Comprehension',
    difficultyFa: 'ساده',
    promptFa: 'حاصل این List Comprehension شرطی چیست؟',
    codeSnippet: 'res = [x * x for x in range(5) if x % 2 == 1]\nprint(res)',
    options: ['[0, 4, 16]', '[1, 9]', '[1, 9, 25]', '[1, 3]'],
    correctIndex: 1,
    explanationFa: 'در range(5) اعداد فرد یعنی ۱ و ۳ انتخاب شده و به توان دو می‌رسند: [1, 9].',
  },
  {
    id: 'pulse-29',
    topicFa: 'تابع enumerate',
    difficultyFa: 'متوسط',
    promptFa: 'پس از پایان حلقه، print(i, v) چه چاپی می‌دهد؟',
    codeSnippet: 'items = ["x", "y"]\nfor i, v in enumerate(items, 1):\n    pass\nprint(i, v)',
    options: ['1 y', '2 y', '0 y', 'خطای NameError'],
    correctIndex: 1,
    explanationFa:
      'شمارنده enumerate از 1 آغاز شده و در پایان پیمایش روی آخرین عضو، i برابر 2 و v برابر y است.',
  },
  {
    id: 'pulse-30',
    topicFa: 'تابع zip',
    difficultyFa: 'ساده',
    promptFa: 'وقتی طول دو لیست برابر نباشد، zip چطور عمل می‌کند؟',
    codeSnippet: 'pairs = list(zip([1, 2, 3], ["a", "b"]))\nprint(len(pairs), pairs[-1])',
    options: ['3 (3, None)', "2 (2, 'b')", "3 (3, 'b')", 'خطای ValueError'],
    correctIndex: 1,
    explanationFa:
      "تابع zip به صورت پیش‌فرض با رسیدن به انتهای کوتاه‌ترین دنباله متوقف می‌شود؛ پس طول ۲ و آخرین عضو (2, 'b') است.",
  },
  {
    id: 'pulse-31',
    topicFa: 'تفاوت split() و split(" ")',
    difficultyFa: 'چالشی',
    promptFa: 'در پردازش فاصله‌های متوالی، طول دو لیست چند می‌شود؟',
    codeSnippet: 's = "hi   there"\nprint(len(s.split()), len(s.split(" ")))',
    options: ['2 2', '4 4', '2 4', '2 3'],
    correctIndex: 2,
    explanationFa:
      'split() بدون آرگومان فاصله‌های متوالی را ادغام می‌کند (طول ۲)، ولی split(" ") به ازای هر فاصله جداگانه برش می‌دهد (طول ۴).',
  },
  {
    id: 'pulse-32',
    topicFa: 'منطق بولین و عدد',
    difficultyFa: 'ساده',
    promptFa: 'در پایتون True و False در جمع عددی چه رفتاری دارند؟',
    codeSnippet: 'flags = [True, False, True, True]\nprint(sum(flags), True + 2)',
    options: ['خطای TypeError', '3 3', '4 True2', '1 2'],
    correctIndex: 1,
    explanationFa:
      'نوع bool زیرکلاس int است؛ True معادل 1 و False معادل 0 حساب می‌شود، بنابراین جمع مقادیر True برابر 3 می‌شود.',
  },
];

const AttemptRowSchema = z.object({
  puzzle_id: z.string(),
  selected_option: z.coerce.number().int(),
  is_correct: z.boolean(),
});

function getDateKeyFromGregorian(gy: number, gm: number, gd: number): string {
  return `${gy}-${String(gm).padStart(2, '0')}-${String(gd).padStart(2, '0')}`;
}

export function getTodayPulsePuzzle(timezone: string): {
  puzzle: DailyPulsePuzzle;
  jalaliDayKey: string;
  jalaliDateLabel: string;
} {
  const tz = timezone || 'Asia/Tehran';
  const todayJalali = getTodayJalali(tz);
  const todayGreg = jalaliToGregorian(todayJalali.jy, todayJalali.jm, todayJalali.jd);
  const jalaliDayKey = getDateKeyFromGregorian(todayGreg.gy, todayGreg.gm, todayGreg.gd);
  const dayHash = todayJalali.jy * 372 + todayJalali.jm * 31 + todayJalali.jd;
  const idx =
    ((dayHash % DAILY_PULSE_PUZZLES.length) + DAILY_PULSE_PUZZLES.length) %
    DAILY_PULSE_PUZZLES.length;
  const puzzle = DAILY_PULSE_PUZZLES[idx];
  const monthName = JALALI_MONTH_NAMES[todayJalali.jm - 1];
  const jalaliDateLabel = `${toPersianDigits(todayJalali.jd)} ${monthName} ${toPersianDigits(todayJalali.jy)}`;

  return { puzzle, jalaliDayKey, jalaliDateLabel };
}

export async function getDailyPulseState({
  courseInstanceId,
  userId,
  timezone,
}: {
  courseInstanceId: string;
  userId: string;
  timezone: string;
}): Promise<DailyPulseState> {
  const { puzzle, jalaliDayKey, jalaliDateLabel } = getTodayPulsePuzzle(timezone);
  const existing = await sqldb.queryOptionalRow(
    sql.select_daily_pulse_attempt,
    {
      course_instance_id: courseInstanceId,
      user_id: userId,
      jalali_day_key: jalaliDayKey,
    },
    AttemptRowSchema,
  );

  const attemptPuzzle = existing
    ? (DAILY_PULSE_PUZZLES.find((p) => p.id === existing.puzzle_id) ?? puzzle)
    : puzzle;

  return {
    puzzle: attemptPuzzle,
    jalaliDayKey,
    jalaliDateLabel,
    attempt: existing
      ? { selectedOption: existing.selected_option, isCorrect: existing.is_correct }
      : null,
    xpReward: DAILY_PULSE_XP_REWARD,
  };
}

export async function submitDailyPulseAttempt({
  courseInstanceId,
  userId,
  timezone,
  puzzleId,
  selectedOption,
}: {
  courseInstanceId: string;
  userId: string;
  timezone: string;
  puzzleId: string;
  selectedOption: number;
}): Promise<void> {
  const { puzzle, jalaliDayKey } = getTodayPulsePuzzle(timezone);
  if (puzzle.id !== puzzleId) {
    return;
  }
  const safeOption = Math.max(0, Math.min(3, Math.trunc(selectedOption)));
  const isCorrect = safeOption === puzzle.correctIndex;

  await sqldb.execute(sql.insert_daily_pulse_attempt, {
    course_instance_id: courseInstanceId,
    user_id: userId,
    jalali_day_key: jalaliDayKey,
    puzzle_id: puzzle.id,
    selected_option: safeOption,
    is_correct: isCorrect,
  });

  await invalidateStudentGamificationCache(courseInstanceId, userId);
}
