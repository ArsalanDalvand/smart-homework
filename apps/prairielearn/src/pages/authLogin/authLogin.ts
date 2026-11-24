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
import {
  registerLocalUser,
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
      const initialIdentifier = typeof body.email === 'string' ? body.email : '';

      if (!body.name || !body.email || !body.password || !body.confirm_password || typeof body.uin !== 'string' || !body.uin.trim()) {
        const providers = await getInstitutionAuthnProviders();
        res.status(400).send(
          AuthLogin({
            service: query.service,
            institutionAuthnProviders: providers,
            resLocals: res.locals,
            errorMessage: uiStrings.auth.requiredFieldsError,
            initialTab: 'register',
            initialIdentifier,
          }),
        );
        return;
      }

      if (typeof body.name !== 'string' || body.name.trim().length < 2) {
        const providers = await getInstitutionAuthnProviders();
        res.status(400).send(
          AuthLogin({
            service: query.service,
            institutionAuthnProviders: providers,
            resLocals: res.locals,
            errorMessage: uiStrings.auth.invalidNameError,
            initialTab: 'register',
            initialIdentifier,
          }),
        );
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (typeof body.email !== 'string' || !emailRegex.test(body.email.trim())) {
        const providers = await getInstitutionAuthnProviders();
        res.status(400).send(
          AuthLogin({
            service: query.service,
            institutionAuthnProviders: providers,
            resLocals: res.locals,
            errorMessage: uiStrings.auth.invalidEmailError,
            initialTab: 'register',
            initialIdentifier,
          }),
        );
        return;
      }

      if (typeof body.password !== 'string' || body.password.length < 6) {
        const providers = await getInstitutionAuthnProviders();
        res.status(400).send(
          AuthLogin({
            service: query.service,
            institutionAuthnProviders: providers,
            resLocals: res.locals,
            errorMessage: uiStrings.auth.passwordLengthError,
            initialTab: 'register',
            initialIdentifier,
          }),
        );
        return;
      }

      if (body.password !== body.confirm_password) {
        const providers = await getInstitutionAuthnProviders();
        res.status(400).send(
          AuthLogin({
            service: query.service,
            institutionAuthnProviders: providers,
            resLocals: res.locals,
            errorMessage: uiStrings.auth.passwordMismatchError,
            initialTab: 'register',
            initialIdentifier,
          }),
        );
        return;
      }

      try {
        const { user_id } = await registerLocalUser({
          name: body.name.trim(),
          email: body.email.trim(),
          password: body.password,
          uin: body.uin.trim(),
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
          const providers = await getInstitutionAuthnProviders();
          res.status(409).send(
            AuthLogin({
              service: query.service,
              institutionAuthnProviders: providers,
              resLocals: res.locals,
              errorMessage: uiStrings.auth.emailExistsError,
              initialTab: 'register',
              initialIdentifier,
            }),
          );
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
