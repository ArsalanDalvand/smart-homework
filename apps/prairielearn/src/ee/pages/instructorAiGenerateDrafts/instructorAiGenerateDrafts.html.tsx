import { z } from 'zod';

import { compiledScriptTag, compiledStylesheetTag } from '@prairielearn/compiled-assets';
import { formatDate } from '@prairielearn/formatter';
import { html } from '@prairielearn/html';
import { hydrateHtml } from '@prairielearn/react/server';
import { IdSchema } from '@prairielearn/zod';

import { Modal } from '../../../components/Modal.js';
import { PageLayout } from '../../../components/PageLayout.js';
import { nodeModulesAssetPath } from '../../../lib/assets.js';
import { getAiQuestionGenerationDraftsUrl } from '../../../lib/client/url.js';
import { DraftQuestionMetadataSchema } from '../../../lib/db-types.js';
import type { UntypedResLocals } from '../../../lib/res-locals.types.js';

import { SampleQuestions } from './SampleQuestions.js';
import {
  examplePromptsArray,
  generateSampleQuestionVariant,
} from './aiGeneratedQuestionSamples.js';

// We show all draft questions, even those without associated metadata, because we
// won't have metadata for a draft question if it was created on and synced from
// another instance of PrairieLearn, including from local dev.
export const DraftMetadataWithQidSchema = z.object({
  draft_question_metadata: DraftQuestionMetadataSchema.nullable(),
  question_id: IdSchema,
  qid: z.string(),
  uid: z.string().nullable(),
});
type DraftMetadataWithQid = z.infer<typeof DraftMetadataWithQidSchema>;

export function InstructorAIGenerateDrafts({
  resLocals,
  drafts,
}: {
  resLocals: UntypedResLocals;
  drafts: DraftMetadataWithQid[];
}) {
  const hasDrafts = drafts.length > 0;

  return PageLayout({
    resLocals,
    pageTitle: resLocals.pageTitle,
    headContent: html`
      <meta
        name="mathjax-fonts-path"
        content="${nodeModulesAssetPath('@mathjax/mathjax-newcm-font')}"
      />
      ${compiledStylesheetTag('instructorAiGenerateDrafts.css')}
      ${compiledScriptTag('mathjaxSetup.ts')}
      <script defer src="${nodeModulesAssetPath('mathjax/tex-svg.js')}"></script>
      <style>
        .reveal-fade {
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          height: 6rem;
          background: linear-gradient(to bottom, transparent, var(--bs-light));
          pointer-events: none;
        }
      </style>
    `,
    options: {
      hxExt: 'loading-states',
    },
    navContext: {
      type: 'instructor',
      page: 'course_admin',
      subPage: 'questions',
    },
    content: html`
      <div class="mb-3">
        <a href="${resLocals.urlPrefix}/course_admin/questions" class="btn btn-sm btn-primary">
          <i class="fa fa-arrow-left" aria-hidden="true"></i>
          بازگشت به همه سوالات
        </a>
      </div>
      <div class="card mb-3 mx-auto" style="max-width: 700px">
        <div class="card-body position-relative">
          <h1 class="h3 text-center">تولید سوال جدید با هوش مصنوعی</h1>
          <form
            id="add-question-form"
            name="add-question-form"
            hx-post="${getAiQuestionGenerationDraftsUrl({ urlPrefix: resLocals.urlPrefix })}"
            hx-target="#generation-results"
            hx-swap="outerHTML"
            hx-disabled-elt="button"
          >
            <input type="hidden" name="__csrf_token" value="${resLocals.__csrf_token}" />
            <input type="hidden" name="__action" value="generate_question" />

            <div class="mb-3">
              <label class="form-label" for="user-prompt-llm">
                توضیح کلی سوال را بنویسید، از جمله اینکه چه پارامترهایی باید تولید شوند و دانشجویان چگونه باید پاسخ خود را وارد کنند.
              </label>
              <textarea
                name="prompt"
                id="user-prompt-llm"
                class="form-control js-textarea-autosize"
                style="resize: none;"
              ></textarea>
            </div>
            <button type="submit" class="btn btn-primary w-100">
              <span
                class="spinner-grow spinner-grow-sm d-none me-1"
                role="status"
                aria-hidden="true"
                data-loading-class-remove="d-none"
              >
              </span>
              ایجاد سوال
            </button>

            <div class="text-muted small text-center mt-2">
              هوش مصنوعی ممکن است اشتباه کند. سوال تولیدشده را بازبینی کنید.
            </div>
            <div id="generation-results"></div>
          </form>
        </div>
      </div>
      <div class="mb-5 mx-auto" style="max-width: 700px">
        ${hydrateHtml(
          <SampleQuestions
            // Since variants are randomly generated, we need to generate the initial one
            // on the server to ensure that we don't get a hydration mismatch.
            initialVariant={generateSampleQuestionVariant(examplePromptsArray[0].id)}
          />,
        )}
      </div>
      ${
        hasDrafts
          ? html`
              <div class="d-flex flex-row align-items-center justify-content-between mb-2">
                <h1 class="h5 mb-0">ادامه کار روی یک سوال پیش‌نویس</h1>
                <button
                  class="btn btn-sm btn-outline-danger ms-2"
                  data-bs-toggle="modal"
                  data-bs-target="#deleteModal"
                >
                  <i class="fa fa-trash" aria-hidden="true"></i>
                  <span class="d-none d-sm-inline">حذف همه پیش‌نویس‌ها</span>
                </button>
              </div>
              <div class="card">
                <div class="table-responsive">
                  <table
                    class="table table-sm table-hover"
                    aria-label="فهرست سوالات تولیدشده با هوش مصنوعی"
                  >
                    <thead>
                      <tr>
                        <th>شناسه سوال (QID)</th>
                        <th>تاریخ ایجاد</th>
                        <th>ایجادکننده</th>
                        <th>عملیات</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${drafts.map(
                        (row) => html`
                          <tr>
                            <td>${row.qid}</td>
                            <td>
                              ${
                                row.draft_question_metadata?.created_at == null
                                  ? html`&mdash;`
                                  : formatDate(
                                      row.draft_question_metadata.created_at,
                                      resLocals.course.display_timezone,
                                    )
                              }
                            </td>
                            <td>${row.uid ?? '(سیستم)'}</td>
                            <td>
                              <a
                                href="${resLocals.urlPrefix}/ai_generate_editor/${row.question_id}"
                                class="btn btn-xs btn-primary"
                              >
                                ادامه ویرایش
                              </a>
                            </td>
                          </tr>
                        `,
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            `
          : ''
      }
      ${DeleteQuestionsModal({ csrfToken: resLocals.__csrf_token })}
    `,
  });
}

export function RateLimitExceeded(): string {
  return html`
    <div id="generation-results">
      <div class="alert alert-danger mt-2 mb-0">
        به سقف مصرف ساعتی تولید سوال با هوش مصنوعی رسیده‌اید. لطفاً بعداً دوباره تلاش کنید.
      </div>
    </div>
  `.toString();
}

function DeleteQuestionsModal({ csrfToken }: { csrfToken: string }) {
  return Modal({
    id: 'deleteModal',
    title: 'حذف همه سوالات پیش‌نویس',
    body: 'آیا از حذف دائمی همه سوالات پیش‌نویس اطمینان دارید؟',
    footer: html`
      <input type="hidden" name="__csrf_token" value="${csrfToken}" />
      <button type="submit" class="btn btn-danger" name="__action" value="delete_drafts">
        <i class="fa fa-trash" aria-hidden="true"></i>
        حذف همه پیش‌نویس‌ها
      </button>
      <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">بستن</button>
    `,
  });
}
