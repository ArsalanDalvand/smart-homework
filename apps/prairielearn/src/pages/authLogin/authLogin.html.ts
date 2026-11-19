import clsx from 'clsx';

import { type HtmlValue, html } from '@prairielearn/html';
import { run } from '@prairielearn/run';

import { HeadContents } from '../../components/HeadContents.js';
import { SupportModal } from '../../components/SupportModal.js';
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
            background: linear-gradient(145deg, #0f172a 0%, #1e293b 50%, #0f172a 100%);
            font-family: var(--font-persian), system-ui, -apple-system, sans-serif;
          }

          .login-wrapper {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .login-hero-card {
            background: rgba(255, 255, 255, 0.05);
            backdrop-filter: blur(12px);
            border: 1px solid rgba(255, 255, 255, 0.12);
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
          }

          .login-form-card {
            background: #ffffff;
            border-radius: 16px;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.35);
          }

          .subheader {
            font-weight: 400;
            font-size: 0.95rem;
          }

          .btn .social-icon {
            position: absolute;
            left: 12px;
            height: 22px;
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
            background-color: #cbd5e1;
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
      <body class="d-flex flex-column" style="font-family: var(--font-persian);">
        <main class="login-wrapper py-4 py-lg-5">
          <div class="container" style="max-width: 1100px;">
            <div class="row g-4 align-items-stretch justify-content-center">
              <!-- Right Column (Hero / Platform Intro / Guidance) -->
              <div class="col-12 col-lg-7 d-flex flex-column justify-content-between text-white p-4 p-md-5 rounded-4 login-hero-card">
                <div>
                  <div class="d-inline-flex align-items-center gap-2 px-3 py-1 mb-3 rounded-pill bg-white bg-opacity-10 border border-white border-opacity-25 small">
                    <i class="fas fa-graduation-cap text-warning"></i>
                    <span>${uiStrings.auth.welcomeBadge}</span>
                  </div>
                  <h1 class="fw-bold mb-3 display-6 text-white lh-base">
                    ${getEffectiveBrandName(resLocals?.institution)}
                  </h1>
                  <p class="opacity-90 mb-4 fs-6 lh-lg text-light">
                    ${uiStrings.auth.welcomeDescription}
                  </p>

                  <div class="d-flex flex-column gap-3 mb-4">
                    <div class="d-flex align-items-start gap-3 p-3 rounded-3 bg-white bg-opacity-10 border border-white border-opacity-10">
                      <div class="rounded-circle bg-warning text-dark d-flex align-items-center justify-content-center flex-shrink-0" style="width: 38px; height: 38px;">
                        <i class="fas fa-bullseye"></i>
                      </div>
                      <div>
                        <h6 class="fw-bold mb-1 text-white">${uiStrings.auth.feature1Title}</h6>
                        <small class="text-white text-opacity-75 d-block lh-base">${uiStrings.auth.feature1Desc}</small>
                      </div>
                    </div>

                    <div class="d-flex align-items-start gap-3 p-3 rounded-3 bg-white bg-opacity-10 border border-white border-opacity-10">
                      <div class="rounded-circle bg-success text-white d-flex align-items-center justify-content-center flex-shrink-0" style="width: 38px; height: 38px;">
                        <i class="fas fa-bolt"></i>
                      </div>
                      <div>
                        <h6 class="fw-bold mb-1 text-white">${uiStrings.auth.feature2Title}</h6>
                        <small class="text-white text-opacity-75 d-block lh-base">${uiStrings.auth.feature2Desc}</small>
                      </div>
                    </div>

                    <div class="d-flex align-items-start gap-3 p-3 rounded-3 bg-white bg-opacity-10 border border-white border-opacity-10">
                      <div class="rounded-circle bg-info text-white d-flex align-items-center justify-content-center flex-shrink-0" style="width: 38px; height: 38px;">
                        <i class="fas fa-shield-alt"></i>
                      </div>
                      <div>
                        <h6 class="fw-bold mb-1 text-white">${uiStrings.auth.feature3Title}</h6>
                        <small class="text-white text-opacity-75 d-block lh-base">${uiStrings.auth.feature3Desc}</small>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Onboarding guidance for students & instructors -->
                <div class="pt-3 border-top border-white border-opacity-25 mt-2">
                  <h6 class="fw-bold mb-2 text-warning"><i class="fas fa-info-circle me-1"></i> ${uiStrings.auth.guideHeader}</h6>
                  <p class="small text-white text-opacity-80 mb-2 lh-base">
                    ${uiStrings.auth.guideStudent}
                  </p>
                  <p class="small text-white text-opacity-80 mb-3 lh-base">
                    ${uiStrings.auth.guideInstructor}
                  </p>
                  <div class="d-flex flex-wrap gap-2">
                    <a href="/pl/request_course" class="btn btn-warning btn-sm fw-medium shadow-sm">
                      <i class="fas fa-plus-circle me-1"></i> ${uiStrings.auth.requestCourseAction}
                    </a>
                    <button type="button" class="btn btn-outline-light btn-sm fw-medium" data-bs-toggle="modal" data-bs-target="#supportModal">
                      <i class="fas fa-question-circle me-1"></i> ${uiStrings.auth.supportAction}
                    </button>
                  </div>
                </div>
              </div>

              <!-- Left Column: The Login Card -->
              <div class="col-12 col-lg-5 d-flex align-items-stretch">
                <div class="login-form-card w-100 p-4 p-md-4 d-flex flex-column justify-content-between">
                  <div>
                    <div class="text-center mb-3">
                      <a
                        href="/"
                        class="text-decoration-none text-dark d-flex flex-column align-items-center justify-content-center"
                      >
                        ${
                          platformBranding.logoUrl
                            ? html`<img
                                src="${platformBranding.logoUrl}"
                                alt="${getEffectiveBrandName(resLocals?.institution)}"
                                style="height: 56px; width: auto; margin-bottom: 8px;"
                              />`
                            : html`
                                <div
                                  class="d-flex align-items-center justify-content-center bg-primary text-white rounded-circle shadow-sm mb-2"
                                  style="width: 52px; height: 52px;"
                                >
                                  <i class="fas fa-graduation-cap fs-3"></i>
                                </div>
                              `
                        }
                        <span style="font-weight: 800; font-size: 1.15rem; color: #0f2b48;">
                          ${getEffectiveBrandName(resLocals?.institution)}
                        </span>
                        <span style="font-size: 0.8rem; color: #64748b; font-weight: 500; margin-top: 2px;">
                          ${platformBranding.brandSubtitle}
                        </span>
                      </a>
                    </div>
                    <h2 class="text-center subheader mb-3" style="font-size: 0.88rem; color: #475569;">
                      ${service ? `ورود به سامانه جهت دسترسی به ${service}` : uiStrings.auth.loginSubtitle}
                    </h2>
                    ${children}
                  </div>

                  <div class="pt-3 border-top text-center mt-3">
                    <small class="text-muted d-block mb-2">نیاز به تعریف درس جدید یا راهنمایی دارید؟</small>
                    <div class="d-flex justify-content-center gap-3">
                      <a href="/pl/request_course" class="text-decoration-none small text-primary fw-medium">
                        ${uiStrings.auth.requestCourseAction}
                      </a>
                      <span class="text-muted">•</span>
                      <a href="#" data-bs-toggle="modal" data-bs-target="#supportModal" class="text-decoration-none small text-secondary">
                        ${uiStrings.auth.supportAction}
                      </a>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </main>
        ${SupportModal()}
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
        <label class="form-label fw-bold d-block text-end" for="dev_uid">
          <bdi>${uiStrings.auth.uidLabel}</bdi>
        </label>
        <input type="text" class="form-control text-start" id="dev_uid" name="uid" dir="ltr" placeholder="${uiStrings.auth.uidPlaceholder}" required />
      </div>
      <div class="mb-3">
        <label class="form-label fw-bold d-block text-end" for="dev_name">${uiStrings.auth.nameLabel}</label>
        <input type="text" class="form-control text-end" id="dev_name" name="name" placeholder="${uiStrings.auth.namePlaceholder}" required />
      </div>
      <div class="mb-3">
        <label class="form-label d-block text-end" for="dev_uin">${uiStrings.auth.uinLabel}</label>
        <input
          type="text"
          class="form-control text-start"
          id="dev_uin"
          name="uin"
          dir="ltr"
          placeholder="${uiStrings.auth.uinPlaceholder}"
          aria-describedby="dev_uin_help"
        />
        <small id="dev_uin_help" class="form-text text-muted d-block text-end">
          ${uiStrings.auth.uinHelp}
        </small>
      </div>
      <div class="mb-3">
        <label class="form-label d-block text-end" for="dev_email">${uiStrings.auth.emailLabel}</label>
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
      <button type="submit" class="btn btn-primary d-block w-100 py-2 shadow-sm" name="__action" value="dev_login">
        <span class="fw-bold"><i class="fas fa-sign-in-alt me-1"></i> ${uiStrings.auth.devLoginBtn}</span>
      </button>
    </form>
  `;
}
