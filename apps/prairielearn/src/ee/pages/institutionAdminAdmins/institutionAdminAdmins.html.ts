import { z } from 'zod';

import { html } from '@prairielearn/html';

import { Modal } from '../../../components/Modal.js';
import { PageLayout } from '../../../components/PageLayout.js';
import { compiledScriptTag } from '../../../lib/assets.js';
import {
  type Institution,
  InstitutionAdministratorSchema,
  UserSchema,
} from '../../../lib/db-types.js';
import type { ResLocalsForPage } from '../../../lib/res-locals.js';

export const InstitutionAdminAdminsRowSchema = z.object({
  user: UserSchema,
  institution_administrator: InstitutionAdministratorSchema,
});
type InstitutionAdminAdminsRow = z.infer<typeof InstitutionAdminAdminsRowSchema>;

export function InstitutionAdminAdmins({
  institution,
  rows,
  uidsLimit,
  resLocals,
}: {
  institution: Institution;
  rows: InstitutionAdminAdminsRow[];
  uidsLimit: number;
  resLocals: ResLocalsForPage<'plain'>;
}) {
  return PageLayout({
    resLocals: {
      ...resLocals,
      institution,
    },
    pageTitle: `مدیران — ${institution.short_name}`,
    headContent: compiledScriptTag('institutionAdminAdminsClient.ts'),
    navContext: {
      type: 'institution',
      page: 'institution_admin',
      subPage: 'admins',
    },
    content: html`
      ${AdminsCard({ rows })} ${AddAdminsModal({ uidsLimit, csrfToken: resLocals.__csrf_token })}
      ${RemoveAdminModal({ csrfToken: resLocals.__csrf_token })}
    `,
  });
}

function AdminsCard({ rows }: { rows: InstitutionAdminAdminsRow[] }) {
  return html`
    <div class="card mb-4">
      <div class="card-header bg-primary text-white d-flex align-items-center">
        مدیران
        <button
          type="button"
          class="btn btn-sm btn-light ms-auto"
          data-bs-toggle="modal"
          data-bs-target="#addAdminsModal"
        >
          <i class="fa fa-user-plus" aria-hidden="true"></i>
          افزودن مدیران
        </button>
      </div>

      ${
        rows.length === 0
          ? html`
              <div class="card-body">
                <div class="text-center text-muted">هیچ مدیر موسسه‌ای وجود ندارد</div>
              </div>
            `
          : html`
              <ul class="list-group list-group-flush">
                ${rows.map(
                  (row) => html`
                    <li class="list-group-item d-flex flex-row align-items-center">
                      <div class="d-flex flex-column">
                        <span>${row.user.name}</span>
                        <span class="text-muted">${row.user.uid}</span>
                      </div>

                      <button
                        class="btn btn-sm btn-outline-danger ms-auto js-remove-admin"
                        data-bs-toggle="modal"
                        data-bs-target="#removeAdminModal"
                        type="button"
                        data-name-and-uid="${row.user.name} (${row.user.uid})"
                        data-institution-administrator-id="${row.institution_administrator.id}"
                      >
                        حذف
                      </button>
                    </li>
                  `,
                )}
              </ul>
            `
      }
    </div>
  `;
}

function AddAdminsModal({ uidsLimit, csrfToken }: { uidsLimit: number; csrfToken: string }) {
  return Modal({
    id: 'addAdminsModal',
    title: 'افزودن مدیران',
    body: html`
      <div class="mb-3">
        <label class="form-label" for="addAdminsModalUid"> شناسه‌های کاربری (UID) </label>
        <textarea
          name="uids"
          class="form-control"
          id="addAdminsModalUid"
          aria-describedby="addAdminsModalUidHelp"
          placeholder="user1@example.com, user2@example.com"
          style="height: 10vh;"
          required
        ></textarea>
        <small class="form-text text-muted" id="addAdminsModalUidHelp">
          حداکثر ${uidsLimit} شناسه کاربری (UID) را با کاما، نقطه‌ویرگول یا فاصله جدا کرده و وارد کنید.
        </small>
      </div>

      <div class="alert alert-warning mb-0" role="alert">
        مدیران موسسه دسترسی کامل خواندن و نوشتن به تمام محتوای این موسسه خواهند داشت و همچنین می‌توانند مدیران دیگر را اضافه یا حذف کنند.
      </div>
    `,
    footer: html`
      <input type="hidden" name="__action" value="addAdmins" />
      <input type="hidden" name="__csrf_token" value="${csrfToken}" />
      <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">بستن</button>
      <button type="submit" class="btn btn-primary">افزودن مدیران</button>
    `,
  });
}

function RemoveAdminModal({ csrfToken }: { csrfToken: string }) {
  return Modal({
    id: 'removeAdminModal',
    title: 'حذف مدیر',
    body: html`
      <p>
        آیا از حذف
        <strong><span class="js-name-and-uid"></span></strong>
        به عنوان مدیر این موسسه اطمینان دارید؟ این کار تاثیری بر سایر نقش‌های او نخواهد داشت.
      </p>
    `,
    footer: html`
      <input type="hidden" name="__action" value="removeAdmin" />
      <input type="hidden" name="__csrf_token" value="${csrfToken}" />
      <input
        type="hidden"
        name="unsafe_institution_administrator_id"
        class="js-institution-administrator-id"
      />
      <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">انصراف</button>
      <button type="submit" class="btn btn-danger">حذف مدیر</button>
    `,
  });
}
