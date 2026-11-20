import { useEffect, useState } from 'react';
import { Form } from 'react-bootstrap';
import { useForm } from 'react-hook-form';

import { StickySaveBar, useModalState } from '@prairielearn/ui';

import { AssessmentSetHeading } from '../../../components/AssessmentSetHeading.js';
import { AssessmentUsageModal } from '../../../components/AssessmentUsageModal.js';
import {
  ReorderableRowActionsCell,
  ReorderableRowsContext,
  getDuplicateNames,
  useReorderableRow,
} from '../../../components/ReorderableTable.js';
import { ColorJsonSchema } from '../../../schemas/index.js';
import type { InstructorCourseAdminSetFormRow } from '../instructorCourseAdminSets.types.js';

import {
  type EditAssessmentSetModalData,
  EditAssessmentSetsModal,
} from './EditAssessmentSetModal.js';

const emptyAssessmentSet = {
  abbreviation: '',
  assessments: [],
  color: '',
  course_id: null,
  heading: '',
  id: null,
  implicit: false,
  json_comment: null,
  name: '',
  number: 0,
};

function AssessmentSetRow({
  assessmentSet,
  allowEdit,
  onEdit,
  onDelete,
  onShowUsage,
}: {
  assessmentSet: InstructorCourseAdminSetFormRow;
  allowEdit: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onShowUsage: () => void;
}) {
  const { ref, style, dragHandleProps } = useReorderableRow(assessmentSet.trackingId);

  return (
    <tr ref={ref} style={style}>
      {allowEdit && (
        <ReorderableRowActionsCell
          trackingId={assessmentSet.trackingId}
          dragHandleProps={dragHandleProps}
          editLabel={`ویرایش دسته ارزیابی ${assessmentSet.name}`}
          deleteLabel={`حذف دسته ارزیابی ${assessmentSet.name}`}
          deleteDisabledReason={
            assessmentSet.assessments.length > 0
              ? `این دسته ارزیابی به دلیل استفاده در ${assessmentSet.assessments.length} ارزیابی دیگر، قابل حذف نیست.`
              : null
          }
          onEdit={onEdit}
          onDelete={onDelete}
        />
      )}
      <td className="align-middle pe-4">
        <span className={`badge color-${assessmentSet.color}`}>{assessmentSet.abbreviation}</span>
      </td>
      <td className="align-middle pe-4">{assessmentSet.name}</td>
      <td className="align-middle pe-4">
        <AssessmentSetHeading assessmentSet={assessmentSet} />
      </td>
      <td className="align-middle">
        <button
          type="button"
          className="btn btn-sm btn-outline-secondary text-nowrap"
          aria-label={`مشاهده ارزیابی‌های مربوط به ${assessmentSet.name}`}
          onClick={onShowUsage}
        >
          مشاهده آزمون‌ها
        </button>
      </td>
    </tr>
  );
}

function AssessmentSetsTable({
  rows,
  onReorder,
  allowEdit,
  handleEdit,
  handleDelete,
  handleCreate,
  handleShowUsage,
}: {
  rows: InstructorCourseAdminSetFormRow[];
  onReorder: (rows: InstructorCourseAdminSetFormRow[]) => void;
  allowEdit: boolean;
  handleEdit: (index: number) => void;
  handleDelete: (id: string) => void;
  handleCreate: () => void;
  handleShowUsage: (assessmentSet: InstructorCourseAdminSetFormRow) => void;
}) {
  return (
    <ReorderableRowsContext rows={rows} onReorder={onReorder}>
      <table className="table table-sm table-hover table-striped" aria-label="مجموعه‌ها و دسته‌های ارزیابی">
        <thead>
          <tr>
            {allowEdit && (
              <th style={{ width: '1%' }}>
                <span className="visually-hidden">جابجایی، ویرایش و حذف</span>
              </th>
            )}
            <th className="pe-4" style={{ width: '1%' }}>
              نشان اختصاری
            </th>
            <th className="col-3 pe-4">عنوان دسته ارزیابی</th>
            <th className="pe-4">سربرگ گروهبندی</th>
            <th style={{ width: '1%' }}>عملیات</th>
          </tr>
        </thead>

        <tbody>
          {rows.map((assessmentSet, index) => (
            <AssessmentSetRow
              key={assessmentSet.trackingId}
              assessmentSet={assessmentSet}
              allowEdit={allowEdit}
              onEdit={() => handleEdit(index)}
              onDelete={() => handleDelete(assessmentSet.trackingId)}
              onShowUsage={() => handleShowUsage(assessmentSet)}
            />
          ))}

          {allowEdit && (
            <tr>
              <td colSpan={5}>
                <button className="btn btn-sm btn-ghost" type="button" onClick={handleCreate}>
                  <i className="fa fa-plus me-1" aria-hidden="true" /> افزودن دسته ارزیابی جدید
                </button>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </ReorderableRowsContext>
  );
}

export function AssessmentSetsPage({
  assessmentSets,
  allowEdit,
  origHash,
  csrfToken,
}: {
  assessmentSets: InstructorCourseAdminSetFormRow[];
  allowEdit: boolean;
  origHash: string | null;
  csrfToken: string;
}) {
  const canEdit = allowEdit && origHash !== null;
  const [isSubmitting, setIsSubmitting] = useState(false);

  // A submitted page restored from the back/forward cache has stale data and a stale file hash.
  useEffect(() => {
    if (!isSubmitting) return;
    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) window.location.reload();
    };
    window.addEventListener('pageshow', handlePageShow);
    return () => window.removeEventListener('pageshow', handlePageShow);
  }, [isSubmitting]);

  const form = useForm({ defaultValues: { sets: assessmentSets } });
  const assessmentSetsState = form.watch('sets');
  const setAssessmentSetsState = (sets: InstructorCourseAdminSetFormRow[]) => {
    form.setValue('sets', sets, { shouldDirty: true });
  };
  const editModalState = useModalState<EditAssessmentSetModalData>();
  const usageModalState = useModalState<InstructorCourseAdminSetFormRow>();

  const duplicateNames = getDuplicateNames(assessmentSetsState.map((set) => set.name));

  // Names of other assessment sets (excluding the one currently being edited)
  const editingId = editModalState.data?.assessmentSet.trackingId ?? null;
  const existingNames = new Set(
    assessmentSetsState.filter((set) => set.trackingId !== editingId).map((set) => set.name),
  );

  const handleCreate = () => {
    editModalState.showWithData({
      mode: 'create',
      assessmentSet: {
        ...emptyAssessmentSet,
        trackingId: crypto.randomUUID(),
        color: ColorJsonSchema.options[Math.floor(Math.random() * ColorJsonSchema.options.length)],
      },
    });
  };

  const handleEdit = (index: number) => {
    editModalState.showWithData({
      mode: 'edit',
      assessmentSet: {
        ...assessmentSetsState[index],
        implicit: false,
      },
    });
  };

  const handleSave = (assessmentSet: InstructorCourseAdminSetFormRow) => {
    if (editModalState.data?.mode === 'create') {
      setAssessmentSetsState([...assessmentSetsState, assessmentSet]);
    } else if (editModalState.data?.mode === 'edit') {
      setAssessmentSetsState(
        assessmentSetsState.map((d) =>
          d.trackingId === assessmentSet.trackingId ? assessmentSet : d,
        ),
      );
    }
    editModalState.hide();
  };

  const handleDelete = (deleteId: string) => {
    setAssessmentSetsState(assessmentSetsState.filter((d) => d.trackingId !== deleteId));
  };

  return (
    <>
      <Form
        as={canEdit ? 'form' : 'div'}
        method={canEdit ? 'POST' : undefined}
        onSubmit={() => setIsSubmitting(true)}
      >
        <input type="hidden" name="__action" value="save_assessment_sets" />
        <input type="hidden" name="__csrf_token" value={csrfToken} />
        <input type="hidden" name="orig_hash" value={origHash ?? ''} />
        <input type="hidden" name="assessment_sets" value={JSON.stringify(assessmentSetsState)} />
        <div className="card mb-4" style={{ fontFamily: 'var(--font-persian)' }}>
          <div className="card-header bg-primary text-white d-flex align-items-center">
            <h1 className="h4 mb-0">مجموعه‌ها و دسته‌های ارزیابی (Assessment Sets)</h1>
          </div>

          {canEdit && duplicateNames.length > 0 && (
            <div className="alert alert-warning m-3" role="alert">
              <i className="fa fa-exclamation-triangle me-1" aria-hidden="true" />{' '}
              <strong>نام‌های تکراری شناسایی شد:</strong> {duplicateNames.join(', ')}. تنها آخرین
              دسته ارزیابی با این نام همگام‌سازی و ذخیره خواهد شد.
            </div>
          )}

          <div className="table-responsive">
            <AssessmentSetsTable
              rows={assessmentSetsState}
              allowEdit={canEdit}
              handleEdit={handleEdit}
              handleDelete={handleDelete}
              handleCreate={handleCreate}
              handleShowUsage={usageModalState.showWithData}
              onReorder={setAssessmentSetsState}
            />
          </div>
        </div>

        {canEdit && (
          <StickySaveBar
            isSaving={isSubmitting}
            visible={form.formState.isDirty}
            fullWidth
            saveLabel="ذخیره تغییرات دسته‌ها"
            onCancel={() => form.reset()}
          />
        )}
      </Form>

      <EditAssessmentSetsModal
        {...editModalState}
        existingNames={existingNames}
        onSave={handleSave}
      />

      <AssessmentUsageModal {...usageModalState} entityLabel="دسته ارزیابی" />
    </>
  );
}

AssessmentSetsPage.displayName = 'AssessmentSetsPage';
