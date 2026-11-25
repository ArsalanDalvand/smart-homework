import { useMutation } from '@tanstack/react-query';
import clsx from 'clsx';
import { Fragment, useEffect, useRef, useState } from 'react';
import { Alert, Modal } from 'react-bootstrap';
import { useFieldArray, useForm } from 'react-hook-form';

import { run } from '@prairielearn/run';
import { getAppError } from '@prairielearn/trpc/client';

import { type StaffGroupConfig } from '../../../lib/client/safe-db-types.js';
import { type GroupSettingsFormValues, makeRole } from '../../../lib/group-config.js';
import type { AssessmentGroupsError } from '../../../trpc/assessment/assessment-groups.js';
import { useTRPC } from '../../../trpc/assessment/context.js';
import type { ActionAccess } from '../types.js';

const SAVE_FAILED_FALLBACK = 'ذخیره پیکربندی گروه‌ها ناموفق بود.';

const numberOrNull = (v: unknown): number | null => {
  if (v === '' || v == null) return null;
  const n = Number(v);
  return Number.isNaN(n) ? null : n;
};

const RECOMMENDED_ROLES: GroupSettingsFormValues['roles'] = [
  makeRole({ name: 'Manager', minAssignees: 1, maxAssignees: 1, canAssignRoles: true }),
  makeRole({ name: 'Recorder', minAssignees: 1, maxAssignees: 1 }),
  makeRole({ name: 'Reflector', minAssignees: 1, maxAssignees: 1 }),
  makeRole({ name: 'Contributor' }),
];

function ApplyRecommendedRolesModal({
  show,
  onHide,
  onApply,
}: {
  show: boolean;
  onHide: () => void;
  onApply: () => void;
}) {
  return (
    <Modal show={show} onHide={onHide}>
      <Modal.Header>
        <Modal.Title>اعمال نقش‌های پیشنهادی</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p className="text-muted small">
          چهار نقش برگرفته از{' '}
          <a href="https://pogil.org/what-is-pogil" target="_blank" rel="noreferrer">
            POGIL
          </a>{' '}
          اضافه می‌کند. می‌توانید پیش از ذخیره آن‌ها را ویرایش کنید.
        </p>
        <ul className="mb-0">
          <li>
            <strong>Manager</strong> — ۱ عضو، با دسترسی تعیین نقش برای هم‌گروهی‌ها.
          </li>
          <li>
            <strong>Recorder</strong> — ۱ عضو.
          </li>
          <li>
            <strong>Reflector</strong> — ۱ عضو.
          </li>
          <li>
            <strong>Contributor</strong> — تعداد اعضای نامحدود.
          </li>
        </ul>
      </Modal.Body>
      <Modal.Footer>
        <button type="button" className="btn btn-secondary" onClick={onHide}>
          انصراف
        </button>
        <button type="button" className="btn btn-primary" onClick={onApply}>
          اعمال
        </button>
      </Modal.Footer>
    </Modal>
  );
}

export function GroupSettingsCard({
  groupConfigInfo,
  groupSettingsDefaults,
  origHash,
  editAccess,
  onOrigHashChange,
  onGroupSizeSaved,
  onSaved,
  onSaveError,
  onClearSaveStatus,
}: {
  groupConfigInfo: StaffGroupConfig;
  groupSettingsDefaults: GroupSettingsFormValues | null;
  origHash: string | null;
  editAccess: ActionAccess;
  onOrigHashChange: (hash: string | null) => void;
  onGroupSizeSaved: (min: number | null, max: number | null) => void;
  onSaved: () => void;
  onSaveError: (message: string) => void;
  onClearSaveStatus: () => void;
}) {
  const [showRecommendedRolesModal, setShowRecommendedRolesModal] = useState(false);
  const canEdit = editAccess.status === 'allowed';
  const trpc = useTRPC();
  const mutation = useMutation(trpc.assessmentGroups.updateGroupConfig.mutationOptions());

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    setError,
    clearErrors,
    getValues,
    formState: { isDirty, isValid, errors },
  } = useForm<GroupSettingsFormValues>({
    mode: 'onChange',
    defaultValues: {
      studentPermissions: groupSettingsDefaults?.studentPermissions ?? {
        canCreateGroup: true,
        canJoinGroup: true,
        canLeaveGroup: true,
        canNameGroup: true,
      },
      minMembers: groupSettingsDefaults?.minMembers ?? groupConfigInfo.minimum ?? null,
      maxMembers: groupSettingsDefaults?.maxMembers ?? groupConfigInfo.maximum ?? null,
      roles: groupSettingsDefaults?.roles ?? [],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'roles' });

  const watchedMin = watch('minMembers');
  const watchedRoles = watch('roles');
  const watchedCanCreateGroup = watch('studentPermissions.canCreateGroup');

  useEffect(() => {
    const violations: Record<string, string> = {};
    if (watchedRoles.length > 0) {
      const hasAssigner = watchedRoles.some(
        (role) => role.canAssignRoles && (role.minAssignees ?? 0) >= 1,
      );
      if (!hasAssigner) {
        violations.noAssigner =
          'هیچ نقشی با دسترسی «تعیین نقش‌ها» حداقل تعداد عضو ۱ یا بیشتر ندارد.';
      }
      if (!watchedRoles.some((r) => r.canView)) {
        violations.noViewer = 'حداقل یک نقش باید دسترسی مشاهده سوالات را داشته باشد.';
      }
      if (!watchedRoles.some((r) => r.canSubmit)) {
        violations.noSubmitter = 'حداقل یک نقش باید دسترسی ارسال پاسخ‌ها را داشته باشد.';
      }
      watchedRoles.forEach((r, idx) => {
        if (!r.canView && !r.canSubmit && !r.canAssignRoles) {
          const name = r.name || '(بدون نام)';
          violations[`roleNoPermissions${idx}`] =
            `«${name}» هیچ دسترسی‌ای ندارد — دانشجویان با این نقش نمی‌توانند سوالی را ببینند، پاسخی ارسال کنند یا نقشی تعیین کنند.`;
        }
      });
    }

    const possibleKeys = [
      'noAssigner',
      'noViewer',
      'noSubmitter',
      ...watchedRoles.map((_, i) => `roleNoPermissions${i}`),
    ];
    for (const key of possibleKeys) {
      if (violations[key]) {
        setError(`root.${key}`, { type: 'manual', message: violations[key] });
      } else {
        clearErrors(`root.${key}`);
      }
    }
  }, [watchedRoles, setError, clearErrors]);

  const formLevelRoleErrors = Object.values(errors.root ?? {})
    .map((e) => (typeof e === 'object' ? e.message : null))
    .filter((m): m is string => typeof m === 'string');
  const roleWarnings = run(() => {
    if (watchedRoles.length === 0) return [];
    const warnings: string[] = [];
    for (const r of watchedRoles) {
      const name = r.name || '(بدون نام)';
      if (watchedMin != null && r.minAssignees != null && r.minAssignees > watchedMin) {
        warnings.push(
          `نقش «${name}» دارای حداقل (${r.minAssignees}) بیشتر از حداقل اعضای گروه (${watchedMin}) است.`,
        );
      }
    }
    return warnings;
  });

  const onSubmit = (data: GroupSettingsFormValues) => {
    mutation.mutate(
      {
        origHash,
        canCreateGroup: data.studentPermissions.canCreateGroup,
        canJoinGroup: data.studentPermissions.canJoinGroup,
        canLeaveGroup: data.studentPermissions.canLeaveGroup,
        canNameGroup: data.studentPermissions.canNameGroup,
        minMembers: data.minMembers,
        maxMembers: data.maxMembers,
        roles: data.roles,
      },
      {
        onSuccess: ({ origHash: newHash }) => {
          onOrigHashChange(newHash);
          onGroupSizeSaved(data.minMembers, data.maxMembers);
          reset({
            ...data,
            roles: data.roles.map((r) => ({ ...r, origName: r.name })),
          });
          onSaved();
        },
        onError: (err) => {
          const appError = getAppError<AssessmentGroupsError['UpdateGroupConfig']>(err);
          onSaveError(appError?.message ?? SAVE_FAILED_FALLBACK);
        },
      },
    );
  };

  const wasDirtyRef = useRef(isDirty);
  useEffect(() => {
    if (isDirty && !wasDirtyRef.current) onClearSaveStatus();
    wasDirtyRef.current = isDirty;
  }, [isDirty, onClearSaveStatus]);

  return (
    <div className="card">
      <ApplyRecommendedRolesModal
        show={showRecommendedRolesModal}
        onHide={() => setShowRecommendedRolesModal(false)}
        onApply={() => {
          append(RECOMMENDED_ROLES);
          setShowRecommendedRolesModal(false);
        }}
      />
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="card-body">
          <h5 className="mb-1">تنظیمات گروه</h5>
          <div className="text-muted small mb-4">
            نحوه عملکرد گروه‌ها را برای این ارزیابی پیکربندی کنید.
          </div>
          {editAccess.status === 'denied' && (
            <Alert variant="info" className="mb-4">
              {editAccess.reason}
            </Alert>
          )}
          <fieldset disabled={!canEdit}>
            <div className="mb-4">
              <h6>دسترسی‌های دانشجو</h6>

              <div className="form-check mb-2">
                <input
                  type="checkbox"
                  className="form-check-input"
                  id="studentPermissions-canCreateGroup"
                  defaultChecked={groupSettingsDefaults?.studentPermissions.canCreateGroup ?? true}
                  {...register('studentPermissions.canCreateGroup', {
                    onChange: (e) => {
                      if (!e.target.checked) {
                        setValue('studentPermissions.canNameGroup', false, {
                          shouldDirty: true,
                        });
                      }
                    },
                  })}
                />
                <label htmlFor="studentPermissions-canCreateGroup" className="form-check-label">
                  اجازه ایجاد گروه
                </label>
                <div className="text-muted small">اجازه به دانشجویان برای ایجاد گروه.</div>
              </div>

              <div className="form-check mb-2">
                <input
                  type="checkbox"
                  className="form-check-input"
                  id="studentPermissions-canNameGroup"
                  disabled={!watchedCanCreateGroup}
                  defaultChecked={groupSettingsDefaults?.studentPermissions.canNameGroup ?? true}
                  {...register('studentPermissions.canNameGroup')}
                />
                <label htmlFor="studentPermissions-canNameGroup" className="form-check-label">
                  اجازه نام‌گذاری گروه
                </label>
                <div className="text-muted small">
                  اجازه به دانشجویان برای انتخاب نام گروه هنگام ساخت گروه. در صورت غیرفعال بودن، از
                  نام پیش‌فرض استفاده می‌شود.
                </div>
              </div>

              <div className="form-check mb-2">
                <input
                  type="checkbox"
                  className="form-check-input"
                  id="studentPermissions-canJoinGroup"
                  defaultChecked={groupSettingsDefaults?.studentPermissions.canJoinGroup ?? true}
                  {...register('studentPermissions.canJoinGroup')}
                />
                <label htmlFor="studentPermissions-canJoinGroup" className="form-check-label">
                  اجازه پیوستن به گروه
                </label>
                <div className="text-muted small">
                  اجازه به دانشجویان برای پیوستن به سایر گروه‌ها با کد عضویت.
                </div>
              </div>

              <div className="form-check mb-2">
                <input
                  type="checkbox"
                  className="form-check-input"
                  id="studentPermissions-canLeaveGroup"
                  defaultChecked={groupSettingsDefaults?.studentPermissions.canLeaveGroup ?? true}
                  {...register('studentPermissions.canLeaveGroup')}
                />
                <label htmlFor="studentPermissions-canLeaveGroup" className="form-check-label">
                  اجازه ترک گروه
                </label>
                <div className="text-muted small">اجازه به دانشجویان برای ترک گروه‌ها.</div>
              </div>
            </div>

            <div className="mb-4">
              <h6>اندازه گروه</h6>
              <div className="row g-3">
                <div className="col-md-6">
                  <label htmlFor="groupSettings-minMembers" className="form-label">
                    حداقل اعضا
                  </label>
                  <input
                    type="number"
                    className={clsx('form-control', errors.minMembers && 'is-invalid')}
                    id="groupSettings-minMembers"
                    placeholder="ندارد"
                    aria-invalid={errors.minMembers ? 'true' : undefined}
                    aria-errormessage={
                      errors.minMembers ? 'groupSettings-minMembersError' : undefined
                    }
                    defaultValue={
                      groupSettingsDefaults?.minMembers ?? groupConfigInfo.minimum ?? ''
                    }
                    {...register('minMembers', {
                      setValueAs: numberOrNull,
                      min: { value: 1, message: 'باید حداقل ۱ باشد.' },
                      onChange: (e) => {
                        const newMin = numberOrNull(e.target.value);
                        const currentMax = getValues('maxMembers');
                        if (newMin != null && currentMax != null && newMin > currentMax) {
                          setValue('maxMembers', newMin, {
                            shouldDirty: true,
                            shouldValidate: true,
                          });
                        }
                      },
                    })}
                  />
                  {errors.minMembers && (
                    <div id="groupSettings-minMembersError" className="text-danger small">
                      {errors.minMembers.message}
                    </div>
                  )}
                  <div className="text-muted small">حداقل تعداد دانشجویان در یک گروه.</div>
                </div>
                <div className="col-md-6">
                  <label htmlFor="groupSettings-maxMembers" className="form-label">
                    حداکثر اعضا
                  </label>
                  <input
                    type="number"
                    className={clsx('form-control', errors.maxMembers && 'is-invalid')}
                    id="groupSettings-maxMembers"
                    placeholder="ندارد"
                    aria-invalid={errors.maxMembers ? 'true' : undefined}
                    aria-errormessage={
                      errors.maxMembers ? 'groupSettings-maxMembersError' : undefined
                    }
                    defaultValue={
                      groupSettingsDefaults?.maxMembers ?? groupConfigInfo.maximum ?? ''
                    }
                    {...register('maxMembers', {
                      setValueAs: numberOrNull,
                      min: { value: 1, message: 'باید حداقل ۱ باشد.' },
                      validate: (value) => {
                        const min = getValues('minMembers');
                        if (value != null && min != null && value < min) {
                          return 'حداکثر اعضا نمی‌تواند کمتر از حداقل اعضا باشد.';
                        }
                        return true;
                      },
                    })}
                  />
                  {errors.maxMembers && (
                    <div id="groupSettings-maxMembersError" className="text-danger small">
                      {errors.maxMembers.message}
                    </div>
                  )}
                  <div className="text-muted small">حداکثر تعداد دانشجویان در یک گروه.</div>
                </div>
              </div>
            </div>

            <div>
              <div className="d-flex justify-content-between align-items-center gap-2">
                <h5 className="mb-0">نقش‌ها</h5>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-primary"
                  onClick={() => append(makeRole({ canAssignRoles: true, minAssignees: 1 }))}
                >
                  <i className="bi bi-plus-lg" aria-hidden="true" /> افزودن نقش
                </button>
              </div>

              <div className="text-muted small mb-3">
                پیکربندی{' '}
                <a href="https://docs.prairielearn.com/assessment/configuration/#enabling-custom-group-roles">
                  نقش‌های سفارشی گروه
                </a>
                ، که می‌توانند دسترسی‌های متفاوتی برای تسهیل کار گروهی مبتنی بر نقش داشته باشند.
              </div>

              <div className="card overflow-x-auto">
                <table className="table table-sm align-middle mb-0">
                  <thead>
                    <tr>
                      <th scope="col">نام</th>
                      <th scope="col">حداقل دانشجو</th>
                      <th scope="col">حداکثر دانشجو</th>
                      <th scope="col" className="text-center">
                        تعیین نقش‌ها
                      </th>
                      <th scope="col" className="text-center">
                        مشاهده سوالات
                      </th>
                      <th scope="col" className="text-center">
                        ارسال پاسخ‌ها
                      </th>
                      <th scope="col" />
                    </tr>
                  </thead>
                  <tbody>
                    {fields.length === 0 ? (
                      <tr className="text-center text-muted">
                        <td colSpan={7} className="py-3">
                          <div>
                            <i className="bi bi-person-badge me-2" aria-hidden="true" />
                            نقشی پیکربندی نشده است
                          </div>
                          <button
                            type="button"
                            className="btn btn-link btn-sm p-0 mt-2"
                            onClick={() => setShowRecommendedRolesModal(true)}
                          >
                            استفاده از پیکربندی پیشنهادی
                          </button>
                        </td>
                      </tr>
                    ) : (
                      fields.map((field, index) => {
                        const rowErrors = errors.roles?.[index];
                        const minError = rowErrors?.minAssignees;
                        const maxError = rowErrors?.maxAssignees;
                        const rowNumber = index + 1;
                        const nameErrorId = `role-${index}-nameError`;
                        const minErrorId = `role-${index}-minError`;
                        const maxErrorId = `role-${index}-maxError`;
                        return (
                          <Fragment key={field.id}>
                            <tr>
                              <td>
                                <input
                                  type="hidden"
                                  defaultValue={field.origName ?? ''}
                                  {...register(`roles.${index}.origName`)}
                                />
                                <input
                                  type="text"
                                  className={clsx(
                                    'form-control form-control-sm',
                                    rowErrors?.name && 'is-invalid',
                                  )}
                                  placeholder="مثلاً Manager"
                                  defaultValue={field.name}
                                  aria-label={`نام نقش ${rowNumber}`}
                                  aria-invalid={rowErrors?.name ? 'true' : undefined}
                                  aria-errormessage={rowErrors?.name ? nameErrorId : undefined}
                                  {...register(`roles.${index}.name`, {
                                    required: 'وارد کردن نام الزامی است.',
                                    deps: watchedRoles.map((_, i) => `roles.${i}.name` as const),
                                    validate: (value) => {
                                      const allNames = getValues('roles').map((r) => r.name);
                                      const dupes = allNames.filter((n) => n === value);
                                      return dupes.length <= 1 || 'نام نقش تکراری است.';
                                    },
                                  })}
                                />
                              </td>
                              <td>
                                <input
                                  type="number"
                                  className={clsx(
                                    'form-control form-control-sm',
                                    !!minError && 'is-invalid',
                                  )}
                                  placeholder="ندارد"
                                  defaultValue={field.minAssignees ?? ''}
                                  aria-label={`حداقل دانشجو برای نقش ${rowNumber}`}
                                  aria-invalid={minError ? 'true' : undefined}
                                  aria-errormessage={minError ? minErrorId : undefined}
                                  {...register(`roles.${index}.minAssignees`, {
                                    setValueAs: numberOrNull,
                                    deps: [`roles.${index}.maxAssignees`, 'maxMembers'],
                                    min: { value: 0, message: 'باید ≥ ۰ باشد.' },
                                    validate: (value) => {
                                      const max = getValues(`roles.${index}.maxAssignees`);
                                      if (value != null && max != null && value > max) {
                                        return 'باید ≤ حداکثر اعضا باشد.';
                                      }
                                      const maxMembers = getValues('maxMembers');
                                      if (
                                        value != null &&
                                        maxMembers != null &&
                                        value > maxMembers
                                      ) {
                                        return `باید ≤ حداکثر اعضای گروه (${maxMembers}) باشد.`;
                                      }
                                      return true;
                                    },
                                    onChange: (e) => {
                                      const newMin = numberOrNull(e.target.value);
                                      const currentMax = getValues(`roles.${index}.maxAssignees`);
                                      if (
                                        newMin != null &&
                                        currentMax != null &&
                                        newMin > currentMax
                                      ) {
                                        setValue(`roles.${index}.maxAssignees`, newMin, {
                                          shouldDirty: true,
                                          shouldValidate: true,
                                        });
                                      }
                                    },
                                  })}
                                />
                              </td>
                              <td>
                                <input
                                  type="number"
                                  className={clsx(
                                    'form-control form-control-sm',
                                    !!maxError && 'is-invalid',
                                  )}
                                  placeholder="ندارد"
                                  defaultValue={field.maxAssignees ?? ''}
                                  aria-label={`حداکثر دانشجو برای نقش ${rowNumber}`}
                                  aria-invalid={maxError ? 'true' : undefined}
                                  aria-errormessage={maxError ? maxErrorId : undefined}
                                  {...register(`roles.${index}.maxAssignees`, {
                                    setValueAs: numberOrNull,
                                    deps: [`roles.${index}.minAssignees`, 'maxMembers'],
                                    min: { value: 1, message: 'باید ≥ ۱ باشد.' },
                                    validate: (value) => {
                                      const min = getValues(`roles.${index}.minAssignees`);
                                      if (value != null && min != null && min > value) {
                                        return 'باید ≥ حداقل اعضا باشد.';
                                      }
                                      const maxMembers = getValues('maxMembers');
                                      if (
                                        value != null &&
                                        maxMembers != null &&
                                        value > maxMembers
                                      ) {
                                        return `باید ≤ حداکثر اعضای گروه (${maxMembers}) باشد.`;
                                      }
                                      return true;
                                    },
                                  })}
                                />
                              </td>
                              <td className="text-center">
                                <input
                                  type="checkbox"
                                  className="form-check-input"
                                  aria-label={`تعیین نقش‌ها برای ${watchedRoles[index]?.name || 'این نقش'}`}
                                  defaultChecked={field.canAssignRoles}
                                  {...register(`roles.${index}.canAssignRoles`)}
                                />
                              </td>
                              <td className="text-center">
                                <input
                                  type="checkbox"
                                  className="form-check-input"
                                  aria-label={`مشاهده سوالات برای ${watchedRoles[index]?.name || 'این نقش'}`}
                                  defaultChecked={field.canView}
                                  {...register(`roles.${index}.canView`, {
                                    onChange: (e) => {
                                      if (!e.target.checked) {
                                        setValue(`roles.${index}.canSubmit`, false, {
                                          shouldDirty: true,
                                        });
                                      }
                                    },
                                  })}
                                />
                              </td>
                              <td className="text-center">
                                <input
                                  type="checkbox"
                                  className="form-check-input"
                                  disabled={!watchedRoles[index]?.canView}
                                  aria-label={
                                    watchedRoles[index]?.canView
                                      ? `ارسال پاسخ‌ها برای ${watchedRoles[index]?.name || 'این نقش'}`
                                      : `ارسال پاسخ‌ها برای ${watchedRoles[index]?.name || 'این نقش'} (نیازمند مشاهده سوالات)`
                                  }
                                  defaultChecked={field.canSubmit}
                                  {...register(`roles.${index}.canSubmit`)}
                                />
                              </td>
                              <td className="text-end">
                                <button
                                  type="button"
                                  className="btn btn-sm btn-outline-danger"
                                  aria-label={`حذف نقش ${index + 1}`}
                                  onClick={() => remove(index)}
                                >
                                  <i className="bi bi-trash" aria-hidden="true" />
                                </button>
                              </td>
                            </tr>
                            {(rowErrors?.name || minError || maxError) && (
                              <tr>
                                {rowErrors.name ? (
                                  <td id={nameErrorId} className="text-danger small pt-0">
                                    {rowErrors.name.message}
                                  </td>
                                ) : (
                                  <td className="pt-0" />
                                )}
                                {minError ? (
                                  <td id={minErrorId} className="text-danger small pt-0">
                                    {minError.message}
                                  </td>
                                ) : (
                                  <td className="pt-0" />
                                )}
                                {maxError ? (
                                  <td id={maxErrorId} className="text-danger small pt-0">
                                    {maxError.message}
                                  </td>
                                ) : (
                                  <td className="pt-0" />
                                )}
                                <td colSpan={4} className="pt-0" />
                              </tr>
                            )}
                          </Fragment>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {formLevelRoleErrors.length > 0 && (
                <div className="mt-3">
                  {formLevelRoleErrors.map((error) => (
                    <Alert key={error} variant="danger" className="mb-2 small">
                      <i className="bi bi-exclamation-circle me-2" aria-hidden="true" />
                      {error}
                    </Alert>
                  ))}
                </div>
              )}

              {roleWarnings.length > 0 && (
                <div className="mt-3">
                  {roleWarnings.map((warning) => (
                    <Alert key={warning} variant="warning" className="mb-2 small">
                      <i className="bi bi-exclamation-triangle me-2" aria-hidden="true" />
                      {warning}
                    </Alert>
                  ))}
                </div>
              )}
            </div>
          </fieldset>
        </div>
        {canEdit && (
          <div className="card-footer d-flex justify-content-end gap-2">
            <button
              type="button"
              className="btn btn-outline-secondary"
              disabled={!isDirty}
              onClick={() => reset()}
            >
              انصراف
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={
                !isDirty || !isValid || formLevelRoleErrors.length > 0 || mutation.isPending
              }
            >
              ذخیره
            </button>
          </div>
        )}
      </form>
    </div>
  );
}
