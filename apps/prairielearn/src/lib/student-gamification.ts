import { Temporal } from '@js-temporal/polyfill';
import { z } from 'zod';

import { cache } from '@prairielearn/cache';
import * as sqldb from '@prairielearn/postgres';

import { getTodayJalali, gregorianToJalali, jalaliToGregorian, toPersianDigits } from './jalali.js';
import { getStudentActivityAndBadges } from './student-engagement.js';

const sql = sqldb.loadSqlEquiv(import.meta.url);

const GAMIFICATION_PROFILE_CACHE_MS = 30 * 1000;
const GAMIFICATION_COHORT_CACHE_MS = 60 * 1000;

// ---------- Types ----------

export type AchievementTier = 'none' | 'bronze' | 'silver' | 'gold' | 'diamond' | 'secret';

export interface StudentAchievement {
  id: string;
  title: string;
  description: string;
  secretHint: string | null;
  category: 'tiered' | 'secret';
  iconClass: string;
  tier: AchievementTier;
  earned: boolean;
  currentValue: number;
  nextTarget: number | null;
  tierTargets: number[] | null;
  progressPerc: number;
  progressText: string;
  xpReward: number;
  rarityWeight: number;
}

export interface ShowcaseBadge {
  id: string;
  title: string;
  tier: AchievementTier;
  iconClass: string;
  tooltip: string;
}

export interface StudentLevelInfo {
  level: number;
  title: string;
  subtitleFa: string;
  totalXp: number;
  currentLevelXp: number;
  nextLevelXp: number;
  xpIntoLevel: number;
  xpNeededForNext: number;
  progressPerc: number;
}

export interface WeeklyQuestItem {
  id: string;
  title: string;
  description: string;
  iconClass: string;
  current: number;
  target: number;
  progressPerc: number;
  xpReward: number;
  completed: boolean;
}

export interface WeeklyQuestsBundle {
  weekLabel: string;
  weekEndsAtIso: string;
  completedCount: number;
  quests: WeeklyQuestItem[];
}

export interface SkillTreeQuestionItem {
  assessmentId: string;
  assessmentLabel: string;
  assessmentTitle: string;
  assessmentQuestionId: string;
  instanceQuestionId: string | null;
  questionTitle: string;
  href: string;
  status: 'solved' | 'partial' | 'unattempted';
  scorePerc: number;
  attempts: number;
  isOneShot: boolean;
}

export interface SkillTreeNode {
  id: string;
  title: string;
  subtitle: string;
  groupingSource: 'topic' | 'module' | 'assessment';
  totalQuestions: number;
  solvedQuestions: number;
  partialQuestions: number;
  masteryPerc: number;
  status: 'unstarted' | 'learning' | 'proficient' | 'mastered';
  nextUnsolvedUrl: string | null;
  questions: SkillTreeQuestionItem[];
}

export interface StudentSkillTreeData {
  groupingSource: 'topic' | 'module' | 'assessment';
  nodes: SkillTreeNode[];
  totalQuestions: number;
  totalSolved: number;
  masteredNodes: number;
  overallMasteryPerc: number;
  recommendedNodeId: string | null;
}

export interface StudentGamificationProfile {
  xp: {
    totalXp: number;
    solvedXp: number;
    bonusXp: number;
  };
  level: StudentLevelInfo;
  achievements: StudentAchievement[];
  unlockedAchievementIds: string[];
  showcaseBadges: ShowcaseBadge[];
  weeklyQuests: WeeklyQuestsBundle;
  streak: {
    current: number;
    longest: number;
    activeDays140d: number;
  };
  solvedAqIds: string[];
  oneshotAqIds: string[];
  firstBloodAqIds: string[];
  masteredTopicsCount: number;
}

export interface StudentNavbarPulse {
  level: number;
  levelTitle: string;
  totalXp: number;
  progressPerc: number;
  currentStreakDays: number;
  unlockedCount: number;
}

export interface HallOfFameEntry {
  userId: string;
  displayName: string;
  metricLabel: string;
  metricValue: number;
}

export interface CohortGamificationBundle {
  byUserId: Record<
    string,
    {
      level: number;
      levelTitle: string;
      totalXp: number;
      showcaseBadges: ShowcaseBadge[];
    }
  >;
  hallOfFame: {
    risingStars: HallOfFameEntry[];
    accuracyKings: HallOfFameEntry[];
    streakLegends: HallOfFameEntry[];
    firstBloodHunters: HallOfFameEntry[];
  };
  firstBloodByAqId: Record<string, string>;
}

// ---------- Zod Schemas ----------

const CourseAqRowSchema = z.object({
  assessment_question_id: z.string(),
  attempted_count: z.coerce.number(),
  solved_count: z.coerce.number(),
  first_blood_user_id: z.string().nullable(),
});

const StudentSignalsRowSchema = z.object({
  solved_aq_ids: z.array(z.string()).catch([]),
  oneshot_aq_ids: z.array(z.string()).catch([]),
  partial_score_sum: z.coerce.number(),
  oneshot_count: z.coerce.number(),
  edge_hunter_count: z.coerce.number(),
  comeback_count: z.coerce.number(),
  perfect_hw_count: z.coerce.number(),
  early_bird_count: z.coerce.number(),
  total_submissions: z.coerce.number(),
  accepted_submissions: z.coerce.number(),
  active_days_total: z.coerce.number(),
  night_owl_count: z.coerce.number(),
  dawn_coder_count: z.coerce.number(),
  buzzer_beater_count: z.coerce.number(),
  weekend_warrior_weeks: z.coerce.number(),
});

const WeeklyQuestSignalsSchema = z.object({
  active_days_week: z.coerce.number(),
  solved_questions_week: z.coerce.number(),
  clean_solves_week: z.coerce.number(),
  oneshot_week: z.coerce.number(),
  comeback_week: z.coerce.number(),
});

const SkillTreeRowSchema = z.object({
  assessment_id: z.string(),
  assessment_label: z.string(),
  assessment_title: z.string(),
  assessment_instance_id: z.string().nullable(),
  assessment_question_id: z.string(),
  instance_question_id: z.string().nullable(),
  question_id: z.string(),
  question_title: z.string(),
  topic_id: z.string().nullable(),
  topic_name: z.string().nullable(),
  topic_description: z.string().nullable(),
  topic_number: z.coerce.number().nullable(),
  module_name: z.string().nullable(),
  module_heading: z.string().nullable(),
  module_number: z.coerce.number().nullable(),
  score_perc: z.coerce.number().nullable(),
  highest_submission_score: z.coerce.number().nullable(),
  number_attempts: z.coerce.number(),
  first_submission_score: z.coerce.number().nullable(),
});

const CohortGamificationRowSchema = z.object({
  user_id: z.string(),
  display_name: z.string(),
  solved_count: z.coerce.number(),
  partial_score_sum: z.coerce.number(),
  oneshot_count: z.coerce.number(),
  edge_hunter_count: z.coerce.number(),
  perfect_hw_count: z.coerce.number(),
  early_bird_count: z.coerce.number(),
  total_submissions: z.coerce.number(),
  accepted_submissions: z.coerce.number(),
  recent_7d_solved: z.coerce.number(),
  active_days_total: z.coerce.number(),
  night_owl_count: z.coerce.number(),
  buzzer_beater_count: z.coerce.number(),
  active_day_keys: z.array(z.string()).catch([]),
});

// ---------- Cache & Date Helpers ----------

async function withCache<T>(key: string, ttlMs: number, loader: () => Promise<T>): Promise<T> {
  try {
    const cached = await cache.get<T>(key);
    if (cached !== null) return cached;
  } catch {
    // Cache unavailability must never block student flows
  }

  const fresh = await loader();
  try {
    cache.set(key, fresh, ttlMs);
  } catch {
    // Ignore cache set errors
  }
  return fresh;
}

function getDateKeyFromGregorian(gy: number, gm: number, gd: number): string {
  return `${gy}-${String(gm).padStart(2, '0')}-${String(gd).padStart(2, '0')}`;
}

function addGregorianDays(dateKey: string, deltaDays: number): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + deltaDays));
  return dt.toISOString().slice(0, 10);
}

function getCurrentJalaliWeekBounds(timezone: string): {
  weekStartKey: string;
  weekEndKey: string;
  weekNumber: number;
  weekLabel: string;
  weekEndsAtIso: string;
} {
  const tz = timezone || 'Asia/Tehran';
  const todayJalali = getTodayJalali(tz);
  const todayGreg = jalaliToGregorian(todayJalali.jy, todayJalali.jm, todayJalali.jd);
  const todayKey = getDateKeyFromGregorian(todayGreg.gy, todayGreg.gm, todayGreg.gd);

  const jsDow = new Date(Date.UTC(todayGreg.gy, todayGreg.gm - 1, todayGreg.gd)).getUTCDay();
  const todayPersianDow = (jsDow + 1) % 7;

  const weekStartKey = addGregorianDays(todayKey, -todayPersianDow);
  const weekEndKey = addGregorianDays(weekStartKey, 6);

  const [endGy, endGm, endGd] = weekEndKey.split('-').map(Number);
  const endJalali = gregorianToJalali(endGy, endGm, endGd);
  const [startGy, startGm, startGd] = weekStartKey.split('-').map(Number);
  const startJalali = gregorianToJalali(startGy, startGm, startGd);

  const dayOfJalaliYear =
    (startJalali.jm <= 6 ? (startJalali.jm - 1) * 31 : 186 + (startJalali.jm - 7) * 30) +
    startJalali.jd;
  const weekNumber = Math.max(1, Math.ceil(dayOfJalaliYear / 7));

  let weekEndsAtIso: string;
  try {
    weekEndsAtIso = Temporal.PlainDateTime.from({
      year: endGy,
      month: endGm,
      day: endGd,
      hour: 23,
      minute: 59,
      second: 59,
    })
      .toZonedDateTime(tz)
      .toInstant()
      .toString();
  } catch {
    weekEndsAtIso = new Date(Date.UTC(endGy, endGm - 1, endGd, 20, 29, 59)).toISOString();
  }

  return {
    weekStartKey,
    weekEndKey,
    weekNumber,
    weekLabel: `هفته ${toPersianDigits(weekNumber)} (${toPersianDigits(startJalali.jd)}/${toPersianDigits(startJalali.jm)} تا ${toPersianDigits(endJalali.jd)}/${toPersianDigits(endJalali.jm)})`,
    weekEndsAtIso,
  };
}

function computeStreakFromDayKeys(dayKeys: string[], todayKey: string): number {
  if (dayKeys.length === 0) return 0;
  const set = new Set(dayKeys);
  let streak = 0;
  let cursor = set.has(todayKey) ? todayKey : addGregorianDays(todayKey, -1);
  for (let i = 0; i < 65; i += 1) {
    if (set.has(cursor)) {
      streak += 1;
      cursor = addGregorianDays(cursor, -1);
    } else {
      break;
    }
  }
  return streak;
}

// ---------- Level & Achievement Calculators ----------

const LEVEL_RANKS: { title: string; subtitleFa: string }[] = [
  { title: 'Code Novice', subtitleFa: 'آغاز مسیر برنامه‌نویسی' },
  { title: 'Syntax Explorer', subtitleFa: 'کاوشگر قواعد کد' },
  { title: 'Loop Architect', subtitleFa: 'معمار حلقه‌ها و منطق' },
  { title: 'Bug Hunter', subtitleFa: 'شکارچی خطاها' },
  { title: 'Logic Builder', subtitleFa: 'سازنده ساختارهای تمیز' },
  { title: 'Algorithm Crafter', subtitleFa: 'طراح راه‌حل‌های بهینه' },
  { title: 'Edge Case Master', subtitleFa: 'مسلط بر حالت‌های مرزی' },
  { title: 'Systems Thinker', subtitleFa: 'تفکر مهندسی عمیق' },
  { title: 'Term Legend', subtitleFa: 'ستاره برتر ترم' },
  { title: 'Grandmaster', subtitleFa: 'اوج تسلط و پشتکار' },
];

export function xpThresholdForLevel(level: number): number {
  if (level <= 1) return 0;
  const n = level - 1;
  return 150 * n + 60 * n * n;
}

export function computeLevelInfo(totalXp: number): StudentLevelInfo {
  const safeXp = Math.max(0, Math.round(totalXp));
  let level = 1;
  while (xpThresholdForLevel(level + 1) <= safeXp && level < 50) {
    level += 1;
  }
  const currentLevelXp = xpThresholdForLevel(level);
  const nextLevelXp = xpThresholdForLevel(level + 1);
  const xpIntoLevel = safeXp - currentLevelXp;
  const xpNeededForNext = Math.max(1, nextLevelXp - currentLevelXp);
  const progressPerc = Math.min(
    100,
    Math.max(0, Math.round((xpIntoLevel / xpNeededForNext) * 100)),
  );
  const rankMeta = LEVEL_RANKS[Math.min(LEVEL_RANKS.length - 1, level - 1)];

  return {
    level,
    title: rankMeta.title,
    subtitleFa: rankMeta.subtitleFa,
    totalXp: safeXp,
    currentLevelXp,
    nextLevelXp,
    xpIntoLevel,
    xpNeededForNext,
    progressPerc,
  };
}

function evaluateTier(
  value: number,
  targets: [number, number, number, number],
  rewards: [number, number, number, number],
): {
  tier: AchievementTier;
  earned: boolean;
  nextTarget: number | null;
  progressPerc: number;
  xpReward: number;
} {
  const tiers: AchievementTier[] = ['bronze', 'silver', 'gold', 'diamond'];
  let achievedIdx = -1;
  let xpReward = 0;
  for (let i = 0; i < targets.length; i += 1) {
    if (value >= targets[i]) {
      achievedIdx = i;
      xpReward += rewards[i];
    }
  }
  const nextTarget = achievedIdx < targets.length - 1 ? targets[achievedIdx + 1] : null;
  const prevTarget = achievedIdx >= 0 ? targets[achievedIdx] : 0;
  const progressPerc =
    nextTarget === null
      ? 100
      : Math.min(
          100,
          Math.max(
            0,
            Math.round(((value - prevTarget) / Math.max(1, nextTarget - prevTarget)) * 100),
          ),
        );

  return {
    tier: achievedIdx >= 0 ? tiers[achievedIdx] : 'none',
    earned: achievedIdx >= 0,
    nextTarget,
    progressPerc,
    xpReward,
  };
}

function buildAchievements(params: {
  oneshotCount: number;
  longestStreakDays: number;
  perfectHwCount: number;
  edgeHunterCount: number;
  earlyBirdCount: number;
  masteredTopicsCount: number;
  acceptanceRate: number;
  totalSubmissions: number;
  firstBloodCount: number;
  nightOwlCount: number;
  buzzerBeaterCount: number;
  dawnCoderCount: number;
  comebackCount: number;
  giantSlayerCount: number;
  weekendWarriorWeeks: number;
}): StudentAchievement[] {
  const tierRewards: [number, number, number, number] = [50, 100, 175, 275];

  const oneShotTier = evaluateTier(params.oneshotCount, [1, 5, 12, 25], tierRewards);
  const streakTier = evaluateTier(params.longestStreakDays, [3, 7, 14, 30], tierRewards);
  const perfectTier = evaluateTier(params.perfectHwCount, [1, 3, 6, 10], tierRewards);
  const edgeTier = evaluateTier(params.edgeHunterCount, [1, 4, 10, 20], tierRewards);
  const earlyTier = evaluateTier(params.earlyBirdCount, [1, 3, 6, 10], tierRewards);
  const topicTier = evaluateTier(params.masteredTopicsCount, [1, 3, 5, 8], tierRewards);

  // Surgical Accuracy requires at least 15 gradable submissions so 1/1 doesn't trivialize it
  const accuracyEligible = params.totalSubmissions >= 15;
  const effectiveAcc = accuracyEligible ? params.acceptanceRate : 0;
  const accTier = evaluateTier(effectiveAcc, [65, 75, 85, 92], tierRewards);

  const tiered: StudentAchievement[] = [
    {
      id: 'one-shot',
      title: 'One-Shot',
      description: 'کسب نمره کامل ۱۰۰٪ در همان اولین تلاش یک سوال',
      secretHint: null,
      category: 'tiered',
      iconClass: 'bi bi-lightning-charge-fill',
      ...oneShotTier,
      currentValue: params.oneshotCount,
      tierTargets: [1, 5, 12, 25],
      progressText:
        oneShotTier.nextTarget !== null
          ? `${toPersianDigits(params.oneshotCount)} از ${toPersianDigits(oneShotTier.nextTarget)} سوال`
          : `${toPersianDigits(params.oneshotCount)} سوال (حداکثر سطح)`,
      rarityWeight: oneShotTier.tier === 'diamond' ? 95 : oneShotTier.tier === 'gold' ? 80 : 60,
    },
    {
      id: 'streak',
      title: 'Streak',
      description: 'ارسال کد در روزهای پیاپی طبق تقویم شمسی',
      secretHint: null,
      category: 'tiered',
      iconClass: 'bi bi-fire',
      ...streakTier,
      currentValue: params.longestStreakDays,
      tierTargets: [3, 7, 14, 30],
      progressText:
        streakTier.nextTarget !== null
          ? `رکورد: ${toPersianDigits(params.longestStreakDays)} از ${toPersianDigits(streakTier.nextTarget)} روز`
          : `رکورد ${toPersianDigits(params.longestStreakDays)} روز پیاپی`,
      rarityWeight: streakTier.tier === 'diamond' ? 94 : streakTier.tier === 'gold' ? 79 : 58,
    },
    {
      id: 'perfectionist',
      title: 'Perfectionist',
      description: 'کسب نمره کامل ۱۰۰٪ در کل سوالات یک سری تمرین',
      secretHint: null,
      category: 'tiered',
      iconClass: 'bi bi-award-fill',
      ...perfectTier,
      currentValue: params.perfectHwCount,
      tierTargets: [1, 3, 6, 10],
      progressText:
        perfectTier.nextTarget !== null
          ? `${toPersianDigits(params.perfectHwCount)} از ${toPersianDigits(perfectTier.nextTarget)} سری`
          : `${toPersianDigits(params.perfectHwCount)} سری کامل`,
      rarityWeight: perfectTier.tier === 'diamond' ? 92 : perfectTier.tier === 'gold' ? 78 : 57,
    },
    {
      id: 'edge-hunter',
      title: 'Edge Case Hunter',
      description: 'حل کامل سوال پس از ۴ تلاش یا بیشتر بدون تسلیم شدن',
      secretHint: null,
      category: 'tiered',
      iconClass: 'bi bi-bullseye',
      ...edgeTier,
      currentValue: params.edgeHunterCount,
      tierTargets: [1, 4, 10, 20],
      progressText:
        edgeTier.nextTarget !== null
          ? `${toPersianDigits(params.edgeHunterCount)} از ${toPersianDigits(edgeTier.nextTarget)} سوال`
          : `${toPersianDigits(params.edgeHunterCount)} سوال چالشی`,
      rarityWeight: 54,
    },
    {
      id: 'early-bird',
      title: 'Early Bird',
      description: 'رساندن سری تمرین به ۹۰٪+ حداقل ۴۸ ساعت پیش از ددلاین',
      secretHint: null,
      category: 'tiered',
      iconClass: 'bi bi-sunrise-fill',
      ...earlyTier,
      currentValue: params.earlyBirdCount,
      tierTargets: [1, 3, 6, 10],
      progressText:
        earlyTier.nextTarget !== null
          ? `${toPersianDigits(params.earlyBirdCount)} از ${toPersianDigits(earlyTier.nextTarget)} سری`
          : `${toPersianDigits(params.earlyBirdCount)} تمرین زودهنگام`,
      rarityWeight: 56,
    },
    {
      id: 'topic-master',
      title: 'Topic Master',
      description: 'حل کامل تمام سوالات یک مبحث یا سری در مسیر Skill Tree',
      secretHint: null,
      category: 'tiered',
      iconClass: 'bi bi-diagram-3-fill',
      ...topicTier,
      currentValue: params.masteredTopicsCount,
      tierTargets: [1, 3, 5, 8],
      progressText:
        topicTier.nextTarget !== null
          ? `${toPersianDigits(params.masteredTopicsCount)} از ${toPersianDigits(topicTier.nextTarget)} مبحث`
          : `${toPersianDigits(params.masteredTopicsCount)} مبحث تکمیل‌شده`,
      rarityWeight: 70,
    },
    {
      id: 'surgical-accuracy',
      title: 'Surgical Accuracy',
      description: 'حفظ نرخ قبولی بالا در حداقل ۱۵ ارسال معتبر',
      secretHint: null,
      category: 'tiered',
      iconClass: 'bi bi-crosshair',
      ...accTier,
      currentValue: effectiveAcc,
      tierTargets: [65, 75, 85, 92],
      progressText: accuracyEligible
        ? accTier.nextTarget !== null
          ? `دقت فعلی: ${toPersianDigits(params.acceptanceRate)}٪ (هدف بعدی: ${toPersianDigits(accTier.nextTarget)}٪)`
          : `دقت درخشان: ${toPersianDigits(params.acceptanceRate)}٪`
        : `${toPersianDigits(params.totalSubmissions)} از ۱۵ ارسال لازم برای سنجش دقت`,
      rarityWeight: 68,
    },
  ];

  const makeSecret = (opts: {
    id: string;
    title: string;
    description: string;
    secretHint: string;
    iconClass: string;
    count: number;
    xpReward: number;
    rarityWeight: number;
    countSuffix: string;
  }): StudentAchievement => {
    const earned = opts.count > 0;
    return {
      id: opts.id,
      title: opts.title,
      description: opts.description,
      secretHint: opts.secretHint,
      category: 'secret',
      iconClass: opts.iconClass,
      tier: earned ? 'secret' : 'none',
      earned,
      currentValue: opts.count,
      nextTarget: earned ? null : 1,
      tierTargets: null,
      progressPerc: earned ? 100 : 0,
      progressText: earned
        ? `${toPersianDigits(opts.count)} ${opts.countSuffix}`
        : 'قفل‌شده — دستاورد مخفی',
      xpReward: earned ? opts.xpReward : 0,
      rarityWeight: opts.rarityWeight,
    };
  };

  const secrets: StudentAchievement[] = [
    makeSecret({
      id: 'first-blood',
      title: 'First Blood',
      description: 'اولین دانشجوی کلاس که یک سوال جدید را ۱۰۰٪ حل کرده است',
      secretHint: 'سرعت و دقت روی سوالات تازه منتشرشده راز این نشان است.',
      iconClass: 'bi bi-trophy-fill',
      count: params.firstBloodCount,
      xpReward: 150,
      rarityWeight: 100,
      countSuffix: 'سوال به عنوان نفر اول کلاس',
    }),
    makeSecret({
      id: 'giant-slayer',
      title: 'Giant Slayer',
      description: 'حل کامل یک سوال سخت که کمتر از ۳۵٪ کلاس آن را حل کرده‌اند',
      secretHint: 'سوالی را فتح کن که بیشتر کلاس در آن گیر افتاده‌اند.',
      iconClass: 'bi bi-shield-fill-check',
      count: params.giantSlayerCount,
      xpReward: 130,
      rarityWeight: 90,
      countSuffix: 'سوال سخت فتح‌شده',
    }),
    makeSecret({
      id: 'comeback',
      title: 'Comeback',
      description: 'رساندن سوالی به ۱۰۰٪ پس از ۳ تلاش ناموفق زیر ۳۰٪',
      secretHint: 'حتی وقتی سه بار شکست خوردی، رها نکردن کد نتیجه می‌دهد.',
      iconClass: 'bi bi-arrow-repeat',
      count: params.comebackCount,
      xpReward: 110,
      rarityWeight: 82,
      countSuffix: 'بازگشت موفق',
    }),
    makeSecret({
      id: 'buzzer-beater',
      title: 'Buzzer Beater',
      description: 'ثبت پاسخ ۱۰۰٪ در ۶۰ دقیقه پایانی پیش از ددلاین اصلی',
      secretHint: 'گل ثانیه نود درست پیش از بسته شدن مهلت اصلی.',
      iconClass: 'bi bi-alarm-fill',
      count: params.buzzerBeaterCount,
      xpReward: 100,
      rarityWeight: 76,
      countSuffix: 'حل لحظه آخری',
    }),
    makeSecret({
      id: 'night-owl',
      title: 'Night Owl',
      description: 'ثبت پاسخ ۱۰۰٪ بین ساعت ۰۰:۰۰ تا ۰۴:۳۰ بامداد به وقت تهران',
      secretHint: 'وقتی شهر خواب است و ترمینال هنوز روشن است…',
      iconClass: 'bi bi-moon-stars-fill',
      count: params.nightOwlCount,
      xpReward: 90,
      rarityWeight: 72,
      countSuffix: 'حل نیمه‌شب',
    }),
    makeSecret({
      id: 'dawn-coder',
      title: 'Dawn Coder',
      description: 'ثبت پاسخ ۱۰۰٪ بین ساعت ۰۵:۰۰ تا ۰۷:۳۰ صبح',
      secretHint: 'کدنویسی پیش از طلوع آفتاب و کلاس‌های صبح.',
      iconClass: 'bi bi-sun-fill',
      count: params.dawnCoderCount,
      xpReward: 90,
      rarityWeight: 71,
      countSuffix: 'حل سحرگاهی',
    }),
    makeSecret({
      id: 'weekend-warrior',
      title: 'Weekend Warrior',
      description: 'حل کامل حداقل ۳ سوال در روزهای پنج‌شنبه و جمعه یک هفته شمسی',
      secretHint: 'استفاده هوشمندانه از تعطیلات آخر هفته برای تمرین.',
      iconClass: 'bi bi-calendar2-check-fill',
      count: params.weekendWarriorWeeks,
      xpReward: 110,
      rarityWeight: 74,
      countSuffix: 'آخر هفته فعال',
    }),
  ];

  return [...tiered, ...secrets];
}

function selectShowcaseBadges(achievements: StudentAchievement[]): ShowcaseBadge[] {
  return achievements
    .filter((a) => a.earned)
    .sort((a, b) => b.rarityWeight - a.rarityWeight)
    .slice(0, 3)
    .map((a) => ({
      id: a.id,
      title: a.title,
      tier: a.tier,
      iconClass: a.iconClass,
      tooltip: `${a.title} — ${a.description}`,
    }));
}

// ---------- Service Functions ----------

export async function getStudentSkillTreeData({
  courseInstanceId,
  userId,
}: {
  courseInstanceId: string;
  userId: string;
}): Promise<StudentSkillTreeData> {
  const rows = await sqldb.queryRows(
    sql.select_student_skill_tree_rows,
    { course_instance_id: courseInstanceId, user_id: userId },
    SkillTreeRowSchema,
  );

  const validTopics = new Set(
    rows
      .map((r) => r.topic_name?.trim())
      .filter((name): name is string =>
        Boolean(name && !['none', 'default', 'بدون مبحث'].includes(name.toLowerCase())),
      ),
  );
  const validModules = new Set(
    rows
      .map((r) => r.module_name?.trim())
      .filter((name): name is string =>
        Boolean(name && !['default', 'staff'].includes(name.toLowerCase())),
      ),
  );

  const groupingSource: 'topic' | 'module' | 'assessment' =
    validTopics.size >= 2 ? 'topic' : validModules.size >= 2 ? 'module' : 'assessment';

  const groupMap = new Map<
    string,
    {
      id: string;
      title: string;
      subtitle: string;
      questions: SkillTreeQuestionItem[];
    }
  >();

  for (const row of rows) {
    let key: string;
    let title: string;
    let subtitle: string;

    if (groupingSource === 'topic' && row.topic_id && row.topic_name) {
      key = `topic-${row.topic_id}`;
      title = row.topic_name;
      subtitle =
        row.topic_description?.trim() || `${row.assessment_label} — ${row.assessment_title}`;
    } else if (groupingSource === 'module' && row.module_name) {
      key = `module-${row.module_name}`;
      title = row.module_heading?.trim() || row.module_name;
      subtitle = row.assessment_title;
    } else {
      key = `assess-${row.assessment_id}`;
      title = row.assessment_title;
      subtitle = row.assessment_label;
    }

    let group = groupMap.get(key);
    if (!group) {
      group = { id: key, title, subtitle, questions: [] };
      groupMap.set(key, group);
    }

    const scorePerc = Math.round((row.score_perc ?? 0) * 10) / 10;
    const isSolved =
      (row.highest_submission_score ?? 0) >= 0.9999 || (row.score_perc ?? 0) >= 99.99;
    const isPartial = !isSolved && (row.number_attempts > 0 || scorePerc > 0);
    const isOneShot =
      (row.first_submission_score ?? 0) >= 0.9999 ||
      (row.number_attempts === 1 && (row.highest_submission_score ?? 0) >= 0.9999);

    const href = row.instance_question_id
      ? `/pl/course_instance/${courseInstanceId}/instance_question/${row.instance_question_id}`
      : row.assessment_instance_id
        ? `/pl/course_instance/${courseInstanceId}/assessment_instance/${row.assessment_instance_id}`
        : `/pl/course_instance/${courseInstanceId}/assessment/${row.assessment_id}`;

    group.questions.push({
      assessmentId: row.assessment_id,
      assessmentLabel: row.assessment_label,
      assessmentTitle: row.assessment_title,
      assessmentQuestionId: row.assessment_question_id,
      instanceQuestionId: row.instance_question_id,
      questionTitle: row.question_title,
      href,
      status: isSolved ? 'solved' : isPartial ? 'partial' : 'unattempted',
      scorePerc,
      attempts: row.number_attempts,
      isOneShot,
    });
  }

  let totalQuestions = 0;
  let totalSolved = 0;
  let masteredNodes = 0;

  const nodes: SkillTreeNode[] = Array.from(groupMap.values()).map((group) => {
    const solvedQuestions = group.questions.filter((q) => q.status === 'solved').length;
    const partialQuestions = group.questions.filter((q) => q.status === 'partial').length;
    const total = group.questions.length;
    const masteryPerc = total > 0 ? Math.round((solvedQuestions / total) * 100) : 0;
    const status: SkillTreeNode['status'] =
      total > 0 && solvedQuestions === total
        ? 'mastered'
        : masteryPerc >= 70
          ? 'proficient'
          : solvedQuestions > 0 || partialQuestions > 0
            ? 'learning'
            : 'unstarted';

    const firstUnsolved = group.questions.find((q) => q.status !== 'solved') ?? null;

    totalQuestions += total;
    totalSolved += solvedQuestions;
    if (status === 'mastered') masteredNodes += 1;

    return {
      id: group.id,
      title: group.title,
      subtitle: group.subtitle,
      groupingSource,
      totalQuestions: total,
      solvedQuestions,
      partialQuestions,
      masteryPerc,
      status,
      nextUnsolvedUrl: firstUnsolved?.href ?? null,
      questions: group.questions,
    };
  });

  const recommendedNodeId =
    nodes.find((n) => n.nextUnsolvedUrl !== null)?.id ?? (nodes.length > 0 ? nodes[0].id : null);

  return {
    groupingSource,
    nodes,
    totalQuestions,
    totalSolved,
    masteredNodes,
    overallMasteryPerc: totalQuestions > 0 ? Math.round((totalSolved / totalQuestions) * 100) : 0,
    recommendedNodeId,
  };
}

export async function getStudentWeeklyQuests({
  courseInstanceId,
  userId,
  timezone,
}: {
  courseInstanceId: string;
  userId: string;
  timezone: string;
}): Promise<WeeklyQuestsBundle> {
  const tz = timezone || 'Asia/Tehran';
  const bounds = getCurrentJalaliWeekBounds(tz);

  const row = await sqldb.queryRow(
    sql.select_student_weekly_quest_signals,
    {
      course_instance_id: courseInstanceId,
      user_id: userId,
      timezone: tz,
      week_start_key: bounds.weekStartKey,
      week_end_key: bounds.weekEndKey,
    },
    WeeklyQuestSignalsSchema,
  );

  // Deterministic rotation across weeks so the quests feel fresh every Saturday
  const variant = bounds.weekNumber % 2;

  const q1Target = 3;
  const q1Cur = Math.min(q1Target, row.active_days_week);

  const q2Target = variant === 0 ? 2 : 1;
  const q2Cur = Math.min(q2Target, variant === 0 ? row.clean_solves_week : row.oneshot_week);

  const q3Target = variant === 0 ? 3 : 4;
  const q3Cur = Math.min(q3Target, row.solved_questions_week);

  const quests: WeeklyQuestItem[] = [
    {
      id: 'weekly-consistency',
      title: 'Weekly Consistency',
      description: 'ثبت ارسال کد معتبر در ۳ روز مختلف از این هفته شمسی',
      iconClass: 'bi bi-calendar-check',
      current: q1Cur,
      target: q1Target,
      progressPerc: Math.round((q1Cur / q1Target) * 100),
      xpReward: 75,
      completed: row.active_days_week >= q1Target,
    },
    {
      id: 'weekly-precision',
      title: variant === 0 ? 'Clean Solver' : 'One-Shot Sprint',
      description:
        variant === 0
          ? 'حل کامل ۲ سوال با حداکثر ۲ تلاش برای هر کدام در این هفته'
          : 'حل کامل ۱ سوال به صورت One-Shot (تلاش اول) در این هفته',
      iconClass: 'bi bi-bullseye',
      current: q2Cur,
      target: q2Target,
      progressPerc: Math.round((q2Cur / q2Target) * 100),
      xpReward: 100,
      completed: (variant === 0 ? row.clean_solves_week : row.oneshot_week) >= q2Target,
    },
    {
      id: 'weekly-momentum',
      title: 'Problem Sprinter',
      description: `حل کامل ${toPersianDigits(q3Target)} سوال جدید در طول این هفته`,
      iconClass: 'bi bi-rocket-takeoff',
      current: q3Cur,
      target: q3Target,
      progressPerc: Math.round((q3Cur / q3Target) * 100),
      xpReward: 125,
      completed: row.solved_questions_week >= q3Target,
    },
  ];

  return {
    weekLabel: bounds.weekLabel,
    weekEndsAtIso: bounds.weekEndsAtIso,
    completedCount: quests.filter((q) => q.completed).length,
    quests,
  };
}

export async function getStudentGamificationProfile({
  courseInstanceId,
  userId,
  timezone,
}: {
  courseInstanceId: string;
  userId: string;
  timezone: string;
}): Promise<StudentGamificationProfile> {
  const tz = timezone || 'Asia/Tehran';
  const cacheKey = `sh-gamif-profile:${courseInstanceId}:${userId}`;

  return withCache(cacheKey, GAMIFICATION_PROFILE_CACHE_MS, async () => {
    const [courseAqRows, signals, activity, skillTree, weeklyQuests] = await Promise.all([
      sqldb.queryRows(
        sql.select_course_question_difficulty_and_first_blood,
        { course_instance_id: courseInstanceId },
        CourseAqRowSchema,
      ),
      sqldb.queryRow(
        sql.select_student_xp_and_achievement_signals,
        { course_instance_id: courseInstanceId, user_id: userId, timezone: tz },
        StudentSignalsRowSchema,
      ),
      getStudentActivityAndBadges({ courseInstanceId, userId, timezone: tz }),
      getStudentSkillTreeData({ courseInstanceId, userId }),
      getStudentWeeklyQuests({ courseInstanceId, userId, timezone: tz }),
    ]);

    const aqMeta = new Map<
      string,
      { solveRatePerc: number; attempted: number; firstBloodUserId: string | null }
    >();
    const firstBloodAqIds: string[] = [];

    for (const row of courseAqRows) {
      const solveRatePerc =
        row.attempted_count > 0 ? Math.round((row.solved_count / row.attempted_count) * 100) : 100;
      aqMeta.set(row.assessment_question_id, {
        solveRatePerc,
        attempted: row.attempted_count,
        firstBloodUserId: row.first_blood_user_id,
      });
      if (row.first_blood_user_id === userId) {
        firstBloodAqIds.push(row.assessment_question_id);
      }
    }

    let solvedXp = 0;
    let giantSlayerCount = 0;
    for (const aqId of signals.solved_aq_ids) {
      const meta = aqMeta.get(aqId);
      let multiplier = 1.0;
      if (meta && meta.attempted >= 5) {
        if (meta.solveRatePerc < 35 && meta.attempted >= 10) {
          giantSlayerCount += 1;
        }
        if (meta.solveRatePerc < 40) {
          multiplier = 1.5;
        } else if (meta.solveRatePerc < 70) {
          multiplier = 1.25;
        }
      }
      solvedXp += Math.round(100 * multiplier);
    }

    const partialXp = Math.floor(signals.partial_score_sum * 0.6);
    solvedXp += partialXp;

    const acceptanceRate =
      signals.total_submissions > 0
        ? Math.round((signals.accepted_submissions / signals.total_submissions) * 100)
        : 0;

    const achievements = buildAchievements({
      oneshotCount: signals.oneshot_count,
      longestStreakDays: activity.longestStreakDays,
      perfectHwCount: signals.perfect_hw_count,
      edgeHunterCount: signals.edge_hunter_count,
      earlyBirdCount: signals.early_bird_count,
      masteredTopicsCount: skillTree.masteredNodes,
      acceptanceRate,
      totalSubmissions: signals.total_submissions,
      firstBloodCount: firstBloodAqIds.length,
      nightOwlCount: signals.night_owl_count,
      buzzerBeaterCount: signals.buzzer_beater_count,
      dawnCoderCount: signals.dawn_coder_count,
      comebackCount: signals.comeback_count,
      giantSlayerCount,
      weekendWarriorWeeks: signals.weekend_warrior_weeks,
    });

    const achievementXp = achievements.reduce((sum, a) => sum + a.xpReward, 0);
    const weeklyQuestXp = weeklyQuests.quests.reduce(
      (sum, q) => sum + (q.completed ? q.xpReward : 0),
      0,
    );

    const bonusXp =
      signals.oneshot_count * 35 +
      signals.perfect_hw_count * 150 +
      signals.early_bird_count * 50 +
      signals.active_days_total * 15 +
      firstBloodAqIds.length * 60 +
      achievementXp +
      weeklyQuestXp;

    const totalXp = solvedXp + bonusXp;
    const level = computeLevelInfo(totalXp);

    return {
      xp: {
        totalXp,
        solvedXp,
        bonusXp,
      },
      level,
      achievements,
      unlockedAchievementIds: achievements.filter((a) => a.earned).map((a) => a.id),
      showcaseBadges: selectShowcaseBadges(achievements),
      weeklyQuests,
      streak: {
        current: activity.currentStreakDays,
        longest: activity.longestStreakDays,
        activeDays140d: activity.activeDaysCount,
      },
      solvedAqIds: signals.solved_aq_ids,
      oneshotAqIds: signals.oneshot_aq_ids,
      firstBloodAqIds,
      masteredTopicsCount: skillTree.masteredNodes,
    };
  });
}

export async function getStudentNavbarPulse({
  courseInstanceId,
  userId,
  timezone,
}: {
  courseInstanceId: string;
  userId: string;
  timezone: string;
}): Promise<StudentNavbarPulse> {
  const profile = await getStudentGamificationProfile({ courseInstanceId, userId, timezone });
  return {
    level: profile.level.level,
    levelTitle: profile.level.title,
    totalXp: profile.level.totalXp,
    progressPerc: profile.level.progressPerc,
    currentStreakDays: profile.streak.current,
    unlockedCount: profile.unlockedAchievementIds.length,
  };
}

export async function getCohortGamificationBundle({
  courseInstanceId,
  timezone,
}: {
  courseInstanceId: string;
  timezone: string;
}): Promise<CohortGamificationBundle> {
  const tz = timezone || 'Asia/Tehran';
  const cacheKey = `sh-gamif-cohort:${courseInstanceId}`;

  return withCache(cacheKey, GAMIFICATION_COHORT_CACHE_MS, async () => {
    const [courseAqRows, cohortRows] = await Promise.all([
      sqldb.queryRows(
        sql.select_course_question_difficulty_and_first_blood,
        { course_instance_id: courseInstanceId },
        CourseAqRowSchema,
      ),
      sqldb.queryRows(
        sql.select_cohort_gamification_rows,
        { course_instance_id: courseInstanceId, timezone: tz },
        CohortGamificationRowSchema,
      ),
    ]);

    const firstBloodCounts = new Map<string, number>();
    const firstBloodByAqId: Record<string, string> = {};
    for (const aq of courseAqRows) {
      if (aq.first_blood_user_id) {
        firstBloodByAqId[aq.assessment_question_id] = aq.first_blood_user_id;
        firstBloodCounts.set(
          aq.first_blood_user_id,
          (firstBloodCounts.get(aq.first_blood_user_id) ?? 0) + 1,
        );
      }
    }

    const todayJalali = getTodayJalali(tz);
    const todayGreg = jalaliToGregorian(todayJalali.jy, todayJalali.jm, todayJalali.jd);
    const todayKey = getDateKeyFromGregorian(todayGreg.gy, todayGreg.gm, todayGreg.gd);

    const byUserId: CohortGamificationBundle['byUserId'] = {};
    const risingCandidates: HallOfFameEntry[] = [];
    const accuracyCandidates: HallOfFameEntry[] = [];
    const streakCandidates: HallOfFameEntry[] = [];
    const firstBloodCandidates: HallOfFameEntry[] = [];

    for (const row of cohortRows) {
      const fbCount = firstBloodCounts.get(row.user_id) ?? 0;
      const currentStreak = computeStreakFromDayKeys(row.active_day_keys, todayKey);
      const acceptanceRate =
        row.total_submissions > 0
          ? Math.round((row.accepted_submissions / row.total_submissions) * 100)
          : 0;

      const achievements = buildAchievements({
        oneshotCount: row.oneshot_count,
        longestStreakDays: currentStreak,
        perfectHwCount: row.perfect_hw_count,
        edgeHunterCount: row.edge_hunter_count,
        earlyBirdCount: row.early_bird_count,
        masteredTopicsCount: 0,
        acceptanceRate,
        totalSubmissions: row.total_submissions,
        firstBloodCount: fbCount,
        nightOwlCount: row.night_owl_count,
        buzzerBeaterCount: row.buzzer_beater_count,
        dawnCoderCount: 0,
        comebackCount: 0,
        giantSlayerCount: 0,
        weekendWarriorWeeks: 0,
      });

      const achievementXp = achievements.reduce((sum, a) => sum + a.xpReward, 0);
      const totalXp =
        row.solved_count * 110 +
        Math.floor(row.partial_score_sum * 0.6) +
        row.oneshot_count * 35 +
        row.perfect_hw_count * 150 +
        row.early_bird_count * 50 +
        row.active_days_total * 15 +
        fbCount * 60 +
        achievementXp;

      const levelInfo = computeLevelInfo(totalXp);

      byUserId[row.user_id] = {
        level: levelInfo.level,
        levelTitle: levelInfo.title,
        totalXp,
        showcaseBadges: selectShowcaseBadges(achievements),
      };

      if (row.recent_7d_solved > 0) {
        risingCandidates.push({
          userId: row.user_id,
          displayName: row.display_name,
          metricLabel: `${toPersianDigits(row.recent_7d_solved)} سوال جدید این هفته`,
          metricValue: row.recent_7d_solved,
        });
      }

      if (row.solved_count >= 5 && row.total_submissions >= 5) {
        accuracyCandidates.push({
          userId: row.user_id,
          displayName: row.display_name,
          metricLabel: `${toPersianDigits(acceptanceRate)}٪ قبولی (${toPersianDigits(row.oneshot_count)} One-Shot)`,
          metricValue: acceptanceRate * 1000 + row.oneshot_count,
        });
      }

      if (currentStreak >= 2) {
        streakCandidates.push({
          userId: row.user_id,
          displayName: row.display_name,
          metricLabel: `${toPersianDigits(currentStreak)} روز پیاپی`,
          metricValue: currentStreak,
        });
      }

      if (fbCount > 0) {
        firstBloodCandidates.push({
          userId: row.user_id,
          displayName: row.display_name,
          metricLabel: `${toPersianDigits(fbCount)} First Blood`,
          metricValue: fbCount,
        });
      }
    }

    const top3 = (arr: HallOfFameEntry[]) =>
      arr.sort((a, b) => b.metricValue - a.metricValue).slice(0, 3);

    return {
      byUserId,
      hallOfFame: {
        risingStars: top3(risingCandidates),
        accuracyKings: top3(accuracyCandidates),
        streakLegends: top3(streakCandidates),
        firstBloodHunters: top3(firstBloodCandidates),
      },
      firstBloodByAqId,
    };
  });
}
