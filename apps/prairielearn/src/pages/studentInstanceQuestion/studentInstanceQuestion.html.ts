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
import type {
  AchievementTier,
  FirstBloodOwner,
  NextUnlockHint,
} from '../../lib/student-gamification.js';
import type {
  CommunitySpotlightSolution,
  SubmissionKudosItem,
  SubmissionSpeedComparison,
} from '../../lib/student-phase3.js';
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
  level: number | null;
  levelTitle: string | null;
  assessmentId: string;
  assessmentLabel: string;
  assessmentCompleted: boolean;
  beatsClassPerc: number | null;
  unlockedAchievements: {
    id: string;
    title: string;
    description: string;
    tier: AchievementTier;
  }[];
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
  firstBloodOwner = null,
  showFirstBloodBadge = false,
  nextUnlock = null,
  speedComparison = null,
  instanceKudos = [],
  spotlightSolutions = [],
  canAwardKudos = false,
  canToggleSpotlight = false,
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
  firstBloodOwner?: FirstBloodOwner | null;
  showFirstBloodBadge?: boolean;
  nextUnlock?: NextUnlockHint | null;
  speedComparison?: SubmissionSpeedComparison | null;
  instanceKudos?: SubmissionKudosItem[];
  spotlightSolutions?: CommunitySpotlightSolution[];
  canAwardKudos?: boolean;
  canToggleSpotlight?: boolean;
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
      ${
        spotlightSolutions.length > 0
          ? html`<script defer src="${assetPath('javascripts/student-phase3.js')}"></script>`
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
                    <div
                      class="d-flex flex-wrap align-items-center gap-2 small text-body-secondary"
                    >
                      ${
                        showFirstBloodBadge
                          ? firstBloodOwner && firstBloodOwner.userId === resLocals.user.id
                            ? html`<span class="sh-fb-mine-chip" dir="rtl">
                                <i class="bi bi-lightning-fill" aria-hidden="true"></i>
                                <bdi dir="ltr" class="sh-en-term">First Blood</bdi>
                                <span>: شما!</span>
                              </span>`
                            : firstBloodOwner
                              ? html`<span class="sh-fb-claimed-chip" dir="rtl">
                                  <i class="bi bi-trophy-fill text-warning" aria-hidden="true"></i>
                                  <bdi dir="ltr" class="sh-en-term">First Blood</bdi>
                                  <span>: ${firstBloodOwner.displayName}</span>
                                </span>`
                              : resLocals.assessment_instance.open && resLocals.authz_result.active
                                ? html`<span class="sh-fb-open-chip" dir="rtl">
                                    <i class="bi bi-lightning-charge-fill" aria-hidden="true"></i>
                                    <span>شکار اول</span>
                                    <bdi dir="ltr" class="sh-en-term">+60 XP</bdi>
                                  </span>`
                                : ''
                          : ''
                      }
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
              : showFirstBloodBadge
                ? html`
                    <div class="d-flex justify-content-end mb-2">
                      ${
                        firstBloodOwner && firstBloodOwner.userId === resLocals.user.id
                          ? html`<span class="sh-fb-mine-chip" dir="rtl">
                              <i class="bi bi-lightning-fill" aria-hidden="true"></i>
                              <bdi dir="ltr" class="sh-en-term">First Blood</bdi>
                              <span>: شما!</span>
                            </span>`
                          : firstBloodOwner
                            ? html`<span class="sh-fb-claimed-chip" dir="rtl">
                                <i class="bi bi-trophy-fill text-warning" aria-hidden="true"></i>
                                <bdi dir="ltr" class="sh-en-term">First Blood</bdi>
                                <span>: ${firstBloodOwner.displayName}</span>
                              </span>`
                            : resLocals.assessment_instance.open && resLocals.authz_result.active
                              ? html`<span class="sh-fb-open-chip" dir="rtl">
                                  <i class="bi bi-lightning-charge-fill" aria-hidden="true"></i>
                                  <span>شکار اول</span>
                                  <bdi dir="ltr" class="sh-en-term">+60 XP</bdi>
                                </span>`
                              : ''
                      }
                    </div>
                  `
                : ''
          }
          ${
            speedComparison
              ? html`
                  <div class="sh-speed-banner mb-3">
                    <div
                      class="d-flex flex-wrap align-items-center justify-content-between gap-2 small"
                    >
                      <span>
                        <i class="bi bi-speedometer2 me-1 text-success" aria-hidden="true"></i>
                        <strong>عملکرد سرعت کد:</strong>
                        کد شما سریع‌تر از
                        <strong class="sh-tabular text-success">
                          ${toPersianDigits(speedComparison.beatsPerc)}٪
                        </strong>
                        از ${toPersianDigits(speedComparison.cohortCount)} پاسخ پذیرفته‌شده کلاس اجرا
                        شد!
                      </span>
                      <span class="badge bg-body-tertiary text-body border sh-en-term sh-tabular">
                        ${toPersianDigits(speedComparison.myRuntimeMs)} ms
                        ${speedComparison.isApproximateWallTime ? ' (Judge Wall-Time)' : ''}
                      </span>
                    </div>
                  </div>
                `
              : ''
          }
          ${
            instanceKudos.length > 0
              ? html`
                  <div class="sh-kudos-banner mb-3">
                    ${instanceKudos.map((k) => {
                      const labelFa =
                        k.kudosType === 'clean_code'
                          ? 'کد تمیز (Clean Code)'
                          : 'راه‌حل خلاقانه (Creative Solution)';
                      return html`
                        <div
                          class="d-flex flex-wrap align-items-center justify-content-between gap-2 py-1"
                        >
                          <div class="small">
                            <i
                              class="bi bi-patch-check-fill text-warning me-1"
                              aria-hidden="true"
                            ></i>
                            <strong class="text-body">تحسین‌شده توسط TA:</strong>
                            <span>${labelFa}</span>
                            <span class="text-body-secondary">· ثبت: ${k.awarderDisplayName}</span>
                            ${
                              k.note
                                ? html`<div class="text-body-secondary mt-1">«${k.note}»</div>`
                                : ''
                            }
                          </div>
                          ${
                            canToggleSpotlight
                              ? html`
                                  <form method="POST" class="d-inline-flex align-items-center">
                                    <input
                                      type="hidden"
                                      name="__csrf_token"
                                      value="${resLocals.__csrf_token}"
                                    />
                                    <input
                                      type="hidden"
                                      name="__action"
                                      value="toggle_spotlight_opt_in"
                                    />
                                    <input type="hidden" name="kudos_id" value="${k.kudosId}" />
                                    <input
                                      type="hidden"
                                      name="opt_in"
                                      value="${k.studentSpotlightOptIn ? 'false' : 'true'}"
                                    />
                                    <button
                                      type="submit"
                                      class="btn btn-xs ${
                                        k.studentSpotlightOptIn
                                          ? 'btn-success'
                                          : 'btn-outline-secondary'
                                      }"
                                    >
                                      <i
                                        class="bi ${
                                          k.studentSpotlightOptIn ? 'bi-eye-fill' : 'bi-eye'
                                        } me-1"
                                        aria-hidden="true"
                                      ></i>
                                      ${
                                        k.studentSpotlightOptIn
                                          ? 'در Spotlight نمایش داده می‌شود ✓'
                                          : 'اجازه نمایش در Spotlight کلاس'
                                      }
                                    </button>
                                  </form>
                                `
                              : ''
                          }
                        </div>
                      `;
                    })}
                  </div>
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
          ${
            spotlightSolutions.length > 0
              ? html`
                  <div class="card mb-4 sh-spotlight-card">
                    <div class="card-header d-flex align-items-center justify-content-between">
                      <span class="fw-bold small d-flex align-items-center gap-2">
                        <i class="bi bi-stars text-warning" aria-hidden="true"></i>
                        <span>راه‌حل‌های برگزیده کلاس</span>
                        <span class="sh-en-term text-body-secondary">(Community Spotlight)</span>
                      </span>
                      <span class="badge bg-body-tertiary text-body border sh-tabular">
                        ${toPersianDigits(spotlightSolutions.length)} راه‌حل
                      </span>
                    </div>
                    <div class="card-body">
                      <details>
                        <summary class="small fw-semibold text-primary" style="cursor: pointer;">
                          مشاهده ${toPersianDigits(spotlightSolutions.length)} کد تمیز و خلاقانه با
                          اجازه هم‌کلاسی‌ها
                        </summary>
                        <div class="d-flex flex-column gap-3 mt-3">
                          ${spotlightSolutions.map(
                            (sol) => html`
                              <div class="sh-spotlight-item border rounded p-3 bg-body-tertiary">
                                <div
                                  class="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-2"
                                >
                                  <div class="small d-flex flex-wrap align-items-center gap-2">
                                    <span class="fw-bold text-body">${sol.studentDisplayName}</span>
                                    <span
                                      class="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle"
                                    >
                                      ${
                                        sol.kudosType === 'clean_code'
                                          ? 'کد تمیز (Clean Code)'
                                          : 'راه‌حل خلاقانه'
                                      }
                                    </span>
                                    <span class="text-body-secondary sh-en-term" dir="ltr">
                                      ${sol.fileName}
                                    </span>
                                  </div>
                                  <button
                                    type="button"
                                    class="btn btn-xs btn-outline-secondary"
                                    data-sh-copy-spotlight
                                  >
                                    کپی کد
                                  </button>
                                </div>
                                ${
                                  sol.note
                                    ? html`<div class="small text-body-secondary mb-2">
                                        یادداشت TA: «${sol.note}»
                                      </div>`
                                    : ''
                                }
                                <pre
                                  dir="ltr"
                                  class="sh-pulse-code mb-0"
                                ><code>${sol.code}</code></pre>
                              </div>
                            `,
                          )}
                        </div>
                      </details>
                    </div>
                  </div>
                `
              : ''
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
            nextUnlock && resLocals.assessment.type === 'Homework' && !resLocals.lockdown_browser
              ? html`
                  <div class="card mb-4 sh-next-unlock-sidebar">
                    <div class="card-body py-2 px-3">
                      <div class="d-flex align-items-center justify-content-between small mb-1">
                        <span class="fw-bold text-body">
                          <i
                            class="${nextUnlock.iconClass} me-1 text-primary"
                            aria-hidden="true"
                          ></i>
                          نزدیک‌ترین مدال بعدی
                        </span>
                        <bdi dir="ltr" class="badge sh-chip-primary sh-en-term sh-tabular">
                          +${toPersianDigits(nextUnlock.xpReward)} XP
                        </bdi>
                      </div>
                      <div class="small text-body-secondary mb-2">${nextUnlock.messageFa}</div>
                      <div class="d-flex align-items-center gap-2 mb-1">
                        <div class="progress flex-grow-1" style="height: 6px;">
                          <div
                            class="progress-bar sh-progress-brand"
                            style="width: ${nextUnlock.progressPerc}%"
                          ></div>
                        </div>
                        <span class="small text-body-secondary sh-tabular">
                          ${toPersianDigits(nextUnlock.currentValue)} از
                          ${toPersianDigits(nextUnlock.nextTarget)}
                        </span>
                      </div>
                      <div class="text-end">
                        <a
                          href="${resLocals.urlPrefix}/gradebook#tab-achievements"
                          class="small text-decoration-none"
                        >
                          همه مدال‌ها ←
                        </a>
                      </div>
                    </div>
                  </div>
                `
              : ''
          }
          ${
            canAwardKudos
              ? html`
                  <div class="card mb-4 sh-ta-kudos-admin">
                    <div class="card-header py-2">
                      <span class="fw-bold small d-flex align-items-center gap-1">
                        <i class="bi bi-patch-check-fill text-warning" aria-hidden="true"></i>
                        <span>تحسین توسط TA (TA Kudos)</span>
                      </span>
                    </div>
                    <div class="card-body p-3">
                      <form method="POST" class="d-flex flex-column gap-2">
                        <input
                          type="hidden"
                          name="__csrf_token"
                          value="${resLocals.__csrf_token}"
                        />
                        <input type="hidden" name="__action" value="award_ta_kudos" />
                        <label class="form-label small mb-0" for="sh-kudos-sub-select">
                          انتخاب ارسال
                        </label>
                        <select
                          id="sh-kudos-sub-select"
                          name="submission_id"
                          class="form-select form-select-sm"
                        >
                          ${resLocals.submissions.map(
                            (sub, idx) => html`
                              <option value="${sub.id}">
                                #${toPersianDigits(resLocals.submissions.length - idx)} —
                                ${
                                  sub.score != null
                                    ? `${toPersianDigits(Math.round(sub.score * 100))}٪`
                                    : 'نمره‌نداده'
                                }
                              </option>
                            `,
                          )}
                        </select>
                        <label class="form-label small mb-0" for="sh-kudos-type-select">
                          نوع نشان
                        </label>
                        <select
                          id="sh-kudos-type-select"
                          name="kudos_type"
                          class="form-select form-select-sm"
                        >
                          <option value="clean_code">کد تمیز (Clean Code)</option>
                          <option value="creative_solution">
                            راه‌حل خلاقانه (Creative Solution)
                          </option>
                        </select>
                        <input
                          type="text"
                          name="note"
                          maxlength="180"
                          class="form-control form-control-sm"
                          placeholder="یادداشت کوتاه تشویقی (اختیاری)..."
                        />
                        <button type="submit" class="btn btn-primary btn-sm">
                          ثبت نشان تحسین (+۱۰۰ XP)
                        </button>
                      </form>
                      ${
                        instanceKudos.length > 0
                          ? html`
                              <div class="mt-2 pt-2 border-top d-flex flex-column gap-1">
                                ${instanceKudos.map(
                                  (k) => html`
                                    <form
                                      method="POST"
                                      class="d-flex align-items-center justify-content-between gap-2 small"
                                    >
                                      <input
                                        type="hidden"
                                        name="__csrf_token"
                                        value="${resLocals.__csrf_token}"
                                      />
                                      <input
                                        type="hidden"
                                        name="__action"
                                        value="revoke_ta_kudos"
                                      />
                                      <input type="hidden" name="kudos_id" value="${k.kudosId}" />
                                      <span class="text-truncate">
                                        ${
                                          k.kudosType === 'clean_code'
                                            ? 'Clean Code'
                                            : 'Creative Solution'
                                        }
                                      </span>
                                      <button type="submit" class="btn btn-xs btn-outline-danger">
                                        حذف
                                      </button>
                                    </form>
                                  `,
                                )}
                              </div>
                            `
                          : ''
                      }
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
