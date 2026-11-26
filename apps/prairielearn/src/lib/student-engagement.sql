-- BLOCK select_student_personal_submission_metrics
WITH
  visible_hw AS (
    SELECT
      a.id
    FROM
      assessments AS a
      LEFT JOIN assessment_modules AS am ON am.id = a.assessment_module_id
      LEFT JOIN assessment_sets AS aset ON aset.id = a.assessment_set_id
    WHERE
      a.course_instance_id = $course_instance_id
      AND a.deleted_at IS NULL
      AND a.type = 'Homework'
      AND COALESCE(am.name, '') <> 'STAFF'
      AND COALESCE(aset.name, '') <> 'الگو'
  ),
  sub_agg AS (
    SELECT
      COUNT(*)::int AS total_submissions,
      COUNT(*) FILTER (
        WHERE
          s.score >= 0.9999
          OR s.correct IS TRUE
      )::int AS accepted_submissions
    FROM
      submissions AS s
      JOIN variants AS v ON v.id = s.variant_id
      JOIN instance_questions AS iq ON iq.id = v.instance_question_id
      JOIN assessment_instances AS ai ON ai.id = iq.assessment_instance_id
      JOIN visible_hw AS vh ON vh.id = ai.assessment_id
    WHERE
      COALESCE(v.broken, FALSE) IS FALSE
      AND COALESCE(s.broken, FALSE) IS FALSE
      AND s.gradable IS TRUE
      AND (
        ai.user_id = $user_id
        OR v.user_id = $user_id
      )
  ),
  iq_agg AS (
    SELECT
      COUNT(*) FILTER (
        WHERE
          iq.number_attempts > 0
          OR iq.status <> 'unanswered'
      )::int AS attempted_questions,
      COUNT(*) FILTER (
        WHERE
          COALESCE(iq.highest_submission_score, 0) >= 0.9999
          OR COALESCE(iq.score_perc, 0) >= 99.99
      )::int AS solved_questions,
      COUNT(*) FILTER (
        WHERE
          (
            iq.number_attempts > 0
            OR iq.status <> 'unanswered'
          )
          AND COALESCE(iq.highest_submission_score, 0) < 0.9999
          AND COALESCE(iq.score_perc, 0) < 99.99
          AND COALESCE(iq.score_perc, 0) > 0
      )::int AS partial_questions
    FROM
      instance_questions AS iq
      JOIN assessment_instances AS ai ON ai.id = iq.assessment_instance_id
      JOIN visible_hw AS vh ON vh.id = ai.assessment_id
    WHERE
      ai.user_id = $user_id
  )
SELECT
  sub_agg.total_submissions,
  sub_agg.accepted_submissions,
  iq_agg.attempted_questions,
  iq_agg.solved_questions,
  iq_agg.partial_questions
FROM
  sub_agg,
  iq_agg;

-- BLOCK select_student_cohort_assessment_scores
WITH
  real_students AS (
    SELECT
      e.user_id
    FROM
      enrollments AS e
      JOIN course_instances AS ci ON ci.id = e.course_instance_id
    WHERE
      e.course_instance_id = $course_instance_id
      AND e.status = 'joined'
      AND e.user_id IS NOT NULL
      AND NOT EXISTS (
        SELECT
          1
        FROM
          course_permissions AS cp
        WHERE
          cp.user_id = e.user_id
          AND cp.course_id = ci.course_id
          AND cp.course_role <> 'None'
      )
  ),
  visible_hw AS (
    SELECT
      a.id AS assessment_id,
      COALESCE(aset.abbreviation, '') || COALESCE(a.number, '') AS label,
      a.title,
      aset.number AS set_number,
      a.order_by AS assessment_order
    FROM
      assessments AS a
      LEFT JOIN assessment_modules AS am ON am.id = a.assessment_module_id
      LEFT JOIN assessment_sets AS aset ON aset.id = a.assessment_set_id
    WHERE
      a.course_instance_id = $course_instance_id
      AND a.deleted_at IS NULL
      AND a.type = 'Homework'
      AND COALESCE(am.name, '') <> 'STAFF'
      AND COALESCE(aset.name, '') <> 'الگو'
  ),
  best_student_scores AS (
    SELECT
      vh.assessment_id,
      vh.label,
      vh.title,
      vh.set_number,
      vh.assessment_order,
      ai.user_id,
      MAX(COALESCE(ai.score_perc, 0)) AS score_perc
    FROM
      visible_hw AS vh
      JOIN assessment_instances AS ai ON ai.assessment_id = vh.assessment_id
      JOIN real_students AS rs ON rs.user_id = ai.user_id
    GROUP BY
      vh.assessment_id,
      vh.label,
      vh.title,
      vh.set_number,
      vh.assessment_order,
      ai.user_id
  ),
  my_scores AS (
    SELECT
      vh.assessment_id,
      MAX(ai.score_perc) AS my_score_perc
    FROM
      visible_hw AS vh
      LEFT JOIN assessment_instances AS ai ON ai.assessment_id = vh.assessment_id
      AND ai.user_id = $user_id
    GROUP BY
      vh.assessment_id
  )
SELECT
  vh.assessment_id::text,
  vh.label,
  vh.title,
  COALESCE(COUNT(bss.user_id), 0)::int AS participant_count,
  AVG(bss.score_perc) AS avg_score,
  PERCENTILE_CONT(0.5) WITHIN GROUP (
    ORDER BY
      bss.score_perc
  ) AS median_score,
  MAX(bss.score_perc) AS max_score,
  ms.my_score_perc AS student_score,
  COALESCE(
    ARRAY_AGG(bss.score_perc) FILTER (
      WHERE
        bss.score_perc IS NOT NULL
    ),
    ARRAY[]::double precision[]
  ) AS all_scores
FROM
  visible_hw AS vh
  LEFT JOIN best_student_scores AS bss ON bss.assessment_id = vh.assessment_id
  LEFT JOIN my_scores AS ms ON ms.assessment_id = vh.assessment_id
GROUP BY
  vh.assessment_id,
  vh.label,
  vh.title,
  vh.set_number,
  vh.assessment_order,
  ms.my_score_perc
ORDER BY
  vh.set_number NULLS LAST,
  vh.assessment_order NULLS LAST,
  vh.assessment_id;

-- BLOCK select_overall_homework_cohort_totals
WITH
  real_students AS (
    SELECT
      e.user_id
    FROM
      enrollments AS e
      JOIN course_instances AS ci ON ci.id = e.course_instance_id
    WHERE
      e.course_instance_id = $course_instance_id
      AND e.status = 'joined'
      AND e.user_id IS NOT NULL
      AND NOT EXISTS (
        SELECT
          1
        FROM
          course_permissions AS cp
        WHERE
          cp.user_id = e.user_id
          AND cp.course_id = ci.course_id
          AND cp.course_role <> 'None'
      )
  ),
  visible_hw AS (
    SELECT
      a.id
    FROM
      assessments AS a
      LEFT JOIN assessment_modules AS am ON am.id = a.assessment_module_id
      LEFT JOIN assessment_sets AS aset ON aset.id = a.assessment_set_id
    WHERE
      a.course_instance_id = $course_instance_id
      AND a.deleted_at IS NULL
      AND a.type = 'Homework'
      AND COALESCE(am.name, '') <> 'STAFF'
      AND COALESCE(aset.name, '') <> 'الگو'
  ),
  per_student_assessment AS (
    SELECT
      rs.user_id,
      vh.id AS assessment_id,
      MAX(COALESCE(ai.points, 0)) AS points,
      MAX(COALESCE(ai.max_points, 0)) AS max_points
    FROM
      real_students AS rs
      JOIN assessment_instances AS ai ON ai.user_id = rs.user_id
      JOIN visible_hw AS vh ON vh.id = ai.assessment_id
    GROUP BY
      rs.user_id,
      vh.id
  )
SELECT
  user_id::text,
  CASE
    WHEN SUM(max_points) > 0 THEN LEAST(120.0, (SUM(points) / SUM(max_points)) * 100.0)
    ELSE 0.0
  END AS overall_perc
FROM
  per_student_assessment
GROUP BY
  user_id;

-- BLOCK select_student_daily_activity
WITH
  visible_hw AS (
    SELECT
      a.id
    FROM
      assessments AS a
      LEFT JOIN assessment_modules AS am ON am.id = a.assessment_module_id
      LEFT JOIN assessment_sets AS aset ON aset.id = a.assessment_set_id
    WHERE
      a.course_instance_id = $course_instance_id
      AND a.deleted_at IS NULL
      AND COALESCE(am.name, '') <> 'STAFF'
      AND COALESCE(aset.name, '') <> 'الگو'
  ),
  combined_activity AS (
    SELECT
      to_char(s.date AT TIME ZONE $timezone, 'YYYY-MM-DD') AS day_key,
      COUNT(*)::int AS activity_count
    FROM
      submissions AS s
      JOIN variants AS v ON v.id = s.variant_id
      JOIN instance_questions AS iq ON iq.id = v.instance_question_id
      JOIN assessment_instances AS ai ON ai.id = iq.assessment_instance_id
      JOIN visible_hw AS vh ON vh.id = ai.assessment_id
    WHERE
      COALESCE(v.broken, FALSE) IS FALSE
      AND COALESCE(s.broken, FALSE) IS FALSE
      AND (
        ai.user_id = $user_id
        OR v.user_id = $user_id
      )
      AND s.date >= (CURRENT_TIMESTAMP - INTERVAL '145 days')
    GROUP BY
      1
    UNION ALL
    SELECT
      dpa.jalali_day_key AS day_key,
      1::int AS activity_count
    FROM
      student_daily_pulse_attempts AS dpa
    WHERE
      dpa.course_instance_id = $course_instance_id
      AND dpa.user_id = $user_id
      AND dpa.jalali_day_key >= to_char(
        (CURRENT_TIMESTAMP - INTERVAL '145 days') AT TIME ZONE $timezone,
        'YYYY-MM-DD'
      )
  )
SELECT
  day_key,
  SUM(activity_count)::int AS submission_count
FROM
  combined_activity
GROUP BY
  day_key
ORDER BY
  day_key;

-- BLOCK select_student_badge_signals
WITH
  visible_hw AS (
    SELECT
      a.id,
      (
        SELECT
          aacr.date_control_due_date
        FROM
          assessment_access_control_rules AS aacr
        WHERE
          aacr.assessment_id = a.id
          AND aacr.number = 0
        LIMIT
          1
      ) AS due_date
    FROM
      assessments AS a
      LEFT JOIN assessment_modules AS am ON am.id = a.assessment_module_id
      LEFT JOIN assessment_sets AS aset ON aset.id = a.assessment_set_id
    WHERE
      a.course_instance_id = $course_instance_id
      AND a.deleted_at IS NULL
      AND a.type = 'Homework'
      AND COALESCE(am.name, '') <> 'STAFF'
      AND COALESCE(aset.name, '') <> 'الگو'
  ),
  iq_stats AS (
    SELECT
      COUNT(*) FILTER (
        WHERE
          COALESCE(iq.first_submission_score, 0) >= 0.9999
          OR (
            iq.number_attempts = 1
            AND COALESCE(iq.highest_submission_score, 0) >= 0.9999
          )
      )::int AS oneshot_count,
      COUNT(*) FILTER (
        WHERE
          (
            COALESCE(iq.highest_submission_score, 0) >= 0.9999
            OR COALESCE(iq.score_perc, 0) >= 99.99
          )
          AND iq.number_attempts >= 4
      )::int AS edge_hunter_count,
      COUNT(*) FILTER (
        WHERE
          COALESCE(iq.highest_submission_score, 0) >= 0.9999
          OR COALESCE(iq.score_perc, 0) >= 99.99
      )::int AS solved_count
    FROM
      instance_questions AS iq
      JOIN assessment_instances AS ai ON ai.id = iq.assessment_instance_id
      JOIN visible_hw AS vh ON vh.id = ai.assessment_id
    WHERE
      ai.user_id = $user_id
  ),
  hw_stats AS (
    SELECT
      COUNT(*) FILTER (
        WHERE
          COALESCE(ai.score_perc, 0) >= 99.99
      )::int AS perfect_hw_count,
      COUNT(*) FILTER (
        WHERE
          COALESCE(ai.score_perc, 0) >= 90.0
          AND vh.due_date IS NOT NULL
          AND ai.modified_at <= (vh.due_date - INTERVAL '48 hours')
      )::int AS early_bird_count
    FROM
      assessment_instances AS ai
      JOIN visible_hw AS vh ON vh.id = ai.assessment_id
    WHERE
      ai.user_id = $user_id
  )
SELECT
  iq_stats.oneshot_count,
  iq_stats.edge_hunter_count,
  iq_stats.solved_count,
  hw_stats.perfect_hw_count,
  hw_stats.early_bird_count
FROM
  iq_stats,
  hw_stats;

-- BLOCK select_visible_homework_list
SELECT
  a.id::text AS assessment_id,
  COALESCE(aset.abbreviation, '') || COALESCE(a.number, '') AS label,
  a.title
FROM
  assessments AS a
  LEFT JOIN assessment_modules AS am ON am.id = a.assessment_module_id
  LEFT JOIN assessment_sets AS aset ON aset.id = a.assessment_set_id
WHERE
  a.course_instance_id = $course_instance_id
  AND a.deleted_at IS NULL
  AND a.type = 'Homework'
  AND COALESCE(am.name, '') <> 'STAFF'
  AND COALESCE(aset.name, '') <> 'الگو'
ORDER BY
  aset.number NULLS LAST,
  a.order_by NULLS LAST,
  a.id;

-- BLOCK select_leaderboard_entries
WITH
  real_students AS (
    SELECT
      e.user_id
    FROM
      enrollments AS e
      JOIN course_instances AS ci ON ci.id = e.course_instance_id
    WHERE
      e.course_instance_id = $course_instance_id
      AND e.status = 'joined'
      AND e.user_id IS NOT NULL
      AND NOT EXISTS (
        SELECT
          1
        FROM
          course_permissions AS cp
        WHERE
          cp.user_id = e.user_id
          AND cp.course_id = ci.course_id
          AND cp.course_role <> 'None'
      )
  ),
  visible_hw AS (
    SELECT
      a.id
    FROM
      assessments AS a
      LEFT JOIN assessment_modules AS am ON am.id = a.assessment_module_id
      LEFT JOIN assessment_sets AS aset ON aset.id = a.assessment_set_id
    WHERE
      a.course_instance_id = $course_instance_id
      AND a.deleted_at IS NULL
      AND a.type = 'Homework'
      AND COALESCE(am.name, '') <> 'STAFF'
      AND COALESCE(aset.name, '') <> 'الگو'
      AND (
        $assessment_id::bigint IS NULL
        OR a.id = $assessment_id::bigint
      )
  ),
  per_student_assessment AS (
    SELECT
      rs.user_id,
      vh.id AS assessment_id,
      MAX(COALESCE(ai.points, 0)) AS best_points,
      MAX(COALESCE(ai.max_points, 0)) AS max_points,
      MAX(ai.modified_at) AS last_activity_at
    FROM
      real_students AS rs
      JOIN assessment_instances AS ai ON ai.user_id = rs.user_id
      JOIN visible_hw AS vh ON vh.id = ai.assessment_id
    GROUP BY
      rs.user_id,
      vh.id
  ),
  solved_counts AS (
    SELECT
      ai.user_id,
      COUNT(DISTINCT iq.assessment_question_id)::int AS solved_questions
    FROM
      instance_questions AS iq
      JOIN assessment_instances AS ai ON ai.id = iq.assessment_instance_id
      JOIN visible_hw AS vh ON vh.id = ai.assessment_id
      JOIN real_students AS rs ON rs.user_id = ai.user_id
    WHERE
      COALESCE(iq.highest_submission_score, 0) >= 0.9999
      OR COALESCE(iq.score_perc, 0) >= 99.99
    GROUP BY
      ai.user_id
  )
SELECT
  u.id::text AS user_id,
  COALESCE(
    NULLIF(BTRIM(u.name), ''),
    split_part(u.uid, '@', 1)
  ) AS display_name,
  COALESCE(spp.avatar_preset, 'initials') AS avatar_preset,
  COALESCE(spp.avatar_color, 'cobalt') AS avatar_color,
  CASE
    WHEN spp.avatar_updated_at IS NOT NULL THEN FLOOR(
      EXTRACT(
        EPOCH
        FROM
          spp.avatar_updated_at
      ) * 1000
    )::bigint::text
    ELSE NULL
  END AS avatar_version,
  COALESCE(spp.status_emoji, 'none') AS status_emoji,
  SUM(psa.best_points)::double precision AS total_points,
  SUM(psa.max_points)::double precision AS max_points,
  CASE
    WHEN SUM(psa.max_points) > 0 THEN LEAST(
      120.0,
      (SUM(psa.best_points) / SUM(psa.max_points)) * 100.0
    )
    ELSE 0.0
  END AS score_perc,
  COALESCE(sc.solved_questions, 0)::int AS solved_questions,
  MAX(psa.last_activity_at) AS last_activity_at
FROM
  per_student_assessment AS psa
  JOIN users AS u ON u.id = psa.user_id
  LEFT JOIN student_public_profiles AS spp ON spp.user_id = u.id
  LEFT JOIN solved_counts AS sc ON sc.user_id = u.id
GROUP BY
  u.id,
  u.name,
  u.uid,
  spp.avatar_preset,
  spp.avatar_color,
  spp.avatar_updated_at,
  spp.status_emoji,
  sc.solved_questions
ORDER BY
  total_points DESC,
  solved_questions DESC,
  last_activity_at ASC NULLS LAST,
  u.id ASC;

-- BLOCK select_assessment_question_stats
WITH
  real_students AS (
    SELECT
      e.user_id
    FROM
      enrollments AS e
      JOIN course_instances AS ci ON ci.id = e.course_instance_id
    WHERE
      e.course_instance_id = $course_instance_id
      AND e.status = 'joined'
      AND e.user_id IS NOT NULL
      AND NOT EXISTS (
        SELECT
          1
        FROM
          course_permissions AS cp
        WHERE
          cp.user_id = e.user_id
          AND cp.course_id = ci.course_id
          AND cp.course_role <> 'None'
      )
  )
SELECT
  iq.assessment_question_id::text AS assessment_question_id,
  COUNT(DISTINCT ai.user_id) FILTER (
    WHERE
      iq.number_attempts > 0
      OR iq.status <> 'unanswered'
  )::int AS attempted_count,
  COUNT(DISTINCT ai.user_id) FILTER (
    WHERE
      COALESCE(iq.highest_submission_score, 0) >= 0.9999
      OR COALESCE(iq.score_perc, 0) >= 99.99
  )::int AS solved_count,
  COALESCE(
    AVG(iq.number_attempts) FILTER (
      WHERE
        iq.number_attempts > 0
    ),
    0.0
  )::double precision AS avg_attempts
FROM
  instance_questions AS iq
  JOIN assessment_instances AS ai ON ai.id = iq.assessment_instance_id
  JOIN real_students AS rs ON rs.user_id = ai.user_id
WHERE
  ai.assessment_id = $assessment_id
GROUP BY
  iq.assessment_question_id;
