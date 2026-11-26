import { EncodedData } from '@prairielearn/browser-utils';
import { compiledStylesheetTag } from '@prairielearn/compiled-assets';
import { html, unsafeHtml } from '@prairielearn/html';

import {
  RegenerateInstanceAlert,
  RegenerateInstanceModal,
} from '../../components/AssessmentRegenerate.js';
import { AssessmentScorePanel } from '../../components/AssessmentScorePanel.js';
import { CalculatorDrawerHeadScripts } from '../../components/CalculatorAssets.js';
import {
  CALCULATOR_PRESETS,
  CalculatorDrawer,
  CalculatorDrawerToggle,
} from '../../components/CalculatorDrawer.js';
import { InstructorInfoPanel } from '../../components/InstructorInfoPanel.js';
import { PageLayout } from '../../components/PageLayout.js';
import { PersonalNotesPanel } from '../../components/PersonalNotesPanel.js';
import { QuestionContainer, QuestionTitle } from '../../components/QuestionContainer.js';
import { QuestionNavSideGroup } from '../../components/QuestionNavigation.js';
import { QuestionScorePanel } from '../../components/QuestionScore.js';
import { assetPath, compiledScriptTag, nodeModulesAssetPath } from '../../lib/assets.js';
import { type CopyTarget } from '../../lib/copy-content.js';
import type { AssessmentTool, User } from '../../lib/db-types.js';
import { getRoleNamesForUser } from '../../lib/groups.shared.js';
import { toPersianDigits } from '../../lib/jalali.js';
import type { ResLocalsInstanceQuestionRender } from '../../lib/question-render.types.js';
import type { ResLocalsForPage } from '../../lib/res-locals.js';
import type { QuestionClassStat } from '../../lib/student-engagement.js';
import { CalculatorSettingsSchema } from '../../schemas/infoAssessment.js';

export interface StepperQuestionItem {
  instanceQuestionId: string;
  questionNumber: string;
  isCurrent: boolean;
  isSolved: boolean;
  isPartial: boolean;
  isLocked: boolean;
}

export interface QuestionDelightConfig {
  courseInstanceId: string;
  instanceQuestionId: string;
  submissionId: string | null;
  scorePerc: number | null;
  isOneShot: boolean;
  estimatedXp: number;
  nextQuestionUrl: string | null;
  unlockedAchievements: { id: string; title: string; description: string }[];
}

export function StudentInstanceQuestion({
  resLocals,
  independentScrolling,
  renderState,
  userCanDeleteAssessmentInstance,
  assignedGrader,
  lastGrader,
  questionCopyTargets,
  enabledTools = [],
  stepperQuestions = [],
  questionStat = null,
  delightConfig = null,
}: {
  independentScrolling: boolean;
  resLocals: ResLocalsForPage<'instance-question'>;
  renderState: ResLocalsInstanceQuestionRender | null;
  userCanDeleteAssessmentInstance: boolean;
  assignedGrader?: User | null;
  lastGrader?: User | null;
  questionCopyTargets?: CopyTarget[] | null;
  enabledTools?: AssessmentTool[];
  stepperQuestions?: StepperQuestionItem[];
  questionStat?: QuestionClassStat | null;
  delightConfig?: QuestionDelightConfig | null;
}) {
  const questionContext =
    resLocals.assessment.type === 'Exam' ? 'student_exam' : 'student_homework';
  // TODO: support more tools
  // oxlint-disable-next-line typescript/no-unnecessary-condition
  const calculator = enabledTools.find((t) => t.tool === 'calculator');
  const regenerateAlert = userCanDeleteAssessmentInstance ? RegenerateInstanceAlert() : '';

  return PageLayout({
    resLocals,
    pageTitle: '',
    navContext: {
      type: 'student',
      page: 'assessment_instance',
    },
    options: {
      contentContainerClassName: independentScrolling ? 'question-page-layout' : '',
    },
    headContent: html`
      ${independentScrolling ? compiledStylesheetTag('questionLayout.css') : ''}
      <link href="${assetPath('stylesheets/student-engagement.css')}" rel="stylesheet" />
      <script defer src="${assetPath('javascripts/student-ux.js')}"></script>
      ${
        delightConfig
          ? html`<script defer src="${assetPath('javascripts/student-delight.js')}"></script>`
          : ''
      }
      <meta
        name="mathjax-fonts-path"
        content="${nodeModulesAssetPath('@mathjax/mathjax-newcm-font')}"
      />
      ${compiledScriptTag('question.ts')} ${calculator ? CalculatorDrawerHeadScripts() : ''}
      ${
        resLocals.assessment.type === 'Exam'
          ? html`
              ${compiledScriptTag('examTimeLimitCountdown.ts')}
              ${EncodedData(
                {
                  serverRemainingMS: resLocals.assessment_instance_remaining_ms,
                  serverTimeLimitMS: resLocals.assessment_instance_time_limit_ms,
                  serverUpdateURL: `${resLocals.urlPrefix}/assessment_instance/${resLocals.assessment_instance.id}/time_remaining`,
                  canTriggerFinish: resLocals.authz_result.authorized_edit,
                  showsTimeoutWarning: true,
                  reloadOnFail: true,
                  csrfToken: resLocals.__csrf_token,
                },
                'time-limit-data',
              )}
            `
          : ''
      }
      <script defer src="${nodeModulesAssetPath('mathjax/tex-svg.js')}"></script>
      <script>
        document.urlPrefix = '${resLocals.urlPrefix}';
      </script>
      ${
        renderState?.variant == null
          ? ''
          : html`
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
              ${unsafeHtml(renderState.extraHeadersHtml)}
            `
      }
    `,
    preContent: html`
      ${
        userCanDeleteAssessmentInstance
          ? RegenerateInstanceModal({ csrfToken: resLocals.__csrf_token })
          : ''
      }
    `,
    postContent: calculator
      ? CalculatorDrawer({
          storageKey: `calculator-${resLocals.assessment.uuid}-${resLocals.assessment_instance.id}`,
          features:
            CALCULATOR_PRESETS[
              CalculatorSettingsSchema.parse(calculator.settings).type ?? 'advanced'
            ],
        })
      : '',
    content: html`
      ${independentScrolling ? '' : regenerateAlert}
      <div class="row question-page-row">
        <div
          class="col-lg-9 col-sm-12 question-page-question"
          ${independentScrolling ? html`role="region" aria-label="Question" tabindex="0"` : ''}
        >
          ${independentScrolling ? regenerateAlert : ''}
          ${
            stepperQuestions.length > 1
              ? html`
                  <nav class="sh-q-topbar mb-3" aria-label="ناوبری سوالات سری">
                    <div class="sh-q-topbar-pills">
                      ${stepperQuestions.map((item) => {
                        const stepClass = [
                          'sh-q-topbar-pill',
                          item.isCurrent ? 'is-current' : '',
                          item.isSolved ? 'is-solved' : '',
                          item.isPartial ? 'is-partial' : '',
                          item.isLocked ? 'is-locked' : '',
                        ]
                          .filter(Boolean)
                          .join(' ');
                        return item.isLocked
                          ? html`<span class="${stepClass}" title="سوال قفل‌شده">
                              <i class="bi bi-lock-fill" aria-hidden="true"></i>
                              <span>${item.questionNumber}</span>
                            </span>`
                          : html`<a
                              href="${resLocals.urlPrefix}/instance_question/${item.instanceQuestionId}/"
                              class="${stepClass}"
                              ${item.isCurrent ? html`aria-current="step"` : ''}
                              title="سوال ${item.questionNumber}"
                            >
                              ${
                                item.isSolved && !item.isCurrent
                                  ? html`<i class="bi bi-check-circle-fill" aria-hidden="true"></i>`
                                  : ''
                              }
                              <span>${item.questionNumber}</span>
                            </a>`;
                      })}
                    </div>
                    <div class="d-flex align-items-center gap-2 small text-body-secondary">
                      <span class="badge sh-chip-neutral sh-tabular">
                        ${toPersianDigits(stepperQuestions.filter((q) => q.isSolved).length)} از
                        ${toPersianDigits(stepperQuestions.length)} کامل
                      </span>
                      <span class="d-none d-xl-inline-flex align-items-center gap-1">
                        <span>میانبر:</span>
                        <kbd dir="ltr">Alt + ← / →</kbd>
                      </span>
                    </div>
                  </nav>
                `
              : ''
          }
          ${
            resLocals.instance_question_info.question_access_mode === 'read_only_lockpoint'
              ? html`
                  <div class="alert alert-warning">
                    این سوال فقط-خواندنی است زیرا از مرحله عطف عبور کرده‌اید. می‌توانید پاسخ‌های قبلی
                    خود را مرور کنید اما امکان ثبت پاسخ جدید وجود ندارد.
                  </div>
                `
              : ''
          }
          ${
            renderState?.variant == null
              ? html`
                  <div class="card mb-4">
                    <div class="card-header bg-primary text-white">
                      <h1>
                        ${QuestionTitle({
                          questionContext,
                          question: resLocals.question,
                          questionNumber: resLocals.instance_question_info.question_number,
                          showQuestionTitles: !!resLocals.assessment.show_question_titles,
                        })}
                      </h1>
                    </div>
                    <div class="card-body">
                      این سوال در زمان باز بودن ارزیابی مشاهده نشد، بنابراین نمونه‌ای برای آن تولید
                      نشده است.
                    </div>
                  </div>
                `
              : QuestionContainer({
                  resLocals,
                  questionContext,
                  questionCopyTargets,
                  showFooter: resLocals.assessment_instance.open,
                })
          }
        </div>

        <div
          class="col-lg-3 col-sm-12 question-page-sidebar"
          ${independentScrolling ? html`role="region" aria-label="Question information" tabindex="0"` : ''}
        >
          ${
            resLocals.assessment.type === 'Exam'
              ? html`
                  <div class="card mb-4">
                    <div class="card-header bg-secondary">
                      <h2>
                        <a
                          class="text-white"
                          href="${resLocals.urlPrefix}/assessment_instance/${
                            resLocals.assessment_instance.id
                          }/"
                        >
                          ${resLocals.assessment_set.name} ${resLocals.assessment.number}
                        </a>
                      </h2>
                    </div>

                    <div class="card-body">
                      <div class="d-flex justify-content-center">
                        <a
                          class="btn btn-info"
                          href="${resLocals.urlPrefix}/assessment_instance/${
                            resLocals.assessment_instance.id
                          }/"
                        >
                          نمای کلی ارزیابی
                        </a>
                      </div>

                      ${
                        resLocals.assessment_instance.open &&
                        resLocals.assessment_instance_remaining_ms != null
                          ? html`
                              <div class="mt-3">
                                <div id="countdownProgress"></div>
                                <p class="mb-0">
                                  زمان باقی‌مانده: <span id="countdownDisplay"></span>
                                </p>
                              </div>
                            `
                          : ''
                      }
                    </div>
                  </div>
                `
              : AssessmentScorePanel({
                  urlPrefix: resLocals.urlPrefix,
                  assessment: resLocals.assessment,
                  assessment_set: resLocals.assessment_set,
                  assessment_instance: resLocals.assessment_instance,
                })
          }
          ${QuestionScorePanel({
            instance_question: resLocals.instance_question,
            assessment: resLocals.assessment,
            assessment_question: resLocals.assessment_question,
            question: resLocals.question,
            assessment_instance: resLocals.assessment_instance,
            instance_question_info: resLocals.instance_question_info,
            variant: renderState?.variant ?? undefined,
            authz_result: resLocals.authz_result,
            csrfToken: resLocals.__csrf_token,
            allowGradeLeftMs: renderState?.allowGradeLeftMs ?? 0,
          })}
          ${QuestionNavSideGroup({
            urlPrefix: resLocals.urlPrefix,
            assessmentInstanceId: resLocals.assessment_instance.id,
            prevInstanceQuestionId: resLocals.instance_question_info.prev_instance_question.id,
            nextInstanceQuestionId: resLocals.instance_question_info.next_instance_question.id,
            nextQuestionAccessMode:
              resLocals.instance_question_info.next_instance_question.question_access_mode,
            prevGroupRolePermissions: resLocals.prev_instance_question_role_permissions,
            nextGroupRolePermissions: resLocals.next_instance_question_role_permissions,
            advanceScorePerc: resLocals.instance_question_info.advance_score_perc,
            userGroupRoles: resLocals.group_info
              ? getRoleNamesForUser(resLocals.group_info, resLocals.user).join(', ')
              : null,
          })}
          ${
            questionStat && questionStat.attemptedCount >= 1
              ? html`
                  <div class="card mb-4">
                    <div
                      class="card-body py-2 px-3 d-flex align-items-center justify-content-between small"
                    >
                      <span class="text-body-secondary">نرخ حل کلاس</span>
                      <span
                        class="se-qstat-pill m-0 ${
                          questionStat.solveRatePerc >= 70
                            ? 'se-qstat-easy'
                            : questionStat.solveRatePerc >= 40
                              ? 'se-qstat-medium'
                              : 'se-qstat-hard'
                        }"
                      >
                        ${toPersianDigits(questionStat.solveRatePerc)}٪ •
                        ${toPersianDigits(questionStat.avgAttempts)} تلاش
                      </span>
                    </div>
                  </div>
                `
              : ''
          }
          ${
            resLocals.assessment.allow_personal_notes
              ? PersonalNotesPanel({
                  fileList: resLocals.file_list,
                  context: 'question',
                  courseInstanceId: resLocals.course_instance.id,
                  assessment_instance: resLocals.assessment_instance,
                  authz_result: resLocals.authz_result,
                  variantId: renderState?.variant.id,
                  csrfToken: resLocals.__csrf_token,
                  lockdownBrowser: resLocals.lockdown_browser,
                })
              : ''
          }
          ${calculator ? CalculatorDrawerToggle() : ''}
          ${InstructorInfoPanel({
            course: resLocals.course,
            course_instance: resLocals.course_instance,
            assessment: resLocals.assessment,
            assessment_instance: resLocals.assessment_instance,
            instance_question: resLocals.instance_question,
            assignedGrader,
            lastGrader,
            question: resLocals.question,
            variant: renderState?.variant ?? undefined,
            instance_group: resLocals.instance_group,
            instance_group_uid_list: resLocals.instance_group_uid_list,
            instance_user: resLocals.instance_user,
            authz_data: resLocals.authz_data,
            question_is_shared: renderState?.question_is_shared ?? false,
            questionContext:
              resLocals.assessment.type === 'Exam' ? 'student_exam' : 'student_homework',
            csrfToken: resLocals.__csrf_token,
          })}
        </div>
      </div>
      ${
        delightConfig
          ? html`
              <script id="sh-delight-config" type="application/json">
                ${unsafeHtml(JSON.stringify(delightConfig).replaceAll('<', '\\u003c'))}
              </script>
            `
          : ''
      }
    `,
  });
}
