import { QueryClient, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import clsx from 'clsx';
import { Fragment, useState } from 'react';
import { Alert, Modal } from 'react-bootstrap';
import { useForm } from 'react-hook-form';

import { getAppError } from '@prairielearn/trpc/client';
import { AppErrorAlert, QueryClientProviderDebug } from '@prairielearn/trpc/react';
import { useModalState } from '@prairielearn/ui';

import { CopyButton } from '../../components/CopyButton.js';
import { CourseSharingNameSchema } from '../../lib/client/course-sharing.js';
import { getCourseEditErrorUrl, getQuestionSettingsUrl } from '../../lib/client/url.js';
import type { SharingSetRow } from '../../models/sharing-set.js';
import { createCourseTrpcClient } from '../../trpc/course/client.js';
import { TRPCProvider, useTRPC } from '../../trpc/course/context.js';
import type { SharingError } from '../../trpc/course/sharing.js';

interface InstructorCourseAdminSharingProps {
  sharingName: string | null;
  sharingToken: string;
  sharingSets: SharingSetRow[];
  publicSharingLink: string;
  canChooseSharingName: boolean;
  canEdit: boolean;
  origHash: string;
  courseId: string;
  trpcCsrfToken: string;
}

export function InstructorCourseAdminSharing(props: InstructorCourseAdminSharingProps) {
  const [queryClient] = useState(() => new QueryClient());
  const [trpcClient] = useState(() =>
    createCourseTrpcClient({
      csrfToken: props.trpcCsrfToken,
      courseId: props.courseId,
    }),
  );

  return (
    <QueryClientProviderDebug client={queryClient}>
      <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
        <InstructorCourseAdminSharingInner {...props} />
      </TRPCProvider>
    </QueryClientProviderDebug>
  );
}

InstructorCourseAdminSharing.displayName = 'InstructorCourseAdminSharing';

function InstructorCourseAdminSharingInner({
  sharingName: initialSharingName,
  sharingToken: initialSharingToken,
  sharingSets: initialSharingSets,
  publicSharingLink,
  canChooseSharingName,
  canEdit,
  origHash: initialOrigHash,
  courseId,
}: InstructorCourseAdminSharingProps) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const [sharingName, setSharingName] = useState(initialSharingName);
  const [sharingToken, setSharingToken] = useState(initialSharingToken);
  const [origHash, setOrigHash] = useState(initialOrigHash);

  const sharingSetsQuery = useQuery({
    ...trpc.sharing.listSharingSets.queryOptions(),
    initialData: initialSharingSets,
  });
  const sharingSets = sharingSetsQuery.data;

  const invalidateSharingSets = () =>
    queryClient.invalidateQueries(trpc.sharing.listSharingSets.queryFilter());

  const chooseSharingNameModal = useModalState();
  const addSharingSetModal = useModalState();
  const addCourseModal = useModalState<SharingSetRow>();
  const editDescriptionModal = useModalState<SharingSetRow>();
  const deleteModal = useModalState<SharingSetRow>();

  return (
    <>
      <ChooseSharingNameModal
        show={chooseSharingNameModal.show}
        canChooseSharingName={canChooseSharingName}
        currentSharingName={sharingName}
        onSuccess={(name) => {
          setSharingName(name);
          chooseSharingNameModal.hide();
        }}
        onHide={chooseSharingNameModal.hide}
        onExited={chooseSharingNameModal.onExited}
      />
      {canEdit && (
        <AddSharingSetModal
          show={addSharingSetModal.show}
          origHash={origHash}
          courseId={courseId}
          onSuccess={(newOrigHash) => {
            setOrigHash(newOrigHash);
            void invalidateSharingSets();
            addSharingSetModal.hide();
          }}
          onHide={addSharingSetModal.hide}
          onExited={addSharingSetModal.onExited}
        />
      )}
      <AddCourseToSharingSetModal
        show={addCourseModal.show}
        data={addCourseModal.data}
        onSuccess={() => {
          void invalidateSharingSets();
          addCourseModal.hide();
        }}
        onHide={addCourseModal.hide}
        onExited={addCourseModal.onExited}
      />
      {canEdit && (
        <EditSharingSetDescriptionModal
          show={editDescriptionModal.show}
          data={editDescriptionModal.data}
          origHash={origHash}
          courseId={courseId}
          onSuccess={(newOrigHash) => {
            setOrigHash(newOrigHash);
            void invalidateSharingSets();
            editDescriptionModal.hide();
          }}
          onHide={editDescriptionModal.hide}
          onExited={editDescriptionModal.onExited}
        />
      )}
      {canEdit && (
        <DeleteSharingSetModal
          show={deleteModal.show}
          data={deleteModal.data}
          origHash={origHash}
          courseId={courseId}
          onSuccess={(newOrigHash) => {
            setOrigHash(newOrigHash);
            void invalidateSharingSets();
            deleteModal.hide();
          }}
          onHide={deleteModal.hide}
          onExited={deleteModal.onExited}
        />
      )}

      <div className="card mb-4">
        <div className="card-header bg-primary text-white d-flex">
          <h1>جزئیات اشتراک‌گذاری درس</h1>
        </div>
        <div className="table-responsive">
          <table
            className="table table-sm table-hover two-column-description"
            aria-label="جزئیات اشتراک‌گذاری درس"
          >
            <tbody>
              <tr>
                <th>نام اشتراک‌گذاری</th>
                <td data-testid="sharing-name">
                  {sharingName !== null ? sharingName : ''}
                  {canEdit && canChooseSharingName && (
                    <button
                      type="button"
                      className="btn btn-xs btn-secondary mx-2"
                      aria-label="انتخاب نام اشتراک‌گذاری"
                      onClick={() => chooseSharingNameModal.showWithData(null)}
                    >
                      <i className="bi bi-share-fill" aria-hidden="true" />
                      <span className="d-none d-sm-inline"> انتخاب نام اشتراک‌گذاری</span>
                    </button>
                  )}
                </td>
              </tr>
              <tr>
                <th>توکن اشتراک‌گذاری</th>
                <td>
                  {sharingToken}
                  <CopyButton
                    text={sharingToken}
                    label="کپی"
                    className="btn-xs btn-secondary mx-2"
                  />
                  {canEdit && <RegenerateSharingTokenButton onRegenerated={setSharingToken} />}
                </td>
              </tr>
              <tr>
                <th>صفحه سوالات عمومی</th>
                <td className="align-middle">
                  <a href={publicSharingLink} target="_blank" rel="noreferrer">
                    {publicSharingLink}
                  </a>
                  <CopyButton
                    text={publicSharingLink}
                    label="کپی"
                    className="btn-xs btn-secondary mx-2"
                  />
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div className="card mb-4">
        <div className="card-header bg-primary text-white d-flex align-items-center justify-content-between">
          <h2>مجموعه‌های اشتراک‌گذاری</h2>
          {canEdit && (
            <button
              type="button"
              className="btn btn-sm btn-light"
              onClick={() => addSharingSetModal.showWithData(null)}
            >
              <i className="bi bi-plus-lg" aria-hidden="true" /> افزودن مجموعه اشتراک‌گذاری
            </button>
          )}
        </div>
        <div className="table-responsive">
          <table className="table table-sm table-hover table-striped" aria-label="مجموعه‌های اشتراک‌گذاری">
            <thead>
              <tr>
                <th>نام مجموعه اشتراک‌گذاری</th>
                <th>توضیحات</th>
                <th>اشتراک‌گذاری شده با</th>
                {canEdit && <th className="text-end">عملیات</th>}
              </tr>
            </thead>
            <tbody>
              {sharingSets.length === 0 ? (
                <tr>
                  <td
                    colSpan={canEdit ? 4 : 3}
                    className="text-center text-muted align-middle py-3"
                  >
                    هنوز هیچ مجموعه اشتراک‌گذاری تعریف نشده است.
                  </td>
                </tr>
              ) : (
                sharingSets.map((sharingSet) => (
                  <SharingSetTableRow
                    key={sharingSet.id}
                    sharingSet={sharingSet}
                    courseId={courseId}
                    canEdit={canEdit}
                    onAddCourse={() => addCourseModal.showWithData(sharingSet)}
                    onEditDescription={() => editDescriptionModal.showWithData(sharingSet)}
                    onDelete={() => deleteModal.showWithData(sharingSet)}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

function SharingSetTableRow({
  sharingSet,
  courseId,
  canEdit,
  onAddCourse,
  onEditDescription,
  onDelete,
}: {
  sharingSet: SharingSetRow;
  courseId: string;
  canEdit: boolean;
  onAddCourse: () => void;
  onEditDescription: () => void;
  onDelete: () => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const inUse = sharingSet.question_count > 0 || sharingSet.shared_with.length > 0;
  const detailsId = `sharing-set-questions-${sharingSet.id}`;
  return (
    <Fragment>
      <tr>
        <td className="align-middle">
          <button
            type="button"
            className="btn btn-sm btn-link p-0 text-decoration-none align-baseline"
            aria-expanded={isExpanded}
            aria-controls={detailsId}
            onClick={() => setIsExpanded((v) => !v)}
          >
            <i
              className={clsx('bi', isExpanded ? 'bi-chevron-down' : 'bi-chevron-right', 'me-1')}
              aria-hidden="true"
            />
            {sharingSet.name}
          </button>{' '}
          <span className="text-muted small">
            ({sharingSet.question_count} سوال)
          </span>
        </td>
        <td className="align-middle text-muted">{sharingSet.description ?? ''}</td>
        <td className="align-middle" data-testid="shared-with">
          {sharingSet.shared_with.map((courseSharedWith) => (
            <span key={courseSharedWith} className="badge color-gray1">
              {courseSharedWith}
            </span>
          ))}
          {canEdit && (
            <div className="btn-group btn-group-sm" role="group">
              <button
                type="button"
                className="btn btn-sm btn-outline-dark"
                aria-label="افزودن درس به مجموعه اشتراک‌گذاری"
                onClick={onAddCourse}
              >
                افزودن...
                <i className="bi bi-plus-lg" aria-hidden="true" />
              </button>
            </div>
          )}
        </td>
        {canEdit && (
          <td className="align-middle">
            <div className="d-flex justify-content-end gap-2">
              <button
                type="button"
                className="btn btn-sm btn-outline-secondary"
                aria-label={`ویرایش توضیحات برای ${sharingSet.name}`}
                onClick={onEditDescription}
              >
                <i className="bi bi-pencil" aria-hidden="true" /> ویرایش
              </button>
              {inUse ? (
                <span
                  className="d-inline-block"
                  title="امکان حذف وجود ندارد: مجموعه اشتراک‌گذاری شامل سوال است یا با درس‌های دیگر به اشتراک گذاشته شده است."
                >
                  <button
                    type="button"
                    className="btn btn-sm btn-outline-danger"
                    aria-label={`حذف مجموعه اشتراک‌گذاری ${sharingSet.name}`}
                    disabled
                  >
                    <i className="bi bi-trash" aria-hidden="true" /> حذف
                  </button>
                </span>
              ) : (
                <button
                  type="button"
                  className="btn btn-sm btn-outline-danger"
                  aria-label={`حذف مجموعه اشتراک‌گذاری ${sharingSet.name}`}
                  onClick={onDelete}
                >
                  <i className="bi bi-trash" aria-hidden="true" /> حذف
                </button>
              )}
            </div>
          </td>
        )}
      </tr>
      {isExpanded && (
        <tr id={detailsId}>
          <td colSpan={canEdit ? 4 : 3} className="bg-light">
            {sharingSet.questions.length === 0 ? (
              <div className="small text-muted">هنوز سوالی در این مجموعه اشتراک‌گذاری وجود ندارد.</div>
            ) : (
              <div className="d-flex flex-wrap gap-1">
                {sharingSet.questions.map((q) => (
                  <a
                    key={q.id}
                    href={getQuestionSettingsUrl({ questionId: q.id, courseId })}
                    className="btn btn-badge color-gray1"
                  >
                    {q.qid}
                  </a>
                ))}
              </div>
            )}
          </td>
        </tr>
      )}
    </Fragment>
  );
}

function RegenerateSharingTokenButton({
  onRegenerated,
}: {
  onRegenerated: (sharingToken: string) => void;
}) {
  const trpc = useTRPC();
  const mutation = useMutation(trpc.sharing.regenerateSharingToken.mutationOptions());
  return (
    <>
      <button
        type="button"
        className="btn btn-xs btn-secondary"
        disabled={mutation.isPending}
        onClick={() =>
          mutation.mutate(undefined, {
            onSuccess: ({ sharingToken }) => onRegenerated(sharingToken),
          })
        }
      >
        <i className="bi bi-arrow-clockwise" aria-hidden="true" /> <span>تولید مجدد</span>
      </button>
      <AppErrorAlert
        error={getAppError<SharingError['RegenerateSharingToken']>(mutation.error)}
        className="mt-2"
        render={{
          UNKNOWN: ({ message }) => message,
        }}
        onDismiss={() => mutation.reset()}
      />
    </>
  );
}

function ChooseSharingNameModal({
  show,
  onHide,
  onExited,
  onSuccess,
  canChooseSharingName,
  currentSharingName,
}: {
  show: boolean;
  onHide: () => void;
  onExited: () => void;
  onSuccess: (sharingName: string) => void;
  canChooseSharingName: boolean;
  currentSharingName: string | null;
}) {
  const trpc = useTRPC();
  const mutation = useMutation(trpc.sharing.chooseSharingName.mutationOptions());
  const {
    register,
    handleSubmit,
    formState: { isSubmitting, errors },
    reset,
  } = useForm<{ courseSharingName: string }>({
    mode: 'onSubmit',
    defaultValues: { courseSharingName: currentSharingName ?? '' },
  });

  const onSubmit = (data: { courseSharingName: string }) => {
    const courseSharingName = data.courseSharingName.trim();
    mutation.mutate({ courseSharingName }, { onSuccess: () => onSuccess(courseSharingName) });
  };

  const handleHide = () => {
    if (isSubmitting || mutation.isPending) return;
    mutation.reset();
    onHide();
  };

  const handleExited = () => {
    reset({ courseSharingName: currentSharingName ?? '' });
    mutation.reset();
    onExited();
  };

  if (!canChooseSharingName) {
    return (
      <Modal show={show} onHide={handleHide} onExited={handleExited}>
        <Modal.Header closeButton>
          <Modal.Title>انتخاب نام اشتراک‌گذاری</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <strong>امکان تغییر نام اشتراک‌گذاری درس وجود ندارد.</strong>
          <p>
            نام اشتراک‌گذاری درس شما قابل تغییر نیست زیرا حداقل یک سوال به اشتراک گذاشته شده است.
            تغییر آن باعث از کار افتادن آزمون‌های درس‌های دیگری می‌شود که سوالات شما را وارد
            کرده‌اند.
          </p>
        </Modal.Body>
        <Modal.Footer>
          <button type="button" className="btn btn-secondary" onClick={handleHide}>
            بستن
          </button>
        </Modal.Footer>
      </Modal>
    );
  }

  return (
    <Modal show={show} onHide={handleHide} onExited={handleExited}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Modal.Header closeButton>
          <Modal.Title>انتخاب نام اشتراک‌گذاری</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <AppErrorAlert
            error={getAppError<SharingError['ChooseSharingName']>(mutation.error)}
            render={{
              DUPLICATE_NAME: ({ message }) => message,
              UNKNOWN: ({ message }) => message,
            }}
            onDismiss={() => mutation.reset()}
          />
          <p className="form-text">نام اشتراک‌گذاری مورد نظر خود را برای این درس وارد کنید.</p>
          <div className="mb-3">
            <label className="form-label" htmlFor="course_sharing_name">
              نام اشتراک‌گذاری
            </label>
            <input
              className={clsx('form-control', errors.courseSharingName && 'is-invalid')}
              type="text"
              id="course_sharing_name"
              defaultValue={currentSharingName ?? ''}
              aria-describedby="course_sharing_name_help"
              aria-invalid={errors.courseSharingName ? 'true' : undefined}
              aria-errormessage={errors.courseSharingName ? 'course_sharing_name_error' : undefined}
              {...register('courseSharingName', {
                validate: (value) => {
                  const result = CourseSharingNameSchema.safeParse(value);
                  return result.success || result.error.issues[0].message;
                },
              })}
            />
            <div id="course_sharing_name_help" className="form-text">
              از ۱ تا ۶۴ نویسه استفاده کنید: حروف، اعداد، خط تیره یا زیرخط.
            </div>
            {errors.courseSharingName && (
              <div id="course_sharing_name_error" className="invalid-feedback">
                {errors.courseSharingName.message}
              </div>
            )}
          </div>
          <Alert variant="secondary" className="py-2 small">
            <strong>
              پس از اشتراک‌گذاری یک سوال به صورت عمومی یا با درس دیگر، دیگر امکان تغییر نام
              اشتراک‌گذاری خود را نخواهید داشت.
            </strong>{' '}
            تغییر آن باعث از کار افتادن آزمون‌های درس‌های دیگری می‌شود که سوالات شما را وارد
            کرده‌اند.
          </Alert>
          <p className="form-text mb-0">
            توصیه می‌شود نامی کوتاه اما گویا انتخاب کنید. برای مثال، اگر درس حسابان را در دانشگاهی
            با نام اختصاری <code>XYZ</code> تدریس می‌کنید، می‌توانید نام اشتراک‌گذاری{' '}
            <code>xyz-calculus</code> را انتخاب کنید. در این صورت سایر درس‌ها سوالات شما را با قالب{' '}
            <code>@xyz-calculus/&lt;qid&gt;</code> وارد خواهند کرد.
          </p>
        </Modal.Body>
        <Modal.Footer>
          <button
            type="button"
            className="btn btn-secondary"
            disabled={isSubmitting || mutation.isPending}
            onClick={handleHide}
          >
            انصراف
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting || mutation.isPending}
          >
            انتخاب نام اشتراک‌گذاری
          </button>
        </Modal.Footer>
      </form>
    </Modal>
  );
}

function AddSharingSetModal({
  show,
  onHide,
  onExited,
  onSuccess,
  origHash,
  courseId,
}: {
  show: boolean;
  onHide: () => void;
  onExited: () => void;
  onSuccess: (origHash: string) => void;
  origHash: string;
  courseId: string;
}) {
  const trpc = useTRPC();
  const mutation = useMutation(trpc.sharing.createSharingSet.mutationOptions());
  const {
    register,
    handleSubmit,
    formState: { isSubmitting, errors },
    reset,
  } = useForm<{ name: string; description: string }>({
    mode: 'onSubmit',
    defaultValues: { name: '', description: '' },
  });

  const appError = getAppError<SharingError['CreateSharingSet']>(mutation.error);
  const inlineError = appError?.code === 'SYNC_JOB_FAILED' ? null : appError;

  const onSubmit = (data: { name: string; description: string }) => {
    mutation.mutate(
      {
        name: data.name,
        description: data.description || undefined,
        origHash,
      },
      {
        onSuccess: ({ origHash: newOrigHash }) => onSuccess(newOrigHash),
        onError: (err) => {
          const ae = getAppError<SharingError['CreateSharingSet']>(err);
          if (ae?.code === 'SYNC_JOB_FAILED') {
            window.location.assign(getCourseEditErrorUrl(courseId, ae.jobSequenceId));
          }
        },
      },
    );
  };

  const handleHide = () => {
    if (isSubmitting || mutation.isPending) return;
    mutation.reset();
    onHide();
  };

  const handleExited = () => {
    reset({ name: '', description: '' });
    mutation.reset();
    onExited();
  };

  return (
    <Modal show={show} onHide={handleHide} onExited={handleExited}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Modal.Header closeButton>
          <Modal.Title>افزودن مجموعه اشتراک‌گذاری</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <AppErrorAlert
            error={inlineError}
            render={{
              DUPLICATE_NAME: ({ message }) => message,
              UNKNOWN: ({ message }) => message,
            }}
            onDismiss={() => mutation.reset()}
          />
          <p className="small text-muted">
            یک{' '}
            <a
              href="https://docs.prairielearn.com/contentSharing/#sharing-sets"
              target="_blank"
              rel="noopener noreferrer"
            >
              مجموعه اشتراک‌گذاری
            </a>{' '}
            مجموعه‌ای نام‌گذاری‌شده از سوالات است که می‌توانید با درس دیگری به اشتراک بگذارید. این
            امکان به شما اجازه می‌دهد مجموعه‌های متفاوتی از سوالات خود را به اشتراک بگذارید؛ برای
            مثال برخی سوالات را فقط با درس‌های دانشکده خود به اشتراک بگذارید. برای جزئیات بیشتر{' '}
            <a
              href="https://docs.prairielearn.com/contentSharing/"
              target="_blank"
              rel="noopener noreferrer"
            >
              مستندات اشتراک‌گذاری محتوا
            </a>{' '}
            را ببینید.
          </p>
          <div className="mb-3">
            <label className="form-label" htmlFor="new_sharing_set_name">
              نام
            </label>
            <input
              type="text"
              className="form-control"
              id="new_sharing_set_name"
              defaultValue=""
              aria-invalid={errors.name ? 'true' : undefined}
              aria-errormessage={errors.name ? 'new_sharing_set_name_error' : undefined}
              {...register('name', {
                required: 'نام مجموعه اشتراک‌گذاری الزامی است.',
                validate: (v) =>
                  (!v.includes('/') && !v.includes('@')) ||
                  'نام مجموعه اشتراک‌گذاری نمی‌تواند شامل "/" یا "@" باشد.',
              })}
            />
            {errors.name ? (
              <div id="new_sharing_set_name_error" className="text-danger small">
                <i className="bi bi-exclamation-circle me-1" aria-hidden="true" />
                {errors.name.message}
              </div>
            ) : (
              <small className="form-text text-muted">
                یک شناسه کوتاه، مثلاً <code>exam-questions</code>. نمی‌تواند شامل "/" یا "@" باشد.
              </small>
            )}
          </div>
          <div className="mb-3">
            <label className="form-label" htmlFor="new_sharing_set_description">
              توضیحات (اختیاری)
            </label>
            <textarea
              className="form-control"
              id="new_sharing_set_description"
              rows={2}
              defaultValue=""
              {...register('description')}
            />
          </div>
        </Modal.Body>
        <Modal.Footer>
          <button
            type="button"
            className="btn btn-secondary"
            disabled={isSubmitting || mutation.isPending}
            onClick={handleHide}
          >
            انصراف
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting || mutation.isPending}
          >
            افزودن مجموعه اشتراک‌گذاری
          </button>
        </Modal.Footer>
      </form>
    </Modal>
  );
}

function AddCourseToSharingSetModal({
  show,
  data,
  onHide,
  onExited,
  onSuccess,
}: {
  show: boolean;
  data: SharingSetRow | null;
  onHide: () => void;
  onExited: () => void;
  onSuccess: () => void;
}) {
  const trpc = useTRPC();
  const mutation = useMutation(trpc.sharing.addCourseToSharingSet.mutationOptions());
  const {
    register,
    handleSubmit,
    formState: { isSubmitting, errors },
    reset,
  } = useForm<{ courseSharingToken: string }>({
    mode: 'onSubmit',
    defaultValues: { courseSharingToken: '' },
  });

  if (!data) return null;

  const onSubmit = (formData: { courseSharingToken: string }) => {
    mutation.mutate(
      { sharingSetId: data.id, courseSharingToken: formData.courseSharingToken },
      { onSuccess },
    );
  };

  const handleHide = () => {
    if (isSubmitting || mutation.isPending) return;
    mutation.reset();
    onHide();
  };

  const handleExited = () => {
    reset({ courseSharingToken: '' });
    mutation.reset();
    onExited();
  };

  return (
    <Modal show={show} onHide={handleHide} onExited={handleExited}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Modal.Header closeButton>
          <Modal.Title>افزودن درس به مجموعه اشتراک‌گذاری</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <AppErrorAlert
            error={getAppError<SharingError['AddCourseToSharingSet']>(mutation.error)}
            render={{
              UNKNOWN: ({ message }) => message,
            }}
            onDismiss={() => mutation.reset()}
          />
          <p className="form-text text-wrap">
            برای اجازه دسترسی به درس دیگری به سوالات مجموعه اشتراک‌گذاری «{data.name}»، توکن
            اشتراک‌گذاری آن درس را در زیر وارد کنید.
          </p>
          <div className="mb-3">
            <label className="form-label" htmlFor="course_sharing_token">
              توکن اشتراک‌گذاری درس
            </label>
            <input
              className="form-control"
              type="text"
              id="course_sharing_token"
              defaultValue=""
              aria-invalid={errors.courseSharingToken ? 'true' : undefined}
              aria-errormessage={
                errors.courseSharingToken ? 'course_sharing_token_error' : undefined
              }
              {...register('courseSharingToken', {
                required: 'توکن اشتراک‌گذاری درس الزامی است.',
              })}
            />
            {errors.courseSharingToken && (
              <div id="course_sharing_token_error" className="text-danger small">
                <i className="bi bi-exclamation-circle me-1" aria-hidden="true" />
                {errors.courseSharingToken.message}
              </div>
            )}
          </div>
        </Modal.Body>
        <Modal.Footer>
          <button
            type="button"
            className="btn btn-secondary"
            disabled={isSubmitting || mutation.isPending}
            onClick={handleHide}
          >
            انصراف
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting || mutation.isPending}
          >
            افزودن درس
          </button>
        </Modal.Footer>
      </form>
    </Modal>
  );
}

function EditSharingSetDescriptionModal({
  show,
  data,
  onHide,
  onExited,
  onSuccess,
  origHash,
  courseId,
}: {
  show: boolean;
  data: SharingSetRow | null;
  onHide: () => void;
  onExited: () => void;
  onSuccess: (origHash: string) => void;
  origHash: string;
  courseId: string;
}) {
  const trpc = useTRPC();
  const mutation = useMutation(trpc.sharing.updateSharingSetDescription.mutationOptions());
  const {
    register,
    handleSubmit,
    formState: { isSubmitting },
  } = useForm<{ description: string }>({
    mode: 'onSubmit',
    values: { description: data?.description ?? '' },
  });

  const appError = getAppError<SharingError['UpdateSharingSetDescription']>(mutation.error);
  const inlineError = appError?.code === 'SYNC_JOB_FAILED' ? null : appError;

  if (!data) return null;
  const defaultDescription = data.description ?? '';

  const onSubmit = (formData: { description: string }) => {
    mutation.mutate(
      { name: data.name, description: formData.description || undefined, origHash },
      {
        onSuccess: ({ origHash: newOrigHash }) => onSuccess(newOrigHash),
        onError: (err) => {
          const ae = getAppError<SharingError['UpdateSharingSetDescription']>(err);
          if (ae?.code === 'SYNC_JOB_FAILED') {
            window.location.assign(getCourseEditErrorUrl(courseId, ae.jobSequenceId));
          }
        },
      },
    );
  };

  const handleHide = () => {
    if (isSubmitting || mutation.isPending) return;
    mutation.reset();
    onHide();
  };

  const handleExited = () => {
    mutation.reset();
    onExited();
  };

  return (
    <Modal show={show} onHide={handleHide} onExited={handleExited}>
      <form onSubmit={handleSubmit(onSubmit)}>
        <Modal.Header closeButton>
          <Modal.Title>ویرایش مجموعه اشتراک‌گذاری «{data.name}»</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <AppErrorAlert
            error={inlineError}
            render={{
              NOT_FOUND: ({ message }) => message,
              UNKNOWN: ({ message }) => message,
            }}
            onDismiss={() => mutation.reset()}
          />
          <div className="mb-3">
            <label className="form-label" htmlFor={`sharing_set_description_${data.id}`}>
              توضیحات
            </label>
            <textarea
              className="form-control"
              id={`sharing_set_description_${data.id}`}
              rows={3}
              defaultValue={defaultDescription}
              {...register('description')}
            />
            <small className="form-text text-muted">برای حذف توضیحات، این بخش را خالی بگذارید.</small>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <button
            type="button"
            className="btn btn-secondary"
            disabled={isSubmitting || mutation.isPending}
            onClick={handleHide}
          >
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

function DeleteSharingSetModal({
  show,
  data,
  onHide,
  onExited,
  onSuccess,
  origHash,
  courseId,
}: {
  show: boolean;
  data: SharingSetRow | null;
  onHide: () => void;
  onExited: () => void;
  onSuccess: (origHash: string) => void;
  origHash: string;
  courseId: string;
}) {
  const trpc = useTRPC();
  const mutation = useMutation(trpc.sharing.deleteSharingSet.mutationOptions());

  const appError = getAppError<SharingError['DeleteSharingSet']>(mutation.error);
  const inlineError = appError?.code === 'SYNC_JOB_FAILED' ? null : appError;

  if (!data) return null;

  const handleDelete = () => {
    mutation.mutate(
      { name: data.name, origHash },
      {
        onSuccess: ({ origHash: newOrigHash }) => onSuccess(newOrigHash),
        onError: (err) => {
          const ae = getAppError<SharingError['DeleteSharingSet']>(err);
          if (ae?.code === 'SYNC_JOB_FAILED') {
            window.location.assign(getCourseEditErrorUrl(courseId, ae.jobSequenceId));
          }
        },
      },
    );
  };

  const handleHide = () => {
    if (mutation.isPending) return;
    mutation.reset();
    onHide();
  };

  const handleExited = () => {
    mutation.reset();
    onExited();
  };

  return (
    <Modal show={show} onHide={handleHide} onExited={handleExited}>
      <Modal.Header closeButton>
        <Modal.Title>حذف مجموعه اشتراک‌گذاری</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <AppErrorAlert
          error={inlineError}
          render={{
            IN_USE: ({ message }) => message,
            NOT_FOUND: ({ message }) => message,
            UNKNOWN: ({ message }) => message,
          }}
          onDismiss={() => mutation.reset()}
        />
        <p className="form-text text-wrap">
          مجموعه اشتراک‌گذاری «{data.name}» حذف شود؟ این عملیات قابل بازگشت نیست.
        </p>
      </Modal.Body>
      <Modal.Footer>
        <button
          type="button"
          className="btn btn-secondary"
          disabled={mutation.isPending}
          onClick={handleHide}
        >
          انصراف
        </button>
        <button
          type="button"
          className="btn btn-danger"
          disabled={mutation.isPending}
          onClick={handleDelete}
        >
          حذف
        </button>
      </Modal.Footer>
    </Modal>
  );
}
