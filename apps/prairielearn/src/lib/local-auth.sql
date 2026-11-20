-- BLOCK select_user_with_password
SELECT
  u.id,
  u.uid,
  u.name,
  u.email,
  u.uin,
  up.password_hash
FROM
  users AS u
  LEFT JOIN user_passwords AS up ON (up.user_id = u.id)
WHERE
  lower(u.uid) = lower($identifier)
  OR lower(coalesce(u.email, '')) = lower($identifier)
LIMIT 1;

-- BLOCK check_user_exists
SELECT
  id
FROM
  users
WHERE
  lower(uid) = lower($identifier)
  OR lower(coalesce(email, '')) = lower($identifier)
LIMIT 1;

-- BLOCK insert_user
WITH new_u AS (
  INSERT INTO users (
    uid,
    name,
    email,
    uin,
    institution_id
  ) VALUES (
    $uid,
    $name,
    $email,
    $uin,
    1
  )
  RETURNING *
),
audit AS (
  INSERT INTO audit_logs (table_name, row_id, action, new_state)
  SELECT 'users', id, 'insert', to_jsonb(new_u.*)
  FROM new_u
)
SELECT id FROM new_u;

-- BLOCK insert_password
INSERT INTO user_passwords (
  user_id,
  password_hash
) VALUES (
  $user_id,
  $password_hash
)
ON CONFLICT (user_id) DO UPDATE
SET
  password_hash = EXCLUDED.password_hash,
  updated_at = CURRENT_TIMESTAMP;
