import { Router } from 'express';
import { z } from 'zod';

import { HttpStatusError } from '@prairielearn/error';

import { features } from '../../lib/features/index.js';
import { typedAsyncHandler } from '../../lib/res-locals.js';
import { getStudentLeaderboardData } from '../../lib/student-engagement.js';
import { getCohortGamificationBundle } from '../../lib/student-gamification.js';
import logPageView from '../../middlewares/logPageView.js';

import { StudentLeaderboard } from './studentLeaderboard.html.js';

const router = Router();

const QuerySchema = z.object({
  assessment_id: z.string().regex(/^\d+$/).optional().catch(undefined),
});

router.get(
  '/',
  logPageView('studentLeaderboard'),
  typedAsyncHandler<'course-instance'>(async (req, res) => {
    if (res.locals.authz_data.mode === 'Exam') {
      throw new HttpStatusError(403, 'جدول امتیازات در حالت آزمون در دسترس نیست.');
    }

    const enabled = await features.enabledFromLocals('student-leaderboard', res.locals);
    if (!enabled) {
      throw new HttpStatusError(403, 'جدول امتیازات برای این دوره غیرفعال است.');
    }

    const query = QuerySchema.parse(req.query);
    const [xpLevelsEnabled, achievementsEnabled, hallOfFameEnabled] = await Promise.all([
      features.enabledFromLocals('student-xp-levels', res.locals),
      features.enabledFromLocals('student-achievements', res.locals),
      features.enabledFromLocals('student-hall-of-fame', res.locals),
    ]);

    const needCohortBundle = xpLevelsEnabled || achievementsEnabled || hallOfFameEnabled;

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

    res.send(
      StudentLeaderboard({
        resLocals: res.locals,
        data,
        cohortBundle,
        showXpLevels: xpLevelsEnabled,
        showAchievements: achievementsEnabled,
        showHallOfFame: hallOfFameEnabled,
      }),
    );
  }),
);

export default router;
