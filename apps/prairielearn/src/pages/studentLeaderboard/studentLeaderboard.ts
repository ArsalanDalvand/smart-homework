import { Router } from 'express';
import { z } from 'zod';

import { HttpStatusError } from '@prairielearn/error';
import { IdSchema } from '@prairielearn/zod';

import { features } from '../../lib/features/index.js';
import { typedAsyncHandler } from '../../lib/res-locals.js';
import { getStudentLeaderboardData } from '../../lib/student-engagement.js';
import {
  getCohortGamificationBundle,
  getStudentCodingPassport,
} from '../../lib/student-gamification.js';
import logPageView from '../../middlewares/logPageView.js';

import { StudentLeaderboard } from './studentLeaderboard.html.js';

const router = Router();

const QuerySchema = z.object({
  assessment_id: z.string().regex(/^\d+$/).optional().catch(undefined),
  view: z.enum(['overall', 'league']).optional().catch('overall'),
});

router.get(
  '/passport/:target_user_id(\\d+)',
  typedAsyncHandler<'course-instance'>(async (req, res) => {
    if (res.locals.authz_data.mode === 'Exam' || res.locals.lockdown_browser) {
      throw new HttpStatusError(403, 'پروفایل دانشجو در حالت آزمون در دسترس نیست.');
    }

    const [leaderboardEnabled, passportEnabled] = await Promise.all([
      features.enabledFromLocals('student-leaderboard', res.locals),
      features.enabledFromLocals('student-coding-passport', res.locals),
    ]);
    if (!leaderboardEnabled || !passportEnabled) {
      throw new HttpStatusError(403, 'شناسنامه برنامه‌نویسی برای این دوره غیرفعال است.');
    }

    const targetUserId = IdSchema.parse(req.params.target_user_id);
    const passport = await getStudentCodingPassport({
      courseInstanceId: res.locals.course_instance.id,
      targetUserId,
      timezone: res.locals.course_instance.display_timezone,
    });
    if (!passport) {
      throw new HttpStatusError(404, 'اطلاعات این دانشجو یافت نشد.');
    }

    res.json(passport);
  }),
);

router.get(
  '/',
  logPageView('studentLeaderboard'),
  typedAsyncHandler<'course-instance'>(async (req, res) => {
    if (res.locals.authz_data.mode === 'Exam' || res.locals.lockdown_browser) {
      throw new HttpStatusError(403, 'جدول امتیازات در حالت آزمون در دسترس نیست.');
    }

    const enabled = await features.enabledFromLocals('student-leaderboard', res.locals);
    if (!enabled) {
      throw new HttpStatusError(403, 'جدول امتیازات برای این دوره غیرفعال است.');
    }

    const query = QuerySchema.parse(req.query);
    const [
      xpLevelsEnabled,
      achievementsEnabled,
      hallOfFameEnabled,
      weeklyLeaguesEnabled,
      codingPassportEnabled,
    ] = await Promise.all([
      features.enabledFromLocals('student-xp-levels', res.locals),
      features.enabledFromLocals('student-achievements', res.locals),
      features.enabledFromLocals('student-hall-of-fame', res.locals),
      features.enabledFromLocals('student-weekly-leagues', res.locals),
      features.enabledFromLocals('student-coding-passport', res.locals),
    ]);

    const needCohortBundle =
      xpLevelsEnabled || achievementsEnabled || hallOfFameEnabled || weeklyLeaguesEnabled;

    const [data, cohortBundle] = await Promise.all([
      getStudentLeaderboardData({
        courseInstanceId: res.locals.course_instance.id,
        userId: res.locals.user.id,
        assessmentId: query.assessment_id ?? null,
      }),
      needCohortBundle
        ? getCohortGamificationBundle({
            courseInstanceId: res.locals.course_instance.id,
            timezone: res.locals.course_instance.display_timezone,
          }).catch(() => null)
        : Promise.resolve(null),
    ]);

    const view = weeklyLeaguesEnabled && query.view === 'league' ? 'league' : 'overall';

    res.send(
      StudentLeaderboard({
        resLocals: res.locals,
        data,
        cohortBundle,
        view,
        showXpLevels: xpLevelsEnabled,
        showAchievements: achievementsEnabled,
        showHallOfFame: hallOfFameEnabled,
        showWeeklyLeagues: weeklyLeaguesEnabled,
        showCodingPassport: codingPassportEnabled,
      }),
    );
  }),
);

export default router;
