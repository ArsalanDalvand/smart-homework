import { PageLayout } from '../../components/PageLayout.js';
import { Scorebar } from '../../components/Scorebar.js';
import { assetPath } from '../../lib/assets.js';
import { toPersianDigits } from '../../lib/jalali.js';
import type { ResLocalsForPage } from '../../lib/res-locals.js';
import type { LeaderboardEntry, StudentLeaderboardData } from '../../lib/student-engagement.js';
import type {
  CohortGamificationBundle,
  HallOfFameEntry,
  ShowcaseBadge,
} from '../../lib/student-gamification.js';

function ShowcaseBadgesRow({ badges }: { badges: ShowcaseBadge[] }) {
  if (badges.length === 0) return null;
  return (
    <span className="d-inline-flex align-items-center gap-1">
      {badges.map((b) => (
        <span
          key={b.id}
          className={`sh-showcase-badge sh-tier-${b.tier}`}
          title={b.tooltip}
          aria-label={b.title}
        >
          <i className={b.iconClass} aria-hidden="true" />
        </span>
      ))}
    </span>
  );
}

function HallOfFameCard({
  title,
  subtitle,
  iconClass,
  entries,
}: {
  title: string;
  subtitle: string;
  iconClass: string;
  entries: HallOfFameEntry[];
}) {
  return (
    <div className="sh-hof-card">
      <div className="d-flex align-items-center gap-2 mb-1">
        <i className={`${iconClass} text-body-secondary`} aria-hidden="true" />
        <span className="fw-bold small text-body sh-en-term">{title}</span>
      </div>
      <div className="text-body-secondary mb-2" style={{ fontSize: '0.73rem' }}>
        {subtitle}
      </div>
      {entries.length === 0 ? (
        <div className="small text-body-secondary">هنوز رکوردی ثبت نشده</div>
      ) : (
        <div className="d-flex flex-column gap-1">
          {entries.map((entry, idx) => (
            <div
              key={entry.userId}
              className="d-flex align-items-center justify-content-between gap-2 small py-1 border-top"
            >
              <span className="text-truncate fw-medium text-body">
                <span className="text-body-secondary me-1 sh-tabular">
                  {toPersianDigits(idx + 1)}.
                </span>
                {entry.displayName}
              </span>
              <span className="badge bg-body-tertiary text-body border flex-shrink-0 sh-tabular">
                {entry.metricLabel}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function LeaderboardRow({
  entry,
  level,
  showcaseBadges,
}: {
  entry: LeaderboardEntry;
  level: number | null;
  showcaseBadges: ShowcaseBadge[];
}) {
  const rankBadgeClass =
    entry.rank === 1
      ? 'is-rank-1'
      : entry.rank === 2
        ? 'is-rank-2'
        : entry.rank === 3
          ? 'is-rank-3'
          : '';

  return (
    <tr className={entry.isCurrentUser ? 'se-row-me' : ''}>
      <td className="text-center align-middle" style={{ width: '4.5rem' }}>
        <span className={`se-rank-badge ${rankBadgeClass}`}>{toPersianDigits(entry.rank)}</span>
      </td>
      <td className="align-middle">
        <div className="d-flex flex-wrap align-items-center gap-2">
          <span className="fw-semibold text-body">{entry.displayName}</span>
          {level !== null && <span className="sh-lv-chip sh-en-term sh-tabular">Lv.{level}</span>}
          <ShowcaseBadgesRow badges={showcaseBadges} />
          {entry.isCurrentUser && <span className="badge sh-badge-me">شما</span>}
        </div>
      </td>
      <td className="text-center align-middle sh-tabular">
        {toPersianDigits(entry.solvedQuestions)} سوال
      </td>
      <td className="text-center align-middle sh-tabular" dir="ltr">
        <strong>{toPersianDigits(entry.totalPoints)}</strong>
        <span className="text-body-secondary small"> / {toPersianDigits(entry.maxPoints)}</span>
      </td>
      <td className="text-center align-middle" style={{ width: '24%' }}>
        <Scorebar score={entry.scorePerc} className="mx-auto" />
      </td>
    </tr>
  );
}

export function StudentLeaderboard({
  resLocals,
  data,
  cohortBundle = null,
  showXpLevels = false,
  showAchievements = false,
  showHallOfFame = false,
}: {
  resLocals: ResLocalsForPage<'course-instance'>;
  data: StudentLeaderboardData;
  cohortBundle?: CohortGamificationBundle | null;
  showXpLevels?: boolean;
  showAchievements?: boolean;
  showHallOfFame?: boolean;
}) {
  const { urlPrefix } = resLocals;
  const podium = data.topEntries.slice(0, 3);
  const currentInTop = data.topEntries.some((e) => e.isCurrentUser);
  const rivalGap =
    data.currentUserEntry && data.nextRivalEntry
      ? Math.max(
          0.1,
          Math.round((data.nextRivalEntry.totalPoints - data.currentUserEntry.totalPoints) * 10) /
            10,
        )
      : null;

  return PageLayout({
    resLocals,
    pageTitle: 'جدول امتیازات',
    navContext: {
      type: 'student',
      page: 'leaderboard',
    },
    headContent: <link href={assetPath('stylesheets/student-engagement.css')} rel="stylesheet" />,
    content: (
      <div className="se-section" style={{ fontFamily: 'var(--font-persian)' }}>
        {/* Filter Header */}
        <div className="se-card mb-4">
          <div className="se-card-header sh-hero-header py-3">
            <div>
              <h1 className="h4 fw-bold text-body mb-1">
                <i className="bi bi-trophy me-2 text-warning" aria-hidden="true" />
                جدول امتیازات و رتبه‌بندی تمرین‌ها
              </h1>
              <div className="se-card-subtitle">
                رتبه‌بندی فقط بر اساس تمرین‌های هفتگی (Homework) محاسبه شده و کادر آموزشی در جدول لحاظ
                نمی‌شوند.
              </div>
            </div>
            <span className="badge bg-body-tertiary text-body border px-3 py-2 sh-tabular">
              {toPersianDigits(data.totalParticipants)} دانشجوی فعال
            </span>
          </div>

          <div className="sh-filter-bar">
            <span className="small text-body-secondary fw-semibold me-1">بازه رتبه‌بندی:</span>
            <a
              href={`${urlPrefix}/leaderboard`}
              className={`sh-filter-pill ${data.selectedAssessmentId === null ? 'is-active' : ''}`}
            >
              کل ترم (مجموع تمرین‌ها)
            </a>
            {data.assessments.map((a) => (
              <a
                key={a.assessmentId}
                href={`${urlPrefix}/leaderboard?assessment_id=${a.assessmentId}`}
                className={`sh-filter-pill ${data.selectedAssessmentId === a.assessmentId ? 'is-active' : ''}`}
              >
                <span dir="ltr" className="me-1">
                  {a.label}
                </span>
                — {a.title}
              </a>
            ))}
          </div>
        </div>

        {/* Next-Rank Rival Nudge */}
        {data.currentUserEntry && data.nextRivalEntry && rivalGap !== null && (
          <div className="sh-rival-nudge mb-4">
            <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 small">
              <span>
                <i className="bi bi-graph-up-arrow me-1 text-success" aria-hidden="true" />
                رتبه فعلی شما:{' '}
                <strong className="sh-tabular">
                  #{toPersianDigits(data.currentUserEntry.rank)}
                </strong>
                {' · '}
                فقط <strong className="sh-tabular">{toPersianDigits(rivalGap)} امتیاز</strong> تا
                رسیدن به رتبه{' '}
                <strong className="sh-tabular">#{toPersianDigits(data.nextRivalEntry.rank)}</strong>{' '}
                ({data.nextRivalEntry.displayName}) فاصله دارید!
              </span>
              <a
                href={`${urlPrefix}/assessments`}
                className="small fw-semibold text-decoration-none"
              >
                حل تمرین بعدی ←
              </a>
            </div>
          </div>
        )}

        {/* Hall of Fame Spotlight */}
        {showHallOfFame && cohortBundle && (
          <section className="mb-4" aria-label="تالار افتخار">
            <div className="d-flex align-items-center justify-content-between mb-2">
              <h2 className="h6 fw-bold mb-0 d-flex align-items-center gap-2">
                <i className="bi bi-stars text-warning" aria-hidden="true" />
                <span className="sh-en-term">Hall of Fame</span>
                <span className="small text-body-secondary fw-normal">
                  — برترین‌های بخش‌های مختلف
                </span>
              </h2>
            </div>
            <div className="sh-hof-grid">
              <HallOfFameCard
                title="Rising Stars"
                subtitle="بیشترین حل سوال در ۷ روز اخیر"
                iconClass="bi bi-graph-up-arrow"
                entries={cohortBundle.hallOfFame.risingStars}
              />
              <HallOfFameCard
                title="Accuracy Kings"
                subtitle="بالاترین نرخ قبولی و One-Shot"
                iconClass="bi bi-crosshair"
                entries={cohortBundle.hallOfFame.accuracyKings}
              />
              <HallOfFameCard
                title="Streak Legends"
                subtitle="طولانی‌ترین زنجیره فعالیت روزانه"
                iconClass="bi bi-fire"
                entries={cohortBundle.hallOfFame.streakLegends}
              />
              <HallOfFameCard
                title="First Blood Hunters"
                subtitle="بیشترین تعداد حل به عنوان نفر اول"
                iconClass="bi bi-lightning-charge"
                entries={cohortBundle.hallOfFame.firstBloodHunters}
              />
            </div>
          </section>
        )}

        {/* Top 3 Podium */}
        {podium.length >= 3 && (
          <div className="row g-3 mb-4">
            {podium.map((entry) => {
              const medalIcon =
                entry.rank === 1
                  ? 'bi bi-award-fill text-warning'
                  : 'bi bi-award text-body-secondary';
              const userMeta = cohortBundle?.byUserId[entry.userId];
              return (
                <div key={entry.userId} className="col-md-4">
                  <div className={`se-podium-card se-podium-${entry.rank}`}>
                    <div className="fs-2 mb-1">
                      <i className={medalIcon} aria-hidden="true" />
                    </div>
                    <div className="small text-body-secondary fw-semibold sh-tabular">
                      رتبه {toPersianDigits(entry.rank)}
                    </div>
                    <div className="h6 fw-bold text-body mt-1 mb-2 d-flex flex-wrap align-items-center justify-content-center gap-1">
                      <span>{entry.displayName}</span>
                      {showXpLevels && userMeta && (
                        <span className="sh-lv-chip sh-en-term sh-tabular">
                          Lv.{userMeta.level}
                        </span>
                      )}
                      {entry.isCurrentUser && <span className="badge sh-badge-me ms-1">شما</span>}
                    </div>
                    {showAchievements && userMeta && userMeta.showcaseBadges.length > 0 && (
                      <div className="mb-2 d-flex justify-content-center">
                        <ShowcaseBadgesRow badges={userMeta.showcaseBadges} />
                      </div>
                    )}
                    <div className="d-flex justify-content-center gap-3 small text-body-secondary sh-tabular">
                      <span>
                        <strong className="text-body">{toPersianDigits(entry.totalPoints)}</strong>{' '}
                        امتیاز
                      </span>
                      <span>
                        <strong className="text-success">
                          {toPersianDigits(entry.solvedQuestions)}
                        </strong>{' '}
                        سوال حل‌شده
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Full Top 20 Table */}
        <div className="se-card mb-4">
          <div className="se-card-header">
            <h2 className="se-card-title">
              <i className="bi bi-list-ol text-body-secondary" aria-hidden="true" />
              <span>رتبه‌بندی ۲۰ نفر برتر</span>
            </h2>
            {data.currentUserEntry && (
              <span className="small text-body fw-bold sh-tabular">
                رتبه فعلی شما: #{toPersianDigits(data.currentUserEntry.rank)} از{' '}
                {toPersianDigits(data.totalParticipants)}
              </span>
            )}
          </div>

          {data.topEntries.length === 0 ? (
            <div className="p-4 text-center text-body-secondary">
              هنوز هیچ تمرینی توسط دانشجویان حل نشده است؛ با اولین ارسال جایگاه خود را ثبت کنید!
            </div>
          ) : (
            <div className="table-responsive">
              <table
                className="table table-hover sh-question-table mb-0"
                aria-label="جدول امتیازات"
              >
                <thead>
                  <tr>
                    <th className="text-center">رتبه</th>
                    <th>دانشجو</th>
                    <th className="text-center">سوالات کامل</th>
                    <th className="text-center">مجموع امتیاز</th>
                    <th className="text-center">درصد تکمیل</th>
                  </tr>
                </thead>
                <tbody>
                  {data.topEntries.map((entry) => {
                    const userMeta = cohortBundle?.byUserId[entry.userId];
                    return (
                      <LeaderboardRow
                        key={entry.userId}
                        entry={entry}
                        level={showXpLevels && userMeta ? userMeta.level : null}
                        showcaseBadges={showAchievements && userMeta ? userMeta.showcaseBadges : []}
                      />
                    );
                  })}
                  {!currentInTop && data.currentUserEntry && (
                    <>
                      <tr>
                        <td
                          colSpan={5}
                          className="text-center text-body-secondary small bg-body-tertiary py-1"
                        >
                          ••• جایگاه شما خارج از ۲۰ نفر اول •••
                        </td>
                      </tr>
                      <LeaderboardRow
                        entry={data.currentUserEntry}
                        level={
                          showXpLevels && cohortBundle?.byUserId[data.currentUserEntry.userId]
                            ? cohortBundle.byUserId[data.currentUserEntry.userId].level
                            : null
                        }
                        showcaseBadges={
                          showAchievements && cohortBundle?.byUserId[data.currentUserEntry.userId]
                            ? cohortBundle.byUserId[data.currentUserEntry.userId].showcaseBadges
                            : []
                        }
                      />
                    </>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    ),
  });
}
