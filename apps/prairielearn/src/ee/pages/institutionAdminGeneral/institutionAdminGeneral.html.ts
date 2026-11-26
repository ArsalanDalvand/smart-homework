import { html } from '@prairielearn/html';

import { PageLayout } from '../../../components/PageLayout.js';
import { type Institution } from '../../../lib/db-types.js';
import type { ResLocalsForPage } from '../../../lib/res-locals.js';
import { CourseRequestMessageSection } from '../../components/courseRequestMessage/CourseRequestMessageSection.js';

export function InstitutionAdminGeneral({
  institution,
  courseRequestMessage,
  courseRequestMessageHtml,
  resLocals,
}: {
  institution: Institution;
  courseRequestMessage: string | null;
  courseRequestMessageHtml: string;
  resLocals: ResLocalsForPage<'plain'>;
}) {
  return PageLayout({
    resLocals: {
      ...resLocals,
      institution,
    },
    pageTitle: `عمومی — ${institution.short_name}`,
    navContext: {
      type: 'institution',
      page: 'institution_admin',
      subPage: 'general',
    },
    content: html`
      ${CourseRequestMessageSection({
        csrfToken: resLocals.__csrf_token,
        description: html`
          این پیام به کاربران موسسه شما در
          <a href="/pl/request_course">صفحه درخواست درس</a> نمایش داده می‌شود. از آن برای اشتراک‌گذاری اطلاعات مخصوص موسسه مانند مجوزها، هزینه‌ها، منابع آموزشی یا راه‌های ارتباطی استفاده کنید. قالب‌بندی Markdown پشتیبانی می‌شود؛ تگ‌های HTML رندر نمی‌شوند.
        `,
        courseRequestMessage,
        courseRequestMessageHtml,
      })}
    `,
  });
}
