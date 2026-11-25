import { type UseQueryResult, useMutation } from '@tanstack/react-query';
import type { TRPCClientErrorLike } from '@trpc/client';
import type { inferRouterOutputs } from '@trpc/server';
import clsx from 'clsx';
import { useEffect, useState } from 'react';
import {
  Alert,
  Button,
  ButtonGroup,
  Dropdown,
  DropdownButton,
  Modal,
  Spinner,
} from 'react-bootstrap';
import { useForm } from 'react-hook-form';

import { run } from '@prairielearn/run';
import { getAppError } from '@prairielearn/trpc/client';
import { AppErrorAlert } from '@prairielearn/trpc/react';
import { useModalState } from '@prairielearn/ui';

import type { StaffAssessment, StaffAssessmentSet } from '../../../lib/client/safe-db-types.js';
import {
  getAssessmentDownloadUrl,
  getCourseInstanceJobSequenceUrl,
} from '../../../lib/client/url.js';
import type { GroupUsersRow } from '../../../models/group.js';
import type { AssessmentGroupsError } from '../../../trpc/assessment/assessment-groups.js';
import { useTRPC } from '../../../trpc/assessment/context.js';
import type { AssessmentRouter } from '../../../trpc/assessment/trpc.js';
import type { ActionAccess } from '../types.js';

function formatRelativeTimeFa(fromMs: number, toMs: number): string {
  const diffSec = Math.max(0, Math.floor((toMs - fromMs) / 1000));
  if (diffSec < 60) return 'لحظاتی پیش';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} دقیقه پیش`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr} ساعت پیش`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay} روز پیش`;
}

type MembershipData = inferRouterOutputs<AssessmentRouter>['assessmentGroups']['membership'];

function EditGroupModal({
  row,
  show,
  onHide,
  onGroupMembershipChanged,
}: {
  row: GroupUsersRow;
  show: boolean;
  onHide: () => void;
  onGroupMembershipChanged: () => void;
}) {
  const trpc = useTRPC();
  const mutation = useMutation(trpc.assessmentGroups.editGroup.mutationOptions());
  const appError = getAppError<AssessmentGroupsError['EditGroup']>(mutation.error);
  const failures = mutation.data?.failures ?? [];

  const currentUids = row.users.map((u) => u.uid).join(', ');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<{ uids: string }>({ values: { uids: currentUids } });

  const onSubmit = (data: { uids: string }) => {
    mutation.mutate(
      { groupId: row.group_id, uids: data.uids },
      {
        onSuccess: ({ failures }) => {
          onGroupMembershipChanged();
          if (failures.length === 0) {
            reset();
            mutation.reset();
            onHide();
          }
        },
      },
    );
  };

  const handleHide = () => {
    reset();
    mutation.reset();
    onHide();
  };

  const uidsInputId = `editGroupUids-${row.group_id}`;
  const uidsErrorId = `editGroupUidsError-${row.group_id}`;

  return (
    <Modal show={show} onHide={handleHide}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Modal.Header>
          <Modal.Title>ویرایش گروه</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {appError && (
            <Alert variant="danger" dismissible onClose={() => mutation.reset()}>
              {appError.message}
            </Alert>
          )}
          {failures.length > 0 && (
            <Alert variant="warning" dismissible onClose={() => mutation.reset()}>
              <strong>برخی تغییرات اعمال نشدند:</strong>
              <ul className="mb-0">
                {failures.map((f) => (
                  <li key={f.uid}>
                    {f.uid}: {f.message}
                  </li>
                ))}
              </ul>
            </Alert>
          )}
          <div className="mb-3">
            <label className="form-label" htmlFor={`editGroupName-${row.group_id}`}>
              نام گروه
            </label>
            <input
              type="text"
              className="form-control"
              id={`editGroupName-${row.group_id}`}
              value={row.name}
              readOnly
            />
          </div>
          <div className="mb-3">
            <label className="form-label" htmlFor={uidsInputId}>
              شناسه‌های کاربری (UIDs)
            </label>
            <textarea
              className={clsx('form-control', errors.uids && 'is-invalid')}
              id={uidsInputId}
              rows={5}
              placeholder="student1@example.com, student2@example.com"
              aria-invalid={errors.uids ? 'true' : undefined}
              {...(errors.uids ? { 'aria-errormessage': uidsErrorId } : {})}
              defaultValue={currentUids}
              {...register('uids')}
            />
            {errors.uids && (
              <div id={uidsErrorId} className="invalid-feedback">
                {errors.uids.message}
              </div>
            )}
            <small className="form-text text-muted">
              شناسه‌های متعدد را با کاما (،) یا ویرگول انگلیسی (,) جدا کنید. این فهرست جایگزین اعضای
              فعلی می‌شود.
            </small>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <button type="button" className="btn btn-secondary" onClick={handleHide}>
            انصراف
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting || mutation.isPending}
          >
            ذخیره
          </button>
        </Modal.Footer>
      </form>
    </Modal>
  );
}

function DeleteGroupModal({
  row,
  show,
  onHide,
  onGroupMembershipChanged,
}: {
  row: GroupUsersRow;
  show: boolean;
  onHide: () => void;
  onGroupMembershipChanged: () => void;
}) {
  const trpc = useTRPC();
  const mutation = useMutation(trpc.assessmentGroups.deleteGroup.mutationOptions());
  const appError = getAppError<AssessmentGroupsError['DeleteGroup']>(mutation.error);

  const handleHide = () => {
    mutation.reset();
    onHide();
  };

  return (
    <Modal show={show} onHide={handleHide}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          mutation.mutate(
            { groupId: row.group_id },
            {
              onSuccess: () => {
                onGroupMembershipChanged();
                mutation.reset();
                onHide();
              },
            },
          );
        }}
      >
        <Modal.Header>
          <Modal.Title>حذف گروه</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {appError && (
            <Alert variant="danger" dismissible onClose={() => mutation.reset()}>
              {appError.message}
            </Alert>
          )}
          <p>
            آیا از حذف گروه <strong>{row.name}</strong> مطمئن هستید؟
          </p>
        </Modal.Body>
        <Modal.Footer>
          <button type="button" className="btn btn-secondary" onClick={handleHide}>
            انصراف
          </button>
          <button type="submit" className="btn btn-danger" disabled={mutation.isPending}>
            حذف
          </button>
        </Modal.Footer>
      </form>
    </Modal>
  );
}

function UploadAssessmentGroupsModal({
  csrfToken,
  show,
  onHide,
}: {
  csrfToken: string;
  show: boolean;
  onHide: () => void;
}) {
  return (
    <Modal show={show} onHide={onHide}>
      <form method="POST" encType="multipart/form-data">
        <Modal.Header>
          <Modal.Title>بارگذاری اعضای گروه‌ها</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>یک فایل CSV با قالب زیر بارگذاری کنید:</p>
          <pre className="ms-4">
            {`group_name,uid
groupA,one@example.com
groupA,two@example.com
groupB,three@example.com
groupB,four@example.com`}
          </pre>
          <p>
            ستون <code>group_name</code> باید یک شناسه یکتا برای هر گروه باشد. برای تغییر
            گروه‌بندی، شناسه‌های کاربری (uid) را به نام گروه مورد نظر متصل کنید.
          </p>
          <div className="mb-3">
            <label className="form-label" htmlFor="uploadAssessmentGroupsFileInput">
              انتخاب فایل CSV
            </label>
            <input
              type="file"
              accept=".csv"
              name="file"
              className="form-control"
              id="uploadAssessmentGroupsFileInput"
            />
          </div>
        </Modal.Body>
        <Modal.Footer>
          <input type="hidden" name="__action" value="upload_assessment_groups" />
          <input type="hidden" name="__csrf_token" value={csrfToken} />
          <button type="button" className="btn btn-secondary" onClick={onHide}>
            انصراف
          </button>
          <button type="submit" className="btn btn-primary">
            بارگذاری
          </button>
        </Modal.Footer>
      </form>
    </Modal>
  );
}

function RandomAssessmentGroupsModal({
  minGroupSize,
  maxGroupSize,
  courseInstanceId,
  show,
  onHide,
}: {
  minGroupSize: number;
  maxGroupSize: number;
  courseInstanceId: string;
  show: boolean;
  onHide: () => void;
}) {
  const trpc = useTRPC();
  const mutation = useMutation(trpc.assessmentGroups.randomizeGroups.mutationOptions());
  const appError = getAppError<AssessmentGroupsError['RandomizeGroups']>(mutation.error);

  const {
    register,
    handleSubmit,
    reset,
    getValues,
    formState: { isSubmitting, errors, isValid },
  } = useForm<{ minGroupSize: number; maxGroupSize: number }>({
    mode: 'onChange',
    values: { minGroupSize, maxGroupSize },
  });

  const onSubmit = (data: { minGroupSize: number; maxGroupSize: number }) => {
    mutation.mutate(data, {
      onSuccess: ({ jobSequenceId }) => {
        window.location.href = getCourseInstanceJobSequenceUrl(courseInstanceId, jobSequenceId);
      },
    });
  };

  const handleHide = () => {
    reset({ minGroupSize, maxGroupSize });
    mutation.reset();
    onHide();
  };

  return (
    <Modal show={show} onHide={handleHide}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Modal.Header>
          <Modal.Title>اختصاص تصادفی دانشجویان</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <AppErrorAlert
            error={appError}
            render={{
              UNKNOWN: ({ message }) => message,
            }}
            onDismiss={() => mutation.reset()}
          />
          <p className="text-muted small">
            دانشجویان بدون گروه به صورت تصادفی و بر اساس محدودیت‌های اندازه زیر در گروه‌های جدید
            توزیع می‌شوند. دانشجویانی که از قبل در یک گروه هستند تحت تاثیر قرار نمی‌گیرند.
          </p>
          <div className="row g-3">
            <div className="col-6">
              <label className="form-label" htmlFor="formMin">
                حداقل اعضا
              </label>
              <input
                type="number"
                className={clsx('form-control', errors.minGroupSize && 'is-invalid')}
                id="formMin"
                defaultValue={minGroupSize}
                aria-invalid={errors.minGroupSize ? 'true' : undefined}
                aria-errormessage={errors.minGroupSize ? 'formMinError' : undefined}
                {...register('minGroupSize', {
                  valueAsNumber: true,
                  required: 'الزامی است.',
                  min: { value: 1, message: 'باید حداقل ۱ باشد.' },
                  deps: ['maxGroupSize'],
                  validate: (value) => {
                    const max = getValues('maxGroupSize');
                    if (Number.isFinite(value) && Number.isFinite(max) && value > max) {
                      return 'باید ≤ حداکثر اعضا باشد.';
                    }
                    return true;
                  },
                })}
              />
              {errors.minGroupSize && (
                <div id="formMinError" className="text-danger small">
                  {errors.minGroupSize.message}
                </div>
              )}
            </div>
            <div className="col-6">
              <label className="form-label" htmlFor="formMax">
                حداکثر اعضا
              </label>
              <input
                type="number"
                className={clsx('form-control', errors.maxGroupSize && 'is-invalid')}
                id="formMax"
                defaultValue={maxGroupSize}
                aria-invalid={errors.maxGroupSize ? 'true' : undefined}
                aria-errormessage={errors.maxGroupSize ? 'formMaxError' : undefined}
                {...register('maxGroupSize', {
                  valueAsNumber: true,
                  required: 'الزامی است.',
                  min: { value: 1, message: 'باید حداقل ۱ باشد.' },
                  deps: ['minGroupSize'],
                  validate: (value) => {
                    const min = getValues('minGroupSize');
                    if (Number.isFinite(value) && Number.isFinite(min) && value < min) {
                      return 'باید ≥ حداقل اعضا باشد.';
                    }
                    return true;
                  },
                })}
              />
              {errors.maxGroupSize && (
                <div id="formMaxError" className="text-danger small">
                  {errors.maxGroupSize.message}
                </div>
              )}
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <button type="button" className="btn btn-secondary" onClick={handleHide}>
            انصراف
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={!isValid || isSubmitting || mutation.isPending}
          >
            اختصاص
          </button>
        </Modal.Footer>
      </form>
    </Modal>
  );
}

function AddGroupModal({
  show,
  onHide,
  onGroupMembershipChanged,
}: {
  show: boolean;
  onHide: () => void;
  onGroupMembershipChanged: () => void;
}) {
  const trpc = useTRPC();
  const mutation = useMutation(trpc.assessmentGroups.addGroup.mutationOptions());
  const appError = getAppError<AssessmentGroupsError['AddGroup']>(mutation.error);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<{ groupName: string; uids: string }>({
    defaultValues: { groupName: '', uids: '' },
  });

  const onSubmit = (data: { groupName: string; uids: string }) => {
    mutation.mutate(data, {
      onSuccess: () => {
        onGroupMembershipChanged();
        reset();
        mutation.reset();
        onHide();
      },
    });
  };

  const handleHide = () => {
    reset();
    mutation.reset();
    onHide();
  };

  return (
    <Modal show={show} onHide={handleHide}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Modal.Header>
          <Modal.Title>افزودن گروه</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {appError && (
            <Alert variant="danger" dismissible onClose={() => mutation.reset()}>
              {appError.message}
            </Alert>
          )}
          <div className="mb-3">
            <label className="form-label" htmlFor="formName">
              نام گروه
            </label>
            <input
              type="text"
              className={clsx('form-control', errors.groupName && 'is-invalid')}
              id="formName"
              aria-describedby="addGroupNameHelp"
              aria-invalid={errors.groupName ? 'true' : undefined}
              {...(errors.groupName ? { 'aria-errormessage': 'addGroupNameError' } : {})}
              maxLength={30}
              defaultValue=""
              {...register('groupName', {
                pattern: {
                  value: /^[0-9a-zA-Z]*$/,
                  message: 'فقط حروف انگلیسی و اعداد مجاز هستند.',
                },
                maxLength: { value: 30, message: 'حداکثر ۳۰ کاراکتر استفاده کنید.' },
              })}
            />
            {errors.groupName && (
              <div id="addGroupNameError" className="invalid-feedback">
                {errors.groupName.message}
              </div>
            )}
            <small id="addGroupNameHelp" className="form-text text-muted">
              برای استفاده از نام پیش‌فرض خالی بگذارید. در صورت وارد کردن، نام باید حداکثر ۳۰
              کاراکتر بوده و فقط شامل حروف انگلیسی و اعداد باشد.
            </small>
          </div>
          <div className="mb-3">
            <label className="form-label" htmlFor="addGroupUids">
              شناسه‌های کاربری (UIDs)
            </label>
            <textarea
              className={clsx('form-control', errors.uids && 'is-invalid')}
              id="addGroupUids"
              rows={5}
              placeholder="student1@example.com, student2@example.com"
              aria-describedby="addGroupUidsHelp"
              aria-invalid={errors.uids ? 'true' : undefined}
              {...(errors.uids ? { 'aria-errormessage': 'addGroupUidsError' } : {})}
              defaultValue=""
              {...register('uids', { required: 'وارد کردن حداقل یک شناسه کاربری الزامی است.' })}
            />
            {errors.uids && (
              <div id="addGroupUidsError" className="invalid-feedback">
                {errors.uids.message}
              </div>
            )}
            <small id="addGroupUidsHelp" className="form-text text-muted">
              شناسه‌های متعدد را با ویرگول انگلیسی (,) جدا کنید.
            </small>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <button type="button" className="btn btn-secondary" onClick={handleHide}>
            انصراف
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting || mutation.isPending}
          >
            افزودن
          </button>
        </Modal.Footer>
      </form>
    </Modal>
  );
}

function DeleteAllGroupsModal({
  assessmentSetName,
  assessmentNumber,
  show,
  onHide,
  onGroupMembershipChanged,
}: {
  assessmentSetName: string;
  assessmentNumber: string;
  show: boolean;
  onHide: () => void;
  onGroupMembershipChanged: () => void;
}) {
  const trpc = useTRPC();
  const mutation = useMutation(trpc.assessmentGroups.deleteAll.mutationOptions());
  const appError = getAppError<AssessmentGroupsError['DeleteAll']>(mutation.error);

  const handleHide = () => {
    mutation.reset();
    onHide();
  };

  return (
    <Modal show={show} onHide={handleHide}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          mutation.mutate(undefined, {
            onSuccess: () => {
              onGroupMembershipChanged();
              mutation.reset();
              onHide();
            },
          });
        }}
      >
        <Modal.Header>
          <Modal.Title>حذف همه گروه‌های موجود</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {appError && (
            <Alert variant="danger" dismissible onClose={() => mutation.reset()}>
              {appError.message}
            </Alert>
          )}
          <p>
            آیا از حذف تمام گروه‌های موجود برای{' '}
            <strong>
              {assessmentSetName} {assessmentNumber}
            </strong>{' '}
            مطمئن هستید؟ این عمل قابل بازگشت نیست.
          </p>
        </Modal.Body>
        <Modal.Footer>
          <button type="button" className="btn btn-secondary" onClick={handleHide}>
            انصراف
          </button>
          <button type="submit" className="btn btn-danger" disabled={mutation.isPending}>
            حذف همه
          </button>
        </Modal.Footer>
      </form>
    </Modal>
  );
}

function GroupRow({
  row,
  canEdit,
  onEdit,
  onDelete,
}: {
  row: GroupUsersRow;
  canEdit: boolean;
  onEdit: (row: GroupUsersRow) => void;
  onDelete: (row: GroupUsersRow) => void;
}) {
  return (
    <tr>
      <td className="pe-3 text-nowrap">{row.name}</td>
      <td className="pe-3 text-nowrap">
        <i className="bi bi-people text-muted me-1" aria-hidden="true" />
        {row.size}
      </td>
      <td>
        {row.users.length > 0 ? (
          <div className="d-flex flex-wrap gap-1">
            {row.users.map((user) => (
              <span key={user.id} className="badge rounded-pill bg-light text-dark border">
                {user.uid}
              </span>
            ))}
          </div>
        ) : (
          <small className="text-muted">(خالی)</small>
        )}
      </td>

      {canEdit && (
        <td className="text-end">
          <div className="d-inline-flex gap-2">
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary"
              aria-label={`ویرایش ${row.name}`}
              onClick={() => onEdit(row)}
            >
              <i className="bi bi-pencil" aria-hidden="true" />
            </button>
            <button
              type="button"
              className="btn btn-sm btn-outline-danger"
              aria-label={`حذف ${row.name}`}
              onClick={() => onDelete(row)}
            >
              <i className="bi bi-trash" aria-hidden="true" />
            </button>
          </div>
        </td>
      )}
    </tr>
  );
}

export function GroupsCard({
  groupsCsvFilename,
  membershipQuery,
  assessment,
  assessmentSet,
  courseInstanceId,
  csrfToken,
  editAccess,
  minGroupSize,
  maxGroupSize,
  onRefresh,
}: {
  groupsCsvFilename: string;
  membershipQuery: UseQueryResult<MembershipData, TRPCClientErrorLike<AssessmentRouter>>;
  assessment: StaffAssessment;
  assessmentSet: StaffAssessmentSet;
  courseInstanceId: string;
  csrfToken: string;
  editAccess: ActionAccess;
  minGroupSize: number;
  maxGroupSize: number;
  onRefresh: () => void;
}) {
  const { groups, notAssigned } = membershipQuery.data ?? { groups: [], notAssigned: [] };
  const [now, setNow] = useState(() => Date.now());
  const canEdit = editAccess.status === 'allowed';

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000);
    return () => clearInterval(id);
  }, []);
  const uploadModal = useModalState<null>();
  const randomModal = useModalState<null>();
  const addModal = useModalState<null>();
  const deleteAllModal = useModalState<null>();
  const editModal = useModalState<GroupUsersRow>();
  const deleteModal = useModalState<GroupUsersRow>();

  const groupCount = groups.length;
  const assignmentSummary = run(() => {
    const unassignedCount = notAssigned.length;
    const assignedCount = groups.reduce((sum, g) => sum + g.size, 0);
    const totalStudents = unassignedCount + assignedCount;
    if (totalStudents === 0) return null;
    if (unassignedCount === 0) return 'همه دانشجویان گروه‌بندی شده‌اند';
    if (assignedCount === 0) {
      return `${unassignedCount} دانشجو بدون گروه`;
    }
    return `${assignedCount} گروه‌بندی‌شده · ${unassignedCount} بدون گروه`;
  });

  return (
    <>
      {canEdit && (
        <>
          <UploadAssessmentGroupsModal
            csrfToken={csrfToken}
            show={uploadModal.show}
            onHide={uploadModal.hide}
          />
          <RandomAssessmentGroupsModal
            minGroupSize={minGroupSize}
            maxGroupSize={maxGroupSize}
            courseInstanceId={courseInstanceId}
            show={randomModal.show}
            onHide={randomModal.hide}
          />
          <AddGroupModal
            show={addModal.show}
            onHide={addModal.hide}
            onGroupMembershipChanged={onRefresh}
          />
          <DeleteAllGroupsModal
            assessmentSetName={assessmentSet.name}
            assessmentNumber={assessment.number}
            show={deleteAllModal.show}
            onHide={deleteAllModal.hide}
            onGroupMembershipChanged={onRefresh}
          />
          {editModal.data && (
            <EditGroupModal
              key={editModal.data.group_id}
              row={editModal.data}
              show={editModal.show}
              onHide={editModal.hide}
              onGroupMembershipChanged={onRefresh}
            />
          )}
          {deleteModal.data && (
            <DeleteGroupModal
              key={deleteModal.data.group_id}
              row={deleteModal.data}
              show={deleteModal.show}
              onHide={deleteModal.hide}
              onGroupMembershipChanged={onRefresh}
            />
          )}
        </>
      )}
      <div className="card">
        <div className="card-body">
          <div className="d-flex flex-column flex-md-row justify-content-md-between align-items-md-start gap-3 mb-3">
            <div>
              <h5 className="mb-1">گروه‌ها</h5>
              <div className="text-muted small">
                {groupCount} گروه
                {assignmentSummary && (
                  <>
                    {' · '}
                    {assignmentSummary}
                  </>
                )}
                {membershipQuery.data ? (
                  <>
                    {' · به‌روزرسانی‌شده '}
                    {formatRelativeTimeFa(
                      membershipQuery.dataUpdatedAt,
                      Math.max(now, membershipQuery.dataUpdatedAt),
                    )}
                  </>
                ) : (
                  membershipQuery.isFetching && <> · در حال بارگذاری...</>
                )}
              </div>
            </div>
            <div className="d-flex gap-2">
              {canEdit && (
                <button
                  type="button"
                  className="btn btn-outline-primary"
                  onClick={() => addModal.showWithData(null)}
                >
                  <i className="bi bi-plus-lg" aria-hidden="true" /> افزودن گروه
                </button>
              )}
              <DropdownButton as={ButtonGroup} title="عملیات" variant="outline-secondary">
                {canEdit && (
                  <Dropdown.Item
                    as="button"
                    type="button"
                    onClick={() => uploadModal.showWithData(null)}
                  >
                    <i className="bi bi-upload me-2" aria-hidden="true" />
                    درون‌ریزی CSV
                  </Dropdown.Item>
                )}
                <Dropdown.Item
                  as="a"
                  href={getAssessmentDownloadUrl({
                    courseInstanceId,
                    assessmentId: assessment.id,
                    filename: groupsCsvFilename,
                  })}
                >
                  <i className="bi bi-download me-2" aria-hidden="true" />
                  خروجی CSV
                </Dropdown.Item>
                {canEdit && (
                  <>
                    <Dropdown.Divider />
                    <Dropdown.Item
                      as="button"
                      type="button"
                      className="text-danger"
                      onClick={() => deleteAllModal.showWithData(null)}
                    >
                      <i className="bi bi-trash me-2" aria-hidden="true" />
                      حذف همه
                    </Dropdown.Item>
                  </>
                )}
              </DropdownButton>
              <Button
                variant="outline-secondary"
                aria-label="به‌روزرسانی گروه‌ها"
                disabled={membershipQuery.isFetching}
                onClick={onRefresh}
              >
                {membershipQuery.isFetching ? (
                  <Spinner as="span" size="sm" animation="border" aria-hidden="true" />
                ) : (
                  <i className="bi bi-arrow-clockwise" aria-hidden="true" />
                )}
              </Button>
            </div>
          </div>

          {editAccess.status === 'denied' && (
            <Alert variant="info" className="mb-3">
              {editAccess.reason}
            </Alert>
          )}

          {membershipQuery.isError && (
            <Alert variant="danger" className="mb-3">
              به‌روزرسانی عضویت گروه‌ها ناموفق بود. {membershipQuery.error.message}
            </Alert>
          )}

          {notAssigned.length > 0 && (
            <Alert
              variant="warning"
              className="d-flex flex-column flex-md-row justify-content-md-between align-items-md-baseline gap-3"
            >
              <div className="flex-grow-1">
                <details>
                  <summary className="fw-semibold">
                    {notAssigned.length} دانشجو به گروهی اختصاص نیافته است
                  </summary>
                  <ul className="mb-0 mt-2 small">
                    {notAssigned.map((uid) => (
                      <li key={uid}>{uid}</li>
                    ))}
                  </ul>
                </details>
              </div>
              {canEdit && (
                <button
                  type="button"
                  className="btn btn-outline-secondary text-nowrap"
                  onClick={() => randomModal.showWithData(null)}
                >
                  <i className="bi bi-shuffle" aria-hidden="true" /> اختصاص تصادفی
                </button>
              )}
            </Alert>
          )}

          <div className="table-responsive">
            <table className="table table-hover align-middle mb-0" aria-label="گروه‌ها">
              <thead>
                <tr>
                  <th className="pe-3 text-nowrap">نام</th>
                  <th className="pe-3 text-nowrap">تعداد اعضا</th>
                  <th>اعضا</th>
                  {canEdit && <th />}
                </tr>
              </thead>
              <tbody>
                {groups.length > 0 ? (
                  groups.map((row) => (
                    <GroupRow
                      key={row.group_id}
                      row={row}
                      canEdit={canEdit}
                      onEdit={editModal.showWithData}
                      onDelete={deleteModal.showWithData}
                    />
                  ))
                ) : (
                  <tr className="text-center text-muted">
                    <td colSpan={canEdit ? 4 : 3} className="py-4">
                      <i className="bi bi-people me-2" aria-hidden="true" />
                      گروهی ایجاد نشده است
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}
