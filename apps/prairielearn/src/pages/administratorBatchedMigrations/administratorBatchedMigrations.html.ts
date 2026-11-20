import { formatDate } from '@prairielearn/formatter';
import { html } from '@prairielearn/html';
import type {
  BatchedMigrationJobRow,
  BatchedMigrationRow,
  BatchedMigrationStatus,
} from '@prairielearn/migrations';

import { PageLayout } from '../../components/PageLayout.js';
import { uiStrings } from '../../lib/branding.js';
import type { ResLocalsForPage } from '../../lib/res-locals.js';

export function AdministratorBatchedMigrations({
  batchedMigrations,
  resLocals,
}: {
  batchedMigrations: BatchedMigrationRow[];
  resLocals: ResLocalsForPage<'plain'>;
}) {
  const hasBatchedMigrations = batchedMigrations.length > 0;

  return PageLayout({
    resLocals,
    pageTitle: uiStrings.batchedMigrations.pageTitle,
    navContext: {
      type: 'administrator',
      page: 'admin',
      subPage: 'batchedMigrations',
    },
    content: html`
      <div class="card" style="font-family: var(--font-persian);">
        <div class="card-header bg-primary text-white d-flex align-items-center">
          <h1 class="h4 mb-0">${uiStrings.batchedMigrations.cardTitle}</h1>
        </div>
        ${
          hasBatchedMigrations
            ? html`
                <div class="table-responsive">
                  <table class="table">
                    <thead>
                      <tr>
                        <th>${uiStrings.batchedMigrations.filename}</th>
                        <th>${uiStrings.batchedMigrations.status}</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${batchedMigrations.map((migration) => {
                        return html`
                          <tr>
                            <td>
                              <a
                                href="${resLocals.urlPrefix}/administrator/batchedMigrations/${migration.id}"
                                class="font-monospace"
                              >
                                ${migration.filename}
                              </a>
                            </td>
                            <td>${MigrationStatusBadge(migration.status)}</td>
                          </tr>
                        `;
                      })}
                    </tbody>
                  </table>
                </div>
              `
            : html`<div class="card-body text-center text-secondary">${uiStrings.batchedMigrations.emptyText}</div>`
        }
      </div>
    `,
  });
}

export function AdministratorBatchedMigration({
  batchedMigration,
  recentSucceededJobs,
  recentFailedJobs,
  resLocals,
}: {
  batchedMigration: BatchedMigrationRow;
  recentSucceededJobs: BatchedMigrationJobRow[];
  recentFailedJobs: BatchedMigrationJobRow[];
  resLocals: ResLocalsForPage<'plain'>;
}) {
  return PageLayout({
    resLocals,
    pageTitle: uiStrings.batchedMigrations.pageTitle,
    navContext: {
      type: 'plain',
      page: 'admin',
      subPage: 'batchedMigrations',
    },
    content: html`
      <div class="card mb-4" style="font-family: var(--font-persian);">
        <div class="card-header bg-primary text-white">
          <h1 class="h4 mb-0">${uiStrings.batchedMigrations.detailsTitle}</h1>
        </div>
        <div class="table-responsive">
          <table class="table table-sm two-column-description" aria-label="${uiStrings.batchedMigrations.detailsTitle}">
            <tbody>
              <tr>
                <th class="w-25">${uiStrings.batchedMigrations.filename}</th>
                <td><span class="font-monospace">${batchedMigration.filename}</span></td>
              </tr>
              <tr>
                <th>${uiStrings.batchedMigrations.minValue}</th>
                <td>${batchedMigration.min_value}</td>
              </tr>
              <tr>
                <th>${uiStrings.batchedMigrations.maxValue}</th>
                <td>${batchedMigration.max_value}</td>
              </tr>
              <tr>
                <th>${uiStrings.batchedMigrations.status}</th>
                <td>${MigrationStatusBadge(batchedMigration.status)}</td>
              </tr>
              <tr>
                <th>${uiStrings.batchedMigrations.createdAt}</th>
                <td dir="ltr" class="text-end">${formatDate(batchedMigration.created_at, 'Asia/Tehran')}</td>
              </tr>
              <tr>
                <th>${uiStrings.batchedMigrations.updatedAt}</th>
                <td dir="ltr" class="text-end">${formatDate(batchedMigration.updated_at, 'Asia/Tehran')}</td>
              </tr>
              <tr>
                <th>${uiStrings.batchedMigrations.startedAt}</th>
                <td dir="ltr" class="text-end">${batchedMigration.started_at ? formatDate(batchedMigration.started_at, 'Asia/Tehran') : '—'}</td>
              </tr>
              <tr>
                <th>${uiStrings.batchedMigrations.actions}</th>
                <td>
                  <form method="POST">
                    <input type="hidden" name="__csrf_token" value="${resLocals.__csrf_token}" />
                    <button
                      type="submit"
                      name="__action"
                      value="retry_failed_jobs"
                      class="btn btn-primary btn-sm"
                    >
                      ${uiStrings.batchedMigrations.retryFailedJobs}
                    </button>
                  </form>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      ${MigrationJobsCard({
        title: uiStrings.batchedMigrations.recentSucceededJobs,
        jobs: recentSucceededJobs,
        emptyText: uiStrings.batchedMigrations.noRecentSucceededJobs,
      })}
      ${MigrationJobsCard({
        title: uiStrings.batchedMigrations.recentFailedJobs,
        jobs: recentFailedJobs,
        emptyText: uiStrings.batchedMigrations.noRecentFailedJobs,
      })}
    `,
  });
}

function MigrationStatusBadge(status: BatchedMigrationStatus) {
  switch (status) {
    case 'pending':
      return html`<span class="badge text-bg-secondary">${uiStrings.batchedMigrations.statusPending}</span>`;
    case 'paused':
      return html`<span class="badge text-bg-secondary">${uiStrings.batchedMigrations.statusPaused}</span>`;
    case 'running':
      return html`<span class="badge text-bg-primary">${uiStrings.batchedMigrations.statusRunning}</span>`;
    case 'finalizing':
      return html`<span class="badge text-bg-primary">${uiStrings.batchedMigrations.statusFinalizing}</span>`;
    case 'failed':
      return html`<span class="badge text-bg-danger">${uiStrings.batchedMigrations.statusFailed}</span>`;
    case 'succeeded':
      return html`<span class="badge text-bg-success">${uiStrings.batchedMigrations.statusSucceeded}</span>`;
    default:
      return html`<span class="badge text-bg-warning">نامشخص (${status})</span>`;
  }
}

function MigrationJobsCard({
  title,
  jobs,
  emptyText,
}: {
  title: string;
  jobs: BatchedMigrationJobRow[];
  emptyText: string;
}) {
  return html`
    <div class="card mb-4" style="font-family: var(--font-persian);">
      <div class="card-header bg-primary text-white d-flex align-items-center">
        <span class="me-auto">${title}</span>
      </div>
      ${
        jobs.length > 0
          ? html`<div class="list-group list-group-flush">
              ${jobs.map((job) => {
                let duration: number | null = null;
                if (job.started_at && job.finished_at) {
                  duration = job.finished_at.getTime() - job.started_at.getTime();
                }
                const summary = `${job.min_value} - ${job.max_value}`;
                const hasData = job.data != null;
                return html`
                  <div class="list-group-item d-flex flex-column">
                    ${
                      hasData
                        ? html`
                            <details>
                              <summary>${summary}</summary>

                              <pre
                                class="mt-3 p-3 rounded bg-dark text-white"
                                dir="ltr"
                              ><code>${JSON.stringify(job.data, null, 2)}</code></pre>
                            </details>
                          `
                        : html`<div>${summary}</div>`
                    }
                    ${
                      job.started_at
                        ? html`
                            <span
                              class="text-muted text-small"
                              style="font-variant-numeric: tabular-nums;"
                            >
                              شناسه #${job.id} &mdash; اجرا شده در <span dir="ltr">${formatDate(job.started_at, 'Asia/Tehran')}</span> به مدت ${duration} میلی‌ثانیه
                              &mdash; ${job.attempts} تلاش
                            </span>
                          `
                        : null
                    }
                  </div>
                `;
              })}
            </div>`
          : html`<div class="card-body text-center text-secondary">${emptyText}</div>`
      }
    </div>
  `;
}

