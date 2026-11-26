-- BLOCK select_student_public_profile
SELECT
  avatar_preset,
  avatar_color,
  CASE
    WHEN avatar_updated_at IS NOT NULL THEN FLOOR(
      EXTRACT(
        EPOCH
        FROM
          avatar_updated_at
      ) * 1000
    )::bigint::text
    ELSE NULL
  END AS avatar_version,
  banner_theme,
  bio,
  status_emoji,
  favorite_topic,
  github_username,
  featured_title,
  pinned_badge_ids
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
    NULL,
    $avatar_preset,
    $avatar_color,
    $banner_theme,
    $bio,
    $status_emoji,
    $favorite_topic,
    $github_username,
    $featured_title,
    $pinned_badge_ids,
    TRUE,
    TRUE,
    TRUE,
    CURRENT_TIMESTAMP
  )
ON CONFLICT (user_id) DO UPDATE
SET
  display_alias = NULL,
  avatar_preset = EXCLUDED.avatar_preset,
  avatar_color = EXCLUDED.avatar_color,
  banner_theme = EXCLUDED.banner_theme,
  bio = EXCLUDED.bio,
  status_emoji = EXCLUDED.status_emoji,
  favorite_topic = EXCLUDED.favorite_topic,
  github_username = EXCLUDED.github_username,
  featured_title = EXCLUDED.featured_title,
  pinned_badge_ids = EXCLUDED.pinned_badge_ids,
  show_on_leaderboard = TRUE,
  show_passport_details = TRUE,
  show_activity_stats = TRUE,
  updated_at = CURRENT_TIMESTAMP;

-- BLOCK select_student_avatar_image
SELECT
  avatar_image,
  avatar_mime_type,
  FLOOR(
    EXTRACT(
      EPOCH
      FROM
        avatar_updated_at
    ) * 1000
  )::bigint::text AS avatar_version
FROM
  student_public_profiles
WHERE
  user_id = $user_id
  AND avatar_image IS NOT NULL
  AND avatar_mime_type IS NOT NULL;

-- BLOCK select_student_avatar_meta
SELECT
  avatar_preset,
  avatar_color,
  CASE
    WHEN avatar_updated_at IS NOT NULL THEN FLOOR(
      EXTRACT(
        EPOCH
        FROM
          avatar_updated_at
      ) * 1000
    )::bigint::text
    ELSE NULL
  END AS avatar_version
FROM
  student_public_profiles
WHERE
  user_id = $user_id;

-- BLOCK upsert_student_avatar_image
INSERT INTO
  student_public_profiles (
    user_id,
    avatar_image,
    avatar_mime_type,
    avatar_updated_at,
    updated_at
  )
VALUES
  (
    $user_id,
    $avatar_image,
    $avatar_mime_type,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
  )
ON CONFLICT (user_id) DO UPDATE
SET
  avatar_image = EXCLUDED.avatar_image,
  avatar_mime_type = EXCLUDED.avatar_mime_type,
  avatar_updated_at = CURRENT_TIMESTAMP,
  updated_at = CURRENT_TIMESTAMP
RETURNING
  FLOOR(
    EXTRACT(
      EPOCH
      FROM
        avatar_updated_at
    ) * 1000
  )::bigint::text AS avatar_version;

-- BLOCK delete_student_avatar_image
UPDATE student_public_profiles
SET
  avatar_image = NULL,
  avatar_mime_type = NULL,
  avatar_updated_at = NULL,
  updated_at = CURRENT_TIMESTAMP
WHERE
  user_id = $user_id;

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
