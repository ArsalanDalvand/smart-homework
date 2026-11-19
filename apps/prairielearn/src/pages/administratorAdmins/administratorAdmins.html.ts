import { escapeHtml, html } from '@prairielearn/html';

import { PageLayout } from '../../components/PageLayout.js';
import { uiStrings } from '../../lib/branding.js';
import { type User } from '../../lib/db-types.js';
import type { ResLocalsForPage } from '../../lib/res-locals.js';

export function AdministratorAdmins({
  admins,
  resLocals,
}: {
  admins: User[];
  resLocals: ResLocalsForPage<'plain'>;
}) {
  return PageLayout({
    resLocals,
    pageTitle: 'مدیران سامانه',
    navContext: {
      type: 'administrator',
      page: 'admin',
      subPage: 'administrators',
    },
    options: {
      fullWidth: true,
    },
    content: html`
      <div class="card mb-4" style="font-family: var(--font-persian);">
        <div class="card-header bg-primary text-white d-flex align-items-center">
          <h1 class="h4 mb-0">مدیران کل سامانه</h1>
          <button
            type="button"
            class="btn btn-sm btn-light ms-auto"
            data-bs-toggle="popover"
            data-bs-container="body"
            data-bs-html="true"
            data-bs-placement="auto"
            data-bs-title="افزودن مدیر جدید سامانه"
            data-bs-content="${escapeHtml(
              AdministratorInsertForm({
                csrfToken: resLocals.__csrf_token,
              }),
            )}"
            data-testid="administrator-insert-button"
          >
            <i class="fa fa-user-plus" aria-hidden="true"></i>
            <span class="d-none d-sm-inline ms-1">افزودن مدیر</span>
          </button>
        </div>

        <div class="table-responsive">
          <table class="table table-sm table-hover table-striped" aria-label="مدیران سامانه">
            <thead>
              <tr>
                <th>شناسه کاربری (UID / ایمیل)</th>
                <th>نام و نام خانوادگی</th>
                <th class="text-end">عملیات</th>
              </tr>
            </thead>

            <tbody>
              ${admins.map(
                (admin) => html`
                  <tr>
                    <td class="align-middle" dir="ltr" style="text-align: right;">${admin.uid}</td>
                    <td class="align-middle">${admin.name || '—'}</td>
                    <td class="align-middle text-end">
                      <button
                        type="button"
                        class="btn btn-sm btn-danger"
                        data-bs-toggle="popover"
                        data-bs-container="body"
                        data-bs-html="true"
                        data-bs-placement="auto"
                        data-bs-title="حذف دسترسی مدیریت"
                        data-bs-content="${escapeHtml(
                          AdministratorDeleteForm({
                            csrfToken: resLocals.__csrf_token,
                            uid: admin.uid,
                            userId: admin.id,
                          }),
                        )}"
                      >
                        <i class="fa fa-times" aria-hidden="true"></i> حذف دسترسی
                      </button>
                    </td>
                  </tr>
                `,
              )}
            </tbody>
          </table>
        </div>

        <div class="card-footer text-muted">
          <small>
            ${uiStrings.admin.adminsDesc}
          </small>
        </div>
      </div>
    `,
  });
}

function AdministratorInsertForm({ csrfToken }: { csrfToken: string }) {
  return html`
    <form name="add-user-form" method="POST" style="font-family: var(--font-persian);">
      <input type="hidden" name="__action" value="administrators_insert_by_user_uid" />
      <input type="hidden" name="__csrf_token" value="${csrfToken}" />
      <div class="mb-3">
        <label class="form-label" for="administratorInsertFormUid">شناسه کاربری (UID / ایمیل سازمانی):</label>
        <input
          type="text"
          class="form-control"
          id="administratorInsertFormUid"
          name="uid"
          placeholder="username@iust.ac.ir"
          dir="ltr"
        />
      </div>
      <div class="text-end d-flex justify-content-end gap-2">
        <button type="button" class="btn btn-sm btn-secondary" data-bs-dismiss="popover">انصراف</button>
        <button type="submit" class="btn btn-sm btn-primary">افزودن مدیر</button>
      </div>
    </form>
  `;
}

function AdministratorDeleteForm({
  csrfToken,
  userId,
  uid,
}: {
  csrfToken: string;
  userId: string;
  uid: string;
}) {
  return html`
    <form name="add-user-form" method="POST" style="font-family: var(--font-persian);">
      <input type="hidden" name="__action" value="administrators_delete_by_user_id" />
      <input type="hidden" name="__csrf_token" value="${csrfToken}" />
      <input type="hidden" name="user_id" value="${userId}" />
      <div class="mb-3"><strong>شناسه:</strong> <span dir="ltr">${uid}</span></div>
      <div class="text-end d-flex justify-content-end gap-2">
        <button type="button" class="btn btn-sm btn-secondary" data-bs-dismiss="popover">انصراف</button>
        <button type="submit" class="btn btn-sm btn-danger">حذف قطعی دسترسی</button>
      </div>
    </form>
  `;
}
