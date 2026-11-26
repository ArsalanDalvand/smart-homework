-- BLOCK select_daily_pulse_attempt
SELECT
  puzzle_id,
  selected_option,
  is_correct
FROM
  student_daily_pulse_attempts
WHERE
  course_instance_id = $course_instance_id
  AND user_id = $user_id
  AND jalali_day_key = $jalali_day_key;

-- BLOCK insert_daily_pulse_attempt
INSERT INTO
  student_daily_pulse_attempts (
    course_instance_id,
    user_id,
    jalali_day_key,
    puzzle_id,
    selected_option,
    is_correct
  )
VALUES
  (
    $course_instance_id,
    $user_id,
    $jalali_day_key,
    $puzzle_id,
    $selected_option,
    $is_correct
  )
ON CONFLICT (course_instance_id, user_id, jalali_day_key) DO NOTHING;
