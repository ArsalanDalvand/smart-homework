import type { ReactNode } from 'react';

import {
  MultiSelectColumnFilter,
  NumericInputColumnFilter,
  type TanstackTableHeader,
} from '@prairielearn/ui';

import { StudentLabelsFilter } from '../../../../components/StudentLabels.js';
import type { StaffStudentLabel } from '../../../../lib/client/safe-db-types.js';
import {
  GRADING_STATUS_VALUES,
  type GradingStatusValue,
  type InstanceQuestionRowWithAIGradingStats as InstanceQuestionRow,
} from '../assessmentQuestion.types.js';

const GRADING_STATUS_LABELS: Record<GradingStatusValue, string> = {
  'Requires grading': 'نیازمند تصحیح',
  Graded: 'تصحیح‌شده',
};

type ColumnFilter = (props: { header: TanstackTableHeader<InstanceQuestionRow> }) => ReactNode;

export function createColumnFilters({
  allGraders,
  allAiModels,
  studentLabels,
  allSubmissionGroups,
  allAiAgreementItems,
}: {
  allGraders: string[];
  allAiModels: string[];
  studentLabels: StaffStudentLabel[];
  allSubmissionGroups: string[];
  allAiAgreementItems: { number: number; description: string }[];
}) {
  return {
    student_labels: ({ header }) => (
      <StudentLabelsFilter column={header.column} studentLabels={studentLabels} />
    ),
    requires_manual_grading: ({ header }) => (
      <MultiSelectColumnFilter
        column={header.column}
        allColumnValues={[...GRADING_STATUS_VALUES]}
        getSearchText={(value) => GRADING_STATUS_LABELS[value]}
        renderValueLabel={({ value }) => (
          <span className="text-nowrap">{GRADING_STATUS_LABELS[value]}</span>
        )}
      />
    ),
    assigned_grader_name: ({ header }) => (
      <MultiSelectColumnFilter
        column={header.column}
        allColumnValues={[...allGraders, 'تخصیص‌نیافته']}
        showSearch
      />
    ),
    last_grader_name: ({ header }) => (
      <MultiSelectColumnFilter
        column={header.column}
        allColumnValues={[...allGraders, 'تخصیص‌نیافته']}
        showSearch
      />
    ),
    ai_grading_model: ({ header }) => (
      <MultiSelectColumnFilter column={header.column} allColumnValues={allAiModels} showSearch />
    ),
    instance_question_group_name: ({ header }) => (
      <MultiSelectColumnFilter
        column={header.column}
        allColumnValues={[...allSubmissionGroups, 'بدون گروه']}
        showSearch
      />
    ),
    manual_points: ({ header }) => <NumericInputColumnFilter column={header.column} />,
    auto_points: ({ header }) => <NumericInputColumnFilter column={header.column} />,
    points: ({ header }) => <NumericInputColumnFilter column={header.column} />,
    score_perc: ({ header }) => <NumericInputColumnFilter column={header.column} />,
    rubric_difference: ({ header }) => (
      <MultiSelectColumnFilter
        column={header.column}
        allColumnValues={allAiAgreementItems.map((item) => item.description)}
      />
    ),
  } satisfies Record<string, ColumnFilter>;
}
