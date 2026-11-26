import { useMutation, useQuery } from '@tanstack/react-query';
import clsx from 'clsx';
import { memo, useState } from 'react';
import { Alert, Dropdown, Modal } from 'react-bootstrap';
import { FormProvider, useForm } from 'react-hook-form';
import ReactMarkdown from 'react-markdown';

import { type AppError, getAppError } from '@prairielearn/trpc/client';
import { OverlayTrigger, useModalState } from '@prairielearn/ui';
import type { Timezone } from '@prairielearn/utils/timezone';

import {
  AdministratorCourseFormFields,
  type CourseFormFieldValues,
  buildRepoShortName,
  useInstitutionPrefix,
} from '../../../components/AdminstratorCourseFormFields.js';
import { FriendlyDate } from '../../../components/FriendlyDate.js';
import { JobStatus } from '../../../components/JobStatus.js';
import {
  type AdminInstitution,
  type AdminInstitutionWithSettings,
} from '../../../lib/client/safe-db-types.js';
import {
  getAdministratorCourseRequestsUrl,
  getAdministratorJobSequenceUrl,
} from '../../../lib/client/url.js';
import type { CourseRequestRow } from '../../../lib/course-request.js';
import {
  GITHUB_USERNAME_VALIDATION_MESSAGE,
  isValidGithubUsername,
} from '../../../lib/github-utils.js';
import { useTRPC } from '../../../trpc/administrator/context.js';
import type { AdminCourseRequestError } from '../../../trpc/administrator/course-requests.js';

interface CourseRequestApproveFormData extends CourseFormFieldValues {
  github_user: string;
  github_course_owner: string;
}

export function CourseRequestsTable({
  rows,
  institutions,
  availableTimezones,
  coursesRoot,
  defaultGithubCourseOwner,
  showAll,
  aiSecretsConfigured,
}: {
  rows: CourseRequestRow[];
  institutions: AdminInstitutionWithSettings[];
  availableTimezones: Timezone[];
  coursesRoot: string;
  defaultGithubCourseOwner: string;
  showAll: boolean;
  aiSecretsConfigured: boolean;
}) {
  const approveModal = useModalState<CourseRequestRow>();

  const headerPrefix = showAll ? 'تمامی' : 'در انتظار بررسی';
  return (
    <div className="card mb-4" style={{ fontFamily: 'var(--font-persian)' }}>
      <div className="card-header bg-primary text-white d-flex align-items-center">
        <h1 className="h4 mb-0">درخواست‌های ایجاد درس جدید ({headerPrefix})</h1>
        {!showAll && (
          <a
            className="btn btn-sm btn-light ms-auto"
            href={getAdministratorCourseRequestsUrl({ showAll: true })}
          >
            <i className="fa fa-search me-1" aria-hidden="true" />
            <span className="d-none d-sm-inline">مشاهده همه</span>
          </a>
        )}
      </div>
      <div className="table-responsive">
        <table className="table table-sm table-hover" aria-label="درخواست‌های ایجاد درس">
          <thead>
            <tr>
              <th>تاریخ ثبت</th>
              <th>کد و عنوان درس</th>
              <th>دانشکده</th>
              <th>نام متقاضی و ایمیل</th>
              <th>شناسه کاربری (UID)</th>
              <th>نام کاربری گیت‌هاب</th>
              <th>منبع آشنایی</th>
              <th>وضعیت</th>
              {showAll && <th>بررسی‌کننده</th>}
              <th>عملیات</th>
              <th>جزئیات</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <CourseRequestTableRow
                key={row.id}
                row={row}
                showAll={showAll}
                onApprove={approveModal.showWithData}
              />
            ))}
          </tbody>
        </table>
      </div>
      <div className="card-footer text-muted">
        <small>
          تایید درخواست درس به طور خودکار مخزن درس را روی سرور پیکربندی کرده و دسترسی مالکیت را به استاد متقاضی اختصاص می‌دهد.
        </small>
      </div>
      <CourseRequestApproveModal
        {...approveModal}
        institutions={institutions}
        availableTimezones={availableTimezones}
        coursesRoot={coursesRoot}
        defaultGithubCourseOwner={defaultGithubCourseOwner}
        aiSecretsConfigured={aiSecretsConfigured}
      />
    </div>
  );
}

CourseRequestsTable.displayName = 'CourseRequestsTable';

function RequesterContact({ request }: { request: CourseRequestRow }) {
  const requesterName = [request.first_name, request.last_name].filter(Boolean).join(' ');

  return (
    <>
      {requesterName && <div>{requesterName}</div>}
      {request.contact_email ? (
        request.contact_email === request.user_uid ? (
          <span className="text-muted">ایمیل تماس همان شناسه کاربری (UID) است</span>
        ) : (
          <span>{request.contact_email}</span>
        )
      ) : (
        <span className="text-muted fst-italic">ایمیل تماس موجود نیست</span>
      )}
    </>
  );
}

function AccountIdentity({ request }: { request: CourseRequestRow }) {
  const requesterName = [request.first_name, request.last_name].filter(Boolean).join(' ');

  return (
    <>
      {request.user_name && request.user_name !== requesterName && <div>{request.user_name}</div>}
      <span>{request.user_uid}</span>
    </>
  );
}

const CourseRequestTableRow = memo(
  ({
    row,
    showAll,
    onApprove,
  }: {
    row: CourseRequestRow;
    showAll: boolean;
    onApprove: (row: CourseRequestRow) => void;
  }) => {
    const [noteOpen, setNoteOpen] = useState(Boolean(row.note));
    const [jobsOpen, setJobsOpen] = useState(false);
    const [showDenyPopover, setShowDenyPopover] = useState(false);

    return (
      <>
        <tr>
          <td className="align-middle">{row.created_at.toISOString()}</td>
          <td className="align-middle">
            {row.short_name}: {row.title}
          </td>
          <td className="align-middle">
            <EmptyState value={row.institution} label="بدون دانشکده/موسسه" />
          </td>
          <td className="align-middle">
            <RequesterContact request={row} />
          </td>
          <td className="align-middle">
            <AccountIdentity request={row} />
          </td>
          <td className="align-middle">
            <EmptyState value={row.github_user} label="بدون کاربر گیت‌هاب" />
          </td>
          <td className="align-middle">
            <EmptyState value={row.referral_source} label="بدون منبع آشنایی" />
          </td>
          <td className="align-middle">
            <CourseRequestStatusIcon status={row.approved_status} />
          </td>
          {showAll && (
            <td className="align-middle">
              {row.approved_status !== 'pending' &&
                (row.approved_by_name ?? 'تایید خودکار')}
            </td>
          )}
          <td className="align-middle py-1">
            {row.approved_status !== 'approved' && (
              <div className="d-flex flex-wrap gap-1">
                <OverlayTrigger
                  trigger="click"
                  placement="auto"
                  popover={{
                    header: 'رد درخواست ایجاد درس',
                    body: (
                      <CourseRequestDenyForm
                        request={row}
                        onCancel={() => setShowDenyPopover(false)}
                      />
                    ),
                  }}
                  show={showDenyPopover}
                  rootClose
                  onToggle={setShowDenyPopover}
                >
                  <button type="button" className="btn btn-sm btn-danger text-nowrap">
                    <i className="fa fa-times me-1" aria-hidden="true" /> رد درخواست
                  </button>
                </OverlayTrigger>
                <button
                  type="button"
                  className="btn btn-sm btn-success text-nowrap"
                  onClick={() => onApprove(row)}
                >
                  <i className="fa fa-check me-1" aria-hidden="true" /> تایید و ایجاد
                </button>
              </div>
            )}
          </td>
          <td className="align-middle">
            <Dropdown>
              <Dropdown.Toggle
                variant="secondary"
                size="sm"
                className="btn-xs"
                aria-label={`نمایش جزئیات ${row.short_name}`}
              >
                جزئیات
              </Dropdown.Toggle>
              <Dropdown.Menu popperConfig={{ strategy: 'fixed' }} renderOnMount>
                <Dropdown.Item as="button" onClick={() => setNoteOpen(!noteOpen)}>
                  {noteOpen ? 'بستن یادداشت' : 'یادداشت مدیر'}
                </Dropdown.Item>
                {row.jobs.length > 0 && (
                  <Dropdown.Item as="button" onClick={() => setJobsOpen(!jobsOpen)}>
                    {jobsOpen ? 'مخفی‌سازی جاب‌ها' : 'مشاهده جاب‌های سیستمی'}
                  </Dropdown.Item>
                )}
              </Dropdown.Menu>
            </Dropdown>
          </td>
        </tr>
        {noteOpen && (
          <tr>
            <td colSpan={showAll ? 11 : 10} className="p-0">
              <CourseRequestEditNoteForm request={row} onCancel={() => setNoteOpen(false)} />
            </td>
          </tr>
        )}
        {row.jobs.length > 0 && (
          <tr>
            <td colSpan={showAll ? 11 : 10} className="p-0">
              {jobsOpen && (
                <table
                  className="table table-sm table-active mb-0"
                  aria-label="جاب‌های درخواست درس"
                >
                  <thead>
                    <tr>
                      <th>شماره</th>
                      <th>تاریخ شروع</th>
                      <th>تاریخ پایان</th>
                      <th>کاربر</th>
                      <th>وضعیت</th>
                      <th>
                        <span className="visually-hidden">جزئیات</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...row.jobs].reverse().map((job) => {
                      return (
                        <tr key={job.id}>
                          <td>{job.number}</td>
                          <td>{job.start_date ? <FriendlyDate date={job.start_date} timezone="Asia/Tehran" /> : '—'}</td>
                          <td>{job.finish_date ? <FriendlyDate date={job.finish_date} timezone="Asia/Tehran" /> : '—'}</td>
                          <td>{job.authn_user_name}</td>
                          <td>
                            <JobStatus status={job.status} />
                          </td>
                          <td>
                            <a
                              href={getAdministratorJobSequenceUrl(job.id)}
                              className="btn btn-xs btn-info float-end"
                            >
                              جزئیات
                            </a>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </td>
          </tr>
        )}
      </>
    );
  },
);

function CourseRequestApproveModal({
  show,
  data,
  onHide,
  onExited,
  institutions,
  availableTimezones,
  coursesRoot,
  defaultGithubCourseOwner,
  aiSecretsConfigured,
}: ReturnType<typeof useModalState<CourseRequestRow>> & {
  institutions: AdminInstitutionWithSettings[];
  availableTimezones: Timezone[];
  coursesRoot: string;
  defaultGithubCourseOwner: string;
  aiSecretsConfigured: boolean;
}) {
  return (
    <Modal show={show} backdrop="static" size="lg" onHide={onHide} onExited={onExited}>
      {data && (
        <CourseRequestApproveModalContent
          key={data.id}
          request={data}
          institutions={institutions}
          availableTimezones={availableTimezones}
          coursesRoot={coursesRoot}
          defaultGithubCourseOwner={defaultGithubCourseOwner}
          aiSecretsConfigured={aiSecretsConfigured}
          onCancel={onHide}
        />
      )}
    </Modal>
  );
}

function CourseRequestApproveModalContent({
  request,
  institutions,
  availableTimezones,
  coursesRoot,
  defaultGithubCourseOwner,
  aiSecretsConfigured,
  onCancel,
}: {
  request: CourseRequestRow;
  institutions: AdminInstitutionWithSettings[];
  availableTimezones: Timezone[];
  coursesRoot: string;
  defaultGithubCourseOwner: string;
  aiSecretsConfigured: boolean;
  onCancel: () => void;
}) {
  const trpc = useTRPC();
  const mutation = useMutation(trpc.courseRequests.createCourse.mutationOptions());
  const appError = getAppError<AdminCourseRequestError['CreateCourse']>(mutation.error);

  const adminInstitutions = institutions.map((i) => i.institution);
  const userRow = institutions.find((i) => i.institution.id === request.user_institution_id);
  const userInstitution = userRow?.institution;
  const isDefaultInstitution = userInstitution?.short_name === 'Default';
  const autoFilledInstitutionId =
    userInstitution && !isDefaultInstitution ? userInstitution.id : null;
  const defaultInstitutionId = autoFilledInstitutionId ?? '';
  const defaultTimezone =
    userInstitution && autoFilledInstitutionId ? userInstitution.display_timezone : '';
  const initialGithubCourseOwner =
    (autoFilledInstitutionId && userRow?.institution_settings?.github_course_owner) ||
    defaultGithubCourseOwner;

  const repoName = buildRepoShortName(null, request.short_name);
  const path = coursesRoot + '/' + repoName;

  const methods = useForm<CourseRequestApproveFormData>({
    mode: 'onSubmit',
    defaultValues: {
      institution_id: defaultInstitutionId,
      short_name: request.short_name,
      title: request.title,
      display_timezone: defaultTimezone,
      path,
      repository_short_name: repoName,
      github_user: request.github_user ?? '',
      github_course_owner: initialGithubCourseOwner,
    },
  });

  const {
    register,
    handleSubmit,
    setValue,
    formState: { isSubmitting, dirtyFields, errors },
  } = methods;
  const institutionId = methods.watch('institution_id');
  const prefixState = useInstitutionPrefix(institutionId, adminInstitutions);

  const handleInstitutionChange = (institution: AdminInstitution) => {
    if (dirtyFields.github_course_owner) return;
    const row = institutions.find((i) => i.institution.id === institution.id);
    setValue(
      'github_course_owner',
      row?.institution_settings?.github_course_owner ?? defaultGithubCourseOwner,
    );
  };

  const onSubmit = (data: CourseRequestApproveFormData) => {
    mutation.mutate(
      {
        courseRequestId: request.id,
        shortName: data.short_name,
        title: data.title,
        institutionId: data.institution_id,
        displayTimezone: data.display_timezone,
        path: data.path,
        repoShortName: data.repository_short_name,
        githubCourseOwner: data.github_course_owner.trim(),
        githubUser: data.github_user.trim(),
      },
      {
        onSuccess: ({ jobSequenceId }) => {
          window.location.href = getAdministratorJobSequenceUrl(jobSequenceId);
        },
      },
    );
  };

  const legitimacyQuery = useQuery({
    ...trpc.courseRequests.checkInstructorLegitimacy.queryOptions({
      courseRequestId: request.id,
    }),
    enabled: false,
  });

  return (
    <FormProvider {...methods}>
      <form
        name={`create-course-from-request-form-${request.id}`}
        onSubmit={handleSubmit(onSubmit)}
      >
        <Modal.Header closeButton>
          <Modal.Title>تایید درخواست ایجاد درس</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="card mb-3">
            <div className="card-header d-flex align-items-center justify-content-between py-2">
              <strong>استاد متقاضی</strong>
              <OverlayTrigger
                trigger={['hover', 'focus']}
                placement="bottom"
                tooltip={{
                  body: aiSecretsConfigured
                    ? 'از جستجوی وب با هوش مصنوعی برای بررسی حضور استاد در فهرست اعضای هیئت علمی یا پروفایل‌های حرفه‌ای موسسه اعلام‌شده استفاده می‌کند.'
                    : 'قابلیت‌های هوش مصنوعی نیازمند پیکربندی کلید OpenAI هستند.',
                  props: { id: 'check-instructor-legitimacy-tooltip' },
                }}
              >
                <span className="d-inline-block">
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-secondary"
                    disabled={legitimacyQuery.isFetching || !aiSecretsConfigured}
                    aria-busy={legitimacyQuery.isFetching}
                    onClick={() => legitimacyQuery.refetch()}
                  >
                    {legitimacyQuery.isFetching ? (
                      <>
                        <i className="fa fa-spinner fa-spin" aria-hidden="true" /> در حال بررسی...
                      </>
                    ) : (
                      <>
                        <i className="fa fa-search" aria-hidden="true" /> بررسی اعتبار
                      </>
                    )}
                  </button>
                </span>
              </OverlayTrigger>
            </div>
            <div className="card-body py-2">
              <div className="row g-2 small">
                <div className="col-12">
                  <strong>متقاضی / ایمیل تماس:</strong> <RequesterContact request={request} />
                </div>
                <div className="col-12">
                  <strong>حساب کاربری (UID):</strong> <AccountIdentity request={request} />
                </div>
                <div className="col-12">
                  <strong>دانشکده / موسسه:</strong>{' '}
                  {request.institution ? (
                    <span>{request.institution}</span>
                  ) : (
                    <span className="fst-italic text-muted">ارائه نشده</span>
                  )}
                </div>
                <div className="col-12">
                  <strong>گیت‌هاب:</strong>{' '}
                  {request.github_user ? (
                    <a
                      href={`https://github.com/${request.github_user}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {request.github_user}
                    </a>
                  ) : (
                    <span className="fst-italic text-muted">ارائه نشده</span>
                  )}
                </div>
              </div>
              <div aria-live="polite" aria-atomic="true">
                {legitimacyQuery.isError && (
                  <div className="mt-2 text-danger small">
                    بررسی اعتبار ناموفق بود. دوباره تلاش کنید.
                  </div>
                )}
                {legitimacyQuery.data && (
                  <div className="mt-2 pt-2 border-top">
                    <div className="d-flex align-items-start gap-2">
                      <span
                        className={clsx('badge', {
                          'text-bg-success':
                            legitimacyQuery.data.legitimate &&
                            legitimacyQuery.data.confidence === 'high',
                          'text-bg-warning':
                            legitimacyQuery.data.legitimate &&
                            legitimacyQuery.data.confidence !== 'high',
                          'text-bg-danger': !legitimacyQuery.data.legitimate,
                        })}
                      >
                        {legitimacyQuery.data.legitimate
                          ? 'احتمالاً معتبر'
                          : 'احتمالاً نامعتبر'}{' '}
                        &middot; اطمینان: {legitimacyQuery.data.confidence}
                      </span>
                    </div>
                    <small className="text-muted">
                      <ReactMarkdown>{legitimacyQuery.data.summary}</ReactMarkdown>
                    </small>
                    {legitimacyQuery.data.sources.length > 0 && (
                      <div className="mt-1">
                        <span className="small text-muted">منابع</span>
                        <div className="d-flex flex-wrap gap-1">
                          {Array.from(
                            new Map(legitimacyQuery.data.sources.map((s) => [s.url, s])).values(),
                            (source) => (
                              <a
                                key={source.url}
                                href={source.url}
                                target="_blank"
                                rel="noreferrer"
                                className="small"
                              >
                                {source.title ?? source.url}
                              </a>
                            ),
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
          <AdministratorCourseFormFields
            institutions={adminInstitutions}
            availableTimezones={availableTimezones}
            coursesRoot={coursesRoot}
            prefixState={prefixState}
            contactEmailDomain={request.contact_email?.split('@')[1] ?? ''}
            accountUidDomain={request.user_uid.split('@')[1] ?? ''}
            aiSecretsConfigured={aiSecretsConfigured}
            autoFilledInstitutionId={autoFilledInstitutionId}
            repositoryRequired={true}
            onInstitutionChange={handleInstitutionChange}
          />
          <div className="mb-3">
            <label className="form-label" htmlFor="courseRequestAddInputGithubCourseOwner">
              سازمان گیت‌هاب (GitHub Organization)
            </label>
            <input
              type="text"
              className={clsx('form-control', errors.github_course_owner && 'is-invalid')}
              id="courseRequestAddInputGithubCourseOwner"
              defaultValue={initialGithubCourseOwner}
              aria-invalid={errors.github_course_owner ? true : undefined}
              aria-errormessage={
                errors.github_course_owner
                  ? 'courseRequestAddInputGithubCourseOwner-error'
                  : undefined
              }
              aria-describedby="courseRequestAddInputGithubCourseOwnerHelp"
              {...register('github_course_owner', {
                required: 'نام سازمان گیت‌هاب الزامی است',
                validate: (value) => value.trim().length > 0 || 'نام سازمان گیت‌هاب الزامی است',
              })}
            />
            {errors.github_course_owner && (
              <div id="courseRequestAddInputGithubCourseOwner-error" className="invalid-feedback">
                {errors.github_course_owner.message}
              </div>
            )}
            <small id="courseRequestAddInputGithubCourseOwnerHelp" className="form-text text-muted">
              مخزن در این سازمان گیت‌هاب ایجاد خواهد شد. مقدار پیش‌فرض از تنظیمات موسسه انتخاب‌شده پر شده است و برای این درس قابل تغییر است.
            </small>
          </div>
          <div className="mb-3">
            <label className="form-label" htmlFor="courseRequestAddInputGithubUser">
              نام کاربری گیت‌هاب
            </label>
            <input
              type="text"
              className={clsx('form-control', errors.github_user && 'is-invalid')}
              id="courseRequestAddInputGithubUser"
              defaultValue={request.github_user ?? ''}
              aria-invalid={errors.github_user ? true : undefined}
              aria-errormessage={
                errors.github_user ? 'courseRequestAddInputGithubUser-error' : undefined
              }
              {...register('github_user', {
                validate: (value) =>
                  value.trim().length === 0 ||
                  isValidGithubUsername(value.trim()) ||
                  GITHUB_USERNAME_VALIDATION_MESSAGE,
              })}
            />
            {errors.github_user && (
              <div id="courseRequestAddInputGithubUser-error" className="invalid-feedback">
                {errors.github_user.message}
              </div>
            )}
          </div>
          <MutationError appError={appError} onDismiss={() => mutation.reset()} />
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
            ایجاد درس
          </button>
        </Modal.Footer>
      </form>
    </FormProvider>
  );
}

function MutationError({
  appError,
  onDismiss,
}: {
  appError: AppError<AdminCourseRequestError['CreateCourse']> | null;
  onDismiss: () => void;
}) {
  if (!appError) return null;

  if (appError.code === 'CONFLICTS') {
    return (
      <Alert variant="danger" className="mb-3" dismissible onClose={onDismiss}>
        <Alert.Heading as="h6" className="mb-1">
          <i className="fa fa-times-circle" aria-hidden="true" /> تداخل شناسایی شد
        </Alert.Heading>
        <ul className="mb-0 small">
          {appError.repoCourse && (
            <li>
              درسی با این نام مخزن از قبل وجود دارد:{' '}
              <a href={`/pl/course/${appError.repoCourse.id}`} target="_blank" rel="noreferrer">
                {appError.repoCourse.short_name}: {appError.repoCourse.title}
              </a>
            </li>
          )}
          {appError.githubRepoUrl && (
            <li>
              یک مخزن گیت‌هاب با این نام از قبل وجود دارد.{' '}
              <a href={appError.githubRepoUrl} target="_blank" rel="noreferrer">
                مشاهده مخزن
              </a>
              .
            </li>
          )}
          {appError.pathCourse && (
            <li>
              درسی با این مسیر از قبل وجود دارد:{' '}
              <a href={`/pl/course/${appError.pathCourse.id}`} target="_blank" rel="noreferrer">
                {appError.pathCourse.short_name}: {appError.pathCourse.title}
              </a>
            </li>
          )}
        </ul>
      </Alert>
    );
  }

  return (
    <Alert variant="danger" dismissible onClose={onDismiss}>
      {appError.message}
    </Alert>
  );
}

function CourseRequestDenyForm({
  request,
  onCancel,
}: {
  request: CourseRequestRow;
  onCancel: () => void;
}) {
  const trpc = useTRPC();
  const mutation = useMutation(trpc.courseRequests.deny.mutationOptions());
  const appError = getAppError<AdminCourseRequestError['Deny']>(mutation.error);

  return (
    <>
      {appError && (
        <Alert variant="danger" dismissible onClose={() => mutation.reset()}>
          {appError.message}
        </Alert>
      )}
      <div className="d-flex justify-content-end gap-2">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>
          انصراف
        </button>
        <button
          type="button"
          className="btn btn-danger"
          disabled={mutation.isPending}
          onClick={() =>
            mutation.mutate(
              { courseRequestId: request.id },
              { onSuccess: () => window.location.reload() },
            )
          }
        >
          رد درخواست
        </button>
      </div>
    </>
  );
}

function CourseRequestStatusIcon({ status }: { status: CourseRequestRow['approved_status'] }) {
  switch (status) {
    case 'pending':
      return (
        <span className="badge text-bg-secondary">
          <i className="fa fa-clock" aria-hidden="true" /> در انتظار بررسی
        </span>
      );
    case 'creating':
      return (
        <span className="badge text-bg-info">
          <i className="fa fa-sync" aria-hidden="true" /> در حال انجام
        </span>
      );
    case 'failed':
      return (
        <span className="badge text-bg-danger">
          <i className="fa fa-times" aria-hidden="true" /> عملیات ناموفق
        </span>
      );
    case 'approved':
      return (
        <span className="badge text-bg-success">
          <i className="fa fa-check" aria-hidden="true" /> تایید شده
        </span>
      );
    case 'denied':
      return (
        <span className="badge text-bg-danger">
          <i className="fa fa-times" aria-hidden="true" /> رد شده
        </span>
      );
  }
}

function CourseRequestEditNoteForm({
  request,
  onCancel,
}: {
  request: CourseRequestRow;
  onCancel: () => void;
}) {
  const trpc = useTRPC();
  const mutation = useMutation(trpc.courseRequests.updateNote.mutationOptions());
  const appError = getAppError<AdminCourseRequestError['UpdateNote']>(mutation.error);

  const {
    register,
    handleSubmit,
    formState: { isSubmitting, isDirty },
  } = useForm<{ note: string }>({
    defaultValues: { note: request.note ?? '' },
  });

  const onSubmit = ({ note }: { note: string }) => {
    mutation.mutate(
      { courseRequestId: request.id, note },
      { onSuccess: () => window.location.reload() },
    );
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="d-flex gap-2 align-items-center py-2 px-2">
        <label className="visually-hidden" htmlFor={`course-request-note-${request.id}`}>
          یادداشت برای درخواست درس {request.short_name}
        </label>
        <textarea
          className="form-control flex-grow-1"
          id={`course-request-note-${request.id}`}
          rows={1}
          maxLength={10000}
          placeholder="یادداشتی درباره این درخواست درس بنویسید..."
          defaultValue={request.note ?? ''}
          {...register('note')}
        />
        <button type="button" className="btn btn-secondary" onClick={onCancel}>
          بستن
        </button>
        <button
          type="submit"
          className="btn btn-primary text-nowrap"
          disabled={!isDirty || isSubmitting || mutation.isPending}
        >
          <i className="fa fa-save" aria-hidden="true" /> ذخیره یادداشت
        </button>
      </div>
      {appError && (
        <Alert variant="danger" dismissible onClose={() => mutation.reset()}>
          {appError.message}
        </Alert>
      )}
    </form>
  );
}

function EmptyState({ value, label }: { value: string | null; label: string }) {
  if (value) return value;
  return <span className="text-muted fst-italic">{label}</span>;
}
