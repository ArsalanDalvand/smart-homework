import { PageLayout } from '../../components/PageLayout.js';
import { Scorebar } from '../../components/Scorebar.js';
import { assetPath } from '../../lib/assets.js';
import { toPersianDigits } from '../../lib/jalali.js';
import type { ResLocalsForPage } from '../../lib/res-locals.js';
import type { LeaderboardEntry, StudentLeaderboardData } from '../../lib/student-engagement.js';

function LeaderboardRow({ entry }: { entry: LeaderboardEntry }) {
  const rankBadgeClass =
    entry.rank === 1
      ? 'bg-warning text-dark'
      : entry.rank === 2
        ? 'bg-secondary text-white'
        : entry.rank === 3
          ? 'bg-danger-subtle text-danger-emphasis border border-danger-subtle'
          : 'bg-light text-dark border';

  return (
    <tr className={entry.isCurrentUser ? 'se-row-me' : ''}>
      <td className="text-center align-middle" style={{ width: '4.5rem' }}>
        <span className={`se-rank-badge ${rankBadgeClass}`}>{toPersianDigits(entry.rank)}</span>
      </td>
      <td className="align-middle">
        <div className="d-flex flex-wrap align-items-center gap-2">
          <span className="fw-semibold text-dark">{entry.displayName}</span>
          {entry.isCurrentUser && <span className="badge text-bg-primary">شما</span>}
        </div>
      </td>
      <td className="text-center align-middle">{toPersianDigits(entry.solvedQuestions)} سوال</td>
      <td className="text-center align-middle" dir="ltr">
        <strong>{toPersianDigits(entry.totalPoints)}</strong>
        <span className="text-secondary small"> / {toPersianDigits(entry.maxPoints)}</span>
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
}: {
  resLocals: ResLocalsForPage<'course-instance'>;
  data: StudentLeaderboardData;
}) {
  const { urlPrefix } = resLocals;
  const podium = data.topEntries.slice(0, 3);
  const currentInTop = data.topEntries.some((e) => e.isCurrentUser);

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
          <div className="se-card-header bg-primary text-white border-0 py-3">
            <div>
              <h1 className="h4 fw-bold text-white mb-1">
                <i className="fas fa-trophy text-warning me-2" aria-hidden="true" />
                جدول امتیازات و رتبه‌بندی تمرین‌ها
              </h1>
              <div className="small text-white-50">
                رتبه‌بندی فقط بر اساس تمرین‌های هفتگی (Homework) محاسبه شده و کادر آموزشی در جدول لحاظ نمی‌شوند.
              </div>
            </div>
            <span className="badge text-bg-light text-dark px-3 py-2">
              {toPersianDigits(data.totalParticipants)} دانشجوی فعال
            </span>
          </div>

          <div className="p-3 bg-light d-flex flex-wrap align-items-center gap-2">
            <span className="small text-secondary fw-semibold me-1">بازه رتبه‌بندی:</span>
            <a
              href={`${urlPrefix}/leaderboard`}
              className={`btn btn-sm rounded-pill ${data.selectedAssessmentId === null ? 'btn-primary' : 'btn-outline-secondary bg-white'}`}
            >
              کل ترم (مجموع تمرین‌ها)
            </a>
            {data.assessments.map((a) => (
              <a
                key={a.assessmentId}
                href={`${urlPrefix}/leaderboard?assessment_id=${a.assessmentId}`}
                className={`btn btn-sm rounded-pill ${data.selectedAssessmentId === a.assessmentId ? 'btn-primary' : 'btn-outline-secondary bg-white'}`}
              >
                <span dir="ltr" className="me-1">
                  {a.label}
                </span>
                — {a.title}
              </a>
            ))}
          </div>
        </div>

        {/* Top 3 Podium */}
        {podium.length >= 3 && (
          <div className="row g-3 mb-4">
            {podium.map((entry) => {
              const medalIcon =
                entry.rank === 1
                  ? 'fas fa-crown text-warning'
                  : entry.rank === 2
                    ? 'fas fa-medal text-secondary'
                    : 'fas fa-award text-danger';
              return (
                <div key={entry.userId} className="col-md-4">
                  <div className={`se-podium-card se-podium-${entry.rank}`}>
                    <div className="fs-2 mb-1">
                      <i className={medalIcon} aria-hidden="true" />
                    </div>
                    <div className="small text-secondary fw-semibold">
                      رتبه {toPersianDigits(entry.rank)}
                    </div>
                    <div className="h6 fw-bold text-dark mt-1 mb-2">
                      {entry.displayName}
                      {entry.isCurrentUser && (
                        <span className="badge text-bg-primary ms-1">شما</span>
                      )}
                    </div>
                    <div className="d-flex justify-content-center gap-3 small text-secondary">
                      <span>
                        <strong className="text-dark">{toPersianDigits(entry.totalPoints)}</strong>{' '}
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
              <i className="fas fa-list-ol text-primary" aria-hidden="true" />
              <span>رتبه‌بندی ۲۰ نفر برتر</span>
            </h2>
            {data.currentUserEntry && (
              <span className="small text-primary fw-bold">
                رتبه فعلی شما: #{toPersianDigits(data.currentUserEntry.rank)} از{' '}
                {toPersianDigits(data.totalParticipants)}
              </span>
            )}
          </div>

          {data.topEntries.length === 0 ? (
            <div className="p-4 text-center text-muted">
              هنوز هیچ تمرینی توسط دانشجویان حل نشده است؛ با اولین ارسال جایگاه خود را ثبت کنید!
            </div>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover mb-0" aria-label="جدول امتیازات">
                <thead className="table-light">
                  <tr>
                    <th className="text-center">رتبه</th>
                    <th>دانشجو</th>
                    <th className="text-center">سوالات کامل</th>
                    <th className="text-center">مجموع امتیاز</th>
                    <th className="text-center">درصد تکمیل</th>
                  </tr>
                </thead>
                <tbody>
                  {data.topEntries.map((entry) => (
                    <LeaderboardRow key={entry.userId} entry={entry} />
                  ))}
                  {!currentInTop && data.currentUserEntry && (
                    <>
                      <tr>
                        <td colSpan={5} className="text-center text-muted small bg-light py-1">
                          ••• جایگاه شما خارج از ۲۰ نفر اول •••
                        </td>
                      </tr>
                      <LeaderboardRow entry={data.currentUserEntry} />
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
