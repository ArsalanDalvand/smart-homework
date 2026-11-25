import { useMutation, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Button, Dropdown, Modal, Spinner } from 'react-bootstrap';

import { getAppError } from '@prairielearn/trpc/client';
import { AppErrorAlert } from '@prairielearn/trpc/react';
import { assertNever } from '@prairielearn/utils';

import { getAssessmentLogsUrl, getCourseInstanceJobSequenceUrl } from '../../../lib/client/url.js';
import type { AssessmentInstancesError } from '../../../trpc/assessment/assessment-instances.js';
import { useTRPC } from '../../../trpc/assessment/context.js';
import type {
  AssessmentInstanceActionRow,
  AssessmentInstanceActionTarget,
} from '../instructorAssessmentInstances.types.js';

import { PendingRegradeQuestionList } from './PendingRegradeQuestionList.js';
import { TimeLimitModal } from './TimeLimitModal.js';
import { useInvalidateAssessmentInstancesList } from './useInvalidateAssessmentInstancesList.js';

type JobAction = 'grade' | 'gradeAndClose';
type OpenModal = JobAction | 'regrade' | 'delete' | 'timeLimit' | null;

function getTargetRows(target: AssessmentInstanceActionTarget): AssessmentInstanceActionRow[] {
  switch (target.kind) {
    case 'single':
      return [target.instance];
    case 'selected':
    case 'all':
      return target.instances;
    default:
      assertNever(target);
  }
}

function getTargetAssessmentInstanceIds(target: AssessmentInstanceActionTarget): string[] | null {
  switch (target.kind) {
    case 'single':
      return [target.instance.assessment_instance.id];
    case 'selected':
      return target.instances.map((instance) => instance.assessment_instance.id);
    case 'all':
      return null;
    default:
      assertNever(target);
  }
}

function describeTargetInstances(target: AssessmentInstanceActionTarget): string {
  switch (target.kind) {
    case 'single':
      return 'این آزمون';
    case 'selected':
      return `${target.instances.length} آزمون`;
    case 'all':
      return 'همه آزمون‌ها';
    default:
      assertNever(target);
  }
}

function describeTargetAssessmentInstances(target: AssessmentInstanceActionTarget): string {
  switch (target.kind) {
    case 'single':
      return 'این نمونه آزمون';
    case 'selected':
      return `${target.instances.length} نمونه آزمون`;
    case 'all':
      return 'همه نمونه‌های آزمون';
    default:
      assertNever(target);
  }
}

function describeTargetForTitle(target: AssessmentInstanceActionTarget): string {
  switch (target.kind) {
    case 'single':
      return 'این آزمون';
    case 'selected':
      return 'آزمون‌های انتخاب‌شده';
    case 'all':
      return 'همه آزمون‌ها';
    default:
      assertNever(target);
  }
}

function describeNoRegradeQuestions(target: AssessmentInstanceActionTarget): string {
  switch (target.kind) {
    case 'single':
      return 'این آزمون هیچ سوالی در انتظار دریافت نمره کامل ندارد.';
    case 'selected':
      return 'هیچ‌یک از آزمون‌های انتخاب‌شده سوالی در انتظار دریافت نمره کامل ندارند.';
    case 'all':
      return 'هیچ‌یک از آزمون‌ها سوالی در انتظار دریافت نمره کامل ندارند.';
    default:
      assertNever(target);
  }
}

export function AssessmentInstanceActions({
  target,
  courseInstanceId,
  assessmentId,
  timezone,
  onActionSuccess,
  showLogsLink = true,
}: {
  target: AssessmentInstanceActionTarget;
  courseInstanceId: string;
  assessmentId: string;
  timezone: string;
  onActionSuccess: (result: { message: string; action: 'delete' | 'timeLimit' }) => void;
  showLogsLink?: boolean;
}) {
  const [openModal, setOpenModal] = useState<OpenModal>(null);
  const logsUrl = getAssessmentLogsUrl({ courseInstanceId, assessmentId });
  const isAllInstancesTarget = target.kind === 'all';
  const targetRows = getTargetRows(target);
  const count = targetRows.length;

  return (
    <>
      <Dropdown>
        <Dropdown.Toggle size="sm" variant="light" id="instance-actions">
          عملیات
        </Dropdown.Toggle>
        <Dropdown.Menu>
          <Dropdown.Item onClick={() => setOpenModal('grade')}>
            <i className="bi bi-clipboard-check me-2" aria-hidden="true" />
            تصحیح
          </Dropdown.Item>
          <Dropdown.Item onClick={() => setOpenModal('gradeAndClose')}>
            <i className="bi bi-slash-circle me-2" aria-hidden="true" />
            تصحیح و بستن
          </Dropdown.Item>
          <Dropdown.Item onClick={() => setOpenModal('regrade')}>
            <i className="bi bi-arrow-repeat me-2" aria-hidden="true" />
            تصحیح مجدد
          </Dropdown.Item>
          <Dropdown.Divider />
          <Dropdown.Item onClick={() => setOpenModal('timeLimit')}>
            <i className="bi bi-clock me-2" aria-hidden="true" />
            تغییر محدودیت زمان
          </Dropdown.Item>
          <Dropdown.Item className="text-danger" onClick={() => setOpenModal('delete')}>
            <i className="bi bi-trash3 me-2" aria-hidden="true" />
            حذف
          </Dropdown.Item>
          {showLogsLink && (
            <>
              <Dropdown.Divider />
              <Dropdown.Item as="a" href={logsUrl}>
                <i className="bi bi-card-list me-2" aria-hidden="true" />
                مشاهده گزارش‌ها
              </Dropdown.Item>
            </>
          )}
        </Dropdown.Menu>
      </Dropdown>

      <JobActionModalWithIds
        action="grade"
        show={openModal === 'grade'}
        target={target}
        courseInstanceId={courseInstanceId}
        onHide={() => setOpenModal(null)}
      />
      <JobActionModalWithIds
        action="gradeAndClose"
        show={openModal === 'gradeAndClose'}
        target={target}
        courseInstanceId={courseInstanceId}
        onHide={() => setOpenModal(null)}
      />

      <RegradeInstancesModal
        show={openModal === 'regrade'}
        target={target}
        courseInstanceId={courseInstanceId}
        onHide={() => setOpenModal(null)}
      />

      <DeleteInstancesModal
        show={openModal === 'delete'}
        target={target}
        onHide={() => setOpenModal(null)}
        onSuccess={() => {
          onActionSuccess({
            message: isAllInstancesTarget
              ? 'همه آزمون‌ها حذف شدند.'
              : `${count} آزمون حذف شد.`,
            action: 'delete',
          });
          setOpenModal(null);
        }}
      />

      <TimeLimitModal
        show={openModal === 'timeLimit'}
        target={target}
        timezone={timezone}
        onHide={() => setOpenModal(null)}
        onSuccess={() => {
          onActionSuccess({
            message: isAllInstancesTarget
              ? 'محدودیت زمان برای همه آزمون‌ها به‌روزرسانی شد.'
              : `محدودیت زمان برای ${count} آزمون به‌روزرسانی شد.`,
            action: 'timeLimit',
          });
          setOpenModal(null);
        }}
      />
    </>
  );
}

function JobActionModalWithIds({
  action,
  target,
  courseInstanceId,
  show,
  onHide,
}: {
  action: JobAction;
  target: AssessmentInstanceActionTarget;
  courseInstanceId: string;
  show: boolean;
  onHide: () => void;
}) {
  const trpc = useTRPC();
  const assessmentInstanceIds = getTargetAssessmentInstanceIds(target);
  const mutationOptions = {
    grade: trpc.assessmentInstances.grade.mutationOptions(),
    gradeAndClose: trpc.assessmentInstances.gradeAndClose.mutationOptions(),
  }[action];
  const labels = {
    grade: {
      title: `تصحیح ${describeTargetForTitle(target)}`,
      body: 'تصحیح ارسال‌های در انتظار برای',
      confirm: 'تصحیح',
    },
    gradeAndClose: {
      title: `تصحیح و بستن ${describeTargetForTitle(target)}`,
      body: 'تصحیح و بستن',
      confirm: 'تصحیح و بستن',
    },
  }[action];

  const mutation = useMutation({
    ...mutationOptions,
    onSuccess: ({ jobSequenceId }) => {
      window.location.assign(getCourseInstanceJobSequenceUrl(courseInstanceId, jobSequenceId));
    },
  });
  const appError = getAppError<AssessmentInstancesError[JobAction]>(mutation.error);

  return (
    <Modal show={show} onHide={onHide} onExited={() => mutation.reset()}>
      <Modal.Header closeButton>
        <Modal.Title>{labels.title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>
          آیا مطمئن هستید که می‌خواهید عملیات {labels.body}{' '}
          <strong>{describeTargetInstances(target)}</strong> را انجام دهید؟ این عمل قابل بازگشت نیست.
        </p>
        <AppErrorAlert
          error={appError}
          render={{ UNKNOWN: ({ message }) => message }}
          onDismiss={() => mutation.reset()}
        />
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          انصراف
        </Button>
        <Button
          variant="primary"
          disabled={mutation.isPending}
          onClick={() => mutation.mutate({ assessmentInstanceIds })}
        >
          {mutation.isPending ? 'در حال انجام...' : labels.confirm}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

function RegradeInstancesModal({
  target,
  courseInstanceId,
  show,
  onHide,
}: {
  target: AssessmentInstanceActionTarget;
  courseInstanceId: string;
  show: boolean;
  onHide: () => void;
}) {
  const trpc = useTRPC();
  const assessmentInstanceIds = getTargetAssessmentInstanceIds(target);
  const previewQuery = useQuery({
    ...trpc.assessmentInstances.regradePreview.queryOptions({ assessmentInstanceIds }),
    enabled: show,
  });
  const mutation = useMutation({
    ...trpc.assessmentInstances.regrade.mutationOptions(),
    onSuccess: ({ jobSequenceId }) => {
      window.location.assign(getCourseInstanceJobSequenceUrl(courseInstanceId, jobSequenceId));
    },
  });
  const appError = getAppError<AssessmentInstancesError['regrade']>(mutation.error);
  const questions = previewQuery.data ?? [];

  return (
    <Modal show={show} onHide={onHide} onExited={() => mutation.reset()}>
      <Modal.Header closeButton>
        <Modal.Title>{`تصحیح مجدد ${describeTargetForTitle(target)}`}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>
          تصحیح مجدد، نمره <strong>{describeTargetInstances(target)}</strong> را دوباره محاسبه کرده
          و برای سوالاتی که با <code>forceMaxPoints</code> پیکربندی شده‌اند نمره کامل در نظر
          می‌گیرد. این کار نمرات ذخیره‌شده را بدون ارزیابی مجدد ارسال‌های دانشجو به‌روزرسانی
          می‌کند.
        </p>
        {previewQuery.isPending ? (
          <div className="d-flex align-items-center gap-2 text-muted">
            <Spinner animation="border" size="sm" /> در حال بررسی سوالاتی که تغییر خواهند کرد…
          </div>
        ) : previewQuery.isError ? (
          <p className="text-muted mb-0">بارگذاری فهرست سوالات متاثر ناموفق بود.</p>
        ) : questions.length > 0 ? (
          <PendingRegradeQuestionList questions={questions} />
        ) : (
          <p className="text-muted mb-0">{describeNoRegradeQuestions(target)}</p>
        )}
        <p className="mt-3 mb-0">این عمل قابل بازگشت نیست.</p>
        <AppErrorAlert
          error={appError}
          className="mt-3 mb-0"
          render={{ UNKNOWN: ({ message }) => message }}
          onDismiss={() => mutation.reset()}
        />
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          انصراف
        </Button>
        <Button
          variant="primary"
          disabled={mutation.isPending}
          onClick={() => mutation.mutate({ assessmentInstanceIds })}
        >
          {mutation.isPending ? 'در حال انجام...' : 'تصحیح مجدد'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

function DeleteInstancesModal({
  target,
  show,
  onHide,
  onSuccess,
}: {
  target: AssessmentInstanceActionTarget;
  show: boolean;
  onHide: () => void;
  onSuccess: () => void;
}) {
  const trpc = useTRPC();
  const assessmentInstanceIds = getTargetAssessmentInstanceIds(target);
  const invalidateList = useInvalidateAssessmentInstancesList();
  const mutation = useMutation({
    ...trpc.assessmentInstances.delete.mutationOptions(),
    onSuccess: async () => {
      await invalidateList();
      onSuccess();
    },
  });
  const appError = getAppError<AssessmentInstancesError['delete']>(mutation.error);

  return (
    <Modal show={show} onHide={onHide} onExited={() => mutation.reset()}>
      <Modal.Header closeButton>
        <Modal.Title>{`حذف ${describeTargetForTitle(target)}`}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>
          آیا مطمئن هستید که می‌خواهید <strong>{describeTargetAssessmentInstances(target)}</strong> را
          حذف کنید؟ این عمل قابل بازگشت نیست.
        </p>
        <AppErrorAlert
          error={appError}
          render={{ UNKNOWN: ({ message }) => message }}
          onDismiss={() => mutation.reset()}
        />
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          انصراف
        </Button>
        <Button
          variant="danger"
          disabled={mutation.isPending}
          onClick={() => mutation.mutate({ assessmentInstanceIds })}
        >
          {mutation.isPending ? 'در حال حذف...' : `حذف ${describeTargetInstances(target)}`}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
