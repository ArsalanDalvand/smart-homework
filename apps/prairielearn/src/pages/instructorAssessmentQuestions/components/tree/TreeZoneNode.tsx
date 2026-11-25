import { useDroppable } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import clsx from 'clsx';
import { useId } from 'react';

import { run } from '@prairielearn/run';
import { OverlayTrigger } from '@prairielearn/ui';

import type { EnumAssessmentType } from '../../../../lib/db-types.js';
import type { TreeActions, TreeState, ZoneAssessmentForm } from '../../types.js';
import {
  computeZonePointTotals,
  computeZoneQuestionCount,
  getZonePointsMismatch,
  hasZoneChooseExceedsCount,
} from '../../utils/questions.js';

import { ChangeIndicatorBadges } from './ChangeIndicatorBadges.js';
import { CollapseToggleButton } from './CollapseToggleButton.js';
import { DragHandle } from './DragHandle.js';
import { TreeEmptyDropZone } from './TreeEmptyDropZone.js';
import { TreeQuestionBlockNode } from './TreeQuestionBlockNode.js';
import { WarningIndicator } from './WarningIndicator.js';
import { makeDraggableStyle } from './dragUtils.js';

/**
 * Renders a zone node in the assessment tree — a sticky header with zone
 * metadata badges (question count, points, lockpoint, etc.) followed by the
 * zone's question blocks. Zones are sortable via drag-and-drop in edit mode
 * and collapsible in both modes.
 */
export function TreeZoneNode({
  zone,
  zoneNumber,
  questionStartNumber,
  state,
  actions,
}: {
  zone: ZoneAssessmentForm;
  zoneNumber: number;
  questionStartNumber: number;
  state: TreeState;
  actions: TreeActions;
}) {
  const { editMode, selectedItem, collapsedZones, changeTracking, assessmentType } = state;
  const { setSelectedItem, dispatch, onAddQuestion, onAddAltPool, onDeleteZone } = actions;
  const badgeTooltipId = useId();
  const isCollapsed = collapsedZones.has(zone.trackingId);
  const zonePointsMismatch = getZonePointsMismatch(zone, assessmentType);
  // This warning triggers when questions are deleted from a zone, reducing
  // the count below an already-saved numberChoose/bestQuestions.
  const zoneChooseExceeds = hasZoneChooseExceedsCount(zone);
  const zoneGuidance: string[] = [];
  if (zone.numberChoose != null) {
    zoneGuidance.push(
      `${zone.numberChoose} سوال به صورت تصادفی از این بخش انتخاب می‌شود و تا حد امکان به طور مساوی بین مجموعه‌ها توزیع می‌گردد.`,
    );
  }
  if (zone.maxPoints != null) {
    zoneGuidance.push(
      `حداکثر ${zone.maxPoints} امتیاز از این بخش در نمره کل ارزیابی محاسبه می‌شود.`,
    );
  }
  if (zone.bestQuestions != null) {
    zoneGuidance.push(
      zone.bestQuestions === 1
        ? 'تنها سوال با بالاترین امتیاز در این بخش در مجموع کل محاسبه می‌شود.'
        : `تنها ${zone.bestQuestions} سوال با بالاترین امتیاز در این بخش در مجموع کل محاسبه می‌شوند.`,
    );
  }
  if (zone.lockpoint) {
    zoneGuidance.push(
      'دانشجویان پیش از ورود به این بخش باید از این نقطه قفل (Lockpoint) عبور کنند. عبور از آن بخش‌های قبلی را فقط-خواندنی می‌کند.',
    );
  }
  const isSelected =
    selectedItem?.type === 'zone' && selectedItem.zoneTrackingId === zone.trackingId;

  const toggleCollapse = () =>
    dispatch({ type: 'TOGGLE_ZONE_COLLAPSE', trackingId: zone.trackingId });

  const { setNodeRef: emptyDropRef } = useDroppable({
    id: `${zone.trackingId}-empty-drop`,
    disabled: zone.questions.length > 0,
  });

  const {
    attributes: draggableAttributes,
    listeners: draggableListeners,
    setNodeRef: draggableRef,
    transform: draggableTransform,
    transition: draggableTransition,
    isDragging,
  } = useSortable({
    id: zone.trackingId,
    data: { type: 'zone' },
    disabled: !editMode,
  });

  const draggableStyle = makeDraggableStyle({
    isDragging,
    transform: draggableTransform,
    transition: draggableTransition,
  });

  const selectZone = () => {
    setSelectedItem({ type: 'zone', zoneTrackingId: zone.trackingId });
  };

  return (
    <SortableContext
      items={zone.questions.map((q) => q.trackingId)}
      strategy={verticalListSortingStrategy}
    >
      <div ref={draggableRef} style={draggableStyle}>
        {/* Zone header */}
        <div
          role="button"
          tabIndex={0}
          className={clsx(
            'tree-row d-flex align-items-center ps-2 py-2 border-bottom user-select-none text-body',
            isSelected
              ? 'tree-row-selected bg-body-secondary'
              : 'bg-body-secondary list-group-item-action',
            (zoneChooseExceeds || zonePointsMismatch != null) && 'tree-row-warning-indicator',
          )}
          style={{
            // Extra right padding prevents macOS overlay scrollbars
            // from overlapping row content.
            // https://bugzilla.mozilla.org/show_bug.cgi?id=636564
            paddingRight: '1.5rem',
            cursor: 'pointer',
            position: 'sticky',
            top: 0,
            zIndex: 10,
          }}
          onClick={(e) => {
            e.stopPropagation();
            selectZone();
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              selectZone();
            }
          }}
        >
          <DragHandle
            attributes={draggableAttributes}
            listeners={draggableListeners}
            disabled={!editMode}
            ariaLabel="برای تغییر ترتیب بخش بکشید"
          />
          <CollapseToggleButton
            isCollapsed={isCollapsed}
            ariaLabel={isCollapsed ? 'باز کردن بخش' : 'بستن بخش'}
            onToggle={toggleCollapse}
          />
          <span className="fw-semibold">
            {zone.title || `بخش ${zoneNumber}`}
            <ChangeIndicatorBadges
              trackingId={zone.trackingId}
              comment={zone.comment}
              editMode={editMode}
              changeTracking={changeTracking}
            />
          </span>
          <span className="d-inline-flex align-items-center gap-1 flex-wrap ms-2">
            {zonePointsMismatch && (
              <WarningIndicator
                tooltipId={`points-mismatch-${zone.trackingId}`}
                label={zonePointsMismatch.label}
                body={zonePointsMismatch.body}
              />
            )}
            {zoneChooseExceeds && (
              <WarningIndicator
                tooltipId={`choose-exceeds-${zone.trackingId}`}
                label="تعداد انتخاب بیش از حد"
                body="تعداد برای انتخاب یا بهترین سوالات از تعداد سوالات موجود در این بخش بیشتر است"
              />
            )}
            {run(() => {
              const count = computeZoneQuestionCount(zone.questions);
              // ZonePointsBadge already shows "No questions" when the zone is empty.
              if (count === 0) return null;
              return (
                <OverlayTrigger
                  placement="top"
                  tooltip={{
                    props: { id: `${badgeTooltipId}-count` },
                    body: 'مجموع سوالات در این بخش',
                  }}
                >
                  <button type="button" className="btn btn-badge color-blue3">
                    {count} سوال
                  </button>
                </OverlayTrigger>
              );
            })}
            {zone.numberChoose != null && (
              <span className="badge color-blue3">انتخاب {zone.numberChoose}</span>
            )}
            <ZonePointsBadge
              zone={zone}
              assessmentType={assessmentType}
              tooltipId={`${badgeTooltipId}-points`}
            />
            {zone.maxPoints != null && (
              <span className="badge color-blue3">حداکثر {zone.maxPoints} امتیاز</span>
            )}
            {zone.bestQuestions != null && (
              <span className="badge color-blue3">بهترین {zone.bestQuestions}</span>
            )}
            {zone.lockpoint && (
              <span className="badge color-blue3">
                <i className="bi bi-lock-fill me-1" aria-hidden="true" />
                نقطه قفل
              </span>
            )}
          </span>
          <span className="flex-grow-1" />
          {editMode && (
            <button
              type="button"
              className={clsx(
                'btn btn-sm border-0 text-muted ms-1 tree-delete-btn',
                !isSelected && 'hover-show',
              )}
              aria-label={`حذف بخش '${zone.title}'`}
              title="حذف بخش"
              onClick={(e) => {
                e.stopPropagation();
                onDeleteZone(zone.trackingId);
              }}
            >
              <i className="bi bi-trash3" aria-hidden="true" />
            </button>
          )}
        </div>

        {zoneGuidance.length > 0 && (
          <div className="small text-muted bg-body-tertiary px-3 py-1 border-bottom">
            {zoneGuidance.map((guidance) => (
              <div key={guidance}>{guidance}</div>
            ))}
          </div>
        )}

        {/* Zone content */}
        {!isCollapsed && (
          <>
            {zone.questions.map((zoneQuestionBlock, questionIndex) => (
              <TreeQuestionBlockNode
                key={zoneQuestionBlock.trackingId}
                zoneQuestionBlock={zoneQuestionBlock}
                questionNumber={questionStartNumber + questionIndex}
                zone={zone}
                state={state}
                actions={actions}
              />
            ))}
            {zone.questions.length === 0 &&
              (editMode ? (
                <TreeEmptyDropZone dropRef={emptyDropRef} />
              ) : (
                <div className="text-center text-muted py-3 border-bottom">
                  <i className="bi bi-info-circle me-1" aria-hidden="true" />
                  سوالی در این بخش وجود ندارد
                </div>
              ))}
            {editMode && (
              <div
                className="d-flex gap-2 py-2 border-bottom"
                style={{ paddingLeft: '2.5rem', paddingRight: '1rem' }}
              >
                <button
                  className="btn btn-sm btn-link text-muted"
                  type="button"
                  onClick={() => onAddQuestion(zone.trackingId)}
                >
                  <i className="bi bi-plus-lg me-1" aria-hidden="true" />
                  افزودن سوال
                </button>
                <button
                  className="btn btn-sm btn-link text-muted"
                  type="button"
                  onClick={() => onAddAltPool(zone.trackingId)}
                >
                  <i className="bi bi-stack me-1" aria-hidden="true" />
                  افزودن مجموعه جایگزین
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </SortableContext>
  );
}

function ZonePointsBadge({
  zone,
  assessmentType,
  tooltipId,
}: {
  zone: ZoneAssessmentForm;
  assessmentType: EnumAssessmentType;
  tooltipId: string;
}) {
  const { autoPoints, manualPoints } = computeZonePointTotals(zone.questions, {
    bestQuestions: zone.bestQuestions,
    numberChoose: zone.numberChoose,
  });
  const totalPoints = autoPoints + manualPoints;

  if (totalPoints === 0 && zone.questions.length === 0) {
    return <span className="badge color-blue3">بدون سوال</span>;
  }

  const label = run(() => {
    if (assessmentType === 'Exam') return `${totalPoints} امتیاز`;
    const parts: string[] = [];
    if (autoPoints > 0) parts.push(`${autoPoints} خودکار`);
    if (manualPoints > 0) parts.push(`${manualPoints} دستی`);
    if (parts.length === 0) parts.push('0 امتیاز');
    return parts.join(' + ');
  });

  return (
    <OverlayTrigger
      placement="top"
      tooltip={{
        props: { id: tooltipId },
        body: 'مجموع امتیاز قابل کسب توسط دانشجو در این بخش',
      }}
    >
      <button type="button" className="btn btn-badge color-blue3">
        {label}
      </button>
    </OverlayTrigger>
  );
}
