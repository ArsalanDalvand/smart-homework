import { FeatureManager } from './manager.js';

const featureNames = [
  'course-instance-billing',
  'enforce-plan-grants-for-questions',

  // Should only be applied to courses/institutions.
  'question-sharing', // This also controls course instance sharing.
  'consume-public-questions',
  'ai-grading',
  'ai-submission-grouping',
  'disable-public-workspaces',
  'printable-exams',

  // Should be applied to courses only.
  'ai-question-generation-course-toggle',

  // Can be applied to any context.
  'course-agent',
  'ai-question-generation',
  'rich-text-editor',
  'question-hosting-update',

  // LTI 1.1. Deprecated so keep scope to course instance, where possible.
  'lti11',

  // Student engagement & motivation modules (course/course-instance toggleable).
  'student-analytics',
  'student-leaderboard',
  'student-activity-heatmap',
  'student-question-stats',
  'student-deadline-radar',
  'student-xp-levels',
  'student-achievements',
  'student-weekly-quests',
  'student-skill-tree',
  'student-hall-of-fame',
  'student-micro-delight',
  'student-coop-goal',
  'student-ta-kudos',
  'student-weekly-leagues',
  'student-code-speed',
  'student-daily-pulse',
  'student-coding-passport',
  'student-weekly-goal-simulator',
  'student-term-wrap-up',
] as const;

const features = new FeatureManager(featureNames);

export type FeatureName = (typeof featureNames)[number];

export { features };
