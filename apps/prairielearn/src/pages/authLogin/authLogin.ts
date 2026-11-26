import { Router } from 'express';
import asyncHandler from 'express-async-handler';
import { z } from 'zod';

import * as error from '@prairielearn/error';
import { loadSqlEquiv, queryRows } from '@prairielearn/postgres';
import { IdSchema, parseRequestBody, parseRequestQuery } from '@prairielearn/zod';

import * as authLib from '../../lib/authn.js';
import { uiStrings } from '../../lib/branding.js';
import { config } from '../../lib/config.js';
import { AuthnProviderSchema } from '../../lib/db-types.js';
import { createAltchaChallenge, verifyAltchaPayload } from '../../lib/altcha.js';
import {
  registerLocalUser,
  validateUin,
  verifyLocalCredentials,
} from '../../lib/local-auth.js';

import {
  AuthLogin,
  AuthLoginInstitution,
  type InstitutionAuthnProvider,
} from './authLogin.html.js';

const sql = loadSqlEquiv(import.meta.url);
const router = Router();

const InstitutionAuthnProviderSchema = z.object({
  id: z.string(),
  long_name: z.string(),
  short_name: z.string(),
  default_authn_provider_name: z.string(),
});
const InstitutionSupportedProvidersSchema = z.object({
  name: AuthnProviderSchema.shape.name,
  is_default: z.boolean(),
});
const LoginQuerySchema = z.object({
  institution_id: IdSchema.optional(),
  service: z.string().nullable().catch(null),
  unsupported_provider: z.literal('true').optional().catch(undefined),
  error: z.string().optional().catch(undefined),
  tab: z.enum(['login', 'register']).optional().catch(undefined),
});

async function getInstitutionAuthnProviders(): Promise<InstitutionAuthnProvider[]> {
  const institutionAuthnProvidersRes = await queryRows(
    sql.select_institution_authn_providers,
    InstitutionAuthnProviderSchema,
  );
  return institutionAuthnProvidersRes
    .map((provider) => {
      // Special case: omit the default institution in production.
      if (provider.id === '1' && config.devMode === false) return null;

      let url: string | null = null;
      switch (provider.default_authn_provider_name) {
        case 'SAML':
          url = `/pl/auth/institution/${provider.id}/saml/login`;
          break;
        case 'Google':
          url = '/pl/oauth2login';
          break;
        case 'Azure':
          url = '/pl/azure_login';
          break;
        case 'Shibboleth':
          url = '/pl/shibcallback';
          break;
        default:
          return null;
      }

      return {
        name:
          provider.long_name !== provider.short_name
            ? `${provider.long_name} (${provider.short_name})`
            : provider.long_name,
        url,
      };
    })
    .filter((provider): provider is InstitutionAuthnProvider => provider !== null);
}

router.get(
  '/',
  asyncHandler(async (req, res, _next) => {
    const query = parseRequestQuery(req, LoginQuerySchema);

    // If an `institution_id` query parameter is provided, we'll only show the
    // login options for that institution.
    const institutionId = query.institution_id ?? null;
    if (institutionId) {
      // Look up the supported providers for this institution.
      const supportedProviders = await queryRows(
        sql.select_supported_providers_for_institution,
        { institution_id: institutionId },
        InstitutionSupportedProvidersSchema,
      );

      res.send(
        AuthLoginInstitution({
          showUnsupportedMessage: query.unsupported_provider === 'true',
          institutionId,
          supportedProviders,
          service: query.service,
          resLocals: res.locals,
        }),
      );
      return;
    }

    const institutionAuthnProviders = await getInstitutionAuthnProviders();

    res.send(
      AuthLogin({
        service: query.service,
        institutionAuthnProviders,
        resLocals: res.locals,
        errorMessage: query.error,
        initialTab: query.tab ?? 'login',
      }),
    );
  }),
);

router.get('/altcha-challenge', (_req, res) => {
  res.set('Cache-Control', 'no-store');
  res.json(createAltchaChallenge());
});

const DevLoginBodySchema = z.object({
  uid: z.string().min(1),
  name: z.string().min(1),
  uin: z.string().nullable().optional().default(null),
  email: z.string().nullable().optional().default(null),
});

const LocalLoginBodySchema = z.object({
  identifier: z.string().min(1),
  password: z.string().min(1),
});

router.post(
  '/',
  asyncHandler(async (req, res, _next) => {
    const query = parseRequestQuery(req, LoginQuerySchema);
    const action = req.body.__action;

    // 1. Password Login
    if (action === 'local_login') {
      if (!verifyAltchaPayload(req.body.altcha).ok) {
        const providers = await getInstitutionAuthnProviders();
        res.status(400).send(
          AuthLogin({
            service: query.service,
            institutionAuthnProviders: providers,
            resLocals: res.locals,
            errorMessage: uiStrings.auth.altchaError,
            initialTab: 'login',
            initialIdentifier: typeof req.body.identifier === 'string' ? req.body.identifier : '',
          }),
        );
        return;
      }

      const bodyResult = LocalLoginBodySchema.safeParse(req.body);
      if (!bodyResult.success) {
        const providers = await getInstitutionAuthnProviders();
        res.status(400).send(
          AuthLogin({
            service: query.service,
            institutionAuthnProviders: providers,
            resLocals: res.locals,
            errorMessage: uiStrings.auth.requiredFieldsError,
            initialTab: 'login',
            initialIdentifier: typeof req.body.identifier === 'string' ? req.body.identifier : '',
          }),
        );
        return;
      }

      const { identifier, password } = bodyResult.data;
      const verifyResult = await verifyLocalCredentials(identifier, password);
      if (!verifyResult.success) {
        let errorMsg = uiStrings.auth.invalidPasswordError;
        if (verifyResult.reason === 'USER_NOT_FOUND') {
          errorMsg = uiStrings.auth.userNotFoundError;
        } else if (verifyResult.reason === 'NO_PASSWORD_SET') {
          errorMsg = uiStrings.auth.noPasswordSetError;
        }

        const providers = await getInstitutionAuthnProviders();
        res.status(401).send(
          AuthLogin({
            service: query.service,
            institutionAuthnProviders: providers,
            resLocals: res.locals,
            errorMessage: errorMsg,
            initialTab: 'login',
            initialIdentifier: identifier,
          }),
        );
        return;
      }

      await authLib.loadUser(
        req,
        res,
        {
          user_id: verifyResult.user_id,
          provider: 'Local',
        },
        {
          redirect: true,
        },
      );
      return;
    }

    // 2. Fast Self-Registration
    if (action === 'local_register') {
      const body = req.body;
      const str = (v: unknown) => (typeof v === 'string' ? v : '');
      const name = str(body.name).trim();
      const email = str(body.email).trim().toLowerCase();
      const rawUin = str(body.uin);
      const isStaffUin = body.is_staff_uin === 'on' || body.is_staff_uin === 'true' || body.is_staff_uin === '1';
      const password = str(body.password);

      const fail = async (status: number, errorMessage: string) => {
        const providers = await getInstitutionAuthnProviders();
        res.status(status).send(
          AuthLogin({
            service: query.service,
            institutionAuthnProviders: providers,
            resLocals: res.locals,
            errorMessage,
            initialTab: 'register',
            initialIdentifier: email,
            initialName: name,
            initialUin: rawUin.trim().slice(0, 32),
            initialIsStaffUin: isStaffUin,
          }),
        );
      };

      if (!verifyAltchaPayload(body.altcha).ok) {
        await fail(400, uiStrings.auth.altchaError);
        return;
      }
      if (!name || !email || !password || !str(body.confirm_password) || !rawUin.trim()) {
        await fail(400, uiStrings.auth.requiredFieldsError);
        return;
      }
      if (name.length < 2 || name.length > 200) {
        await fail(400, uiStrings.auth.invalidNameError);
        return;
      }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
        await fail(400, uiStrings.auth.invalidEmailError);
        return;
      }
      const uinResult = validateUin(rawUin, { isStaff: isStaffUin });
      if (!uinResult.ok) {
        await fail(400, uinResult.message);
        return;
      }
      if (password.length < 6 || password.length > 256) {
        await fail(400, uiStrings.auth.passwordLengthError);
        return;
      }
      if (password !== body.confirm_password) {
        await fail(400, uiStrings.auth.passwordMismatchError);
        return;
      }

      try {
        const { user_id } = await registerLocalUser({
          name,
          email,
          password,
          uin: uinResult.uin,
          isStaff: isStaffUin,
        });

        await authLib.loadUser(
          req,
          res,
          {
            user_id,
            provider: 'Local',
          },
          {
            redirect: true,
          },
        );
        return;
      } catch (err: any) {
        if (err.message === 'EMAIL_EXISTS') {
          await fail(409, uiStrings.auth.emailExistsError);
          return;
        }
        if (err.message === 'UIN_EXISTS') {
          await fail(409, uiStrings.auth.uinExistsError);
          return;
        }
        throw err;
      }
    }

    // 3. Dev Mode Quick Login
    if (action === 'dev_login') {
      if (!config.devMode) {
        throw new error.HttpStatusError(403, 'Forbidden');
      }

      const body = parseRequestBody(req, DevLoginBodySchema);
      const authnParams = {
        uid: body.uid,
        name: body.name,
        uin: body.uin || null,
        email: body.email || null,
        provider: 'dev',
      };

      await authLib.loadUser(req, res, authnParams, {
        redirect: true,
      });
      return;
    }

    throw new error.HttpStatusError(400, `Unknown action: ${action}`);
  }),
);

export default router;
