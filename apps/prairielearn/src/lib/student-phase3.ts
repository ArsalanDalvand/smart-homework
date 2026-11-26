import { z } from 'zod';

import * as sqldb from '@prairielearn/postgres';

import {
  WEEKLY_GOAL_TIERS,
  type WeeklyGoalTier,
  computeCoopTargetSolves,
  getCurrentJalaliWeekBounds,
  invalidateStudentGamificationCache,
} from './student-gamification.js';

const sql = sqldb.loadSqlEquiv(import.meta.url);

export type KudosType = 'clean_code' | 'creative_solution';

export interface ClassCoopGoal {
  assessmentId: string;
  label: string;
  title: string;
  currentSolves: number;
  targetSolves: number;
  progressPerc: number;
  participantCount: number;
  userContributedSolves: number;
  isReached: boolean;
  rewardXp: number;
  dueDateIso: string | null;
}

export interface SubmissionKudosItem {
  kudosId: string;
  submissionId: string;
  kudosType: KudosType;
  note: string | null;
  studentSpotlightOptIn: boolean;
  awarderDisplayName: string;
}

export interface CommunitySpotlightSolution {
  kudosId: string;
  studentDisplayName: string;
  kudosType: KudosType;
  note: string | null;
  fileName: string;
  code: string;
}

export interface SubmissionSpeedComparison {
  myRuntimeMs: number;
  beatsPerc: number;
  cohortCount: number;
  isApproximateWallTime: boolean;
}

export interface PersonalWeeklyGoalState {
  weekStartKey: string;
  weekLabel: string;
  tier: WeeklyGoalTier | null;
  targetQuestions: number;
  solvedThisWeek: number;
  progressPerc: number;
  xpReward: number;
  completed: boolean;
  hasExplicitGoal: boolean;
}

const CoopGoalRowSchema = z.object({
  assessment_id: z.string(),
  label: z.string(),
  title: z.string(),
  due_date: z.date().nullable(),
  total_questions: z.coerce.number().int(),
  enrolled_count: z.coerce.number().int(),
  current_solves: z.coerce.number().int(),
  participant_count: z.coerce.number().int(),
  user_contributed_solves: z.coerce.number().int(),
});

const SubmissionTargetRowSchema = z.object({
  submission_id: z.string(),
  assessment_question_id: z.string(),
  student_user_id: z.string(),
});

const KudosRowSchema = z.object({
  kudos_id: z.string(),
  submission_id: z.string(),
  kudos_type: z.enum(['clean_code', 'creative_solution']),
  note: z.string().nullable(),
  student_spotlight_opt_in: z.boolean(),
  created_at: z.date(),
  awarder_display_name: z.string(),
});

const SubmittedFileSchema = z.object({
  name: z.string().optional(),
  contents: z.string().optional(),
});

const SpotlightRowSchema = z.object({
  kudos_id: z.string(),
  kudos_type: z.enum(['clean_code', 'creative_solution']),
  note: z.string().nullable(),
  student_display_name: z.string(),
  submitted_files: z.unknown().nullable(),
});

const SpeedRowSchema = z.object({
  user_id: z.string(),
  is_real_student: z.boolean(),
  fastest_ms: z.coerce.number(),
  has_exact: z.boolean(),
});

const WeeklyGoalRowSchema = z.object({
  tier: z.enum(['light', 'balanced', 'pro']).nullable(),
  target_questions: z.coerce.number().int().nullable(),
  solved_this_week: z.coerce.number().int(),
});

export async function getClassCoopGoal({
  courseInstanceId,
  userId,
}: {
  courseInstanceId: string;
  userId: string;
}): Promise<ClassCoopGoal | null> {
  const row = await sqldb.queryOptionalRow(
    sql.select_class_coop_goal,
    { course_instance_id: courseInstanceId, user_id: userId },
    CoopGoalRowSchema,
  );
  if (!row) return null;

  const targetSolves = computeCoopTargetSolves(row.total_questions, row.enrolled_count);
  const progressPerc =
    targetSolves > 0 ? Math.min(100, Math.round((row.current_solves / targetSolves) * 100)) : 0;

  return {
    assessmentId: row.assessment_id,
    label: row.label,
    title: row.title,
    currentSolves: row.current_solves,
    targetSolves,
    progressPerc,
    participantCount: row.participant_count,
    userContributedSolves: row.user_contributed_solves,
    isReached: row.current_solves >= targetSolves,
    rewardXp: 75,
    dueDateIso: row.due_date ? row.due_date.toISOString() : null,
  };
}

export async function getInstanceQuestionKudos({
  courseInstanceId,
  instanceQuestionId,
}: {
  courseInstanceId: string;
  instanceQuestionId: string;
}): Promise<SubmissionKudosItem[]> {
  const rows = await sqldb.queryRows(
    sql.select_instance_question_kudos,
    {
      course_instance_id: courseInstanceId,
      instance_question_id: instanceQuestionId,
    },
    KudosRowSchema,
  );

  return rows.map((r) => ({
    kudosId: r.kudos_id,
    submissionId: r.submission_id,
    kudosType: r.kudos_type,
    note: r.note,
    studentSpotlightOptIn: r.student_spotlight_opt_in,
    awarderDisplayName: r.awarder_display_name,
  }));
}

export async function awardTaKudos({
  courseInstanceId,
  instanceQuestionId,
  submissionId,
  awardedByUserId,
  kudosType,
  note,
}: {
  courseInstanceId: string;
  instanceQuestionId: string;
  submissionId: string;
  awardedByUserId: string;
  kudosType: KudosType;
  note?: string | null;
}): Promise<boolean> {
  const target = await sqldb.queryOptionalRow(
    sql.select_instance_question_submission_target,
    {
      course_instance_id: courseInstanceId,
      instance_question_id: instanceQuestionId,
      submission_id: submissionId,
    },
    SubmissionTargetRowSchema,
  );
  if (!target) return false;

  const trimmedNote = note?.trim() ? note.trim().slice(0, 180) : null;

  await sqldb.execute(sql.upsert_submission_kudos, {
    course_instance_id: courseInstanceId,
    submission_id: target.submission_id,
    assessment_question_id: target.assessment_question_id,
    student_user_id: target.student_user_id,
    awarded_by_user_id: awardedByUserId,
    kudos_type: kudosType,
    note: trimmedNote,
  });

  await invalidateStudentGamificationCache(courseInstanceId, target.student_user_id);
  return true;
}

export async function revokeTaKudos({
  courseInstanceId,
  instanceQuestionId,
  kudosId,
  studentUserId,
}: {
  courseInstanceId: string;
  instanceQuestionId: string;
  kudosId: string;
  studentUserId: string;
}): Promise<void> {
  await sqldb.execute(sql.delete_submission_kudos, {
    course_instance_id: courseInstanceId,
    instance_question_id: instanceQuestionId,
    kudos_id: kudosId,
  });
  await invalidateStudentGamificationCache(courseInstanceId, studentUserId);
}

export async function setSpotlightOptIn({
  courseInstanceId,
  studentUserId,
  kudosId,
  optIn,
}: {
  courseInstanceId: string;
  studentUserId: string;
  kudosId: string;
  optIn: boolean;
}): Promise<void> {
  await sqldb.execute(sql.update_kudos_spotlight_opt_in, {
    course_instance_id: courseInstanceId,
    student_user_id: studentUserId,
    kudos_id: kudosId,
    opt_in: optIn,
  });
}

function extractSpotlightCode(
  submittedFilesRaw: unknown,
): { fileName: string; code: string } | null {
  const parsed = z.array(SubmittedFileSchema).safeParse(submittedFilesRaw);
  if (!parsed.success || parsed.data.length === 0) return null;

  const preferred =
    parsed.data.find((f) => f.name?.endsWith('.py') && f.contents) ??
    parsed.data.find((f) => Boolean(f.contents));
  if (!preferred?.contents) return null;

  try {
    const decoded = Buffer.from(preferred.contents, 'base64').toString('utf-8').trim();
    if (!decoded) return null;
    const capped = decoded.length > 6000 ? `${decoded.slice(0, 6000)}\n# ...` : decoded;
    return {
      fileName: preferred.name?.trim() || 'solution.py',
      code: capped,
    };
  } catch {
    return null;
  }
}

export async function getCommunitySpotlightSolutions({
  courseInstanceId,
  assessmentQuestionId,
  limit = 3,
}: {
  courseInstanceId: string;
  assessmentQuestionId: string;
  limit?: number;
}): Promise<CommunitySpotlightSolution[]> {
  const rows = await sqldb.queryRows(
    sql.select_community_spotlight_solutions,
    {
      course_instance_id: courseInstanceId,
      assessment_question_id: assessmentQuestionId,
      limit,
    },
    SpotlightRowSchema,
  );

  const items: CommunitySpotlightSolution[] = [];
  for (const row of rows) {
    const codeInfo = extractSpotlightCode(row.submitted_files);
    if (!codeInfo) continue;
    items.push({
      kudosId: row.kudos_id,
      studentDisplayName: row.student_display_name,
      kudosType: row.kudos_type,
      note: row.note,
      fileName: codeInfo.fileName,
      code: codeInfo.code,
    });
  }
  return items;
}

export async function getSubmissionSpeedComparison({
  courseInstanceId,
  assessmentQuestionId,
  userId,
}: {
  courseInstanceId: string;
  assessmentQuestionId: string;
  userId: string;
}): Promise<SubmissionSpeedComparison | null> {
  const rows = await sqldb.queryRows(
    sql.select_submission_speed_comparison,
    {
      course_instance_id: courseInstanceId,
      assessment_question_id: assessmentQuestionId,
    },
    SpeedRowSchema,
  );

  const realCohort = rows.filter((r) => r.is_real_student);
  if (realCohort.length < 5) return null;

  const viewerRow = rows.find((r) => r.user_id === userId);
  if (!viewerRow) return null;

  const peers = realCohort.filter((r) => r.user_id !== userId);
  if (peers.length === 0) return null;

  const slowerCount = peers.filter((p) => p.fastest_ms > viewerRow.fastest_ms).length;
  const beatsPerc = Math.max(0, Math.min(99, Math.round((slowerCount / peers.length) * 100)));
  const isApproximateWallTime = !viewerRow.has_exact || realCohort.some((r) => !r.has_exact);

  return {
    myRuntimeMs: Math.round(viewerRow.fastest_ms),
    beatsPerc,
    cohortCount: realCohort.length,
    isApproximateWallTime,
  };
}

export async function getPersonalWeeklyGoal({
  courseInstanceId,
  userId,
  timezone,
}: {
  courseInstanceId: string;
  userId: string;
  timezone: string;
}): Promise<PersonalWeeklyGoalState> {
  const tz = timezone || 'Asia/Tehran';
  const bounds = getCurrentJalaliWeekBounds(tz);

  const row = await sqldb.queryRow(
    sql.select_personal_weekly_goal,
    {
      course_instance_id: courseInstanceId,
      user_id: userId,
      timezone: tz,
      week_start_key: bounds.weekStartKey,
      week_end_key: bounds.weekEndKey,
    },
    WeeklyGoalRowSchema,
  );

  const tier = row.tier;
  const targetQuestions = row.target_questions ?? (tier ? WEEKLY_GOAL_TIERS[tier].target : 4);
  const xpReward = tier ? WEEKLY_GOAL_TIERS[tier].xp : WEEKLY_GOAL_TIERS.balanced.xp;
  const progressPerc =
    targetQuestions > 0
      ? Math.min(100, Math.round((row.solved_this_week / targetQuestions) * 100))
      : 0;

  return {
    weekStartKey: bounds.weekStartKey,
    weekLabel: bounds.weekLabel,
    tier,
    targetQuestions,
    solvedThisWeek: row.solved_this_week,
    progressPerc,
    xpReward,
    completed: tier !== null && row.solved_this_week >= targetQuestions,
    hasExplicitGoal: tier !== null,
  };
}

export async function savePersonalWeeklyGoal({
  courseInstanceId,
  userId,
  timezone,
  tier,
}: {
  courseInstanceId: string;
  userId: string;
  timezone: string;
  tier: WeeklyGoalTier;
}): Promise<void> {
  const tz = timezone || 'Asia/Tehran';
  const bounds = getCurrentJalaliWeekBounds(tz);
  const targetQuestions = WEEKLY_GOAL_TIERS[tier].target;

  await sqldb.execute(sql.upsert_personal_weekly_goal, {
    course_instance_id: courseInstanceId,
    user_id: userId,
    week_start_key: bounds.weekStartKey,
    tier,
    target_questions: targetQuestions,
  });

  await invalidateStudentGamificationCache(courseInstanceId, userId);
}
