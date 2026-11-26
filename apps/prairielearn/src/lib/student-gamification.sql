-- BLOCK select_course_question_difficulty_and_first_blood
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
  aq_stats AS (
    SELECT
      iq.assessment_question_id,
      COUNT(DISTINCT ai.user_id) FILTER (
        WHERE
          iq.number_attempts > 0
          OR iq.status <> 'unanswered'
      )::int AS attempted_count,
      COUNT(DISTINCT ai.user_id) FILTER (
        WHERE
          COALESCE(iq.highest_submission_score, 0) >= 0.9999
          OR COALESCE(iq.score_perc, 0) >= 99.99
      )::int AS solved_count
    FROM
      instance_questions AS iq
      JOIN assessment_instances AS ai ON ai.id = iq.assessment_instance_id
      JOIN visible_hw AS vh ON vh.id = ai.assessment_id
      JOIN real_students AS rs ON rs.user_id = ai.user_id
    GROUP BY
      iq.assessment_question_id
  ),
  first_blood AS (
    SELECT DISTINCT
      ON (iq.assessment_question_id) iq.assessment_question_id,
      COALESCE(v.user_id, ai.user_id) AS first_blood_user_id
    FROM
      submissions AS s
      JOIN variants AS v ON v.id = s.variant_id
      JOIN instance_questions AS iq ON iq.id = v.instance_question_id
      JOIN assessment_instances AS ai ON ai.id = iq.assessment_instance_id
      JOIN visible_hw AS vh ON vh.id = ai.assessment_id
      JOIN real_students AS rs ON rs.user_id = COALESCE(v.user_id, ai.user_id)
    WHERE
      COALESCE(v.broken, FALSE) IS FALSE
      AND COALESCE(s.broken, FALSE) IS FALSE
      AND s.gradable IS TRUE
      AND (
        s.score >= 0.9999
        OR s.correct IS TRUE
      )
    ORDER BY
      iq.assessment_question_id,
      s.date ASC,
      s.id ASC
  )
SELECT
  aq.id::text AS assessment_question_id,
  COALESCE(aqs.attempted_count, 0)::int AS attempted_count,
  COALESCE(aqs.solved_count, 0)::int AS solved_count,
  fb.first_blood_user_id::text AS first_blood_user_id,
  CASE
    WHEN fb.first_blood_user_id IS NULL THEN NULL
    WHEN COALESCE(spp.show_on_leaderboard, TRUE) IS FALSE THEN 'دانشجوی ناشناس #' || (ABS(MOD(u.id * 2654435761, 8999)) + 1000)::text
    ELSE COALESCE(
      NULLIF(BTRIM(spp.display_alias), ''),
      NULLIF(BTRIM(u.name), ''),
      split_part(u.uid, '@', 1)
    )
  END AS first_blood_display_name
FROM
  assessment_questions AS aq
  JOIN visible_hw AS vh ON vh.id = aq.assessment_id
  LEFT JOIN aq_stats AS aqs ON aqs.assessment_question_id = aq.id
  LEFT JOIN first_blood AS fb ON fb.assessment_question_id = aq.id
  LEFT JOIN users AS u ON u.id = fb.first_blood_user_id
  LEFT JOIN student_public_profiles AS spp ON spp.user_id = fb.first_blood_user_id
WHERE
  aq.deleted_at IS NULL;

-- BLOCK select_student_xp_and_achievement_signals
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
      a.id,
      am.name AS module_name,
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
  valid_subs AS (
    SELECT
      s.id AS submission_id,
      s.date,
      s.score,
      to_char(s.date AT TIME ZONE $timezone, 'YYYY-MM-DD') AS day_key,
      (s.date AT TIME ZONE $timezone) AS local_ts,
      iq.id AS iq_id,
      iq.assessment_question_id,
      iq.number_attempts,
      COALESCE(iq.first_submission_score, 0) AS first_submission_score,
      vh.due_date,
      (
        s.score >= 0.9999
        OR s.correct IS TRUE
      ) AS is_ac,
      (
        (
          s.format_errors IS NULL
          OR s.format_errors = '{}'::jsonb
        )
        AND COALESCE(s.feedback -> 'results' ->> 'output', '') !~* '(SyntaxError|IndentationError|TabError|خطای نحوی)'
        AND COALESCE(s.feedback -> 'results' ->> 'message', '') !~* '(SyntaxError|IndentationError|TabError|خطای نحوی)'
        AND COALESCE((s.feedback -> 'results' -> 'tests')::text, '') !~* '(SyntaxError|IndentationError|TabError)'
      ) AS is_syntax_clean
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
  low_fail_iqs AS (
    SELECT
      iq_id
    FROM
      valid_subs
    WHERE
      COALESCE(score, 0) < 0.3
    GROUP BY
      iq_id
    HAVING
      COUNT(*) >= 3
  ),
  iq_rows AS (
    SELECT
      iq.id AS iq_id,
      ai.assessment_id,
      iq.assessment_question_id,
      (
        COALESCE(iq.highest_submission_score, 0) >= 0.9999
        OR COALESCE(iq.score_perc, 0) >= 99.99
      ) AS is_solved,
      COALESCE(iq.score_perc, 0) AS score_perc,
      iq.number_attempts,
      (
        COALESCE(iq.first_submission_score, 0) >= 0.9999
        OR (
          iq.number_attempts = 1
          AND COALESCE(iq.highest_submission_score, 0) >= 0.9999
        )
      ) AS is_oneshot,
      (lfi.iq_id IS NOT NULL) AS had_three_low_fails
    FROM
      instance_questions AS iq
      JOIN assessment_instances AS ai ON ai.id = iq.assessment_instance_id
      JOIN visible_hw AS vh ON vh.id = ai.assessment_id
      LEFT JOIN low_fail_iqs AS lfi ON lfi.iq_id = iq.id
    WHERE
      ai.user_id = $user_id
  ),
  iq_agg AS (
    SELECT
      COALESCE(
        ARRAY_AGG(DISTINCT assessment_question_id::text) FILTER (
          WHERE
            is_solved
        ),
        ARRAY[]::text[]
      ) AS solved_aq_ids,
      COALESCE(
        ARRAY_AGG(DISTINCT assessment_question_id::text) FILTER (
          WHERE
            is_oneshot
        ),
        ARRAY[]::text[]
      ) AS oneshot_aq_ids,
      COALESCE(
        SUM(LEAST(99.0, GREATEST(0.0, score_perc))) FILTER (
          WHERE
            NOT is_solved
            AND score_perc > 0
        ),
        0.0
      )::double precision AS partial_score_sum,
      COUNT(*) FILTER (
        WHERE
          is_oneshot
      )::int AS oneshot_count,
      COUNT(*) FILTER (
        WHERE
          is_solved
          AND number_attempts >= 4
      )::int AS edge_hunter_count,
      COUNT(*) FILTER (
        WHERE
          is_solved
          AND had_three_low_fails
      )::int AS comeback_count
    FROM
      iq_rows
  ),
  hw_agg AS (
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
      )::int AS early_bird_count,
      COUNT(DISTINCT vh.id) FILTER (
        WHERE
          COALESCE(ai.max_points, 0) > 0
          AND COALESCE(ai.points, 0) > COALESCE(ai.max_points, 0) + 0.001
      )::int AS bonus_hunter_count
    FROM
      assessment_instances AS ai
      JOIN visible_hw AS vh ON vh.id = ai.assessment_id
    WHERE
      ai.user_id = $user_id
  ),
  clean_numbered AS (
    SELECT
      is_syntax_clean,
      ROW_NUMBER() OVER (
        ORDER BY
          date ASC,
          submission_id ASC
      ) - ROW_NUMBER() OVER (
        PARTITION BY
          is_syntax_clean
        ORDER BY
          date ASC,
          submission_id ASC
      ) AS island_id
    FROM
      valid_subs
  ),
  clean_runs AS (
    SELECT
      COALESCE(MAX(run_len), 0)::int AS syntax_clean_max_run
    FROM
      (
        SELECT
          COUNT(*)::int AS run_len
        FROM
          clean_numbered
        WHERE
          is_syntax_clean IS TRUE
        GROUP BY
          island_id
      ) AS r
  ),
  all_activity_days AS (
    SELECT DISTINCT
      day_key
    FROM
      valid_subs
    UNION
    SELECT DISTINCT
      dpa.jalali_day_key AS day_key
    FROM
      student_daily_pulse_attempts AS dpa
    WHERE
      dpa.course_instance_id = $course_instance_id
      AND dpa.user_id = $user_id
  ),
  recent_day_threshold AS (
    SELECT
      to_char(
        (CURRENT_TIMESTAMP - INTERVAL '145 days') AT TIME ZONE $timezone,
        'YYYY-MM-DD'
      ) AS min_day_key
  ),
  sub_agg AS (
    SELECT
      COUNT(*)::int AS total_submissions,
      COUNT(*) FILTER (
        WHERE
          is_ac
      )::int AS accepted_submissions,
      COUNT(DISTINCT assessment_question_id) FILTER (
        WHERE
          is_ac
          AND date >= (CURRENT_TIMESTAMP - INTERVAL '7 days')
      )::int AS recent_7d_solved,
      COUNT(*) FILTER (
        WHERE
          is_ac
          AND (
            EXTRACT(
              HOUR
              FROM
                local_ts
            )::int * 60 + EXTRACT(
              MINUTE
              FROM
                local_ts
            )::int
          ) BETWEEN 0 AND 269
      )::int AS night_owl_count,
      COUNT(*) FILTER (
        WHERE
          is_ac
          AND (
            EXTRACT(
              HOUR
              FROM
                local_ts
            )::int * 60 + EXTRACT(
              MINUTE
              FROM
                local_ts
            )::int
          ) BETWEEN 300 AND 450
      )::int AS dawn_coder_count,
      COUNT(*) FILTER (
        WHERE
          is_ac
          AND due_date IS NOT NULL
          AND date >= (due_date - INTERVAL '60 minutes')
          AND date <= due_date
      )::int AS buzzer_beater_count
    FROM
      valid_subs
  ),
  weekend_weeks AS (
    SELECT
      (
        local_ts::date - (
          (
            EXTRACT(
              DOW
              FROM
                local_ts::date
            )::int + 1
          ) % 7
        )
      ) AS sat_week_start
    FROM
      valid_subs
    WHERE
      is_ac
      AND EXTRACT(
        DOW
        FROM
          local_ts::date
      )::int IN (4, 5)
    GROUP BY
      1
    HAVING
      COUNT(DISTINCT assessment_question_id) >= 3
  ),
  first_ac_per_aq AS (
    SELECT
      assessment_question_id,
      MIN(day_key) FILTER (
        WHERE
          is_ac
      ) AS first_ac_day_key,
      BOOL_OR(
        is_ac
        AND day_key BETWEEN $week_start_key AND $week_end_key
        AND number_attempts <= 2
      ) AS has_clean_week,
      BOOL_OR(
        is_ac
        AND day_key BETWEEN $week_start_key AND $week_end_key
        AND (
          first_submission_score >= 0.9999
          OR number_attempts = 1
        )
      ) AS has_oneshot_week,
      BOOL_OR(NOT is_ac) AS had_prior_fail
    FROM
      valid_subs
    GROUP BY
      assessment_question_id
  ),
  grouping_counts AS (
    SELECT
      COUNT(DISTINCT LOWER(BTRIM(t.name))) FILTER (
        WHERE
          t.id IS NOT NULL
          AND LOWER(BTRIM(COALESCE(t.name, ''))) NOT IN ('', 'none', 'default', 'بدون مبحث')
      )::int AS valid_topic_count,
      COUNT(DISTINCT LOWER(BTRIM(vh.module_name))) FILTER (
        WHERE
          LOWER(BTRIM(COALESCE(vh.module_name, ''))) NOT IN ('', 'default', 'staff')
      )::int AS valid_module_count
    FROM
      visible_hw AS vh
      JOIN assessment_questions AS aq ON aq.assessment_id = vh.id
      AND aq.deleted_at IS NULL
      JOIN questions AS q ON q.id = aq.question_id
      AND q.deleted_at IS NULL
      LEFT JOIN topics AS t ON t.id = q.topic_id
  ),
  skill_group_questions AS (
    SELECT
      aq.id AS assessment_question_id,
      CASE
        WHEN gc.valid_topic_count >= 2
        AND t.id IS NOT NULL
        AND LOWER(BTRIM(COALESCE(t.name, ''))) NOT IN ('', 'none', 'default', 'بدون مبحث') THEN 'topic-' || t.id::text
        WHEN gc.valid_topic_count < 2
        AND gc.valid_module_count >= 2
        AND LOWER(BTRIM(COALESCE(vh.module_name, ''))) NOT IN ('', 'default', 'staff') THEN 'module-' || vh.module_name
        ELSE 'assess-' || vh.id::text
      END AS skill_group_key
    FROM
      visible_hw AS vh
      CROSS JOIN grouping_counts AS gc
      JOIN assessment_questions AS aq ON aq.assessment_id = vh.id
      AND aq.deleted_at IS NULL
      JOIN questions AS q ON q.id = aq.question_id
      AND q.deleted_at IS NULL
      LEFT JOIN topics AS t ON t.id = q.topic_id
  ),
  mastered_groups AS (
    SELECT
      sgq.skill_group_key
    FROM
      skill_group_questions AS sgq
      LEFT JOIN iq_rows AS iqr ON iqr.assessment_question_id = sgq.assessment_question_id
      AND iqr.is_solved
    GROUP BY
      sgq.skill_group_key
    HAVING
      COUNT(DISTINCT sgq.assessment_question_id) > 0
      AND COUNT(DISTINCT iqr.assessment_question_id) = COUNT(DISTINCT sgq.assessment_question_id)
  ),
  coop_hw_status AS (
    SELECT
      vh.id AS assessment_id,
      COUNT(DISTINCT aq.id)::int AS total_questions,
      (
        SELECT
          COUNT(*)::int
        FROM
          real_students
      ) AS enrolled_count,
      COUNT(DISTINCT (ai.user_id, iq.assessment_question_id)) FILTER (
        WHERE
          rs.user_id IS NOT NULL
          AND (
            COALESCE(iq.highest_submission_score, 0) >= 0.9999
            OR COALESCE(iq.score_perc, 0) >= 99.99
          )
      )::int AS class_solves
    FROM
      visible_hw AS vh
      JOIN assessment_questions AS aq ON aq.assessment_id = vh.id
      AND aq.deleted_at IS NULL
      LEFT JOIN assessment_instances AS ai ON ai.assessment_id = vh.id
      LEFT JOIN real_students AS rs ON rs.user_id = ai.user_id
      LEFT JOIN instance_questions AS iq ON iq.assessment_instance_id = ai.id
      AND iq.assessment_question_id = aq.id
    GROUP BY
      vh.id
  ),
  coop_completed AS (
    SELECT
      COUNT(DISTINCT chs.assessment_id)::int AS coop_completed_count
    FROM
      coop_hw_status AS chs
      JOIN iq_rows AS iqr ON iqr.assessment_id = chs.assessment_id
      AND iqr.is_solved
    WHERE
      chs.total_questions > 0
      AND chs.class_solves >= GREATEST(
        chs.total_questions * 3,
        ROUND(
          GREATEST(5, chs.enrolled_count) * chs.total_questions * 0.65
        )::int
      )
  ),
  goal_stats AS (
    SELECT
      COUNT(*) FILTER (
        WHERE
          solved_cnt >= target_questions
      )::int AS weekly_goal_met_weeks,
      COALESCE(
        SUM(
          CASE tier
            WHEN 'light' THEN 35
            WHEN 'balanced' THEN 50
            ELSE 80
          END
        ) FILTER (
          WHERE
            solved_cnt >= target_questions
        ),
        0
      )::int AS weekly_goal_xp
    FROM
      (
        SELECT
          swg.tier,
          swg.target_questions,
          (
            SELECT
              COUNT(DISTINCT faq.assessment_question_id)::int
            FROM
              first_ac_per_aq AS faq
            WHERE
              faq.first_ac_day_key BETWEEN swg.week_start_key AND to_char((swg.week_start_key::date + 6), 'YYYY-MM-DD')
          ) AS solved_cnt
        FROM
          student_weekly_goals AS swg
        WHERE
          swg.course_instance_id = $course_instance_id
          AND swg.user_id = $user_id
          AND swg.week_start_key ~ '^\d{4}-\d{2}-\d{2}$'
      ) AS gw
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
  hw_agg.bonus_hunter_count,
  clean_runs.syntax_clean_max_run,
  sub_agg.total_submissions,
  sub_agg.accepted_submissions,
  (
    SELECT
      COUNT(*)::int
    FROM
      all_activity_days
  ) AS active_days_total,
  COALESCE(
    (
      SELECT
        ARRAY_AGG(
          aad.day_key
          ORDER BY
            aad.day_key
        )
      FROM
        all_activity_days AS aad,
        recent_day_threshold AS rdt
      WHERE
        aad.day_key >= rdt.min_day_key
    ),
    ARRAY[]::text[]
  ) AS active_day_keys,
  sub_agg.night_owl_count,
  sub_agg.dawn_coder_count,
  sub_agg.buzzer_beater_count,
  (
    SELECT
      COUNT(*)::int
    FROM
      weekend_weeks
  ) AS weekend_warrior_weeks,
  (
    SELECT
      COUNT(*)::int
    FROM
      mastered_groups
  ) AS mastered_topics_count,
  (
    SELECT
      COUNT(*)::int
    FROM
      student_submission_kudos AS k
      JOIN assessment_questions AS aq ON aq.id = k.assessment_question_id
      JOIN visible_hw AS vh ON vh.id = aq.assessment_id
    WHERE
      k.course_instance_id = $course_instance_id
      AND k.student_user_id = $user_id
  ) AS ta_kudos_count,
  (
    SELECT
      COUNT(*)::int
    FROM
      student_daily_pulse_attempts AS dpa
    WHERE
      dpa.course_instance_id = $course_instance_id
      AND dpa.user_id = $user_id
      AND dpa.is_correct IS TRUE
  ) AS daily_pulse_correct_count,
  goal_stats.weekly_goal_met_weeks,
  goal_stats.weekly_goal_xp,
  coop_completed.coop_completed_count,
  (
    SELECT
      COUNT(*)::int
    FROM
      all_activity_days AS aad
    WHERE
      aad.day_key BETWEEN $week_start_key AND $week_end_key
  ) AS active_days_week,
  COALESCE(
    (
      SELECT
        ARRAY_AGG(DISTINCT assessment_question_id::text)
      FROM
        first_ac_per_aq
      WHERE
        first_ac_day_key BETWEEN $week_start_key AND $week_end_key
    ),
    ARRAY[]::text[]
  ) AS solved_aq_ids_week,
  (
    SELECT
      COUNT(*)::int
    FROM
      first_ac_per_aq
    WHERE
      first_ac_day_key BETWEEN $week_start_key AND $week_end_key
      AND has_clean_week
  ) AS clean_solves_week,
  (
    SELECT
      COUNT(*)::int
    FROM
      first_ac_per_aq
    WHERE
      first_ac_day_key BETWEEN $week_start_key AND $week_end_key
      AND has_oneshot_week
  ) AS oneshot_week,
  (
    SELECT
      COUNT(*)::int
    FROM
      first_ac_per_aq
    WHERE
      first_ac_day_key BETWEEN $week_start_key AND $week_end_key
      AND had_prior_fail
  ) AS comeback_week,
  (
    SELECT
      COUNT(*)::int
    FROM
      student_daily_pulse_attempts AS dpa
    WHERE
      dpa.course_instance_id = $course_instance_id
      AND dpa.user_id = $user_id
      AND dpa.is_correct IS TRUE
      AND dpa.jalali_day_key BETWEEN $week_start_key AND $week_end_key
  ) AS daily_pulse_correct_week,
  (
    SELECT
      COUNT(*)::int
    FROM
      student_submission_kudos AS k
      JOIN assessment_questions AS aq ON aq.id = k.assessment_question_id
      JOIN visible_hw AS vh ON vh.id = aq.assessment_id
    WHERE
      k.course_instance_id = $course_instance_id
      AND k.student_user_id = $user_id
      AND to_char(k.created_at AT TIME ZONE $timezone, 'YYYY-MM-DD') BETWEEN $week_start_key AND $week_end_key
  ) AS ta_kudos_week,
  COALESCE(
    (
      SELECT
        pinned_badge_ids
      FROM
        student_public_profiles
      WHERE
        user_id = $user_id
    ),
    ARRAY[]::text[]
  ) AS pinned_badge_ids,
  sub_agg.recent_7d_solved
FROM
  iq_agg,
  hw_agg,
  clean_runs,
  sub_agg,
  goal_stats,
  coop_completed;

-- BLOCK select_student_weekly_quest_signals
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
  week_subs AS (
    SELECT
      s.date,
      to_char(s.date AT TIME ZONE $timezone, 'YYYY-MM-DD') AS day_key,
      iq.id AS iq_id,
      iq.assessment_question_id,
      iq.number_attempts,
      (
        s.score >= 0.9999
        OR s.correct IS TRUE
      ) AS is_ac
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
  first_ac_per_aq AS (
    SELECT
      assessment_question_id,
      MIN(day_key) FILTER (
        WHERE
          is_ac
      ) AS first_ac_day_key,
      BOOL_OR(
        is_ac
        AND day_key BETWEEN $week_start_key AND $week_end_key
        AND number_attempts <= 2
      ) AS has_clean_week,
      BOOL_OR(
        is_ac
        AND day_key BETWEEN $week_start_key AND $week_end_key
        AND number_attempts = 1
      ) AS has_oneshot_week,
      BOOL_OR(NOT is_ac) AS had_prior_fail
    FROM
      week_subs
    GROUP BY
      assessment_question_id
  ),
  week_days AS (
    SELECT DISTINCT
      day_key
    FROM
      week_subs
    WHERE
      day_key BETWEEN $week_start_key AND $week_end_key
    UNION
    SELECT DISTINCT
      dpa.jalali_day_key AS day_key
    FROM
      student_daily_pulse_attempts AS dpa
    WHERE
      dpa.course_instance_id = $course_instance_id
      AND dpa.user_id = $user_id
      AND dpa.jalali_day_key BETWEEN $week_start_key AND $week_end_key
  )
SELECT
  (
    SELECT
      COUNT(*)::int
    FROM
      week_days
  ) AS active_days_week,
  (
    SELECT
      COUNT(*)::int
    FROM
      first_ac_per_aq
    WHERE
      first_ac_day_key BETWEEN $week_start_key AND $week_end_key
  ) AS solved_questions_week,
  COALESCE(
    (
      SELECT
        ARRAY_AGG(DISTINCT assessment_question_id::text)
      FROM
        first_ac_per_aq
      WHERE
        first_ac_day_key BETWEEN $week_start_key AND $week_end_key
    ),
    ARRAY[]::text[]
  ) AS solved_aq_ids_week,
  (
    SELECT
      COUNT(*)::int
    FROM
      first_ac_per_aq
    WHERE
      first_ac_day_key BETWEEN $week_start_key AND $week_end_key
      AND has_clean_week
  ) AS clean_solves_week,
  (
    SELECT
      COUNT(*)::int
    FROM
      first_ac_per_aq
    WHERE
      first_ac_day_key BETWEEN $week_start_key AND $week_end_key
      AND has_oneshot_week
  ) AS oneshot_week,
  (
    SELECT
      COUNT(*)::int
    FROM
      first_ac_per_aq
    WHERE
      first_ac_day_key BETWEEN $week_start_key AND $week_end_key
      AND had_prior_fail
  ) AS comeback_week;

-- BLOCK select_student_skill_tree_rows
WITH
  visible_hw AS (
    SELECT
      a.id AS assessment_id,
      COALESCE(aset.abbreviation, '') || COALESCE(a.number, '') AS assessment_label,
      a.title AS assessment_title,
      aset.number AS set_number,
      a.order_by AS assessment_order,
      am.name AS module_name,
      am.heading AS module_heading,
      am.number AS module_number
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
FROM
  visible_hw AS vh
  JOIN assessment_questions AS aq ON aq.assessment_id = vh.assessment_id
  AND aq.deleted_at IS NULL
  JOIN questions AS q ON q.id = aq.question_id
  AND q.deleted_at IS NULL
  LEFT JOIN topics AS t ON t.id = q.topic_id
  LEFT JOIN assessment_instances AS ai ON ai.assessment_id = vh.assessment_id
  AND ai.user_id = $user_id
  LEFT JOIN instance_questions AS iq ON iq.assessment_instance_id = ai.id
  AND iq.assessment_question_id = aq.id
ORDER BY
  t.number NULLS LAST,
  vh.set_number NULLS LAST,
  vh.assessment_order NULLS LAST,
  aq.number NULLS LAST,
  aq.id ASC;

-- BLOCK select_cohort_gamification_rows
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
      a.id,
      am.name AS module_name,
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
  valid_subs AS (
    SELECT
      COALESCE(v.user_id, ai.user_id) AS user_id,
      s.id AS submission_id,
      s.date,
      s.score,
      to_char(s.date AT TIME ZONE $timezone, 'YYYY-MM-DD') AS day_key,
      (s.date AT TIME ZONE $timezone) AS local_ts,
      iq.id AS iq_id,
      iq.assessment_question_id,
      iq.number_attempts,
      COALESCE(iq.first_submission_score, 0) AS first_submission_score,
      vh.due_date,
      (
        s.score >= 0.9999
        OR s.correct IS TRUE
      ) AS is_ac,
      (
        (
          s.format_errors IS NULL
          OR s.format_errors = '{}'::jsonb
        )
        AND COALESCE(s.feedback -> 'results' ->> 'output', '') !~* '(SyntaxError|IndentationError|TabError|خطای نحوی)'
        AND COALESCE(s.feedback -> 'results' ->> 'message', '') !~* '(SyntaxError|IndentationError|TabError|خطای نحوی)'
        AND COALESCE((s.feedback -> 'results' -> 'tests')::text, '') !~* '(SyntaxError|IndentationError|TabError)'
      ) AS is_syntax_clean
    FROM
      submissions AS s
      JOIN variants AS v ON v.id = s.variant_id
      JOIN instance_questions AS iq ON iq.id = v.instance_question_id
      JOIN assessment_instances AS ai ON ai.id = iq.assessment_instance_id
      JOIN visible_hw AS vh ON vh.id = ai.assessment_id
      JOIN real_students AS rs ON rs.user_id = COALESCE(v.user_id, ai.user_id)
    WHERE
      COALESCE(v.broken, FALSE) IS FALSE
      AND COALESCE(s.broken, FALSE) IS FALSE
      AND s.gradable IS TRUE
  ),
  low_fail_iqs AS (
    SELECT
      user_id,
      iq_id
    FROM
      valid_subs
    WHERE
      COALESCE(score, 0) < 0.3
    GROUP BY
      user_id,
      iq_id
    HAVING
      COUNT(*) >= 3
  ),
  iq_rows AS (
    SELECT
      rs.user_id,
      ai.assessment_id,
      iq.assessment_question_id,
      (
        COALESCE(iq.highest_submission_score, 0) >= 0.9999
        OR COALESCE(iq.score_perc, 0) >= 99.99
      ) AS is_solved,
      COALESCE(iq.score_perc, 0) AS score_perc,
      iq.number_attempts,
      (
        COALESCE(iq.first_submission_score, 0) >= 0.9999
        OR (
          iq.number_attempts = 1
          AND COALESCE(iq.highest_submission_score, 0) >= 0.9999
        )
      ) AS is_oneshot,
      (lfi.iq_id IS NOT NULL) AS had_three_low_fails
    FROM
      real_students AS rs
      JOIN assessment_instances AS ai ON ai.user_id = rs.user_id
      JOIN visible_hw AS vh ON vh.id = ai.assessment_id
      JOIN instance_questions AS iq ON iq.assessment_instance_id = ai.id
      LEFT JOIN low_fail_iqs AS lfi ON lfi.user_id = rs.user_id
      AND lfi.iq_id = iq.id
  ),
  iq_per_student AS (
    SELECT
      user_id,
      COALESCE(
        ARRAY_AGG(DISTINCT assessment_question_id::text) FILTER (
          WHERE
            is_solved
        ),
        ARRAY[]::text[]
      ) AS solved_aq_ids,
      COALESCE(
        ARRAY_AGG(DISTINCT assessment_question_id::text) FILTER (
          WHERE
            is_oneshot
        ),
        ARRAY[]::text[]
      ) AS oneshot_aq_ids,
      COALESCE(
        SUM(LEAST(99.0, GREATEST(0.0, score_perc))) FILTER (
          WHERE
            NOT is_solved
            AND score_perc > 0
        ),
        0.0
      )::double precision AS partial_score_sum,
      COUNT(*) FILTER (
        WHERE
          is_oneshot
      )::int AS oneshot_count,
      COUNT(*) FILTER (
        WHERE
          is_solved
          AND number_attempts >= 4
      )::int AS edge_hunter_count,
      COUNT(*) FILTER (
        WHERE
          is_solved
          AND had_three_low_fails
      )::int AS comeback_count
    FROM
      iq_rows
    GROUP BY
      user_id
  ),
  hw_per_student AS (
    SELECT
      ai.user_id,
      COUNT(*) FILTER (
        WHERE
          COALESCE(ai.score_perc, 0) >= 99.99
      )::int AS perfect_hw_count,
      COUNT(*) FILTER (
        WHERE
          COALESCE(ai.score_perc, 0) >= 90.0
          AND vh.due_date IS NOT NULL
          AND ai.modified_at <= (vh.due_date - INTERVAL '48 hours')
      )::int AS early_bird_count,
      COUNT(DISTINCT vh.id) FILTER (
        WHERE
          COALESCE(ai.max_points, 0) > 0
          AND COALESCE(ai.points, 0) > COALESCE(ai.max_points, 0) + 0.001
      )::int AS bonus_hunter_count
    FROM
      assessment_instances AS ai
      JOIN visible_hw AS vh ON vh.id = ai.assessment_id
      JOIN real_students AS rs ON rs.user_id = ai.user_id
    GROUP BY
      ai.user_id
  ),
  clean_numbered AS (
    SELECT
      user_id,
      is_syntax_clean,
      ROW_NUMBER() OVER (
        PARTITION BY
          user_id
        ORDER BY
          date ASC,
          submission_id ASC
      ) - ROW_NUMBER() OVER (
        PARTITION BY
          user_id,
          is_syntax_clean
        ORDER BY
          date ASC,
          submission_id ASC
      ) AS island_id
    FROM
      valid_subs
  ),
  clean_runs AS (
    SELECT
      user_id,
      MAX(run_len)::int AS syntax_clean_max_run
    FROM
      (
        SELECT
          user_id,
          island_id,
          COUNT(*)::int AS run_len
        FROM
          clean_numbered
        WHERE
          is_syntax_clean IS TRUE
        GROUP BY
          user_id,
          island_id
      ) AS r
    GROUP BY
      user_id
  ),
  all_activity_days AS (
    SELECT DISTINCT
      user_id,
      day_key
    FROM
      valid_subs
    UNION
    SELECT DISTINCT
      dpa.user_id,
      dpa.jalali_day_key AS day_key
    FROM
      student_daily_pulse_attempts AS dpa
      JOIN real_students AS rs ON rs.user_id = dpa.user_id
    WHERE
      dpa.course_instance_id = $course_instance_id
  ),
  recent_day_threshold AS (
    SELECT
      to_char(
        (CURRENT_TIMESTAMP - INTERVAL '145 days') AT TIME ZONE $timezone,
        'YYYY-MM-DD'
      ) AS min_day_key
  ),
  activity_per_student AS (
    SELECT
      aad.user_id,
      COUNT(*)::int AS active_days_total,
      COALESCE(
        ARRAY_AGG(
          aad.day_key
          ORDER BY
            aad.day_key
        ) FILTER (
          WHERE
            aad.day_key >= rdt.min_day_key
        ),
        ARRAY[]::text[]
      ) AS active_day_keys,
      COUNT(*) FILTER (
        WHERE
          aad.day_key BETWEEN $week_start_key AND $week_end_key
      )::int AS active_days_week
    FROM
      all_activity_days AS aad
      CROSS JOIN recent_day_threshold AS rdt
    GROUP BY
      aad.user_id
  ),
  sub_per_student AS (
    SELECT
      user_id,
      COUNT(*)::int AS total_submissions,
      COUNT(*) FILTER (
        WHERE
          is_ac
      )::int AS accepted_submissions,
      COUNT(DISTINCT assessment_question_id) FILTER (
        WHERE
          is_ac
          AND date >= (CURRENT_TIMESTAMP - INTERVAL '7 days')
      )::int AS recent_7d_solved,
      COUNT(*) FILTER (
        WHERE
          is_ac
          AND (
            EXTRACT(
              HOUR
              FROM
                local_ts
            )::int * 60 + EXTRACT(
              MINUTE
              FROM
                local_ts
            )::int
          ) BETWEEN 0 AND 269
      )::int AS night_owl_count,
      COUNT(*) FILTER (
        WHERE
          is_ac
          AND (
            EXTRACT(
              HOUR
              FROM
                local_ts
            )::int * 60 + EXTRACT(
              MINUTE
              FROM
                local_ts
            )::int
          ) BETWEEN 300 AND 450
      )::int AS dawn_coder_count,
      COUNT(*) FILTER (
        WHERE
          is_ac
          AND due_date IS NOT NULL
          AND date >= (due_date - INTERVAL '60 minutes')
          AND date <= due_date
      )::int AS buzzer_beater_count
    FROM
      valid_subs
    GROUP BY
      user_id
  ),
  weekend_per_student AS (
    SELECT
      user_id,
      COUNT(*)::int AS weekend_warrior_weeks
    FROM
      (
        SELECT
          user_id,
          (
            local_ts::date - (
              (
                EXTRACT(
                  DOW
                  FROM
                    local_ts::date
                )::int + 1
              ) % 7
            )
          ) AS sat_week_start
        FROM
          valid_subs
        WHERE
          is_ac
          AND EXTRACT(
            DOW
            FROM
              local_ts::date
          )::int IN (4, 5)
        GROUP BY
          user_id,
          2
        HAVING
          COUNT(DISTINCT assessment_question_id) >= 3
      ) AS ww
    GROUP BY
      user_id
  ),
  first_ac_per_user_aq AS (
    SELECT
      user_id,
      assessment_question_id,
      MIN(day_key) FILTER (
        WHERE
          is_ac
      ) AS first_ac_day_key,
      BOOL_OR(
        is_ac
        AND day_key BETWEEN $week_start_key AND $week_end_key
        AND number_attempts <= 2
      ) AS has_clean_week,
      BOOL_OR(
        is_ac
        AND day_key BETWEEN $week_start_key AND $week_end_key
        AND (
          first_submission_score >= 0.9999
          OR number_attempts = 1
        )
      ) AS has_oneshot_week,
      BOOL_OR(NOT is_ac) AS had_prior_fail
    FROM
      valid_subs
    GROUP BY
      user_id,
      assessment_question_id
  ),
  weekly_per_student AS (
    SELECT
      user_id,
      COALESCE(
        ARRAY_AGG(DISTINCT assessment_question_id::text) FILTER (
          WHERE
            first_ac_day_key BETWEEN $week_start_key AND $week_end_key
        ),
        ARRAY[]::text[]
      ) AS solved_aq_ids_week,
      COUNT(*) FILTER (
        WHERE
          first_ac_day_key BETWEEN $week_start_key AND $week_end_key
          AND has_clean_week
      )::int AS clean_solves_week,
      COUNT(*) FILTER (
        WHERE
          first_ac_day_key BETWEEN $week_start_key AND $week_end_key
          AND has_oneshot_week
      )::int AS oneshot_week,
      COUNT(*) FILTER (
        WHERE
          first_ac_day_key BETWEEN $week_start_key AND $week_end_key
          AND had_prior_fail
      )::int AS comeback_week
    FROM
      first_ac_per_user_aq
    GROUP BY
      user_id
  ),
  grouping_counts AS (
    SELECT
      COUNT(DISTINCT LOWER(BTRIM(t.name))) FILTER (
        WHERE
          t.id IS NOT NULL
          AND LOWER(BTRIM(COALESCE(t.name, ''))) NOT IN ('', 'none', 'default', 'بدون مبحث')
      )::int AS valid_topic_count,
      COUNT(DISTINCT LOWER(BTRIM(vh.module_name))) FILTER (
        WHERE
          LOWER(BTRIM(COALESCE(vh.module_name, ''))) NOT IN ('', 'default', 'staff')
      )::int AS valid_module_count
    FROM
      visible_hw AS vh
      JOIN assessment_questions AS aq ON aq.assessment_id = vh.id
      AND aq.deleted_at IS NULL
      JOIN questions AS q ON q.id = aq.question_id
      AND q.deleted_at IS NULL
      LEFT JOIN topics AS t ON t.id = q.topic_id
  ),
  skill_group_questions AS (
    SELECT
      aq.id AS assessment_question_id,
      CASE
        WHEN gc.valid_topic_count >= 2
        AND t.id IS NOT NULL
        AND LOWER(BTRIM(COALESCE(t.name, ''))) NOT IN ('', 'none', 'default', 'بدون مبحث') THEN 'topic-' || t.id::text
        WHEN gc.valid_topic_count < 2
        AND gc.valid_module_count >= 2
        AND LOWER(BTRIM(COALESCE(vh.module_name, ''))) NOT IN ('', 'default', 'staff') THEN 'module-' || vh.module_name
        ELSE 'assess-' || vh.id::text
      END AS skill_group_key
    FROM
      visible_hw AS vh
      CROSS JOIN grouping_counts AS gc
      JOIN assessment_questions AS aq ON aq.assessment_id = vh.id
      AND aq.deleted_at IS NULL
      JOIN questions AS q ON q.id = aq.question_id
      AND q.deleted_at IS NULL
      LEFT JOIN topics AS t ON t.id = q.topic_id
  ),
  skill_group_totals AS (
    SELECT
      skill_group_key,
      COUNT(DISTINCT assessment_question_id)::int AS total_q
    FROM
      skill_group_questions
    GROUP BY
      skill_group_key
  ),
  mastered_per_student AS (
    SELECT
      user_id,
      COUNT(*)::int AS mastered_topics_count
    FROM
      (
        SELECT
          iqr.user_id,
          sgq.skill_group_key,
          COUNT(DISTINCT iqr.assessment_question_id)::int AS solved_q,
          sgt.total_q
        FROM
          iq_rows AS iqr
          JOIN skill_group_questions AS sgq ON sgq.assessment_question_id = iqr.assessment_question_id
          JOIN skill_group_totals AS sgt ON sgt.skill_group_key = sgq.skill_group_key
        WHERE
          iqr.is_solved
        GROUP BY
          iqr.user_id,
          sgq.skill_group_key,
          sgt.total_q
        HAVING
          COUNT(DISTINCT iqr.assessment_question_id) = sgt.total_q
          AND sgt.total_q > 0
      ) AS m
    GROUP BY
      user_id
  ),
  kudos_per_student AS (
    SELECT
      k.student_user_id AS user_id,
      COUNT(*)::int AS ta_kudos_count,
      COUNT(*) FILTER (
        WHERE
          to_char(k.created_at AT TIME ZONE $timezone, 'YYYY-MM-DD') BETWEEN $week_start_key AND $week_end_key
      )::int AS ta_kudos_week
    FROM
      student_submission_kudos AS k
      JOIN assessment_questions AS aq ON aq.id = k.assessment_question_id
      JOIN visible_hw AS vh ON vh.id = aq.assessment_id
    WHERE
      k.course_instance_id = $course_instance_id
    GROUP BY
      k.student_user_id
  ),
  pulse_per_student AS (
    SELECT
      dpa.user_id,
      COUNT(*) FILTER (
        WHERE
          dpa.is_correct IS TRUE
      )::int AS daily_pulse_correct_count,
      COUNT(*) FILTER (
        WHERE
          dpa.is_correct IS TRUE
          AND dpa.jalali_day_key BETWEEN $week_start_key AND $week_end_key
      )::int AS daily_pulse_correct_week
    FROM
      student_daily_pulse_attempts AS dpa
    WHERE
      dpa.course_instance_id = $course_instance_id
    GROUP BY
      dpa.user_id
  ),
  coop_hw_status AS (
    SELECT
      vh.id AS assessment_id,
      COUNT(DISTINCT aq.id)::int AS total_questions,
      (
        SELECT
          COUNT(*)::int
        FROM
          real_students
      ) AS enrolled_count,
      COUNT(
        DISTINCT (iqr.user_id, iqr.assessment_question_id)
      ) FILTER (
        WHERE
          iqr.is_solved
      )::int AS class_solves
    FROM
      visible_hw AS vh
      JOIN assessment_questions AS aq ON aq.assessment_id = vh.id
      AND aq.deleted_at IS NULL
      LEFT JOIN iq_rows AS iqr ON iqr.assessment_id = vh.id
    GROUP BY
      vh.id
  ),
  coop_reached_hw AS (
    SELECT
      assessment_id
    FROM
      coop_hw_status
    WHERE
      total_questions > 0
      AND class_solves >= GREATEST(
        total_questions * 3,
        ROUND(
          GREATEST(5, enrolled_count) * total_questions * 0.65
        )::int
      )
  ),
  coop_per_student AS (
    SELECT
      iqr.user_id,
      COUNT(DISTINCT ch.assessment_id)::int AS coop_completed_count
    FROM
      iq_rows AS iqr
      JOIN coop_reached_hw AS ch ON ch.assessment_id = iqr.assessment_id
    WHERE
      iqr.is_solved
    GROUP BY
      iqr.user_id
  ),
  goals_per_student AS (
    SELECT
      user_id,
      COUNT(*) FILTER (
        WHERE
          solved_cnt >= target_questions
      )::int AS weekly_goal_met_weeks,
      COALESCE(
        SUM(
          CASE tier
            WHEN 'light' THEN 35
            WHEN 'balanced' THEN 50
            ELSE 80
          END
        ) FILTER (
          WHERE
            solved_cnt >= target_questions
        ),
        0
      )::int AS weekly_goal_xp
    FROM
      (
        SELECT
          swg.user_id,
          swg.tier,
          swg.target_questions,
          (
            SELECT
              COUNT(DISTINCT faq.assessment_question_id)::int
            FROM
              first_ac_per_user_aq AS faq
            WHERE
              faq.user_id = swg.user_id
              AND faq.first_ac_day_key BETWEEN swg.week_start_key AND to_char((swg.week_start_key::date + 6), 'YYYY-MM-DD')
          ) AS solved_cnt
        FROM
          student_weekly_goals AS swg
          JOIN real_students AS rs ON rs.user_id = swg.user_id
        WHERE
          swg.course_instance_id = $course_instance_id
          AND swg.week_start_key ~ '^\d{4}-\d{2}-\d{2}$'
      ) AS gw
    GROUP BY
      user_id
  )
SELECT
  u.id::text AS user_id,
  CASE
    WHEN COALESCE(spp.show_on_leaderboard, TRUE) IS FALSE THEN 'دانشجوی ناشناس #' || (ABS(MOD(u.id * 2654435761, 8999)) + 1000)::text
    ELSE COALESCE(
      NULLIF(BTRIM(spp.display_alias), ''),
      NULLIF(BTRIM(u.name), ''),
      split_part(u.uid, '@', 1)
    )
  END AS display_name,
  COALESCE(spp.avatar_preset, 'initials') AS avatar_preset,
  COALESCE(spp.avatar_color, 'cobalt') AS avatar_color,
  CASE
    WHEN COALESCE(spp.show_on_leaderboard, TRUE) IS FALSE THEN 'none'
    ELSE COALESCE(spp.status_emoji, 'none')
  END AS status_emoji,
  COALESCE(spp.pinned_badge_ids, ARRAY[]::text[]) AS pinned_badge_ids,
  (COALESCE(spp.show_on_leaderboard, TRUE) IS FALSE) AS is_anonymous,
  COALESCE(spp.show_passport_details, TRUE) AS show_passport_details,
  COALESCE(iqs.solved_aq_ids, ARRAY[]::text[]) AS solved_aq_ids,
  COALESCE(iqs.oneshot_aq_ids, ARRAY[]::text[]) AS oneshot_aq_ids,
  COALESCE(iqs.partial_score_sum, 0.0)::double precision AS partial_score_sum,
  COALESCE(iqs.oneshot_count, 0)::int AS oneshot_count,
  COALESCE(iqs.edge_hunter_count, 0)::int AS edge_hunter_count,
  COALESCE(iqs.comeback_count, 0)::int AS comeback_count,
  COALESCE(hws.perfect_hw_count, 0)::int AS perfect_hw_count,
  COALESCE(hws.early_bird_count, 0)::int AS early_bird_count,
  COALESCE(hws.bonus_hunter_count, 0)::int AS bonus_hunter_count,
  COALESCE(crs.syntax_clean_max_run, 0)::int AS syntax_clean_max_run,
  COALESCE(sps.total_submissions, 0)::int AS total_submissions,
  COALESCE(sps.accepted_submissions, 0)::int AS accepted_submissions,
  COALESCE(aps.active_days_total, 0)::int AS active_days_total,
  COALESCE(aps.active_day_keys, ARRAY[]::text[]) AS active_day_keys,
  COALESCE(sps.night_owl_count, 0)::int AS night_owl_count,
  COALESCE(sps.dawn_coder_count, 0)::int AS dawn_coder_count,
  COALESCE(sps.buzzer_beater_count, 0)::int AS buzzer_beater_count,
  COALESCE(wps.weekend_warrior_weeks, 0)::int AS weekend_warrior_weeks,
  COALESCE(mps.mastered_topics_count, 0)::int AS mastered_topics_count,
  COALESCE(kps.ta_kudos_count, 0)::int AS ta_kudos_count,
  COALESCE(pps.daily_pulse_correct_count, 0)::int AS daily_pulse_correct_count,
  COALESCE(gps.weekly_goal_met_weeks, 0)::int AS weekly_goal_met_weeks,
  COALESCE(gps.weekly_goal_xp, 0)::int AS weekly_goal_xp,
  COALESCE(cps.coop_completed_count, 0)::int AS coop_completed_count,
  COALESCE(aps.active_days_week, 0)::int AS active_days_week,
  COALESCE(wqs.solved_aq_ids_week, ARRAY[]::text[]) AS solved_aq_ids_week,
  COALESCE(wqs.clean_solves_week, 0)::int AS clean_solves_week,
  COALESCE(wqs.oneshot_week, 0)::int AS oneshot_week,
  COALESCE(wqs.comeback_week, 0)::int AS comeback_week,
  COALESCE(pps.daily_pulse_correct_week, 0)::int AS daily_pulse_correct_week,
  COALESCE(kps.ta_kudos_week, 0)::int AS ta_kudos_week,
  COALESCE(sps.recent_7d_solved, 0)::int AS recent_7d_solved
FROM
  real_students AS rs
  JOIN users AS u ON u.id = rs.user_id
  LEFT JOIN student_public_profiles AS spp ON spp.user_id = rs.user_id
  LEFT JOIN iq_per_student AS iqs ON iqs.user_id = rs.user_id
  LEFT JOIN hw_per_student AS hws ON hws.user_id = rs.user_id
  LEFT JOIN clean_runs AS crs ON crs.user_id = rs.user_id
  LEFT JOIN activity_per_student AS aps ON aps.user_id = rs.user_id
  LEFT JOIN sub_per_student AS sps ON sps.user_id = rs.user_id
  LEFT JOIN weekend_per_student AS wps ON wps.user_id = rs.user_id
  LEFT JOIN weekly_per_student AS wqs ON wqs.user_id = rs.user_id
  LEFT JOIN mastered_per_student AS mps ON mps.user_id = rs.user_id
  LEFT JOIN kudos_per_student AS kps ON kps.user_id = rs.user_id
  LEFT JOIN pulse_per_student AS pps ON pps.user_id = rs.user_id
  LEFT JOIN coop_per_student AS cps ON cps.user_id = rs.user_id
  LEFT JOIN goals_per_student AS gps ON gps.user_id = rs.user_id;

-- BLOCK select_student_passport_identity
SELECT
  u.id::text AS user_id,
  CASE
    WHEN COALESCE(spp.show_on_leaderboard, TRUE) IS FALSE THEN 'دانشجوی ناشناس #' || (ABS(MOD(u.id * 2654435761, 8999)) + 1000)::text
    ELSE COALESCE(
      NULLIF(BTRIM(spp.display_alias), ''),
      NULLIF(BTRIM(u.name), ''),
      split_part(u.uid, '@', 1)
    )
  END AS display_name,
  COALESCE(spp.avatar_preset, 'initials') AS avatar_preset,
  COALESCE(spp.avatar_color, 'cobalt') AS avatar_color,
  COALESCE(spp.banner_theme, 'nova') AS banner_theme,
  spp.bio,
  COALESCE(spp.status_emoji, 'none') AS status_emoji,
  spp.favorite_topic,
  spp.github_username,
  COALESCE(spp.featured_title, 'auto') AS featured_title,
  COALESCE(spp.show_on_leaderboard, TRUE) AS show_on_leaderboard,
  COALESCE(spp.show_passport_details, TRUE) AS show_passport_details,
  COALESCE(spp.show_activity_stats, TRUE) AS show_activity_stats
FROM
  enrollments AS e
  JOIN course_instances AS ci ON ci.id = e.course_instance_id
  JOIN users AS u ON u.id = e.user_id
  LEFT JOIN student_public_profiles AS spp ON spp.user_id = e.user_id
WHERE
  e.course_instance_id = $course_instance_id
  AND e.user_id = $user_id
  AND e.status = 'joined'
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
LIMIT
  1;
