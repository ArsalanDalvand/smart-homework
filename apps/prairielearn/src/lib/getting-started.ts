import { z } from 'zod';

import { loadSqlEquiv, queryRow, queryScalar } from '@prairielearn/postgres';

import { selectCourseHasCourseInstances } from '../models/course-instances.js';

import { type Course, CourseInstanceSchema } from './db-types.js';

const sql = loadSqlEquiv(import.meta.url);

export interface GettingStartedTaskInfo {
  header: string;
  description: string;
  isComplete: boolean;
  link?: string;
}

/**
 * Retrieve the getting started checklist tasks and if they are complete for a course.
 */
export async function getGettingStartedTasks({
  course,
}: {
  course: Course;
}): Promise<GettingStartedTaskInfo[]> {
  const courseHasCourseInstance = await selectCourseHasCourseInstances({ course });

  let assessmentsPageLink: string | undefined;

  // If the course has a course instance, link to the assessments page for the first course instance.
  if (courseHasCourseInstance) {
    const firstCourseInstance = await queryRow(
      sql.select_first_course_instance,
      { course_id: course.id },
      CourseInstanceSchema,
    );
    assessmentsPageLink = `/pl/course_instance/${firstCourseInstance.id}/instructor/instance_admin/assessments`;
  }

  // Check if the course has at least 2 staff members, since the
  // course creator is added by default.
  const courseHasAddedStaff = await queryScalar(
    sql.select_course_has_staff,
    { course_id: course.id },
    z.boolean(),
  );

  // Check if the course has at least one non-deleted question
  const courseHasQuestions = await queryScalar(
    sql.select_course_has_questions,
    { course_id: course.id },
    z.boolean(),
  );

  // Check if the course has at least one non-deleted assessment
  const courseHasAssessments = await queryScalar(
    sql.select_course_has_assessments,
    { course_id: course.id },
    z.boolean(),
  );

  const tasks: GettingStartedTaskInfo[] = [
    {
      header: 'افزودن کادر آموزشی درس (اختیاری)',
      description:
        'اساتید و دستیاران آموزشی (TA) را برای مدیریت و ارائه درس دعوت کنید. اگر به تنهایی کار می‌کنید می‌توانید از این مرحله بگذرید.',
      link: 'staff',
      isComplete: courseHasAddedStaff,
    },
    {
      header: 'ایجاد اولین سوال',
      description:
        'سوال یک مسئله یا تمرین است که میزان درک دانشجو از یک مبحث مشخص را می‌سنجد.',
      link: 'questions',
      isComplete: courseHasQuestions,
    },
    {
      header: 'ایجاد ترم یا دوره ارائه',
      description:
        'دوره یا ترم ارائه شامل تکالیف، آزمون‌ها، دانشجویان و تنظیمات اختصاصی یک نیمسال از درس است.',
      link: 'instances',
      isComplete: courseHasCourseInstance,
    },
    {
      header: 'ایجاد اولین تکلیف یا آزمون',
      description:
        'ارزیابی (تکلیف، کوییز یا امتحان) مجموعه‌ای از سوالات است که برای یادگیری و سنجش دانشجو طراحی می‌شود.',
      link: assessmentsPageLink,
      isComplete: courseHasAssessments,
    },
  ];

  return tasks;
}
