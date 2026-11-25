import { Badge } from 'react-bootstrap';

import { run } from '@prairielearn/run';
import {
  IndeterminateCheckbox,
  type MultiSelectFilterValue,
  OverlayTrigger,
  type TanstackTableCoreInstance,
  applyMultiSelectFilter,
  createTanstackTableColumnHelper,
  numericColumnFilterFn,
} from '@prairielearn/ui';

import {
  StudentLabelsCell,
  StudentLabelsHeader,
  applyStudentLabelsFilter,
} from '../../../../components/StudentLabels.js';
import type { StaffAssessment, StaffStudentLabel } from '../../../../lib/client/safe-db-types.js';
import { getStudentEnrollmentUrl } from '../../../../lib/client/url.js';
import type { AssessmentQuestion, InstanceQuestionGroup } from '../../../../lib/db-types.js';
import { formatPoints } from '../../../../lib/format.js';
import type { JobItemStatus } from '../../../../lib/serverJobProgressSocket.shared.js';
import type { InstanceQuestionRowWithAIGradingStats as InstanceQuestionRow } from '../assessmentQuestion.types.js';
import { GradingStatusCell } from '../components/GradingStatusCell.js';

import { PointsWithEditButton, ScoreWithEditButton, generateAiGraderName } from './columnUtils.js';

const columnHelper = createTanstackTableColumnHelper<InstanceQuestionRow>();

function SelectAllCheckbox({ table }: { table: TanstackTableCoreInstance<InstanceQuestionRow> }) {
  const allSelected = table.getIsAllRowsSelected();
  return (
    <IndeterminateCheckbox
      checked={allSelected}
      indeterminate={table.getIsSomeRowsSelected() && !allSelected}
      // Prevent browser from autocompleting the checkbox value when you return to the page.
      autoComplete="off"
      onChange={table.getToggleAllRowsSelectedHandler()}
    />
  );
}

interface CreateColumnsParams {
  aiGradingMode: boolean;
  instanceQuestionGroups: InstanceQuestionGroup[];
  assessmentQuestion: AssessmentQuestion;
  hasCourseInstancePermissionEdit: boolean;
  urlPrefix: string;
  csrfToken: string;
  assessment: StaffAssessment;
  courseInstanceId: string;
  studentLabels: StaffStudentLabel[];
  onEditPointsSuccess: () => void;
  onEditPointsConflict: (conflictDetailsUrl: string) => void;
  scrollRef: React.RefObject<HTMLDivElement | null> | null;
  displayedStatuses: Record<string, JobItemStatus | undefined>;
}

export function createColumns({
  aiGradingMode,
  instanceQuestionGroups,
  displayedStatuses,
  assessment,
  assessmentQuestion,
  hasCourseInstancePermissionEdit,
  urlPrefix,
  csrfToken,
  courseInstanceId,
  studentLabels,
  onEditPointsSuccess,
  onEditPointsConflict,
  scrollRef,
}: CreateColumnsParams) {
  const studentLabelsById = new Map(studentLabels.map((label) => [label.id, label]));
  const renderPointsCell = (
    row: InstanceQuestionRow,
    field: 'manual_points' | 'auto_points' | 'points',
  ) => (
    <PointsWithEditButton
      row={row}
      field={field}
      hasCourseInstancePermissionEdit={hasCourseInstancePermissionEdit}
      urlPrefix={urlPrefix}
      csrfToken={csrfToken}
      scrollRef={scrollRef}
      onSuccess={onEditPointsSuccess}
      onConflict={onEditPointsConflict}
    />
  );

  return columnHelper.columns([
    columnHelper.display({
      id: 'select',
      header: ({ table }) => <SelectAllCheckbox table={table} />,
      cell: ({ row }) => {
        return (
          <input
            type="checkbox"
            checked={row.getIsSelected()}
            disabled={!row.getCanSelect()}
            onChange={row.getToggleSelectedHandler()}
          />
        );
      },
      size: 40,
      minSize: 40,
      maxSize: 40,
      enableSorting: false,
      enableHiding: false,
      enablePinning: false,
      enableResizing: false,
    }),

    columnHelper.accessor((row, index) => index, {
      id: 'index',
      header: 'نمونه',
      size: 200,
      cell: (info) => {
        const row = info.row.original;
        return (
          <div className="d-flex align-items-center gap-2">
            <a
              href={`${urlPrefix}/assessment/${assessment.id}/manual_grading/instance_question/${row.instance_question.id}`}
            >
              نمونه {info.getValue() + 1}
            </a>
            {row.open_issue_count ? (
              <Badge
                bg="danger"
                title={`${row.open_issue_count} گزارش خطای باز`}
                pill
              >
                {row.open_issue_count}
                <span className="visually-hidden">
                  {' '}
                  گزارش خطای باز
                </span>
              </Badge>
            ) : null}
            {row.assessment_open ? (
              <Badge bg="warning" text="dark">
                <i className="bi bi-exclamation-triangle-fill" aria-hidden="true" /> باز
              </Badge>
            ) : null}
          </div>
        );
      },
      enableColumnFilter: false,
    }),

    columnHelper.accessor((row) => row.instance_question.instance_question_group_name, {
      id: 'instance_question_group_name',
      header: 'گروه ارسال',
      cell: (info) => {
        const value = info.getValue();
        if (!value) {
          return <span className="text-secondary">بدون گروه</span>;
        }
        const group = instanceQuestionGroups.find((g) => g.instance_question_group_name === value);
        const rowId = info.row.original.instance_question.id;
        return (
          <span className="d-flex align-items-center gap-2">
            {value}
            {group && (
              <OverlayTrigger
                tooltip={{
                  body: group.instance_question_group_description,
                  props: { id: `submission-group-${rowId}-description-tooltip` },
                }}
              >
                <button className="btn btn-xs btn-ghost" aria-label="توضیحات گروه">
                  <i
                    className="fas fa-circle-info fa-width-auto text-secondary"
                    aria-hidden="true"
                  />
                </button>
              </OverlayTrigger>
            )}
          </span>
        );
      },
      filterFn: (row, _columnId, filter: MultiSelectFilterValue) => {
        const current = row.original.instance_question.instance_question_group_name;
        const groupName = current ?? 'بدون گروه';
        return applyMultiSelectFilter(filter, (values) => values.includes(groupName));
      },
      enableHiding: aiGradingMode && instanceQuestionGroups.length > 0,
    }),

    columnHelper.accessor('user_or_group_name', {
      id: 'user_or_group_name',
      header: assessment.team_work ? 'نام گروه' : 'نام',
      cell: (info) => info.getValue() || '—',
    }),

    columnHelper.accessor('uid', {
      id: 'uid',
      header: assessment.team_work ? 'شناسه‌های کاربری' : 'شناسه کاربری (UID)',
      cell: (info) => {
        const uid = info.getValue();
        const enrollmentId = info.row.original.enrollment_id;
        if (!uid) return '—';
        if (enrollmentId) {
          return <a href={getStudentEnrollmentUrl(courseInstanceId, enrollmentId)}>{uid}</a>;
        }
        return uid;
      },
    }),

    ...(!assessment.team_work
      ? [
          columnHelper.accessor('student_label_ids', {
            id: 'student_labels',
            header: StudentLabelsHeader,
            meta: { label: 'برچسب‌ها' },
            cell: (info) => (
              <StudentLabelsCell labelIds={info.getValue()} studentLabelsById={studentLabelsById} />
            ),
            enableSorting: false,
            enableGlobalFilter: false,
            filterFn: (row, _columnId, filter: MultiSelectFilterValue) =>
              applyStudentLabelsFilter(row.original.student_label_ids, filter),
          }),
        ]
      : []),

    columnHelper.accessor((row) => row.instance_question.requires_manual_grading, {
      id: 'requires_manual_grading',
      header: 'وضعیت تصحیح',
      minSize: aiGradingMode ? 220 : 100,
      cell: (info) => {
        return (
          <GradingStatusCell
            aiGradingMode={aiGradingMode}
            instanceQuestionId={info.row.original.instance_question.id}
            requiresGrading={info.getValue()}
            displayedStatuses={displayedStatuses}
          />
        );
      },
      filterFn: (row, _columnId, filter: MultiSelectFilterValue) => {
        const requiresGrading = row.original.instance_question.requires_manual_grading;
        const status = requiresGrading ? 'Requires grading' : 'Graded';
        return applyMultiSelectFilter(filter, (values) => values.includes(status));
      },
      meta: {
        autoSize: true,
      },
    }),

    columnHelper.accessor('assigned_grader_name', {
      id: 'assigned_grader_name',
      header: 'مصحح تخصیص‌یافته',
      cell: (info) => info.getValue() || 'تخصیص‌نیافته',
      filterFn: (row, _columnId, filter: MultiSelectFilterValue) => {
        const current = row.original.assigned_grader_name;
        const grader = current ?? 'تخصیص‌نیافته';
        return applyMultiSelectFilter(filter, (values) => values.includes(grader));
      },
      meta: {
        autoSize: true,
      },
    }),

    columnHelper.accessor((row) => row.instance_question.auto_points, {
      id: 'auto_points',
      header: 'نمره خودکار',
      cell: (info) => renderPointsCell(info.row.original, 'auto_points'),
      filterFn: numericColumnFilterFn,
      enableHiding: (assessmentQuestion.max_auto_points ?? 0) > 0,
    }),

    columnHelper.accessor((row) => row.instance_question.manual_points, {
      id: 'manual_points',
      header: 'نمره دستی',
      cell: (info) => renderPointsCell(info.row.original, 'manual_points'),
      filterFn: numericColumnFilterFn,
      meta: {
        autoSize: true,
      },
    }),

    columnHelper.accessor((row) => row.instance_question.points, {
      id: 'points',
      header: 'نمره کل',
      cell: (info) => renderPointsCell(info.row.original, 'points'),
      filterFn: numericColumnFilterFn,
    }),

    columnHelper.accessor((row) => row.instance_question.score_perc, {
      id: 'score_perc',
      header: 'درصد نمره',
      cell: (info) => (
        <ScoreWithEditButton
          row={info.row.original}
          hasCourseInstancePermissionEdit={hasCourseInstancePermissionEdit}
          urlPrefix={urlPrefix}
          csrfToken={csrfToken}
          scrollRef={scrollRef}
          onSuccess={onEditPointsSuccess}
          onConflict={onEditPointsConflict}
        />
      ),
      filterFn: numericColumnFilterFn,
      minSize: 160,
      size: 200,
    }),

    columnHelper.accessor('last_grader_name', {
      id: 'last_grader_name',
      header: 'تصحیح‌شده توسط',
      cell: (info) => {
        const row = info.row.original;
        if (aiGradingMode) {
          const showPlus =
            row.instance_question.ai_grading_status !== 'None' &&
            row.instance_question.last_human_grader;
          return (
            <span>
              {row.instance_question.ai_grading_status !== 'None' && (
                <span
                  className={`badge rounded-pill text-bg-light border ${
                    row.instance_question.ai_grading_status === 'Graded' ||
                    row.instance_question.ai_grading_status === 'LatestRubric'
                      ? ''
                      : 'text-muted'
                  }`}
                >
                  {generateAiGraderName(row.instance_question.ai_grading_status)}
                </span>
              )}
              {showPlus && ' + '}
              {row.instance_question.last_human_grader && (
                <span>{row.instance_question.last_human_grader}</span>
              )}
            </span>
          );
        } else {
          if (!info.getValue()) return 'تخصیص‌نیافته';
          if (row.instance_question.is_ai_graded) {
            return (
              <span className="badge rounded-pill text-bg-light border">
                {generateAiGraderName()}
              </span>
            );
          }
          return info.getValue();
        }
      },
      filterFn: (row, _columnId, filter: MultiSelectFilterValue) => {
        const current = row.original.last_grader_name;
        const rowData = row.original;
        const aiGraderName =
          rowData.instance_question.ai_grading_status !== 'None'
            ? generateAiGraderName(rowData.instance_question.ai_grading_status)
            : null;
        const grader = current ?? 'تخصیص‌نیافته';
        return applyMultiSelectFilter(
          filter,
          (values) =>
            values.includes(grader) || (aiGraderName != null && values.includes(aiGraderName)),
        );
      },
      sortFn: (rowA, rowB) => {
        const aAiGradingStatus = rowA.original.instance_question.ai_grading_status;
        const bAiGradingStatus = rowB.original.instance_question.ai_grading_status;

        const aiGradingStatusOrder = {
          None: 0,
          Graded: 1,
          LatestRubric: 2,
          OutdatedRubric: 3,
        };

        if (aAiGradingStatus !== bAiGradingStatus) {
          return aiGradingStatusOrder[aAiGradingStatus] - aiGradingStatusOrder[bAiGradingStatus];
        }

        const aLastHumanGrader = rowA.original.instance_question.last_human_grader ?? '';
        const bLastHumanGrader = rowB.original.instance_question.last_human_grader ?? '';
        return aLastHumanGrader.localeCompare(bLastHumanGrader);
      },
    }),

    columnHelper.accessor(
      (row) => row.instance_question.ai_grading?.latest_update.ai_grading_model ?? null,
      {
        id: 'ai_grading_model',
        header: 'مدل هوش مصنوعی',
        size: 220,
        cell: (info) => (
          <span className="font-monospace" title={info.getValue() ?? undefined}>
            {info.getValue() ?? '—'}
          </span>
        ),
        filterFn: (row, columnId, filter: MultiSelectFilterValue) =>
          applyMultiSelectFilter(filter, (values) =>
            values.includes(row.getValue<string | null>(columnId) ?? 'هیچ‌کدام'),
          ),
      },
    ),

    // AI agreement column
    columnHelper.accessor((row) => row.instance_question.rubric_difference, {
      id: 'rubric_difference',
      header: 'تطابق هوش مصنوعی',
      size: 400,
      minSize: 200,
      maxSize: 600,
      meta: {
        wrapText: true,
      },
      cell: (info) => {
        const row = info.row.original;
        const rowId = row.instance_question.id;
        if (row.instance_question.point_difference === null) {
          return '—';
        }

        if (row.instance_question.rubric_difference === null) {
          if (!row.instance_question.point_difference) {
            return <i className="bi bi-check-square-fill text-success" />;
          } else {
            const prefix = row.instance_question.point_difference < 0 ? '' : '+';
            return (
              <span className="text-danger">
                <i className="bi bi-x-square-fill" /> {prefix}
                {formatPoints(row.instance_question.point_difference)}
              </span>
            );
          }
        }

        if (row.instance_question.rubric_difference.length === 0) {
          return (
            <OverlayTrigger
              tooltip={{
                body: 'تصحیح هوش مصنوعی و مصحح انسانی یکسان است',
                props: { id: `ai-agreement-${rowId}-agreement-tooltip` },
              }}
            >
              <i className="bi bi-check-square-fill text-success" />
            </OverlayTrigger>
          );
        }

        return (
          <div>
            {row.instance_question.rubric_difference.map((item) => (
              <div key={item.description}>
                {item.false_positive ? (
                  <OverlayTrigger
                    tooltip={{
                      body: 'انتخاب‌شده توسط هوش مصنوعی اما نه توسط مصحح',
                      props: { id: `ai-agreement-${rowId}-false-positive-tooltip` },
                    }}
                  >
                    <i className="bi bi-plus-square-fill text-danger" />
                  </OverlayTrigger>
                ) : (
                  <OverlayTrigger
                    tooltip={{
                      body: 'انتخاب‌شده توسط مصحح اما نه توسط هوش مصنوعی',
                      props: { id: `ai-agreement-${rowId}-false-negative-tooltip` },
                    }}
                  >
                    <i className="bi bi-dash-square-fill text-danger" />
                  </OverlayTrigger>
                )}{' '}
                <span>{item.description}</span>
              </div>
            ))}
          </div>
        );
      },
      filterFn: (row, columnId, filter: MultiSelectFilterValue) => {
        if (filter.values.length === 0) return true;
        const rubricDiff = row.original.instance_question.rubric_difference;
        const matches =
          !!rubricDiff &&
          Array.isArray(rubricDiff) &&
          filter.values.every((d) => rubricDiff.some((item) => item.description === d));
        return filter.mode === 'include' ? matches : !matches;
      },
      sortFn: (rowA, rowB) => {
        const aDiff = run(() => {
          if (rowA.original.instance_question.rubric_difference == null) return -1;
          return rowA.original.instance_question.rubric_difference.length;
        });
        const bDiff = run(() => {
          if (rowB.original.instance_question.rubric_difference == null) return -1;
          return rowB.original.instance_question.rubric_difference.length;
        });

        return aDiff - bDiff;
      },
      enableHiding: aiGradingMode,
    }),

    columnHelper.accessor('rubric_grading_item_ids', {
      id: 'rubric_grading_item_ids',
      header: 'موارد معیار نمره‌دهی',
      enableHiding: false,
      enableSorting: false,
      cell: () => null,
      filterFn: (row, columnId, filterValues: string[]) => {
        if (filterValues.length === 0) return true;
        const rubricItemIds = row.original.rubric_grading_item_ids;
        return filterValues.every((itemId) => rubricItemIds.includes(itemId));
      },
    }),
  ]);
}
