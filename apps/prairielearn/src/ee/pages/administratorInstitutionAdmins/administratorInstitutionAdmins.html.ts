import { html } from '@prairielearn/html';

import { PageLayout } from '../../../components/PageLayout.js';
import { type Institution } from '../../../lib/db-types.js';
import type { ResLocalsForPage } from '../../../lib/res-locals.js';

export function AdministratorInstitutionAdmins({
  institution,
  resLocals,
}: {
  institution: Institution;
  resLocals: ResLocalsForPage<'plain'>;
}) {
  return PageLayout({
    resLocals: {
      ...resLocals,
      institution,
    },
    pageTitle: 'مدیران - مدیریت موسسه',
    navContext: {
      type: 'administrator_institution',
      page: 'administrator_institution',
      subPage: 'admins',
    },
    content: html`
      <p>
        مدیران موسسه را می‌توانید از
        <a href="/pl/institution/${institution.id}/admin/admins">اینجا</a>
        مدیریت کنید.
      </p>
    `,
  });
}
