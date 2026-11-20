import { QueryClient, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Alert, Form } from 'react-bootstrap';
import { useForm } from 'react-hook-form';

import { getAppError } from '@prairielearn/trpc/client';
import { AppErrorAlert, QueryClientProviderDebug } from '@prairielearn/trpc/react';
import { StickySaveBar, useModalState } from '@prairielearn/ui';

import { AssessmentModuleHeading } from '../../../components/AssessmentModuleHeading.js';
import { AssessmentUsageModal } from '../../../components/AssessmentUsageModal.js';
import {
  ReorderableRowActionsCell,
  ReorderableRowsContext,
  getDuplicateNames,
  useReorderableRow,
} from '../../../components/ReorderableTable.js';
import { DEFAULT_ASSESSMENT_MODULE_NAME } from '../../../lib/assessment-modules.shared.js';
import { getCourseEditErrorUrl } from '../../../lib/client/url.js';
import type { AssessmentModulesError } from '../../../trpc/course/assessment-modules.js';
import { createCourseTrpcClient } from '../../../trpc/course/client.js';
import { TRPCProvider, useTRPC } from '../../../trpc/course/context.js';
import type {
  AssessmentModuleFormRow,
  StaffAssessmentModuleWithAssessments,
} from '../instructorCourseAdminModules.types.js';

import {
  DeleteAssessmentModuleModal,
  type DeleteAssessmentModuleModalData,
} from './DeleteAssessmentModuleModal.js';
import {
  EditAssessmentModuleModal,
  type EditAssessmentModuleModalData,
} from './EditAssessmentModuleModal.js';

interface AssessmentModulesPageProps {
  trpcCsrfToken: string;
  courseId: string;
  initialModules: StaffAssessmentModuleWithAssessments[];
  allowEdit: boolean;
  isExampleCourse: boolean;
  origHash: string | null;
}

const emptyModule = {
  assessments: [],
  course_id: null,
  heading: '',
  id: null,
  implicit: false,
  name: '',
  number: 0,
};

function toFormRow(module: StaffAssessmentModuleWithAssessments): AssessmentModuleFormRow {
  return { ...module, trackingId: module.id };
}

function orderModules(modules: AssessmentModuleFormRow[]) {
  return [
    ...modules.filter((module) => !module.implicit),
    ...modules.filter(
      (module) => module.implicit && module.name !== DEFAULT_ASSESSMENT_MODULE_NAME,
    ),
    ...modules.filter(
      (module) => module.implicit && module.name === DEFAULT_ASSESSMENT_MODULE_NAME,
    ),
  ];
}

function AssessmentModuleRow({
  module,
  allowEdit,
  onEdit,
  onDelete,
  onShowUsage,
}: {
  module: AssessmentModuleFormRow;
  allowEdit: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onShowUsage: () => void;
}) {
  const dragDisabled = module.implicit;
  const { ref, style, dragHandleProps } = useReorderableRow(module.trackingId, dragDisabled);

  return (
    <tr ref={ref} style={style}>
      {allowEdit && (
        <ReorderableRowActionsCell
          trackingId={module.trackingId}
          dragHandleProps={dragHandleProps}
          dragDisabled={dragDisabled}
          editLabel={`ویرایش پودمان ${module.name}`}
          deleteLabel={`حذف پودمان ${module.name}`}
          deleteDisabledReason={
            module.name === DEFAULT_ASSESSMENT_MODULE_NAME
              ? 'پودمان پیش‌فرض (Default) اجباری است و قابل حذف نمی‌باشد.'
              : null
          }
          onEdit={onEdit}
          onDelete={onDelete}
        />
      )}
      <td className="align-middle pe-4">{module.name}</td>
      <td className="align-middle pe-4">
        <AssessmentModuleHeading assessmentModule={module} />
      </td>
      <td className="align-middle">
        <button
          type="button"
          className="btn btn-sm btn-outline-secondary text-nowrap"
          aria-label={`مشاهده ارزیابی‌های مربوط به پودمان ${module.name}`}
          onClick={onShowUsage}
        >
          مشاهده آزمون‌ها
        </button>
      </td>
    </tr>
  );
}

function AssessmentModulesTable({
  rows,
  onReorder,
  allowEdit,
  handleEdit,
  handleDelete,
  handleCreate,
  handleShowUsage,
}: {
  rows: AssessmentModuleFormRow[];
  onReorder: (rows: AssessmentModuleFormRow[]) => void;
  allowEdit: boolean;
  handleEdit: (trackingId: string) => void;
  handleDelete: (module: AssessmentModuleFormRow) => void;
  handleCreate: () => void;
  handleShowUsage: (module: AssessmentModuleFormRow) => void;
}) {
  const implicitRows = rows.filter((module) => module.implicit);
  const reorderableRows = rows.filter((module) => !module.implicit);

  return (
    <ReorderableRowsContext
      rows={reorderableRows}
      onReorder={(reorderedRows) => onReorder([...reorderedRows, ...implicitRows])}
    >
      <table className="table table-sm table-hover table-striped" aria-label="پودمان‌های ارزیابی">
        <thead>
          <tr>
            {allowEdit && (
              <th style={{ width: '1%' }}>
                <span className="visually-hidden">جابجایی، ویرایش و حذف</span>
              </th>
            )}
            <th className="col-3 pe-4">عنوان پودمان (کد)</th>
            <th className="pe-4">سربرگ نمایشی برای دانشجویان</th>
            <th style={{ width: '1%' }}>عملیات</th>
          </tr>
        </thead>
        <tbody>
          {reorderableRows.map((module) => (
            <AssessmentModuleRow
              key={module.trackingId}
              module={module}
              allowEdit={allowEdit}
              onEdit={() => handleEdit(module.trackingId)}
              onDelete={() => handleDelete(module)}
              onShowUsage={() => handleShowUsage(module)}
            />
          ))}
          {allowEdit && (
            <tr>
              <td colSpan={4}>
                <button className="btn btn-sm btn-ghost" type="button" onClick={handleCreate}>
                  <i className="fa fa-plus me-1" aria-hidden="true" /> افزودن پودمان جدید
                </button>
              </td>
            </tr>
          )}
          {implicitRows.map((module) => (
            <AssessmentModuleRow
              key={module.trackingId}
              module={module}
              allowEdit={allowEdit}
              onEdit={() => handleEdit(module.trackingId)}
              onDelete={() => handleDelete(module)}
              onShowUsage={() => handleShowUsage(module)}
            />
          ))}
        </tbody>
      </table>
    </ReorderableRowsContext>
  );
}

function AssessmentModulesCard({
  courseId,
  initialModules,
  allowEdit,
  isExampleCourse,
  origHash: initialOrigHash,
}: {
  courseId: string;
  initialModules: StaffAssessmentModuleWithAssessments[];
  allowEdit: boolean;
  isExampleCourse: boolean;
  origHash: string | null;
}) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const editModal = useModalState<EditAssessmentModuleModalData>();
  const usageModal = useModalState<AssessmentModuleFormRow>();
  const deleteModal = useModalState<DeleteAssessmentModuleModalData>();
  const [requiresReload, setRequiresReload] = useState(false);

  const { data, refetch } = useQuery({
    ...trpc.assessmentModules.list.queryOptions(),
    staleTime: Infinity,
    initialData: { modules: initialModules, origHash: initialOrigHash },
  });
  const origHash = data.origHash;

  const canEdit = allowEdit && origHash !== null && !requiresReload;
  const form = useForm({ defaultValues: { modules: orderModules(initialModules.map(toFormRow)) } });
  const modulesState = form.watch('modules');
  const setModulesState = (modules: AssessmentModuleFormRow[]) => {
    form.setValue('modules', orderModules(modules), { shouldDirty: true });
  };

  const saveMutation = useMutation({
    ...trpc.assessmentModules.save.mutationOptions(),
    onSuccess: async (result) => {
      // Record the new hash immediately so a failed refetch can't strand the
      // page with a stale hash, then refetch to pick up the saved modules.
      queryClient.setQueryData(trpc.assessmentModules.list.queryKey(), (old) =>
        old ? { ...old, origHash: result.origHash } : old,
      );
      const refreshed = await refetch();
      if (refreshed.isSuccess) {
        form.reset({ modules: orderModules(refreshed.data.modules.map(toFormRow)) });
      } else {
        // New modules need their saved IDs before subsequent renames or deletions.
        form.reset(form.getValues());
        setRequiresReload(true);
      }
    },
  });

  const duplicateNames = getDuplicateNames(modulesState.map((module) => module.name));

  const editingId = editModal.data?.assessmentModule.trackingId ?? null;
  const existingNames = new Set(
    modulesState.filter((module) => module.trackingId !== editingId).map((module) => module.name),
  );

  const handleCreate = () => {
    editModal.showWithData({
      mode: 'create',
      assessmentModule: { ...emptyModule, trackingId: crypto.randomUUID() },
    });
  };

  const handleEdit = (trackingId: string) => {
    const module = modulesState.find((m) => m.trackingId === trackingId);
    if (!module) return;
    // Once a module is edited, it is no longer implicit.
    editModal.showWithData({ mode: 'edit', assessmentModule: { ...module, implicit: false } });
  };

  const handleSave = (assessmentModule: AssessmentModuleFormRow) => {
    if (editModal.data?.mode === 'create') {
      setModulesState([...modulesState, assessmentModule]);
    } else {
      setModulesState(
        modulesState.map((m) =>
          m.trackingId === assessmentModule.trackingId ? assessmentModule : m,
        ),
      );
    }
    editModal.hide();
  };

  const removeModule = (trackingId: string) => {
    setModulesState(modulesState.filter((m) => m.trackingId !== trackingId));
  };

  const handleDelete = (module: AssessmentModuleFormRow) => {
    if (module.assessments.length > 0) {
      deleteModal.showWithData(module);
    } else {
      removeModule(module.trackingId);
    }
  };

  const handleSubmit = () => {
    saveMutation.mutate({
      modules: modulesState.map((module) => ({
        id: module.id,
        name: module.name,
        heading: module.heading,
        implicit: module.implicit,
      })),
      origHash,
    });
  };

  const saveError = getAppError<AssessmentModulesError['Save']>(saveMutation.error);

  const lockName =
    editModal.data?.mode === 'edit' &&
    editModal.data.assessmentModule.name === DEFAULT_ASSESSMENT_MODULE_NAME;

  return (
    <>
      <Form as={canEdit ? 'form' : 'div'} onSubmit={form.handleSubmit(handleSubmit)}>
        <fieldset disabled={saveMutation.isPending}>
          <legend className="visually-hidden">پودمان‌های ارزیابی</legend>
          <div className="card mb-4" style={{ fontFamily: 'var(--font-persian)' }}>
            <div className="card-header bg-primary text-white d-flex align-items-center">
              <h1 className="h4 mb-0">پودمان‌های ارزیابی (Assessment Modules)</h1>
            </div>

            {requiresReload && (
              <Alert variant="warning" className="m-3">
                تغییرات شما ذخیره شد اما بارگذاری مجدد پودمان‌ها با خطا مواجه شد. لطفا قبل از ایجاد تغییرات جدید، صفحه را بازخوانی فرمایید.{' '}
                <button
                  type="button"
                  className="btn btn-link alert-link p-0 align-baseline"
                  onClick={() => window.location.reload()}
                >
                  بارگذاری مجدد صفحه
                </button>
              </Alert>
            )}

            {saveError && (
              <AppErrorAlert
                error={saveError}
                className="m-3"
                render={{
                  SYNC_JOB_FAILED: ({ message, jobSequenceId }) => (
                    <>
                      {message}{' '}
                      <a href={getCourseEditErrorUrl(courseId, jobSequenceId)}>مشاهده لاگ عملیات</a>
                    </>
                  ),
                  UNKNOWN: ({ message }) => message,
                }}
                onDismiss={() => saveMutation.reset()}
              />
            )}

            {canEdit && duplicateNames.length > 0 && (
              <div className="alert alert-warning m-3" role="alert">
                <i className="fa fa-exclamation-triangle me-1" aria-hidden="true" />{' '}
                <strong>نام‌های تکراری شناسایی شد:</strong> {duplicateNames.join(', ')}. عناوین پودمان‌ها
                باید یکتا باشند؛ لطفا قبل از ذخیره، موارد تکراری را اصلاح فرمایید.
              </div>
            )}

            <div className="table-responsive">
              <AssessmentModulesTable
                rows={modulesState}
                allowEdit={canEdit}
                handleEdit={handleEdit}
                handleDelete={handleDelete}
                handleCreate={handleCreate}
                handleShowUsage={usageModal.showWithData}
                onReorder={setModulesState}
              />
            </div>

            <div className="card-footer text-muted small">
              از پودمان‌ها می‌توان برای گروه‌بندی و دسته‌بندی ارزیابی‌ها بر اساس فصل، موضوع، پودمان آموزشی یا سرفصل‌های درسی استفاده نمود.
            </div>
          </div>
        </fieldset>
        {canEdit && (
          <StickySaveBar
            isSaving={saveMutation.isPending}
            saveDisabledReason={duplicateNames.length > 0 ? 'عناوین پودمان‌ها باید یکتا باشند.' : null}
            visible={form.formState.isDirty}
            fullWidth
            saveLabel="ذخیره پودمان‌ها"
            onCancel={() => {
              form.reset();
              saveMutation.reset();
            }}
          />
        )}
      </Form>

      {allowEdit && origHash === null && (
        <Alert variant="info">
          امکان ویرایش پودمان‌ها وجود ندارد زیرا فایل <code>infoCourse.json</code> یافت نشد.
        </Alert>
      )}

      {!allowEdit && isExampleCourse && (
        <Alert variant="info">ویرایش پودمان‌ها در درس نمونه امکان‌پذیر نیست.</Alert>
      )}

      <EditAssessmentModuleModal
        {...editModal}
        existingNames={existingNames}
        lockName={lockName}
        onSave={handleSave}
      />

      <DeleteAssessmentModuleModal
        {...deleteModal}
        onConfirm={(module) => {
          removeModule(module.trackingId);
          deleteModal.hide();
        }}
      />

      <AssessmentUsageModal {...usageModal} entityLabel="پودمان" />
    </>
  );
}

export function AssessmentModulesPage({
  trpcCsrfToken,
  courseId,
  ...innerProps
}: AssessmentModulesPageProps) {
  const [queryClient] = useState(() => new QueryClient());
  const [trpcClient] = useState(() =>
    createCourseTrpcClient({ csrfToken: trpcCsrfToken, courseId }),
  );

  return (
    <QueryClientProviderDebug client={queryClient}>
      <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
        <AssessmentModulesCard courseId={courseId} {...innerProps} />
      </TRPCProvider>
    </QueryClientProviderDebug>
  );
}

AssessmentModulesPage.displayName = 'AssessmentModulesPage';
