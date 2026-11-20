import clsx from 'clsx';
import { useState } from 'react';
import { Modal } from 'react-bootstrap';

import { type StaffTag, type StaffTopic } from '../lib/client/safe-db-types.js';

import { ColorPicker } from './ColorPicker.js';
import { TagBadge } from './TagBadge.js';
import { TopicBadge } from './TopicBadge.js';

export type EditTagsTopicsModalState<Entity extends StaffTopic | StaffTag> =
  | { type: 'closed' }
  | { type: 'create'; entityType: 'topic' | 'tag'; entity: Entity }
  | { type: 'edit'; entityType: 'topic' | 'tag'; entity: Entity };

export function EditTagsTopicsModal<Entity extends StaffTopic | StaffTag>({
  state,
  onClose,
  onSave,
}: {
  state: EditTagsTopicsModalState<Entity>;
  onClose: () => void;
  onSave: (entity: Entity) => void;
}) {
  // Extract the entity to edit/create, or null if closed
  const entityToEdit = state.type === 'create' || state.type === 'edit' ? state.entity : null;

  const [entity, setEntity] = useState<Entity | null>(entityToEdit);
  const [invalidName, setInvalidName] = useState(false);
  const [invalidColor, setInvalidColor] = useState(false);

  function handleModalEntering() {
    if (!entityToEdit) return;
    setEntity(entityToEdit);
    setInvalidName(false);
    setInvalidColor(false);
  }

  function handleModalExited() {
    setEntity(null);
    setInvalidName(false);
    setInvalidColor(false);
  }

  function handleSubmit() {
    if (!entity) return;

    const isNameValid = !!entity.name;
    const isColorValid = !!entity.color;

    setInvalidName(!isNameValid);
    setInvalidColor(!isColorValid);

    if (isNameValid && isColorValid) {
      onSave(entity);
    }
  }

  const isOpen = state.type !== 'closed';
  const isCreateMode = state.type === 'create';

  return (
    <Modal
      show={isOpen}
      onHide={onClose}
      onEntering={handleModalEntering}
      onExited={handleModalExited}
      style={{ fontFamily: 'var(--font-persian)' }}
    >
      <Modal.Header closeButton>
        <Modal.Title>
          {isCreateMode
            ? state.entityType === 'topic'
              ? 'افزودن مبحث جدید'
              : 'افزودن برچسب جدید'
            : state.type === 'edit' && state.entityType === 'topic'
              ? 'ویرایش مبحث'
              : 'ویرایش برچسب'}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {entity ? (
          <>
            <div className="d-flex flex-column align-items-center mb-4">
              {state.type !== 'closed' && state.entityType === 'topic' ? (
                <TopicBadge
                  topic={{
                    name: entity.name || 'پیش‌نمایش مبحث',
                    color: entity.color,
                  }}
                />
              ) : (
                <TagBadge
                  tag={{
                    name: entity.name || 'پیش‌نمایش برچسب',
                    color: entity.color,
                  }}
                />
              )}
            </div>
            <div className="mb-3">
              <label className="form-label" htmlFor="name">
                عنوان
              </label>
              <input
                type="text"
                className={clsx('form-control', invalidName && 'is-invalid')}
                id="name"
                value={entity.name}
                onChange={(e) =>
                  setEntity({
                    ...entity,
                    name: e.currentTarget.value,
                  })
                }
              />
              {invalidName && (
                <div className="invalid-feedback">
                  وارد کردن عنوان {state.type !== 'closed' && state.entityType === 'topic' ? 'مبحث' : 'برچسب'} الزامی است
                </div>
              )}
            </div>
            <div className="mb-3">
              <label className="form-label" htmlFor="color">
                رنگ
              </label>
              <ColorPicker
                id="color"
                value={entity.color}
                invalid={invalidColor}
                onChange={(color) => setEntity({ ...entity, color })}
              />
              {invalidColor && (
                <div className="invalid-feedback d-block">
                  انتخاب رنگ {state.type !== 'closed' && state.entityType === 'topic' ? 'مبحث' : 'برچسب'} الزامی است
                </div>
              )}
            </div>
            <div className="mb-3">
              <label className="form-label" htmlFor="description">
                توضیحات
              </label>
              <input
                type="text"
                className="form-control"
                id="description"
                value={entity.description}
                onChange={(e) =>
                  setEntity({
                    ...entity,
                    description: e.currentTarget.value,
                  })
                }
              />
            </div>
          </>
        ) : null}
      </Modal.Body>
      <Modal.Footer>
        <button type="button" className="btn btn-secondary" onClick={onClose}>
          انصراف
        </button>
        <button type="button" className="btn btn-primary" onClick={handleSubmit}>
          {isCreateMode
            ? state.entityType === 'topic'
              ? 'افزودن مبحث'
              : 'افزودن برچسب'
            : state.type === 'edit' && state.entityType === 'topic'
              ? 'به‌روزرسانی مبحث'
              : 'به‌روزرسانی برچسب'}
        </button>
      </Modal.Footer>
    </Modal>
  );
}
