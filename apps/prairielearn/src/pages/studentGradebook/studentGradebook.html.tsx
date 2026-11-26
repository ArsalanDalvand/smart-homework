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
      {/* KPI Summary Cards */}
      <div className="row g-3 mb-3">
        <div className="col-6 col-lg-3">
          <div className="se-kpi-card d-flex align-items-center gap-3">
            <span className="se-kpi-icon se-kpi-icon-blue">
              <i className="fas fa-chart-line" aria-hidden="true" />
            </span>
            <div>
              <div className="se-kpi-value" dir="ltr">
                {data.studentOverallScore !== null
                  ? `${toPersianDigits(data.studentOverallScore)}٪`
                  : '—'}
              </div>
              <div className="se-kpi-label">میانگین نمره تمرین‌ها</div>
            </div>
          </div>
        </div>

        <div className="col-6 col-lg-3">
          <div className="se-kpi-card d-flex align-items-center gap-3">
            <span className="se-kpi-icon se-kpi-icon-purple">
              <i className="fas fa-ranking-star" aria-hidden="true" />
            </span>
            <div>
              <div className="se-kpi-value">
                {data.hasEnoughCohortForStanding && data.percentileTop !== null
                  ? `جزو ${toPersianDigits(data.percentileTop)}٪ برتر`
                  : 'در انتظار حد نصاب'}
              </div>
              <div className="se-kpi-label">
                {data.hasEnoughCohortForStanding
                  ? `جایگاه تقریبی بین ${toPersianDigits(data.cohortCount)} دانشجو`
                  : `نیازمند حداقل ${toPersianDigits(MIN_ANALYTICS_COHORT)} شرکت‌کننده`}
              </div>
            </div>
          </div>
        </div>

        <div className="col-6 col-lg-3">
          <div className="se-kpi-card d-flex align-items-center gap-3">
            <span className="se-kpi-icon se-kpi-icon-green">
              <i className="fas fa-circle-check" aria-hidden="true" />
            </span>
            <div>
              <div className="se-kpi-value">
                {toPersianDigits(data.solvedQuestions)} سوال
              </div>
              <div className="se-kpi-label">
                از {toPersianDigits(data.attemptedQuestions)} سوال تلاش‌شده (
                {toPersianDigits(data.partialQuestions)} ناقص)
              </div>
            </div>
          </div>
        </div>

        <div className="col-6 col-lg-3">
          <div className="se-kpi-card d-flex align-items-center gap-3">
            <span className="se-kpi-icon se-kpi-icon-amber">
              <i className="fas fa-bullseye" aria-hidden="true" />
            </span>
            <div>
              <div className="se-kpi-value" dir="ltr">
                {data.acceptanceRate !== null ? `${toPersianDigits(data.acceptanceRate)}٪` : '—'}
              </div>
              <div className="se-kpi-label">
                نرخ قبولی ({toPersianDigits(data.acceptedSubmissions)} از{' '}
                {toPersianDigits(data.totalSubmissions)} ارسال)
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Distribution Histogram + Per-Assessment Class Comparison */}
      <div className="row g-3">
        <div className="col-lg-6">
          <div className="se-card h-100">
            <div className="se-card-header">
              <h2 className="se-card-title">
                <i className="fas fa-chart-column text-primary" aria-hidden="true" />
                <span>توزیع نمرات کلاس و جایگاه شما</span>
              </h2>
              {data.hasEnoughCohortForStanding && data.classMean !== null && data.classMedian !== null && (
                <span className="small text-secondary">
                  میانگین: <strong>{toPersianDigits(data.classMean)}٪</strong> • میانه:{' '}
                  <strong>{toPersianDigits(data.classMedian)}٪</strong>
                </span>
              )}
            </div>
            <div className="p-3">
              {!data.hasEnoughCohortForStanding ? (
                <div className="alert alert-light border text-secondary small mb-0">
                  <i className="fas fa-shield-halved me-1 text-primary" aria-hidden="true" />
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
                              style={{ height: `${Math.max(bucket.count > 0 ? 8 : 3, heightPct)}%` }}
                              title={`${bucket.label}: ${toPersianDigits(bucket.count)} دانشجو`}
                            />
                          </div>
                          <span className="se-hist-label">{bucket.label}</span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="text-center text-secondary small mt-2">
                    نمودار کاملاً ناشناس است؛ میله آبی نشان‌دهنده بازه تقریبی شماست.
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
                <i className="fas fa-scale-balanced text-success" aria-hidden="true" />
                <span>مقایسه عملکرد در هر سری تمرین</span>
              </h2>
              <span className="small text-secondary">
                <span
                  className="d-inline-block rounded me-1"
                  style={{ width: 10, height: 10, backgroundColor: '#f59e0b' }}
                />
                میانگین کلاس
              </span>
            </div>
            <div className="p-3">
              {data.assessmentComparisons.length === 0 ? (
                <div className="text-muted small">هنوز سری تمرینی برای مقایسه ثبت نشده است.</div>
              ) : (
                data.assessmentComparisons.map((item) => {
                  const myPct = Math.max(0, Math.min(100, item.studentScore ?? 0));
                  const avgPct =
                    item.classAvg !== null ? Math.max(0, Math.min(100, item.classAvg)) : null;
                  return (
                    <div key={item.assessmentId} className="se-cmp-row">
                      <div className="d-flex justify-content-between align-items-center small">
                        <span className="fw-semibold text-dark">
                          <span className="badge text-bg-light border me-1" dir="ltr">
                            {item.label}
                          </span>
                          {item.title}
                        </span>
                        <span className="text-secondary text-nowrap">
                          شما:{' '}
                          <strong className="text-primary">
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
                      <div className="d-flex justify-content-between text-secondary" style={{ fontSize: '0.73rem' }}>
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
                            آمار کلاسی پس از شرکت {toPersianDigits(MIN_ANALYTICS_COHORT)} دانشجو نمایان می‌شود
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

function StudentHeatmapAndBadgesSection({ data }: { data: StudentActivityAndBadges }) {
  const weekdayLabels = ['ش', '', 'د', '', 'چ', '', 'ج'];
  const earnedCount = data.badges.filter((b) => b.earned).length;

  return (
    <section className="se-section mb-4" aria-label="فعالیت شمسی و نشان‌های انگیزشی">
      <div className="se-card">
        <div className="se-card-header">
          <h2 className="se-card-title">
            <i className="fas fa-calendar-days text-success" aria-hidden="true" />
            <span>نقشه فعالیت روزانه (تقویم شمسی) و دستاوردها</span>
          </h2>
          <div className="d-flex flex-wrap align-items-center gap-2 small">
            <span className="badge text-bg-warning text-dark px-2 py-1">
              <i className="fas fa-fire me-1" aria-hidden="true" />
              زنجیره فعلی: {toPersianDigits(data.currentStreakDays)} روز
            </span>
            <span className="badge text-bg-light border text-dark px-2 py-1">
              رکورد زنجیره: {toPersianDigits(data.longestStreakDays)} روز
            </span>
            <span className="badge text-bg-light border text-dark px-2 py-1">
              {toPersianDigits(data.totalSubmissions140d)} ارسال در {toPersianDigits(data.activeDaysCount)}{' '}
              روز فعال
            </span>
          </div>
        </div>

        <div className="p-3">
          {/* Heatmap Grid */}
          <div className="se-heatmap-scroll mb-3">
            <div className="se-heatmap-board">
              <div className="se-heatmap-weekdays" aria-hidden="true">
                <span />
                {weekdayLabels.map((lbl, idx) => (
                  <span key={idx} style={{ lineHeight: '13px' }}>
                    {lbl}
                  </span>
                ))}
              </div>
              <div className="se-heatmap-weeks">
                {data.weeks.map((week, wIdx) => (
                  <div key={wIdx} className="se-heatmap-col">
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

          <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 small text-secondary mb-3 pb-3 border-bottom">
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

          {/* Badges Row */}
          <div className="d-flex align-items-center justify-content-between mb-2">
            <h3 className="h6 fw-bold mb-0">
              <i className="fas fa-medal text-warning me-1" aria-hidden="true" />
              نشان‌ها و مدال‌های من ({toPersianDigits(earnedCount)} از{' '}
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
                    <div className="fw-bold small text-dark d-flex align-items-center gap-1">
                      <span>{badge.title}</span>
                      {badge.earned && (
                        <i className="fas fa-circle-check text-success" title="کسب شده" />
                      )}
                    </div>
                    <div className="text-secondary" style={{ fontSize: '0.73rem' }}>
                      {badge.description}
                    </div>
                    <div
                      className={`mt-1 fw-medium ${badge.earned ? 'text-success' : 'text-muted'}`}
                      style={{ fontSize: '0.72rem' }}
                    >
                      {badge.progressText}
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
}: {
  resLocals: ResLocalsForPage<'course-instance'>;
  rows: StudentGradebookTableRow[];
  csvFilename: string;
  analyticsData: StudentAnalyticsData | null;
  activityData: StudentActivityAndBadges | null;
}) {
  const assessmentGroups: StudentGradebookTableRow[][] = [];
  rows.forEach((row) => {
    if (row.start_new_set || assessmentGroups.length === 0) {
      assessmentGroups.push([row]);
    } else {
      assessmentGroups[assessmentGroups.length - 1].push(row);
    }
  });

  const hasEngagementModules = analyticsData !== null || activityData !== null;

  return PageLayout({
    resLocals,
    pageTitle: 'کارنامه و نمرات',
    navContext: {
      type: 'student',
      page: 'gradebook',
    },
    headContent: hasEngagementModules ? (
      <link href={assetPath('stylesheets/student-engagement.css')} rel="stylesheet" />
    ) : undefined,
    content: (
      <div style={{ fontFamily: 'var(--font-persian)' }}>
        {analyticsData && <StudentAnalyticsSection data={analyticsData} />}
        {activityData && <StudentHeatmapAndBadgesSection data={activityData} />}

        <div className="card mb-4">
          <div className="card-header bg-primary text-white d-flex align-items-center">
            <h1 className="h4 mb-0">کارنامه و نمرات دانشجو</h1>
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
              <div className="text-muted">در حال حاضر موردی در کارنامه ثبت نشده است.</div>
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-sm table-hover" aria-label="کارنامه">
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
                    <tr>
                      <th colSpan={3} scope="rowgroup">
                        {groupRows[0].assessment_set_heading}
                      </th>
                    </tr>
                    {groupRows.map((row) => (
                      <tr key={`${row.assessment_id}-${row.assessment_instance_id}`}>
                        <td className="align-middle" style={{ width: '1%' }}>
                          <span className={`badge color-${row.assessment_set_color}`}>
                            {row.label}
                          </span>
                        </td>
                        <td className="align-middle">
                          {row.title}{' '}
                          {row.assessment_group_work && (
                            <i className="fas fa-users" aria-hidden="true" />
                          )}
                        </td>
                        <td className="text-center align-middle">
                          {row.show_closed_assessment_score ? (
                            <Scorebar
                              score={row.assessment_instance_score_perc}
                              className="mx-auto"
                            />
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
      </div>
    ),
  });
}
