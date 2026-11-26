-- BLOCK select_class_coop_goal
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
      a.order_by AS assessment_order,
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
      ) AS due_date,
      (
        SELECT
          aacr.date_control_release_date
        FROM
          assessment_access_control_rules AS aacr
        WHERE
          aacr.assessment_id = a.id
          AND aacr.number = 0
        LIMIT
          1
      ) AS release_date,
      (
        SELECT
          COUNT(*)::int
        FROM
          assessment_questions AS aq
        WHERE
          aq.assessment_id = a.id
          AND aq.deleted_at IS NULL
      ) AS total_questions
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
  released_hw AS (
    SELECT
      *
    FROM
      visible_hw
    WHERE
      total_questions > 0
      AND (
        release_date IS NULL
        OR release_date <= CURRENT_TIMESTAMP
        OR EXISTS (
          SELECT
            1
          FROM
            assessment_instances AS ai
          WHERE
            ai.assessment_id = visible_hw.assessment_id
        )
      )
  ),
  target_hw AS (
    SELECT
      *
    FROM
      released_hw
    ORDER BY
      CASE
        WHEN due_date IS NOT NULL
        AND due_date >= CURRENT_TIMESTAMP THEN 0
        ELSE 1
      END ASC,
      due_date ASC NULLS LAST,
      set_number DESC NULLS LAST,
      assessment_order DESC NULLS LAST,
      assessment_id DESC
    LIMIT
      1
  ),
  solve_stats AS (
    SELECT
      COUNT(DISTINCT (ai.user_id, iq.assessment_question_id)) FILTER (
        WHERE
          COALESCE(iq.highest_submission_score, 0) >= 0.9999
          OR COALESCE(iq.score_perc, 0) >= 99.99
      )::int AS current_solves,
      COUNT(DISTINCT ai.user_id) FILTER (
        WHERE
          COALESCE(iq.highest_submission_score, 0) >= 0.9999
          OR COALESCE(iq.score_perc, 0) >= 99.99
      )::int AS participant_count
    FROM
      target_hw AS th
      JOIN assessment_instances AS ai ON ai.assessment_id = th.assessment_id
      JOIN real_students AS rs ON rs.user_id = ai.user_id
      JOIN instance_questions AS iq ON iq.assessment_instance_id = ai.id
  ),
  user_stats AS (
    SELECT
      COUNT(DISTINCT iq.assessment_question_id) FILTER (
        WHERE
          COALESCE(iq.highest_submission_score, 0) >= 0.9999
          OR COALESCE(iq.score_perc, 0) >= 99.99
      )::int AS user_contributed_solves
    FROM
      target_hw AS th
      LEFT JOIN assessment_instances AS ai ON ai.assessment_id = th.assessment_id
      AND ai.user_id = $user_id
      LEFT JOIN instance_questions AS iq ON iq.assessment_instance_id = ai.id
  )
SELECT
  th.assessment_id::text,
  th.label,
  th.title,
  th.due_date,
  th.total_questions,
  (
    SELECT
      COUNT(*)::int
    FROM
      real_students
  ) AS enrolled_count,
  COALESCE(ss.current_solves, 0)::int AS current_solves,
  COALESCE(ss.participant_count, 0)::int AS participant_count,
  COALESCE(us.user_contributed_solves, 0)::int AS user_contributed_solves
FROM
  target_hw AS th
  CROSS JOIN solve_stats AS ss
  CROSS JOIN user_stats AS us;

-- BLOCK select_instance_question_submission_target
SELECT
  s.id::text AS submission_id,
  iq.assessment_question_id::text AS assessment_question_id,
  COALESCE(v.user_id, ai.user_id)::text AS student_user_id
FROM
  submissions AS s
  JOIN variants AS v ON v.id = s.variant_id
  JOIN instance_questions AS iq ON iq.id = v.instance_question_id
  JOIN assessment_instances AS ai ON ai.id = iq.assessment_instance_id
  JOIN assessments AS a ON a.id = ai.assessment_id
WHERE
  s.id = $submission_id
  AND iq.id = $instance_question_id
  AND a.course_instance_id = $course_instance_id
  AND COALESCE(s.broken, FALSE) IS FALSE
  AND COALESCE(v.broken, FALSE) IS FALSE;

-- BLOCK upsert_submission_kudos
INSERT INTO
  student_submission_kudos (
    course_instance_id,
    submission_id,
    assessment_question_id,
    student_user_id,
    awarded_by_user_id,
    kudos_type,
    note
  )
VALUES
  (
    $course_instance_id,
    $submission_id,
    $assessment_question_id,
    $student_user_id,
    $awarded_by_user_id,
    $kudos_type,
    $note
  )
ON CONFLICT (submission_id, kudos_type) DO UPDATE
SET
  note = EXCLUDED.note,
  awarded_by_user_id = EXCLUDED.awarded_by_user_id;

-- BLOCK delete_submission_kudos
DELETE FROM student_submission_kudos AS k USING submissions AS s,
variants AS v
WHERE
  k.id = $kudos_id
  AND k.course_instance_id = $course_instance_id
  AND s.id = k.submission_id
  AND v.id = s.variant_id
  AND v.instance_question_id = $instance_question_id;

-- BLOCK update_kudos_spotlight_opt_in
UPDATE student_submission_kudos
SET
  student_spotlight_opt_in = $opt_in
WHERE
  id = $kudos_id
  AND course_instance_id = $course_instance_id
  AND student_user_id = $student_user_id;

-- BLOCK select_instance_question_kudos
SELECT
  k.id::text AS kudos_id,
  k.submission_id::text AS submission_id,
  k.kudos_type,
  k.note,
  k.student_spotlight_opt_in,
  k.created_at,
  COALESCE(
    NULLIF(BTRIM(awarder.name), ''),
    split_part(awarder.uid, '@', 1)
  ) AS awarder_display_name
FROM
  student_submission_kudos AS k
  JOIN submissions AS s ON s.id = k.submission_id
  JOIN variants AS v ON v.id = s.variant_id
  JOIN users AS awarder ON awarder.id = k.awarded_by_user_id
WHERE
  k.course_instance_id = $course_instance_id
  AND v.instance_question_id = $instance_question_id
ORDER BY
  k.created_at DESC,
  k.id DESC;

-- BLOCK select_community_spotlight_solutions
SELECT
  k.id::text AS kudos_id,
  k.kudos_type,
  k.note,
  COALESCE(
    NULLIF(BTRIM(spp.display_alias), ''),
    NULLIF(BTRIM(u.name), ''),
    split_part(u.uid, '@', 1)
  ) AS student_display_name,
  (s.submitted_answer -> '_files') AS submitted_files
FROM
  student_submission_kudos AS k
  JOIN submissions AS s ON s.id = k.submission_id
  JOIN users AS u ON u.id = k.student_user_id
  LEFT JOIN student_public_profiles AS spp ON spp.user_id = u.id
WHERE
  k.course_instance_id = $course_instance_id
  AND k.assessment_question_id = $assessment_question_id
  AND k.student_spotlight_opt_in IS TRUE
  AND COALESCE(s.broken, FALSE) IS FALSE
ORDER BY
  k.created_at DESC,
  k.id DESC
LIMIT
  $limit;

-- BLOCK select_submission_speed_comparison
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
  latest_gj AS (
    SELECT DISTINCT
      ON (gj.submission_id) gj.submission_id,
      gj.grading_started_at,
      gj.grading_finished_at
    FROM
      grading_jobs AS gj
    WHERE
      gj.deleted_at IS NULL
    ORDER BY
      gj.submission_id,
      gj.id DESC
  ),
  accepted_timings AS (
    SELECT
      COALESCE(v.user_id, ai.user_id) AS user_id,
      EXISTS (
        SELECT
          1
        FROM
          real_students AS rs
        WHERE
          rs.user_id = COALESCE(v.user_id, ai.user_id)
      ) AS is_real_student,
      CASE
        WHEN (s.feedback -> 'results' ->> 'runtime_ms') ~ '^[0-9]+(\.[0-9]+)?$'
        AND (s.feedback -> 'results' ->> 'runtime_ms')::double precision > 0 THEN (s.feedback -> 'results' ->> 'runtime_ms')::double precision
        ELSE NULL
      END AS exact_ms,
      CASE
        WHEN gj.grading_started_at IS NOT NULL
        AND gj.grading_finished_at IS NOT NULL
        AND gj.grading_finished_at > gj.grading_started_at THEN EXTRACT(
          EPOCH
          FROM
            (gj.grading_finished_at - gj.grading_started_at)
        ) * 1000.0
        ELSE NULL
      END AS wall_ms
    FROM
      submissions AS s
      JOIN variants AS v ON v.id = s.variant_id
      JOIN instance_questions AS iq ON iq.id = v.instance_question_id
      JOIN assessment_instances AS ai ON ai.id = iq.assessment_instance_id
      LEFT JOIN latest_gj AS gj ON gj.submission_id = s.id
    WHERE
      iq.assessment_question_id = $assessment_question_id
      AND COALESCE(v.broken, FALSE) IS FALSE
      AND COALESCE(s.broken, FALSE) IS FALSE
      AND s.gradable IS TRUE
      AND (
        s.score >= 0.9999
        OR s.correct IS TRUE
      )
  ),
  normalized AS (
    SELECT
      user_id,
      is_real_student,
      COALESCE(exact_ms, wall_ms) AS runtime_ms,
      (exact_ms IS NOT NULL) AS is_exact
    FROM
      accepted_timings
    WHERE
      COALESCE(exact_ms, wall_ms) IS NOT NULL
      AND COALESCE(exact_ms, wall_ms) > 0
  )
SELECT
  user_id::text,
  BOOL_OR(is_real_student) AS is_real_student,
  MIN(runtime_ms)::double precision AS fastest_ms,
  BOOL_OR(is_exact) AS has_exact
FROM
  normalized
GROUP BY
  user_id;

-- BLOCK select_personal_weekly_goal
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
  first_ac AS (
    SELECT
      iq.assessment_question_id,
      MIN(
        to_char(s.date AT TIME ZONE $timezone, 'YYYY-MM-DD')
      ) FILTER (
        WHERE
          s.score >= 0.9999
          OR s.correct IS TRUE
      ) AS first_ac_day_key
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
    GROUP BY
      iq.assessment_question_id
  )
SELECT
  (
    SELECT
      tier
    FROM
      student_weekly_goals
    WHERE
      course_instance_id = $course_instance_id
      AND user_id = $user_id
      AND week_start_key = $week_start_key
    LIMIT
      1
  ) AS tier,
  (
    SELECT
      target_questions
    FROM
      student_weekly_goals
    WHERE
      course_instance_id = $course_instance_id
      AND user_id = $user_id
      AND week_start_key = $week_start_key
    LIMIT
      1
  ) AS target_questions,
  (
    SELECT
      COUNT(*)::int
    FROM
      first_ac
    WHERE
      first_ac_day_key BETWEEN $week_start_key AND $week_end_key
  ) AS solved_this_week;

-- BLOCK upsert_personal_weekly_goal
INSERT INTO
  student_weekly_goals (
    course_instance_id,
    user_id,
    week_start_key,
    tier,
    target_questions,
    updated_at
  )
VALUES
  (
    $course_instance_id,
    $user_id,
    $week_start_key,
    $tier,
    $target_questions,
    CURRENT_TIMESTAMP
  )
ON CONFLICT (course_instance_id, user_id, week_start_key) DO UPDATE
SET
  tier = EXCLUDED.tier,
  target_questions = EXCLUDED.target_questions,
  updated_at = CURRENT_TIMESTAMP;
