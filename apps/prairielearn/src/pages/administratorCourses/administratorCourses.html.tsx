import { QueryClient, useMutation } from '@tanstack/react-query';
import clsx from 'clsx';
import { memo, useState } from 'react';
import { Alert, Modal } from 'react-bootstrap';
import { FormProvider, useForm } from 'react-hook-form';

import { getAppError } from '@prairielearn/trpc/client';
import { QueryClientProviderDebug } from '@prairielearn/trpc/react';
import { OverlayTrigger } from '@prairielearn/ui';
import type { Timezone } from '@prairielearn/utils/timezone';

import {
  AdministratorCourseFormFields,
  type CourseFormFieldValues,
  useInstitutionPrefix,
} from '../../components/AdminstratorCourseFormFields.js';
import type { AdminInstitution } from '../../lib/client/safe-db-types.js';
import { createAdministratorTrpcClient } from '../../trpc/administrator/client.js';
import { TRPCProvider, useTRPC } from '../../trpc/administrator/context.js';
import type { AdminCourseError } from '../../trpc/administrator/courses.js';

import type { CourseWithInstitution } from './administratorCourses.shared.js';

interface InsertCourseFormData extends CourseFormFieldValues {
  branch: string;
}

interface UpdateCourseColumnFormData {
  value: string;
}

interface DeleteCourseFormData {
  short_name: string;
}

type CourseColumnName =
  | 'short_name'
  | 'title'
  | 'display_timezone'
  | 'path'
  | 'repository'
  | 'branch';

export function AdministratorCourses({
  institutions,
  availableTimezones,
  courses,
  coursesRoot,
  trpcCsrfToken,
  courseRepoDefaultBranch,
  aiSecretsConfigured,
}: {
  institutions: AdminInstitution[];
  availableTimezones: Timezone[];
  courses: CourseWithInstitution[];
  coursesRoot: string;
  trpcCsrfToken: string;
  courseRepoDefaultBranch: string;
  aiSecretsConfigured: boolean;
}) {
  const [queryClient] = useState(() => new QueryClient());
  const [trpcClient] = useState(() => createAdministratorTrpcClient({ csrfToken: trpcCsrfToken }));

  return (
    <QueryClientProviderDebug client={queryClient}>
      <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
        <>
          <h1 className="visually-hidden">مدیریت درس‌ها</h1>
          <CoursesCard
            courses={courses}
            institutions={institutions}
            availableTimezones={availableTimezones}
            coursesRoot={coursesRoot}
            courseRepoDefaultBranch={courseRepoDefaultBranch}
            aiSecretsConfigured={aiSecretsConfigured}
          />
        </>
      </TRPCProvider>
    </QueryClientProviderDebug>
  );
}

AdministratorCourses.displayName = 'AdministratorCourses';

function CoursesCard({
  courses,
  institutions,
  availableTimezones,
  coursesRoot,
  courseRepoDefaultBranch,
  aiSecretsConfigured,
}: {
  courses: CourseWithInstitution[];
  institutions: AdminInstitution[];
  availableTimezones: Timezone[];
  coursesRoot: string;
  courseRepoDefaultBranch: string;
  aiSecretsConfigured: boolean;
}) {
  const [showAddCourseModal, setShowAddCourseModal] = useState(false);

  return (
    <div id="courses" className="card mb-4" style={{ fontFamily: 'var(--font-persian)' }}>
      <div className="card-header bg-primary text-white d-flex align-items-center">
        <h2>مدیریت درس‌ها و دوره‌ها</h2>
        <button
          type="button"
          className="btn btn-sm btn-light ms-auto"
          aria-label="افزودن درس جدید"
          onClick={() => setShowAddCourseModal(true)}
        >
          <i className="fa fa-plus me-1" aria-hidden="true" />
          <span className="d-none d-sm-inline">افزودن درس جدید</span>
        </button>
        <CourseInsertModal
          institutions={institutions}
          availableTimezones={availableTimezones}
          coursesRoot={coursesRoot}
          courseRepoDefaultBranch={courseRepoDefaultBranch}
          aiSecretsConfigured={aiSecretsConfigured}
          show={showAddCourseModal}
          onCancel={() => setShowAddCourseModal(false)}
        />
      </div>
      <div className="table-responsive">
        <table className="table table-sm table-hover table-striped" aria-label="فهرست درس‌ها">
          <thead>
            <tr>
              <th>دانشکده / موسسه</th>
              <th>کد درس</th>
              <th>عنوان کامل درس</th>
              <th>منطقه زمانی</th>
              <th>مسیر فایل‌ها</th>
              <th>مخزن گیت</th>
              <th>شاخه</th>
              <th className="text-end">عملیات</th>
            </tr>
          </thead>
          <tbody>
            {courses.map((row) => (
              <CourseRow key={row.course.id} row={row} />
            ))}
          </tbody>
        </table>
      </div>
      <div className="card-footer text-muted">
        <small>
          هنگام همگام‌سازی درس، در صورتی که <strong>مسیر فایل‌ها</strong> بر روی دیسک سرور موجود نباشد، دستور{' '}
          <code>git clone</code> از <strong>مخزن</strong> اجرا می‌شود، در غیر این صورت دستور{' '}
          <code>git pull</code> اعمال می‌گردد. همچنین <strong>کد درس</strong> و <strong>عنوان</strong> درس از روی فایل تنظیمات JSON در مخزن به‌روزرسانی می‌شوند.
        </small>
      </div>
    </div>
  );
}

const CourseRow = memo(({ row }: { row: CourseWithInstitution }) => {
  const [showDeletePopover, setShowDeletePopover] = useState(false);

  return (
    <tr>
      <td>
        <a href={`/pl/administrator/institution/${row.institution.id}`}>
          {row.institution.short_name}
        </a>
      </td>
      <CourseUpdateColumn
        row={row}
        columnName="short_name"
        label="کد درس"
        href={`/pl/course/${row.course.id}`}
      />
      <CourseUpdateColumn row={row} columnName="title" label="عنوان کامل درس" />
      <CourseUpdateColumn row={row} columnName="display_timezone" label="منطقه زمانی" />
      <CourseUpdateColumn row={row} columnName="path" label="مسیر فایل‌ها" />
      <CourseUpdateColumn row={row} columnName="repository" label="مخزن گیت" required={false} />
      <CourseUpdateColumn row={row} columnName="branch" label="شاخه" />
      <td className="align-middle text-end">
        <OverlayTrigger
          trigger="click"
          placement="auto"
          popover={{
            header: `تایید حذف درس ${row.course.short_name}`,
            body: (
              <CourseDeleteForm
                id={`courseDeleteButton${row.course.id}`}
                row={row}
                onCancel={() => setShowDeletePopover(false)}
              />
            ),
          }}
          show={showDeletePopover}
          rootClose
          onToggle={setShowDeletePopover}
        >
          <button type="button" className="btn btn-sm btn-danger text-nowrap">
            <i className="fa fa-times me-1" aria-hidden="true" /> حذف درس
          </button>
        </OverlayTrigger>
      </td>
    </tr>
  );
});

function CourseDeleteForm({
  id,
  row,
  onCancel,
}: {
  id: string;
  row: CourseWithInstitution;
  onCancel: () => void;
}) {
  const trpc = useTRPC();
  const mutation = useMutation(trpc.courses.delete.mutationOptions());

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<DeleteCourseFormData>({
    mode: 'onSubmit',
    defaultValues: {
      short_name: '',
    },
  });

  const appError = getAppError<AdminCourseError['Delete']>(mutation.error);

  const onSubmit = (data: DeleteCourseFormData) => {
    mutation.mutate(
      { courseId: row.course.id, confirmShortName: data.short_name },
      { onSuccess: () => window.location.reload() },
    );
  };

  return (
    <form name="course-delete-form" onSubmit={handleSubmit(onSubmit)} style={{ fontFamily: 'var(--font-persian)' }}>
      <div className="mb-3">
        <label className="form-label" htmlFor={`inputConfirm${id}`}>
          جهت تایید، عبارت «{row.course.short_name}» را وارد کنید:
        </label>
        <input
          type="text"
          className={clsx('form-control', errors.short_name && 'is-invalid')}
          id={`inputConfirm${id}`}
          dir="ltr"
          aria-invalid={errors.short_name ? true : undefined}
          aria-errormessage={errors.short_name ? `inputConfirm${id}-error` : undefined}
          {...register('short_name', {
            validate: (value) =>
              value === row.course.short_name ||
              `جهت تایید حذف، عبارت «${row.course.short_name}» را دقیقاً وارد کنید.`,
          })}
        />
        {errors.short_name && (
          <div id={`inputConfirm${id}-error`} className="invalid-feedback">
            {errors.short_name.message}
          </div>
        )}
      </div>
      {appError && (
        <Alert variant="danger" dismissible onClose={() => mutation.reset()}>
          {appError.message}
        </Alert>
      )}
      <div className="d-flex justify-content-end gap-2">
        <button type="button" className="btn btn-sm btn-secondary gap-2" onClick={onCancel}>
          انصراف
        </button>
        <button type="submit" className="btn btn-sm btn-danger" disabled={mutation.isPending}>
          حذف نهایی درس
        </button>
      </div>
    </form>
  );
}

function CourseInsertModal({
  institutions,
  availableTimezones,
  coursesRoot,
  courseRepoDefaultBranch,
  show,
  onCancel,
  aiSecretsConfigured,
}: {
  institutions: AdminInstitution[];
  availableTimezones: Timezone[];
  coursesRoot: string;
  courseRepoDefaultBranch: string;
  show: boolean;
  onCancel: () => void;
  aiSecretsConfigured: boolean;
}) {
  const trpc = useTRPC();
  const mutation = useMutation(trpc.courses.insert.mutationOptions());
  const appError = getAppError<AdminCourseError['Insert']>(mutation.error);

  const methods = useForm<InsertCourseFormData>({
    mode: 'onSubmit',
    defaultValues: {
      institution_id: '',
      short_name: '',
      title: '',
      display_timezone: institutions[0]?.display_timezone ?? '',
      path: `${coursesRoot}/pl-XXX`,
      repository_short_name: 'pl-XXX',
      branch: courseRepoDefaultBranch,
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = methods;
  const institutionId = methods.watch('institution_id');
  const prefixState = useInstitutionPrefix(institutionId, institutions);

  const onSubmit = (data: InsertCourseFormData) => {
    mutation.mutate(
      {
        title: data.title,
        path: data.path,
        branch: data.branch,
        shortName: data.short_name,
        institutionId: data.institution_id,
        displayTimezone: data.display_timezone,
        repository: data.repository_short_name
          ? `git@github.com:PrairieLearn/${data.repository_short_name}.git`
          : null,
      },
      { onSuccess: () => window.location.reload() },
    );
  };

  return (
    <Modal
      show={show}
      backdrop="static"
      size="lg"
      onHide={onCancel}
      onEntering={() => methods.reset()}
      style={{ fontFamily: 'var(--font-persian)' }}
    >
      <FormProvider {...methods}>
        <form name="add-course-form" onSubmit={handleSubmit(onSubmit)}>
          <Modal.Header closeButton>
            <Modal.Title>تعریف و ایجاد درس جدید</Modal.Title>
          </Modal.Header>
          <Modal.Body>
            <AdministratorCourseFormFields
              institutions={institutions}
              availableTimezones={availableTimezones}
              coursesRoot={coursesRoot}
              prefixState={prefixState}
              aiSecretsConfigured={aiSecretsConfigured}
              repositoryRequired={false}
            />
            <div className="mb-3">
              <label className="form-label" htmlFor="courseAddInputBranch">
                شاخه گیت (Branch)
              </label>
              <input
                type="text"
                className={clsx('form-control', errors.branch && 'is-invalid')}
                id="courseAddInputBranch"
                dir="ltr"
                aria-invalid={errors.branch ? true : undefined}
                aria-errormessage={errors.branch ? 'courseAddInputBranch-error' : undefined}
                {...register('branch', { required: 'نام شاخه گیت را وارد کنید' })}
              />
              {errors.branch && (
                <div id="courseAddInputBranch-error" className="invalid-feedback">
                  {errors.branch.message}
                </div>
              )}
            </div>
            {appError && (
              <Alert variant="danger" dismissible onClose={() => mutation.reset()}>
                {appError.message}
              </Alert>
            )}
          </Modal.Body>
          <Modal.Footer>
            <button type="button" className="btn btn-secondary" onClick={onCancel}>
              انصراف
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={isSubmitting || mutation.isPending || prefixState.status === 'loading'}
            >
              ثبت و ایجاد درس
            </button>
          </Modal.Footer>
        </form>
      </FormProvider>
    </Modal>
  );
}

function CourseUpdateColumn({
  row,
  columnName,
  label,
  href,
  required = true,
}: {
  row: CourseWithInstitution;
  columnName: CourseColumnName;
  label: string;
  href?: string;
  required?: boolean;
}) {
  const [showPopover, setShowPopover] = useState(false);

  return (
    <td className="align-middle">
      {href !== undefined ? <a href={href}>{row.course[columnName]}</a> : row.course[columnName]}
      <OverlayTrigger
        trigger="click"
        placement="auto"
        popover={{
          header: `تغییر ${label}`,
          body: (
            <CourseUpdateColumnForm
              row={row}
              columnName={columnName}
              label={label}
              required={required}
              onCancel={() => setShowPopover(false)}
            />
          ),
        }}
        show={showPopover}
        rootClose
        onToggle={setShowPopover}
      >
        <button
          type="button"
          className="btn btn-xs btn-secondary ms-1"
          aria-label={`ویرایش ${label}`}
        >
          <i className="fa fa-edit" aria-hidden="true" />
        </button>
      </OverlayTrigger>
    </td>
  );
}

function CourseUpdateColumnForm({
  row,
  columnName,
  label,
  required,
  onCancel,
}: {
  row: CourseWithInstitution;
  columnName: CourseColumnName;
  label: string;
  required: boolean;
  onCancel: () => void;
}) {
  const trpc = useTRPC();
  const mutation = useMutation(trpc.courses.updateColumn.mutationOptions());
  const appError = getAppError<AdminCourseError['UpdateColumn']>(mutation.error);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UpdateCourseColumnFormData>({
    mode: 'onSubmit',
    defaultValues: {
      value: row.course[columnName] ?? '',
    },
  });

  const onSubmit = (data: UpdateCourseColumnFormData) => {
    mutation.mutate(
      { courseId: row.course.id, columnName, value: data.value },
      {
        onSuccess: () => {
          onCancel();
          window.location.reload();
        },
      },
    );
  };

  return (
    <form name="edit-course-column-form" onSubmit={handleSubmit(onSubmit)}>
      <div className="mb-3">
        <input
          type="text"
          className={clsx('form-control', errors.value && 'is-invalid')}
          aria-label={label}
          {...register('value', {
            required: required && `لطفاً ${label} را وارد کنید`,
          })}
        />
        {errors.value && <div className="invalid-feedback">{errors.value.message}</div>}
      </div>
      {appError && (
        <Alert variant="danger" dismissible onClose={() => mutation.reset()}>
          {appError.message}
        </Alert>
      )}
      <div className="d-flex justify-content-end gap-2">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>
          انصراف
        </button>
        <button type="submit" className="btn btn-primary" disabled={mutation.isPending}>
          تغییر
        </button>
      </div>
    </form>
  );
}
