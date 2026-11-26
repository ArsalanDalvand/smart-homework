import { QueryClient, useMutation } from '@tanstack/react-query';
import clsx from 'clsx';
import { useState } from 'react';

import { getAppError } from '@prairielearn/trpc/client';
import { AppErrorAlert, QueryClientProviderDebug } from '@prairielearn/trpc/react';

import { FriendlyDate } from '../../../components/FriendlyDate.js';
import { uiStrings } from '../../../lib/branding.js';
import type { UserAccessToken } from '../../../lib/client/safe-db-types.js';
import {
  AVATAR_COLORS,
  AVATAR_PRESETS,
  BANNER_THEMES,
  STATUS_PRESETS,
  type StudentPublicProfile,
  TITLE_PRESETS,
  getInitialsFromName,
  resolveAvatarIconClass,
  resolveStatusLabel,
} from '../../../lib/student-profile.shared.js';
import { createUserTrpcClient } from '../../../trpc/user/client.js';
import { TRPCProvider, useTRPC } from '../../../trpc/user/context.js';
import type { UserSettingsError } from '../../../trpc/user/user-settings.js';

import { DeleteTokenModal } from './DeleteTokenModal.js';
import { GenerateTokenModal } from './GenerateTokenModal.js';

interface EarnedBadgeSummary {
  id: string;
  title: string;
  tier: string;
  iconClass: string;
  description: string;
}

interface UserSettingsPageProps {
  user: {
    uid: string;
    name: string | null;
    uin: string | null;
    email: string | null;
  };
  institution: {
    long_name: string;
    short_name: string;
  };
  authnProviderName: string;
  ipAddress: string | undefined;
  accessTokens: UserAccessToken[];
  newAccessTokens: string[];
  isExamMode: boolean;
  csrfToken: string;
  trpcCsrfToken: string;
  initialEnableSingleKeyShortcuts: boolean;
  initialPublicProfile: StudentPublicProfile;
  earnedBadges: EarnedBadgeSummary[];
  profileSaved: boolean;
}

export function UserSettingsPage({
  user,
  institution,
  authnProviderName,
  ipAddress,
  accessTokens,
  newAccessTokens,
  isExamMode,
  csrfToken,
  trpcCsrfToken,
  initialEnableSingleKeyShortcuts,
  initialPublicProfile,
  earnedBadges,
  profileSaved,
}: UserSettingsPageProps) {
  const [queryClient] = useState(() => new QueryClient());
  const [trpcClient] = useState(() => createUserTrpcClient({ csrfToken: trpcCsrfToken }));

  return (
    <QueryClientProviderDebug client={queryClient}>
      <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
        <div style={{ fontFamily: 'var(--font-persian)' }}>
          <h1 className="mb-4 h2">تنظیمات حساب کاربری</h1>

          <UserProfileCard
            user={user}
            institution={institution}
            authnProviderName={authnProviderName}
            ipAddress={ipAddress}
          />

          <PublicProfileStudioCard
            csrfToken={csrfToken}
            earnedBadges={earnedBadges}
            initialProfile={initialPublicProfile}
            isExamMode={isExamMode}
            profileSaved={profileSaved}
            userName={user.name || user.uid.split('@')[0]}
          />

          <UserSettingsCard initialEnableSingleKeyShortcuts={initialEnableSingleKeyShortcuts} />

          <PersonalAccessTokensCard
            accessTokens={accessTokens}
            newAccessTokens={newAccessTokens}
            isExamMode={isExamMode}
            csrfToken={csrfToken}
          />

          <BrowserConfigurationCard />
        </div>
      </TRPCProvider>
    </QueryClientProviderDebug>
  );
}

UserSettingsPage.displayName = 'UserSettingsPage';

function PublicProfileStudioCard({
  userName,
  initialProfile,
  earnedBadges,
  isExamMode,
  csrfToken,
  profileSaved,
}: {
  userName: string;
  initialProfile: StudentPublicProfile;
  earnedBadges: EarnedBadgeSummary[];
  isExamMode: boolean;
  csrfToken: string;
  profileSaved: boolean;
}) {
  const [displayAlias, setDisplayAlias] = useState(initialProfile.displayAlias ?? '');
  const [avatarPreset, setAvatarPreset] = useState(initialProfile.avatarPreset);
  const [avatarColor, setAvatarColor] = useState(initialProfile.avatarColor);
  const [bannerTheme, setBannerTheme] = useState(initialProfile.bannerTheme);
  const [bio, setBio] = useState(initialProfile.bio ?? '');
  const [statusEmoji, setStatusEmoji] = useState(initialProfile.statusEmoji);
  const [favoriteTopic, setFavoriteTopic] = useState(initialProfile.favoriteTopic ?? '');
  const [githubUsername, setGithubUsername] = useState(initialProfile.githubUsername ?? '');
  const [featuredTitle, setFeaturedTitle] = useState(initialProfile.featuredTitle);
  const [pinnedBadgeIds, setPinnedBadgeIds] = useState<string[]>(initialProfile.pinnedBadgeIds);
  const [showOnLeaderboard, setShowOnLeaderboard] = useState(initialProfile.showOnLeaderboard);
  const [showPassportDetails, setShowPassportDetails] = useState(
    initialProfile.showPassportDetails,
  );
  const [showActivityStats, setShowActivityStats] = useState(initialProfile.showActivityStats);

  const previewName = showOnLeaderboard
    ? displayAlias.trim() || userName || 'دانشجو'
    : 'دانشجوی ناشناس #۴۱۲۸';
  const avatarIcon = resolveAvatarIconClass(avatarPreset);
  const previewStatus = resolveStatusLabel(statusEmoji);
  const previewTitle = featuredTitle === 'auto' ? 'Algorithm Crafter' : featuredTitle;
  const pinnedBadgeSet = new Set(pinnedBadgeIds);

  const togglePinnedBadge = (badgeId: string) => {
    setPinnedBadgeIds((prev) => {
      if (prev.includes(badgeId)) return prev.filter((id) => id !== badgeId);
      if (prev.length >= 3) return [...prev.slice(1), badgeId];
      return [...prev, badgeId];
    });
  };

  const quickTopics = ['الگوریتم', 'توابع بازگشتی', 'ساختار داده', 'کدنویسی تمیز', 'هوش مصنوعی'];

  return (
    <div id="public-profile" className="card mb-4">
      <div className="card-header bg-primary text-white sh-hero-header d-flex flex-wrap align-items-center justify-content-between gap-2">
        <div>
          <h2 className="h5 mb-0 d-flex align-items-center gap-2">
            <i className="bi bi-person-badge-fill" aria-hidden="true" />
            <span>پروفایل عمومی و هویت برنامه‌نویسی</span>
          </h2>
          <div className="small opacity-75 mt-1">
            ظاهر شما در جدول امتیازات، لیگ هفتگی، First Blood و شناسنامه Coding Passport
          </div>
        </div>
        <span className="badge bg-body-tertiary text-body border">قابل شخصی‌سازی</span>
      </div>

      <div className="card-body">
        {profileSaved && (
          <div className="alert alert-success d-flex align-items-center gap-2 mb-4" role="alert">
            <i className="bi bi-check-circle-fill" aria-hidden="true" />
            <span>پروفایل عمومی و تنظیمات حریم خصوصی شما با موفقیت ذخیره شد.</span>
          </div>
        )}

        {isExamMode ? (
          <div className="alert alert-secondary mb-0">
            در حالت آزمون، امکان تغییر پروفایل عمومی غیرفعال است.
          </div>
        ) : (
          <form method="POST">
            <input name="__csrf_token" type="hidden" value={csrfToken} />
            <input name="__action" type="hidden" value="update_public_profile" />
            <input name="avatar_preset" type="hidden" value={avatarPreset} />
            <input name="avatar_color" type="hidden" value={avatarColor} />
            <input name="banner_theme" type="hidden" value={bannerTheme} />
            <input name="status_emoji" type="hidden" value={statusEmoji} />
            <input name="featured_title" type="hidden" value={featuredTitle} />
            <input name="pinned_badge_ids" type="hidden" value={pinnedBadgeIds.join(',')} />
            <input
              name="show_on_leaderboard"
              type="hidden"
              value={showOnLeaderboard ? 'true' : 'false'}
            />
            <input
              name="show_passport_details"
              type="hidden"
              value={showPassportDetails ? 'true' : 'false'}
            />
            <input
              name="show_activity_stats"
              type="hidden"
              value={showActivityStats ? 'true' : 'false'}
            />

            {/* Live Interactive Preview */}
            <div className="sh-profile-preview mb-4">
              <div className="small fw-bold text-body-secondary mb-2 d-flex align-items-center justify-content-between">
                <span>پیش‌نمایش زنده (آنچه هم‌کلاسی‌ها می‌بینند)</span>
                {!showOnLeaderboard && (
                  <span className="badge bg-warning-subtle text-warning-emphasis border border-warning-subtle">
                    حالت ناشناس فعال
                  </span>
                )}
              </div>

              <div className={`sh-passport-banner sh-banner-${bannerTheme} mb-3`}>
                <div className="d-flex flex-wrap align-items-center gap-3">
                  <div className={`sh-avatar-lg sh-av-color-${avatarColor}`}>
                    {avatarIcon ? (
                      <i className={avatarIcon} aria-hidden="true" />
                    ) : (
                      <span>{getInitialsFromName(previewName)}</span>
                    )}
                  </div>
                  <div className="min-w-0 flex-grow-1">
                    <div className="d-flex flex-wrap align-items-center gap-2">
                      <span className="h5 fw-bold text-white mb-0">{previewName}</span>
                      <span className="sh-wrapup-medal-pill sh-en-term">{previewTitle}</span>
                      {previewStatus && showOnLeaderboard && (
                        <span className="sh-status-chip">{previewStatus}</span>
                      )}
                    </div>
                    {bio.trim() && showPassportDetails && showOnLeaderboard && (
                      <div className="small text-white-50 mt-1">{bio.trim()}</div>
                    )}
                    <div className="d-flex flex-wrap gap-2 mt-2 small">
                      {favoriteTopic.trim() && showPassportDetails && showOnLeaderboard && (
                        <span className="sh-wrapup-medal-pill">
                          🎯 علاقه: {favoriteTopic.trim()}
                        </span>
                      )}
                      {githubUsername.trim() && showPassportDetails && showOnLeaderboard && (
                        <span className="sh-wrapup-medal-pill sh-en-term" dir="ltr">
                          <i className="bi bi-github me-1" aria-hidden="true" />@
                          {githubUsername.trim().replace(/^@/, '')}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Miniature Leaderboard Row Preview */}
              <div className="p-2 rounded border bg-body d-flex flex-wrap align-items-center justify-content-between gap-2 small">
                <div className="d-flex flex-wrap align-items-center gap-2">
                  <span className="se-rank-badge is-rank-1">۳</span>
                  <span className={`sh-avatar sh-av-color-${avatarColor}`}>
                    {avatarIcon ? (
                      <i className={avatarIcon} aria-hidden="true" />
                    ) : (
                      <span>{getInitialsFromName(previewName)}</span>
                    )}
                  </span>
                  <span className="fw-semibold text-body">{previewName}</span>
                  <span className="sh-lv-chip sh-en-term">Lv.5</span>
                  {earnedBadges
                    .filter((b) => pinnedBadgeSet.has(b.id))
                    .slice(0, 3)
                    .map((b) => (
                      <span
                        key={b.id}
                        className={`sh-showcase-badge sh-tier-${b.tier}`}
                        title={b.title}
                      >
                        <i className={b.iconClass} aria-hidden="true" />
                      </span>
                    ))}
                </div>
                <span className="text-body-secondary">نمای ردیف جدول امتیازات</span>
              </div>
            </div>

            <div className="row g-4">
              {/* Column 1: Textual Identity */}
              <div className="col-lg-6">
                <div className="mb-3">
                  <label className="form-label fw-semibold" htmlFor="sh-profile-alias">
                    نام نمایشی عمومی (لقب / نام مستعار)
                  </label>
                  <input
                    id="sh-profile-alias"
                    className="form-control"
                    maxLength={36}
                    name="display_alias"
                    placeholder={`پیش‌فرض: ${userName || 'نام اصلی شما'}`}
                    type="text"
                    value={displayAlias}
                    onChange={(e) => setDisplayAlias(e.currentTarget.value)}
                  />
                  <div className="form-text">
                    در صورت پر شدن، این نام به جای نام اصلی در لیدربورد، First Blood و Spotlight
                    نمایش داده می‌شود.
                  </div>
                </div>

                <div className="mb-3">
                  <div className="d-flex justify-content-between align-items-center">
                    <label className="form-label fw-semibold mb-1" htmlFor="sh-profile-bio">
                      معرفی کوتاه یا شعار کدنویسی (Bio)
                    </label>
                    <small className="text-body-secondary sh-tabular">{bio.length} / ۱۶۰</small>
                  </div>
                  <textarea
                    id="sh-profile-bio"
                    className="form-control"
                    maxLength={160}
                    name="bio"
                    placeholder="مثلاً: عاشق پایتون، حل مسائل الگوریتمی و قهوه تلخ!"
                    rows={2}
                    value={bio}
                    onChange={(e) => setBio(e.currentTarget.value)}
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold" htmlFor="sh-profile-topic">
                    مبحث مورد علاقه
                  </label>
                  <input
                    id="sh-profile-topic"
                    className="form-control mb-2"
                    maxLength={48}
                    name="favorite_topic"
                    placeholder="مثلاً: حلقه‌ها و لیست‌ها، بازگشت، الگوریتم..."
                    type="text"
                    value={favoriteTopic}
                    onChange={(e) => setFavoriteTopic(e.currentTarget.value)}
                  />
                  <div className="d-flex flex-wrap gap-1">
                    {quickTopics.map((topic) => (
                      <button
                        key={topic}
                        className="btn btn-xs btn-outline-secondary"
                        type="button"
                        onClick={() => setFavoriteTopic(topic)}
                      >
                        + {topic}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label fw-semibold" htmlFor="sh-profile-github">
                    نام کاربری گیت‌هاب (اختیاری)
                  </label>
                  <div className="input-group" dir="ltr">
                    <span className="input-group-text">github.com/</span>
                    <input
                      id="sh-profile-github"
                      className="form-control"
                      maxLength={39}
                      name="github_username"
                      placeholder="username"
                      type="text"
                      value={githubUsername}
                      onChange={(e) => setGithubUsername(e.currentTarget.value)}
                    />
                  </div>
                </div>

                <div className="mb-3">
                  <span className="form-label fw-semibold d-block">حس‌وحال فعلی (Status)</span>
                  <div className="d-flex flex-wrap gap-1">
                    {STATUS_PRESETS.map((st) => (
                      <button
                        key={st.id}
                        aria-pressed={statusEmoji === st.id}
                        className={clsx('sh-goal-pill flex-grow-0', {
                          'is-active': statusEmoji === st.id,
                        })}
                        type="button"
                        onClick={() => setStatusEmoji(st.id)}
                      >
                        {st.emoji ? `${st.emoji} ` : ''}
                        {st.labelFa}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="form-label fw-semibold d-block">لقب شاخص در شناسنامه</span>
                  <div className="d-flex flex-wrap gap-1">
                    {TITLE_PRESETS.map((t) => (
                      <button
                        key={t.id}
                        aria-pressed={featuredTitle === t.id}
                        className={clsx('sh-goal-pill flex-grow-0', {
                          'is-active': featuredTitle === t.id,
                          'sh-en-term': t.id !== 'auto',
                        })}
                        type="button"
                        onClick={() => setFeaturedTitle(t.id)}
                      >
                        {t.labelFa}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Column 2: Visual Avatar, Banner, Badges & Privacy */}
              <div className="col-lg-6">
                <div className="mb-3">
                  <span className="form-label fw-semibold d-block">آواتار کاربری</span>
                  <div className="sh-avatar-grid">
                    {AVATAR_PRESETS.map((preset) => (
                      <button
                        key={preset.id}
                        aria-label={preset.labelFa}
                        aria-pressed={avatarPreset === preset.id}
                        className={clsx('sh-avatar-picker-btn', {
                          'is-active': avatarPreset === preset.id,
                        })}
                        title={preset.labelFa}
                        type="button"
                        onClick={() => setAvatarPreset(preset.id)}
                      >
                        {preset.iconClass ? (
                          <i className={preset.iconClass} aria-hidden="true" />
                        ) : (
                          <span className="small fw-bold">{getInitialsFromName(previewName)}</span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-3">
                  <span className="form-label fw-semibold d-block">رنگ آواتار</span>
                  <div className="d-flex flex-wrap gap-2">
                    {AVATAR_COLORS.map((col) => (
                      <button
                        key={col.id}
                        aria-label={col.labelFa}
                        aria-pressed={avatarColor === col.id}
                        className={clsx('sh-color-swatch', col.cssClass, {
                          'is-active': avatarColor === col.id,
                        })}
                        title={col.labelFa}
                        type="button"
                        onClick={() => setAvatarColor(col.id)}
                      >
                        {avatarColor === col.id && (
                          <i className="bi bi-check-lg text-white" aria-hidden="true" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-3">
                  <span className="form-label fw-semibold d-block">تم هدر Coding Passport</span>
                  <div className="sh-theme-grid">
                    {BANNER_THEMES.map((theme) => (
                      <button
                        key={theme.id}
                        aria-pressed={bannerTheme === theme.id}
                        className={clsx('sh-theme-swatch', theme.cssClass, {
                          'is-active': bannerTheme === theme.id,
                        })}
                        type="button"
                        onClick={() => setBannerTheme(theme.id)}
                      >
                        <span className="small fw-semibold text-white">{theme.labelFa}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mb-3">
                  <span className="form-label fw-semibold d-block">
                    سنجاق کردن مدال‌های برگزیده (حداکثر ۳ مدال)
                  </span>
                  {earnedBadges.length === 0 ? (
                    <div className="small text-body-secondary p-2 rounded border bg-body-tertiary">
                      پس از کسب اولین دستاورد در تمرین‌ها، می‌توانید تا ۳ مدال دلخواه را برای نمایش
                      کنار اسمتان سنجاق کنید.
                    </div>
                  ) : (
                    <div className="d-flex flex-wrap gap-1">
                      {earnedBadges.map((badge) => {
                        const isPinned = pinnedBadgeSet.has(badge.id);
                        return (
                          <button
                            key={badge.id}
                            aria-pressed={isPinned}
                            className={clsx('sh-goal-pill flex-grow-0 sh-en-term', {
                              'is-active': isPinned,
                            })}
                            title={badge.description}
                            type="button"
                            onClick={() => togglePinnedBadge(badge.id)}
                          >
                            <i className={`${badge.iconClass} me-1`} aria-hidden="true" />
                            {badge.title}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="p-3 rounded border bg-body-tertiary">
                  <div className="fw-bold small mb-2 d-flex align-items-center gap-1">
                    <i className="bi bi-shield-lock text-primary" aria-hidden="true" />
                    <span>تنظیمات حریم خصوصی</span>
                  </div>
                  <div className="form-check form-switch mb-2">
                    <input
                      aria-checked={showOnLeaderboard}
                      checked={showOnLeaderboard}
                      className="form-check-input"
                      id="sh-priv-leaderboard"
                      role="switch"
                      type="checkbox"
                      onChange={(e) => setShowOnLeaderboard(e.currentTarget.checked)}
                    />
                    <label className="form-check-label small" htmlFor="sh-priv-leaderboard">
                      نمایش نام واقعی/مستعار در لیدربورد (در صورت خاموش بودن: حالت ناشناس)
                    </label>
                  </div>
                  <div className="form-check form-switch mb-2">
                    <input
                      aria-checked={showPassportDetails}
                      checked={showPassportDetails}
                      className="form-check-input"
                      disabled={!showOnLeaderboard}
                      id="sh-priv-passport"
                      role="switch"
                      type="checkbox"
                      onChange={(e) => setShowPassportDetails(e.currentTarget.checked)}
                    />
                    <label className="form-check-label small" htmlFor="sh-priv-passport">
                      اجازه باز شدن شناسنامه برنامه‌نویسی برای هم‌کلاسی‌ها
                    </label>
                  </div>
                  <div className="form-check form-switch mb-0">
                    <input
                      aria-checked={showActivityStats}
                      checked={showActivityStats}
                      className="form-check-input"
                      disabled={!showOnLeaderboard || !showPassportDetails}
                      id="sh-priv-stats"
                      role="switch"
                      type="checkbox"
                      onChange={(e) => setShowActivityStats(e.currentTarget.checked)}
                    />
                    <label className="form-check-label small" htmlFor="sh-priv-stats">
                      نمایش آمار Streak، نرخ قبولی و پیشرفت مباحث در شناسنامه
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-top d-flex flex-wrap align-items-center justify-content-between gap-2">
              <span className="small text-body-secondary">
                شماره دانشجویی، ایمیل و نمرات امتحانی هرگز در پروفایل عمومی نمایش داده نمی‌شوند.
              </span>
              <button className="btn btn-primary" type="submit">
                <i className="bi bi-check2-circle me-1" aria-hidden="true" />
                ذخیره پروفایل عمومی
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

function UserProfileCard({
  user,
  institution,
  authnProviderName,
  ipAddress,
}: {
  user: UserSettingsPageProps['user'];
  institution: UserSettingsPageProps['institution'];
  authnProviderName: string;
  ipAddress: string | undefined;
}) {
  return (
    <div className="card mb-4">
      <div className="card-header bg-primary text-white d-flex align-items-center">
        <h2 className="h5 mb-0">مشخصات و هویت کاربر</h2>
      </div>
      <div className="table-responsive">
        <table className="table table-sm two-column-description" aria-label="اطلاعات کاربری">
          <tbody>
            <tr>
              <th>{uiStrings.common.uid}</th>
              <td dir="ltr" style={{ textAlign: 'right' }}>
                {user.uid}
              </td>
            </tr>
            <tr>
              <th>{uiStrings.common.name}</th>
              <td>{user.name || '—'}</td>
            </tr>
            <tr>
              <th>{uiStrings.userSettings.uin}</th>
              <td>{user.uin || '—'}</td>
            </tr>
            <tr>
              <th>{uiStrings.common.email}</th>
              <td dir="ltr" style={{ textAlign: 'right' }}>
                {user.email || '—'}
              </td>
            </tr>
            <tr>
              <th>{uiStrings.common.institution}</th>
              <td>
                {institution.long_name} ({institution.short_name})
              </td>
            </tr>
            <tr>
              <th>{uiStrings.userSettings.authMethod}</th>
              <td>{authnProviderName}</td>
            </tr>
            <tr>
              <th>{uiStrings.userSettings.ipAddress}</th>
              <td dir="ltr" style={{ textAlign: 'right' }}>
                {ipAddress ?? <em>{uiStrings.common.unknown}</em>}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PersonalAccessTokensCard({
  accessTokens,
  newAccessTokens,
  isExamMode,
  csrfToken,
}: {
  accessTokens: UserAccessToken[];
  newAccessTokens: string[];
  isExamMode: boolean;
  csrfToken: string;
}) {
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [tokenToDelete, setTokenToDelete] = useState<UserAccessToken | null>(null);

  return (
    <>
      <div className="card mb-4">
        <div className="card-header bg-primary text-white d-flex align-items-center">
          <h2 className="h5 mb-0">توکن‌های دسترسی شخصی (API Tokens)</h2>
          {!isExamMode && (
            <button
              type="button"
              className="btn btn-light btn-sm ms-auto"
              data-testid="generate-token-button"
              aria-label="ایجاد توکن دسترسی"
              onClick={() => setShowGenerateModal(true)}
            >
              <i className="fa fa-plus me-1" aria-hidden="true" />
              <span className="d-none d-sm-inline">ایجاد توکن جدید</span>
            </button>
          )}
        </div>
        {newAccessTokens.length > 0 && (
          <div className="card-body">
            <div className="alert alert-primary" role="alert">
              توکن دسترسی جدید با موفقیت ایجاد شد! حتماً اکنون آن را کپی نمایید، زیرا پس از بستن این
              بخش مجدداً نمایش داده نخواهد شد.
            </div>
            {newAccessTokens.map((token) => (
              <div
                key={token}
                className="alert alert-success mb-0 d-flex align-items-center justify-content-between"
                role="alert"
              >
                <span className="new-access-token font-monospace" dir="ltr">
                  {token}
                </span>
                <button
                  type="button"
                  className="ms-2 btn btn-sm btn-outline-success js-copy-button"
                  data-clipboard-text={token}
                  aria-label="کپی توکن"
                >
                  <i className="bi bi-clipboard me-1" /> کپی
                </button>
              </div>
            ))}
          </div>
        )}
        <ul className="list-group list-group-flush">
          <TokenList
            accessTokens={accessTokens}
            isExamMode={isExamMode}
            onDeleteToken={setTokenToDelete}
          />
        </ul>
        <div className="card-footer small text-muted">
          از توکن‌های دسترسی می‌توان جهت فراخوانی API سامانه توسط اسکریپت‌های اساتید یا دستیاران آموزشی
          استفاده نمود. در حفظ و نگهداری آن کوشا باشید.
        </div>
      </div>

      <GenerateTokenModal
        show={showGenerateModal}
        csrfToken={csrfToken}
        onClose={() => setShowGenerateModal(false)}
      />

      <DeleteTokenModal
        token={tokenToDelete}
        csrfToken={csrfToken}
        onClose={() => setTokenToDelete(null)}
      />
    </>
  );
}

function TokenList({
  accessTokens,
  isExamMode,
  onDeleteToken,
}: {
  accessTokens: UserAccessToken[];
  isExamMode: boolean;
  onDeleteToken: (token: UserAccessToken) => void;
}) {
  if (isExamMode) {
    return (
      <li className="list-group-item">
        <span className="text-muted">در حالت آزمون، توکن‌های دسترسی غیرفعال هستند.</span>
      </li>
    );
  }

  if (accessTokens.length === 0) {
    return (
      <li className="list-group-item">
        <span className="text-muted">در حال حاضر توکن دسترسی فعالی ایجاد نکرده‌اید.</span>
      </li>
    );
  }

  return (
    <>
      {accessTokens.map((token) => (
        <li key={token.id} className="list-group-item d-flex align-items-center">
          <div className="d-flex flex-column me-3">
            <strong>{token.name}</strong>
            <span className="text-muted small">
              تاریخ ایجاد: <FriendlyDate date={token.created_at} timezone="Asia/Tehran" />
            </span>
            <span className="text-muted small">
              {token.last_used_at !== null ? (
                <>
                  آخرین استفاده: <FriendlyDate date={token.last_used_at} timezone="Asia/Tehran" />
                </>
              ) : (
                'تاکنون استفاده نشده'
              )}
            </span>
          </div>
          <button
            type="button"
            className="btn btn-outline-danger btn-sm ms-auto"
            onClick={() => onDeleteToken(token)}
          >
            حذف توکن
          </button>
        </li>
      ))}
    </>
  );
}

// Example of broken LaTeX rendering that users might see if MathJax isn't working.
const EXAMPLE_BROKEN_LATEX = String.raw`$ x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a} $`;

function BrowserConfigurationCard() {
  const handleResetMathJax = () => {
    localStorage.removeItem('MathJax-Menu-Settings');
    // oxlint-disable-next-line no-alert -- Matches original behavior for user feedback
    alert('تنظیمات فونت ریاضی MathJax بازنشانی شد.');
  };

  return (
    <div className="card mb-4">
      <div className="card-header bg-primary text-white d-flex">
        <h2 className="h5 mb-0">تنظیمات فرمول‌نویسی و رندر مرورگر</h2>
      </div>
      <div className="card-body">
        <p>
          این بخش به شما امکان می‌دهد تنظیمات رندر فرمول‌های ریاضی و کش محلی مرورگر را در صورت مشاهده
          بهم‌ریختگی بازنشانی نمایید.
        </p>
        <p>
          اگر فرمول‌های ریاضی به‌صورت کد خام مانند{' '}
          <span dir="ltr">
            <strong>{EXAMPLE_BROKEN_LATEX}</strong>
          </span>{' '}
          نمایش داده می‌شوند، کلیک بر روی دکمه زیر مشکل را برطرف می‌کند.
        </p>
        <button type="button" className="btn btn-sm btn-primary" onClick={handleResetMathJax}>
          بازنشانی تنظیمات فرمول‌های ریاضی (MathJax)
        </button>
      </div>
    </div>
  );
}

function UserSettingsCard({
  initialEnableSingleKeyShortcuts,
}: {
  initialEnableSingleKeyShortcuts: boolean;
}) {
  const trpc = useTRPC();
  const [enableSingleKeyShortcuts, setEnableSingleKeyShortcuts] = useState(
    initialEnableSingleKeyShortcuts,
  );
  const [savedEnableSingleKeyShortcuts, setSavedEnableSingleKeyShortcuts] = useState(
    initialEnableSingleKeyShortcuts,
  );
  const updateMutation = useMutation({
    ...trpc.settings.update.mutationOptions(),
    onSuccess: ({ enableSingleKeyShortcuts: savedValue }) => {
      setEnableSingleKeyShortcuts(savedValue);
      setSavedEnableSingleKeyShortcuts(savedValue);
    },
  });
  const appError = getAppError<UserSettingsError['Update']>(updateMutation.error);
  const isDirty = enableSingleKeyShortcuts !== savedEnableSingleKeyShortcuts;

  return (
    <div className="card mb-4">
      <div className="card-header bg-primary text-white d-flex align-items-center">
        <h2 className="h5 mb-0">ترجیحات کاربری و کلیدهای میانبر</h2>
      </div>
      <div className="card-body">
        <div className="form-check form-switch">
          <input
            id="enable-keyboard-shortcuts"
            className="form-check-input"
            type="checkbox"
            // False positive: https://github.com/oxc-project/oxc/issues/24838
            // oxlint-disable-next-line jsx-a11y/role-has-required-aria-props
            role="switch"
            aria-describedby="enable-keyboard-shortcuts-description"
            checked={enableSingleKeyShortcuts}
            disabled={updateMutation.isPending}
            onChange={(event) => {
              updateMutation.reset();
              setEnableSingleKeyShortcuts(event.currentTarget.checked);
            }}
          />
          <label className="form-check-label fw-semibold" htmlFor="enable-keyboard-shortcuts">
            فعال‌سازی کلیدهای میانبر تک‌کلیدی
          </label>
          <div id="enable-keyboard-shortcuts-description" className="form-text mt-1">
            امکان استفاده از میانبرهای کیبورد برای جابجایی سریع میان سوالات و ثبت نمرات تصحیح دستی.
          </div>
        </div>

        <AppErrorAlert
          error={appError}
          className="mt-3 mb-0"
          render={{ UNKNOWN: ({ message }) => message }}
          onDismiss={() => updateMutation.reset()}
        />

        <div className="d-flex align-items-center gap-2 mt-3">
          <button
            type="button"
            className="btn btn-primary"
            disabled={!isDirty || updateMutation.isPending}
            onClick={() => updateMutation.mutate({ enableSingleKeyShortcuts })}
          >
            {updateMutation.isPending && (
              <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />
            )}
            {updateMutation.isPending ? 'در حال ذخیره‌سازی…' : 'ذخیره تنظیمات'}
          </button>
          <span
            className={clsx('small text-success', {
              invisible: !updateMutation.isSuccess || isDirty,
            })}
            aria-hidden={!updateMutation.isSuccess || isDirty}
          >
            <i className="bi bi-check-circle-fill me-1" aria-hidden="true" />
            تنظیمات با موفقیت ذخیره گردید.
          </span>
          <span className="visually-hidden" role="status" aria-live="polite">
            {updateMutation.isSuccess && !isDirty ? 'تنظیمات ذخیره شد' : ''}
          </span>
        </div>
      </div>
    </div>
  );
}
