export interface AvatarPresetMeta {
  id: string;
  labelFa: string;
  iconClass: string;
}

export interface AvatarColorMeta {
  id: string;
  labelFa: string;
  cssClass: string;
}

export interface BannerThemeMeta {
  id: string;
  labelFa: string;
  cssClass: string;
}

export interface StatusPresetMeta {
  id: string;
  emoji: string;
  labelFa: string;
}

export interface TitlePresetMeta {
  id: string;
  labelFa: string;
}

export const AVATAR_PRESETS: readonly AvatarPresetMeta[] = [
  { id: 'initials', labelFa: 'حروف اول نام', iconClass: '' },
  { id: 'terminal', labelFa: 'ترمینال', iconClass: 'bi bi-terminal-fill' },
  { id: 'rocket', labelFa: 'موشک', iconClass: 'bi bi-rocket-takeoff-fill' },
  { id: 'lightning', labelFa: 'صاعقه', iconClass: 'bi bi-lightning-charge-fill' },
  { id: 'cpu', labelFa: 'پردازنده', iconClass: 'bi bi-cpu-fill' },
  { id: 'stars', labelFa: 'ستاره', iconClass: 'bi bi-stars' },
  { id: 'shield', labelFa: 'سپر', iconClass: 'bi bi-shield-fill-check' },
  { id: 'compass', labelFa: 'قطب‌نما', iconClass: 'bi bi-compass-fill' },
  { id: 'gem', labelFa: 'الماس', iconClass: 'bi bi-gem' },
  { id: 'code', labelFa: 'کدنویسی', iconClass: 'bi bi-code-slash' },
  { id: 'bug', labelFa: 'شکار باگ', iconClass: 'bi bi-bug-fill' },
  { id: 'fire', labelFa: 'شعله Streak', iconClass: 'bi bi-fire' },
  { id: 'trophy', labelFa: 'جام', iconClass: 'bi bi-trophy-fill' },
  { id: 'braces', labelFa: 'آکولاد', iconClass: 'bi bi-braces' },
  { id: 'robot', labelFa: 'ربات', iconClass: 'bi bi-robot' },
  { id: 'mortarboard', labelFa: 'دانشگاهی', iconClass: 'bi bi-mortarboard-fill' },
];

export const AVATAR_COLORS: readonly AvatarColorMeta[] = [
  { id: 'cobalt', labelFa: 'آبی کبالت', cssClass: 'sh-av-color-cobalt' },
  { id: 'emerald', labelFa: 'سبز زمردی', cssClass: 'sh-av-color-emerald' },
  { id: 'amber', labelFa: 'کهربایی', cssClass: 'sh-av-color-amber' },
  { id: 'violet', labelFa: 'بنفش', cssClass: 'sh-av-color-violet' },
  { id: 'rose', labelFa: 'سرخابی', cssClass: 'sh-av-color-rose' },
  { id: 'cyan', labelFa: 'فیروزه‌ای', cssClass: 'sh-av-color-cyan' },
  { id: 'indigo', labelFa: 'نیلی', cssClass: 'sh-av-color-indigo' },
  { id: 'slate', labelFa: 'سربی مدرن', cssClass: 'sh-av-color-slate' },
];

export const BANNER_THEMES: readonly BannerThemeMeta[] = [
  { id: 'nova', labelFa: 'نوا آبی', cssClass: 'sh-banner-nova' },
  { id: 'aurora', labelFa: 'شفق سبز-آبی', cssClass: 'sh-banner-aurora' },
  { id: 'sunset', labelFa: 'غروب کهربایی', cssClass: 'sh-banner-sunset' },
  { id: 'midnight', labelFa: 'شب کهکشانی', cssClass: 'sh-banner-midnight' },
  { id: 'cyber', labelFa: 'سایبر بنفش', cssClass: 'sh-banner-cyber' },
  { id: 'forest', labelFa: 'جنگل عمیق', cssClass: 'sh-banner-forest' },
];

export const STATUS_PRESETS: readonly StatusPresetMeta[] = [
  { id: 'none', emoji: '', labelFa: 'بدون وضعیت' },
  { id: 'coding', emoji: '💻', labelFa: 'در حال کدنویسی' },
  { id: 'hunting', emoji: '⚡', labelFa: 'آماده First Blood' },
  { id: 'debugging', emoji: '🐛', labelFa: 'شکار باگ' },
  { id: 'coffee', emoji: '☕', labelFa: 'سوخت‌گیری با قهوه' },
  { id: 'focus', emoji: '🎯', labelFa: 'تمرکز روی تمرین جدید' },
  { id: 'helper', emoji: '🤝', labelFa: 'پایه کمک به هم‌کلاسی‌ها' },
];

export const TITLE_PRESETS: readonly TitlePresetMeta[] = [
  { id: 'auto', labelFa: 'لقب خودکار (بر اساس Level)' },
  { id: 'Pythonista', labelFa: 'Pythonista' },
  { id: 'Bug Squasher', labelFa: 'Bug Squasher' },
  { id: 'Clean Coder', labelFa: 'Clean Coder' },
  { id: 'One-Shot Sniper', labelFa: 'One-Shot Sniper' },
  { id: 'Night Coder', labelFa: 'Night Coder' },
  { id: 'Algorithm Explorer', labelFa: 'Algorithm Explorer' },
  { id: 'First Blood Hunter', labelFa: 'First Blood Hunter' },
];

export interface StudentPublicProfile {
  avatarPreset: string;
  avatarColor: string;
  avatarVersion: string | null;
  bannerTheme: string;
  bio: string | null;
  statusEmoji: string;
  favoriteTopic: string | null;
  githubUsername: string | null;
  featuredTitle: string;
  pinnedBadgeIds: string[];
}

export const DEFAULT_STUDENT_PUBLIC_PROFILE: StudentPublicProfile = {
  avatarPreset: 'initials',
  avatarColor: 'cobalt',
  avatarVersion: null,
  bannerTheme: 'nova',
  bio: null,
  statusEmoji: 'none',
  favoriteTopic: null,
  githubUsername: null,
  featuredTitle: 'auto',
  pinnedBadgeIds: [],
};

export function getUserAvatarUrl(
  userId: string | null | undefined,
  avatarVersion: string | null | undefined,
): string | null {
  if (!userId || !avatarVersion) return null;
  return `/pl/user_avatar/${encodeURIComponent(userId)}?v=${encodeURIComponent(avatarVersion)}`;
}

const AVATAR_PRESET_MAP = new Map(AVATAR_PRESETS.map((p) => [p.id, p]));
const AVATAR_COLOR_SET = new Set(AVATAR_COLORS.map((c) => c.id));
const BANNER_THEME_SET = new Set(BANNER_THEMES.map((t) => t.id));
const STATUS_PRESET_MAP = new Map(STATUS_PRESETS.map((s) => [s.id, s]));
const TITLE_PRESET_SET = new Set(TITLE_PRESETS.map((t) => t.id));

const GITHUB_USERNAME_REGEX = /^[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,37}[a-zA-Z0-9])?$/;

export function resolveAvatarIconClass(presetId: string | null | undefined): string {
  if (!presetId) return '';
  return AVATAR_PRESET_MAP.get(presetId)?.iconClass ?? '';
}

export function resolveStatusLabel(statusId: string | null | undefined): string | null {
  if (!statusId || statusId === 'none') return null;
  const preset = STATUS_PRESET_MAP.get(statusId);
  if (!preset) return null;
  return `${preset.emoji} ${preset.labelFa}`.trim();
}

export function getInitialsFromName(displayName: string): string {
  const clean = displayName.trim();
  if (!clean) return 'د';
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
  }
  return clean.slice(0, 2).toUpperCase();
}

function normalizeOptionalText(val: unknown, maxLen: number): string | null {
  if (typeof val !== 'string') return null;
  const trimmed = val.trim().replace(/\s+/g, ' ');
  if (!trimmed) return null;
  return trimmed.slice(0, maxLen);
}

function normalizeGithubUsername(val: unknown): string | null {
  if (typeof val !== 'string') return null;
  let cleaned = val.trim();
  cleaned = cleaned.replace(/^https?:\/\/(?:www\.)?github\.com\//i, '');
  cleaned = cleaned.replace(/^github\.com\//i, '');
  cleaned = cleaned.replace(/^@+/, '');
  cleaned = cleaned.replace(/\/+$/, '');
  if (!cleaned) return null;
  return GITHUB_USERNAME_REGEX.test(cleaned) ? cleaned : null;
}

function parsePinnedBadges(val: unknown): string[] {
  const rawList: string[] = Array.isArray(val)
    ? val.filter((item): item is string => typeof item === 'string')
    : typeof val === 'string'
      ? val.split(',')
      : [];

  const unique: string[] = [];
  for (const item of rawList) {
    const clean = item.trim();
    if (!clean || clean.length > 48 || !/^[a-z0-9-]+$/.test(clean)) continue;
    if (!unique.includes(clean)) {
      unique.push(clean);
    }
    if (unique.length >= 3) break;
  }
  return unique;
}

export function sanitizePublicProfileInput(raw: Record<string, unknown>): StudentPublicProfile {
  const avatarPresetRaw = typeof raw.avatar_preset === 'string' ? raw.avatar_preset.trim() : '';
  const avatarColorRaw = typeof raw.avatar_color === 'string' ? raw.avatar_color.trim() : '';
  const bannerThemeRaw = typeof raw.banner_theme === 'string' ? raw.banner_theme.trim() : '';
  const statusEmojiRaw = typeof raw.status_emoji === 'string' ? raw.status_emoji.trim() : '';
  const featuredTitleRaw = typeof raw.featured_title === 'string' ? raw.featured_title.trim() : '';
  const avatarVersionRaw =
    typeof raw.avatar_version === 'string' && /^\d{1,20}$/.test(raw.avatar_version.trim())
      ? raw.avatar_version.trim()
      : null;

  return {
    avatarPreset: AVATAR_PRESET_MAP.has(avatarPresetRaw) ? avatarPresetRaw : 'initials',
    avatarColor: AVATAR_COLOR_SET.has(avatarColorRaw) ? avatarColorRaw : 'cobalt',
    avatarVersion: avatarVersionRaw,
    bannerTheme: BANNER_THEME_SET.has(bannerThemeRaw) ? bannerThemeRaw : 'nova',
    bio: normalizeOptionalText(raw.bio, 160),
    statusEmoji: STATUS_PRESET_MAP.has(statusEmojiRaw) ? statusEmojiRaw : 'none',
    favoriteTopic: normalizeOptionalText(raw.favorite_topic, 48),
    githubUsername: normalizeGithubUsername(raw.github_username),
    featuredTitle: TITLE_PRESET_SET.has(featuredTitleRaw) ? featuredTitleRaw : 'auto',
    pinnedBadgeIds: parsePinnedBadges(raw.pinned_badge_ids),
  };
}
