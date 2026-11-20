import crypto from 'node:crypto';
import { promisify } from 'node:util';
import { z } from 'zod';

import * as sqldb from '@prairielearn/postgres';
import { IdSchema } from '@prairielearn/zod';

const sql = sqldb.loadSqlEquiv(import.meta.url);
const scryptAsync = promisify(crypto.scrypt);

const KEY_LENGTH = 64;
const SALT_LENGTH = 16;

export const UserWithPasswordSchema = z.object({
  id: IdSchema,
  uid: z.string(),
  name: z.string().nullable(),
  email: z.string().nullable(),
  uin: z.string().nullable(),
  password_hash: z.string().nullable(),
});
export type UserWithPassword = z.infer<typeof UserWithPasswordSchema>;

/**
 * Generates an OWASP-compliant scrypt hash with a random salt.
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.randomBytes(SALT_LENGTH).toString('hex');
  const derivedKey = (await scryptAsync(password, salt, KEY_LENGTH)) as Buffer;
  return `${salt}:${derivedKey.toString('hex')}`;
}

/**
 * Verifies a password against a stored salt:hash string using timingSafeEqual.
 */
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  try {
    const [salt, key] = storedHash.split(':');
    if (!salt || !key) return false;
    const keyBuffer = Buffer.from(key, 'hex');
    const derivedKey = (await scryptAsync(password, salt, keyBuffer.length)) as Buffer;
    return crypto.timingSafeEqual(keyBuffer, derivedKey);
  } catch {
    return false;
  }
}

/**
 * Finds user by UID or email, including password_hash if present.
 */
export async function findUserByIdentifier(identifier: string): Promise<UserWithPassword | null> {
  const clean = identifier.trim().toLowerCase();
  return await sqldb.queryOptionalRow(
    sql.select_user_with_password,
    { identifier: clean },
    UserWithPasswordSchema,
  );
}

/**
 * Checks whether a user with given UID or email exists.
 */
export async function checkUserExists(identifier: string): Promise<boolean> {
  const clean = identifier.trim().toLowerCase();
  const res = await sqldb.queryOptionalScalar(sql.check_user_exists, { identifier: clean }, IdSchema);
  return res !== null;
}

export interface RegisterLocalUserParams {
  name: string;
  email: string;
  password: string;
  uin?: string | null;
}

/**
 * Registers a new user with email and hashed password.
 */
export async function registerLocalUser(
  params: RegisterLocalUserParams,
): Promise<{ user_id: string; uid: string }> {
  const email = params.email.trim().toLowerCase();
  const name = params.name.trim();
  const uin = params.uin?.trim() || null;

  const exists = await checkUserExists(email);
  if (exists) {
    throw new Error('EMAIL_EXISTS');
  }

  const passwordHash = await hashPassword(params.password);

  const userId = await sqldb.queryScalar(
    sql.insert_user,
    {
      uid: email,
      name,
      email,
      uin,
    },
    IdSchema,
  );

  await sqldb.execute(sql.insert_password, {
    user_id: userId,
    password_hash: passwordHash,
  });

  return { user_id: userId, uid: email };
}

export type VerifyResult =
  | { success: true; user_id: string; uid: string; name: string | null }
  | { success: false; reason: 'USER_NOT_FOUND' | 'INVALID_PASSWORD' | 'NO_PASSWORD_SET' };

/**
 * Verifies identifier and password.
 */
export async function verifyLocalCredentials(
  identifier: string,
  password: string,
): Promise<VerifyResult> {
  const user = await findUserByIdentifier(identifier);
  if (!user) {
    return { success: false, reason: 'USER_NOT_FOUND' };
  }

  if (!user.password_hash) {
    return { success: false, reason: 'NO_PASSWORD_SET' };
  }

  const isValid = await verifyPassword(password, user.password_hash);
  if (!isValid) {
    return { success: false, reason: 'INVALID_PASSWORD' };
  }

  return {
    success: true,
    user_id: user.id,
    uid: user.uid,
    name: user.name,
  };
}
