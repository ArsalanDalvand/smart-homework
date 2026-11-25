import { html } from '@prairielearn/html';

import type { GroupConfig } from '../lib/db-types.js';
import type { GroupInfo } from '../lib/groups.shared.js';
import { idsEqual } from '../lib/id.js';

import { Modal } from './Modal.js';

export function GroupWorkInfoContainer({
  groupConfig,
  groupInfo,
  userCanAssignRoles,
  csrfToken,
}: {
  groupConfig: GroupConfig;
  groupInfo: GroupInfo;
  userCanAssignRoles: boolean;
  csrfToken: string;
}) {
  return html`
    <div class="container-fluid">
      <div class="row">
        <div class="col-sm bg-light py-4 px-4 border">
          <div>
            <strong>نام گروه:</strong> <span id="group-name">${groupInfo.groupName}</span>
          </div>
          ${
            groupConfig.student_authz_join
              ? html`
                  <div>
                    <strong>کد پیوستن:</strong> <span id="join-code">${groupInfo.joinCode}</span>
                  </div>
                  <div class="mt-3">
                    ${
                      (groupConfig.minimum ?? 0) > 1
                        ? html`
                            این یک تکلیف/آزمون گروهی است. از کد پیوستن خود برای دعوت سایرین به گروه
                            استفاده کنید. هر گروه باید
                            ${
                              groupConfig.minimum === groupConfig.maximum
                                ? groupConfig.minimum
                                : groupConfig.maximum
                                  ? `بین ${groupConfig.minimum} تا ${groupConfig.maximum}`
                                  : `حداقل ${groupConfig.minimum}`
                            }
                            دانشجو داشته باشد.
                          `
                        : html`
                            این تکلیف/آزمون می‌تواند به‌صورت فردی یا گروهی انجام شود. در صورت تمایل
                            برای دعوت سایرین به گروه، از کد پیوستن خود استفاده کنید.
                            ${
                              groupConfig.maximum
                                ? `هر گروه نباید بیش از ${groupConfig.maximum} دانشجو داشته باشد.`
                                : ''
                            }
                          `
                    }
                  </div>
                `
              : ''
          }
        </div>
        <div class="col-sm bg-light py-4 px-4 border">
          ${
            groupConfig.student_authz_leave
              ? html`
                  <div class="text-end">
                    <button
                      type="button"
                      class="btn btn-danger"
                      data-bs-toggle="modal"
                      data-bs-target="#leaveGroupModal"
                    >
                      ترک گروه
                    </button>
                  </div>
                  ${LeaveGroupModal({ csrfToken })}
                `
              : ''
          }
          <span id="group-member"><b>اعضای گروه: </b></span>
          ${groupInfo.groupMembers.map((user) =>
            groupConfig.has_roles
              ? html`
                  <li>
                    ${user.uid} -
                    ${
                      groupInfo.rolesInfo?.roleAssignments[user.uid]
                        ?.map((a) => a.role_name)
                        .join(', ') || 'نقشی تخصیص داده نشده است'
                    }
                  </li>
                `
              : html`<li>${user.uid}</li>`,
          )}
        </div>
      </div>
    </div>
    ${groupConfig.has_roles ? GroupRoleTable({ groupInfo, userCanAssignRoles, csrfToken }) : ''}
  `;
}

function LeaveGroupModal({ csrfToken }: { csrfToken: string }) {
  return Modal({
    id: 'leaveGroupModal',
    title: 'تایید ترک گروه',
    body: html`
      <p>آیا مطمئن هستید که می‌خواهید گروه را ترک کنید؟</p>
      <p>
        دسترسی خود به تمامی کارهای انجام‌شده توسط گروه را از دست خواهید داد و ممکن است بعداً نتوانید
        دوباره به گروه بپیوندید.
      </p>
    `,
    footer: html`
      <input type="hidden" name="__action" value="leave_group" />
      <input type="hidden" name="__csrf_token" value="${csrfToken}" />
      <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">بستن</button>
      <button id="leave-group" type="submit" class="btn btn-danger">ترک گروه</button>
    `,
  });
}

function GroupRoleTable({
  groupInfo,
  userCanAssignRoles,
  csrfToken,
}: {
  groupInfo: GroupInfo;
  userCanAssignRoles: boolean;
  csrfToken: string;
}) {
  const { rolesInfo, groupMembers, groupSize } = groupInfo;
  if (!rolesInfo) return '';
  const roleConfigProblems =
    rolesInfo.validationErrors.length +
    (rolesInfo.usersWithoutRoles.length > 0 ? 1 : 0) +
    (rolesInfo.rolesAreBalanced ? 0 : 1);
  return html`
    ${
      roleConfigProblems > 0
        ? html`
            <div class="alert alert-danger mt-2" role="alert">
              پیکربندی نقش‌های گروه شما در حال حاضر نامعتبر است. لطفاً الزامات نقش‌ها را بررسی کرده
              و
              ${
                userCanAssignRoles
                  ? 'یک پیکربندی نقش معتبر اختصاص دهید'
                  : 'از کاربری که نقش تخصیص‌دهنده دارد بخواهید پیکربندی نقش‌ها را به‌روزرسانی کند'
              }.
              تا زمانی که پیکربندی نقش‌ها معتبر نشود، امکان ارسال پاسخ به سوالات غیرفعال است.
            </div>
          `
        : ''
    }
    <details class="card mb-2">
      <summary class="card-header bg-secondary text-light">
        ${userCanAssignRoles ? 'مدیریت نقش‌های گروه' : 'مشاهده نقش‌های گروه'}
        ${
          roleConfigProblems > 0
            ? html`
                <span
                  class="badge rounded-pill text-bg-danger"
                  data-testid="group-role-config-problems"
                >
                  ${roleConfigProblems}
                </span>
              `
            : ''
        }
      </summary>
      <div class="card-body">
        ${GroupRoleErrors({ rolesInfo, groupSize })}
        <p>
          این تکلیف/آزمون شامل نقش‌های گروهی است که به‌صورت انتخابی به دانشجویان اجازه می‌دهد
          سوالات را مشاهده کنند، پاسخ ارسال کنند و تخصیص نقش‌های گروه را تغییر دهند.
        </p>

        <form id="role-select-form" name="role-select-form" method="POST">
          <div class="table-responsive mb-3">
            <table
              class="table table-bordered table-striped table-sm mb-0"
              aria-label="کاربران و نقش‌های گروه"
            >
              <thead>
                <tr>
                  <th>کاربر</th>
                  <th>نقش‌ها</th>
                </tr>
              </thead>
              <tbody>
                ${groupMembers.map(
                  (user) => html`
                    <tr>
                      <td>${user.uid}</td>
                      <td>
                        <div class="d-flex gap-3">
                          ${rolesInfo.groupRoles.map(
                            (role) => html`
                              <label
                                class="d-inline-flex gap-1 ${
                                  rolesInfo.disabledRoles.includes(role.role_name)
                                    ? 'text-muted'
                                    : ''
                                }"
                              >
                                <input
                                  type="checkbox"
                                  id="user_role_${role.id}-${user.id}"
                                  name="user_role_${role.id}-${user.id}"
                                  ${
                                    rolesInfo.disabledRoles.includes(role.role_name) ||
                                    !userCanAssignRoles
                                      ? 'disabled'
                                      : ''
                                  }
                                  ${
                                    rolesInfo.roleAssignments[user.uid]?.some((a) =>
                                      idsEqual(a.team_role_id, role.id),
                                    )
                                      ? 'checked'
                                      : ''
                                  }
                                />
                                ${role.role_name}
                              </label>
                            `,
                          )}
                        </div>
                      </td>
                    </tr>
                  `,
                )}
              </tbody>
            </table>
          </div>
          ${
            userCanAssignRoles
              ? html`
                  <div class="d-flex justify-content-center">
                    <input type="hidden" name="__action" value="update_group_roles" />
                    <input type="hidden" name="__csrf_token" value="${csrfToken}" />
                    <button type="submit" class="btn btn-primary">به‌روزرسانی نقش‌ها</button>
                  </div>
                `
              : ''
          }
        </form>
      </div>
      <div class="card-footer small">
        <div class="table-responsive">
          <table
            class="table table-bordered table-striped table-sm w-auto mb-0"
            aria-label="الزامات و محدودیت‌های نقش"
          >
            <thead>
              <tr>
                <th>نقش</th>
                <th>حداقل تخصیص</th>
                <th>حداکثر تخصیص</th>
                <th>امکان تخصیص نقش</th>
              </tr>
            </thead>
            <tbody>
              ${rolesInfo.groupRoles.map(
                (groupRole) => html`
                  <tr>
                    <td>${groupRole.role_name}</td>
                    <td>${groupRole.minimum ?? 0}</td>
                    <td>${groupRole.maximum ?? 'نامحدود'}</td>
                    <td>${groupRole.can_assign_roles ? 'بله' : 'خیر'}</td>
                  </tr>
                `,
              )}
            </tbody>
          </table>
        </div>
      </div>
    </details>
  `;
}

function GroupRoleErrors({
  rolesInfo,
  groupSize,
}: {
  rolesInfo: NonNullable<GroupInfo['rolesInfo']>;
  groupSize: number;
}) {
  return html`
    ${
      !rolesInfo.rolesAreBalanced
        ? html`
            <div class="alert alert-danger" role="alert">
              حداقل یک دانشجو نقش‌های بیش از حد دارد. در گروهی با ${groupSize} دانشجو، به هر
              دانشجو باید دقیقاً <strong>یک</strong> نقش اختصاص داده شود.
            </div>
          `
        : ''
    }
    ${rolesInfo.validationErrors.map(
      ({ role_name, count, minimum, maximum }) => html`
        <div class="alert alert-danger" role="alert">
          ${
            minimum != null && count < minimum
              ? html`
                  ${minimum - count} دانشجوی دیگر باید به نقش «${role_name}» اختصاص داده شوند
                `
              : maximum != null && count > maximum
                ? html`
                    ${count - maximum} دانشجوی کمتر باید به نقش «${role_name}» اختصاص داده شوند
                  `
                : ''
          }
          ${
            maximum === minimum
              ? html` (${count} تخصیص یافته، ${minimum} مورد انتظار). `
              : maximum == null
                ? html` (${count} تخصیص یافته، حداقل ${minimum} مورد انتظار). `
                : html` (${count} تخصیص یافته، بین ${minimum ?? 0} تا ${maximum} مورد انتظار). `
          }
        </div>
      `,
    )}
    ${
      rolesInfo.usersWithoutRoles.length > 0
        ? html`
            <div class="alert alert-danger" role="alert">
              حداقل یک کاربر هیچ نقشی ندارد. همه کاربران باید دارای نقش باشند.
            </div>
          `
        : ''
    }
  `;
}
