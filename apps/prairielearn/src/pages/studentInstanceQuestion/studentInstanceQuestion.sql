-- BLOCK select_last_variant_id
SELECT
  v.id
FROM
  variants AS v
WHERE
  v.instance_question_id = $instance_question_id
  AND v.broken_at IS NULL
ORDER BY
  v.date DESC
LIMIT
  1;

-- BLOCK select_assessment_question_stepper
SELECT
  iq.id::text AS instance_question_id,
  qo.question_number,
  COALESCE(iq.score_perc, 0)::double precision AS score_perc,
  iq.highest_submission_score,
  iq.number_attempts,
  qo.question_access_mode
FROM
  instance_questions AS iq
  JOIN assessment_instances AS ai ON ai.id = iq.assessment_instance_id
  JOIN assessment_questions AS aq ON aq.id = iq.assessment_question_id
  JOIN assessments AS a ON a.id = ai.assessment_id
  JOIN question_order (ai.id) AS qo ON qo.instance_question_id = iq.id
WHERE
  ai.id = $assessment_instance_id
  AND (
    aq.deleted_at IS NULL
    OR a.type = 'Exam'
  )
ORDER BY
  qo.row_order;
