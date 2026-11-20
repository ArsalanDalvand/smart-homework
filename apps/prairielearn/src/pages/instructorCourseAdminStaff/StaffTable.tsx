import { QueryClient, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  type ColumnPinningState,
  type RowSelectionState,
  type SortingState,
} from '@tanstack/react-table';
import type { inferRouterOutputs } from '@trpc/server';
import clsx from 'clsx';
import { parseAsString, useQueryState } from 'nuqs';
import { type ReactNode, useMemo, useState } from 'react';
import { Button, ButtonGroup, Dropdown, Modal } from 'react-bootstrap';

import { run } from '@prairielearn/run';
import { getAppError } from '@prairielearn/trpc/client';
import { AppErrorAlert, QueryClientProviderDebug } from '@prairielearn/trpc/react';
import {
  type ColumnFilterEntry,
  IndeterminateCheckbox,
  MultiSelectColumnFilter,
  type MultiSelectFilterValue,
  NuqsAdapter,
  OverlayTrigger,
  type OverlayTriggerProps,
  TanstackTableCard,
  type TanstackTableCoreInstance,
  type TanstackTableHeader,
  applyMultiSelectFilter,
  createTanstackTableColumnHelper,
  parseAsColumnPinningState,
  parseAsMultiSelectFilter,
  parseAsSortingState,
  useColumnFilters,
  useColumnVisibilityQueryState,
  usePruneRowSelection,
  useTanstackTable,
} from '@prairielearn/ui';

import type { CourseInstanceAuthz } from '../../models/course-instances.js';
import { createCourseTrpcClient } from '../../trpc/course/client.js';
import { TRPCProvider, useTRPC } from '../../trpc/course/context.js';
import type { CourseStaffError } from '../../trpc/course/course-staff.js';
import type { CourseRouter } from '../../trpc/course/trpc.js';

import { StaffCsvImportModal } from './StaffCsvImportModal.js';

type CourseUsersRow = inferRouterOutputs<CourseRouter>['courseStaff']['list'][number];
type ColumnFilter = (props: { header: TanstackTableHeader<CourseUsersRow> }) => ReactNode;

function useInvalidateStaffList() {
  const queryClient = useQueryClient();
  const trpc = useTRPC();
  return () => queryClient.invalidateQueries(trpc.courseStaff.list.queryFilter());
}

const COURSE_ROLE_VALUES = ['None', 'Previewer', 'Viewer', 'Editor', 'Owner'] as const;
type CourseRole = (typeof COURSE_ROLE_VALUES)[number];

const ROLE_DESCRIPTIONS: Record<CourseRole, string> = {
  None: 'فاقد دسترسی به محتوای این درس.',
  Previewer:
    'مشاهده‌گر پیش‌نمایش (Previewer): مشاهده تمامی سوالات، آزمون‌ها و دوره‌ها بدون دسترسی به کدهای منبع یا تنظیمات.',
  Viewer:
    'بیننده (Viewer): مشاهده سوالات و آزمون‌ها و دریافت فایل‌های پیکربندی بدون امکان ویرایش.',
  Editor:
    'ویرایشگر (Editor): امکان طراحی و ویرایش کامل سوالات، تکالیف، آزمون‌ها و فایل‌های پیکربندی درس و همگام‌سازی با گیت.',
  Owner:
    'مالک / استاد اصلی (Owner): دسترسی کامل مدیریتی به درس، ویرایش محتوا، مدیریت دسترسی کادر آموزشی، دستیاران و مدرسان.',
};

const LEARN_MORE_LINK = (
  <div className="text-start text-secondary mt-2 form-text">
    <a href="https://docs.prairielearn.com/course/#course-staff" target="_blank" rel="noreferrer">
      راهنمای کامل سطوح دسترسی کادر آموزشی و داده‌های دانشجویان
    </a>
  </div>
);

const INSTANCE_ROLE_VALUES = ['None', 'Student Data Viewer', 'Student Data Editor'] as const;
type InstanceRole = (typeof INSTANCE_ROLE_VALUES)[number];

const INSTANCE_ROLE_LABELS: Record<InstanceRole, string> = {
  None: 'None',
  'Student Data Viewer': 'Viewer (بیننده)',
  'Student Data Editor': 'Editor (مصحح)',
};

const INSTANCE_ROLE_DESCRIPTIONS: Record<InstanceRole, string> = {
  None: 'فاقد دسترسی به نمرات و داده‌های دانشجویان در این ترم.',
  'Student Data Viewer':
    'مشاهده‌گر داده‌های دانشجویان: مشاهده نمرات و پاسخ‌ها بدون امکان تغییر نمره یا تصحیح دستی.',
  'Student Data Editor':
    'دستیار آموزشی / مصحح: دسترسی به نمرات و پاسخ‌ها، امکان تصحیح دستی و نمره‌دهی.',
};

const PERMISSION_POPOVER_CONFIG: OverlayTriggerProps['popperConfig'] = {
  modifiers: [
    {
      name: 'resize',
      enabled: true,
      phase: 'write',
      // Role descriptions and error messages can change the popover's size while it's open.
      effect: ({ state, instance }) => {
        const observer = new ResizeObserver(() => void instance.update());
        observer.observe(state.elements.popper);
        return () => observer.disconnect();
      },
    },
  ],
};

function SelectAllCheckbox({ table }: { table: TanstackTableCoreInstance<CourseUsersRow> }) {
  const allSelected = table.getIsAllPageRowsSelected();
  return (
    <IndeterminateCheckbox
      checked={allSelected}
      indeterminate={table.getIsSomePageRowsSelected() && !allSelected}
      aria-label="Select all staff"
      onChange={table.getToggleAllPageRowsSelectedHandler()}
    />
  );
}

const columnHelper = createTanstackTableColumnHelper<CourseUsersRow>();

const DEFAULT_SORT: SortingState = [
  { id: 'course_role', desc: true },
  { id: 'uid', desc: false },
];
const DEFAULT_PINNING: ColumnPinningState = { start: ['select', 'uid'], end: [] };

const EMPTY_COURSE_ROLE_FILTER: MultiSelectFilterValue<CourseRole> = {
  values: [],
  mode: 'include',
};
const EMPTY_INSTANCE_ROLE_FILTER: MultiSelectFilterValue<InstanceRole> = {
  values: [],
  mode: 'include',
};

interface StaffTableInnerProps {
  courseInstances: CourseInstanceAuthz[];
  courseUsers: CourseUsersRow[];
  authnUserId: string;
  userId: string;
  isAdministrator: boolean;
  canEdit: boolean;
  uidsLimit: number;
}

function courseRoleColor(role: CourseRole): string {
  switch (role) {
    case 'None':
      return 'light';
    case 'Previewer':
    case 'Viewer':
      return 'primary';
    case 'Editor':
      return 'success';
    case 'Owner':
      return 'warning';
  }
}

function instanceRoleColor(role: InstanceRole): string {
  switch (role) {
    case 'None':
      return 'light';
    case 'Student Data Viewer':
      return 'primary';
    case 'Student Data Editor':
      return 'success';
  }
}

function CoursePermissionCell({
  courseUser,
  canChangeCourseRole,
}: {
  courseUser: CourseUsersRow;
  canChangeCourseRole: boolean;
}) {
  const [show, setShow] = useState(false);
  const currentRole = courseUser.course_permission.course_role ?? 'None';
  const [selectedRole, setSelectedRole] = useState<CourseRole>(currentRole);

  const trpc = useTRPC();
  const invalidateStaffList = useInvalidateStaffList();
  const mutation = useMutation({
    ...trpc.courseStaff.updateCourseRole.mutationOptions(),
    onSuccess: () => {
      setShow(false);
      return invalidateStaffList();
    },
  });
  const appError = getAppError<CourseStaffError['UpdateCourseRole']>(mutation.error);

  if (!canChangeCourseRole) {
    return (
      <span
        className={clsx(
          'd-inline-block rounded px-2 py-1 small',
          `bg-${courseRoleColor(currentRole)}-subtle`,
          `text-${courseRoleColor(currentRole)}-emphasis`,
        )}
        style={{ width: 110 }}
      >
        {currentRole}
      </span>
    );
  }

  return (
    <OverlayTrigger
      show={show}
      trigger="click"
      placement="auto"
      popperConfig={PERMISSION_POPOVER_CONFIG}
      popover={{
        props: {
          id: `course-permission-popover-${courseUser.user.id}`,
          className: 'popover-scrollable',
          style: { maxWidth: '400px' },
        },
        header: 'تغییر سطح دسترسی به محتوای درس',
        body: (
          <div>
            {COURSE_ROLE_VALUES.map((role) => (
              <div key={role} className="form-check">
                <input
                  className="form-check-input"
                  type="radio"
                  name={`course-role-${courseUser.user.id}`}
                  value={role}
                  id={`course-permission-input-${courseUser.user.id}-${role}`}
                  checked={selectedRole === role}
                  onChange={() => setSelectedRole(role)}
                />
                <label
                  className="form-check-label"
                  htmlFor={`course-permission-input-${courseUser.user.id}-${role}`}
                >
                  {role}
                </label>
              </div>
            ))}
            <p className="small text-muted mt-2 mb-0">{ROLE_DESCRIPTIONS[selectedRole]}</p>
            {appError && <div className="alert alert-danger mt-2 mb-0">{appError.message}</div>}
            {LEARN_MORE_LINK}
            <div className="mt-3 text-end">
              <button type="button" className="btn btn-secondary" onClick={() => setShow(false)}>
                انصراف
              </button>
              <button
                type="button"
                className="btn btn-primary ms-2"
                disabled={mutation.isPending}
                onClick={() =>
                  mutation.mutate({ userId: courseUser.user.id, courseRole: selectedRole })
                }
              >
                ثبت تغییر سطح دسترسی
              </button>
            </div>
          </div>
        ),
      }}
      rootClose
      onToggle={(nextShow) => {
        if (nextShow) {
          setSelectedRole(currentRole);
          mutation.reset();
        }
        setShow(nextShow);
      }}
    >
      <button
        type="button"
        className={clsx(
          'btn btn-sm dropdown-toggle',
          `bg-${courseRoleColor(currentRole)}-subtle`,
          `text-${courseRoleColor(currentRole)}-emphasis`,
          currentRole === 'None' && 'btn-outline-dark',
        )}
        style={{ width: 110 }}
      >
        {currentRole}
      </button>
    </OverlayTrigger>
  );
}

function CourseInstanceAccessCell({
  courseUser,
  courseInstance,
  canEdit,
}: {
  courseUser: CourseUsersRow;
  courseInstance: CourseInstanceAuthz;
  canEdit: boolean;
}) {
  const existingRole = courseUser.course_instance_roles?.find(
    (cir) => cir.id === courseInstance.id,
  );
  const currentRole: InstanceRole = existingRole?.course_instance_role ?? 'None';
  const [show, setShow] = useState(false);
  const [selectedRole, setSelectedRole] = useState<InstanceRole>(currentRole);

  const trpc = useTRPC();
  const invalidateStaffList = useInvalidateStaffList();
  const mutation = useMutation({
    ...trpc.courseStaff.updateInstanceRole.mutationOptions(),
    onSuccess: () => {
      setShow(false);
      return invalidateStaffList();
    },
  });
  const appError = getAppError<CourseStaffError['UpdateInstanceRole']>(mutation.error);

  if (!canEdit) {
    return (
      <span
        className={clsx(
          'd-inline-block rounded px-2 py-1 small',
          `bg-${instanceRoleColor(currentRole)}-subtle`,
          `text-${instanceRoleColor(currentRole)}-emphasis`,
        )}
        style={{ width: 90 }}
      >
        {INSTANCE_ROLE_LABELS[currentRole]}
      </span>
    );
  }

  return (
    <OverlayTrigger
      show={show}
      trigger="click"
      placement="auto"
      popperConfig={PERMISSION_POPOVER_CONFIG}
      popover={{
        props: {
          id: `ci-permission-popover-${courseUser.user.id}-${courseInstance.id}`,
          className: 'popover-scrollable',
          style: { maxWidth: '400px' },
        },
        header: `تغییر دسترسی به داده‌های دانشجویان در ${courseInstance.short_name}`,
        body: (
          <div>
            {INSTANCE_ROLE_VALUES.map((role) => (
              <div key={role} className="form-check">
                <input
                  className="form-check-input"
                  type="radio"
                  name={`ci-role-${courseUser.user.id}-${courseInstance.id}`}
                  value={role}
                  id={`ci-permission-input-${courseUser.user.id}-${courseInstance.id}-${role}`}
                  checked={selectedRole === role}
                  onChange={() => setSelectedRole(role)}
                />
                <label
                  className="form-check-label"
                  htmlFor={`ci-permission-input-${courseUser.user.id}-${courseInstance.id}-${role}`}
                >
                  {INSTANCE_ROLE_LABELS[role]}
                </label>
              </div>
            ))}
            <p className="small text-muted mt-2 mb-0">{INSTANCE_ROLE_DESCRIPTIONS[selectedRole]}</p>
            {appError && <div className="alert alert-danger mt-2 mb-0">{appError.message}</div>}
            {LEARN_MORE_LINK}
            <div className="mt-3 text-end">
              <button type="button" className="btn btn-secondary" onClick={() => setShow(false)}>
                انصراف
              </button>
              <button
                type="button"
                className="btn btn-primary ms-2"
                disabled={selectedRole === currentRole || mutation.isPending}
                onClick={() =>
                  mutation.mutate({
                    userId: courseUser.user.id,
                    courseInstanceId: courseInstance.id,
                    courseInstanceRole: selectedRole,
                  })
                }
              >
                ثبت دسترسی
              </button>
            </div>
          </div>
        ),
      }}
      rootClose
      onToggle={(nextShow) => {
        if (nextShow) {
          setSelectedRole(currentRole);
          mutation.reset();
        }
        setShow(nextShow);
      }}
    >
      <button
        type="button"
        className={clsx(
          'btn btn-sm dropdown-toggle',
          `bg-${instanceRoleColor(currentRole)}-subtle`,
          `text-${instanceRoleColor(currentRole)}-emphasis`,
          currentRole === 'None' && 'btn-outline-dark',
        )}
        style={{ width: 90 }}
      >
        {INSTANCE_ROLE_LABELS[currentRole]}
      </button>
    </OverlayTrigger>
  );
}

function AddUsersModal({
  show,
  onHide,
  uidsLimit,
  courseInstances,
}: {
  show: boolean;
  onHide: () => void;
  uidsLimit: number;
  courseInstances: CourseInstanceAuthz[];
}) {
  const [uidText, setUidText] = useState('');
  const [courseRole, setCourseRole] = useState<CourseRole>('None');
  const [instanceRoles, setInstanceRoles] = useState<Record<string, string>>({});
  const [warnings, setWarnings] = useState<string[]>([]);
  const [uidError, setUidError] = useState<string | null>(null);

  const resetState = () => {
    setUidText('');
    setCourseRole('None');
    setInstanceRoles({});
    setWarnings([]);
    setUidError(null);
    mutation.reset();
  };

  const trpc = useTRPC();
  const invalidateStaffList = useInvalidateStaffList();
  const mutation = useMutation({
    ...trpc.courseStaff.insertByUserUids.mutationOptions(),
    onSuccess: (data) => {
      if (data.errors.length > 0) {
        setWarnings(data.errors);
      } else {
        onHide();
      }
      return invalidateStaffList();
    },
  });
  const appError = getAppError<CourseStaffError['InsertByUserUids']>(mutation.error);

  const handleSubmit = (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault();
    setWarnings([]);
    const uids = uidText.split(/[,;\s]+/).filter(Boolean);

    if (uids.length === 0) {
      setUidError('Enter at least one UID.');
      return;
    }
    if (uids.length > uidsLimit) {
      setUidError(`Enter at most ${uidsLimit} UIDs at a time. You entered ${uids.length}.`);
      return;
    }
    setUidError(null);

    const courseInstanceChanges = Object.entries(instanceRoles)
      .filter((entry): entry is [string, 'Student Data Viewer' | 'Student Data Editor'] =>
        ['Student Data Viewer', 'Student Data Editor'].includes(entry[1]),
      )
      .map(([ciId, role]) => ({ courseInstanceId: ciId, courseInstanceRole: role }));

    mutation.mutate({
      uids,
      courseRole,
      ...(courseInstanceChanges.length > 0 ? { courseInstanceChanges } : {}),
    });
  };

  return (
    <Modal show={show} onHide={onHide} onExited={resetState} dir="rtl">
      <Modal.Header closeButton style={{ fontFamily: 'var(--font-persian)' }}>
        <Modal.Title>افزودن کاربر به کادر آموزشی</Modal.Title>
      </Modal.Header>
      <form onSubmit={handleSubmit} style={{ fontFamily: 'var(--font-persian)' }}>
        <Modal.Body>
          <p className="form-text">
            از این فرم برای افزودن کاربران به کادر آموزشی درس استفاده نمایید. دسترسی کاربرانی که از قبل
            در کادر آموزشی عضو هستند تنها در صورتی تغییر می‌کند که دسترسی جدید بالاتر از دسترسی فعلی باشد.
            تمامی کاربران جدید سطح دسترسی یکسانی به محتوای درس و داده‌های دانشجویان خواهند داشت.
          </p>
          <div className="mb-3">
            <label className="form-label" htmlFor="addUsersInputUid">
              شناسه کاربری (UID / ایمیل):
            </label>
            <textarea
              className={clsx('form-control text-start', uidError && 'is-invalid')}
              id="addUsersInputUid"
              dir="ltr"
              placeholder="staff1@example.com, staff2@example.com"
              aria-describedby="addUsersInputUidHelp"
              aria-invalid={uidError ? true : undefined}
              aria-errormessage={uidError ? 'addUsersInputUid-error' : undefined}
              value={uidText}
              onChange={(e) => {
                setUidText(e.target.value);
                setUidError(null);
              }}
            />
            {uidError && (
              <div id="addUsersInputUid-error" className="invalid-feedback">
                {uidError}
              </div>
            )}
            <small id="addUsersInputUidHelp" className="form-text text-muted">
              حداکثر {uidsLimit} شناسه کاربری (UID / ایمیل) را با کاما، نقطه ویرگول یا فاصله جدا کنید.
            </small>
          </div>
          <div className="mb-3">
            <label className="form-label" htmlFor="addUsersInputCourseRole">
              دسترسی به محتوای درس:
            </label>
            <select
              className="form-select form-select-sm"
              id="addUsersInputCourseRole"
              value={courseRole}
              required
              onChange={(e) => setCourseRole(e.target.value as CourseRole)}
            >
              <option value="None">بدون دسترسی (None)</option>
              <option value="Previewer">پیش‌نمایش‌دهنده (Previewer)</option>
              <option value="Viewer">مشاهده‌کننده (Viewer)</option>
              <option value="Editor">ویرایشگر (Editor)</option>
              <option value="Owner">مالک درس (Owner)</option>
            </select>
          </div>
          {courseInstances.length > 0 && (
            <>
              <h6 className="fw-bolder">دسترسی به داده‌های دانشجویان</h6>
              <div className="table-responsive" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                <table className="table table-borderless table-sm align-middle mb-0">
                  <tbody>
                    {courseInstances.map((ci) => (
                      <tr key={ci.id}>
                        <td>{ci.short_name}</td>
                        <td>
                          <select
                            className="form-select form-select-sm"
                            value={instanceRoles[ci.id] ?? ''}
                            aria-label={`نقش برای ${ci.short_name}`}
                            onChange={(e) =>
                              setInstanceRoles((prev) => ({ ...prev, [ci.id]: e.target.value }))
                            }
                          >
                            <option value="">بدون دسترسی (None)</option>
                            <option value="Student Data Viewer">مشاهده داده‌های دانشجویان (Viewer)</option>
                            <option value="Student Data Editor">ویرایش داده‌های دانشجویان (Editor)</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
          {warnings.length > 0 && (
            <div className="alert alert-warning mt-3 mb-0">
              <strong>افزودن برخی از کاربران امکان‌پذیر نبود:</strong>
              <ul className="mb-0 mt-1">
                {warnings.map((w) => (
                  <li key={w}>{w}</li>
                ))}
              </ul>
            </div>
          )}
          {appError && <div className="alert alert-danger mt-3 mb-0">{appError.message}</div>}
          {LEARN_MORE_LINK}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onHide}>
            انصراف
          </Button>
          <Button variant="primary" type="submit" disabled={mutation.isPending}>
            {mutation.isPending ? 'در حال افزودن…' : 'افزودن کاربران'}
          </Button>
        </Modal.Footer>
      </form>
    </Modal>
  );
}

function AddUsersButton({
  uidsLimit,
  courseInstances,
}: {
  uidsLimit: number;
  courseInstances: CourseInstanceAuthz[];
}) {
  const [show, setShow] = useState(false);
  return (
    <>
      <Button
        type="button"
        variant="light"
        size="sm"
        aria-label="افزودن کاربر"
        data-testid="add-users-button"
        onClick={() => setShow(true)}
      >
        <i className="fas fa-users me-1" aria-hidden="true" />
        <span className="d-none d-sm-inline">افزودن کاربر</span>
      </Button>
      <AddUsersModal
        courseInstances={courseInstances}
        show={show}
        uidsLimit={uidsLimit}
        onHide={() => setShow(false)}
      />
    </>
  );
}

function BulkDeleteModal({
  show,
  onHide,
  selectedUsers,
}: {
  show: boolean;
  onHide: () => void;
  selectedUsers: CourseUsersRow[];
}) {
  const trpc = useTRPC();
  const invalidateStaffList = useInvalidateStaffList();
  const mutation = useMutation({
    ...trpc.courseStaff.bulkDelete.mutationOptions(),
    onSuccess: () => {
      onHide();
      return invalidateStaffList();
    },
  });
  const appError = getAppError<CourseStaffError['BulkDelete']>(mutation.error);

  return (
    <Modal show={show} onHide={onHide} onExited={() => mutation.reset()} dir="rtl">
      <Modal.Header closeButton style={{ fontFamily: 'var(--font-persian)' }}>
        <Modal.Title>حذف کادر آموزشی انتخاب‌شده</Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ fontFamily: 'var(--font-persian)' }}>
        <p>
          آیا از حذف{' '}
          <strong>
            {selectedUsers.length} کاربر
          </strong>{' '}
          از کادر آموزشی درس اطمینان دارید؟
        </p>
        <ul className="mb-0" style={{ maxHeight: '200px', overflowY: 'auto' }}>
          {selectedUsers.map((u) => (
            <li key={u.user.id}>{u.user.name ?? u.user.uid}</li>
          ))}
        </ul>
        {appError && <div className="alert alert-danger mt-3 mb-0">{appError.message}</div>}
      </Modal.Body>
      <Modal.Footer style={{ fontFamily: 'var(--font-persian)' }}>
        <Button variant="secondary" onClick={onHide}>
          انصراف
        </Button>
        <Button
          variant="danger"
          disabled={mutation.isPending}
          onClick={() => mutation.mutate({ userIds: selectedUsers.map((u) => u.user.id) })}
        >
          {mutation.isPending ? 'در حال حذف…' : `حذف ${selectedUsers.length} کاربر`}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

function BulkEditAccessModal({
  show,
  onHide,
  selectedUsers,
  courseInstances,
}: {
  show: boolean;
  onHide: () => void;
  selectedUsers: CourseUsersRow[];
  courseInstances: CourseInstanceAuthz[];
}) {
  const [courseRole, setCourseRole] = useState<CourseRole | ''>('');
  const [instanceRoles, setInstanceRoles] = useState<Record<string, InstanceRole | ''>>({});

  const resetState = () => {
    setCourseRole('');
    setInstanceRoles({});
    mutation.reset();
  };

  const handleInstanceRoleChange = (ciId: string, role: InstanceRole | '') => {
    setInstanceRoles((prev) => ({ ...prev, [ciId]: role }));
  };

  const configuredInstances = Object.entries(instanceRoles).filter(
    (entry): entry is [string, InstanceRole] => entry[1] !== '',
  );
  const hasChanges = courseRole !== '' || configuredInstances.length > 0;

  const trpc = useTRPC();
  const invalidateStaffList = useInvalidateStaffList();
  const mutation = useMutation({
    ...trpc.courseStaff.bulkEditAccess.mutationOptions(),
    onSuccess: () => {
      onHide();
      return invalidateStaffList();
    },
  });
  const appError = getAppError<CourseStaffError['BulkEditAccess']>(mutation.error);

  const handleSubmit = () => {
    const userIds = selectedUsers.map((u) => u.user.id);
    const courseInstanceChanges = configuredInstances.map(([ciId, role]) => ({
      courseInstanceId: ciId,
      courseInstanceRole: role,
    }));

    mutation.mutate({
      userIds,
      ...(courseRole ? { courseRole } : {}),
      ...(courseInstanceChanges.length > 0 ? { courseInstanceChanges } : {}),
    });
  };

  return (
    <Modal show={show} size="md" onHide={onHide} onExited={resetState} dir="rtl">
      <Modal.Header closeButton style={{ fontFamily: 'var(--font-persian)' }}>
        <Modal.Title>
          ویرایش دسترسی برای {selectedUsers.length} کاربر
        </Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ fontFamily: 'var(--font-persian)' }}>
        <h6 className="fw-bolder" id="course-role-label">
          دسترسی به محتوای درس
        </h6>
        <select
          className="form-select form-select-sm mb-3"
          aria-labelledby="course-role-label"
          value={courseRole}
          onChange={(e) => setCourseRole(e.target.value as CourseRole | '')}
        >
          <option value="">بدون تغییر</option>
          {COURSE_ROLE_VALUES.map((role) => (
            <option key={role} value={role}>
              {role}
            </option>
          ))}
        </select>

        {courseInstances.length > 0 && (
          <>
            <h6 className="fw-bolder">دسترسی به داده‌های دانشجویان</h6>
            <div className="table-responsive" style={{ maxHeight: '300px', overflowY: 'auto' }}>
              <table className="table table-borderless table-sm align-middle mb-0">
                <tbody>
                  {courseInstances.map((ci) => (
                    <tr key={ci.id}>
                      <td>{ci.short_name}</td>
                      <td>
                        <select
                          className="form-select form-select-sm"
                          value={instanceRoles[ci.id] ?? ''}
                          aria-label={`نقش برای ${ci.short_name}`}
                          onChange={(e) =>
                            handleInstanceRoleChange(ci.id, e.target.value as InstanceRole | '')
                          }
                        >
                          <option value="">بدون تغییر</option>
                          <option value="None">بدون دسترسی (حذف دسترسی)</option>
                          <option value="Student Data Viewer">مشاهده داده‌های دانشجویان (Viewer)</option>
                          <option value="Student Data Editor">ویرایش داده‌های دانشجویان (Editor)</option>
                        </select>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
        {appError && <div className="alert alert-danger mt-3 mb-0">{appError.message}</div>}
        {LEARN_MORE_LINK}
      </Modal.Body>
      <Modal.Footer style={{ fontFamily: 'var(--font-persian)' }}>
        <Button variant="secondary" onClick={onHide}>
          انصراف
        </Button>
        <Button
          variant="primary"
          disabled={!hasChanges || mutation.isPending}
          onClick={handleSubmit}
        >
          {mutation.isPending ? 'در حال ذخیره…' : 'ذخیره تغییرات'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

function SelectionToolbar({
  selectedUsers,
  courseInstances,
  isAdministrator,
  authnUserId,
  userId,
}: {
  selectedUsers: CourseUsersRow[];
  courseInstances: CourseInstanceAuthz[];
  isAdministrator: boolean;
  authnUserId: string;
  userId: string;
}) {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditAccessModal, setShowEditAccessModal] = useState(false);

  const modifiableUsers = selectedUsers.filter(
    (u) => (u.user.id !== authnUserId && u.user.id !== userId) || isAdministrator,
  );

  return (
    <>
      <div className="d-flex align-items-center gap-2">
        <Button
          variant="light"
          size="sm"
          disabled={modifiableUsers.length === 0}
          onClick={() => setShowEditAccessModal(true)}
        >
          <i className="fa fa-pen me-1" />
          ویرایش دسترسی‌ها
        </Button>
        <Button
          variant="light"
          size="sm"
          className="text-danger"
          disabled={modifiableUsers.length === 0}
          onClick={() => setShowDeleteModal(true)}
        >
          <i className="fa fa-trash-alt me-1" />
          حذف
        </Button>
      </div>

      <BulkDeleteModal
        show={showDeleteModal}
        selectedUsers={modifiableUsers}
        onHide={() => setShowDeleteModal(false)}
      />
      <BulkEditAccessModal
        show={showEditAccessModal}
        selectedUsers={modifiableUsers}
        courseInstances={courseInstances}
        onHide={() => setShowEditAccessModal(false)}
      />
    </>
  );
}

function StaffTableInner({
  courseInstances,
  courseUsers,
  authnUserId,
  userId,
  isAdministrator,
  canEdit,
  uidsLimit,
}: StaffTableInnerProps) {
  const [showCsvImport, setShowCsvImport] = useState(false);
  const trpc = useTRPC();
  const { data: liveUsers } = useQuery({
    ...trpc.courseStaff.list.queryOptions(),
    initialData: courseUsers,
    staleTime: Infinity,
  });
  const exportQuery = useQuery({
    ...trpc.courseStaff.export.queryOptions(),
    enabled: false,
  });

  async function exportCsv() {
    const result = await exportQuery.refetch();
    if (!result.isSuccess) return;

    const url = URL.createObjectURL(
      new Blob([result.data.text], { type: 'text/csv;charset=utf-8' }),
    );
    const link = document.createElement('a');
    link.href = url;
    link.download = result.data.filename;
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  const [globalFilter, setGlobalFilter] = useQueryState('search', parseAsString.withDefault(''));
  const [sorting, setSorting] = useQueryState<SortingState>(
    'sort',
    parseAsSortingState.withDefault(DEFAULT_SORT),
  );
  const [columnPinning, setColumnPinning] = useQueryState(
    'frozen',
    parseAsColumnPinningState.withDefault(DEFAULT_PINNING),
  );

  const filterRegistry = useMemo(() => {
    const registry: Record<string, ColumnFilterEntry<MultiSelectFilterValue<any>>> = {
      course_role: {
        urlKey: 'role',
        parser: parseAsMultiSelectFilter(COURSE_ROLE_VALUES),
        defaultValue: EMPTY_COURSE_ROLE_FILTER,
      },
    };
    for (const ci of courseInstances) {
      registry[`ci_${ci.id}`] = {
        parser: parseAsMultiSelectFilter(INSTANCE_ROLE_VALUES),
        defaultValue: EMPTY_INSTANCE_ROLE_FILTER,
      };
    }
    return registry;
  }, [courseInstances]);

  const { columnFilters, onColumnFiltersChange, onResetColumnFilters } =
    useColumnFilters(filterRegistry);

  const { activeCourseInstanceIds, upcomingCourseInstanceIds } = useMemo(() => {
    // Reading the clock once per memoized computation is intentional.
    // oxlint-disable-next-line react/purity
    const now = new Date();
    const activeIds = new Set<string>();
    const upcomingIds = new Set<string>();

    for (const courseInstance of courseInstances) {
      const hasStarted = !courseInstance.start_date || courseInstance.start_date <= now;
      const hasNotEnded = !courseInstance.end_date || courseInstance.end_date >= now;
      const isUndated = !courseInstance.start_date && !courseInstance.end_date;

      if (!isUndated && hasStarted && hasNotEnded) {
        activeIds.add(courseInstance.id);
      } else if (hasNotEnded && (!hasStarted || isUndated)) {
        upcomingIds.add(courseInstance.id);
      }
    }

    return {
      activeCourseInstanceIds: activeIds,
      upcomingCourseInstanceIds: upcomingIds,
    };
  }, [courseInstances]);

  const allColumnIds = useMemo(
    () => [
      ...(canEdit ? ['select'] : []),
      'uid',
      'user_name',
      'course_role',
      ...courseInstances.map((ci) => `ci_${ci.id}`),
    ],
    [courseInstances, canEdit],
  );
  const { columnVisibility, setColumnVisibility, defaultColumnVisibility } =
    useColumnVisibilityQueryState(allColumnIds);

  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const columns = useMemo(
    () =>
      columnHelper.columns([
        ...(canEdit
          ? [
              columnHelper.display({
                id: 'select',
                header: ({ table }) => <SelectAllCheckbox table={table} />,
                cell: ({ row }) => {
                  const uid = row.original.user.uid;
                  return (
                    <input
                      type="checkbox"
                      aria-label={`Select ${uid}`}
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
              }),
            ]
          : []),
        columnHelper.accessor((row) => row.user.uid, {
          id: 'uid',
          header: 'شناسه کاربری (UID / ایمیل)',
          size: 220,
          enableHiding: true,
          enableGlobalFilter: true,
        }),
        columnHelper.accessor((row) => row.user.name ?? '', {
          id: 'user_name',
          header: 'نام و نام خانوادگی',
          size: 180,
          enableHiding: true,
          enableGlobalFilter: true,
          cell: (info) => {
            const name = info.row.original.user.name;
            return name ? (
              <span>{name}</span>
            ) : (
              <OverlayTrigger
                placement="top"
                tooltip={{
                  body: 'کاربران ناشناس هنوز به سامانه وارد نشده‌اند یا شناسه کاربری (UID) آن‌ها نادرست است.',
                  props: { id: `staff-unknown-user-tooltip-${info.row.original.user.id}` },
                }}
              >
                <span className="text-danger">کاربر ناشناس</span>
              </OverlayTrigger>
            );
          },
        }),
        columnHelper.accessor((row) => row.course_permission.course_role, {
          id: 'course_role',
          header: 'دسترسی به محتوای درس',
          size: 190,
          enableHiding: true,
          enableGlobalFilter: false,
          meta: { label: 'دسترسی به محتوای درس' },
          filterFn: (row, _columnId, filter: MultiSelectFilterValue<CourseRole>) => {
            const role = row.original.course_permission.course_role ?? 'None';
            return applyMultiSelectFilter(filter, (values) => values.includes(role));
          },
          sortFn: (rowA, rowB) => {
            const indexA = COURSE_ROLE_VALUES.indexOf(
              rowA.original.course_permission.course_role ?? 'None',
            );
            const indexB = COURSE_ROLE_VALUES.indexOf(
              rowB.original.course_permission.course_role ?? 'None',
            );
            return indexA - indexB;
          },
          cell: (info) => (
            <div className="text-center">
              <CoursePermissionCell
                courseUser={info.row.original}
                canChangeCourseRole={
                  canEdit &&
                  ((info.row.original.user.id !== authnUserId &&
                    info.row.original.user.id !== userId) ||
                    isAdministrator)
                }
              />
            </div>
          ),
        }),
        ...courseInstances.map((ci) =>
          columnHelper.accessor(
            (row): InstanceRole =>
              row.course_instance_roles?.find((cir) => cir.id === ci.id)?.course_instance_role ??
              'None',
            {
              id: `ci_${ci.id}`,
              header: () => <code>{ci.short_name}</code>,
              meta: { label: ci.short_name },
              size: 120,
              enableGlobalFilter: false,
              enableSorting: false,
              enableHiding: true,
              filterFn: (row, columnId, filter: MultiSelectFilterValue<InstanceRole>) => {
                const role = row.getValue<InstanceRole>(columnId);
                return applyMultiSelectFilter(filter, (values) => values.includes(role));
              },
              cell: (info) => (
                <div className="text-center">
                  <CourseInstanceAccessCell
                    courseUser={info.row.original}
                    courseInstance={ci}
                    canEdit={canEdit}
                  />
                </div>
              ),
            },
          ),
        ),
      ]),
    [authnUserId, userId, isAdministrator, courseInstances, canEdit],
  );

  const table = useTanstackTable({
    data: liveUsers,
    columns,
    columnResizeMode: 'onChange',
    enableRowSelection: canEdit,
    getRowId: (row) => row.user.id,
    state: {
      sorting,
      columnFilters,
      globalFilter,
      columnPinning,
      columnVisibility,
      rowSelection,
    },
    initialState: {
      columnPinning: DEFAULT_PINNING,
      columnVisibility: defaultColumnVisibility,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onColumnFiltersChange,
    onColumnPinningChange: setColumnPinning,
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    defaultColumn: {
      minSize: 100,
      size: 150,
      maxSize: 500,
      enableSorting: true,
      enableHiding: false,
    },
  });

  usePruneRowSelection(table);

  const selectedUsers = table.getFilteredSelectedRowModel().rows.map((row) => row.original);
  const displayedCount = table.getRowModel().rows.length;
  const totalCount = table.getCoreRowModel().rows.length;
  const isFiltered = displayedCount !== totalCount;
  const selectedCount = selectedUsers.length;

  const statusContent = run(() => {
    if (selectedCount > 0) {
      return (
        <>
          انتخاب {selectedCount} از {displayedCount} کاربر
          {isFiltered && ' (فیلتر شده)'}
        </>
      );
    }
    return (
      <>
        نمایش {displayedCount} از {totalCount} کاربر
      </>
    );
  });

  const filters = useMemo(() => {
    const instanceRoleFilter: ColumnFilter = ({ header }) => (
      <MultiSelectColumnFilter
        column={header.column}
        allColumnValues={[...INSTANCE_ROLE_VALUES]}
        renderValueLabel={({ value }) => <span>{INSTANCE_ROLE_LABELS[value]}</span>}
      />
    );

    return {
      course_role: ({ header }) => (
        <MultiSelectColumnFilter
          column={header.column}
          allColumnValues={[...COURSE_ROLE_VALUES]}
          renderValueLabel={({ value }) => <span>{value}</span>}
        />
      ),
      ...Object.fromEntries(courseInstances.map((ci) => [`ci_${ci.id}`, instanceRoleFilter])),
    } satisfies Record<string, ColumnFilter>;
  }, [courseInstances]);

  const headerButtons = (
    <>
      <Button
        type="button"
        variant="light"
        size="sm"
        disabled={exportQuery.isFetching}
        onClick={exportCsv}
      >
        <i className="bi bi-download me-2" aria-hidden="true" />
        {exportQuery.isFetching ? 'در حال خروجی…' : 'خروجی CSV'}
      </Button>
      {canEdit && selectedUsers.length > 0 && (
        <SelectionToolbar
          selectedUsers={selectedUsers}
          courseInstances={courseInstances}
          isAdministrator={isAdministrator}
          authnUserId={authnUserId}
          userId={userId}
        />
      )}
      {canEdit && (
        <Button type="button" variant="light" size="sm" onClick={() => setShowCsvImport(true)}>
          <i className="bi bi-upload me-2" aria-hidden="true" />
          ورود از CSV
        </Button>
      )}
      {canEdit && <AddUsersButton uidsLimit={uidsLimit} courseInstances={courseInstances} />}
    </>
  );

  const instanceVisibilityPresets = useMemo(
    () => ({
      'دوره‌های فعال': Object.fromEntries(
        courseInstances.map((ci) => [`ci_${ci.id}`, activeCourseInstanceIds.has(ci.id)]),
      ),
      'دوره‌های آتی': Object.fromEntries(
        courseInstances.map((ci) => [`ci_${ci.id}`, upcomingCourseInstanceIds.has(ci.id)]),
      ),
      'تمامی دوره‌ها': Object.fromEntries(courseInstances.map((ci) => [`ci_${ci.id}`, true])),
    }),
    [courseInstances, activeCourseInstanceIds, upcomingCourseInstanceIds],
  );

  const selectedInstancePreset = useMemo(() => {
    for (const [name, preset] of Object.entries(instanceVisibilityPresets)) {
      const matches = Object.entries(preset).every(
        ([colId, visible]) => (columnVisibility[colId] ?? true) === visible,
      );
      if (matches) return name;
    }
    return null;
  }, [instanceVisibilityPresets, columnVisibility]);

  const handleInstancePresetSelect = (presetName: string) => {
    const preset = instanceVisibilityPresets[presetName as keyof typeof instanceVisibilityPresets];
    void setColumnVisibility((prev) => ({ ...prev, ...preset }));
  };

  const allInstancesAreActive = activeCourseInstanceIds.size === courseInstances.length;

  const instancePresetDropdown =
    courseInstances.length > 0 && !allInstancesAreActive ? (
      <Dropdown as={ButtonGroup}>
        <Dropdown.Toggle variant="tanstack-table">
          <i className="bi bi-funnel me-2" aria-hidden="true" />
          {selectedInstancePreset ?? 'سفارشی'}
        </Dropdown.Toggle>
        <Dropdown.Menu>
          {Object.keys(instanceVisibilityPresets).map((name) => {
            const isSelected = selectedInstancePreset === name;
            return (
              <Dropdown.Item
                key={name}
                as="button"
                type="button"
                active={isSelected}
                onClick={() => handleInstancePresetSelect(name)}
              >
                <i
                  className={`bi ${isSelected ? 'bi-check-circle-fill' : 'bi-circle'} me-2`}
                  aria-hidden="true"
                />
                {name}
              </Dropdown.Item>
            );
          })}
          {selectedInstancePreset === null && (
            <Dropdown.Item as="button" type="button" active disabled>
              <i className="bi bi-check-circle-fill me-2" aria-hidden="true" />
              سفارشی
            </Dropdown.Item>
          )}
        </Dropdown.Menu>
      </Dropdown>
    ) : null;

  return (
    <div className="d-flex flex-column h-100">
      {showCsvImport && <StaffCsvImportModal onHide={() => setShowCsvImport(false)} />}
      <AppErrorAlert
        error={getAppError<CourseStaffError['Export']>(exportQuery.error)}
        render={{ UNKNOWN: ({ message }) => message }}
      />
      <div className="staff-table flex-grow-1" style={{ minHeight: 0 }}>
        <TanstackTableCard
          table={table}
          title="کادر آموزشی و دسترسی‌ها"
          className="h-100"
          singularLabel="کاربر"
          pluralLabel="کاربر"
          globalFilter={{ placeholder: 'جستجو بر اساس شناسه کاربری (UID) یا نام...' }}
          tableOptions={{ filters, rowHeight: 72 }}
          headerButtons={headerButtons}
          columnManager={{ buttons: instancePresetDropdown }}
          statusContent={statusContent}
          onResetColumnFilters={onResetColumnFilters}
        />
      </div>
    </div>
  );
}

interface StaffTableProps extends StaffTableInnerProps {
  search: string;
  trpcCsrfToken: string;
  courseId: string;
  courseInstanceId?: string;
}

export function StaffTable({
  search,
  trpcCsrfToken,
  courseId,
  courseInstanceId,
  ...props
}: StaffTableProps) {
  const [queryClient] = useState(() => new QueryClient());
  const [trpcClient] = useState(() =>
    createCourseTrpcClient({ csrfToken: trpcCsrfToken, courseId, courseInstanceId }),
  );

  return (
    <QueryClientProviderDebug client={queryClient}>
      <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
        <NuqsAdapter search={search}>
          <StaffTableInner {...props} />
        </NuqsAdapter>
      </TRPCProvider>
    </QueryClientProviderDebug>
  );
}

StaffTable.displayName = 'StaffTable';
