import { useQuery } from '@tanstack/react-query';
import clsx from 'clsx';
import { Alert, Button, Form, ListGroup } from 'react-bootstrap';
import { useFieldArray, useWatch } from 'react-hook-form';

import { StudentLabelBadge } from '../../../../components/StudentLabelBadge.js';
import { StudentLabelDropdown } from '../../../../components/StudentLabelDropdown.js';
import { getStudentEnrollmentUrl } from '../../../../lib/client/url.js';
import {
  MAX_ACCESS_CONTROL_ENROLLMENTS_PER_RULE,
  MAX_ACCESS_CONTROL_STUDENT_LABELS_PER_RULE,
} from '../../../../schemas/accessControl.js';
import { useTRPC } from '../../../../trpc/assessment/context.js';
import { useAccessControlRuleEditable } from '../AccessControlEditabilityContext.js';
import type { AccessControlFormData, EnrollmentTarget, TargetType } from '../types.js';

import { AddStudentsModal } from './AddStudentsModal.js';

export function AppliesToField({
  namePrefix,
  courseInstanceId,
  targetTypeDisabledReasons,
  canEditAccessSettings,
  canEditEnrollmentRules,
  onTargetTypeChange,
}: {
  namePrefix: `overrides.${number}`;
  courseInstanceId: string;
  targetTypeDisabledReasons?: Partial<Record<TargetType, string | null>>;
  /** Whether the user has page-level permission to edit access settings at all. */
  canEditAccessSettings: boolean;
  /** Whether the user has permission to edit enrollment-targeted rules. */
  canEditEnrollmentRules: boolean;
  onTargetTypeChange: (targetType: TargetType) => void;
}) {
  const trpc = useTRPC();
  const ruleEditable = useAccessControlRuleEditable();
  const showStudentLabelOnlyHint = canEditAccessSettings && !canEditEnrollmentRules;

  const { targetType, enrollments, studentLabels } = useWatch<
    AccessControlFormData,
    `overrides.${number}.appliesTo`
  >({
    name: `${namePrefix}.appliesTo`,
  });

  const { data: allLabels } = useQuery({
    ...trpc.accessControl.studentLabels.queryOptions(),
    enabled: ruleEditable && targetType === 'student_label',
  });

  const { replace: replaceEnrollments, remove: removeEnrollment } = useFieldArray({
    name: `${namePrefix}.appliesTo.enrollments`,
  });

  const { append: appendStudentLabel, remove: removeStudentLabel } = useFieldArray({
    name: `${namePrefix}.appliesTo.studentLabels`,
  });

  const handleSaveStudents = (students: EnrollmentTarget[]) => {
    replaceEnrollments(students);
  };

  const handleRemoveEnrollmentByUid = (uid: string) => {
    const index = enrollments.findIndex((s) => s.uid === uid);
    if (index !== -1) removeEnrollment(index);
  };
  const handleRemoveStudentLabelById = (studentLabelId: string) => {
    const index = studentLabels.findIndex((sl) => sl.studentLabelId === studentLabelId);
    if (index !== -1) removeStudentLabel(index);
  };

  const excludedStudentLabelIds = new Set(studentLabels.map((sl) => sl.studentLabelId));
  const excludedUids = new Set(enrollments.map((i) => i.uid));
  const studentLabelLimitReached =
    studentLabels.length >= MAX_ACCESS_CONTROL_STUDENT_LABELS_PER_RULE;
  const studentLabelLimitReason = `حداکثر ${MAX_ACCESS_CONTROL_STUDENT_LABELS_PER_RULE} برچسب دانشجویی قابل انتخاب است.`;
  const enrollmentDisabledReason = targetTypeDisabledReasons?.enrollment ?? undefined;
  const studentLabelDisabledReason = targetTypeDisabledReasons?.student_label ?? undefined;

  const hasNoTargets = enrollments.length === 0 && studentLabels.length === 0;
  const targetDescription = targetType === 'enrollment' ? 'دانشجو' : 'برچسب دانشجویی';
  const studentSpecificPermissionMessageId = `${namePrefix}-student-specific-permission-message`;
  const enrollmentLimitMessageId = `${namePrefix}-target-enrollment-limit-message`;
  const studentLabelLimitMessageId = `${namePrefix}-target-student-label-limit-message`;
  const enrollmentDescribedBy = [
    showStudentLabelOnlyHint ? studentSpecificPermissionMessageId : null,
    enrollmentDisabledReason ? enrollmentLimitMessageId : null,
  ]
    .filter((id) => id != null)
    .join(' ');

  return (
    <div className="mb-3">
      <div className="section-header mb-3">
        <strong>اعمال برای</strong>
      </div>
      {showStudentLabelOnlyHint && (
        <Alert variant="info" className="mb-3" id={studentSpecificPermissionMessageId}>
          استثناهای مختص دانشجو نیازمند دسترسی ویرایشگر داده‌های دانشجو هستند. همچنان می‌توانید
          استثناهایی برای دانشجویان دارای برچسب‌های خاص ایجاد یا ویرایش کنید.
        </Alert>
      )}
      <fieldset className="mb-3">
        <legend className="visually-hidden">نوع هدف</legend>
        <Form.Check
          type="radio"
          id={`${namePrefix}-target-enrollment`}
          name={`${namePrefix}-target-type`}
          label="دانشجویان خاص"
          checked={targetType === 'enrollment'}
          disabled={!ruleEditable || !canEditEnrollmentRules || enrollmentDisabledReason != null}
          title={enrollmentDisabledReason}
          aria-describedby={enrollmentDescribedBy || undefined}
          onChange={() => onTargetTypeChange('enrollment')}
        />
        {enrollmentDisabledReason && (
          <Form.Text id={enrollmentLimitMessageId} className="text-muted d-block ms-4 mt-1 mb-2">
            {enrollmentDisabledReason}
          </Form.Text>
        )}
        <Form.Check
          type="radio"
          id={`${namePrefix}-target-student-label`}
          name={`${namePrefix}-target-type`}
          label="دانشجویان بر اساس برچسب"
          checked={targetType === 'student_label'}
          disabled={!ruleEditable || studentLabelDisabledReason != null}
          title={studentLabelDisabledReason}
          aria-describedby={studentLabelDisabledReason ? studentLabelLimitMessageId : undefined}
          onChange={() => onTargetTypeChange('student_label')}
        />
        {studentLabelDisabledReason && (
          <Form.Text id={studentLabelLimitMessageId} className="text-muted d-block ms-4 mt-1 mb-2">
            {studentLabelDisabledReason}
          </Form.Text>
        )}
      </fieldset>

      <div>
        {targetType === 'enrollment' ? (
          <div className="border rounded overflow-hidden">
            <div
              className={clsx(
                'd-flex align-items-center px-3 py-2 bg-body-tertiary',
                enrollments.length > 0 && 'border-bottom',
              )}
            >
              <span className="small text-muted">{enrollments.length} دانشجو</span>
              {ruleEditable && (
                <div className="ms-auto">
                  <AddStudentsModal
                    selectedUids={excludedUids}
                    maxStudents={MAX_ACCESS_CONTROL_ENROLLMENTS_PER_RULE}
                    renderTrigger={({ onClick }) => (
                      <Button
                        variant="link"
                        size="sm"
                        className="text-decoration-none"
                        onClick={onClick}
                      >
                        انتخاب دانشجویان…
                      </Button>
                    )}
                    onSaveStudents={handleSaveStudents}
                  />
                </div>
              )}
            </div>
            {enrollments.length > 0 && (
              <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                <ListGroup variant="flush">
                  {enrollments.map((s) => (
                    <ListGroup.Item
                      key={s.uid}
                      className="d-flex align-items-center justify-content-between py-2"
                    >
                      <div className="d-flex flex-column">
                        <a href={getStudentEnrollmentUrl(courseInstanceId, s.enrollmentId)}>
                          {s.uid}
                        </a>
                        {s.name && <span className="text-muted small">{s.name}</span>}
                      </div>
                      {ruleEditable && (
                        <Button
                          variant="ghost"
                          size="sm"
                          aria-label={`حذف ${s.name ?? s.uid}`}
                          onClick={() => handleRemoveEnrollmentByUid(s.uid)}
                        >
                          <i className="bi bi-trash text-danger" aria-hidden="true" />
                        </Button>
                      )}
                    </ListGroup.Item>
                  ))}
                </ListGroup>
              </div>
            )}
          </div>
        ) : (
          <div>
            <div className="d-flex flex-wrap align-items-baseline gap-2">
              {ruleEditable && (
                <StudentLabelDropdown
                  labels={allLabels ?? []}
                  selectedIds={excludedStudentLabelIds}
                  buttonLabel="انتخاب برچسب‌ها"
                  maxSelected={MAX_ACCESS_CONTROL_STUDENT_LABELS_PER_RULE}
                  onToggle={(label) => {
                    if (excludedStudentLabelIds.has(label.id)) {
                      handleRemoveStudentLabelById(label.id);
                    } else {
                      appendStudentLabel({
                        studentLabelId: label.id,
                        name: label.name,
                        color: label.color,
                      });
                    }
                  }}
                />
              )}
              {studentLabels.length === 0 ? (
                <span className="text-muted small">برچسب دانشجویی انتخاب نشده است</span>
              ) : (
                studentLabels.map((sl) => (
                  <StudentLabelBadge
                    key={sl.studentLabelId}
                    label={{ name: sl.name, color: sl.color ?? 'gray1' }}
                  >
                    {ruleEditable && (
                      <button
                        type="button"
                        className="btn p-0 lh-1"
                        aria-label={`حذف برچسب «${sl.name}»`}
                        onClick={() => handleRemoveStudentLabelById(sl.studentLabelId)}
                      >
                        <i className="bi bi-x text-danger" aria-hidden="true" />
                      </button>
                    )}
                  </StudentLabelBadge>
                ))
              )}
            </div>
            <div className="form-text mt-2">
              {studentLabelLimitReached
                ? studentLabelLimitReason
                : 'برای دانشجویانی که هر یک از برچسب‌های انتخاب‌شده را دارند اعمال می‌شود.'}
            </div>
          </div>
        )}
      </div>
      {hasNoTargets && (
        <Alert variant="warning" className="mt-3 mb-0">
          این استثنا هیچ هدفی ندارد.{' '}
          {ruleEditable
            ? `برای اعمال شدن این قانون، حداقل یک ${targetDescription} اضافه کنید.`
            : `کاربری با دسترسی ویرایش این استثنا باید حداقل یک ${targetDescription} اضافه کند تا این قانون اعمال شود.`}
        </Alert>
      )}
    </div>
  );
}
