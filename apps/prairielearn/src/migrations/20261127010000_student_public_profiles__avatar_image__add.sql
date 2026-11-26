ALTER TABLE student_public_profiles
ADD COLUMN IF NOT EXISTS avatar_image BYTEA,
ADD COLUMN IF NOT EXISTS avatar_mime_type TEXT,
ADD COLUMN IF NOT EXISTS avatar_updated_at TIMESTAMPTZ;

UPDATE student_public_profiles
SET
  display_alias = NULL,
  show_on_leaderboard = TRUE,
  show_passport_details = TRUE,
  show_activity_stats = TRUE
WHERE
  display_alias IS NOT NULL
  OR show_on_leaderboard IS FALSE
  OR show_passport_details IS FALSE
  OR show_activity_stats IS FALSE;
