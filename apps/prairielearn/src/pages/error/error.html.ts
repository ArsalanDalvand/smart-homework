import { isEmpty } from 'es-toolkit/compat';
import jsonStringifySafe from 'json-stringify-safe';
import { z } from 'zod';

import { formatErrorStack } from '@prairielearn/error';
import { html, unsafeHtml } from '@prairielearn/html';
import { formatQueryWithErrorPosition } from '@prairielearn/postgres';

import { PageLayout } from '../../components/PageLayout.js';
import type { UntypedResLocals } from '../../lib/res-locals.types.js';

function formatJson(value: any): string {
  return jsonStringifySafe(value, null, '    ');
}

export function ErrorPage({
  error,
  errorInfo,
  errorId,
  referrer,
  resLocals,
}: {
  error: {
    message?: string;
    stack?: string;
    status?: number;
    data?: Record<string, any>;
  };
  errorInfo?: string;
  errorId: string;
  referrer: string | null;
  resLocals: UntypedResLocals;
}) {
  const {
    outputStderr,
    outputStdout,
    sql: sqlQuery,
    sqlParams,
    sqlError,
    ...restData
  } = error.data ?? {};

  const formattedSqlQuery = formatQueryWithErrorPosition(sqlQuery, sqlError?.position);
  const isZodError = error instanceof z.ZodError;
  const errorHeading = isZodError ? 'Validation error' : error.message;
  const zodErrorDetails = isZodError ? z.prettifyError(error) : undefined;

  return PageLayout({
    resLocals,
    pageTitle: `خطا ${error.status}`,
    navContext: {
      type: resLocals.navbarType,
      page: 'error',
    },
    content: html`
      <div class="card mb-4" style="font-family: var(--font-persian);">
        <div class="card-header bg-danger text-white">
          <h1 class="h4 mb-0">خطا در پردازش درخواست</h1>
        </div>

        <div class="card-body">
          <h2 class="mb-3 h5 text-danger">${errorHeading}</h2>
          ${
            isZodError
              ? html` <pre class="bg-light border rounded p-2" dir="ltr">${zodErrorDetails}</pre> `
              : ''
          }
          ${unsafeHtml(errorInfo ?? '')}

          <p><strong>شناسه پیگیری خطا:</strong> <code dir="ltr">${errorId}</code></p>

          <p><strong>کد وضعیت:</strong> ${error.status}</p>

          <div class="d-flex flex-wrap gap-2 mb-4">
            <a href="${referrer}" class="btn btn-primary" ${!referrer ? 'disabled' : ''}>
              <i class="fa fa-arrow-right me-1" aria-hidden="true"></i>
              بازگشت به صفحه قبلی
            </a>
            <a href="/pl" class="btn btn-outline-primary">
              <i class="fa fa-home me-1" aria-hidden="true"></i>
              صفحه اصلی سامانه
            </a>
          </div>

          ${
            outputStderr
              ? html`
                  <p><strong>خروجی استاندارد خطا (stderr):</strong></p>
                  <pre class="bg-dark text-white rounded p-2" dir="ltr">${outputStderr}</pre>
                `
              : ''
          }
          ${
            outputStdout
              ? html`
                  <p><strong>خروجی استاندارد (stdout):</strong></p>
                  <pre class="bg-dark text-white rounded p-2" dir="ltr">${outputStdout}</pre>
                `
              : ''
          }
          ${
            error.stack
              ? html`
                  <p class="mt-3"><strong>ردیابی پشته (Stack Trace):</strong></p>
                  <pre class="bg-dark text-white rounded p-2" dir="ltr">${formatErrorStack(error)}</pre>
                `
              : ''
          }
          ${
            formattedSqlQuery
              ? html`
                  <p><strong>پرس‌وجوی پایگاه‌داده (SQL Query):</strong></p>
                  <pre class="bg-dark text-white rounded p-2" dir="ltr">${formattedSqlQuery}</pre>
                `
              : ''
          }
          ${
            !isEmpty(sqlParams)
              ? html`
                  <p><strong>پارامترهای SQL:</strong></p>
                  <pre class="bg-dark text-white rounded p-2" dir="ltr">${formatJson(sqlParams)}</pre>
                `
              : ''
          }
          ${
            !isEmpty(sqlError)
              ? html`
                  <p><strong>جزئیات خطای پایگاه‌داده:</strong></p>
                  <pre class="bg-dark text-white rounded p-2" dir="ltr">${formatJson(sqlError)}</pre>
                `
              : ''
          }
          ${
            !isEmpty(restData)
              ? html`
                  <p><strong>سایر اطلاعات:</strong></p>
                  <pre class="bg-dark text-white rounded p-2" dir="ltr">${formatJson(restData)}</pre>
                `
              : ''
          }
        </div>
      </div>
    `,
  });
}
