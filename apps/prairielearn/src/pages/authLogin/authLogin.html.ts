import clsx from 'clsx';

import { type HtmlValue, html } from '@prairielearn/html';
import { run } from '@prairielearn/run';

import { HeadContents } from '../../components/HeadContents.js';
import { assetPath } from '../../lib/assets.js';
import { getEffectiveBrandName, platformBranding, uiStrings } from '../../lib/branding.js';
import { config } from '../../lib/config.js';
import type { AuthnProvider } from '../../lib/db-types.js';
import { isEnterprise } from '../../lib/license.js';
import type { UntypedResLocals } from '../../lib/res-locals.types.js';

export interface InstitutionAuthnProvider {
  name: string;
  url: string;
}

interface InstitutionSupportedProvider {
  name: AuthnProvider['name'];
  is_default: boolean;
}

function LoginPageContainer({
  children,
  service,
  resLocals,
}: {
  children: HtmlValue;
  service: string | null;
  resLocals: UntypedResLocals;
}) {
  return html`
    <!doctype html>
    <html lang="fa" dir="rtl">
      <head>
        ${HeadContents({ resLocals })}
        <style>
          html,
          body {
            min-height: 100vh;
          }

          .login-container-wrapper {
            width: 100%;
            height: 100%;
          }

          .login-container {
            background-color: white;
            padding: 20px;
            height: 100%;
          }

          @media (min-width: 576px) {
            html,
            body {
              background-color: var(--bs-dark);
            }

            .login-container-wrapper {
              max-width: 500px;
              margin: auto;
              height: auto;
            }

            .login-container {
              border-radius: 5px;
              box-shadow:
                0 19px 38px rgba(0, 0, 0, 0.3),
                0 15px 12px rgba(0, 0, 0, 0.22);
              height: auto;
              margin: 20px;
            }
          }

          .subheader {
            font-weight: 300;
            font-size: 1.2rem;
          }

          .btn .social-icon {
            position: absolute;
            left: 7px;
            height: 24px;
            top: 0;
            bottom: 0;
            margin: auto;
          }

          .btn-shib {
            background-color: ${config.shibLinkColors.normal.background};
            border-color: ${config.shibLinkColors.normal.border};
            color: ${config.shibLinkColors.normal.text};
          }

          .btn-shib:hover {
            background-color: ${config.shibLinkColors.hover.background};
            border-color: ${config.shibLinkColors.hover.border};
            color: ${config.shibLinkColors.hover.text};
          }

          .btn-shib:focus {
            box-shadow: 0 0 0 0.2rem ${config.shibLinkColors.focus.shadow};
          }

          .btn-shib:active {
            background-color: ${config.shibLinkColors.active.background};
            border-color: ${config.shibLinkColors.active.border};
            color: ${config.shibLinkColors.active.text};
          }

          .institution-header {
            overflow: hidden;
            text-align: center;
          }

          .institution-header:before,
          .institution-header:after {
            background-color: #000;
            content: '';
            display: inline-block;
            height: 1px;
            position: relative;
            vertical-align: middle;
            width: 50%;
          }

          .institution-header:before {
            right: 0.5em;
            margin-left: -50%;
          }

          .institution-header:after {
            left: 0.5em;
            margin-right: -50%;
          }
        </style>
      </head>
      <body class="d-flex flex-column">
        <main class="login-container-wrapper">
          <div class="login-container" style="font-family: var(--font-persian);">
            <div>
              <h1 class="text-center mb-3">
                <a
                  href="/"
                  class="text-decoration-none text-dark d-flex flex-column align-items-center justify-content-center"
                >
                  ${
                    platformBranding.logoUrl
                      ? html`<img
                          src="${platformBranding.logoUrl}"
                          alt="${getEffectiveBrandName(resLocals?.institution)}"
                          style="height: 70px; width: auto; margin-bottom: 12px;"
                        />`
                      : html`
                          <div
                            class="d-flex align-items-center justify-content-center bg-primary text-white rounded-circle shadow-sm mb-3"
                            style="width: 68px; height: 68px;"
                          >
                            <i class="fas fa-graduation-cap fs-2"></i>
                          </div>
                        `
                  }
                  <span style="font-weight: 800; font-size: 1.25rem; color: #0f2b48;">
                    ${getEffectiveBrandName(resLocals?.institution)}
                  </span>
                  <span style="font-size: 0.85rem; color: #64748b; font-weight: 500; margin-top: 4px;">
                    ${platformBranding.brandSubtitle}
                  </span>
                </a>
              </h1>
              <h2 class="text-center subheader mb-4" style="font-size: 0.95rem; color: #475569;">
                ${service ? `ورود به سامانه جهت دسترسی به ${service}` : uiStrings.auth.loginSubtitle}
              </h2>
              ${children}
            </div>
          </div>
        </main>
      </body>
    </html>
  `;
}

function ShibLoginButton() {
  return html`
    <a class="btn btn-shib d-block position-relative" href="/pl/shibcallback">
      <img src="${config.shibLinkLogo}" class="social-icon" alt="" />
      <span class="fw-bold">${config.shibLinkText}</span>
    </a>
  `;
}

function GoogleLoginButton() {
  return html`
    <a class="btn btn-primary d-block position-relative" href="/pl/oauth2login">
      <img src="${assetPath('/images/google_logo.svg')}" class="social-icon" alt="" />
      <span class="fw-bold">${uiStrings.auth.loginWithGoogle}</span>
    </a>
  `;
}

function MicrosoftLoginButton() {
  return html`
    <a class="btn btn-dark d-block position-relative" href="/pl/azure_login">
      <img src="${assetPath('/images/ms_logo.svg')}" class="social-icon" alt="" />
      <span class="fw-bold">${uiStrings.auth.loginWithMicrosoft}</span>
    </a>
  `;
}

function SamlLoginButton({ institutionId }: { institutionId: string }) {
  return html`
    <a class="btn btn-primary d-block" href="${`/pl/auth/institution/${institutionId}/saml/login`}">
      <span class="fw-bold">${uiStrings.auth.loginWithSso}</span>
    </a>
  `;
}

export function AuthLogin({
  institutionAuthnProviders,
  service,
  resLocals,
}: {
  institutionAuthnProviders: InstitutionAuthnProvider[] | null;
  service: string | null;
  resLocals: UntypedResLocals;
}) {
  return LoginPageContainer({
    service,
    resLocals,
    children: html`
      ${
        config.devMode
          ? html`
              ${DevModeBypass()}
              <hr />
              ${DevModeLogin({ csrfToken: resLocals.__csrf_token })}
              <hr />
            `
          : ''
      }
      <div class="d-flex flex-column gap-2 mt-4">
        ${config.hasShib && !config.hideShibLogin ? ShibLoginButton() : ''}
        ${config.hasOauth ? GoogleLoginButton() : ''}
        ${config.hasAzure && isEnterprise() ? MicrosoftLoginButton() : ''}
      </div>
      ${
        institutionAuthnProviders?.length
          ? html`
              <div class="institution-header text-muted my-3">${uiStrings.auth.institutionHeader}</div>
              <input
                type="search"
                id="js-institution-search"
                class="form-control mb-2 text-end"
                placeholder="${uiStrings.auth.institutionPlaceholder}"
                aria-label="${uiStrings.auth.institutionAria}"
                autocomplete="off"
                dir="rtl"
              />
              <div id="js-institution-list" class="d-flex flex-column gap-2">
                ${institutionAuthnProviders.map(
                  (provider) => html`
                    <a
                      href="${provider.url}"
                      class="btn btn-outline-dark d-block w-100 js-institution-option"
                      data-institution-name="${provider.name.toLowerCase()}"
                    >
                      <span class="fw-bold">${provider.name}</span>
                    </a>
                  `,
                )}
              </div>
              <div id="js-institution-no-results" class="text-muted d-none mt-2 text-center">
                موردی یافت نشد
              </div>
              <script>
                document.getElementById('js-institution-search').addEventListener('input', (e) => {
                  const query = e.target.value.trim().toLowerCase();
                  let visibleCount = 0;
                  document.querySelectorAll('.js-institution-option').forEach((el) => {
                    const isVisible = el.dataset.institutionName.includes(query);
                    el.classList.toggle('d-none', !isVisible);
                    if (isVisible) visibleCount++;
                  });
                  document
                    .getElementById('js-institution-no-results')
                    .classList.toggle('d-none', visibleCount > 0);
                });
              </script>
            `
          : ''
      }
    `,
  }).toString();
}

function isLtiProvider(provider: InstitutionSupportedProvider) {
  return provider.name === 'LTI' || provider.name === 'LTI 1.3';
}

export function AuthLoginInstitution({
  showUnsupportedMessage,
  supportedProviders,
  institutionId,
  service,
  resLocals,
}: {
  showUnsupportedMessage: boolean;
  supportedProviders: InstitutionSupportedProvider[];
  institutionId: string;
  service: string | null;
  resLocals: UntypedResLocals;
}) {
  // We need to filter `supportedProviders` to reflect which ones are actually
  // enabled in the application configuration.
  const loginOptions = supportedProviders.filter((p) => {
    // LTI options are always excluded from this list. An LTI session must always
    // start from the LTI platform, not from PrairieLearn.
    if (isLtiProvider(p)) return false;

    // Some options require specific configuration to be enabled.
    if (p.name === 'Google') return config.hasOauth;
    if (p.name === 'Azure') return config.hasAzure && isEnterprise();
    if (p.name === 'Shibboleth') return config.hasShib && !config.hideShibLogin;

    // Assume other providers are always enabled.
    return true;
  });

  // LTI providers were filtered out above; we need to check the original list.
  const supportsAnyLti = supportedProviders.some((p) => isLtiProvider(p));
  const supportsNonLti = supportedProviders.some((p) => !isLtiProvider(p));

  const supportsSaml = loginOptions.some((p) => p.name === 'SAML');
  const supportsShib = loginOptions.some((p) => p.name === 'Shibboleth');
  const supportsGoogle = loginOptions.some((p) => p.name === 'Google');
  const supportsAzure = loginOptions.some((p) => p.name === 'Azure');

  const defaultProvider = loginOptions.find((p) => p.is_default === true);
  const hasNonDefaultProviders = loginOptions.some((p) => p.is_default === false);

  // If a default provider is set, we'll always show it first. These variables
  // determine whether to separately show other non-default providers.
  const showSaml = supportsSaml && defaultProvider?.name !== 'SAML';
  const showShib = supportsShib && defaultProvider?.name !== 'Shibboleth';
  const showGoogle = supportsGoogle && defaultProvider?.name !== 'Google';
  const showAzure = supportsAzure && defaultProvider?.name !== 'Azure';

  const defaultProviderButton = run(() => {
    switch (defaultProvider?.name) {
      case 'SAML':
        return SamlLoginButton({ institutionId });
      case 'Shibboleth':
        return ShibLoginButton();
      case 'Google':
        return GoogleLoginButton();
      case 'Azure':
        return MicrosoftLoginButton();
    }
  });

  return LoginPageContainer({
    service,
    resLocals,
    children: html`
      ${run(() => {
        if (showUnsupportedMessage) {
          return html`
            <div
              class="${clsx('alert alert-danger text-center', {
                'mb-0': loginOptions.length === 0,
              })}"
              role="alert"
            >
              The authentication method you tried to use is not supported by your institution.
              ${run(() => {
                if (loginOptions.length > 0) {
                  return 'Try again with a supported method.';
                }

                if (supportsAnyLti) {
                  return "You must start a session from your course's Learning Management System (LMS).";
                }

                // This institution somehow has no login options.
                return 'Contact your institution for more information.';
              })}
            </div>
          `;
        }

        if (!supportsNonLti && supportsAnyLti) {
          return html`
            <div class="alert alert-danger text-center mb-0" role="alert">
              You must start a session from your course's Learning Management System (LMS).
            </div>
          `;
        }

        if (loginOptions.length === 0) {
          return html`
            <div class="alert alert-danger text-center mb-0" role="alert">
              No authentication methods found. Contact your institution for more information.
            </div>
          `;
        }
      })}
      ${
        defaultProviderButton
          ? html`
              ${
                hasNonDefaultProviders
                  ? html`<small class="text-muted text-center d-block mb-2"
                      >${uiStrings.auth.preferredMethod}</small
                    >`
                  : ''
              }
              ${defaultProviderButton}
              ${
                hasNonDefaultProviders
                  ? html`
                      <small class="text-muted text-center d-block mt-4 mb-2">${uiStrings.auth.otherMethods}</small>
                    `
                  : ''
              }
            `
          : ''
      }
      <div class="d-flex flex-column gap-2">
        ${[
          showSaml ? SamlLoginButton({ institutionId }) : '',
          showShib ? ShibLoginButton() : '',
          showGoogle ? GoogleLoginButton() : '',
          showAzure ? MicrosoftLoginButton() : '',
        ]}
      </div>
    `,
  }).toString();
}

function DevModeBypass() {
  return html`
    <a class="btn btn-success w-100" href="/pl/dev_login">
      <span class="fw-bold"><i class="fas fa-bolt me-1"></i> ${uiStrings.auth.devBypassBtn}</span>
    </a>
    <small class="text-muted d-block text-center mt-1">${uiStrings.auth.devBypassHint} <code>${config.authUid}</code></small>
  `;
}

function DevModeLogin({ csrfToken }: { csrfToken: string }) {
  return html`
    <form method="POST" dir="rtl" class="text-end">
      <div class="mb-3">
        <label class="form-label fw-bold" for="dev_uid">${uiStrings.auth.uidLabel}</label>
        <input type="text" class="form-control text-start" id="dev_uid" name="uid" dir="ltr" placeholder="${uiStrings.auth.uidPlaceholder}" required />
      </div>
      <div class="mb-3">
        <label class="form-label fw-bold" for="dev_name">${uiStrings.auth.nameLabel}</label>
        <input type="text" class="form-control" id="dev_name" name="name" placeholder="${uiStrings.auth.namePlaceholder}" required />
      </div>
      <div class="mb-3">
        <label class="form-label" for="dev_uin">${uiStrings.auth.uinLabel}</label>
        <input
          type="text"
          class="form-control text-start"
          id="dev_uin"
          name="uin"
          dir="ltr"
          placeholder="${uiStrings.auth.uinPlaceholder}"
          aria-describedby="dev_uin_help"
        />
        <small id="dev_uin_help" class="form-text text-muted">
          ${uiStrings.auth.uinHelp}
        </small>
      </div>
      <div class="mb-3">
        <label class="form-label" for="dev_email">${uiStrings.auth.emailLabel}</label>
        <input
          type="email"
          class="form-control text-start"
          id="dev_email"
          name="email"
          dir="ltr"
          placeholder="${uiStrings.auth.emailPlaceholder}"
          aria-describedby="dev_email_help"
        />
      </div>
      <input type="hidden" name="__csrf_token" value="${csrfToken}" />
      <button type="submit" class="btn btn-primary d-block w-100" name="__action" value="dev_login">
        <span class="fw-bold">${uiStrings.auth.devLoginBtn}</span>
      </button>
    </form>
  `;
}
