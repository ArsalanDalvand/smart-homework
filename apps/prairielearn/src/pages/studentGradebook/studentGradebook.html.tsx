import { PageLayout } from '../../components/PageLayout.js';
import { Scorebar } from '../../components/Scorebar.js';
import { assetPath } from '../../lib/assets.js';
import { toPersianDigits } from '../../lib/jalali.js';
import type { ResLocalsForPage } from '../../lib/res-locals.js';
import {
  MIN_ANALYTICS_COHORT,
  type StudentActivityAndBadges,
  type StudentAnalyticsData,
} from '../../lib/student-engagement.js';
import type {
  AchievementTier,
  StudentAchievement,
  StudentGamificationProfile,
  WeeklyQuestsBundle,
} from '../../lib/student-gamification.js';

export interface StudentGradebookTableRow {
  assessment_id: string;
  assessment_instance_id: string;
  assessment_group_work: boolean;
  title: string;
  assessment_set_heading: string;
  assessment_set_color: string;
  label: string;
  assessment_instance_score_perc: number | null;
  show_closed_assessment_score: boolean;
  start_new_set: boolean;
}

function StudentAnalyticsSection({ data }: { data: StudentAnalyticsData }) {
  const maxHistCount = Math.max(1, ...data.overallHistogram.map((b) => b.count));

  return (
    <section className="se-section mb-4" aria-label="تحلیل وضعیت و آمار دانشجو">
      {/* Hairline-Divided Stat Summary Strip */}
      <div className="sh-stat-strip mb-3">
        <div className="sh-stat-cell">
          <div className="sh-stat-label">میانگین نمره تمرین‌ها</div>
          <div className="sh-stat-value" dir="ltr">
            {data.studentOverallScore !== null
              ? `${toPersianDigits(data.studentOverallScore)}٪`
              : '—'}
          </div>
          <div className="sh-stat-sub">عملکرد کل سری‌های تمرین</div>
        </div>

        <div className="sh-stat-cell">
          <div className="sh-stat-label">جایگاه در کلاس</div>
          <div className="sh-stat-value">
            {data.hasEnoughCohortForStanding && data.percentileTop !== null
              ? `جزو ${toPersianDigits(data.percentileTop)}٪ برتر`
              : 'در انتظار حد نصاب'}
          </div>
          <div className="sh-stat-sub">
            {data.hasEnoughCohortForStanding
              ? `بین ${toPersianDigits(data.cohortCount)} دانشجوی فعال`
              : `نیازمند حداقل ${toPersianDigits(MIN_ANALYTICS_COHORT)} شرکت‌کننده`}
          </div>
        </div>

        <div className="sh-stat-cell">
          <div className="sh-stat-label">سوالات حل‌شده</div>
          <div className="sh-stat-value">{toPersianDigits(data.solvedQuestions)} سوال</div>
          <div className="sh-stat-sub">
            از {toPersianDigits(data.attemptedQuestions)} تلاش‌شده (
            {toPersianDigits(data.partialQuestions)} ناقص)
          </div>
        </div>

        <div className="sh-stat-cell">
          <div className="sh-stat-label">نرخ قبولی ارسال‌ها</div>
          <div className="sh-stat-value" dir="ltr">
            {data.acceptanceRate !== null ? `${toPersianDigits(data.acceptanceRate)}٪` : '—'}
          </div>
          <div className="sh-stat-sub">
            {toPersianDigits(data.acceptedSubmissions)} از {toPersianDigits(data.totalSubmissions)}{' '}
            ارسال
          </div>
        </div>
      </div>

      {/* Distribution Histogram + Per-Assessment Class Comparison */}
      <div className="row g-3">
        <div className="col-lg-6">
          <div className="se-card h-100">
            <div className="se-card-header">
              <h2 className="se-card-title">
                <i className="bi bi-bar-chart text-body-secondary" aria-hidden="true" />
                <span>توزیع نمرات کلاس و جایگاه شما</span>
              </h2>
              {data.hasEnoughCohortForStanding &&
                data.classMean !== null &&
                data.classMedian !== null && (
                  <span className="small text-body-secondary sh-tabular">
                    میانگین: <strong>{toPersianDigits(data.classMean)}٪</strong> • میانه:{' '}
                    <strong>{toPersianDigits(data.classMedian)}٪</strong>
                  </span>
                )}
            </div>
            <div className="p-3">
              {!data.hasEnoughCohortForStanding ? (
                <div className="alert bg-body-tertiary border text-body-secondary small mb-0">
                  <i className="bi bi-shield-check me-1" aria-hidden="true" />
                  برای حفظ حریم خصوصی دانشجویان، هیستوگرام توزیع نمرات کلاس پس از مشارکت حداقل{' '}
                  <strong>{toPersianDigits(MIN_ANALYTICS_COHORT)}</strong> دانشجو نمایش داده می‌شود.
                </div>
              ) : (
                <>
                  <div className="se-hist-wrap">
                    {data.overallHistogram.map((bucket) => {
                      const heightPct = Math.round((bucket.count / maxHistCount) * 100);
                      return (
                        <div
                          key={bucket.label}
                          className={`se-hist-col ${bucket.isCurrentUser ? 'se-bar-mine' : ''}`}
                        >
                          {bucket.isCurrentUser && <span className="se-hist-mine-tag">شما</span>}
                          <span className="se-hist-count">{toPersianDigits(bucket.count)}</span>
                          <div className="se-hist-bar-track">
                            <div
                              className="se-hist-bar"
                              style={{
                                height: `${Math.max(bucket.count > 0 ? 8 : 3, heightPct)}%`,
                              }}
                              title={`${bucket.label}: ${toPersianDigits(bucket.count)} دانشجو`}
                            />
                          </div>
                          <span className="se-hist-label">{bucket.label}</span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="text-center text-body-secondary small mt-2">
                    نمودار کاملاً ناشناس است؛ ستون پررنگ بازه تقریبی شما را نشان می‌دهد.
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="col-lg-6">
          <div className="se-card h-100">
            <div className="se-card-header">
              <h2 className="se-card-title">
                <i className="bi bi-sliders text-body-secondary" aria-hidden="true" />
                <span>مقایسه عملکرد در هر سری تمرین</span>
              </h2>
              <span className="small text-body-secondary">
                <span
                  className="d-inline-block rounded me-1"
                  style={{ width: 10, height: 10, backgroundColor: 'var(--sh-warning, #b45309)' }}
                />
                میانگین کلاس
              </span>
            </div>
            <div className="p-3">
              {data.assessmentComparisons.length === 0 ? (
                <div className="text-body-secondary small">
                  هنوز سری تمرینی برای مقایسه ثبت نشده است.
                </div>
              ) : (
                data.assessmentComparisons.map((item) => {
                  const myPct = Math.max(0, Math.min(100, item.studentScore ?? 0));
                  const avgPct =
                    item.classAvg !== null ? Math.max(0, Math.min(100, item.classAvg)) : null;
                  return (
                    <div key={item.assessmentId} className="se-cmp-row">
                      <div className="d-flex justify-content-between align-items-center small">
                        <span className="fw-semibold text-body">
                          <span className="badge bg-body-tertiary text-body border me-1" dir="ltr">
                            {item.label}
                          </span>
                          {item.title}
                        </span>
                        <span className="text-body-secondary text-nowrap sh-tabular">
                          شما:{' '}
                          <strong className="text-body">
                            {item.studentScore !== null
                              ? `${toPersianDigits(item.studentScore)}٪`
                              : 'شروع نشده'}
                          </strong>
                        </span>
                      </div>
                      <div className="se-cmp-track" dir="ltr">
                        <div className="se-cmp-fill" style={{ width: `${myPct}%` }} />
                        {avgPct !== null && (
                          <span
                            className="se-cmp-avg-pin"
                            style={{ left: `calc(${avgPct}% - 1.5px)` }}
                            title={`میانگین کلاس: ${toPersianDigits(item.classAvg!)}٪`}
                          />
                        )}
                      </div>
                      <div
                        className="d-flex justify-content-between text-body-secondary sh-tabular"
                        style={{ fontSize: '0.73rem' }}
                      >
                        {item.classAvg !== null ? (
                          <>
                            <span>
                              میانگین: {toPersianDigits(item.classAvg)}٪ | میانه:{' '}
                              {toPersianDigits(item.classMedian ?? 0)}٪
                            </span>
                            <span>بیشترین: {toPersianDigits(item.classMax ?? 0)}٪</span>
                          </>
                        ) : (
                          <span>
                            آمار کلاسی پس از شرکت {toPersianDigits(MIN_ANALYTICS_COHORT)} دانشجو
                            نمایان می‌شود
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function StudentHeatmapAndBadgesSection({
  data,
  showLegacyBadges = true,
}: {
  data: StudentActivityAndBadges;
  showLegacyBadges?: boolean;
}) {
  const weekdayLabels = [
    { id: 'sat', label: 'ش' },
    { id: 'sun', label: '' },
    { id: 'mon', label: 'د' },
    { id: 'tue', label: '' },
    { id: 'wed', label: 'چ' },
    { id: 'thu', label: '' },
    { id: 'fri', label: 'ج' },
  ];
  const earnedCount = data.badges.filter((b) => b.earned).length;

  return (
    <section className="se-section mb-4" aria-label="فعالیت شمسی و نشان‌های انگیزشی">
      <div className="se-card">
        <div className="se-card-header">
          <h2 className="se-card-title">
            <i className="bi bi-calendar3 text-body-secondary" aria-hidden="true" />
            <span>نقشه فعالیت روزانه (تقویم شمسی){showLegacyBadges ? ' و دستاوردها' : ''}</span>
          </h2>
          <div className="d-flex flex-wrap align-items-center gap-2 small sh-tabular">
            <span className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle px-2 py-1">
              <i className="bi bi-fire me-1" aria-hidden="true" />
              <span className="sh-en-term">Streak</span> فعلی:{' '}
              {toPersianDigits(data.currentStreakDays)} روز
            </span>
            <span className="badge bg-body-tertiary text-body border px-2 py-1">
              رکورد <span className="sh-en-term">Streak</span>:{' '}
              {toPersianDigits(data.longestStreakDays)} روز
            </span>
            <span className="badge bg-body-tertiary text-body border px-2 py-1">
              {toPersianDigits(data.totalSubmissions140d)} ارسال در{' '}
              {toPersianDigits(data.activeDaysCount)} روز فعال
            </span>
          </div>
        </div>

        <div className="p-3">
          {/* Heatmap Grid */}
          <div className="se-heatmap-scroll mb-3">
            <div className="se-heatmap-board">
              <div className="se-heatmap-weekdays" aria-hidden="true">
                <span />
                {weekdayLabels.map((day) => (
                  <span key={day.id} style={{ lineHeight: '13px' }}>
                    {day.label}
                  </span>
                ))}
              </div>
              <div className="se-heatmap-weeks">
                {data.weeks.map((week) => (
                  <div key={week.cells[0].dateKey} className="se-heatmap-col">
                    <span className="se-heatmap-month">{week.monthLabel ?? ''}</span>
                    {week.cells.map((cell) => (
                      <div
                        key={cell.dateKey}
                        className={`se-hm-cell se-hm-l${cell.level} ${cell.isToday ? 'se-hm-today' : ''}`}
                        title={`${cell.jalaliDateLabel}: ${toPersianDigits(cell.count)} ارسال`}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div
            className={`d-flex align-items-center justify-content-between flex-wrap gap-2 small text-body-secondary ${
              showLegacyBadges ? 'mb-3 pb-3 border-bottom' : ''
            }`}
          >
            <span>۲۰ هفته اخیر (ستون‌ها از شنبه تا جمعه بر اساس تقویم شمسی)</span>
            <div className="d-flex align-items-center gap-1" dir="ltr">
              <span className="me-1">کمتر</span>
              <span className="se-hm-cell se-hm-l0" />
              <span className="se-hm-cell se-hm-l1" />
              <span className="se-hm-cell se-hm-l2" />
              <span className="se-hm-cell se-hm-l3" />
              <span className="se-hm-cell se-hm-l4" />
              <span className="ms-1">بیشتر</span>
            </div>
          </div>

          {showLegacyBadges && (
            <>
              {/* Badges Row */}
              <div className="d-flex align-items-center justify-content-between mb-2">
                <h3 className="h6 fw-bold mb-0">
                  <i className="bi bi-award text-body-secondary me-1" aria-hidden="true" />
                  نشان‌ها و دستاوردها ({toPersianDigits(earnedCount)} از{' '}
                  {toPersianDigits(data.badges.length)})
                </h3>
              </div>
              <div className="row g-2">
                {data.badges.map((badge) => (
                  <div key={badge.id} className="col-md-6 col-xl">
                    <div className={`se-badge-card ${badge.earned ? 'is-earned' : 'is-locked'}`}>
                      <span className={`se-badge-medal se-medal-${badge.accentColor}`}>
                        <i className={badge.iconClass} aria-hidden="true" />
                      </span>
                      <div className="min-w-0">
                        <div className="fw-bold small text-body d-flex align-items-center gap-1">
                          <span className="sh-en-term">{badge.title}</span>
                          {badge.earned && (
                            <i className="bi bi-check-circle-fill text-success" title="کسب شده" />
                          )}
                        </div>
                        <div className="text-body-secondary" style={{ fontSize: '0.73rem' }}>
                          {badge.description}
                        </div>
                        <div
                          className={`mt-1 fw-medium ${badge.earned ? 'text-success' : 'text-body-secondary'}`}
                          style={{ fontSize: '0.72rem' }}
                        >
                          {badge.progressText}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

function LevelHeroBanner({
  profile,
  skillsUrl,
}: {
  profile: StudentGamificationProfile;
  skillsUrl: string | null;
}) {
  const { level, streak, xp, unlockedAchievementIds, achievements } = profile;

  return (
    <section className="se-section mb-4" aria-label="سطح و پیشرفت تجربه">
      <div className="sh-level-hero">
        <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
          <div className="d-flex align-items-center gap-3">
            <div className="sh-level-emblem sh-tabular">
              <span className="sh-en-term small">Lv.</span>
              <span className="sh-level-num">{toPersianDigits(level.level)}</span>
            </div>
            <div>
              <div className="d-flex flex-wrap align-items-center gap-2">
                <h1 className="h5 fw-bold mb-0 sh-en-term text-body">{level.title}</h1>
                <span className="text-body-secondary small">— {level.subtitleFa}</span>
              </div>
              <div className="small text-body-secondary mt-1 sh-tabular">
                مجموع تجربه: <strong className="text-body">{toPersianDigits(xp.totalXp)}</strong>{' '}
                <span className="sh-en-term fw-bold text-body">XP</span>
                {' · '}
                <span>
                  {toPersianDigits(unlockedAchievementIds.length)} از{' '}
                  {toPersianDigits(achievements.length)} دستاورد
                </span>
              </div>
            </div>
          </div>

          <div className="d-flex flex-wrap align-items-center gap-2">
            {streak.current > 0 && (
              <span className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle px-2 py-2 sh-tabular">
                <i className="bi bi-fire me-1" aria-hidden="true" />
                <span className="sh-en-term">Streak</span> فعلی: {toPersianDigits(streak.current)}{' '}
                روز
              </span>
            )}
            {skillsUrl && (
              <a href={skillsUrl} className="btn btn-outline-primary btn-sm">
                <i className="bi bi-diagram-3 me-1" aria-hidden="true" />
                <span className="sh-en-term">Skill Tree</span>
              </a>
            )}
          </div>
        </div>

        <div className="mt-3">
          <div className="d-flex justify-content-between small text-body-secondary mb-1 sh-tabular">
            <span>
              پیشرفت به <span className="sh-en-term">Level {toPersianDigits(level.level + 1)}</span>
            </span>
            <span dir="ltr" className="sh-en-term">
              {toPersianDigits(level.xpIntoLevel)} / {toPersianDigits(level.xpNeededForNext)} XP (
              {toPersianDigits(level.progressPerc)}٪)
            </span>
          </div>
          <div className="progress" style={{ height: '9px' }}>
            <div
              className="progress-bar sh-progress-brand"
              style={{ width: `${level.progressPerc}%` }}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function WeeklyQuestsSection({ weeklyQuests }: { weeklyQuests: WeeklyQuestsBundle }) {
  return (
    <div className="se-card mb-4">
      <div className="se-card-header">
        <h2 className="se-card-title">
          <i className="bi bi-flag text-body-secondary" aria-hidden="true" />
          <span className="sh-en-term">Weekly Quests</span>
          <span className="small text-body-secondary fw-normal">— {weeklyQuests.weekLabel}</span>
        </h2>
        <span className="badge bg-body-tertiary text-body border sh-tabular">
          <i className="bi bi-clock me-1" aria-hidden="true" />
          <span data-deadline-iso={weeklyQuests.weekEndsAtIso}>تا پایان هفته شمسی</span>
        </span>
      </div>
      <div className="p-3">
        <div className="sh-quest-strip">
          {weeklyQuests.quests.map((quest) => (
            <div
              key={quest.id}
              className={`sh-quest-card ${quest.completed ? 'is-completed' : ''}`}
            >
              <div className="d-flex align-items-center justify-content-between gap-2 mb-1">
                <span className="fw-bold small d-flex align-items-center gap-1">
                  <i
                    className={
                      quest.completed ? 'bi bi-check-circle-fill text-success' : quest.iconClass
                    }
                    aria-hidden="true"
                  />
                  <span className="sh-en-term">{quest.title}</span>
                </span>
                <span className="badge bg-body-tertiary text-body border sh-en-term sh-tabular">
                  +{toPersianDigits(quest.xpReward)} XP
                </span>
              </div>
              <div className="small text-body-secondary mb-2">{quest.description}</div>
              <div className="d-flex align-items-center gap-2">
                <div className="progress flex-grow-1" style={{ height: '7px' }}>
                  <div
                    className={`progress-bar ${quest.completed ? 'sh-progress-success' : 'sh-progress-brand'}`}
                    style={{ width: `${quest.progressPerc}%` }}
                  />
                </div>
                <span className="small text-body-secondary sh-tabular">
                  {toPersianDigits(quest.current)} از {toPersianDigits(quest.target)}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const TIER_LABELS: Record<AchievementTier, string> = {
  none: 'قفل‌شده',
  bronze: 'Bronze',
  silver: 'Silver',
  gold: 'Gold',
  diamond: 'Diamond',
  secret: 'Unlocked',
};

function TieredAndSecretAchievementsSection({
  achievements,
}: {
  achievements: StudentAchievement[];
}) {
  const tiered = achievements.filter((a) => a.category === 'tiered');
  const secrets = achievements.filter((a) => a.category === 'secret');
  const unlockedCount = achievements.filter((a) => a.earned).length;

  return (
    <section className="se-section mb-4" aria-label="دستاوردهای چندسطحی و مخفی">
      <div className="se-card mb-4">
        <div className="se-card-header">
          <h2 className="se-card-title">
            <i className="bi bi-award text-body-secondary" aria-hidden="true" />
            <span>دستاوردهای پلکانی</span>
          </h2>
          <span className="badge bg-body-tertiary text-body border sh-tabular">
            {toPersianDigits(unlockedCount)} از {toPersianDigits(achievements.length)} باز شده
          </span>
        </div>
        <div className="p-3">
          <div className="row g-3">
            {tiered.map((ach) => {
              const tierOrder: AchievementTier[] = ['bronze', 'silver', 'gold', 'diamond'];
              const activeTierIdx = tierOrder.indexOf(ach.tier);
              return (
                <div key={ach.id} className="col-md-6">
                  <div className={`sh-ach-card ${ach.earned ? 'is-earned' : 'is-locked'}`}>
                    <div className="d-flex align-items-start gap-3">
                      <span className={`sh-ach-icon sh-tier-${ach.tier}`}>
                        <i className={ach.iconClass} aria-hidden="true" />
                      </span>
                      <div className="flex-grow-1 min-w-0">
                        <div className="d-flex flex-wrap align-items-center justify-content-between gap-2">
                          <span className="fw-bold text-body sh-en-term">{ach.title}</span>
                          <div className="d-flex align-items-center gap-2">
                            <span
                              className={`sh-tier-pill sh-tier-${ach.tier} ${ach.tier !== 'none' ? 'sh-en-term' : ''}`}
                            >
                              {TIER_LABELS[ach.tier]}
                            </span>
                          </div>
                        </div>
                        <div className="small text-body-secondary mt-1">{ach.description}</div>
                        <div className="d-flex align-items-center gap-2 mt-2">
                          <div className="progress flex-grow-1" style={{ height: '7px' }}>
                            <div
                              className={`progress-bar ${ach.earned ? 'sh-progress-success' : 'sh-progress-brand'}`}
                              style={{ width: `${ach.progressPerc}%` }}
                            />
                          </div>
                          <span className="small text-body-secondary sh-tabular">
                            {ach.progressText}
                          </span>
                        </div>
                        <div className="sh-tier-pips mt-2" aria-hidden="true">
                          {tierOrder.map((tName, tIdx) => (
                            <span
                              key={tName}
                              className={`sh-tier-pip sh-tier-${tName} ${tIdx <= activeTierIdx ? 'is-filled' : ''}`}
                              title={tName}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      <div className="se-card">
        <div className="se-card-header">
          <h2 className="se-card-title">
            <i className="bi bi-incognito text-body-secondary" aria-hidden="true" />
            <span>دستاوردهای مخفی</span>
          </h2>
          <span className="small text-body-secondary sh-tabular">
            {toPersianDigits(secrets.filter((s) => s.earned).length)} از{' '}
            {toPersianDigits(secrets.length)} کشف‌شده
          </span>
        </div>
        <div className="p-3">
          <div className="row g-3">
            {secrets.map((sec) => (
              <div key={sec.id} className="col-md-6 col-lg-4">
                <div
                  className={`sh-ach-card h-100 ${sec.earned ? 'is-earned' : 'is-secret-locked'}`}
                >
                  <div className="d-flex align-items-start gap-3">
                    <span
                      className={`sh-ach-icon ${sec.earned ? 'sh-tier-secret' : 'sh-tier-none'}`}
                    >
                      <i
                        className={sec.earned ? sec.iconClass : 'bi bi-question-lg'}
                        aria-hidden="true"
                      />
                    </span>
                    <div className="min-w-0">
                      <div className="d-flex align-items-center gap-2">
                        <span className="fw-bold small text-body sh-en-term">
                          {sec.earned ? sec.title : 'Secret Achievement'}
                        </span>
                        {sec.earned && (
                          <span className="badge bg-body-tertiary text-body border sh-en-term sh-tabular">
                            +{toPersianDigits(sec.xpReward)} XP
                          </span>
                        )}
                      </div>
                      <div className="small text-body-secondary mt-1">
                        {sec.earned ? sec.description : sec.secretHint}
                      </div>
                      <div
                        className={`mt-2 small fw-medium ${sec.earned ? 'text-success' : 'text-body-secondary'}`}
                      >
                        {sec.progressText}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

export function StudentGradebook({
  resLocals,
  rows,
  csvFilename,
  analyticsData,
  activityData,
  gamificationProfile = null,
  showXpLevels = false,
  showAchievements = false,
  showWeeklyQuests = false,
  showSkillTreeLink = false,
}: {
  resLocals: ResLocalsForPage<'course-instance'>;
  rows: StudentGradebookTableRow[];
  csvFilename: string;
  analyticsData: StudentAnalyticsData | null;
  activityData: StudentActivityAndBadges | null;
  gamificationProfile?: StudentGamificationProfile | null;
  showXpLevels?: boolean;
  showAchievements?: boolean;
  showWeeklyQuests?: boolean;
  showSkillTreeLink?: boolean;
}) {
  const assessmentGroups: StudentGradebookTableRow[][] = [];
  rows.forEach((row) => {
    if (row.start_new_set || assessmentGroups.length === 0) {
      assessmentGroups.push([row]);
    } else {
      assessmentGroups[assessmentGroups.length - 1].push(row);
    }
  });

  const hasActivityTab =
    activityData !== null || (showWeeklyQuests && gamificationProfile !== null);
  const hasAchievementsTab =
    (showAchievements && gamificationProfile !== null) || activityData !== null;
  const useTabs = hasActivityTab || hasAchievementsTab;

  const showLevelHero = Boolean(showXpLevels && gamificationProfile);
  const gradebookTableCard = (
    <div className="card mb-4">
      <div className="card-header bg-primary text-white sh-hero-header d-flex align-items-center">
        {showLevelHero ? (
          <h2 className="h4 mb-0">کارنامه و نمرات دانشجو</h2>
        ) : (
          <h1 className="h4 mb-0">کارنامه و نمرات دانشجو</h1>
        )}
        <a
          href={`/pl/course_instance/${resLocals.course_instance.id}/gradebook/${csvFilename}`}
          className="btn btn-light btn-sm ms-auto"
          aria-label="دانلود کارنامه CSV"
        >
          <i className="fas fa-download me-1" aria-hidden="true" />
          <span className="d-none d-sm-inline">دریافت کارنامه (CSV)</span>
        </a>
      </div>

      {rows.length === 0 ? (
        <div className="card-body">
          <div className="text-body-secondary">در حال حاضر موردی در کارنامه ثبت نشده است.</div>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table table-sm table-hover sh-question-table mb-0" aria-label="کارنامه">
            <thead>
              <tr>
                <th style={{ width: '5%' }}>کد</th>
                <th>عنوان ارزیابی</th>
                <th className="text-center" style={{ width: '25%' }}>
                  نمره نهایی
                </th>
              </tr>
            </thead>
            {assessmentGroups.map((groupRows) => (
              <tbody key={groupRows[0].assessment_id}>
                <tr className="sh-zone-row">
                  <th colSpan={3} scope="rowgroup">
                    {groupRows[0].assessment_set_heading}
                  </th>
                </tr>
                {groupRows.map((row) => (
                  <tr key={`${row.assessment_id}-${row.assessment_instance_id}`}>
                    <td className="align-middle" style={{ width: '1%' }}>
                      <span className={`badge color-${row.assessment_set_color}`}>{row.label}</span>
                    </td>
                    <td className="align-middle">
                      {row.title}{' '}
                      {row.assessment_group_work && (
                        <i className="fas fa-users" aria-hidden="true" />
                      )}
                    </td>
                    <td className="text-center align-middle">
                      {row.show_closed_assessment_score ? (
                        <Scorebar score={row.assessment_instance_score_perc} className="mx-auto" />
                      ) : (
                        'نمره پنهان است'
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            ))}
          </table>
        </div>
      )}
    </div>
  );

  return PageLayout({
    resLocals,
    pageTitle: 'کارنامه و نمرات',
    navContext: {
      type: 'student',
      page: 'gradebook',
    },
    headContent: (
      <>
        <link href={assetPath('stylesheets/student-engagement.css')} rel="stylesheet" />
        <script src={assetPath('javascripts/student-ux.js')} defer />
        {showWeeklyQuests && (
          <script src={assetPath('javascripts/student-deadline-radar.js')} defer />
        )}
      </>
    ),
    content: (
      <div style={{ fontFamily: 'var(--font-persian)' }}>
        {showXpLevels && gamificationProfile && (
          <LevelHeroBanner
            profile={gamificationProfile}
            skillsUrl={showSkillTreeLink ? `${resLocals.urlPrefix}/skills` : null}
          />
        )}

        {useTabs ? (
          <>
            <ul className="nav nav-tabs sh-tabs mb-4" id="sh-gradebook-tabs" role="tablist">
              <li className="nav-item" role="presentation">
                <button
                  className="nav-link active"
                  id="sh-tab-overview-btn"
                  data-bs-toggle="tab"
                  data-bs-target="#tab-overview"
                  type="button"
                  role="tab"
                  aria-controls="tab-overview"
                  aria-selected="true"
                >
                  <i className="bi bi-table me-1" aria-hidden="true" />
                  کارنامه و تحلیل کلاس
                </button>
              </li>
              {hasActivityTab && (
                <li className="nav-item" role="presentation">
                  <button
                    className="nav-link"
                    id="sh-tab-activity-btn"
                    data-bs-toggle="tab"
                    data-bs-target="#tab-activity"
                    type="button"
                    role="tab"
                    aria-controls="tab-activity"
                    aria-selected="false"
                  >
                    <i className="bi bi-calendar3 me-1" aria-hidden="true" />
                    فعالیت{showWeeklyQuests ? ' و Weekly Quests' : ''}
                  </button>
                </li>
              )}
              {hasAchievementsTab && (
                <li className="nav-item" role="presentation">
                  <button
                    className="nav-link"
                    id="sh-tab-achievements-btn"
                    data-bs-toggle="tab"
                    data-bs-target="#tab-achievements"
                    type="button"
                    role="tab"
                    aria-controls="tab-achievements"
                    aria-selected="false"
                  >
                    <i className="bi bi-award me-1" aria-hidden="true" />
                    دستاوردها و مدال‌ها
                  </button>
                </li>
              )}
            </ul>

            <div className="tab-content">
              <div
                className="tab-pane fade show active"
                id="tab-overview"
                role="tabpanel"
                aria-labelledby="sh-tab-overview-btn"
              >
                {analyticsData && <StudentAnalyticsSection data={analyticsData} />}
                {gradebookTableCard}
              </div>

              {hasActivityTab && (
                <div
                  className="tab-pane fade"
                  id="tab-activity"
                  role="tabpanel"
                  aria-labelledby="sh-tab-activity-btn"
                >
                  {showWeeklyQuests && gamificationProfile && (
                    <WeeklyQuestsSection weeklyQuests={gamificationProfile.weeklyQuests} />
                  )}
                  {activityData && (
                    <StudentHeatmapAndBadgesSection
                      data={activityData}
                      showLegacyBadges={!showAchievements || !gamificationProfile}
                    />
                  )}
                </div>
              )}

              {hasAchievementsTab && (
                <div
                  className="tab-pane fade"
                  id="tab-achievements"
                  role="tabpanel"
                  aria-labelledby="sh-tab-achievements-btn"
                >
                  {showAchievements && gamificationProfile ? (
                    <TieredAndSecretAchievementsSection
                      achievements={gamificationProfile.achievements}
                    />
                  ) : (
                    activityData && <StudentHeatmapAndBadgesSection data={activityData} />
                  )}
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            {analyticsData && <StudentAnalyticsSection data={analyticsData} />}
            {gradebookTableCard}
          </>
        )}
      </div>
    ),
  });
}
