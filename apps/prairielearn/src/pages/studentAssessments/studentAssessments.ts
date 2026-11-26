import { Router } from 'express';
import { z } from 'zod';

import { HttpStatusError } from '@prairielearn/error';
import { loadSqlEquiv, queryRows } from '@prairielearn/postgres';

import { type AssessmentAuthzResult } from '../../lib/assessment-access-control/authz-result.js';
import {
  resolveModernAssessmentAccessResultsBatch,
  resolverResultToAssessmentAuthzResultForInstance,
} from '../../lib/assessment-access-control/authz.js';
import { formatLegacyAssessmentAccess } from '../../lib/assessment-access-control/legacy.js';
import { SprocAuthzAssessmentSchema } from '../../lib/db-types.js';
import { features } from '../../lib/features/index.js';
import { typedAsyncHandler } from '../../lib/res-locals.js';
import { getDailyPulseState, submitDailyPulseAttempt } from '../../lib/student-daily-pulse.js';
import {
  getStudentGamificationProfile,
  getStudentWeeklyQuests,
} from '../../lib/student-gamification.js';
import {
  getClassCoopGoal,
  getPersonalWeeklyGoal,
  savePersonalWeeklyGoal,
} from '../../lib/student-phase3.js';
import logPageView from '../../middlewares/logPageView.js';

import {
  StudentAssessments,
  type StudentAssessmentsRow,
  StudentAssessmentsRowBaseSchema,
} from './studentAssessments.html.js';

const sql = loadSqlEquiv(import.meta.url);
const router = Router();

const StudentAssessmentsQueryRowSchema = StudentAssessmentsRowBaseSchema.extend({
  raw_authz_result: SprocAuthzAssessmentSchema,
});

const DailyPulseBodySchema = z.object({
  puzzle_id: z.string().min(1),
  selected_option: z.coerce.number().int().min(0).max(3),
});

const WeeklyGoalBodySchema = z.object({
  tier: z.enum(['light', 'balanced', 'pro']),
});

router.post(
  '/',
  typedAsyncHandler<'course-instance'>(async (req, res) => {
    if (res.locals.authz_data.mode === 'Exam' || res.locals.lockdown_browser) {
      throw new HttpStatusError(403, 'این عملیات در حالت آزمون در دسترس نیست.');
    }

    const action = req.body.__action;
    if (action === 'submit_daily_pulse') {
      const enabled = await features.enabledFromLocals('student-daily-pulse', res.locals);
      if (!enabled) {
        throw new HttpStatusError(403, 'پالس روزانه برای این دوره غیرفعال است.');
      }
      const parsed = DailyPulseBodySchema.parse(req.body);
      await submitDailyPulseAttempt({
        courseInstanceId: res.locals.course_instance.id,
        userId: res.locals.user.id,
        timezone: res.locals.course_instance.display_timezone,
        puzzleId: parsed.puzzle_id,
        selectedOption: parsed.selected_option,
      });
      res.redirect(`${req.originalUrl.split('#')[0]}#sh-daily-pulse`);
      return;
    }

    if (action === 'set_weekly_goal') {
      const enabled = await features.enabledFromLocals('student-weekly-goal-simulator', res.locals);
      if (!enabled) {
        throw new HttpStatusError(403, 'تنظیم هدف هفتگی برای این دوره غیرفعال است.');
      }
      const parsed = WeeklyGoalBodySchema.parse(req.body);
      await savePersonalWeeklyGoal({
        courseInstanceId: res.locals.course_instance.id,
        userId: res.locals.user.id,
        timezone: res.locals.course_instance.display_timezone,
        tier: parsed.tier,
      });
      res.redirect(`${req.originalUrl.split('#')[0]}#sh-weekly-goal`);
      return;
    }

    throw new HttpStatusError(400, `unknown __action: ${String(action)}`);
  }),
);

router.get(
  '/',
  logPageView('studentAssessments'),
  typedAsyncHandler<'course-instance'>(async (req, res) => {
    const rawRows = await queryRows(
      sql.select_assessments,
      {
        course_instance_id: res.locals.course_instance.id,
        authz_data: res.locals.authz_data,
        user_id: res.locals.user.id,
        req_date: res.locals.req_date,
        assessments_group_by: res.locals.course_instance.assessments_group_by,
      },
      StudentAssessmentsQueryRowSchema,
    );

    const hasModern = rawRows.some((row) => row.modern_access_control);
    const modernAccessByAssessment = hasModern
      ? await resolveModernAssessmentAccessResultsBatch({
          courseInstance: res.locals.course_instance,
          userId: res.locals.user.id,
          authzData: res.locals.authz_data,
          reqDate: res.locals.req_date,
        })
      : null;

    const resolvedRows = rawRows
      .map((rawRow): StudentAssessmentsRow | null => {
        const { raw_authz_result: rawAuthzResult, ...rowData } = rawRow;
        let authzResult: AssessmentAuthzResult;
        if (rawRow.modern_access_control) {
          const assessmentAccess = modernAccessByAssessment?.get(rawRow.assessment_id);
          if (!assessmentAccess) return null;
          authzResult = resolverResultToAssessmentAuthzResultForInstance({
            result: assessmentAccess,
            authzMode: res.locals.authz_data.mode,
            displayTimezone: res.locals.course_instance.display_timezone,
            assessmentInstance:
              rawRow.assessment_instance_id == null
                ? null
                : {
                    open: rawRow.assessment_instance_open,
                    date_limit: rawRow.assessment_instance_date_limit,
                  },
            reqDate: res.locals.req_date,
          });
        } else {
          authzResult = formatLegacyAssessmentAccess(
            rawAuthzResult,
            res.locals.course_instance.display_timezone,
          );
        }

        return { ...rowData, authz_result: authzResult };
      })
      .filter((row): row is NonNullable<typeof row> => {
        if (row == null) return false;
        if (row.authz_result.show_before_release) return true;
        return row.authz_result.authorized;
      });

    const allowMotivation = res.locals.authz_data.mode !== 'Exam' && !res.locals.lockdown_browser;
    const [
      deadlineRadarEnabled,
      weeklyQuestsEnabled,
      coopGoalEnabled,
      dailyPulseEnabled,
      weeklyGoalEnabled,
      achievementsEnabled,
    ] = await Promise.all([
      features.enabledFromLocals('student-deadline-radar', res.locals),
      allowMotivation
        ? features.enabledFromLocals('student-weekly-quests', res.locals)
        : Promise.resolve(false),
      allowMotivation
        ? features.enabledFromLocals('student-coop-goal', res.locals)
        : Promise.resolve(false),
      allowMotivation
        ? features.enabledFromLocals('student-daily-pulse', res.locals)
        : Promise.resolve(false),
      allowMotivation
        ? features.enabledFromLocals('student-weekly-goal-simulator', res.locals)
        : Promise.resolve(false),
      allowMotivation
        ? features.enabledFromLocals('student-achievements', res.locals)
        : Promise.resolve(false),
    ]);

    const [weeklyQuests, coopGoal, dailyPulse, personalGoal, gamificationProfile] =
      await Promise.all([
        weeklyQuestsEnabled
          ? getStudentWeeklyQuests({
              courseInstanceId: res.locals.course_instance.id,
              userId: res.locals.user.id,
              timezone: res.locals.course_instance.display_timezone,
            }).catch(() => null)
          : Promise.resolve(null),
        coopGoalEnabled
          ? getClassCoopGoal({
              courseInstanceId: res.locals.course_instance.id,
              userId: res.locals.user.id,
            }).catch(() => null)
          : Promise.resolve(null),
        dailyPulseEnabled
          ? getDailyPulseState({
              courseInstanceId: res.locals.course_instance.id,
              userId: res.locals.user.id,
              timezone: res.locals.course_instance.display_timezone,
            }).catch(() => null)
          : Promise.resolve(null),
        weeklyGoalEnabled
          ? getPersonalWeeklyGoal({
              courseInstanceId: res.locals.course_instance.id,
              userId: res.locals.user.id,
              timezone: res.locals.course_instance.display_timezone,
            }).catch(() => null)
          : Promise.resolve(null),
        achievementsEnabled
          ? getStudentGamificationProfile({
              courseInstanceId: res.locals.course_instance.id,
              userId: res.locals.user.id,
              timezone: res.locals.course_instance.display_timezone,
            }).catch(() => null)
          : Promise.resolve(null),
      ]);

    res.send(
      StudentAssessments({
        resLocals: res.locals,
        rows: resolvedRows,
        showDeadlineRadar: deadlineRadarEnabled,
        weeklyQuests,
        coopGoal,
        dailyPulse,
        personalGoal,
        nextUnlock: gamificationProfile?.nextUnlock ?? null,
      }),
    );
  }),
);

export default router;
