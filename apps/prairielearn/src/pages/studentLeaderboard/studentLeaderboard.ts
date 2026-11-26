import { Router } from 'express';
import { z } from 'zod';

import { HttpStatusError } from '@prairielearn/error';

import { features } from '../../lib/features/index.js';
import { typedAsyncHandler } from '../../lib/res-locals.js';
import { getStudentLeaderboardData } from '../../lib/student-engagement.js';
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
    const enabled = await features.enabledFromLocals('student-leaderboard', res.locals);
    if (!enabled) {
      throw new HttpStatusError(403, 'جدول امتیازات برای این دوره غیرفعال است.');
    }

    const query = QuerySchema.parse(req.query);
    const data = await getStudentLeaderboardData({
      courseInstanceId: res.locals.course_instance.id,
      userId: res.locals.user.id,
      assessmentId: query.assessment_id ?? null,
    });

    res.send(
      StudentLeaderboard({
        resLocals: res.locals,
        data,
      }),
    );
  }),
);

export default router;
