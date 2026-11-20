import { useState } from 'react';

import { type StaffTag, type StaffTopic } from '../lib/client/safe-db-types.js';
import { getCourseAdminQuestionsUrl } from '../lib/client/url.js';
import { ColorJsonSchema } from '../schemas/infoCourse.js';

import { EditTagsTopicsModal, type EditTagsTopicsModalState } from './EditTagsTopicsModal.js';
import { TagBadge } from './TagBadge.js';
import { TagDescription } from './TagDescription.js';
import { TopicBadge } from './TopicBadge.js';
import { TopicDescription } from './TopicDescription.js';

const emptyEntity = {
  color: '',
  course_id: '',
  description: '',
  id: '',
  implicit: false,
  json_comment: '',
  name: '',
  number: 0,
};

export function TagsTopicsTable<Entity extends StaffTag | StaffTopic>({
  entities,
  entityType,
  allowEdit,
  origHash,
  csrfToken,
  courseId,
  courseInstanceId,
}: {
  entities: Entity[];
  entityType: 'topic' | 'tag';
  allowEdit: boolean;
  origHash: string | null;
  csrfToken: string;
  courseId: string;
  courseInstanceId?: string;
}) {
  const [editMode, setEditMode] = useState(false);
  const [entitiesState, setEntitiesState] = useState<Entity[]>(entities);
  const [modalState, setModalState] = useState<EditTagsTopicsModalState<Entity>>({
    type: 'closed',
  });

  const handleCreate = () => {
    setModalState({
      type: 'create',
      entityType,
      entity: {
        ...(emptyEntity as Entity),
        // This ID won't be used on the server; it's just a temporary unique identifier.
        id: crypto.randomUUID(),
        // Pick a random initial color.
        color: ColorJsonSchema.options[Math.floor(Math.random() * ColorJsonSchema.options.length)],
      },
    });
  };

  const handleEdit = (index: number) => {
    setModalState({
      type: 'edit',
      entityType,
      entity: {
        ...entitiesState[index],
        // Once a tag/topic is edited, it is no longer implicit.
        implicit: false,
      },
    });
  };

  const handleSave = (entity: Entity) => {
    if (modalState.type === 'create') {
      setEntitiesState((prevData) => [...prevData, entity]);
    } else if (modalState.type === 'edit') {
      setEntitiesState((prevData) => prevData.map((d) => (d.id === entity.id ? entity : d)));
    }
    setModalState({ type: 'closed' });
  };

  const handleDelete = (deleteId: string) => {
    setEntitiesState((prevData) => prevData.filter((d) => d.id !== deleteId));
  };

  return (
    <>
      <div className="card mb-4" style={{ fontFamily: 'var(--font-persian)' }}>
        <div className="card-header bg-primary text-white d-flex align-items-center">
          <h1 className="h4 mb-0">{entityType === 'topic' ? 'مباحث آموزشی (Topics)' : 'برچسب‌های سوالات (Tags)'}</h1>
          <div className="ms-auto">
            {allowEdit && origHash ? (
              !editMode ? (
                <button
                  className="btn btn-sm btn-light"
                  type="button"
                  onClick={() => setEditMode(true)}
                >
                  <i className="fa fa-edit me-1" aria-hidden="true" /> ویرایش {entityType === 'topic' ? 'مباحث' : 'برچسب‌ها'}
                </button>
              ) : (
                <form method="POST">
                  <input type="hidden" name="__action" value="save_data" />
                  <input type="hidden" name="__csrf_token" value={csrfToken} />
                  <input type="hidden" name="orig_hash" value={origHash} />
                  <input type="hidden" name="data" value={JSON.stringify(entitiesState)} />
                  <span className="js-edit-mode-buttons">
                    <button className="btn btn-sm btn-light mx-1" type="submit">
                      <i className="fa fa-save me-1" aria-hidden="true" /> ذخیره تغییرات
                    </button>
                    <button
                      className="btn btn-sm btn-light"
                      type="button"
                      onClick={() => window.location.reload()}
                    >
                      انصراف
                    </button>
                  </span>
                </form>
              )
            ) : (
              ''
            )}
          </div>
        </div>
        <div className="table-responsive">
          <table
            className="table table-sm table-hover table-striped"
            aria-label={entityType === 'topic' ? 'مباحث درسی' : 'برچسب‌ها'}
          >
            <thead>
              <tr>
                {editMode && allowEdit && (
                  <th style={{ width: '1%' }}>
                    <span className="visually-hidden">عملیات ویرایش و حذف</span>
                  </th>
                )}
                <th>نام {entityType === 'topic' ? 'مبحث' : 'برچسب'}</th>
                <th className="col-9">توضیحات</th>
              </tr>
            </thead>
            <tbody>
              {entitiesState.map((row, index) => {
                const badge =
                  entityType === 'topic' ? <TopicBadge topic={row} /> : <TagBadge tag={row} />;

                return (
                  <tr key={row.name}>
                    {editMode && allowEdit && (
                      <td className="align-middle">
                        <div className="d-flex align-items-center">
                          <button
                            className="btn btn-sm btn-ghost"
                            type="button"
                            aria-label={`ویرایش ${entityType === 'topic' ? 'مبحث' : 'برچسب'} ${row.name}`}
                            onClick={() => handleEdit(index)}
                          >
                            <i className="fa fa-edit" aria-hidden="true" />
                          </button>
                          <button
                            className="btn btn-sm btn-ghost"
                            type="button"
                            aria-label={`حذف ${entityType === 'topic' ? 'مبحث' : 'برچسب'} ${row.name}`}
                            onClick={() => handleDelete(row.id)}
                          >
                            <i className="fa fa-trash text-danger" aria-hidden="true" />
                          </button>
                        </div>
                      </td>
                    )}
                    <td className="align-middle">
                      {editMode ? (
                        badge
                      ) : (
                        <a
                          className="text-decoration-none"
                          href={getCourseAdminQuestionsUrl({
                            courseId,
                            courseInstanceId,
                            filter: { type: entityType, value: row.name },
                          })}
                        >
                          {badge}
                        </a>
                      )}
                    </td>
                    <td className="align-middle">
                      {entityType === 'topic' ? (
                        <TopicDescription topic={row} />
                      ) : (
                        <TagDescription tag={row} />
                      )}
                    </td>
                  </tr>
                );
              })}
              {editMode ? (
                <tr>
                  <td colSpan={5}>
                    <button className="btn btn-sm btn-ghost" type="button" onClick={handleCreate}>
                      <i className="fa fa-plus me-1" aria-hidden="true" /> افزودن {entityType === 'topic' ? 'مبحث جدید' : 'برچسب جدید'}
                    </button>
                  </td>
                </tr>
              ) : (
                ''
              )}
            </tbody>
          </table>
        </div>
      </div>
      <EditTagsTopicsModal
        state={modalState}
        onClose={() => setModalState({ type: 'closed' })}
        onSave={handleSave}
      />
    </>
  );
}

TagsTopicsTable.displayName = 'TagsTopicsTable';
