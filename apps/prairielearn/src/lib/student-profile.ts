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
  sanitizePublicProfileInput,
} from './student-profile.shared.js';

const sql = sqldb.loadSqlEquiv(import.meta.url);

export interface EarnedBadgeForPinning {
  id: string;
  title: string;
  tier: AchievementTier;
  iconClass: string;
  description: string;
}

const PublicProfileRowSchema = z.object({
  display_alias: z.string().nullable(),
  avatar_preset: z.string(),
  avatar_color: z.string(),
  banner_theme: z.string(),
  bio: z.string().nullable(),
  status_emoji: z.string(),
  favorite_topic: z.string().nullable(),
  github_username: z.string().nullable(),
  featured_title: z.string(),
  pinned_badge_ids: z.array(z.string()).catch([]),
  show_on_leaderboard: z.boolean(),
  show_passport_details: z.boolean(),
  show_activity_stats: z.boolean(),
});

const JoinedCourseInstanceRowSchema = z.object({
  course_instance_id: z.string(),
  display_timezone: z.string(),
});

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
    display_alias: row.display_alias,
    avatar_preset: row.avatar_preset,
    avatar_color: row.avatar_color,
    banner_theme: row.banner_theme,
    bio: row.bio,
    status_emoji: row.status_emoji,
    favorite_topic: row.favorite_topic,
    github_username: row.github_username,
    featured_title: row.featured_title,
    pinned_badge_ids: row.pinned_badge_ids,
    show_on_leaderboard: row.show_on_leaderboard,
    show_passport_details: row.show_passport_details,
    show_activity_stats: row.show_activity_stats,
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
    display_alias: profile.displayAlias,
    avatar_preset: profile.avatarPreset,
    avatar_color: profile.avatarColor,
    banner_theme: profile.bannerTheme,
    bio: profile.bio,
    status_emoji: profile.statusEmoji,
    favorite_topic: profile.favoriteTopic,
    github_username: profile.githubUsername,
    featured_title: profile.featuredTitle,
    pinned_badge_ids: profile.pinnedBadgeIds,
    show_on_leaderboard: profile.showOnLeaderboard,
    show_passport_details: profile.showPassportDetails,
    show_activity_stats: profile.showActivityStats,
  });

  const joinedCIs = await sqldb.queryRows(
    sql.select_user_joined_course_instances,
    { user_id: userId },
    JoinedCourseInstanceRowSchema,
  );
  await Promise.all(
    joinedCIs.map((ci) => invalidateStudentGamificationCache(ci.course_instance_id, userId)),
  );
}
