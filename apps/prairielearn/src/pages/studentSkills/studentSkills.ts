import { Router } from 'express';

import { HttpStatusError } from '@prairielearn/error';

import { features } from '../../lib/features/index.js';
import { typedAsyncHandler } from '../../lib/res-locals.js';
import { getStudentSkillTreeData } from '../../lib/student-gamification.js';
import logPageView from '../../middlewares/logPageView.js';

import { StudentSkills } from './studentSkills.html.js';

const router = Router();

router.get(
  '/',
  logPageView('studentSkills'),
  typedAsyncHandler<'course-instance'>(async (req, res) => {
    if (res.locals.authz_data.mode === 'Exam') {
      throw new HttpStatusError(403, 'مسیر مهارت‌ها در حالت آزمون در دسترس نیست.');
    }

    const enabled = await features.enabledFromLocals('student-skill-tree', res.locals);
    if (!enabled) {
      throw new HttpStatusError(403, 'مسیر مهارت‌ها (Skill Tree) برای این دوره غیرفعال است.');
    }

    const data = await getStudentSkillTreeData({
      courseInstanceId: res.locals.course_instance.id,
      userId: res.locals.user.id,
    });

    res.send(
      StudentSkills({
        resLocals: res.locals,
        data,
      }),
    );
  }),
);

export default router;
