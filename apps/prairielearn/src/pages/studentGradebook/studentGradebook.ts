import { pipeline } from 'node:stream/promises';

import { Router } from 'express';
import { z } from 'zod';

import { stringifyNonblocking } from '@prairielearn/csv';
import { HttpStatusError } from '@prairielearn/error';

import { features } from '../../lib/features/index.js';
import { getGradebookRows } from '../../lib/gradebook.js';
import {
  type StudentGradebookRow,
  computeLabel,
  computeTitle,
} from '../../lib/gradebook.shared.js';
import { type ResLocalsForPage, typedAsyncHandler } from '../../lib/res-locals.js';
import { courseInstanceFilenamePrefix } from '../../lib/sanitize-name.js';
import {
  getStudentActivityAndBadges,
  getStudentAnalyticsData,
} from '../../lib/student-engagement.js';
import { getStudentGamificationProfile } from '../../lib/student-gamification.js';
import { getPersonalWeeklyGoal, savePersonalWeeklyGoal } from '../../lib/student-phase3.js';
import logPageView from '../../middlewares/logPageView.js';

import { StudentGradebook, type StudentGradebookTableRow } from './studentGradebook.html.js';

const router = Router();

function buildCsvFilename(locals: ResLocalsForPage<'course-instance'>) {
  return courseInstanceFilenamePrefix(locals.course_instance, locals.course) + 'gradebook.csv';
}

function mapRow(
  raw: StudentGradebookRow,
  prev: StudentGradebookRow | null,
): StudentGradebookTableRow {
  const start_new_set = raw.assessment_set.id !== prev?.assessment_set.id;
  return {
    assessment_id: raw.assessment.id,
    assessment_instance_id: raw.assessment_instance.id,
    assessment_group_work: raw.assessment.team_work,
    title: computeTitle(raw),
    assessment_set_heading: raw.assessment_set.heading,
    assessment_set_color: raw.assessment_set.color,
    label: computeLabel(raw),
    assessment_instance_score_perc: raw.assessment_instance.score_perc,
    show_closed_assessment_score: raw.show_closed_assessment_score,
    start_new_set,
  };
}

const WeeklyGoalBodySchema = z.object({
  tier: z.enum(['light', 'balanced', 'pro']),
});

router.post(
  '/',
  typedAsyncHandler<'course-instance'>(async (req, res) => {
    if (res.locals.authz_data.mode === 'Exam' || res.locals.lockdown_browser) {
      throw new HttpStatusError(403, 'این عملیات در حالت آزمون در دسترس نیست.');
    }
    if (req.body.__action !== 'set_weekly_goal') {
      throw new HttpStatusError(400, `unknown __action: ${String(req.body.__action)}`);
    }
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
    res.redirect(`${req.originalUrl.split('#')[0]}#tab-activity`);
  }),
);

router.get(
  '/',
  logPageView('studentGradebook'),
  typedAsyncHandler<'course-instance'>(async (req, res) => {
    const allowMotivation = res.locals.authz_data.mode !== 'Exam' && !res.locals.lockdown_browser;
    const [
      rawRows,
      analyticsEnabled,
      heatmapEnabled,
      xpLevelsEnabled,
      achievementsEnabled,
      weeklyQuestsEnabled,
      skillTreeEnabled,
      weeklyGoalSimulatorEnabled,
      termWrapUpEnabled,
    ] = await Promise.all([
      getGradebookRows({
        courseInstance: res.locals.course_instance,
        userId: res.locals.user.id,
        authzData: res.locals.authz_data,
        reqDate: res.locals.req_date,
        auth: 'student',
      }),
      allowMotivation
        ? features.enabledFromLocals('student-analytics', res.locals)
        : Promise.resolve(false),
      allowMotivation
        ? features.enabledFromLocals('student-activity-heatmap', res.locals)
        : Promise.resolve(false),
      allowMotivation
        ? features.enabledFromLocals('student-xp-levels', res.locals)
        : Promise.resolve(false),
      allowMotivation
        ? features.enabledFromLocals('student-achievements', res.locals)
        : Promise.resolve(false),
      allowMotivation
        ? features.enabledFromLocals('student-weekly-quests', res.locals)
        : Promise.resolve(false),
      allowMotivation
        ? features.enabledFromLocals('student-skill-tree', res.locals)
        : Promise.resolve(false),
      allowMotivation
        ? features.enabledFromLocals('student-weekly-goal-simulator', res.locals)
        : Promise.resolve(false),
      allowMotivation
        ? features.enabledFromLocals('student-term-wrap-up', res.locals)
        : Promise.resolve(false),
    ]);

    const needGamificationProfile =
      xpLevelsEnabled || achievementsEnabled || weeklyQuestsEnabled || termWrapUpEnabled;

    const [analyticsData, activityData, gamificationProfile, personalGoal] = await Promise.all([
      analyticsEnabled
        ? getStudentAnalyticsData({
            courseInstanceId: res.locals.course_instance.id,
            userId: res.locals.user.id,
          })
        : Promise.resolve(null),
      heatmapEnabled
        ? getStudentActivityAndBadges({
            courseInstanceId: res.locals.course_instance.id,
            userId: res.locals.user.id,
            timezone: res.locals.course_instance.display_timezone,
          })
        : Promise.resolve(null),
      needGamificationProfile
        ? getStudentGamificationProfile({
            courseInstanceId: res.locals.course_instance.id,
            userId: res.locals.user.id,
            timezone: res.locals.course_instance.display_timezone,
          }).catch(() => null)
        : Promise.resolve(null),
      weeklyGoalSimulatorEnabled
        ? getPersonalWeeklyGoal({
            courseInstanceId: res.locals.course_instance.id,
            userId: res.locals.user.id,
            timezone: res.locals.course_instance.display_timezone,
          }).catch(() => null)
        : Promise.resolve(null),
    ]);

    const rows = rawRows.map((row, index) => mapRow(row, rawRows[index - 1]));
    res.send(
      StudentGradebook({
        resLocals: res.locals,
        rows,
        csvFilename: buildCsvFilename(res.locals),
        analyticsData,
        activityData,
        gamificationProfile,
        personalGoal,
        showXpLevels: xpLevelsEnabled,
        showAchievements: achievementsEnabled,
        showWeeklyQuests: weeklyQuestsEnabled,
        showSkillTreeLink: skillTreeEnabled,
        showWhatIfSimulator: weeklyGoalSimulatorEnabled,
        showTermWrapUp: termWrapUpEnabled && gamificationProfile !== null,
      }),
    );
  }),
);

router.get(
  '/:filename',
  typedAsyncHandler<'course-instance'>(async (req, res) => {
    if (req.params.filename !== buildCsvFilename(res.locals)) {
      throw new HttpStatusError(404, `Unknown filename: ${req.params.filename}`);
    }

    const rows = await getGradebookRows({
      courseInstance: res.locals.course_instance,
      userId: res.locals.user.id,
      authzData: res.locals.authz_data,
      reqDate: res.locals.req_date,
      auth: 'student',
    });

    const csvData = rows.map((row) => [
      computeTitle(row),
      row.assessment_set.heading,
      row.show_closed_assessment_score ? row.assessment_instance.score_perc?.toFixed(6) : null,
    ]);

    const stringifier = stringifyNonblocking(csvData, {
      header: true,
      columns: ['Assessment', 'Set', 'Score'],
    });

    res.setHeader('Content-Type', 'text/csv');
    res.attachment(buildCsvFilename(res.locals));
    await pipeline(stringifier, res);
  }),
);

export default router;
