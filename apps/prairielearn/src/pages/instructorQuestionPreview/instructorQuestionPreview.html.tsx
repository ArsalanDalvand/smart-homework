import assert from 'node:assert';

import { compiledStylesheetTag } from '@prairielearn/compiled-assets';
import { html, unsafeHtml } from '@prairielearn/html';
import { renderHtml } from '@prairielearn/react';

import { CalculatorDrawerHeadScripts } from '../../components/CalculatorAssets.js';
import { CalculatorDrawer, CalculatorDrawerToggle } from '../../components/CalculatorDrawer.js';
import { InstructorInfoPanel } from '../../components/InstructorInfoPanel.js';
import { PageLayout } from '../../components/PageLayout.js';
import { QuestionContainer } from '../../components/QuestionContainer.js';
import { SyncErrorsAndWarnings } from '../../components/SyncErrorsAndWarnings.js';
import { assetPath, compiledScriptTag, nodeModulesAssetPath } from '../../lib/assets.js';
import { type CopyTarget } from '../../lib/copy-content.js';
import type { ResLocalsQuestionRender } from '../../lib/question-render.types.js';
import type { ResLocalsForPage } from '../../lib/res-locals.js';

export function InstructorQuestionPreview({
  normalPreviewUrl,
  questionRenderContext,
  manualGradingPreviewUrl,
  aiGradingPreviewUrl,
  renderSubmissionSearchParams,
  readmeHtml,
  questionCopyTargets,
  resLocals,
  independentScrolling,
}: {
  independentScrolling: boolean;
  normalPreviewUrl: string;
  questionRenderContext: 'manual_grading' | 'ai_grading' | undefined;
  manualGradingPreviewUrl: string;
  aiGradingPreviewUrl?: string;
  renderSubmissionSearchParams: URLSearchParams;
  readmeHtml: string;
  questionCopyTargets: CopyTarget[] | null;
  resLocals: ResLocalsForPage<'instructor-question'> & ResLocalsQuestionRender;
}) {
  assert(resLocals.question.qid !== null);

  const previewAlerts = html`
    ${
      questionRenderContext === 'manual_grading'
        ? html`
            <div class="alert alert-primary">
              شما در حال مشاهده این سوال در قالب محیط تصحیح دستی هستید.
              <a href="${normalPreviewUrl}" class="alert-link">بازگشت به نمای عادی</a> پس از اتمام بررسی.
            </div>
          `
        : ''
    }
    ${
      questionRenderContext === 'ai_grading'
        ? html`
            <div class="alert alert-primary">
              شما در حال مشاهده این سوال در قالب تصحیح‌کننده هوش مصنوعی هستید.
              <a href="${normalPreviewUrl}" class="alert-link">بازگشت به نمای عادی</a> پس از اتمام بررسی.
            </div>
          `
        : ''
    }
  `;

  return PageLayout({
    resLocals,
    pageTitle: 'پیش‌نمایش سوال',
    navContext: {
      type: 'instructor',
      page: 'question',
      subPage: 'preview',
    },
    options: {
      contentContainerClassName: independentScrolling ? 'question-page-layout' : '',
      // Render sync messages inside the question pane to preserve the sidebar's full height.
      showSyncErrorsAndWarnings: !independentScrolling,
      pageNote: resLocals.question.qid,
    },
    headContent: html`
      ${independentScrolling ? compiledStylesheetTag('questionLayout.css') : ''}
      <meta
        name="mathjax-fonts-path"
        content="${nodeModulesAssetPath('@mathjax/mathjax-newcm-font')}"
      />
      ${compiledScriptTag('question.ts')} ${CalculatorDrawerHeadScripts()}
      <script defer src="${nodeModulesAssetPath('mathjax/tex-svg.js')}"></script>
      <script>
        document.urlPrefix = '${resLocals.urlPrefix}';
      </script>
      ${
        resLocals.question.type !== 'Freeform'
          ? html`
              <script src="${nodeModulesAssetPath('lodash/lodash.min.js')}"></script>
              <script src="${assetPath('javascripts/require.js')}"></script>
              <script src="${assetPath('localscripts/question.js')}"></script>
              <script src="${assetPath('localscripts/questionCalculation.js')}"></script>
            `
          : ''
      }
      ${unsafeHtml(resLocals.extraHeadersHtml)}
      <style>
        .markdown-body :last-child {
          margin-bottom: 0;
        }

        .reveal-fade {
          position: absolute;
          bottom: 0;
          left: 0;
          width: 100%;
          height: 6rem;
          background: linear-gradient(to bottom, transparent, var(--bs-light));
          pointer-events: none;
        }

        .max-height {
          max-height: 150px;
        }
      </style>
    `,
    postContent: CalculatorDrawer({
      storageKey: `calculator-preview-${resLocals.question.id}`,
    }),
    content: html`
      ${independentScrolling ? '' : previewAlerts}
      <div class="row question-page-row">
        <div
          class="col-lg-9 col-sm-12 question-page-question"
          ${independentScrolling ? html`role="region" aria-label="Question" tabindex="0"` : ''}
        >
          ${
            independentScrolling
              ? html`
                  ${renderHtml(
                    <SyncErrorsAndWarnings
                      authzData={resLocals.authz_data}
                      exampleCourse={resLocals.course.example_course}
                      syncErrors={resLocals.question.sync_errors}
                      syncWarnings={resLocals.question.sync_warnings}
                      fileEditUrl={`${resLocals.urlPrefix}/question/${resLocals.question.id}/file_edit/questions/${resLocals.question.qid}/info.json`}
                      context="question"
                    />,
                  )}
                  ${previewAlerts}
                `
              : ''
          }
          ${
            readmeHtml
              ? html`
                  <div class="card mb-3 js-readme-card overflow-hidden">
                    <div class="card-header d-flex align-items-center collapsible-card-header">
                      <h2 class="me-auto h5 mb-0">
                        راهنما و توضیحات سوال <span class="small text-muted">(مخصوص مدرسان، برای فراگیران مخفی است)</span>
                      </h2>
                      <button
                        type="button"
                        class="expand-icon-container btn btn-outline-dark btn-sm text-nowrap"
                        data-bs-toggle="collapse"
                        data-bs-target="#readme-card-body"
                        aria-expanded="true"
                        aria-controls="#readme-card-body"
                      >
                        <i class="fa fa-angle-up ms-1 expand-icon"></i>
                      </button>
                    </div>
                    <div class="show js-collapsible-card-body" id="readme-card-body">
                      <div
                        class="card-body position-relative markdown-body overflow-hidden max-height"
                      >
                        ${unsafeHtml(readmeHtml)}
                      </div>
                      <div class="reveal-fade d-none"></div>
                      <div
                        class="py-1 z-1 position-relative d-none justify-content-center bg-light js-expand-button-container"
                      >
                        <button type="button" class="btn btn-sm btn-link">نمایش بیشتر</button>
                      </div>
                    </div>
                  </div>
                `
              : ''
          }
          ${QuestionContainer({
            resLocals,
            showFooter: questionRenderContext != null ? false : undefined,
            questionContext: 'instructor',
            questionRenderContext,
            manualGradingPreviewUrl:
              questionRenderContext === 'manual_grading' ? undefined : manualGradingPreviewUrl,
            aiGradingPreviewUrl:
              questionRenderContext === 'ai_grading' ? undefined : aiGradingPreviewUrl,
            renderSubmissionSearchParams,
            questionCopyTargets,
          })}
        </div>

        <div
          class="col-lg-3 col-sm-12 question-page-sidebar"
          ${independentScrolling ? html`role="region" aria-label="Question information" tabindex="0"` : ''}
        >
          <div class="card mb-3">
            <div class="card-header bg-secondary text-white">
              <h2 class="h6 mb-0">موقعیت نمایش اطلاعات دانشجو</h2>
            </div>
            <div class="card-body">
              <div class="d-flex justify-content-center text-center small text-muted">
                در صفحه آزمون فراگیر، این بخش برای نمایش زمان، وضعیت آزمون و نمره به کار می‌رود.
              </div>
            </div>
          </div>
          ${CalculatorDrawerToggle({ showInfoPopover: true })}
          ${InstructorInfoPanel({
            course: resLocals.course,
            course_instance: resLocals.course_instance,
            question: resLocals.question,
            variant: resLocals.variant,
            authz_data: resLocals.authz_data,
            question_is_shared: resLocals.question_is_shared,
            questionContext: 'instructor',
            csrfToken: resLocals.__csrf_token,
          })}
        </div>
      </div>
    `,
  });
}
