import { formatDate } from '@prairielearn/formatter';
import { html } from '@prairielearn/html';

import { PageLayout } from '../../components/PageLayout.js';
import type { WorkspaceLog } from '../../lib/db-types.js';
import type { UntypedResLocals } from '../../lib/res-locals.types.js';

export function WorkspaceLogs({
  workspaceLogs,
  resLocals,
}: {
  workspaceLogs: WorkspaceLog[];
  resLocals: UntypedResLocals;
}) {
  // Get the list of unique versions and the date at which they were created.
  // These are ordered by date, so we can use the date of the first log for
  // each version as the version's creation date.
  const knownVersions = new Set();
  const uniqueVersions: { version: string; date: Date }[] = [];
  workspaceLogs.forEach((log) => {
    if (!knownVersions.has(log.version)) {
      knownVersions.add(log.version);
      uniqueVersions.push({ version: log.version, date: log.date! });
    }
  });
  const timezone = resLocals.course_instance?.display_timezone ?? resLocals.course.display_timezone;

  return PageLayout({
    resLocals,
    pageTitle: 'گزارش‌های محیط کاری ابری',
    navContext: {
      page: 'workspace',
      type: 'plain',
    },
    content: html`
      <h1 class="mb-4">گزارش‌های محیط کاری ابری</h1>
      <h2>نسخه‌ها</h2>
      <div class="table-responsive">
        <table class="table table-sm" aria-label="نسخه‌های محیط کاری ابری">
          <thead>
            <tr>
              <th>نسخه</th>
              <th>تاریخ ایجاد</th>
              <th>عملیات</th>
            </tr>
          </thead>
          <tbody>
            ${uniqueVersions.map((version) => {
              const logsUrl = `${resLocals.urlPrefix}/workspace/${resLocals.workspace_id}/logs/version/${version.version}`;
              return html`
                <tr>
                  <td>${version.version}</td>
                  <td>${formatDate(version.date, timezone)}</td>
                  <td>
                    <a href="${logsUrl}"> مشاهده گزارش‌های جزئی </a>
                  </td>
                </tr>
              `;
            })}
          </tbody>
        </table>
      </div>

      <h2>تاریخچه</h2>
      ${WorkspaceLogsTable({ workspaceLogs, timezone })}
    `,
  });
}

export function WorkspaceVersionLogs({
  workspaceLogs,
  containerLogs,
  containerLogsEnabled,
  containerLogsExpired,
  resLocals,
}: {
  workspaceLogs: WorkspaceLog[];
  containerLogs: string | null;
  containerLogsEnabled: boolean;
  containerLogsExpired: boolean;
  resLocals: UntypedResLocals;
}) {
  return PageLayout({
    resLocals,
    pageTitle: 'گزارش‌های نسخه محیط کاری ابری',
    navContext: {
      page: 'workspace',
      type: 'plain',
    },
    content: html`
      <h1 class="mb-4">گزارش‌های نسخه محیط کاری ابری</h1>

      <h2>گزارش‌های کانتینر</h2>
      ${
        containerLogs !== null && containerLogsEnabled && !containerLogsExpired
          ? html`
              <pre class="bg-dark rounded text-white p-3 mb-3"><code>${containerLogs}</code></pre>
            `
          : html`
              <div class="bg-dark py-5 px-2 mb-3 rounded text-white text-center font-monospace">
                <div class="mb-2">
                  <i
                    class="fa ${
                      containerLogsEnabled && containerLogsExpired ? 'fa-calendar' : 'fa-ban'
                    } fa-2xl"
                    aria-hidden="true"
                  ></i>
                </div>
                <div>
                  ${
                    containerLogsEnabled
                      ? 'گزارش‌های کانتینر این محیط کاری ابری منقضی شده و دیگر در دسترس نیستند.'
                      : 'گزارش‌های کانتینر برای این محیط کاری ابری در دسترس نیستند.'
                  }
                </div>
              </div>
            `
      }

      <h2>تاریخچه</h2>
      ${WorkspaceLogsTable({
        workspaceLogs,
        includeVersion: false,
        timezone: resLocals.course_instance?.display_timezone ?? resLocals.course.display_timezone,
      })}
    `,
  });
}

function WorkspaceLogsTable({
  workspaceLogs,
  includeVersion = true,
  timezone,
}: {
  workspaceLogs: WorkspaceLog[];
  includeVersion?: boolean;
  timezone: string;
}) {
  return html`
    <div class="table-responsive">
      <table class="table table-sm" aria-label="گزارش‌های محیط کاری ابری">
        <thead>
          <tr>
            <th>تاریخ</th>
            <th>پیام</th>
            <th>وضعیت</th>
            ${includeVersion ? html`<th>نسخه</th>` : ''}
          </tr>
        </thead>

        <tbody>
          ${workspaceLogs.map((log) => {
            return html`
              <tr>
                <td>${formatDate(log.date!, timezone)}</td>
                <td>${log.message}</td>
                <td>${log.state}</td>
                ${includeVersion ? html`<td>${log.version}</td>` : ''}
              </tr>
            `;
          })}
        </tbody>
      </table>
    </div>
  `;
}
