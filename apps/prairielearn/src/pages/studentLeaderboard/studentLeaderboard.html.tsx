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
  WeeklyLeagueGroup,
} from '../../lib/student-gamification.js';
import {
  getInitialsFromName,
  getUserAvatarUrl,
  resolveAvatarIconClass,
  resolveStatusLabel,
} from '../../lib/student-profile.shared.js';

function UserAvatarBadge({
  userId,
  displayName,
  avatarPreset,
  avatarColor,
  avatarVersion = null,
}: {
  userId: string;
  displayName: string;
  avatarPreset: string;
  avatarColor: string;
  avatarVersion?: string | null;
}) {
  const avatarUrl = getUserAvatarUrl(userId, avatarVersion);
  const iconClass = resolveAvatarIconClass(avatarPreset);
  return (
    <span className={`sh-avatar sh-av-color-${avatarColor}`} aria-hidden="true">
      {avatarUrl ? (
        <img alt="" className="sh-avatar-img" loading="lazy" src={avatarUrl} />
      ) : iconClass ? (
        <i className={iconClass} />
      ) : (
        <span>{getInitialsFromName(displayName)}</span>
      )}
    </span>
  );
}

function StudentNameLabel({
  userId,
  displayName,
  showCodingPassport,
}: {
  userId: string;
  displayName: string;
  showCodingPassport: boolean;
}) {
  if (!showCodingPassport) {
    return <span className="fw-semibold text-body">{displayName}</span>;
  }
  return (
    <button
      className="sh-passport-btn"
      data-sh-passport-user={userId}
      title="مشاهده شناسنامه برنامه‌نویسی"
      type="button"
    >
      {displayName}
    </button>
  );
}

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
  showCodingPassport,
}: {
  title: string;
  subtitle: string;
  iconClass: string;
  entries: HallOfFameEntry[];
  showCodingPassport: boolean;
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
                <StudentNameLabel
                  displayName={entry.displayName}
                  showCodingPassport={showCodingPassport}
                  userId={entry.userId}
                />
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
  showCodingPassport,
}: {
  entry: LeaderboardEntry;
  level: number | null;
  showcaseBadges: ShowcaseBadge[];
  showCodingPassport: boolean;
}) {
  const rankBadgeClass =
    entry.rank === 1
      ? 'is-rank-1'
      : entry.rank === 2
        ? 'is-rank-2'
        : entry.rank === 3
          ? 'is-rank-3'
          : '';
  const statusText = resolveStatusLabel(entry.statusEmoji);

  return (
    <tr className={entry.isCurrentUser ? 'se-row-me' : ''}>
      <td className="text-center align-middle" style={{ width: '4.5rem' }}>
        <span className={`se-rank-badge ${rankBadgeClass}`}>{toPersianDigits(entry.rank)}</span>
      </td>
      <td className="align-middle">
        <div className="d-flex flex-wrap align-items-center gap-2">
          <UserAvatarBadge
            avatarColor={entry.avatarColor}
            avatarPreset={entry.avatarPreset}
            avatarVersion={entry.avatarVersion}
            displayName={entry.displayName}
            userId={entry.userId}
          />
          <StudentNameLabel
            displayName={entry.displayName}
            showCodingPassport={showCodingPassport}
            userId={entry.userId}
          />
          {statusText && (
            <span className="small text-body-secondary d-none d-md-inline" title={statusText}>
              {statusText.split(' ')[0]}
            </span>
          )}
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

function WeeklyLeagueCard({
  league,
  currentUserId,
  weekLabel,
  weekEndsAtIso,
  showXpLevels,
  showAchievements,
  showCodingPassport,
}: {
  league: WeeklyLeagueGroup;
  currentUserId: string;
  weekLabel: string;
  weekEndsAtIso: string;
  showXpLevels: boolean;
  showAchievements: boolean;
  showCodingPassport: boolean;
}) {
  return (
    <div className="se-card mb-4">
      <div className="se-card-header sh-league-header">
        <div>
          <h2 className="se-card-title">
            <span className={`sh-league-tier-pill sh-league-${league.tier}`}>{league.titleFa}</span>
            <span className="small text-body-secondary fw-normal">— {weekLabel}</span>
          </h2>
          <div className="se-card-subtitle mt-1">
            رتبه‌بندی فقط بر اساس XP همین هفته شمسی · هر شنبه بازنشانی می‌شود
          </div>
        </div>
        <div className="d-flex flex-wrap align-items-center gap-2 small">
          {league.promoteCount > 0 && (
            <span className="badge bg-success-subtle text-success-emphasis border border-success-subtle sh-tabular">
              ↑ {toPersianDigits(league.promoteCount)} نفر برتر: صعود
            </span>
          )}
          {league.relegateCount > 0 && (
            <span className="badge bg-danger-subtle text-danger-emphasis border border-danger-subtle sh-tabular">
              ↓ {toPersianDigits(league.relegateCount)} نفر انتها: سقوط
            </span>
          )}
          <span className="badge bg-body-tertiary text-body border sh-tabular">
            <i className="bi bi-clock me-1" aria-hidden="true" />
            <span data-deadline-iso={weekEndsAtIso}>پایان هفته</span>
          </span>
        </div>
      </div>

      <div className="table-responsive">
        <table
          aria-label={`جدول ${league.titleFa}`}
          className="table table-hover sh-question-table sh-league-table mb-0"
        >
          <thead>
            <tr>
              <th className="text-center">رتبه</th>
              <th>دانشجو</th>
              <th className="text-center">حل این هفته</th>
              <th className="text-center">XP این هفته</th>
              <th className="text-center">وضعیت</th>
            </tr>
          </thead>
          <tbody>
            {league.members.map((m) => {
              const isMe = m.userId === currentUserId;
              const zoneRowClass =
                m.zone === 'promote'
                  ? 'sh-league-row-promote'
                  : m.zone === 'relegate'
                    ? 'sh-league-row-relegate'
                    : '';
              return (
                <tr key={m.userId} className={`${zoneRowClass} ${isMe ? 'se-row-me' : ''}`}>
                  <td className="text-center align-middle" style={{ width: '4.5rem' }}>
                    <span className="se-rank-badge">{toPersianDigits(m.rank)}</span>
                  </td>
                  <td className="align-middle">
                    <div className="d-flex flex-wrap align-items-center gap-2">
                      <UserAvatarBadge
                        avatarColor={m.avatarColor}
                        avatarPreset={m.avatarPreset}
                        avatarVersion={m.avatarVersion}
                        displayName={m.displayName}
                        userId={m.userId}
                      />
                      <StudentNameLabel
                        displayName={m.displayName}
                        showCodingPassport={showCodingPassport}
                        userId={m.userId}
                      />
                      {showXpLevels && (
                        <span className="sh-lv-chip sh-en-term sh-tabular">Lv.{m.level}</span>
                      )}
                      {showAchievements && <ShowcaseBadgesRow badges={m.showcaseBadges} />}
                      {isMe && <span className="badge sh-badge-me">شما</span>}
                    </div>
                  </td>
                  <td className="text-center align-middle sh-tabular">
                    {toPersianDigits(m.solvedThisWeek)} سوال
                  </td>
                  <td className="text-center align-middle sh-tabular" dir="ltr">
                    <strong>+{toPersianDigits(m.weeklyXp)} XP</strong>
                  </td>
                  <td className="text-center align-middle">
                    {m.zone === 'promote' ? (
                      <span className="badge bg-success-subtle text-success-emphasis border border-success-subtle">
                        ↑ صعود
                      </span>
                    ) : m.zone === 'relegate' ? (
                      <span className="badge bg-danger-subtle text-danger-emphasis border border-danger-subtle">
                        ↓ سقوط
                      </span>
                    ) : (
                      <span className="small text-body-secondary">حفظ لیگ</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function StudentLeaderboard({
  resLocals,
  data,
  cohortBundle = null,
  view = 'overall',
  showXpLevels = false,
  showAchievements = false,
  showHallOfFame = false,
  showWeeklyLeagues = false,
  showCodingPassport = false,
}: {
  resLocals: ResLocalsForPage<'course-instance'>;
  data: StudentLeaderboardData;
  cohortBundle?: CohortGamificationBundle | null;
  view?: 'overall' | 'league';
  showXpLevels?: boolean;
  showAchievements?: boolean;
  showHallOfFame?: boolean;
  showWeeklyLeagues?: boolean;
  showCodingPassport?: boolean;
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

  const leagues = cohortBundle?.weeklyLeagues.leagues ?? [];
  const leagueMemberCount = leagues.reduce((sum, l) => sum + l.members.length, 0);
  const fallbackLeague = leagues.at(0);
  const myLeague =
    leagues.find((l) => l.members.some((m) => m.userId === resLocals.user.id)) ??
    fallbackLeague ??
    null;
  const otherLeagues = myLeague ? leagues.filter((l) => l.id !== myLeague.id) : [];

  return PageLayout({
    resLocals,
    pageTitle: view === 'league' ? 'لیگ هفتگی' : 'جدول امتیازات',
    navContext: {
      type: 'student',
      page: 'leaderboard',
    },
    headContent: (
      <>
        <link href={assetPath('stylesheets/student-engagement.css')} rel="stylesheet" />
        {showCodingPassport && <script src={assetPath('javascripts/student-phase3.js')} defer />}
        {view === 'league' && showWeeklyLeagues && (
          <script src={assetPath('javascripts/student-deadline-radar.js')} defer />
        )}
      </>
    ),
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
                {showCodingPassport && ' روی نام هر دانشجو کلیک کنید تا شناسنامه او را ببینید.'}
              </div>
            </div>
            <div className="d-flex flex-wrap align-items-center gap-2">
              <a className="btn btn-outline-primary btn-sm" href="/pl/settings#public-profile">
                <i className="bi bi-person-badge me-1" aria-hidden="true" />
                ویرایش پروفایل من
              </a>
              <span className="badge bg-body-tertiary text-body border px-3 py-2 sh-tabular">
                {view === 'league' && showWeeklyLeagues
                  ? `${toPersianDigits(leagueMemberCount)} عضو در لیگ‌ها`
                  : `${toPersianDigits(data.totalParticipants)} دانشجوی فعال`}
              </span>
            </div>
          </div>

          <div className="sh-filter-bar">
            {showWeeklyLeagues && (
              <>
                <span className="small text-body-secondary fw-semibold me-1">حالت نمایش:</span>
                <a
                  href={`${urlPrefix}/leaderboard`}
                  className={`sh-filter-pill ${view === 'overall' && data.selectedAssessmentId === null ? 'is-active' : ''}`}
                >
                  کل ترم
                </a>
                <a
                  href={`${urlPrefix}/leaderboard?view=league`}
                  className={`sh-filter-pill ${view === 'league' ? 'is-active' : ''}`}
                >
                  🏟️ لیگ هفتگی (Weekly League)
                </a>
              </>
            )}
            {view === 'overall' && (
              <>
                {!showWeeklyLeagues && (
                  <>
                    <span className="small text-body-secondary fw-semibold me-1">
                      بازه رتبه‌بندی:
                    </span>
                    <a
                      href={`${urlPrefix}/leaderboard`}
                      className={`sh-filter-pill ${data.selectedAssessmentId === null ? 'is-active' : ''}`}
                    >
                      کل ترم (مجموع تمرین‌ها)
                    </a>
                  </>
                )}
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
              </>
            )}
          </div>
        </div>

        {view === 'league' && showWeeklyLeagues && cohortBundle ? (
          myLeague ? (
            <>
              <WeeklyLeagueCard
                currentUserId={resLocals.user.id}
                league={myLeague}
                showAchievements={showAchievements}
                showCodingPassport={showCodingPassport}
                showXpLevels={showXpLevels}
                weekEndsAtIso={cohortBundle.weeklyLeagues.weekEndsAtIso}
                weekLabel={cohortBundle.weeklyLeagues.weekLabel}
              />
              {otherLeagues.length > 0 && (
                <details className="mb-4">
                  <summary
                    className="small fw-semibold text-primary mb-3"
                    style={{ cursor: 'pointer' }}
                  >
                    مشاهده سایر دسته‌های لیگ این هفته ({toPersianDigits(otherLeagues.length)} دسته)
                  </summary>
                  {otherLeagues.map((lg) => (
                    <WeeklyLeagueCard
                      key={lg.id}
                      currentUserId={resLocals.user.id}
                      league={lg}
                      showAchievements={showAchievements}
                      showCodingPassport={showCodingPassport}
                      showXpLevels={showXpLevels}
                      weekEndsAtIso={cohortBundle.weeklyLeagues.weekEndsAtIso}
                      weekLabel={cohortBundle.weeklyLeagues.weekLabel}
                    />
                  ))}
                </details>
              )}
            </>
          ) : (
            <div className="se-card p-4 text-center text-body-secondary">
              هنوز شرکت‌کننده‌ای برای لیگ هفتگی ثبت نشده است.
            </div>
          )
        ) : (
          <>
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
                    فقط <strong className="sh-tabular">
                      {toPersianDigits(rivalGap)} امتیاز
                    </strong>{' '}
                    تا رسیدن به رتبه{' '}
                    <strong className="sh-tabular">
                      #{toPersianDigits(data.nextRivalEntry.rank)}
                    </strong>{' '}
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
                    entries={cohortBundle.hallOfFame.risingStars}
                    iconClass="bi bi-graph-up-arrow"
                    showCodingPassport={showCodingPassport}
                    subtitle="بیشترین حل سوال در ۷ روز اخیر"
                    title="Rising Stars"
                  />
                  <HallOfFameCard
                    entries={cohortBundle.hallOfFame.accuracyKings}
                    iconClass="bi bi-crosshair"
                    showCodingPassport={showCodingPassport}
                    subtitle="بالاترین نرخ قبولی و One-Shot"
                    title="Accuracy Kings"
                  />
                  <HallOfFameCard
                    entries={cohortBundle.hallOfFame.streakLegends}
                    iconClass="bi bi-fire"
                    showCodingPassport={showCodingPassport}
                    subtitle="طولانی‌ترین زنجیره فعالیت روزانه"
                    title="Streak Legends"
                  />
                  <HallOfFameCard
                    entries={cohortBundle.hallOfFame.firstBloodHunters}
                    iconClass="bi bi-lightning-charge"
                    showCodingPassport={showCodingPassport}
                    subtitle="بیشترین تعداد حل به عنوان نفر اول"
                    title="First Blood Hunters"
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
                          <UserAvatarBadge
                            avatarColor={entry.avatarColor}
                            avatarPreset={entry.avatarPreset}
                            avatarVersion={entry.avatarVersion}
                            displayName={entry.displayName}
                            userId={entry.userId}
                          />
                          <StudentNameLabel
                            displayName={entry.displayName}
                            showCodingPassport={showCodingPassport}
                            userId={entry.userId}
                          />
                          {showXpLevels && userMeta && (
                            <span className="sh-lv-chip sh-en-term sh-tabular">
                              Lv.{userMeta.level}
                            </span>
                          )}
                          {entry.isCurrentUser && (
                            <span className="badge sh-badge-me ms-1">شما</span>
                          )}
                        </div>
                        {showAchievements && userMeta && userMeta.showcaseBadges.length > 0 && (
                          <div className="mb-2 d-flex justify-content-center">
                            <ShowcaseBadgesRow badges={userMeta.showcaseBadges} />
                          </div>
                        )}
                        <div className="d-flex justify-content-center gap-3 small text-body-secondary sh-tabular">
                          <span>
                            <strong className="text-body">
                              {toPersianDigits(entry.totalPoints)}
                            </strong>{' '}
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
                    aria-label="جدول امتیازات"
                    className="table table-hover sh-question-table mb-0"
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
                            showCodingPassport={showCodingPassport}
                            showcaseBadges={
                              showAchievements && userMeta ? userMeta.showcaseBadges : []
                            }
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
                            showCodingPassport={showCodingPassport}
                            showcaseBadges={
                              showAchievements &&
                              cohortBundle?.byUserId[data.currentUserEntry.userId]
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
          </>
        )}

        {/* Coding Passport Modal */}
        {showCodingPassport && (
          <div
            id="sh-coding-passport-modal"
            aria-hidden="true"
            aria-labelledby="sh-coding-passport-label"
            className="modal fade"
            data-url-prefix={urlPrefix}
            tabIndex={-1}
          >
            <div className="modal-dialog modal-lg modal-dialog-centered">
              <div className="modal-content sh-passport-modal">
                <div className="modal-header">
                  <h2 id="sh-coding-passport-label" className="modal-title h6 fw-bold">
                    <i className="bi bi-person-badge me-1 text-primary" aria-hidden="true" />
                    شناسنامه افتخارات دانشجو (<span className="sh-en-term">Coding Passport</span>)
                  </h2>
                  <button
                    aria-label="بستن"
                    className="btn-close"
                    data-bs-dismiss="modal"
                    type="button"
                  />
                </div>
                <div id="sh-coding-passport-body" className="modal-body p-3" />
              </div>
            </div>
          </div>
        )}
      </div>
    ),
  });
}
