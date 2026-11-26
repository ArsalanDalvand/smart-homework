-- BLOCK select_student_public_profile
SELECT
  display_alias,
  avatar_preset,
  avatar_color,
  banner_theme,
  bio,
  status_emoji,
  favorite_topic,
  github_username,
  featured_title,
  pinned_badge_ids,
  show_on_leaderboard,
  show_passport_details,
  show_activity_stats
FROM
  student_public_profiles
WHERE
  user_id = $user_id;

-- BLOCK upsert_student_public_profile
INSERT INTO
  student_public_profiles (
    user_id,
    display_alias,
    avatar_preset,
    avatar_color,
    banner_theme,
    bio,
    status_emoji,
    favorite_topic,
    github_username,
    featured_title,
    pinned_badge_ids,
    show_on_leaderboard,
    show_passport_details,
    show_activity_stats,
    updated_at
  )
VALUES
  (
    $user_id,
    $display_alias,
    $avatar_preset,
    $avatar_color,
    $banner_theme,
    $bio,
    $status_emoji,
    $favorite_topic,
    $github_username,
    $featured_title,
    $pinned_badge_ids,
    $show_on_leaderboard,
    $show_passport_details,
    $show_activity_stats,
    CURRENT_TIMESTAMP
  )
ON CONFLICT (user_id) DO UPDATE
SET
  display_alias = EXCLUDED.display_alias,
  avatar_preset = EXCLUDED.avatar_preset,
  avatar_color = EXCLUDED.avatar_color,
  banner_theme = EXCLUDED.banner_theme,
  bio = EXCLUDED.bio,
  status_emoji = EXCLUDED.status_emoji,
  favorite_topic = EXCLUDED.favorite_topic,
  github_username = EXCLUDED.github_username,
  featured_title = EXCLUDED.featured_title,
  pinned_badge_ids = EXCLUDED.pinned_badge_ids,
  show_on_leaderboard = EXCLUDED.show_on_leaderboard,
  show_passport_details = EXCLUDED.show_passport_details,
  show_activity_stats = EXCLUDED.show_activity_stats,
  updated_at = CURRENT_TIMESTAMP;

-- BLOCK select_user_joined_course_instances
SELECT
  ci.id::text AS course_instance_id,
  COALESCE(
    ci.display_timezone,
    c.display_timezone,
    'Asia/Tehran'
  ) AS display_timezone
FROM
  enrollments AS e
  JOIN course_instances AS ci ON ci.id = e.course_instance_id
  JOIN courses AS c ON c.id = ci.course_id
WHERE
  e.user_id = $user_id
  AND e.status = 'joined'
  AND ci.deleted_at IS NULL
  AND c.deleted_at IS NULL
ORDER BY
  ci.id DESC
LIMIT
  5;
