import { z } from 'zod';

import { html } from '@prairielearn/html';
import { IdSchema } from '@prairielearn/zod';

import { PageLayout } from '../../components/PageLayout.js';
import { ScorebarHtml } from '../../components/Scorebar.js';
import {
  StudentAccessRulesSchedule,
  StudentAccessTimelineSchedule,
  formatStudentCreditDisplay,
  formatStudentNextActiveDisplay,
} from '../../components/StudentAccessSchedules.js';
import {
  type DeadlineMiniItem,
  StudentDeadlineRadarStrip,
} from '../../components/StudentDeadlineRadar.js';
import type { AssessmentAuthzResult } from '../../lib/assessment-access-control/authz-result.js';
import { assetPath } from '../../lib/assets.js';
import {
  AssessmentInstanceSchema,
  AssessmentSchema,
  AssessmentSetSchema,
} from '../../lib/db-types.js';
import { idsEqual } from '../../lib/id.js';
import { formatJalaliFriendly, toPersianDigits } from '../../lib/jalali.js';
import { type ResLocalsForPage } from '../../lib/res-locals.js';
import type { DailyPulseState } from '../../lib/student-daily-pulse.js';
import {
  type NextUnlockHint,
  WEEKLY_GOAL_TIERS,
  type WeeklyGoalTier,
  type WeeklyQuestsBundle,
} from '../../lib/student-gamification.js';
import type { ClassCoopGoal, PersonalWeeklyGoalState } from '../../lib/student-phase3.js';

export const StudentAssessmentsRowBaseSchema = z.object({
  assessment_id: AssessmentSchema.shape.id,
  multiple_instance_header: z.boolean(),
  assessment_number: AssessmentSchema.shape.number,
  title: AssessmentSchema.shape.title,
  team_work: AssessmentSchema.shape.team_work.nullable(),
  modern_access_control: AssessmentSchema.shape.modern_access_control,
  assessment_set_name: AssessmentSetSchema.shape.name,
  assessment_set_color: AssessmentSetSchema.shape.color,
  label: z.string(),
  assessment_instance_id: AssessmentInstanceSchema.shape.id.nullable(),
  assessment_instance_score_perc: AssessmentInstanceSchema.shape.score_perc.nullable(),
  assessment_instance_open: AssessmentInstanceSchema.shape.open.nullable(),
  assessment_instance_date_limit: AssessmentInstanceSchema.shape.date_limit.nullable(),
  link: z.string(),
  assessment_group_id: IdSchema,
  assessment_group_heading: z.string(),
});

export type StudentAssessmentsRow = z.infer<typeof StudentAssessmentsRowBaseSchema> & {
  authz_result: AssessmentAuthzResult;
};

function getRowState(row: StudentAssessmentsRow): 'upcoming' | 'completed' | 'active' | 'closed' {
  if (
    row.authz_result.show_before_release ||
    (row.modern_access_control &&
      row.assessment_instance_id == null &&
      !row.authz_result.authorized)
  ) {
    return 'upcoming';
  }
  if ((row.assessment_instance_score_perc ?? 0) >= 99.99) {
    return 'completed';
  }
  if (row.assessment_instance_open === false || !row.authz_result.active) {
    return 'closed';
  }
  return 'active';
}

function WeeklyQuestsMiniStrip({
  weeklyQuests,
  gradebookUrl,
}: {
  weeklyQuests: WeeklyQuestsBundle;
  gradebookUrl: string;
}) {
  return html`
    <section class="se-section mb-4" aria-label="ماموریت‌های هفتگی">
      <div class="se-card">
        <div class="se-card-header">
          <h2 class="se-card-title">
            <i class="bi bi-flag text-body-secondary" aria-hidden="true"></i>
            <span class="sh-en-term">Weekly Quests</span>
            <span class="small text-body-secondary fw-normal">— ${weeklyQuests.weekLabel}</span>
          </h2>
          <div class="d-flex align-items-center gap-2 small">
            <span class="badge bg-body-tertiary text-body border sh-tabular">
              ${toPersianDigits(weeklyQuests.completedCount)} از
              ${toPersianDigits(weeklyQuests.quests.length)} تکمیل
            </span>
            <a href="${gradebookUrl}#tab-activity" class="small text-decoration-none">
              جزئیات بیشتر
            </a>
          </div>
        </div>
        <div class="p-3">
          <div class="sh-quest-strip">
            ${weeklyQuests.quests.map(
              (quest) => html`
                <div class="sh-quest-card ${quest.completed ? 'is-completed' : ''}">
                  <div class="d-flex align-items-center justify-content-between gap-2 mb-1">
                    <span class="fw-bold small d-flex align-items-center gap-1">
                      <i
                        class="${quest.completed ? 'bi bi-check-circle-fill text-success' : quest.iconClass}"
                        aria-hidden="true"
                      ></i>
                      <span class="sh-en-term">${quest.title}</span>
                    </span>
                    <span class="badge bg-body-tertiary text-body border sh-en-term sh-tabular">
                      +${toPersianDigits(quest.xpReward)} XP
                    </span>
                  </div>
                  <div class="small text-body-secondary mb-2">${quest.description}</div>
                  <div class="d-flex align-items-center gap-2">
                    <div class="progress flex-grow-1" style="height: 7px;">
                      <div
                        class="progress-bar ${quest.completed ? 'sh-progress-success' : 'sh-progress-brand'}"
                        style="width: ${quest.progressPerc}%"
                      ></div>
                    </div>
                    <span class="small text-body-secondary sh-tabular">
                      ${toPersianDigits(quest.current)} از ${toPersianDigits(quest.target)}
                    </span>
                  </div>
                </div>
              `,
            )}
          </div>
        </div>
      </div>
    </section>
  `;
}

function CoopGoalBanner({ coopGoal }: { coopGoal: ClassCoopGoal }) {
  return html`
    <section class="se-section mb-4" aria-label="هدف همکاری کل کلاس">
      <div class="sh-coop-banner ${coopGoal.isReached ? 'is-reached' : ''}">
        <div class="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-2">
          <div class="d-flex flex-wrap align-items-center gap-2">
            <span class="badge ${coopGoal.isReached ? 'bg-success' : 'bg-primary'}">
              <i class="bi bi-people-fill me-1" aria-hidden="true"></i>
              هدف مشترک کلاس
            </span>
            <strong class="text-body">
              <span dir="ltr" class="me-1">${coopGoal.label}</span>
              — ${coopGoal.title}
            </strong>
          </div>
          <div class="d-flex flex-wrap align-items-center gap-2 small sh-tabular">
            <span class="badge bg-body-tertiary text-body border sh-en-term">
              +${toPersianDigits(coopGoal.rewardXp)} XP + Class Co-op
            </span>
            <span class="text-body-secondary">
              ${toPersianDigits(coopGoal.participantCount)} دانشجوی مشارکت‌کننده
              ${
                coopGoal.userContributedSolves > 0
                  ? ` (سهم شما: ${toPersianDigits(coopGoal.userContributedSolves)} حل)`
                  : ''
              }
            </span>
          </div>
        </div>
        <div class="d-flex align-items-center gap-3">
          <div class="progress flex-grow-1" style="height: 10px;">
            <div
              class="progress-bar ${coopGoal.isReached ? 'sh-progress-success' : 'sh-progress-brand'}"
              style="width: ${coopGoal.progressPerc}%"
            ></div>
          </div>
          <span class="fw-bold small text-body sh-tabular text-nowrap">
            ${toPersianDigits(coopGoal.currentSolves)} از ${toPersianDigits(coopGoal.targetSolves)}
            حل (${toPersianDigits(coopGoal.progressPerc)}٪)
          </span>
        </div>
        <div class="small text-body-secondary mt-2">
          ${
            coopGoal.isReached
              ? 'کلاس به هدف مشترک این سری رسید! نشان Class Co-op و +۷۵ XP برای همه مشارکت‌کنندگان فعال شد.'
              : 'با حل هر سوال این سری، کل کلاس یک گام به هدف مشترک و پاداش همگانی نزدیک‌تر می‌شود.'
          }
        </div>
      </div>
    </section>
  `;
}

function DailyPulseCard({
  dailyPulse,
  csrfToken,
}: {
  dailyPulse: DailyPulseState;
  csrfToken: string;
}) {
  const { puzzle, attempt, jalaliDateLabel, xpReward } = dailyPulse;

  return html`
    <div id="sh-daily-pulse" class="se-card sh-pulse-card h-100">
      <div class="se-card-header">
        <h2 class="se-card-title">
          <i class="bi bi-lightning-charge text-warning" aria-hidden="true"></i>
          <span class="sh-en-term">Daily Python Pulse</span>
          <span class="small text-body-secondary fw-normal">— گرم‌کن ۲ دقیقه‌ای</span>
        </h2>
        <div class="d-flex align-items-center gap-2 small">
          <span class="badge bg-body-tertiary text-body border">${puzzle.topicFa}</span>
          <span class="badge bg-body-tertiary text-body border sh-en-term sh-tabular">
            +${toPersianDigits(xpReward)} XP
          </span>
        </div>
      </div>
      <div class="p-3 d-flex flex-column gap-2">
        <div class="d-flex justify-content-between align-items-center small text-body-secondary">
          <span>${puzzle.promptFa}</span>
          <span class="sh-tabular">${jalaliDateLabel}</span>
        </div>
        <pre dir="ltr" class="sh-pulse-code mb-1"><code>${puzzle.codeSnippet}</code></pre>
        ${
          attempt == null
            ? html`
                <form method="POST" class="sh-pulse-options">
                  <input type="hidden" name="__csrf_token" value="${csrfToken}" />
                  <input type="hidden" name="__action" value="submit_daily_pulse" />
                  <input type="hidden" name="puzzle_id" value="${puzzle.id}" />
                  ${puzzle.options.map(
                    (opt, idx) => html`
                      <button
                        type="submit"
                        name="selected_option"
                        value="${idx}"
                        class="sh-pulse-opt"
                        dir="auto"
                      >
                        <span class="badge bg-body-tertiary text-body border me-2 sh-tabular">
                          ${toPersianDigits(idx + 1)}
                        </span>
                        <span>${opt}</span>
                      </button>
                    `,
                  )}
                </form>
                <div class="small text-body-secondary">
                  بدون نمره منفی · با پاسخ امروز، فعالیت روزانه و
                  <span class="sh-en-term">Streak</span> شما نیز ثبت می‌شود.
                </div>
              `
            : html`
                <div class="sh-pulse-options">
                  ${puzzle.options.map((opt, idx) => {
                    const isCorrectOpt = idx === puzzle.correctIndex;
                    const isSelectedOpt = idx === attempt.selectedOption;
                    const optClass = isCorrectOpt
                      ? 'sh-pulse-opt is-correct'
                      : isSelectedOpt && !attempt.isCorrect
                        ? 'sh-pulse-opt is-wrong'
                        : 'sh-pulse-opt is-dimmed';
                    return html`
                      <div class="${optClass}" dir="auto">
                        <span class="badge bg-body-tertiary text-body border me-2 sh-tabular">
                          ${toPersianDigits(idx + 1)}
                        </span>
                        <span>${opt}</span>
                      </div>
                    `;
                  })}
                </div>
                <div
                  class="alert ${attempt.isCorrect ? 'alert-success' : 'alert-warning'} small py-2 px-3 mb-0"
                >
                  <strong>
                    ${
                      attempt.isCorrect
                        ? `آفرین! پاسخ درست بود (+${toPersianDigits(xpReward)} XP و ثبت روز فعال Streak).`
                        : 'پاسخ امروز ثبت شد (فعالیت روزانه برای Streak لحاظ گردید).'
                    }
                  </strong>
                  <div class="mt-1">${puzzle.explanationFa}</div>
                </div>
              `
        }
      </div>
    </div>
  `;
}

function PersonalWeeklyGoalCard({
  personalGoal,
  csrfToken,
}: {
  personalGoal: PersonalWeeklyGoalState;
  csrfToken: string;
}) {
  const tiers: WeeklyGoalTier[] = ['light', 'balanced', 'pro'];
  return html`
    <div id="sh-weekly-goal" class="se-card sh-weekly-goal-card">
      <div class="se-card-header">
        <h2 class="se-card-title">
          <i class="bi bi-bullseye text-primary" aria-hidden="true"></i>
          <span>تعهد هفتگی من</span>
        </h2>
        <span class="badge bg-body-tertiary text-body border sh-en-term sh-tabular">
          +${toPersianDigits(personalGoal.xpReward)} XP
        </span>
      </div>
      <div class="p-3">
        <form method="POST" class="d-flex flex-wrap gap-2 mb-3">
          <input type="hidden" name="__csrf_token" value="${csrfToken}" />
          <input type="hidden" name="__action" value="set_weekly_goal" />
          ${tiers.map((tierKey) => {
            const meta = WEEKLY_GOAL_TIERS[tierKey];
            const isSelected = personalGoal.tier === tierKey;
            return html`
              <button
                type="submit"
                name="tier"
                value="${tierKey}"
                class="sh-goal-pill ${isSelected ? 'is-active' : ''}"
                aria-pressed="${isSelected ? 'true' : 'false'}"
              >
                ${meta.labelFa}
              </button>
            `;
          })}
        </form>
        <div class="d-flex justify-content-between small text-body-secondary mb-1 sh-tabular">
          <span>
            ${
              personalGoal.hasExplicitGoal
                ? `پیشرفت این هفته: ${toPersianDigits(personalGoal.solvedThisWeek)} از ${toPersianDigits(personalGoal.targetQuestions)} سوال`
                : 'یکی از سطوح بالا را برای هدف این هفته انتخاب کنید'
            }
          </span>
          <span>${toPersianDigits(personalGoal.progressPerc)}٪</span>
        </div>
        <div class="progress" style="height: 8px;">
          <div
            class="progress-bar ${personalGoal.completed ? 'sh-progress-success' : 'sh-progress-brand'}"
            style="width: ${personalGoal.progressPerc}%"
          ></div>
        </div>
      </div>
    </div>
  `;
}

export function StudentAssessments({
  resLocals,
  rows,
  showDeadlineRadar = false,
  weeklyQuests = null,
  coopGoal = null,
  dailyPulse = null,
  personalGoal = null,
  nextUnlock = null,
}: {
  resLocals: ResLocalsForPage<'course-instance'>;
  rows: StudentAssessmentsRow[];
  showDeadlineRadar?: boolean;
  weeklyQuests?: WeeklyQuestsBundle | null;
  coopGoal?: ClassCoopGoal | null;
  dailyPulse?: DailyPulseState | null;
  personalGoal?: PersonalWeeklyGoalState | null;
  nextUnlock?: NextUnlockHint | null;
}) {
  const { urlPrefix, authz_data } = resLocals;

  const assessmentGroups: StudentAssessmentsRow[][] = [];
  rows.forEach((row) => {
    if (assessmentGroups.length === 0) {
      assessmentGroups.push([row]);
    } else {
      const currentGroup = assessmentGroups[assessmentGroups.length - 1];
      if (!idsEqual(row.assessment_group_id, currentGroup[0].assessment_group_id)) {
        assessmentGroups.push([row]);
      } else {
        currentGroup.push(row);
      }
    }
  });

  const tz = resLocals.course_instance.display_timezone || 'Asia/Tehran';
  const radarItems: DeadlineMiniItem[] = [];
  if (showDeadlineRadar) {
    for (const row of rows) {
      if (!row.authz_result.authorized || row.assessment_instance_open === false) continue;
      const curSeg = row.authz_result.access_timeline.find(
        (s) => s.current && s.kind === 'deadline' && s.submittable && s.endDate != null,
      );
      if (!curSeg?.endDate) continue;
      radarItems.push({
        title: row.title,
        label: row.label,
        href: `${urlPrefix}${row.link}`,
        endDateIso: curSeg.endDate.toISOString(),
        endDateJalali: formatJalaliFriendly(curSeg.endDate, tz, { includeTz: false }),
        credit: curSeg.credit,
      });
    }
    radarItems.sort((a, b) => a.endDateIso.localeCompare(b.endDateIso));
  }
  const topRadarItems = radarItems.slice(0, 3);

  return PageLayout({
    resLocals,
    pageTitle: 'تکالیف و ارزیابی‌ها',
    navContext: {
      type: 'student',
      page: 'assessments',
    },
    headContent: html`
      <link href="${assetPath('stylesheets/student-engagement.css')}" rel="stylesheet" />
      <script defer src="${assetPath('javascripts/student-ux.js')}"></script>
      ${
        showDeadlineRadar
          ? html`<script
              defer
              src="${assetPath('javascripts/student-deadline-radar.js')}"
            ></script>`
          : ''
      }
    `,
    content: html`
      ${topRadarItems.length > 0 ? StudentDeadlineRadarStrip({ items: topRadarItems }) : ''}
      ${coopGoal ? CoopGoalBanner({ coopGoal }) : ''}
      ${
        dailyPulse || personalGoal || nextUnlock
          ? html`
              <section class="se-section mb-4" aria-label="گرم‌کن روزانه و هدف شخصی">
                <div class="row g-3">
                  ${
                    dailyPulse
                      ? html`
                          <div class="${personalGoal || nextUnlock ? 'col-lg-7' : 'col-12'}">
                            ${DailyPulseCard({
                              dailyPulse,
                              csrfToken: resLocals.__csrf_token,
                            })}
                          </div>
                        `
                      : ''
                  }
                  ${
                    personalGoal || nextUnlock
                      ? html`
                          <div
                            class="${dailyPulse ? 'col-lg-5' : 'col-12'} d-flex flex-column gap-3"
                          >
                            ${
                              personalGoal
                                ? PersonalWeeklyGoalCard({
                                    personalGoal,
                                    csrfToken: resLocals.__csrf_token,
                                  })
                                : ''
                            }
                            ${
                              nextUnlock
                                ? html`
                                    <div class="sh-next-unlock-strip flex-grow-1">
                                      <div
                                        class="d-flex align-items-center justify-content-between small mb-2"
                                      >
                                        <span class="fw-bold text-body">
                                          <i
                                            class="${nextUnlock.iconClass} me-1 text-primary"
                                            aria-hidden="true"
                                          ></i>
                                          نزدیک‌ترین مدال بعدی
                                        </span>
                                        <a
                                          href="${urlPrefix}/gradebook#tab-achievements"
                                          class="small text-decoration-none"
                                        >
                                          مدال‌ها ←
                                        </a>
                                      </div>
                                      <div class="small text-body-secondary mb-2">
                                        ${nextUnlock.messageFa}
                                      </div>
                                      <div class="progress" style="height: 7px;">
                                        <div
                                          class="progress-bar sh-progress-brand"
                                          style="width: ${nextUnlock.progressPerc}%"
                                        ></div>
                                      </div>
                                    </div>
                                  `
                                : ''
                            }
                          </div>
                        `
                      : ''
                  }
                </div>
              </section>
            `
          : ''
      }
      ${
        weeklyQuests
          ? WeeklyQuestsMiniStrip({
              weeklyQuests,
              gradebookUrl: `${urlPrefix}/gradebook`,
            })
          : ''
      }
      <div class="card mb-4" style="font-family: var(--font-persian);">
        <div
          class="card-header bg-primary text-white sh-hero-header d-flex flex-wrap align-items-center justify-content-between gap-2"
        >
          <h1 class="h3 mb-0">تکالیف و ارزیابی‌ها</h1>
          <span class="badge bg-body-tertiary text-body border sh-tabular">
            ${toPersianDigits(rows.length)} مورد
          </span>
        </div>

        ${
          rows.length > 0
            ? html`
                <div class="sh-filter-bar" role="group" aria-label="فیلتر تکالیف">
                  <button
                    type="button"
                    class="sh-filter-pill is-active"
                    data-sh-assessment-filter="all"
                    aria-pressed="true"
                  >
                    همه
                  </button>
                  <button
                    type="button"
                    class="sh-filter-pill"
                    data-sh-assessment-filter="active"
                    aria-pressed="false"
                  >
                    فعال
                  </button>
                  <button
                    type="button"
                    class="sh-filter-pill"
                    data-sh-assessment-filter="completed"
                    aria-pressed="false"
                  >
                    کامل‌شده
                  </button>
                  <button
                    type="button"
                    class="sh-filter-pill"
                    data-sh-assessment-filter="upcoming"
                    aria-pressed="false"
                  >
                    آینده
                  </button>
                </div>
              `
            : ''
        }

        <div class="table-responsive">
          <table
            class="table table-sm table-hover sh-question-table sh-assessments-table mb-0"
            aria-label="ارزیابی‌ها"
          >
            <thead>
              <tr>
                <th style="width: 5%">کد</th>
                <th>عنوان ارزیابی</th>
                <th class="text-center">مهلت تحویل و وضعیت اعتبار</th>
                <th class="text-center" style="width: 15%">نمره</th>
              </tr>
            </thead>
            ${assessmentGroups.map(
              (groupRows) => html`
                <tbody data-assessment-group>
                  <tr class="sh-zone-row">
                    <th colspan="4" scope="rowgroup" data-testid="assessment-group-heading">
                      ${groupRows[0].assessment_group_heading}
                    </th>
                  </tr>
                  ${groupRows.map((row) => {
                    const rowState = getRowState(row);
                    const stateIcon =
                      rowState === 'completed'
                        ? 'bi-check-circle-fill text-success'
                        : rowState === 'upcoming'
                          ? 'bi-clock text-body-secondary'
                          : rowState === 'closed'
                            ? 'bi-lock text-body-secondary'
                            : (row.assessment_instance_score_perc ?? 0) > 0
                              ? 'bi-circle-half text-warning'
                              : 'bi-circle text-body-secondary';
                    return html`
                      <tr data-assessment-state="${rowState}">
                        <td class="align-middle" style="width: 1%">
                          <span
                            class="badge color-${row.assessment_set_color}"
                            data-testid="assessment-set-badge"
                          >
                            ${row.label}
                          </span>
                        </td>
                        <td class="align-middle">
                          <div class="d-flex align-items-center gap-2">
                            <i class="bi ${stateIcon} flex-shrink-0" aria-hidden="true"></i>
                            <div class="min-w-0">
                              ${
                                row.authz_result.show_before_release
                                  ? html`<span class="text-body-secondary">${row.title}</span>`
                                  : row.multiple_instance_header ||
                                      (!row.authz_result.active &&
                                        row.assessment_instance_id == null)
                                    ? row.title
                                    : html`
                                        <a href="${urlPrefix}${row.link}" class="sh-q-link">
                                          ${row.title}
                                          ${
                                            row.team_work
                                              ? html`<i
                                                  class="fas fa-users"
                                                  aria-hidden="true"
                                                ></i>`
                                              : ''
                                          }
                                        </a>
                                      `
                              }
                              ${AccessSchedule({
                                row,
                                displayTimezone: resLocals.course_instance.display_timezone,
                              })}
                            </div>
                          </div>
                        </td>
                        <td class="text-center align-middle" data-label="مهلت تحویل">
                          ${AvailableCredit({
                            row,
                            displayTimezone: resLocals.course_instance.display_timezone,
                          })}
                        </td>
                        <td class="text-center align-middle" data-label="نمره">
                          ${
                            row.multiple_instance_header
                              ? NewInstanceButton({ urlPrefix, row })
                              : AssessmentScore(row)
                          }
                        </td>
                      </tr>
                    `;
                  })}
                </tbody>
              `,
            )}
          </table>
        </div>
        <div
          id="sh-assessments-filter-empty"
          class="p-4 text-center text-body-secondary small d-none"
        >
          موردی با این فیلتر یافت نشد.
        </div>
      </div>
      ${
        authz_data.mode === 'Exam'
          ? html`
              <p>
                آزمون خود را مشاهده نمی‌کنید؟ آزمون‌های این درس صرفاً برای دانشجویانی که نوبت حضوری
                آن‌ها ثبت شده و توسط مراقب تأیید گردیده در دسترس قرار می‌گیرد. لطفاً به مراقب آزمون
                مراجعه فرمایید.
              </p>
            `
          : ''
      }
    `,
  });
}

function AssessmentScore(row: StudentAssessmentsRow) {
  if (row.assessment_instance_id == null) return 'شروع نشده';
  if (!row.authz_result.show_closed_assessment_score) return 'نمره پنهان است';
  return ScorebarHtml(row.assessment_instance_score_perc, { classes: 'mx-auto' });
}

function NewInstanceButton({ urlPrefix, row }: { urlPrefix: string; row: StudentAssessmentsRow }) {
  if (row.authz_result.active) {
    return html`<a href="${urlPrefix}${row.link}" class="btn btn-primary btn-sm">تلاش جدید</a>`;
  } else {
    return html`<button type="button" disabled class="btn btn-primary btn-sm">تلاش جدید</button>`;
  }
}

function AvailableCredit({
  row,
  displayTimezone,
}: {
  row: StudentAssessmentsRow;
  displayTimezone: string;
}) {
  const authzResult = row.authz_result;
  if (row.modern_access_control && row.assessment_instance_id == null && !authzResult.authorized) {
    const nextActiveDisplay = formatStudentNextActiveDisplay(authzResult, displayTimezone);
    if (nextActiveDisplay) {
      return html`<span class="text-body-secondary">در دسترس از ${nextActiveDisplay}</span>`;
    }
    return html`<span class="text-body-secondary">هنوز فعال نشده است</span>`;
  }
  const creditDateString = authzResult.credit_date_string ?? 'None';
  if (creditDateString === 'None') return null;
  if (row.assessment_instance_open !== false) {
    return formatStudentCreditDisplay(authzResult, displayTimezone);
  }
  return html`تکلیف به پایان رسیده است.`;
}

function AccessSchedule({
  row,
  displayTimezone,
}: {
  row: StudentAssessmentsRow;
  displayTimezone: string;
}) {
  if (
    (row.modern_access_control &&
      row.assessment_instance_id == null &&
      !row.authz_result.authorized) ||
    row.assessment_instance_open === false ||
    (row.authz_result.credit_date_string ?? 'None') === 'None'
  ) {
    return '';
  }

  return row.modern_access_control
    ? StudentAccessTimelineSchedule({
        accessTimeline: row.authz_result.access_timeline,
        displayTimezone,
      })
    : StudentAccessRulesSchedule({
        accessRules: row.authz_result.access_rules,
        displayTimezone,
      });
}
