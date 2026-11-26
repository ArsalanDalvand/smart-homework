-- BLOCK select_course_question_difficulty_and_first_blood
WITH real_students AS (
  SELECT e.user_id
  FROM enrollments AS e
  JOIN course_instances AS ci ON ci.id = e.course_instance_id
  WHERE e.course_instance_id = $course_instance_id
    AND e.status = 'joined'
    AND e.user_id IS NOT NULL
    AND NOT EXISTS (
      SELECT 1
      FROM course_permissions AS cp
      WHERE cp.user_id = e.user_id
        AND cp.course_id = ci.course_id
        AND cp.course_role <> 'None'
    )
),
visible_hw AS (
  SELECT a.id
  FROM assessments AS a
  LEFT JOIN assessment_modules AS am ON am.id = a.assessment_module_id
  LEFT JOIN assessment_sets AS aset ON aset.id = a.assessment_set_id
  WHERE a.course_instance_id = $course_instance_id
    AND a.deleted_at IS NULL
    AND a.type = 'Homework'
    AND COALESCE(am.name, '') <> 'STAFF'
    AND COALESCE(aset.name, '') <> 'الگو'
),
aq_stats AS (
  SELECT
    iq.assessment_question_id,
    COUNT(DISTINCT ai.user_id) FILTER (
      WHERE iq.number_attempts > 0 OR iq.status <> 'unanswered'
    )::int AS attempted_count,
    COUNT(DISTINCT ai.user_id) FILTER (
      WHERE COALESCE(iq.highest_submission_score, 0) >= 0.9999
        OR COALESCE(iq.score_perc, 0) >= 99.99
    )::int AS solved_count
  FROM instance_questions AS iq
  JOIN assessment_instances AS ai ON ai.id = iq.assessment_instance_id
  JOIN visible_hw AS vh ON vh.id = ai.assessment_id
  JOIN real_students AS rs ON rs.user_id = ai.user_id
  GROUP BY iq.assessment_question_id
),
first_blood AS (
  SELECT DISTINCT ON (iq.assessment_question_id)
    iq.assessment_question_id,
    COALESCE(v.user_id, ai.user_id) AS first_blood_user_id
  FROM submissions AS s
  JOIN variants AS v ON v.id = s.variant_id
  JOIN instance_questions AS iq ON iq.id = v.instance_question_id
  JOIN assessment_instances AS ai ON ai.id = iq.assessment_instance_id
  JOIN visible_hw AS vh ON vh.id = ai.assessment_id
  JOIN real_students AS rs ON rs.user_id = COALESCE(v.user_id, ai.user_id)
  WHERE COALESCE(v.broken, FALSE) IS FALSE
    AND COALESCE(s.broken, FALSE) IS FALSE
    AND s.gradable IS TRUE
    AND (s.score >= 0.9999 OR s.correct IS TRUE)
  ORDER BY iq.assessment_question_id, s.date ASC, s.id ASC
)
SELECT
  aq.id::text AS assessment_question_id,
  COALESCE(aqs.attempted_count, 0)::int AS attempted_count,
  COALESCE(aqs.solved_count, 0)::int AS solved_count,
  fb.first_blood_user_id::text AS first_blood_user_id
FROM assessment_questions AS aq
JOIN visible_hw AS vh ON vh.id = aq.assessment_id
LEFT JOIN aq_stats AS aqs ON aqs.assessment_question_id = aq.id
LEFT JOIN first_blood AS fb ON fb.assessment_question_id = aq.id
WHERE aq.deleted_at IS NULL;

-- BLOCK select_student_xp_and_achievement_signals
WITH visible_hw AS (
  SELECT
    a.id,
    (
      SELECT aacr.date_control_due_date
      FROM assessment_access_control_rules AS aacr
      WHERE aacr.assessment_id = a.id
        AND aacr.number = 0
      LIMIT 1
    ) AS due_date
  FROM assessments AS a
  LEFT JOIN assessment_modules AS am ON am.id = a.assessment_module_id
  LEFT JOIN assessment_sets AS aset ON aset.id = a.assessment_set_id
  WHERE a.course_instance_id = $course_instance_id
    AND a.deleted_at IS NULL
    AND a.type = 'Homework'
    AND COALESCE(am.name, '') <> 'STAFF'
    AND COALESCE(aset.name, '') <> 'الگو'
),
iq_rows AS (
  SELECT
    iq.id AS iq_id,
    iq.assessment_question_id,
    (
      COALESCE(iq.highest_submission_score, 0) >= 0.9999
      OR COALESCE(iq.score_perc, 0) >= 99.99
    ) AS is_solved,
    COALESCE(iq.score_perc, 0) AS score_perc,
    iq.number_attempts,
    (
      COALESCE(iq.first_submission_score, 0) >= 0.9999
      OR (iq.number_attempts = 1 AND COALESCE(iq.highest_submission_score, 0) >= 0.9999)
    ) AS is_oneshot,
    EXISTS (
      SELECT 1
      FROM submissions AS s_fail
      JOIN variants AS v_fail ON v_fail.id = s_fail.variant_id
      WHERE v_fail.instance_question_id = iq.id
        AND COALESCE(v_fail.broken, FALSE) IS FALSE
        AND COALESCE(s_fail.broken, FALSE) IS FALSE
        AND s_fail.gradable IS TRUE
        AND COALESCE(s_fail.score, 0) < 0.3
      HAVING COUNT(*) >= 3
    ) AS had_three_low_fails
  FROM instance_questions AS iq
  JOIN assessment_instances AS ai ON ai.id = iq.assessment_instance_id
  JOIN visible_hw AS vh ON vh.id = ai.assessment_id
  WHERE ai.user_id = $user_id
),
iq_agg AS (
  SELECT
    COALESCE(
      ARRAY_AGG(DISTINCT assessment_question_id::text) FILTER (WHERE is_solved),
      ARRAY[]::text[]
    ) AS solved_aq_ids,
    COALESCE(
      ARRAY_AGG(DISTINCT assessment_question_id::text) FILTER (WHERE is_oneshot),
      ARRAY[]::text[]
    ) AS oneshot_aq_ids,
    COALESCE(
      SUM(LEAST(99.0, GREATEST(0.0, score_perc))) FILTER (WHERE NOT is_solved AND score_perc > 0),
      0.0
    )::double precision AS partial_score_sum,
    COUNT(*) FILTER (WHERE is_oneshot)::int AS oneshot_count,
    COUNT(*) FILTER (WHERE is_solved AND number_attempts >= 4)::int AS edge_hunter_count,
    COUNT(*) FILTER (WHERE is_solved AND had_three_low_fails)::int AS comeback_count
  FROM iq_rows
),
hw_agg AS (
  SELECT
    COUNT(*) FILTER (WHERE COALESCE(ai.score_perc, 0) >= 99.99)::int AS perfect_hw_count,
    COUNT(*) FILTER (
      WHERE COALESCE(ai.score_perc, 0) >= 90.0
        AND vh.due_date IS NOT NULL
        AND ai.modified_at <= (vh.due_date - INTERVAL '48 hours')
    )::int AS early_bird_count
  FROM assessment_instances AS ai
  JOIN visible_hw AS vh ON vh.id = ai.assessment_id
  WHERE ai.user_id = $user_id
),
valid_subs AS (
  SELECT
    s.id AS submission_id,
    s.date,
    (s.date AT TIME ZONE $timezone) AS local_ts,
    iq.assessment_question_id,
    vh.due_date,
    (s.score >= 0.9999 OR s.correct IS TRUE) AS is_ac
  FROM submissions AS s
  JOIN variants AS v ON v.id = s.variant_id
  JOIN instance_questions AS iq ON iq.id = v.instance_question_id
  JOIN assessment_instances AS ai ON ai.id = iq.assessment_instance_id
  JOIN visible_hw AS vh ON vh.id = ai.assessment_id
  WHERE COALESCE(v.broken, FALSE) IS FALSE
    AND COALESCE(s.broken, FALSE) IS FALSE
    AND s.gradable IS TRUE
    AND (ai.user_id = $user_id OR v.user_id = $user_id)
),
sub_agg AS (
  SELECT
    COUNT(*)::int AS total_submissions,
    COUNT(*) FILTER (WHERE is_ac)::int AS accepted_submissions,
    COUNT(DISTINCT to_char(local_ts, 'YYYY-MM-DD'))::int AS active_days_total,
    COUNT(*) FILTER (
      WHERE is_ac
        AND (EXTRACT(HOUR FROM local_ts)::int * 60 + EXTRACT(MINUTE FROM local_ts)::int) BETWEEN 0 AND 269
    )::int AS night_owl_count,
    COUNT(*) FILTER (
      WHERE is_ac
        AND (EXTRACT(HOUR FROM local_ts)::int * 60 + EXTRACT(MINUTE FROM local_ts)::int) BETWEEN 300 AND 450
    )::int AS dawn_coder_count,
    COUNT(*) FILTER (
      WHERE is_ac
        AND due_date IS NOT NULL
        AND date >= (due_date - INTERVAL '60 minutes')
        AND date <= due_date
    )::int AS buzzer_beater_count
  FROM valid_subs
),
weekend_weeks AS (
  SELECT
    (local_ts::date - ((EXTRACT(DOW FROM local_ts::date)::int + 1) % 7)) AS sat_week_start,
    COUNT(DISTINCT assessment_question_id)::int AS weekend_solved
  FROM valid_subs
  WHERE is_ac
    AND EXTRACT(DOW FROM local_ts::date)::int IN (4, 5)
  GROUP BY 1
  HAVING COUNT(DISTINCT assessment_question_id) >= 3
)
SELECT
  iq_agg.solved_aq_ids,
  iq_agg.oneshot_aq_ids,
  iq_agg.partial_score_sum,
  iq_agg.oneshot_count,
  iq_agg.edge_hunter_count,
  iq_agg.comeback_count,
  hw_agg.perfect_hw_count,
  hw_agg.early_bird_count,
  sub_agg.total_submissions,
  sub_agg.accepted_submissions,
  sub_agg.active_days_total,
  sub_agg.night_owl_count,
  sub_agg.dawn_coder_count,
  sub_agg.buzzer_beater_count,
  (SELECT COUNT(*)::int FROM weekend_weeks) AS weekend_warrior_weeks
FROM iq_agg, hw_agg, sub_agg;

-- BLOCK select_student_weekly_quest_signals
WITH visible_hw AS (
  SELECT a.id
  FROM assessments AS a
  LEFT JOIN assessment_modules AS am ON am.id = a.assessment_module_id
  LEFT JOIN assessment_sets AS aset ON aset.id = a.assessment_set_id
  WHERE a.course_instance_id = $course_instance_id
    AND a.deleted_at IS NULL
    AND a.type = 'Homework'
    AND COALESCE(am.name, '') <> 'STAFF'
    AND COALESCE(aset.name, '') <> 'الگو'
),
week_subs AS (
  SELECT
    s.date,
    to_char(s.date AT TIME ZONE $timezone, 'YYYY-MM-DD') AS day_key,
    iq.id AS iq_id,
    iq.assessment_question_id,
    iq.number_attempts,
    (s.score >= 0.9999 OR s.correct IS TRUE) AS is_ac
  FROM submissions AS s
  JOIN variants AS v ON v.id = s.variant_id
  JOIN instance_questions AS iq ON iq.id = v.instance_question_id
  JOIN assessment_instances AS ai ON ai.id = iq.assessment_instance_id
  JOIN visible_hw AS vh ON vh.id = ai.assessment_id
  WHERE COALESCE(v.broken, FALSE) IS FALSE
    AND COALESCE(s.broken, FALSE) IS FALSE
    AND s.gradable IS TRUE
    AND (ai.user_id = $user_id OR v.user_id = $user_id)
),
first_ac_per_aq AS (
  SELECT
    assessment_question_id,
    MIN(day_key) FILTER (WHERE is_ac) AS first_ac_day_key,
    BOOL_OR(is_ac AND day_key BETWEEN $week_start_key AND $week_end_key AND number_attempts <= 2) AS has_clean_week,
    BOOL_OR(is_ac AND day_key BETWEEN $week_start_key AND $week_end_key AND number_attempts = 1) AS has_oneshot_week,
    BOOL_OR(NOT is_ac) AS had_prior_fail
  FROM week_subs
  GROUP BY assessment_question_id
)
SELECT
  (
    SELECT COUNT(DISTINCT day_key)::int
    FROM week_subs
    WHERE day_key BETWEEN $week_start_key AND $week_end_key
  ) AS active_days_week,
  (
    SELECT COUNT(*)::int
    FROM first_ac_per_aq
    WHERE first_ac_day_key BETWEEN $week_start_key AND $week_end_key
  ) AS solved_questions_week,
  (
    SELECT COUNT(*)::int
    FROM first_ac_per_aq
    WHERE first_ac_day_key BETWEEN $week_start_key AND $week_end_key
      AND has_clean_week
  ) AS clean_solves_week,
  (
    SELECT COUNT(*)::int
    FROM first_ac_per_aq
    WHERE first_ac_day_key BETWEEN $week_start_key AND $week_end_key
      AND has_oneshot_week
  ) AS oneshot_week,
  (
    SELECT COUNT(*)::int
    FROM first_ac_per_aq
    WHERE first_ac_day_key BETWEEN $week_start_key AND $week_end_key
      AND had_prior_fail
  ) AS comeback_week;

-- BLOCK select_student_skill_tree_rows
WITH visible_hw AS (
  SELECT
    a.id AS assessment_id,
    COALESCE(aset.abbreviation, '') || COALESCE(a.number, '') AS assessment_label,
    a.title AS assessment_title,
    aset.number AS set_number,
    a.order_by AS assessment_order,
    am.name AS module_name,
    am.heading AS module_heading,
    am.number AS module_number
  FROM assessments AS a
  LEFT JOIN assessment_modules AS am ON am.id = a.assessment_module_id
  LEFT JOIN assessment_sets AS aset ON aset.id = a.assessment_set_id
  WHERE a.course_instance_id = $course_instance_id
    AND a.deleted_at IS NULL
    AND a.type = 'Homework'
    AND COALESCE(am.name, '') <> 'STAFF'
    AND COALESCE(aset.name, '') <> 'الگو'
)
SELECT
  vh.assessment_id::text,
  vh.assessment_label,
  vh.assessment_title,
  ai.id::text AS assessment_instance_id,
  aq.id::text AS assessment_question_id,
  iq.id::text AS instance_question_id,
  q.id::text AS question_id,
  COALESCE(NULLIF(BTRIM(q.title), ''), q.qid, 'سوال') AS question_title,
  t.id::text AS topic_id,
  t.name AS topic_name,
  t.description AS topic_description,
  t.number AS topic_number,
  vh.module_name,
  vh.module_heading,
  vh.module_number,
  iq.score_perc,
  iq.highest_submission_score,
  COALESCE(iq.number_attempts, 0)::int AS number_attempts,
  iq.first_submission_score
FROM visible_hw AS vh
JOIN assessment_questions AS aq ON aq.assessment_id = vh.assessment_id AND aq.deleted_at IS NULL
JOIN questions AS q ON q.id = aq.question_id AND q.deleted_at IS NULL
LEFT JOIN topics AS t ON t.id = q.topic_id
LEFT JOIN assessment_instances AS ai
  ON ai.assessment_id = vh.assessment_id
  AND ai.user_id = $user_id
LEFT JOIN instance_questions AS iq
  ON iq.assessment_instance_id = ai.id
  AND iq.assessment_question_id = aq.id
ORDER BY
  t.number NULLS LAST,
  vh.set_number NULLS LAST,
  vh.assessment_order NULLS LAST,
  aq.number NULLS LAST,
  aq.id ASC;

-- BLOCK select_cohort_gamification_rows
WITH real_students AS (
  SELECT e.user_id
  FROM enrollments AS e
  JOIN course_instances AS ci ON ci.id = e.course_instance_id
  WHERE e.course_instance_id = $course_instance_id
    AND e.status = 'joined'
    AND e.user_id IS NOT NULL
    AND NOT EXISTS (
      SELECT 1
      FROM course_permissions AS cp
      WHERE cp.user_id = e.user_id
        AND cp.course_id = ci.course_id
        AND cp.course_role <> 'None'
    )
),
visible_hw AS (
  SELECT
    a.id,
    (
      SELECT aacr.date_control_due_date
      FROM assessment_access_control_rules AS aacr
      WHERE aacr.assessment_id = a.id
        AND aacr.number = 0
      LIMIT 1
    ) AS due_date
  FROM assessments AS a
  LEFT JOIN assessment_modules AS am ON am.id = a.assessment_module_id
  LEFT JOIN assessment_sets AS aset ON aset.id = a.assessment_set_id
  WHERE a.course_instance_id = $course_instance_id
    AND a.deleted_at IS NULL
    AND a.type = 'Homework'
    AND COALESCE(am.name, '') <> 'STAFF'
    AND COALESCE(aset.name, '') <> 'الگو'
),
iq_per_student AS (
  SELECT
    rs.user_id,
    COUNT(DISTINCT iq.assessment_question_id) FILTER (
      WHERE COALESCE(iq.highest_submission_score, 0) >= 0.9999 OR COALESCE(iq.score_perc, 0) >= 99.99
    )::int AS solved_count,
    COALESCE(
      SUM(LEAST(99.0, GREATEST(0.0, COALESCE(iq.score_perc, 0)))) FILTER (
        WHERE COALESCE(iq.highest_submission_score, 0) < 0.9999
          AND COALESCE(iq.score_perc, 0) < 99.99
          AND COALESCE(iq.score_perc, 0) > 0
      ),
      0.0
    )::double precision AS partial_score_sum,
    COUNT(*) FILTER (
      WHERE COALESCE(iq.first_submission_score, 0) >= 0.9999
        OR (iq.number_attempts = 1 AND COALESCE(iq.highest_submission_score, 0) >= 0.9999)
    )::int AS oneshot_count,
    COUNT(*) FILTER (
      WHERE (COALESCE(iq.highest_submission_score, 0) >= 0.9999 OR COALESCE(iq.score_perc, 0) >= 99.99)
        AND iq.number_attempts >= 4
    )::int AS edge_hunter_count
  FROM real_students AS rs
  LEFT JOIN assessment_instances AS ai ON ai.user_id = rs.user_id
  LEFT JOIN visible_hw AS vh ON vh.id = ai.assessment_id
  LEFT JOIN instance_questions AS iq ON iq.assessment_instance_id = ai.id AND vh.id IS NOT NULL
  GROUP BY rs.user_id
),
hw_per_student AS (
  SELECT
    ai.user_id,
    COUNT(*) FILTER (WHERE COALESCE(ai.score_perc, 0) >= 99.99)::int AS perfect_hw_count,
    COUNT(*) FILTER (
      WHERE COALESCE(ai.score_perc, 0) >= 90.0
        AND vh.due_date IS NOT NULL
        AND ai.modified_at <= (vh.due_date - INTERVAL '48 hours')
    )::int AS early_bird_count
  FROM assessment_instances AS ai
  JOIN visible_hw AS vh ON vh.id = ai.assessment_id
  JOIN real_students AS rs ON rs.user_id = ai.user_id
  GROUP BY ai.user_id
),
sub_per_student AS (
  SELECT
    COALESCE(v.user_id, ai.user_id) AS user_id,
    COUNT(*)::int AS total_submissions,
    COUNT(*) FILTER (WHERE s.score >= 0.9999 OR s.correct IS TRUE)::int AS accepted_submissions,
    COUNT(DISTINCT iq.assessment_question_id) FILTER (
      WHERE (s.score >= 0.9999 OR s.correct IS TRUE)
        AND s.date >= (CURRENT_TIMESTAMP - INTERVAL '7 days')
    )::int AS recent_7d_solved,
    COUNT(DISTINCT to_char(s.date AT TIME ZONE $timezone, 'YYYY-MM-DD'))::int AS active_days_total,
    COUNT(*) FILTER (
      WHERE (s.score >= 0.9999 OR s.correct IS TRUE)
        AND (
          EXTRACT(HOUR FROM (s.date AT TIME ZONE $timezone))::int * 60 +
          EXTRACT(MINUTE FROM (s.date AT TIME ZONE $timezone))::int
        ) BETWEEN 0 AND 269
    )::int AS night_owl_count,
    COUNT(*) FILTER (
      WHERE (s.score >= 0.9999 OR s.correct IS TRUE)
        AND vh.due_date IS NOT NULL
        AND s.date >= (vh.due_date - INTERVAL '60 minutes')
        AND s.date <= vh.due_date
    )::int AS buzzer_beater_count,
    COALESCE(
      ARRAY_AGG(DISTINCT to_char(s.date AT TIME ZONE $timezone, 'YYYY-MM-DD')) FILTER (
        WHERE s.date >= (CURRENT_TIMESTAMP - INTERVAL '65 days')
      ),
      ARRAY[]::text[]
    ) AS active_day_keys
  FROM submissions AS s
  JOIN variants AS v ON v.id = s.variant_id
  JOIN instance_questions AS iq ON iq.id = v.instance_question_id
  JOIN assessment_instances AS ai ON ai.id = iq.assessment_instance_id
  JOIN visible_hw AS vh ON vh.id = ai.assessment_id
  JOIN real_students AS rs ON rs.user_id = COALESCE(v.user_id, ai.user_id)
  WHERE COALESCE(v.broken, FALSE) IS FALSE
    AND COALESCE(s.broken, FALSE) IS FALSE
    AND s.gradable IS TRUE
  GROUP BY COALESCE(v.user_id, ai.user_id)
)
SELECT
  u.id::text AS user_id,
  COALESCE(NULLIF(BTRIM(u.name), ''), split_part(u.uid, '@', 1)) AS display_name,
  COALESCE(iqs.solved_count, 0)::int AS solved_count,
  COALESCE(iqs.partial_score_sum, 0.0)::double precision AS partial_score_sum,
  COALESCE(iqs.oneshot_count, 0)::int AS oneshot_count,
  COALESCE(iqs.edge_hunter_count, 0)::int AS edge_hunter_count,
  COALESCE(hws.perfect_hw_count, 0)::int AS perfect_hw_count,
  COALESCE(hws.early_bird_count, 0)::int AS early_bird_count,
  COALESCE(sps.total_submissions, 0)::int AS total_submissions,
  COALESCE(sps.accepted_submissions, 0)::int AS accepted_submissions,
  COALESCE(sps.recent_7d_solved, 0)::int AS recent_7d_solved,
  COALESCE(sps.active_days_total, 0)::int AS active_days_total,
  COALESCE(sps.night_owl_count, 0)::int AS night_owl_count,
  COALESCE(sps.buzzer_beater_count, 0)::int AS buzzer_beater_count,
  COALESCE(sps.active_day_keys, ARRAY[]::text[]) AS active_day_keys
FROM real_students AS rs
JOIN users AS u ON u.id = rs.user_id
LEFT JOIN iq_per_student AS iqs ON iqs.user_id = rs.user_id
LEFT JOIN hw_per_student AS hws ON hws.user_id = rs.user_id
LEFT JOIN sub_per_student AS sps ON sps.user_id = rs.user_id;
