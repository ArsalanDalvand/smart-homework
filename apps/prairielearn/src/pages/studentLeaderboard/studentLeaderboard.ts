import { Router } from 'express';
import { z } from 'zod';

import { HttpStatusError } from '@prairielearn/error';

import { features } from '../../lib/features/index.js';
import { typedAsyncHandler } from '../../lib/res-locals.js';
import {
  getStudentLeaderboardData,
  saveStudentLeaderboardPreferences,
} from '../../lib/student-engagement.js';
import logPageView from '../../middlewares/logPageView.js';

import { StudentLeaderboard } from './studentLeaderboard.html.js';

const router = Router();

const QuerySchema = z.object({
  assessment_id: z.string().regex(/^\d+$/).optional().catch(undefined),
  saved: z.string().optional().catch(undefined),
  error: z.string().optional().catch(undefined),
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
        savedBanner: query.saved === '1',
        errorMessage: query.error ?? null,
      }),
    );
  }),
);

router.post(
  '/',
  typedAsyncHandler<'course-instance'>(async (req, res) => {
    const enabled = await features.enabledFromLocals('student-leaderboard', res.locals);
    if (!enabled) {
      throw new HttpStatusError(403, 'جدول امتیازات برای این دوره غیرفعال است.');
    }

    const displayAlias = typeof req.body.display_alias === 'string' ? req.body.display_alias : '';
    const optOut =
      req.body.opt_out === 'on' || req.body.opt_out === 'true' || req.body.opt_out === '1';
    const assessmentId =
      typeof req.body.assessment_id === 'string' && /^\d+$/.test(req.body.assessment_id)
        ? req.body.assessment_id
        : null;

    const result = await saveStudentLeaderboardPreferences({
      userId: res.locals.user.id,
      displayAlias,
      optOut,
    });

    const params = new URLSearchParams();
    if (assessmentId) params.set('assessment_id', assessmentId);
    if (result.ok) {
      params.set('saved', '1');
    } else {
      params.set('error', result.error);
    }

    res.redirect(`${res.locals.urlPrefix}/leaderboard?${params.toString()}`);
  }),
);

export default router;
