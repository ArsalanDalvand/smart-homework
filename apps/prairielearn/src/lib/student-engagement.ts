import { z } from 'zod';

import * as sqldb from '@prairielearn/postgres';

import {
  JALALI_MONTH_NAMES,
  getTodayJalali,
  gregorianToJalali,
  jalaliToGregorian,
  toPersianDigits,
} from './jalali.js';

const sql = sqldb.loadSqlEquiv(import.meta.url);

export const MIN_ANALYTICS_COHORT = 5;

// ---------- Types & Schemas ----------

export interface HistogramBucket {
  label: string;
  minInclusive: number;
  maxInclusive: number;
  count: number;
  isCurrentUser: boolean;
}

export interface AssessmentComparisonItem {
  assessmentId: string;
  label: string;
  title: string;
  participantCount: number;
  classAvg: number | null;
  classMedian: number | null;
  classMax: number | null;
  studentScore: number | null;
}

export interface StudentAnalyticsData {
  cohortCount: number;
  hasEnoughCohortForStanding: boolean;
  percentileTop: number | null;
  studentOverallScore: number | null;
  classMean: number | null;
  classMedian: number | null;
  totalSubmissions: number;
  acceptedSubmissions: number;
  acceptanceRate: number | null;
  attemptedQuestions: number;
  solvedQuestions: number;
  partialQuestions: number;
  overallHistogram: HistogramBucket[];
  assessmentComparisons: AssessmentComparisonItem[];
}

export interface HeatmapCell {
  dateKey: string;
  jalaliDateLabel: string;
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
  isToday: boolean;
}

export interface HeatmapWeekColumn {
  monthLabel: string | null;
  cells: HeatmapCell[];
}

export interface StudentBadge {
  id: string;
  title: string;
  description: string;
  iconClass: string;
  accentColor: 'success' | 'primary' | 'warning' | 'info' | 'purple';
  earned: boolean;
  progressText: string;
}

export interface StudentActivityAndBadges {
  weeks: HeatmapWeekColumn[];
  totalSubmissions140d: number;
  activeDaysCount: number;
  currentStreakDays: number;
  longestStreakDays: number;
  badges: StudentBadge[];
}

export interface LeaderboardFilterAssessment {
  assessmentId: string;
  label: string;
  title: string;
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  displayName: string;
  isCurrentUser: boolean;
  totalPoints: number;
  maxPoints: number;
  scorePerc: number;
  solvedQuestions: number;
}

export interface StudentLeaderboardData {
  selectedAssessmentId: string | null;
  assessments: LeaderboardFilterAssessment[];
  topEntries: LeaderboardEntry[];
  currentUserEntry: LeaderboardEntry | null;
  nextRivalEntry: { rank: number; displayName: string; totalPoints: number } | null;
  totalParticipants: number;
}

export interface QuestionClassStat {
  assessmentQuestionId: string;
  attemptedCount: number;
  solvedCount: number;
  solveRatePerc: number;
  avgAttempts: number;
}

// ---------- Helpers ----------

const PersonalMetricsSchema = z.object({
  total_submissions: z.coerce.number(),
  accepted_submissions: z.coerce.number(),
  attempted_questions: z.coerce.number(),
  solved_questions: z.coerce.number(),
  partial_questions: z.coerce.number(),
});

const CohortAssessmentRowSchema = z.object({
  assessment_id: z.string(),
  label: z.string(),
  title: z.string(),
  participant_count: z.coerce.number(),
  avg_score: z.coerce.number().nullable(),
  median_score: z.coerce.number().nullable(),
  max_score: z.coerce.number().nullable(),
  student_score: z.coerce.number().nullable(),
  all_scores: z.array(z.coerce.number()).catch([]),
});

const OverallTotalRowSchema = z.object({
  user_id: z.string(),
  overall_perc: z.coerce.number(),
});

const DailyActivityRowSchema = z.object({
  day_key: z.string(),
  submission_count: z.coerce.number(),
});

const BadgeSignalsSchema = z.object({
  oneshot_count: z.coerce.number(),
  edge_hunter_count: z.coerce.number(),
  solved_count: z.coerce.number(),
  perfect_hw_count: z.coerce.number(),
  early_bird_count: z.coerce.number(),
});

const VisibleHomeworkSchema = z.object({
  assessment_id: z.string(),
  label: z.string(),
  title: z.string(),
});

const LeaderboardRowSchema = z.object({
  user_id: z.string(),
  full_name: z.string().nullable(),
  uid_handle: z.string(),
  total_points: z.coerce.number(),
  max_points: z.coerce.number(),
  score_perc: z.coerce.number(),
  solved_questions: z.coerce.number(),
});

const QuestionStatRowSchema = z.object({
  assessment_question_id: z.string(),
  attempted_count: z.coerce.number(),
  solved_count: z.coerce.number(),
  avg_attempts: z.coerce.number(),
});

function buildHistogram(scores: number[], studentScore: number | null): HistogramBucket[] {
  const ranges: [number, number, string][] = [
    [0, 20, '۰ تا ۲۰٪'],
    [20, 40, '۲۰ تا ۴۰٪'],
    [40, 60, '۴۰ تا ۶۰٪'],
    [60, 80, '۶۰ تا ۸۰٪'],
    [80, 100, '۸۰ تا ۱۰۰٪+'],
  ];

  const bucketIndex = (val: number): number => {
    const clamped = Math.max(0, Math.min(100, val));
    if (clamped >= 80) return 4;
    if (clamped >= 60) return 3;
    if (clamped >= 40) return 2;
    if (clamped >= 20) return 1;
    return 0;
  };

  const myBucket = studentScore !== null ? bucketIndex(studentScore) : -1;
  const counts = [0, 0, 0, 0, 0];
  for (const s of scores) {
    counts[bucketIndex(s)] += 1;
  }

  return ranges.map(([minInclusive, maxInclusive, label], idx) => ({
    label,
    minInclusive,
    maxInclusive,
    count: counts[idx],
    isCurrentUser: idx === myBucket,
  }));
}

function computeMedian(sortedAsc: number[]): number | null {
  if (sortedAsc.length === 0) return null;
  const mid = Math.floor(sortedAsc.length / 2);
  if (sortedAsc.length % 2 === 1) return sortedAsc[mid];
  return (sortedAsc[mid - 1] + sortedAsc[mid]) / 2;
}

// ---------- Service Functions ----------

export async function getStudentAnalyticsData({
  courseInstanceId,
  userId,
}: {
  courseInstanceId: string;
  userId: string;
}): Promise<StudentAnalyticsData> {
  const [personalRow, assessmentRows, overallRows] = await Promise.all([
    sqldb.queryRow(
      sql.select_student_personal_submission_metrics,
      { course_instance_id: courseInstanceId, user_id: userId },
      PersonalMetricsSchema,
    ),
    sqldb.queryRows(
      sql.select_student_cohort_assessment_scores,
      { course_instance_id: courseInstanceId, user_id: userId },
      CohortAssessmentRowSchema,
    ),
    sqldb.queryRows(
      sql.select_overall_homework_cohort_totals,
      { course_instance_id: courseInstanceId },
      OverallTotalRowSchema,
    ),
  ]);

  const cohortScores = overallRows.map((r) => r.overall_perc).sort((a, b) => a - b);
  const cohortCount = cohortScores.length;
  const hasEnoughCohortForStanding = cohortCount >= MIN_ANALYTICS_COHORT;

  const studentOverallFromCohort =
    overallRows.find((r) => r.user_id === userId)?.overall_perc ?? null;
  const attemptedAssessments = assessmentRows.filter((r) => r.student_score !== null);
  const fallbackStudentAvg =
    attemptedAssessments.length > 0
      ? attemptedAssessments.reduce((acc, r) => acc + (r.student_score ?? 0), 0) /
        attemptedAssessments.length
      : null;
  const studentOverallScore = studentOverallFromCohort ?? fallbackStudentAvg;

  let percentileTop: number | null = null;
  if (hasEnoughCohortForStanding && studentOverallFromCohort !== null) {
    const higherOrEqual = overallRows.filter(
      (r) => r.overall_perc > studentOverallFromCohort + 0.01,
    ).length;
    const rank = higherOrEqual + 1;
    percentileTop = Math.max(1, Math.min(100, Math.ceil((rank / cohortCount) * 100)));
  }

  const classMean =
    hasEnoughCohortForStanding && cohortCount > 0
      ? cohortScores.reduce((a, b) => a + b, 0) / cohortCount
      : null;
  const classMedian = hasEnoughCohortForStanding ? computeMedian(cohortScores) : null;

  const overallHistogram = hasEnoughCohortForStanding
    ? buildHistogram(cohortScores, studentOverallScore)
    : [];

  const acceptanceRate =
    personalRow.total_submissions > 0
      ? Math.round((personalRow.accepted_submissions / personalRow.total_submissions) * 100)
      : null;

  const assessmentComparisons: AssessmentComparisonItem[] = assessmentRows.map((row) => {
    const showClassStats = row.participant_count >= MIN_ANALYTICS_COHORT;
    return {
      assessmentId: row.assessment_id,
      label: row.label,
      title: row.title,
      participantCount: row.participant_count,
      classAvg:
        showClassStats && row.avg_score !== null ? Math.round(row.avg_score * 10) / 10 : null,
      classMedian:
        showClassStats && row.median_score !== null ? Math.round(row.median_score * 10) / 10 : null,
      classMax:
        showClassStats && row.max_score !== null ? Math.round(row.max_score * 10) / 10 : null,
      studentScore: row.student_score !== null ? Math.round(row.student_score * 10) / 10 : null,
    };
  });

  return {
    cohortCount,
    hasEnoughCohortForStanding,
    percentileTop,
    studentOverallScore:
      studentOverallScore !== null ? Math.round(studentOverallScore * 10) / 10 : null,
    classMean: classMean !== null ? Math.round(classMean * 10) / 10 : null,
    classMedian: classMedian !== null ? Math.round(classMedian * 10) / 10 : null,
    totalSubmissions: personalRow.total_submissions,
    acceptedSubmissions: personalRow.accepted_submissions,
    acceptanceRate,
    attemptedQuestions: personalRow.attempted_questions,
    solvedQuestions: personalRow.solved_questions,
    partialQuestions: personalRow.partial_questions,
    overallHistogram,
    assessmentComparisons,
  };
}

function getDateKeyFromGregorian(gy: number, gm: number, gd: number): string {
  return `${gy}-${String(gm).padStart(2, '0')}-${String(gd).padStart(2, '0')}`;
}

function addGregorianDays(dateKey: string, deltaDays: number): string {
  const [y, m, d] = dateKey.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + deltaDays));
  return dt.toISOString().slice(0, 10);
}

export async function getStudentActivityAndBadges({
  courseInstanceId,
  userId,
  timezone,
}: {
  courseInstanceId: string;
  userId: string;
  timezone: string;
}): Promise<StudentActivityAndBadges> {
  const tz = timezone || 'Asia/Tehran';
  const [activityRows, badgeSignals] = await Promise.all([
    sqldb.queryRows(
      sql.select_student_daily_activity,
      { course_instance_id: courseInstanceId, user_id: userId, timezone: tz },
      DailyActivityRowSchema,
    ),
    sqldb.queryRow(
      sql.select_student_badge_signals,
      { course_instance_id: courseInstanceId, user_id: userId },
      BadgeSignalsSchema,
    ),
  ]);

  const countsByDay = new Map<string, number>();
  let totalSubmissions140d = 0;
  for (const row of activityRows) {
    countsByDay.set(row.day_key, row.submission_count);
    totalSubmissions140d += row.submission_count;
  }

  // Anchor heatmap in local Jalali calendar so weeks run Saturday (0) -> Friday (6)
  const todayJalali = getTodayJalali(tz);
  const todayGreg = jalaliToGregorian(todayJalali.jy, todayJalali.jm, todayJalali.jd);
  const todayKey = getDateKeyFromGregorian(todayGreg.gy, todayGreg.gm, todayGreg.gd);

  // Determine today's Persian day of week (0 = Saturday .. 6 = Friday)
  const jsDow = new Date(Date.UTC(todayGreg.gy, todayGreg.gm - 1, todayGreg.gd)).getUTCDay();
  const todayPersianDow = (jsDow + 1) % 7;

  // Build 20 week columns ending on the current week (Saturday .. today's week Friday)
  const numWeeks = 20;
  const currentWeekSaturdayKey = addGregorianDays(todayKey, -todayPersianDow);
  const firstDayKey = addGregorianDays(currentWeekSaturdayKey, -(numWeeks - 1) * 7);

  const weeks: HeatmapWeekColumn[] = [];
  let prevMonth = -1;
  let lastMonthLabelWeek = -10;
  let activeDaysCount = 0;
  let longestStreakDays = 0;
  let runningStreak = 0;

  for (let w = 0; w < numWeeks; w++) {
    const cells: HeatmapCell[] = [];
    let weekMonthLabel: string | null = null;

    for (let d = 0; d < 7; d++) {
      const offset = w * 7 + d;
      const key = addGregorianDays(firstDayKey, offset);
      const [gy, gm, gd] = key.split('-').map(Number);
      const j = gregorianToJalali(gy, gm, gd);
      const isFuture = key > todayKey;
      const count = isFuture ? 0 : (countsByDay.get(key) ?? 0);

      if (!isFuture && count > 0) {
        activeDaysCount += 1;
        runningStreak += 1;
        if (runningStreak > longestStreakDays) longestStreakDays = runningStreak;
      } else if (!isFuture) {
        runningStreak = 0;
      }

      const monthTransition =
        (d === 0 && j.jm !== prevMonth) ||
        (d > 0 && j.jd === 1 && j.jm !== prevMonth && weekMonthLabel === null);
      if (monthTransition) {
        prevMonth = j.jm;
        if (w - lastMonthLabelWeek >= 3) {
          weekMonthLabel = JALALI_MONTH_NAMES[j.jm - 1];
          lastMonthLabelWeek = w;
        }
      }

      let level: 0 | 1 | 2 | 3 | 4 = 0;
      if (count >= 10) level = 4;
      else if (count >= 5) level = 3;
      else if (count >= 2) level = 2;
      else if (count >= 1) level = 1;

      const monthName = JALALI_MONTH_NAMES[j.jm - 1];
      const jalaliDateLabel = `${toPersianDigits(j.jd)} ${monthName} ${toPersianDigits(j.jy)}`;

      cells.push({
        dateKey: key,
        jalaliDateLabel,
        count,
        level,
        isToday: key === todayKey,
      });
    }
    weeks.push({ monthLabel: weekMonthLabel, cells });
  }

  // Compute active streak up to today (or yesterday if nothing submitted yet today)
  let currentStreakDays = 0;
  let cursor = (countsByDay.get(todayKey) ?? 0) > 0 ? todayKey : addGregorianDays(todayKey, -1);
  for (let i = 0; i < 145; i++) {
    if ((countsByDay.get(cursor) ?? 0) > 0) {
      currentStreakDays += 1;
      cursor = addGregorianDays(cursor, -1);
    } else {
      break;
    }
  }
  if (currentStreakDays > longestStreakDays) longestStreakDays = currentStreakDays;

  const badges: StudentBadge[] = [
    {
      id: 'one-shot',
      title: 'One-Shot',
      description: 'کسب نمره کامل در همان اولین ارسال یک سوال بدون خطا',
      iconClass: 'fas fa-bolt',
      accentColor: 'warning',
      earned: badgeSignals.oneshot_count > 0,
      progressText:
        badgeSignals.oneshot_count > 0
          ? `${toPersianDigits(badgeSignals.oneshot_count)} سوال One-Shot`
          : 'اولین سوال را در تلاش اول حل کنید',
    },
    {
      id: 'early-bird',
      title: 'Early Bird',
      description: 'تکمیل ۹۰٪+ یک سری تمرین حداقل ۴۸ ساعت پیش از ددلاین',
      iconClass: 'fas fa-sun',
      accentColor: 'info',
      earned: badgeSignals.early_bird_count > 0,
      progressText:
        badgeSignals.early_bird_count > 0
          ? `${toPersianDigits(badgeSignals.early_bird_count)} تمرین زودهنگام`
          : 'تمرین را پیش از ۴۸ ساعت مانده به مهلت ببندید',
    },
    {
      id: 'edge-hunter',
      title: 'Edge Case Hunter',
      description: 'پاس کردن کامل یک سوال چالشی پس از ۴ ارسال یا بیشتر بدون تسلیم شدن',
      iconClass: 'fas fa-crosshairs',
      accentColor: 'purple',
      earned: badgeSignals.edge_hunter_count > 0,
      progressText:
        badgeSignals.edge_hunter_count > 0
          ? `${toPersianDigits(badgeSignals.edge_hunter_count)} شکار موفق`
          : 'پشتکار روی تست‌های مرزی',
    },
    {
      id: 'streak',
      title: longestStreakDays >= 7 ? '7-Day Streak' : 'Streak',
      description: 'تمرین و ارسال کد در حداقل ۳ روز پیاپی (طلایی در ۷ روز متوالی)',
      iconClass: 'fas fa-fire',
      accentColor: 'success',
      earned: longestStreakDays >= 3,
      progressText: `بیشترین Streak: ${toPersianDigits(longestStreakDays)} روز`,
    },
    {
      id: 'perfectionist',
      title: 'Perfectionist',
      description: 'کسب نمره کامل ۱۰۰٪ در حداقل یک سری تمرین هفتگی',
      iconClass: 'fas fa-crown',
      accentColor: 'primary',
      earned: badgeSignals.perfect_hw_count > 0,
      progressText:
        badgeSignals.perfect_hw_count > 0
          ? `${toPersianDigits(badgeSignals.perfect_hw_count)} سری تمرین کامل`
          : 'همه سوالات یک سری تمرین را کامل حل کنید',
    },
  ];

  return {
    weeks,
    totalSubmissions140d,
    activeDaysCount,
    currentStreakDays,
    longestStreakDays,
    badges,
  };
}

export async function getStudentLeaderboardData({
  courseInstanceId,
  userId,
  assessmentId,
}: {
  courseInstanceId: string;
  userId: string;
  assessmentId?: string | null;
}): Promise<StudentLeaderboardData> {
  const [assessments, rawRows] = await Promise.all([
    sqldb.queryRows(
      sql.select_visible_homework_list,
      { course_instance_id: courseInstanceId },
      VisibleHomeworkSchema,
    ),
    sqldb.queryRows(
      sql.select_leaderboard_entries,
      {
        course_instance_id: courseInstanceId,
        assessment_id: assessmentId || null,
      },
      LeaderboardRowSchema,
    ),
  ]);

  const allEntries: LeaderboardEntry[] = rawRows.map((row, idx) => ({
    rank: idx + 1,
    userId: row.user_id,
    displayName: row.full_name?.trim() || row.uid_handle,
    isCurrentUser: row.user_id === userId,
    totalPoints: Math.round(row.total_points * 10) / 10,
    maxPoints: Math.round(row.max_points * 10) / 10,
    scorePerc: Math.round(row.score_perc * 10) / 10,
    solvedQuestions: row.solved_questions,
  }));

  const topEntries = allEntries.slice(0, 20);
  const currentUserIdx = allEntries.findIndex((e) => e.isCurrentUser);
  const currentUserEntry = currentUserIdx >= 0 ? allEntries[currentUserIdx] : null;
  const prevEntry = currentUserIdx > 0 ? allEntries[currentUserIdx - 1] : null;
  const nextRivalEntry = prevEntry
    ? {
        rank: prevEntry.rank,
        displayName: prevEntry.displayName,
        totalPoints: prevEntry.totalPoints,
      }
    : null;

  return {
    selectedAssessmentId: assessmentId || null,
    assessments: assessments.map((a) => ({
      assessmentId: a.assessment_id,
      label: a.label,
      title: a.title,
    })),
    topEntries,
    currentUserEntry,
    nextRivalEntry,
    totalParticipants: allEntries.length,
  };
}

export async function getAssessmentQuestionStats({
  assessmentId,
  courseInstanceId,
}: {
  assessmentId: string;
  courseInstanceId: string;
}): Promise<Map<string, QuestionClassStat>> {
  const rows = await sqldb.queryRows(
    sql.select_assessment_question_stats,
    { assessment_id: assessmentId, course_instance_id: courseInstanceId },
    QuestionStatRowSchema,
  );

  const map = new Map<string, QuestionClassStat>();
  for (const row of rows) {
    if (row.attempted_count <= 0) continue;
    const solveRatePerc = Math.min(
      100,
      Math.max(0, Math.round((row.solved_count / row.attempted_count) * 100)),
    );
    map.set(row.assessment_question_id, {
      assessmentQuestionId: row.assessment_question_id,
      attemptedCount: row.attempted_count,
      solvedCount: row.solved_count,
      solveRatePerc,
      avgAttempts: Math.round(row.avg_attempts * 10) / 10,
    });
  }
  return map;
}
