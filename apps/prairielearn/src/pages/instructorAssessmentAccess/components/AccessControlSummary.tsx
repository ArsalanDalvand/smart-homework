import {
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import clsx from 'clsx';
import { dequal } from 'dequal';
import { Fragment, memo, useId, useRef } from 'react';
import { Alert, Badge, Button } from 'react-bootstrap';
import { type FieldErrors, useFormContext, useFormState, useWatch } from 'react-hook-form';

import type { PrairieTestExamMetadata } from '../../../models/assessment-access-control-rules.js';

import {
  AfterCompleteTableView,
  DateTableView,
  DefaultRuleCurrentIndicator,
  type OverrideRuleFormErrors,
  OverrideRuleSummaryCard,
  PrairieTestExamsTable,
  generateAfterCompleteTableRows,
  generateDefaultRuleDateTableRows,
} from './RuleSummary.js';
import {
  type AccessControlFormData,
  type DefaultRuleData,
  type OverrideData,
  getOverrideName,
  isOverrideEditable,
} from './types.js';

/**
 * Count leaf errors in a react-hook-form errors object. Leaf nodes have a
 * `message` property; everything else is a container.
 */
function countErrors(obj: unknown): number {
  if (!obj || typeof obj !== 'object') return 0;
  if ('message' in obj && typeof (obj as Record<string, unknown>).message === 'string') return 1;
  return Object.values(obj).reduce((sum: number, val) => sum + countErrors(val), 0);
}

// Defined once so the sensors, and with them every sortable card's drag
// listeners, keep the same identity across renders.
const pointerSensorOptions = { activationConstraint: { distance: 6 } };

/**
 * Returns copies of `items` that keep the same identity across renders while
 * their contents are unchanged, so memoized children can skip rendering.
 * react-hook-form mutates form values and errors in place, so the live objects
 * can't be compared with what was rendered last time; each item is instead
 * compared with a snapshot taken when it was last rendered. This runs over
 * every rule on every change, so it uses `dequal`, which is several times
 * faster than `es-toolkit`'s `isEqual` on this data.
 */
function useStableSnapshots<T>(items: T[]): T[] {
  const previousRef = useRef<T[]>([]);
  const previous = previousRef.current;
  const snapshots = items.map((item, index) =>
    dequal(previous[index], item) ? previous[index] : structuredClone(item),
  );
  previousRef.current = snapshots;
  return snapshots;
}

const SortableOverrideCard = memo(function SortableOverrideCard({
  id,
  index,
  override,
  formErrors,
  title,
  displayTimezone,
  onEdit,
  onRemove,
  isActive,
  canEdit,
}: {
  id: string;
  index: number;
  override: OverrideData;
  formErrors: OverrideRuleFormErrors | undefined;
  title: string;
  displayTimezone: string;
  isActive: boolean;
  onEdit: (index: number) => void;
  onRemove: (index: number) => void;
  canEdit: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id,
  });

  const style = {
    opacity: isDragging ? 0.6 : 1,
    // Use Translate, not Transform: dnd-kit's full transform includes scaleX/scaleY,
    // which visually warps variable-height rows. See https://github.com/clauderic/dnd-kit/issues/44.
    transform: CSS.Translate.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <OverrideRuleSummaryCard
        rule={override}
        title={title}
        displayTimezone={displayTimezone}
        formErrors={formErrors}
        isActive={isActive}
        dragHandleProps={canEdit ? { ...attributes, ...listeners } : undefined}
        canEdit={canEdit}
        onEdit={() => onEdit(index)}
        onRemove={canEdit ? () => onRemove(index) : undefined}
      />
    </div>
  );
});

const DefaultRuleSummaryContent = memo(function DefaultRuleSummaryContent({
  rule,
  formErrors,
  displayTimezone,
  prairieTestExamMetadata,
  ptHost,
  canFetchPrairieTestMetadata,
}: {
  rule: DefaultRuleData;
  formErrors: FieldErrors<DefaultRuleData> | undefined;
  displayTimezone: string;
  prairieTestExamMetadata: PrairieTestExamMetadata[];
  ptHost: string;
  canFetchPrairieTestMetadata: boolean;
}) {
  const dateTableRows = generateDefaultRuleDateTableRows(rule, displayTimezone, formErrors);
  const afterCompleteTableRows = generateAfterCompleteTableRows(rule, displayTimezone, formErrors);

  const hasAnyTable =
    dateTableRows.length > 0 ||
    rule.prairieTestExams.length > 0 ||
    afterCompleteTableRows.length > 0;

  return (
    <div className="d-flex flex-column gap-2">
      <DefaultRuleCurrentIndicator rule={rule} displayTimezone={displayTimezone} />

      {hasAnyTable && (
        <div className="access-summary-grid-scroll">
          <div className="access-summary-grid">
            {dateTableRows.length > 0 && (
              <DateTableView rows={dateTableRows} rule={rule} formErrors={formErrors} />
            )}

            {rule.prairieTestExams.length > 0 && (
              <PrairieTestExamsTable
                exams={rule.prairieTestExams}
                beforeReleaseListed={rule.beforeReleaseListed}
                initialMetadata={prairieTestExamMetadata}
                ptHost={ptHost}
                formErrors={formErrors}
                canFetchMetadata={canFetchPrairieTestMetadata}
              />
            )}

            {afterCompleteTableRows.length > 0 && (
              <AfterCompleteTableView
                rows={afterCompleteTableRows}
                hasPrairieTest={rule.prairieTestExams.length > 0}
              />
            )}
          </div>
        </div>
      )}

      {!hasAnyTable && (
        <div
          className="rounded text-center py-3 text-body-secondary"
          style={{ border: '2px dashed var(--bs-border-color)' }}
        >
          هیچ تنظیم دسترسی پیکربندی نشده است.
        </div>
      )}
    </div>
  );
});

export function AccessControlSummary({
  selectedOverrideIndex,
  onAddOverride,
  addOverrideDisabledReason,
  onRemoveOverride,
  onMoveOverride,
  onEditDefaultRule,
  onClearDefaultRule,
  onEditOverride,
  displayTimezone,
  prairieTestExamMetadata,
  ptHost,
  canEditAccessSettings,
  canEditEnrollmentRules,
  canFetchPrairieTestMetadata,
  readOnlyMessage,
  hiddenEnrollmentRuleCount,
}: {
  selectedOverrideIndex: number | null;
  onAddOverride: () => void;
  addOverrideDisabledReason?: string | null;
  onRemoveOverride: (index: number) => void;
  onMoveOverride: (fromIndex: number, toIndex: number) => void;
  /** Callback when default rule edit is requested */
  onEditDefaultRule: () => void;
  /** Callback when default rule reset is requested */
  onClearDefaultRule: () => void;
  /** Callback when an override edit is requested */
  onEditOverride: (index: number) => void;
  displayTimezone: string;
  prairieTestExamMetadata: PrairieTestExamMetadata[];
  ptHost: string;
  canEditAccessSettings: boolean;
  canEditEnrollmentRules: boolean;
  canFetchPrairieTestMetadata: boolean;
  readOnlyMessage: string | null;
  hiddenEnrollmentRuleCount: number;
}) {
  const dndId = useId();
  const sensors = useSensors(
    useSensor(PointerSensor, pointerSensorOptions),
    useSensor(KeyboardSensor),
  );

  // The watches only trigger re-renders. Values are read with `getValues`
  // because react-hook-form reports add/remove/move to watchers one render
  // late, which would briefly render the old list against new errors and
  // selection.
  useWatch<AccessControlFormData, 'defaultRule'>({ name: 'defaultRule' });
  useWatch<AccessControlFormData, 'overrides'>({ name: 'overrides' });
  const { getValues } = useFormContext<AccessControlFormData>();
  const { defaultRule, overrides } = getValues();
  const { errors } = useFormState<AccessControlFormData>();

  const [defaultRuleSnapshot] = useStableSnapshots([defaultRule]);
  const [defaultRuleErrorsSnapshot] = useStableSnapshots([errors.defaultRule]);
  const overrideSnapshots = useStableSnapshots(overrides);
  const overrideErrorsSnapshots = useStableSnapshots(
    overrides.map((_, index) => errors.overrides?.[index]),
  );
  const [sortableIds] = useStableSnapshots([overrides.map((o) => o.trackingId)]);

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!canEditAccessSettings) return;
    if (!over || active.id === over.id) return;
    const oldIndex = sortableIds.indexOf(String(active.id));
    const newIndex = sortableIds.indexOf(String(over.id));
    if (oldIndex === -1 || newIndex === -1) return;

    // Prevent reordering across override types; each target type has its own precedence section.
    if (overrides[oldIndex].appliesTo.targetType !== overrides[newIndex].appliesTo.targetType) {
      return;
    }

    onMoveOverride(oldIndex, newIndex);
  };

  const defaultRuleErrorCount = countErrors(errors.defaultRule);
  const overridesErrorCount = countErrors(errors.overrides);
  const addOverrideDisabledReasonId = `${dndId}-add-override-disabled-reason`;

  return (
    <div>
      {readOnlyMessage && (
        <Alert variant="info" className="mb-4">
          {readOnlyMessage}
        </Alert>
      )}
      <section className="mb-4">
        <div className="d-flex justify-content-between align-items-center gap-2 mb-1">
          <h2 className="h5 mb-0 d-flex align-items-center">
            تنظیمات پیش‌فرض
            {defaultRuleErrorCount > 0 && (
              <Badge bg="danger" className="ms-2" style={{ fontSize: '0.7rem' }}>
                {defaultRuleErrorCount} خطا
              </Badge>
            )}
          </h2>
          <div className="d-flex gap-2">
            <Button
              variant="outline-primary"
              size="sm"
              aria-label={canEditAccessSettings ? 'ویرایش' : 'مشاهده'}
              className="d-inline-flex align-items-center"
              onClick={onEditDefaultRule}
            >
              <i
                className={canEditAccessSettings ? 'bi bi-pencil' : 'bi bi-eye'}
                aria-hidden="true"
              />
              <span className="toolbar-btn-label ms-1">
                {canEditAccessSettings ? 'ویرایش' : 'مشاهده'}
              </span>
            </Button>
            {canEditAccessSettings && (
              <Button
                variant="outline-danger"
                size="sm"
                aria-label="پاک کردن"
                className="d-inline-flex align-items-center"
                onClick={onClearDefaultRule}
              >
                <i className="bi bi-trash" aria-hidden="true" />
                <span className="toolbar-btn-label ms-1">پاک کردن</span>
              </Button>
            )}
          </div>
        </div>
        <small className="text-body-secondary d-block mb-3">
          تنظیمات دسترسی که به صورت پیش‌فرض برای همه دانشجویان اعمال می‌شود.
        </small>

        <DefaultRuleSummaryContent
          rule={defaultRuleSnapshot}
          formErrors={defaultRuleErrorsSnapshot}
          displayTimezone={displayTimezone}
          prairieTestExamMetadata={prairieTestExamMetadata}
          ptHost={ptHost}
          canFetchPrairieTestMetadata={canFetchPrairieTestMetadata}
        />
      </section>

      <section>
        <div className="d-flex justify-content-between align-items-center gap-2 mb-1">
          <h2 className="h5 mb-0 d-flex align-items-center">
            استثناها
            {overridesErrorCount > 0 && (
              <Badge bg="danger" className="ms-2" style={{ fontSize: '0.7rem' }}>
                {overridesErrorCount} خطا
              </Badge>
            )}
          </h2>
          {canEditAccessSettings && (
            <Button
              variant="primary"
              size="sm"
              className="d-inline-flex align-items-center"
              disabled={addOverrideDisabledReason != null}
              title={addOverrideDisabledReason ?? undefined}
              aria-describedby={addOverrideDisabledReason ? addOverrideDisabledReasonId : undefined}
              onClick={onAddOverride}
            >
              <i className="bi bi-plus-lg me-1" /> افزودن استثنا
            </Button>
          )}
        </div>
        <small className="text-body-secondary d-block mb-3">
          شخصی‌سازی تنظیمات برای دانشجویان خاص یا دانشجویان دارای برچسب‌های خاص. فیلدهایی که
          بازنویسی نشوند از تنظیمات پیش‌فرض و استثناهای قبلی به ارث برده می‌شوند.
        </small>

        {addOverrideDisabledReason && (
          <Alert variant="secondary" className="py-2 mb-3" id={addOverrideDisabledReasonId}>
            {addOverrideDisabledReason}
          </Alert>
        )}

        {canEditAccessSettings && !canEditEnrollmentRules && (
          <Alert variant="info" className="mb-3">
            می‌توانید تنظیمات پیش‌فرض و استثناهای مربوط به برچسب‌های دانشجویی را ویرایش کنید.
            استثناهای مختص دانشجو نیازمند دسترسی ویرایشگر داده‌های دانشجو است.
          </Alert>
        )}

        {hiddenEnrollmentRuleCount > 0 && (
          <Alert variant="info" className="mb-3">
            این ارزیابی دارای {hiddenEnrollmentRuleCount} استثنای مختص دانشجو است که به دلیل نداشتن
            دسترسی مشاهده داده‌های دانشجو پنهان شده است. این استثناها هنگام ذخیره حفظ می‌شوند، اما
            تغییرات قابل مشاهده ممکن است از طریق تنظیمات به ارث برده‌شده بر آن‌ها تاثیر بگذارد.
          </Alert>
        )}

        {overrides.length === 0 ? (
          <div
            className="rounded text-center py-3 text-body-secondary"
            style={{ border: '2px dashed var(--bs-border-color)' }}
          >
            {hiddenEnrollmentRuleCount > 0
              ? 'هیچ استثنای قابل مشاهده‌ای پیکربندی نشده است.'
              : 'هیچ استثنایی پیکربندی نشده است.'}
          </div>
        ) : (
          <DndContext
            id={dndId}
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
              {overrideSnapshots.map((override, index) => {
                const isFirstOfSection =
                  index === 0 ||
                  overrideSnapshots[index - 1].appliesTo.targetType !==
                    override.appliesTo.targetType;
                const sectionLabel =
                  override.appliesTo.targetType === 'enrollment'
                    ? 'استثناها برای دانشجویان خاص'
                    : 'استثناها برای برچسب‌های دانشجویی';
                const canEditOverride = isOverrideEditable(override, {
                  canEditAccessSettings,
                  canEditEnrollmentRules,
                });

                return (
                  <Fragment key={sortableIds[index]}>
                    {isFirstOfSection && (
                      <small
                        className={clsx('text-muted fw-semibold d-block mb-2', index > 0 && 'mt-3')}
                      >
                        {sectionLabel}
                      </small>
                    )}
                    <SortableOverrideCard
                      id={sortableIds[index]}
                      index={index}
                      override={override}
                      formErrors={overrideErrorsSnapshots[index]}
                      title={getOverrideName(override.appliesTo, index)}
                      displayTimezone={displayTimezone}
                      isActive={selectedOverrideIndex === index}
                      canEdit={canEditOverride}
                      onEdit={onEditOverride}
                      onRemove={onRemoveOverride}
                    />
                  </Fragment>
                );
              })}
            </SortableContext>
          </DndContext>
        )}

        <div className="rounded p-3 mt-3" style={{ backgroundColor: 'var(--bs-tertiary-bg)' }}>
          <p className="text-body-secondary small mb-0">
            اگر دانشجویی با چند استثنا مطابقت داشته باشد، استثناهای مختص دانشجو بر استثناهای برچسب
            دانشجویی اولویت دارند. در هر بخش، استثناهایی که در پایین‌تر فهرست قرار دارند نسبت به
            موارد بالاتر اولویت دارند.
          </p>
        </div>
      </section>
    </div>
  );
}
