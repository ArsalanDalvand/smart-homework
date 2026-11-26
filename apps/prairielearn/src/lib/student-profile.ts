import { z } from 'zod';

import * as sqldb from '@prairielearn/postgres';

import {
  type AchievementTier,
  getStudentGamificationProfile,
  invalidateStudentGamificationCache,
} from './student-gamification.js';
import {
  DEFAULT_STUDENT_PUBLIC_PROFILE,
  type StudentPublicProfile,
  getUserAvatarUrl,
  sanitizePublicProfileInput,
} from './student-profile.shared.js';

const sql = sqldb.loadSqlEquiv(import.meta.url);

const AVATAR_MAX_BYTES = 250 * 1024;
const AVATAR_MIN_BYTES = 64;
const AVATAR_META_CACHE_TTL_MS = 30 * 1000;
const AVATAR_META_CACHE_MAX_ENTRIES = 1000;

export interface EarnedBadgeForPinning {
  id: string;
  title: string;
  tier: AchievementTier;
  iconClass: string;
  description: string;
}

export interface UserAvatarMeta {
  avatarPreset: string;
  avatarColor: string;
  avatarVersion: string | null;
}

export type ValidatedAvatarMimeType = 'image/webp' | 'image/jpeg' | 'image/png';

const PublicProfileRowSchema = z.object({
  avatar_preset: z.string(),
  avatar_color: z.string(),
  avatar_version: z.string().nullable(),
  banner_theme: z.string(),
  bio: z.string().nullable(),
  status_emoji: z.string(),
  favorite_topic: z.string().nullable(),
  github_username: z.string().nullable(),
  featured_title: z.string(),
  pinned_badge_ids: z.array(z.string()).catch([]),
});

const AvatarImageRowSchema = z.object({
  avatar_image: z.instanceof(Buffer),
  avatar_mime_type: z.enum(['image/webp', 'image/jpeg', 'image/png']),
  avatar_version: z.string(),
});

const AvatarMetaRowSchema = z.object({
  avatar_preset: z.string(),
  avatar_color: z.string(),
  avatar_version: z.string().nullable(),
});

const JoinedCourseInstanceRowSchema = z.object({
  course_instance_id: z.string(),
  display_timezone: z.string(),
});

const userAvatarMetaCache = new Map<string, { value: UserAvatarMeta; expiresAt: number }>();

function detectImageMimeType(buf: Buffer): ValidatedAvatarMimeType | null {
  if (
    buf.length >= 12 &&
    buf.subarray(0, 4).toString('ascii') === 'RIFF' &&
    buf.subarray(8, 12).toString('ascii') === 'WEBP'
  ) {
    return 'image/webp';
  }
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    return 'image/jpeg';
  }
  if (
    buf.length >= 8 &&
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47 &&
    buf[4] === 0x0d &&
    buf[5] === 0x0a &&
    buf[6] === 0x1a &&
    buf[7] === 0x0a
  ) {
    return 'image/png';
  }
  return null;
}

export function parseAndValidateAvatarDataUrl(dataUrl: unknown): {
  buffer: Buffer;
  mimeType: ValidatedAvatarMimeType;
} {
  if (typeof dataUrl !== 'string') {
    throw new Error('فرمت تصویر ارسالی نامعتبر است.');
  }

  const trimmed = dataUrl.trim();
  const match = /^data:image\/(webp|jpeg|jpg|png);base64,([A-Za-z0-9+/=]+)$/.exec(trimmed);
  if (!match) {
    throw new Error('تنها فرمت‌های تصویر WebP، JPEG یا PNG پشتیبانی می‌شوند.');
  }

  const buffer = Buffer.from(match[2], 'base64');
  if (buffer.length < AVATAR_MIN_BYTES) {
    throw new Error('فایل تصویر انتخاب‌شده بیش از حد کوچک یا آسیب‌دیده است.');
  }
  if (buffer.length > AVATAR_MAX_BYTES) {
    throw new Error('حجم عکس برش‌خورده نباید بیشتر از ۲۵۰ کیلوبایت باشد.');
  }

  const actualMime = detectImageMimeType(buffer);
  if (!actualMime) {
    throw new Error('محتوای تصویر معتبر نیست (امضای فایل با نوع تصویر هم‌خوانی ندارد).');
  }

  const declaredSubtype = match[1] === 'jpg' ? 'jpeg' : match[1];
  if (`image/${declaredSubtype}` !== actualMime) {
    throw new Error('نوع تصویر با محتوای باینری آن هم‌خوانی ندارد.');
  }

  return { buffer, mimeType: actualMime };
}

export function invalidateUserAvatarMetaCache(userId: string): void {
  userAvatarMetaCache.delete(userId);
}

export async function getCachedUserAvatarMeta(userId: string): Promise<UserAvatarMeta> {
  const now = Date.now();
  const cached = userAvatarMetaCache.get(userId);
  if (cached && cached.expiresAt > now) {
    return cached.value;
  }

  const row = await sqldb.queryOptionalRow(
    sql.select_student_avatar_meta,
    { user_id: userId },
    AvatarMetaRowSchema,
  );

  const meta: UserAvatarMeta = row
    ? {
        avatarPreset: row.avatar_preset,
        avatarColor: row.avatar_color,
        avatarVersion: row.avatar_version,
      }
    : {
        avatarPreset: DEFAULT_STUDENT_PUBLIC_PROFILE.avatarPreset,
        avatarColor: DEFAULT_STUDENT_PUBLIC_PROFILE.avatarColor,
        avatarVersion: null,
      };

  if (userAvatarMetaCache.size >= AVATAR_META_CACHE_MAX_ENTRIES) {
    const oldestKey = userAvatarMetaCache.keys().next().value;
    if (oldestKey !== undefined) {
      userAvatarMetaCache.delete(oldestKey);
    }
  }
  userAvatarMetaCache.set(userId, { value: meta, expiresAt: now + AVATAR_META_CACHE_TTL_MS });
  return meta;
}

async function invalidateJoinedCourseCaches(userId: string): Promise<void> {
  invalidateUserAvatarMetaCache(userId);
  const joinedCIs = await sqldb.queryRows(
    sql.select_user_joined_course_instances,
    { user_id: userId },
    JoinedCourseInstanceRowSchema,
  );
  await Promise.all(
    joinedCIs.map((ci) => invalidateStudentGamificationCache(ci.course_instance_id, userId)),
  );
}

export async function getStudentAvatarImage(userId: string): Promise<{
  buffer: Buffer;
  mimeType: ValidatedAvatarMimeType;
  avatarVersion: string;
} | null> {
  const row = await sqldb.queryOptionalRow(
    sql.select_student_avatar_image,
    { user_id: userId },
    AvatarImageRowSchema,
  );
  if (!row) return null;
  return {
    buffer: row.avatar_image,
    mimeType: row.avatar_mime_type,
    avatarVersion: row.avatar_version,
  };
}

export async function saveStudentAvatarImage(
  userId: string,
  dataUrl: unknown,
): Promise<{ avatarVersion: string; avatarUrl: string }> {
  const { buffer, mimeType } = parseAndValidateAvatarDataUrl(dataUrl);
  const avatarVersion = await sqldb.queryScalar(
    sql.upsert_student_avatar_image,
    {
      user_id: userId,
      avatar_image: buffer,
      avatar_mime_type: mimeType,
    },
    z.string(),
  );
  await invalidateJoinedCourseCaches(userId);
  return {
    avatarVersion,
    avatarUrl: getUserAvatarUrl(userId, avatarVersion) ?? `/pl/user_avatar/${userId}`,
  };
}

export async function deleteStudentAvatarImage(userId: string): Promise<void> {
  await sqldb.execute(sql.delete_student_avatar_image, { user_id: userId });
  await invalidateJoinedCourseCaches(userId);
}

export async function getStudentPublicProfile(userId: string): Promise<StudentPublicProfile> {
  const row = await sqldb.queryOptionalRow(
    sql.select_student_public_profile,
    { user_id: userId },
    PublicProfileRowSchema,
  );
  if (!row) {
    return { ...DEFAULT_STUDENT_PUBLIC_PROFILE };
  }

  return sanitizePublicProfileInput({
    avatar_preset: row.avatar_preset,
    avatar_color: row.avatar_color,
    avatar_version: row.avatar_version,
    banner_theme: row.banner_theme,
    bio: row.bio,
    status_emoji: row.status_emoji,
    favorite_topic: row.favorite_topic,
    github_username: row.github_username,
    featured_title: row.featured_title,
    pinned_badge_ids: row.pinned_badge_ids,
  });
}

export async function getStudentPublicProfileForSettings(userId: string): Promise<{
  profile: StudentPublicProfile;
  earnedBadges: EarnedBadgeForPinning[];
}> {
  const [profile, joinedCIs] = await Promise.all([
    getStudentPublicProfile(userId),
    sqldb.queryRows(
      sql.select_user_joined_course_instances,
      { user_id: userId },
      JoinedCourseInstanceRowSchema,
    ),
  ]);

  const badgeMap = new Map<string, EarnedBadgeForPinning>();
  const profiles = await Promise.all(
    joinedCIs.slice(0, 3).map((ci) =>
      getStudentGamificationProfile({
        courseInstanceId: ci.course_instance_id,
        userId,
        timezone: ci.display_timezone,
      }).catch(() => null),
    ),
  );

  for (const prof of profiles) {
    if (!prof) continue;
    for (const ach of prof.achievements) {
      if (!ach.earned) continue;
      if (!badgeMap.has(ach.id)) {
        badgeMap.set(ach.id, {
          id: ach.id,
          title: ach.title,
          tier: ach.tier,
          iconClass: ach.iconClass,
          description: ach.description,
        });
      }
    }
  }

  return {
    profile,
    earnedBadges: Array.from(badgeMap.values()),
  };
}

export async function saveStudentPublicProfile(
  userId: string,
  profile: StudentPublicProfile,
): Promise<void> {
  await sqldb.execute(sql.upsert_student_public_profile, {
    user_id: userId,
    avatar_preset: profile.avatarPreset,
    avatar_color: profile.avatarColor,
    banner_theme: profile.bannerTheme,
    bio: profile.bio,
    status_emoji: profile.statusEmoji,
    favorite_topic: profile.favoriteTopic,
    github_username: profile.githubUsername,
    featured_title: profile.featuredTitle,
    pinned_badge_ids: profile.pinnedBadgeIds,
  });

  await invalidateJoinedCourseCaches(userId);
}
