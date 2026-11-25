import { QueryClient, useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Alert } from 'react-bootstrap';

import { QueryClientProviderDebug } from '@prairielearn/trpc/react';
import { useModalState } from '@prairielearn/ui';

import { MAX_STUDENT_LABELS_PER_COURSE_INSTANCE } from '../../schemas/infoCourseInstance.js';
import { createCourseInstanceTrpcClient } from '../../trpc/courseInstance/client.js';
import { TRPCProvider, useTRPC } from '../../trpc/courseInstance/context.js';

import { LabelDeleteModal, type LabelDeleteModalData } from './components/LabelDeleteModal.js';
import { LabelModifyModal, type LabelModifyModalData } from './components/LabelModifyModal.js';
import { LabelTableRow } from './components/LabelTableRow.js';
import type { StudentLabelWithUserData } from './instructorStudentsLabels.types.js';

interface StudentLabelsPageProps {
  trpcCsrfToken: string;
  courseInstanceId: string;
  initialLabels: StudentLabelWithUserData[];
  canEdit: boolean;
  isExampleCourse: boolean;
  origHash: string | null;
}

function StudentLabelsCard({
  courseInstanceId,
  initialLabels,
  canEdit,
  isExampleCourse,
  origHash: initialOrigHash,
}: {
  courseInstanceId: string;
  initialLabels: StudentLabelWithUserData[];
  canEdit: boolean;
  isExampleCourse: boolean;
  origHash: string | null;
}) {
  const trpc = useTRPC();
  const editModal = useModalState<LabelModifyModalData>();
  const deleteModal = useModalState<LabelDeleteModalData>();
  const [enrollmentWarning, setEnrollmentWarning] = useState<string | null>(null);

  const { data, refetch: refetchLabels } = useQuery({
    ...trpc.studentLabels.list.queryOptions(),
    staleTime: Infinity,
    initialData: { labels: initialLabels, origHash: initialOrigHash },
  });

  const labels = data.labels;
  const atStudentLabelLimit = labels.length >= MAX_STUDENT_LABELS_PER_COURSE_INSTANCE;
  const [origHashOverride, setOrigHashOverride] = useState<string | null>(null);
  const origHash = origHashOverride ?? data.origHash ?? initialOrigHash;

  const handleEdit = (label: StudentLabelWithUserData) => {
    editModal.showWithData({
      type: 'edit',
      labelId: label.student_label.id,
      name: label.student_label.name,
      color: label.student_label.color,
      uids: label.user_data.map((u) => u.uid),
      origHash,
    });
  };

  const handleDelete = (label: StudentLabelWithUserData) => {
    deleteModal.showWithData({
      labelId: label.student_label.id,
      labelName: label.student_label.name,
      userData: label.user_data,
    });
  };

  const handleDeleteSuccess = async (newOrigHash: string | null) => {
    setOrigHashOverride(newOrigHash);
    await refetchLabels();
    deleteModal.hide();
  };

  const handleEditSuccess = async (result: {
    origHash: string | null;
    enrollmentWarning?: string;
  }) => {
    setOrigHashOverride(result.origHash);
    setEnrollmentWarning(result.enrollmentWarning ?? null);
    await refetchLabels();
    editModal.hide();
  };

  return (
    <>
      <div className="mb-3">
        <div className="d-flex align-items-center justify-content-between mb-2">
          <h2 className="h5 mb-0">برچسب‌های دانشجویان</h2>
          {canEdit && (
            <button
              type="button"
              className="btn btn-outline-primary btn-sm text-nowrap"
              disabled={origHash === null || atStudentLabelLimit}
              onClick={() => editModal.showWithData({ type: 'add', origHash })}
            >
              افزودن برچسب
            </button>
          )}
        </div>
        <small className="text-muted">
          دانشجویان را برای فیلتر کردن و تحلیل سازمان‌دهی کنید. از برچسب‌ها می‌توان برای دسته‌بندی
          گروه‌ها، تسهیلات ویژه یا هر دسته‌بندی دلخواه دیگر استفاده کرد. برچسب‌ها برای دانشجویان
          قابل مشاهده نیستند.
        </small>
      </div>

      {!canEdit && (
        <Alert variant="info">
          {isExampleCourse
            ? 'در درس نمونه نمی‌توانید برچسب‌های دانشجویان را ویرایش کنید.'
            : 'می‌توانید برچسب‌ها را در این صفحه مشاهده کنید، اما ایجاد، تغییر نام، حذف و تخصیص برچسب در اینجا نیازمند دسترسی ویرایشگر درس و ویرایشگر اطلاعات دانشجویان است.'}
        </Alert>
      )}

      {enrollmentWarning && (
        <Alert variant="warning" dismissible onClose={() => setEnrollmentWarning(null)}>
          {enrollmentWarning}
        </Alert>
      )}

      {canEdit && origHash === null && (
        <div className="alert alert-info" role="alert">
          به دلیل وجود نداشتن فایل <code>infoCourseInstance.json</code> امکان ویرایش برچسب‌های
          دانشجویان وجود ندارد.
        </div>
      )}

      {canEdit && atStudentLabelLimit && (
        <Alert variant="info">
          این ترم به سقف مجاز {MAX_STUDENT_LABELS_PER_COURSE_INSTANCE} برچسب دانشجو رسیده است.
          برچسب‌های موجود همچنان قابل ویرایش یا حذف هستند.
        </Alert>
      )}

      {labels.length === 0 ? (
        <div className="text-center text-muted mb-3">
          <p className="mb-0">هیچ برچسب دانشجویی تنظیم نشده است.</p>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table table-striped">
            <thead>
              <tr>
                <th>نام</th>
                <th>دانشجویان</th>
                {canEdit && <th style={{ width: '140px' }}>عملیات</th>}
              </tr>
            </thead>
            <tbody>
              {labels.map((label) => (
                <LabelTableRow
                  key={label.student_label.id}
                  label={label}
                  courseInstanceId={courseInstanceId}
                  canEdit={canEdit}
                  disabled={origHash === null}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      <LabelModifyModal
        data={editModal.data}
        courseInstanceId={courseInstanceId}
        show={editModal.show}
        onHide={editModal.onHide}
        onExited={editModal.onExited}
        onSuccess={handleEditSuccess}
      />

      <LabelDeleteModal
        data={deleteModal.data}
        courseInstanceId={courseInstanceId}
        origHash={origHash}
        show={deleteModal.show}
        onHide={deleteModal.onHide}
        onExited={deleteModal.onExited}
        onSuccess={handleDeleteSuccess}
      />
    </>
  );
}

export function InstructorStudentsLabels({
  trpcCsrfToken,
  courseInstanceId,
  ...innerProps
}: StudentLabelsPageProps) {
  const [queryClient] = useState(() => new QueryClient());
  const [trpcClient] = useState(() =>
    createCourseInstanceTrpcClient({ csrfToken: trpcCsrfToken, courseInstanceId }),
  );

  return (
    <QueryClientProviderDebug client={queryClient}>
      <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
        <StudentLabelsCard courseInstanceId={courseInstanceId} {...innerProps} />
      </TRPCProvider>
    </QueryClientProviderDebug>
  );
}

InstructorStudentsLabels.displayName = 'InstructorStudentsLabels';
