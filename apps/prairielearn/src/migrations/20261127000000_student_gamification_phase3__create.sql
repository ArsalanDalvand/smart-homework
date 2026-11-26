CREATE TABLE IF NOT EXISTS student_submission_kudos (
  id BIGSERIAL PRIMARY KEY,
  course_instance_id BIGINT NOT NULL REFERENCES course_instances (id) ON DELETE CASCADE,
  submission_id BIGINT NOT NULL REFERENCES submissions (id) ON DELETE CASCADE,
  assessment_question_id BIGINT NOT NULL REFERENCES assessment_questions (id) ON DELETE CASCADE,
  student_user_id BIGINT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  awarded_by_user_id BIGINT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  kudos_type TEXT NOT NULL CHECK (kudos_type IN ('clean_code', 'creative_solution')),
  note TEXT,
  student_spotlight_opt_in BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (submission_id, kudos_type)
);

CREATE INDEX IF NOT EXISTS student_submission_kudos_ci_student_idx ON student_submission_kudos (course_instance_id, student_user_id);

CREATE INDEX IF NOT EXISTS student_submission_kudos_spotlight_idx ON student_submission_kudos (
  course_instance_id,
  assessment_question_id,
  student_spotlight_opt_in
);

CREATE TABLE IF NOT EXISTS student_daily_pulse_attempts (
  id BIGSERIAL PRIMARY KEY,
  course_instance_id BIGINT NOT NULL REFERENCES course_instances (id) ON DELETE CASCADE,
  user_id BIGINT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  jalali_day_key TEXT NOT NULL,
  puzzle_id TEXT NOT NULL,
  selected_option INTEGER NOT NULL CHECK (selected_option BETWEEN 0 AND 3),
  is_correct BOOLEAN NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (course_instance_id, user_id, jalali_day_key)
);

CREATE INDEX IF NOT EXISTS student_daily_pulse_attempts_ci_user_day_idx ON student_daily_pulse_attempts (course_instance_id, user_id, jalali_day_key);

CREATE TABLE IF NOT EXISTS student_weekly_goals (
  id BIGSERIAL PRIMARY KEY,
  course_instance_id BIGINT NOT NULL REFERENCES course_instances (id) ON DELETE CASCADE,
  user_id BIGINT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  week_start_key TEXT NOT NULL,
  tier TEXT NOT NULL CHECK (tier IN ('light', 'balanced', 'pro')),
  target_questions INTEGER NOT NULL CHECK (
    target_questions > 0
    AND target_questions <= 50
  ),
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (course_instance_id, user_id, week_start_key)
);

CREATE INDEX IF NOT EXISTS student_weekly_goals_ci_user_week_idx ON student_weekly_goals (course_instance_id, user_id, week_start_key);

CREATE TABLE IF NOT EXISTS student_public_profiles (
  user_id BIGINT PRIMARY KEY REFERENCES users (id) ON DELETE CASCADE,
  display_alias TEXT,
  avatar_preset TEXT NOT NULL DEFAULT 'initials',
  avatar_color TEXT NOT NULL DEFAULT 'cobalt',
  banner_theme TEXT NOT NULL DEFAULT 'nova',
  bio TEXT,
  status_emoji TEXT NOT NULL DEFAULT 'none',
  favorite_topic TEXT,
  github_username TEXT,
  featured_title TEXT NOT NULL DEFAULT 'auto',
  pinned_badge_ids TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  show_on_leaderboard BOOLEAN NOT NULL DEFAULT TRUE,
  show_passport_details BOOLEAN NOT NULL DEFAULT TRUE,
  show_activity_stats BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);
