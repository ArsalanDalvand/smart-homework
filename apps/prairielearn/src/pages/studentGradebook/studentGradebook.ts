import { pipeline } from 'node:stream/promises';

import { Router } from 'express';

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

router.get(
  '/',
  logPageView('studentGradebook'),
  typedAsyncHandler<'course-instance'>(async (req, res) => {
    const [rawRows, analyticsEnabled, heatmapEnabled] = await Promise.all([
      getGradebookRows({
        courseInstance: res.locals.course_instance,
        userId: res.locals.user.id,
        authzData: res.locals.authz_data,
        reqDate: res.locals.req_date,
        auth: 'student',
      }),
      features.enabledFromLocals('student-analytics', res.locals),
      features.enabledFromLocals('student-activity-heatmap', res.locals),
    ]);

    const [analyticsData, activityData] = await Promise.all([
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
    ]);

    const rows = rawRows.map((row, index) => mapRow(row, rawRows[index - 1]));
    res.send(
      StudentGradebook({
        resLocals: res.locals,
        rows,
        csvFilename: buildCsvFilename(res.locals),
        analyticsData,
        activityData,
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
