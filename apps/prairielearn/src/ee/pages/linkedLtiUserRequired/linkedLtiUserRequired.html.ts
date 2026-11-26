import { html } from '@prairielearn/html';
import { run } from '@prairielearn/run';

import { PageLayout } from '../../../components/PageLayout.js';
import type { Lti13Instance } from '../../../lib/db-types.js';
import type { UntypedResLocals } from '../../../lib/res-locals.types.js';

export function LinkedLtiUserRequired({
  instancesWithMissingIdentities,
  resLocals,
}: {
  instancesWithMissingIdentities: { lti13_instance: Lti13Instance; lti13_user_id: string | null }[];
  resLocals: UntypedResLocals;
}) {
  return PageLayout({
    pageTitle: 'اتصال LTI یافت نشد',
    navContext: {
      type: 'student',
      page: undefined,
    },
    resLocals,
    content: html`
      <div class="card mb-4">
        <div class="card-header bg-warning">
          <h1>اتصال LTI یافت نشد</h1>
        </div>
        <div class="card-body">
          ${run(() => {
            if (instancesWithMissingIdentities.length === 1) {
              const instance = instancesWithMissingIdentities[0].lti13_instance;
              return html`
                <p>
                  برای ادامه، لطفاً از طریق <strong>${instance.name}</strong> وارد سامانه شوید.
                  این کار حساب کاربری شما در سامانه را به حساب ${instance.name} متصل می‌کند.
                </p>
              `;
            }

            return html`
              <p>
                برای ادامه و دسترسی به این درس، لطفاً از طریق تمام پلتفرم‌های زیر وارد سامانه شوید:
              </p>
              <ul>
                ${instancesWithMissingIdentities.map(
                  ({ lti13_instance }) => html`<li><strong>${lti13_instance.name}</strong></li>`,
                )}
              </ul>
              <p>
                این کار حساب کاربری شما در سامانه را به حساب‌هایتان در این پلتفرم‌ها متصل می‌کند.
              </p>
            `;
          })}

          <p class="mb-0">
            پس از تکمیل این مرحله، در آینده می‌توانید مستقیماً در سامانه به این درس دسترسی داشته باشید.
          </p>
        </div>
      </div>
    `,
  });
}
