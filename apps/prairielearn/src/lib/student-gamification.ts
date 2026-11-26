import { Temporal } from '@js-temporal/polyfill';
import { z } from 'zod';

import { cache } from '@prairielearn/cache';
import * as sqldb from '@prairielearn/postgres';

import { getTodayJalali, gregorianToJalali, jalaliToGregorian, toPersianDigits } from './jalali.js';
import { computeStreakWithFreezes, getStudentActivityAndBadges } from './student-engagement.js';

const sql = sqldb.loadSqlEquiv(import.meta.url);

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

export interface NextUnlockHint {
  achievementId: string;
  title: string;
  iconClass: string;
  nextTier: Exclude<AchievementTier, 'none' | 'secret'>;
  nextTierFa: string;
  remaining: number;
  nextTarget: number;
  currentValue: number;
  progressPerc: number;
  xpReward: number;
  messageFa: string;
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

export interface FirstBloodOwner {
  userId: string;
  displayName: string;
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
  nextUnlock: NextUnlockHint | null;
  weeklyQuests: WeeklyQuestsBundle;
  streak: {
    current: number;
    longest: number;
    activeDays140d: number;
    freezesUsedThisMonth: number;
    freezesRemainingThisMonth: number;
    maxFreezesPerMonth: number;
  };
  solvedAqIds: string[];
  oneshotAqIds: string[];
  firstBloodAqIds: string[];
  firstBloodByAqId: Record<string, FirstBloodOwner>;
  masteredTopicsCount: number;
  taKudosCount: number;
  dailyPulseCorrectCount: number;
  coopCompletedCount: number;
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
  isAnonymous: boolean;
  metricLabel: string;
  metricValue: number;
}

export type WeeklyLeagueTier = 'diamond' | 'gold' | 'silver' | 'bronze';

export interface WeeklyLeagueMember {
  rank: number;
  userId: string;
  displayName: string;
  avatarPreset: string;
  avatarColor: string;
  statusEmoji: string;
  isAnonymous: boolean;
  showPassportDetails: boolean;
  weeklyXp: number;
  solvedThisWeek: number;
  level: number;
  showcaseBadges: ShowcaseBadge[];
  zone: 'promote' | 'safe' | 'relegate';
}

export interface WeeklyLeagueGroup {
  id: string;
  tier: WeeklyLeagueTier;
  titleFa: string;
  members: WeeklyLeagueMember[];
  promoteCount: number;
  relegateCount: number;
}

export interface WeeklyLeaguesBundle {
  weekLabel: string;
  weekEndsAtIso: string;
  leagues: WeeklyLeagueGroup[];
}

export interface CohortGamificationBundle {
  byUserId: Record<
    string,
    {
      level: number;
      levelTitle: string;
      totalXp: number;
      weeklyXp: number;
      avatarPreset: string;
      avatarColor: string;
      statusEmoji: string;
      isAnonymous: boolean;
      showPassportDetails: boolean;
      showcaseBadges: ShowcaseBadge[];
    }
  >;
  hallOfFame: {
    risingStars: HallOfFameEntry[];
    accuracyKings: HallOfFameEntry[];
    streakLegends: HallOfFameEntry[];
    firstBloodHunters: HallOfFameEntry[];
  };
  firstBloodByAqId: Record<string, FirstBloodOwner>;
  weeklyLeagues: WeeklyLeaguesBundle;
}

export interface StudentCodingPassport {
  userId: string;
  displayName: string;
  avatarPreset: string;
  avatarColor: string;
  bannerTheme: string;
  bio: string | null;
  statusEmoji: string;
  favoriteTopic: string | null;
  githubUsername: string | null;
  featuredTitle: string;
  privacyLocked: boolean;
  showActivityStats: boolean;
  level: StudentLevelInfo;
  streak: {
    current: number;
    longest: number;
    activeDays140d: number;
  } | null;
  solvedQuestions: number | null;
  totalSubmissions: number | null;
  acceptanceRate: number | null;
  taKudosCount: number;
  firstBloodCount: number;
  earnedAchievements: {
    id: string;
    title: string;
    tier: AchievementTier;
    iconClass: string;
    description: string;
  }[];
  topicMastery: {
    title: string;
    solvedQuestions: number;
    totalQuestions: number;
    masteryPerc: number;
    status: SkillTreeNode['status'];
  }[];
}

// ---------- Zod Schemas ----------

const CourseAqRowSchema = z.object({
  assessment_question_id: z.string(),
  attempted_count: z.coerce.number(),
  solved_count: z.coerce.number(),
  first_blood_user_id: z.string().nullable(),
  first_blood_display_name: z.string().nullable(),
});

const CanonicalSqlSignalsSchema = z.object({
  solved_aq_ids: z.array(z.string()).catch([]),
  oneshot_aq_ids: z.array(z.string()).catch([]),
  partial_score_sum: z.coerce.number(),
  oneshot_count: z.coerce.number(),
  edge_hunter_count: z.coerce.number(),
  comeback_count: z.coerce.number(),
  perfect_hw_count: z.coerce.number(),
  early_bird_count: z.coerce.number(),
  bonus_hunter_count: z.coerce.number(),
  syntax_clean_max_run: z.coerce.number(),
  total_submissions: z.coerce.number(),
  accepted_submissions: z.coerce.number(),
  active_days_total: z.coerce.number(),
  active_day_keys: z.array(z.string()).catch([]),
  night_owl_count: z.coerce.number(),
  dawn_coder_count: z.coerce.number(),
  buzzer_beater_count: z.coerce.number(),
  weekend_warrior_weeks: z.coerce.number(),
  mastered_topics_count: z.coerce.number(),
  ta_kudos_count: z.coerce.number(),
  daily_pulse_correct_count: z.coerce.number(),
  weekly_goal_met_weeks: z.coerce.number(),
  weekly_goal_xp: z.coerce.number(),
  coop_completed_count: z.coerce.number(),
  active_days_week: z.coerce.number(),
  solved_aq_ids_week: z.array(z.string()).catch([]),
  clean_solves_week: z.coerce.number(),
  oneshot_week: z.coerce.number(),
  comeback_week: z.coerce.number(),
  daily_pulse_correct_week: z.coerce.number(),
  ta_kudos_week: z.coerce.number(),
  pinned_badge_ids: z.array(z.string()).catch([]),
  recent_7d_solved: z.coerce.number(),
});

const CohortGamificationRowSchema = CanonicalSqlSignalsSchema.extend({
  user_id: z.string(),
  display_name: z.string(),
  avatar_preset: z.string(),
  avatar_color: z.string(),
  status_emoji: z.string(),
  pinned_badge_ids: z.array(z.string()).catch([]),
  is_anonymous: z.boolean(),
  show_passport_details: z.boolean(),
});

const WeeklyQuestSignalsSchema = z.object({
  active_days_week: z.coerce.number(),
  solved_questions_week: z.coerce.number(),
  solved_aq_ids_week: z.array(z.string()).catch([]),
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

const PassportIdentityRowSchema = z.object({
  user_id: z.string(),
  display_name: z.string(),
  avatar_preset: z.string(),
  avatar_color: z.string(),
  banner_theme: z.string(),
  bio: z.string().nullable(),
  status_emoji: z.string(),
  favorite_topic: z.string().nullable(),
  github_username: z.string().nullable(),
  featured_title: z.string(),
  show_on_leaderboard: z.boolean(),
  show_passport_details: z.boolean(),
  show_activity_stats: z.boolean(),
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

export async function invalidateStudentGamificationCache(
  courseInstanceId: string,
  userId: string,
): Promise<void> {
  try {
    await Promise.all([
      cache.del(`sh-gamif-profile:${courseInstanceId}:${userId}`),
      cache.del(`sh-gamif-cohort:${courseInstanceId}`),
    ]);
  } catch {
    // Cache deletion failure must never break request handlers
  }
}

function getDateKeyFromGregorian(gy: number, gm: number, gd: number): string {
  return `${gy}-${String(gm).padStart(2, '0')}-${String(gd).padStart(2, '0')}`;
}

function addGregorianDays(dateKey: string, deltaDays: number): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + deltaDays));
  return dt.toISOString().slice(0, 10);
}

export interface JalaliWeekBounds {
  weekStartKey: string;
  weekEndKey: string;
  weekNumber: number;
  weekLabel: string;
  weekEndsAtIso: string;
  todayKey: string;
}

export function getCurrentJalaliWeekBounds(timezone: string): JalaliWeekBounds {
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
    todayKey,
  };
}

export type WeeklyGoalTier = 'light' | 'balanced' | 'pro';

export const WEEKLY_GOAL_TIERS: Record<
  WeeklyGoalTier,
  { target: number; xp: number; labelFa: string }
> = {
  light: { target: 2, xp: 35, labelFa: 'سبک (۲ سوال)' },
  balanced: { target: 4, xp: 50, labelFa: 'متعادل (۴ سوال)' },
  pro: { target: 6, xp: 80, labelFa: 'حرفه‌ای (۶ سوال)' },
};

export function computeCoopTargetSolves(totalQuestions: number, enrolledCount: number): number {
  return Math.max(
    totalQuestions * 3,
    Math.round(Math.max(5, enrolledCount) * totalQuestions * 0.65),
  );
}

// ---------- Level, Achievement & Next Unlock Calculators ----------

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

const TIER_REWARDS: [number, number, number, number] = [50, 100, 175, 275];

const TIER_NAMES_FA: Record<Exclude<AchievementTier, 'none' | 'secret'>, string> = {
  bronze: 'برنزی',
  silver: 'نقره‌ای',
  gold: 'طلایی',
  diamond: 'الماسی',
};

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

export function buildAchievements(params: {
  oneshotCount: number;
  longestStreakDays: number;
  perfectHwCount: number;
  edgeHunterCount: number;
  earlyBirdCount: number;
  masteredTopicsCount: number;
  syntaxCleanMaxRun: number;
  bonusHunterCount: number;
  acceptanceRate: number;
  totalSubmissions: number;
  firstBloodCount: number;
  nightOwlCount: number;
  buzzerBeaterCount: number;
  dawnCoderCount: number;
  comebackCount: number;
  giantSlayerCount: number;
  weekendWarriorWeeks: number;
  taKudosCount: number;
  coopCompletedCount: number;
}): StudentAchievement[] {
  const oneShotTier = evaluateTier(params.oneshotCount, [1, 5, 12, 25], TIER_REWARDS);
  const streakTier = evaluateTier(params.longestStreakDays, [3, 7, 14, 30], TIER_REWARDS);
  const perfectTier = evaluateTier(params.perfectHwCount, [1, 3, 6, 10], TIER_REWARDS);
  const edgeTier = evaluateTier(params.edgeHunterCount, [1, 4, 10, 20], TIER_REWARDS);
  const earlyTier = evaluateTier(params.earlyBirdCount, [1, 3, 6, 10], TIER_REWARDS);
  const topicTier = evaluateTier(params.masteredTopicsCount, [1, 3, 5, 8], TIER_REWARDS);
  const syntaxTier = evaluateTier(params.syntaxCleanMaxRun, [5, 12, 25, 50], TIER_REWARDS);
  const bonusTier = evaluateTier(params.bonusHunterCount, [1, 2, 4, 6], TIER_REWARDS);

  // Surgical Accuracy requires at least 15 gradable submissions so 1/1 doesn't trivialize it
  const accuracyEligible = params.totalSubmissions >= 15;
  const effectiveAcc = accuracyEligible ? params.acceptanceRate : 0;
  const accTier = evaluateTier(effectiveAcc, [65, 75, 85, 92], TIER_REWARDS);

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
      id: 'syntax-clean',
      title: 'Syntax Clean',
      description: 'ارسال‌های پیاپی معتبر بدون خطای نحوی (Syntax و Indentation)',
      secretHint: null,
      category: 'tiered',
      iconClass: 'bi bi-code-slash',
      ...syntaxTier,
      currentValue: params.syntaxCleanMaxRun,
      tierTargets: [5, 12, 25, 50],
      progressText:
        syntaxTier.nextTarget !== null
          ? `رکورد: ${toPersianDigits(params.syntaxCleanMaxRun)} از ${toPersianDigits(syntaxTier.nextTarget)} ارسال`
          : `${toPersianDigits(params.syntaxCleanMaxRun)} ارسال تمیز پیاپی`,
      rarityWeight: syntaxTier.tier === 'diamond' ? 88 : syntaxTier.tier === 'gold' ? 73 : 52,
    },
    {
      id: 'bonus-hunter',
      title: 'Bonus Hunter',
      description: 'کسب امتیاز تشویقی (بونوس) فراتر از سقف نمره اصلی یک سری تمرین',
      secretHint: null,
      category: 'tiered',
      iconClass: 'bi bi-gem',
      ...bonusTier,
      currentValue: params.bonusHunterCount,
      tierTargets: [1, 2, 4, 6],
      progressText:
        bonusTier.nextTarget !== null
          ? `${toPersianDigits(params.bonusHunterCount)} از ${toPersianDigits(bonusTier.nextTarget)} سری بونوس‌دار`
          : `${toPersianDigits(params.bonusHunterCount)} سری با امتیاز بونوس`,
      rarityWeight: bonusTier.tier === 'diamond' ? 91 : bonusTier.tier === 'gold' ? 77 : 64,
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
      id: 'ta-kudos',
      title: 'TA Kudos',
      description: 'دریافت نشان تحسین کادر آموزشی برای کد تمیز یا راه‌حل خلاقانه',
      secretHint: 'کد خوانا، با ساختار تمیز و نام‌گذاری خوب بنویسید تا نظر TAها را جلب کند.',
      iconClass: 'bi bi-patch-check-fill',
      count: params.taKudosCount,
      xpReward: 0,
      rarityWeight: 96,
      countSuffix: 'تحسین از کادر آموزشی (+۱۰۰ XP)',
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
    makeSecret({
      id: 'class-coop',
      title: 'Class Co-op',
      description: 'مشارکت در رسیدن کل کلاس به هدف مشترک یک سری تمرین',
      secretHint: 'حل تمرین‌های سری فعال هم‌زمان با همراهی هم‌کلاسی‌ها.',
      iconClass: 'bi bi-people-fill',
      count: params.coopCompletedCount,
      xpReward: 0,
      rarityWeight: 69,
      countSuffix: 'چالش تیمی تکمیل‌شده (+۷۵ XP)',
    }),
  ];

  return [...tiered, ...secrets];
}

const NEXT_UNLOCK_UNITS: Record<string, string> = {
  'one-shot': 'سوال One-Shot',
  streak: 'روز پیاپی',
  perfectionist: 'سری تمرین کامل',
  'edge-hunter': 'سوال چالشی',
  'early-bird': 'تمرین زودهنگام',
  'syntax-clean': 'ارسال پیاپی بدون خطای نحوی',
  'bonus-hunter': 'سری بونوس‌دار',
  'topic-master': 'مبحث تکمیل‌شده',
};

export function computeNextUnlockHint(
  achievements: StudentAchievement[],
  totalSubmissions: number,
): NextUnlockHint | null {
  const tierOrder: Exclude<AchievementTier, 'none' | 'secret'>[] = [
    'bronze',
    'silver',
    'gold',
    'diamond',
  ];

  const candidates: {
    ach: StudentAchievement;
    nextTier: Exclude<AchievementTier, 'none' | 'secret'>;
    remaining: number;
    xpReward: number;
  }[] = [];

  for (const ach of achievements) {
    if (ach.category !== 'tiered' || ach.nextTarget === null || ach.tier === 'diamond') continue;
    if (ach.id === 'surgical-accuracy' && totalSubmissions < 15) continue;

    const currentIdx = ach.tier === 'none' ? -1 : tierOrder.indexOf(ach.tier);
    const nextIdx = currentIdx + 1;
    if (nextIdx >= tierOrder.length) continue;

    const remaining = Math.max(1, ach.nextTarget - ach.currentValue);
    candidates.push({
      ach,
      nextTier: tierOrder[nextIdx],
      remaining,
      xpReward: TIER_REWARDS[nextIdx],
    });
  }

  if (candidates.length === 0) return null;

  candidates.sort((a, b) => {
    if (b.ach.progressPerc !== a.ach.progressPerc) return b.ach.progressPerc - a.ach.progressPerc;
    if (a.remaining !== b.remaining) return a.remaining - b.remaining;
    return b.xpReward - a.xpReward;
  });

  const best = candidates[0];
  const nextTierFa = TIER_NAMES_FA[best.nextTier];
  const nextTarget = best.ach.nextTarget ?? best.ach.currentValue + best.remaining;

  const messageFa =
    best.ach.id === 'surgical-accuracy'
      ? `رساندن دقت به ${toPersianDigits(nextTarget)}٪ تا ${nextTierFa} شدن ${best.ach.title} (+${toPersianDigits(best.xpReward)} XP)`
      : `فقط ${toPersianDigits(best.remaining)} ${NEXT_UNLOCK_UNITS[best.ach.id] ?? 'گام'} تا ${nextTierFa} شدن ${best.ach.title} (+${toPersianDigits(best.xpReward)} XP)`;

  return {
    achievementId: best.ach.id,
    title: best.ach.title,
    iconClass: best.ach.iconClass,
    nextTier: best.nextTier,
    nextTierFa,
    remaining: best.remaining,
    nextTarget,
    currentValue: best.ach.currentValue,
    progressPerc: best.ach.progressPerc,
    xpReward: best.xpReward,
    messageFa,
  };
}

export function selectShowcaseBadges(
  achievements: StudentAchievement[],
  pinnedBadgeIds: string[] = [],
): ShowcaseBadge[] {
  const earnedById = new Map<string, StudentAchievement>();
  for (const ach of achievements) {
    if (ach.earned) earnedById.set(ach.id, ach);
  }

  const chosen: StudentAchievement[] = [];
  for (const id of pinnedBadgeIds) {
    const match = earnedById.get(id);
    if (match && !chosen.includes(match)) {
      chosen.push(match);
    }
    if (chosen.length >= 3) break;
  }

  if (chosen.length < 3) {
    const remaining = achievements
      .filter((a) => a.earned && !chosen.includes(a))
      .sort((a, b) => b.rarityWeight - a.rarityWeight);
    for (const ach of remaining) {
      chosen.push(ach);
      if (chosen.length >= 3) break;
    }
  }

  return chosen.map((a) => ({
    id: a.id,
    title: a.title,
    tier: a.tier,
    iconClass: a.iconClass,
    tooltip: `${a.title} — ${a.description}`,
  }));
}

export function computeWeeklyQuestsFromSignals({
  signals,
  bounds,
}: {
  signals: {
    activeDaysWeek: number;
    solvedQuestionsWeek: number;
    cleanSolvesWeek: number;
    oneshotWeek: number;
    comebackWeek: number;
    hardSolvedWeek: number;
  };
  bounds: Pick<JalaliWeekBounds, 'weekNumber' | 'weekLabel' | 'weekEndsAtIso'>;
}): WeeklyQuestsBundle {
  const variant = ((bounds.weekNumber % 4) + 4) % 4;

  const q1Target = 3;
  const q1Cur = Math.min(q1Target, signals.activeDaysWeek);

  const q2Meta =
    variant === 1
      ? {
          title: 'One-Shot Sprint',
          description: 'حل کامل ۱ سوال به صورت One-Shot (تلاش اول) در این هفته',
          iconClass: 'bi bi-lightning-charge',
          target: 1,
          raw: signals.oneshotWeek,
          xp: 100,
        }
      : variant === 2
        ? {
            title: 'Comeback Kid',
            description: 'به ثمر رساندن ۱ سوالی که قبلاً تلاش ناموفق روی آن داشته‌اید',
            iconClass: 'bi bi-arrow-repeat',
            target: 1,
            raw: signals.comebackWeek,
            xp: 110,
          }
        : {
            title: 'Clean Solver',
            description: 'حل کامل ۲ سوال با حداکثر ۲ تلاش برای هر کدام در این هفته',
            iconClass: 'bi bi-bullseye',
            target: 2,
            raw: signals.cleanSolvesWeek,
            xp: 100,
          };

  const q3Meta =
    variant === 1 || variant === 3
      ? {
          title: 'Challenge Breaker',
          description: 'حل کامل ۱ سوال چالشی (سوالی با نرخ حل کلاس زیر ۵۰٪) در این هفته',
          iconClass: 'bi bi-shield-check',
          target: 1,
          raw: signals.hardSolvedWeek,
          xp: 140,
        }
      : variant === 2
        ? {
            title: 'Problem Sprinter',
            description: 'حل کامل ۴ سوال جدید در طول این هفته',
            iconClass: 'bi bi-rocket-takeoff',
            target: 4,
            raw: signals.solvedQuestionsWeek,
            xp: 135,
          }
        : {
            title: 'Problem Sprinter',
            description: 'حل کامل ۳ سوال جدید در طول این هفته',
            iconClass: 'bi bi-rocket-takeoff',
            target: 3,
            raw: signals.solvedQuestionsWeek,
            xp: 125,
          };

  const q2Cur = Math.min(q2Meta.target, q2Meta.raw);
  const q3Cur = Math.min(q3Meta.target, q3Meta.raw);

  const quests: WeeklyQuestItem[] = [
    {
      id: 'weekly-consistency',
      title: 'Weekly Consistency',
      description: 'ثبت ارسال کد یا تمرین روزانه در ۳ روز مختلف از این هفته شمسی',
      iconClass: 'bi bi-calendar-check',
      current: q1Cur,
      target: q1Target,
      progressPerc: Math.round((q1Cur / q1Target) * 100),
      xpReward: 75,
      completed: signals.activeDaysWeek >= q1Target,
    },
    {
      id: 'weekly-precision',
      title: q2Meta.title,
      description: q2Meta.description,
      iconClass: q2Meta.iconClass,
      current: q2Cur,
      target: q2Meta.target,
      progressPerc: Math.round((q2Cur / q2Meta.target) * 100),
      xpReward: q2Meta.xp,
      completed: q2Meta.raw >= q2Meta.target,
    },
    {
      id: 'weekly-momentum',
      title: q3Meta.title,
      description: q3Meta.description,
      iconClass: q3Meta.iconClass,
      current: q3Cur,
      target: q3Meta.target,
      progressPerc: Math.round((q3Cur / q3Meta.target) * 100),
      xpReward: q3Meta.xp,
      completed: q3Meta.raw >= q3Meta.target,
    },
  ];

  return {
    weekLabel: bounds.weekLabel,
    weekEndsAtIso: bounds.weekEndsAtIso,
    completedCount: quests.filter((q) => q.completed).length,
    quests,
  };
}

export interface AqDifficultyMeta {
  solveRatePerc: number;
  attempted: number;
  firstBloodUserId: string | null;
  firstBloodDisplayName: string | null;
}

export interface CanonicalGamificationSignals {
  solvedAqIds: string[];
  oneshotAqIds: string[];
  partialScoreSum: number;
  oneshotCount: number;
  edgeHunterCount: number;
  comebackCount: number;
  perfectHwCount: number;
  earlyBirdCount: number;
  bonusHunterCount: number;
  syntaxCleanMaxRun: number;
  totalSubmissions: number;
  acceptedSubmissions: number;
  activeDaysTotal: number;
  activeDayKeys: string[];
  nightOwlCount: number;
  dawnCoderCount: number;
  buzzerBeaterCount: number;
  weekendWarriorWeeks: number;
  masteredTopicsCount: number;
  taKudosCount: number;
  dailyPulseCorrectCount: number;
  weeklyGoalMetWeeks: number;
  weeklyGoalXp?: number;
  coopCompletedCount: number;
  firstBloodAqIds: string[];
  activeDaysWeek: number;
  solvedAqIdsWeek: string[];
  cleanSolvesWeek: number;
  oneshotWeek: number;
  comebackWeek: number;
  dailyPulseCorrectWeek: number;
  taKudosWeek: number;
}

export function computeCanonicalGamificationState({
  signals,
  aqMeta,
  bounds,
}: {
  signals: CanonicalGamificationSignals;
  aqMeta: Map<string, AqDifficultyMeta>;
  bounds: Pick<JalaliWeekBounds, 'weekNumber' | 'weekLabel' | 'weekEndsAtIso' | 'todayKey'>;
}) {
  const streak = computeStreakWithFreezes({
    activeDayKeys: signals.activeDayKeys,
    todayKey: bounds.todayKey,
    maxFreezesPerMonth: 2,
  });

  let solvedXp = 0;
  let giantSlayerCount = 0;
  for (const aqId of signals.solvedAqIds) {
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
  solvedXp += Math.floor(signals.partialScoreSum * 0.6);

  let weeklySolvedXp = 0;
  let hardSolvedWeek = 0;
  for (const aqId of signals.solvedAqIdsWeek) {
    const meta = aqMeta.get(aqId);
    let multiplier = 1.0;
    if (meta && meta.attempted >= 5) {
      if (meta.solveRatePerc < 50) {
        hardSolvedWeek += 1;
      }
      if (meta.solveRatePerc < 40) {
        multiplier = 1.5;
      } else if (meta.solveRatePerc < 70) {
        multiplier = 1.25;
      }
    }
    weeklySolvedXp += Math.round(100 * multiplier);
  }

  const weeklyQuests = computeWeeklyQuestsFromSignals({
    signals: {
      activeDaysWeek: signals.activeDaysWeek,
      solvedQuestionsWeek: signals.solvedAqIdsWeek.length,
      cleanSolvesWeek: signals.cleanSolvesWeek,
      oneshotWeek: signals.oneshotWeek,
      comebackWeek: signals.comebackWeek,
      hardSolvedWeek,
    },
    bounds,
  });

  const acceptanceRate =
    signals.totalSubmissions > 0
      ? Math.round((signals.acceptedSubmissions / signals.totalSubmissions) * 100)
      : 0;

  const achievements = buildAchievements({
    oneshotCount: signals.oneshotCount,
    longestStreakDays: streak.longestStreakDays,
    perfectHwCount: signals.perfectHwCount,
    edgeHunterCount: signals.edgeHunterCount,
    earlyBirdCount: signals.earlyBirdCount,
    masteredTopicsCount: signals.masteredTopicsCount,
    syntaxCleanMaxRun: signals.syntaxCleanMaxRun,
    bonusHunterCount: signals.bonusHunterCount,
    acceptanceRate,
    totalSubmissions: signals.totalSubmissions,
    firstBloodCount: signals.firstBloodAqIds.length,
    nightOwlCount: signals.nightOwlCount,
    buzzerBeaterCount: signals.buzzerBeaterCount,
    dawnCoderCount: signals.dawnCoderCount,
    comebackCount: signals.comebackCount,
    giantSlayerCount,
    weekendWarriorWeeks: signals.weekendWarriorWeeks,
    taKudosCount: signals.taKudosCount,
    coopCompletedCount: signals.coopCompletedCount,
  });

  const achievementXp = achievements.reduce((sum, a) => sum + a.xpReward, 0);
  const weeklyQuestXp = weeklyQuests.quests.reduce(
    (sum, q) => sum + (q.completed ? q.xpReward : 0),
    0,
  );
  const goalXp = signals.weeklyGoalXp ?? signals.weeklyGoalMetWeeks * 50;

  const bonusXp =
    signals.oneshotCount * 35 +
    signals.perfectHwCount * 150 +
    signals.earlyBirdCount * 50 +
    signals.activeDaysTotal * 15 +
    signals.firstBloodAqIds.length * 60 +
    signals.taKudosCount * 100 +
    signals.dailyPulseCorrectCount * 25 +
    goalXp +
    signals.coopCompletedCount * 75 +
    achievementXp +
    weeklyQuestXp;

  const totalXp = solvedXp + bonusXp;
  const level = computeLevelInfo(totalXp);
  const nextUnlock = computeNextUnlockHint(achievements, signals.totalSubmissions);

  const weeklyXp =
    weeklySolvedXp +
    signals.oneshotWeek * 35 +
    signals.activeDaysWeek * 15 +
    signals.dailyPulseCorrectWeek * 25 +
    signals.taKudosWeek * 100 +
    weeklyQuestXp;

  return {
    solvedXp,
    bonusXp,
    totalXp,
    weeklyXp,
    acceptanceRate,
    level,
    streak,
    weeklyQuests,
    achievements,
    unlockedAchievementIds: achievements.filter((a) => a.earned).map((a) => a.id),
    showcaseBadges: selectShowcaseBadges(achievements),
    nextUnlock,
  };
}

// ---------- League Partitioning ----------

const LEAGUE_TIER_META: Record<WeeklyLeagueTier, { titleFa: string }> = {
  diamond: { titleFa: 'لیگ الماس' },
  gold: { titleFa: 'لیگ طلا' },
  silver: { titleFa: 'لیگ نقره' },
  bronze: { titleFa: 'لیگ برنز' },
};

export function computeWeeklyLeagues(
  students: {
    userId: string;
    displayName: string;
    avatarPreset?: string;
    avatarColor?: string;
    statusEmoji?: string;
    isAnonymous?: boolean;
    showPassportDetails?: boolean;
    totalXp: number;
    weeklyXp: number;
    solvedThisWeek: number;
    level: number;
    showcaseBadges: ShowcaseBadge[];
  }[],
  bounds: Pick<JalaliWeekBounds, 'weekLabel' | 'weekEndsAtIso'>,
): WeeklyLeaguesBundle {
  if (students.length === 0) {
    return { weekLabel: bounds.weekLabel, weekEndsAtIso: bounds.weekEndsAtIso, leagues: [] };
  }

  // Partition cohort into ~15-student leagues balanced by overall skill tier
  const rankedBySkill = [...students].sort((a, b) => {
    if (b.totalXp !== a.totalXp) return b.totalXp - a.totalXp;
    return a.userId.localeCompare(b.userId);
  });

  const groupCount =
    rankedBySkill.length <= 20 ? 1 : Math.max(1, Math.round(rankedBySkill.length / 15));
  const tierSequence: WeeklyLeagueTier[] =
    groupCount === 1
      ? ['silver']
      : groupCount === 2
        ? ['gold', 'silver']
        : groupCount === 3
          ? ['gold', 'silver', 'bronze']
          : ['diamond', 'gold', 'silver', 'bronze'];

  const leagues: WeeklyLeagueGroup[] = [];
  let cursor = 0;

  for (let g = 0; g < groupCount; g += 1) {
    const remainingStudents = rankedBySkill.length - cursor;
    const remainingGroups = groupCount - g;
    const size = Math.ceil(remainingStudents / remainingGroups);
    const slice = rankedBySkill.slice(cursor, cursor + size);
    cursor += size;

    const sortedWeekly = [...slice].sort((a, b) => {
      if (b.weeklyXp !== a.weeklyXp) return b.weeklyXp - a.weeklyXp;
      if (b.solvedThisWeek !== a.solvedThisWeek) return b.solvedThisWeek - a.solvedThisWeek;
      if (b.totalXp !== a.totalXp) return b.totalXp - a.totalXp;
      return a.displayName.localeCompare(b.displayName, 'fa');
    });

    const tier = tierSequence[Math.min(g, tierSequence.length - 1)];
    const zoneSize = sortedWeekly.length >= 12 ? 5 : sortedWeekly.length >= 8 ? 3 : 0;

    const members: WeeklyLeagueMember[] = sortedWeekly.map((s, idx) => {
      let zone: WeeklyLeagueMember['zone'] = 'safe';
      if (zoneSize > 0) {
        if (idx < zoneSize && s.weeklyXp > 0) {
          zone = 'promote';
        } else if (idx >= sortedWeekly.length - zoneSize) {
          zone = 'relegate';
        }
      }
      return {
        rank: idx + 1,
        userId: s.userId,
        displayName: s.displayName,
        avatarPreset: s.avatarPreset ?? 'initials',
        avatarColor: s.avatarColor ?? 'cobalt',
        statusEmoji: s.statusEmoji ?? 'none',
        isAnonymous: s.isAnonymous ?? false,
        showPassportDetails: s.showPassportDetails ?? true,
        weeklyXp: s.weeklyXp,
        solvedThisWeek: s.solvedThisWeek,
        level: s.level,
        showcaseBadges: s.showcaseBadges,
        zone,
      };
    });

    const baseTitle = LEAGUE_TIER_META[tier].titleFa;
    const groupSuffix =
      groupCount > tierSequence.length
        ? ` — دسته ${toPersianDigits(g + 1)}`
        : groupCount === 1
          ? ' (دسته هم‌سطح کلاس)'
          : '';

    leagues.push({
      id: `league-${g + 1}`,
      tier,
      titleFa: `${baseTitle}${groupSuffix}`,
      members,
      promoteCount: members.filter((m) => m.zone === 'promote').length,
      relegateCount: members.filter((m) => m.zone === 'relegate').length,
    });
  }

  return {
    weekLabel: bounds.weekLabel,
    weekEndsAtIso: bounds.weekEndsAtIso,
    leagues,
  };
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

function buildAqMetaMap(courseAqRows: z.infer<typeof CourseAqRowSchema>[]): {
  aqMeta: Map<string, AqDifficultyMeta>;
  firstBloodByAqId: Record<string, FirstBloodOwner>;
} {
  const aqMeta = new Map<string, AqDifficultyMeta>();
  const firstBloodByAqId: Record<string, FirstBloodOwner> = {};

  for (const row of courseAqRows) {
    const solveRatePerc =
      row.attempted_count > 0 ? Math.round((row.solved_count / row.attempted_count) * 100) : 100;
    aqMeta.set(row.assessment_question_id, {
      solveRatePerc,
      attempted: row.attempted_count,
      firstBloodUserId: row.first_blood_user_id,
      firstBloodDisplayName: row.first_blood_display_name,
    });
    if (row.first_blood_user_id && row.first_blood_display_name) {
      firstBloodByAqId[row.assessment_question_id] = {
        userId: row.first_blood_user_id,
        displayName: row.first_blood_display_name,
      };
    }
  }

  return { aqMeta, firstBloodByAqId };
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

  const [courseAqRows, row] = await Promise.all([
    sqldb.queryRows(
      sql.select_course_question_difficulty_and_first_blood,
      { course_instance_id: courseInstanceId },
      CourseAqRowSchema,
    ),
    sqldb.queryRow(
      sql.select_student_weekly_quest_signals,
      {
        course_instance_id: courseInstanceId,
        user_id: userId,
        timezone: tz,
        week_start_key: bounds.weekStartKey,
        week_end_key: bounds.weekEndKey,
      },
      WeeklyQuestSignalsSchema,
    ),
  ]);

  const { aqMeta } = buildAqMetaMap(courseAqRows);
  let hardSolvedWeek = 0;
  for (const aqId of row.solved_aq_ids_week) {
    const meta = aqMeta.get(aqId);
    if (meta && meta.attempted >= 5 && meta.solveRatePerc < 50) {
      hardSolvedWeek += 1;
    }
  }

  return computeWeeklyQuestsFromSignals({
    signals: {
      activeDaysWeek: row.active_days_week,
      solvedQuestionsWeek: row.solved_questions_week,
      cleanSolvesWeek: row.clean_solves_week,
      oneshotWeek: row.oneshot_week,
      comebackWeek: row.comeback_week,
      hardSolvedWeek,
    },
    bounds,
  });
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
    const bounds = getCurrentJalaliWeekBounds(tz);
    const [courseAqRows, signals, activity] = await Promise.all([
      sqldb.queryRows(
        sql.select_course_question_difficulty_and_first_blood,
        { course_instance_id: courseInstanceId },
        CourseAqRowSchema,
      ),
      sqldb.queryRow(
        sql.select_student_xp_and_achievement_signals,
        {
          course_instance_id: courseInstanceId,
          user_id: userId,
          timezone: tz,
          week_start_key: bounds.weekStartKey,
          week_end_key: bounds.weekEndKey,
        },
        CanonicalSqlSignalsSchema,
      ),
      getStudentActivityAndBadges({ courseInstanceId, userId, timezone: tz }),
    ]);

    const { aqMeta, firstBloodByAqId } = buildAqMetaMap(courseAqRows);
    const firstBloodAqIds: string[] = [];
    for (const [aqId, owner] of Object.entries(firstBloodByAqId)) {
      if (owner.userId === userId) firstBloodAqIds.push(aqId);
    }

    const state = computeCanonicalGamificationState({
      signals: {
        solvedAqIds: signals.solved_aq_ids,
        oneshotAqIds: signals.oneshot_aq_ids,
        partialScoreSum: signals.partial_score_sum,
        oneshotCount: signals.oneshot_count,
        edgeHunterCount: signals.edge_hunter_count,
        comebackCount: signals.comeback_count,
        perfectHwCount: signals.perfect_hw_count,
        earlyBirdCount: signals.early_bird_count,
        bonusHunterCount: signals.bonus_hunter_count,
        syntaxCleanMaxRun: signals.syntax_clean_max_run,
        totalSubmissions: signals.total_submissions,
        acceptedSubmissions: signals.accepted_submissions,
        activeDaysTotal: signals.active_days_total,
        activeDayKeys: signals.active_day_keys,
        nightOwlCount: signals.night_owl_count,
        dawnCoderCount: signals.dawn_coder_count,
        buzzerBeaterCount: signals.buzzer_beater_count,
        weekendWarriorWeeks: signals.weekend_warrior_weeks,
        masteredTopicsCount: signals.mastered_topics_count,
        taKudosCount: signals.ta_kudos_count,
        dailyPulseCorrectCount: signals.daily_pulse_correct_count,
        weeklyGoalMetWeeks: signals.weekly_goal_met_weeks,
        weeklyGoalXp: signals.weekly_goal_xp,
        coopCompletedCount: signals.coop_completed_count,
        firstBloodAqIds,
        activeDaysWeek: signals.active_days_week,
        solvedAqIdsWeek: signals.solved_aq_ids_week,
        cleanSolvesWeek: signals.clean_solves_week,
        oneshotWeek: signals.oneshot_week,
        comebackWeek: signals.comeback_week,
        dailyPulseCorrectWeek: signals.daily_pulse_correct_week,
        taKudosWeek: signals.ta_kudos_week,
      },
      aqMeta,
      bounds,
    });

    return {
      xp: {
        totalXp: state.totalXp,
        solvedXp: state.solvedXp,
        bonusXp: state.bonusXp,
      },
      level: state.level,
      achievements: state.achievements,
      unlockedAchievementIds: state.unlockedAchievementIds,
      showcaseBadges: selectShowcaseBadges(state.achievements, signals.pinned_badge_ids),
      nextUnlock: state.nextUnlock,
      weeklyQuests: state.weeklyQuests,
      streak: {
        current: state.streak.currentStreakDays,
        longest: state.streak.longestStreakDays,
        activeDays140d: activity.activeDaysCount,
        freezesUsedThisMonth: state.streak.freezesUsedThisMonth,
        freezesRemainingThisMonth: state.streak.freezesRemainingThisMonth,
        maxFreezesPerMonth: state.streak.maxFreezesPerMonth,
      },
      solvedAqIds: signals.solved_aq_ids,
      oneshotAqIds: signals.oneshot_aq_ids,
      firstBloodAqIds,
      firstBloodByAqId,
      masteredTopicsCount: signals.mastered_topics_count,
      taKudosCount: signals.ta_kudos_count,
      dailyPulseCorrectCount: signals.daily_pulse_correct_count,
      coopCompletedCount: signals.coop_completed_count,
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
    const bounds = getCurrentJalaliWeekBounds(tz);
    const [courseAqRows, cohortRows] = await Promise.all([
      sqldb.queryRows(
        sql.select_course_question_difficulty_and_first_blood,
        { course_instance_id: courseInstanceId },
        CourseAqRowSchema,
      ),
      sqldb.queryRows(
        sql.select_cohort_gamification_rows,
        {
          course_instance_id: courseInstanceId,
          timezone: tz,
          week_start_key: bounds.weekStartKey,
          week_end_key: bounds.weekEndKey,
        },
        CohortGamificationRowSchema,
      ),
    ]);

    const { aqMeta, firstBloodByAqId } = buildAqMetaMap(courseAqRows);
    const firstBloodAqIdsByUser = new Map<string, string[]>();
    for (const [aqId, owner] of Object.entries(firstBloodByAqId)) {
      const arr = firstBloodAqIdsByUser.get(owner.userId) ?? [];
      arr.push(aqId);
      firstBloodAqIdsByUser.set(owner.userId, arr);
    }

    const byUserId: CohortGamificationBundle['byUserId'] = {};
    const leagueCandidates: {
      userId: string;
      displayName: string;
      avatarPreset: string;
      avatarColor: string;
      statusEmoji: string;
      isAnonymous: boolean;
      showPassportDetails: boolean;
      totalXp: number;
      weeklyXp: number;
      solvedThisWeek: number;
      level: number;
      showcaseBadges: ShowcaseBadge[];
    }[] = [];

    const risingCandidates: HallOfFameEntry[] = [];
    const accuracyCandidates: HallOfFameEntry[] = [];
    const streakCandidates: HallOfFameEntry[] = [];
    const firstBloodCandidates: HallOfFameEntry[] = [];

    for (const row of cohortRows) {
      const firstBloodAqIds = firstBloodAqIdsByUser.get(row.user_id) ?? [];
      const fbCount = firstBloodAqIds.length;

      const state = computeCanonicalGamificationState({
        signals: {
          solvedAqIds: row.solved_aq_ids,
          oneshotAqIds: row.oneshot_aq_ids,
          partialScoreSum: row.partial_score_sum,
          oneshotCount: row.oneshot_count,
          edgeHunterCount: row.edge_hunter_count,
          comebackCount: row.comeback_count,
          perfectHwCount: row.perfect_hw_count,
          earlyBirdCount: row.early_bird_count,
          bonusHunterCount: row.bonus_hunter_count,
          syntaxCleanMaxRun: row.syntax_clean_max_run,
          totalSubmissions: row.total_submissions,
          acceptedSubmissions: row.accepted_submissions,
          activeDaysTotal: row.active_days_total,
          activeDayKeys: row.active_day_keys,
          nightOwlCount: row.night_owl_count,
          dawnCoderCount: row.dawn_coder_count,
          buzzerBeaterCount: row.buzzer_beater_count,
          weekendWarriorWeeks: row.weekend_warrior_weeks,
          masteredTopicsCount: row.mastered_topics_count,
          taKudosCount: row.ta_kudos_count,
          dailyPulseCorrectCount: row.daily_pulse_correct_count,
          weeklyGoalMetWeeks: row.weekly_goal_met_weeks,
          weeklyGoalXp: row.weekly_goal_xp,
          coopCompletedCount: row.coop_completed_count,
          firstBloodAqIds,
          activeDaysWeek: row.active_days_week,
          solvedAqIdsWeek: row.solved_aq_ids_week,
          cleanSolvesWeek: row.clean_solves_week,
          oneshotWeek: row.oneshot_week,
          comebackWeek: row.comeback_week,
          dailyPulseCorrectWeek: row.daily_pulse_correct_week,
          taKudosWeek: row.ta_kudos_week,
        },
        aqMeta,
        bounds,
      });

      const showcaseBadges = selectShowcaseBadges(state.achievements, row.pinned_badge_ids);

      byUserId[row.user_id] = {
        level: state.level.level,
        levelTitle: state.level.title,
        totalXp: state.totalXp,
        weeklyXp: state.weeklyXp,
        avatarPreset: row.avatar_preset,
        avatarColor: row.avatar_color,
        statusEmoji: row.status_emoji,
        isAnonymous: row.is_anonymous,
        showPassportDetails: row.show_passport_details,
        showcaseBadges,
      };

      leagueCandidates.push({
        userId: row.user_id,
        displayName: row.display_name,
        avatarPreset: row.avatar_preset,
        avatarColor: row.avatar_color,
        statusEmoji: row.status_emoji,
        isAnonymous: row.is_anonymous,
        showPassportDetails: row.show_passport_details,
        totalXp: state.totalXp,
        weeklyXp: state.weeklyXp,
        solvedThisWeek: row.solved_aq_ids_week.length,
        level: state.level.level,
        showcaseBadges,
      });

      if (row.recent_7d_solved > 0) {
        risingCandidates.push({
          userId: row.user_id,
          displayName: row.display_name,
          isAnonymous: row.is_anonymous,
          metricLabel: `${toPersianDigits(row.recent_7d_solved)} سوال جدید این هفته`,
          metricValue: row.recent_7d_solved,
        });
      }

      if (row.solved_aq_ids.length >= 5 && row.total_submissions >= 5) {
        accuracyCandidates.push({
          userId: row.user_id,
          displayName: row.display_name,
          isAnonymous: row.is_anonymous,
          metricLabel: `${toPersianDigits(state.acceptanceRate)}٪ قبولی (${toPersianDigits(row.oneshot_count)} One-Shot)`,
          metricValue: state.acceptanceRate * 1000 + row.oneshot_count,
        });
      }

      if (state.streak.currentStreakDays >= 2) {
        streakCandidates.push({
          userId: row.user_id,
          displayName: row.display_name,
          isAnonymous: row.is_anonymous,
          metricLabel: `${toPersianDigits(state.streak.currentStreakDays)} روز پیاپی`,
          metricValue: state.streak.currentStreakDays,
        });
      }

      if (fbCount > 0) {
        firstBloodCandidates.push({
          userId: row.user_id,
          displayName: row.display_name,
          isAnonymous: row.is_anonymous,
          metricLabel: `${toPersianDigits(fbCount)} First Blood`,
          metricValue: fbCount,
        });
      }
    }

    const top3 = (arr: HallOfFameEntry[]) =>
      arr.sort((a, b) => b.metricValue - a.metricValue).slice(0, 3);

    const weeklyLeagues = computeWeeklyLeagues(leagueCandidates, bounds);

    return {
      byUserId,
      hallOfFame: {
        risingStars: top3(risingCandidates),
        accuracyKings: top3(accuracyCandidates),
        streakLegends: top3(streakCandidates),
        firstBloodHunters: top3(firstBloodCandidates),
      },
      firstBloodByAqId,
      weeklyLeagues,
    };
  });
}

export async function getStudentCodingPassport({
  courseInstanceId,
  targetUserId,
  viewerUserId,
  timezone,
}: {
  courseInstanceId: string;
  targetUserId: string;
  viewerUserId?: string;
  timezone: string;
}): Promise<StudentCodingPassport | null> {
  const identity = await sqldb.queryOptionalRow(
    sql.select_student_passport_identity,
    { course_instance_id: courseInstanceId, user_id: targetUserId },
    PassportIdentityRowSchema,
  );
  if (!identity) return null;

  const isOwner = viewerUserId === targetUserId;
  if (!identity.show_on_leaderboard && !isOwner) {
    return null;
  }

  const profile = await getStudentGamificationProfile({
    courseInstanceId,
    userId: targetUserId,
    timezone,
  });

  if (!identity.show_passport_details && !isOwner) {
    return {
      userId: identity.user_id,
      displayName: identity.display_name,
      avatarPreset: identity.avatar_preset,
      avatarColor: identity.avatar_color,
      bannerTheme: identity.banner_theme,
      bio: null,
      statusEmoji: 'none',
      favoriteTopic: null,
      githubUsername: null,
      featuredTitle:
        identity.featured_title === 'auto' ? profile.level.title : identity.featured_title,
      privacyLocked: true,
      showActivityStats: false,
      level: profile.level,
      streak: null,
      solvedQuestions: null,
      totalSubmissions: null,
      acceptanceRate: null,
      taKudosCount: 0,
      firstBloodCount: 0,
      earnedAchievements: [],
      topicMastery: [],
    };
  }

  const showStats = identity.show_activity_stats || isOwner;
  const bounds = getCurrentJalaliWeekBounds(timezone || 'Asia/Tehran');
  const [skillTree, signals] = showStats
    ? await Promise.all([
        getStudentSkillTreeData({ courseInstanceId, userId: targetUserId }),
        sqldb.queryRow(
          sql.select_student_xp_and_achievement_signals,
          {
            course_instance_id: courseInstanceId,
            user_id: targetUserId,
            timezone: timezone || 'Asia/Tehran',
            week_start_key: bounds.weekStartKey,
            week_end_key: bounds.weekEndKey,
          },
          CanonicalSqlSignalsSchema,
        ),
      ])
    : [null, null];

  const acceptanceRate =
    signals && signals.total_submissions > 0
      ? Math.round((signals.accepted_submissions / signals.total_submissions) * 100)
      : 0;

  return {
    userId: identity.user_id,
    displayName: identity.display_name,
    avatarPreset: identity.avatar_preset,
    avatarColor: identity.avatar_color,
    bannerTheme: identity.banner_theme,
    bio: identity.bio,
    statusEmoji: identity.status_emoji,
    favoriteTopic: identity.favorite_topic,
    githubUsername: identity.github_username,
    featuredTitle:
      identity.featured_title === 'auto' ? profile.level.title : identity.featured_title,
    privacyLocked: false,
    showActivityStats: showStats,
    level: profile.level,
    streak: showStats
      ? {
          current: profile.streak.current,
          longest: profile.streak.longest,
          activeDays140d: profile.streak.activeDays140d,
        }
      : null,
    solvedQuestions: showStats ? profile.solvedAqIds.length : null,
    totalSubmissions: showStats && signals ? signals.total_submissions : null,
    acceptanceRate: showStats ? acceptanceRate : null,
    taKudosCount: profile.taKudosCount,
    firstBloodCount: profile.firstBloodAqIds.length,
    earnedAchievements: profile.achievements
      .filter((a) => a.earned)
      .sort((a, b) => b.rarityWeight - a.rarityWeight)
      .map((a) => ({
        id: a.id,
        title: a.title,
        tier: a.tier,
        iconClass: a.iconClass,
        description: a.description,
      })),
    topicMastery: skillTree
      ? skillTree.nodes.slice(0, 8).map((n) => ({
          title: n.title,
          solvedQuestions: n.solvedQuestions,
          totalQuestions: n.totalQuestions,
          masteryPerc: n.masteryPerc,
          status: n.status,
        }))
      : [],
  };
}
