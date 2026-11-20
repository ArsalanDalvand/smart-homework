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
  errorMessage,
  initialTab = 'login',
}: {
  children: HtmlValue;
  service: string | null;
  resLocals: UntypedResLocals;
  errorMessage?: string;
  initialTab?: 'login' | 'register';
}) {
  const isCourseRequestService = service?.includes('request_course');

  return html`
    <!doctype html>
    <html lang="fa" dir="rtl">
      <head>
        ${HeadContents({ resLocals })}
        <style>
          html,
          body {
            min-height: 100vh;
            background: linear-gradient(180deg, #f8fafc 0%, #f1f5f9 60%, #e2e8f0 100%);
            font-family: var(--font-persian), system-ui, -apple-system, sans-serif;
            color: #1e293b;
          }

          .login-wrapper {
            min-height: calc(100vh - 145px);
            display: flex;
            align-items: center;
            justify-content: center;
          }

          .landing-showcase-panel {
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 20px;
            box-shadow: 0 4px 20px -2px rgba(15, 23, 42, 0.05);
          }

          .login-form-card {
            background: #ffffff;
            border: 1px solid #e2e8f0;
            border-radius: 20px;
            box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.08), 0 8px 10px -6px rgba(15, 23, 42, 0.04);
          }

          .benefit-card {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            transition: all 0.2s ease-in-out;
          }

          .benefit-card:hover {
            background: #f1f5f9;
            transform: translateY(-2px);
          }

          .guide-callout {
            background: #f0fdf4;
            border: 1px solid #bbf7d0;
            border-radius: 14px;
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

          .auth-tab-btn {
            cursor: pointer;
            transition: all 0.2s ease;
          }

          .auth-tab-btn.active {
            background-color: #ffffff;
            color: #0f172a;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          }

          /* Explicit RTL form alignment rules */
          .login-form-card,
          .login-form-card form,
          .login-form-card .form-label,
          .login-form-card .form-control,
          .login-form-card .form-text,
          .login-form-card .alert {
            text-align: right !important;
            direction: rtl !important;
          }

          .login-form-card input::placeholder {
            text-align: right !important;
            direction: rtl !important;
          }

          .login-form-card input[type="text"],
          .login-form-card input:not([type="email"]):not([type="password"]) {
            direction: rtl !important;
            text-align: right !important;
          }

          .login-form-card input[type="email"],
          .login-form-card input[type="password"] {
            direction: ltr !important;
            text-align: right !important;
          }

          .login-form-card input[type="email"]:focus,
          .login-form-card input[type="password"]:focus,
          .login-form-card input[type="email"]:not(:placeholder-shown),
          .login-form-card input[type="password"]:not(:placeholder-shown) {
            text-align: left !important;
          }
        </style>
      </head>
      <body class="d-flex flex-column min-vh-100" style="font-family: var(--font-persian);">
        <!-- Top Navigation Header -->
        <header class="bg-white border-bottom py-3 shadow-xs">
          <div class="container d-flex justify-content-between align-items-center" style="max-width: 1140px;">
            <a href="/" class="text-decoration-none d-flex align-items-center gap-3">
              ${
                platformBranding.logoUrl
                  ? html`<img
                      src="${platformBranding.logoUrl}"
                      alt="${getEffectiveBrandName(resLocals?.institution)}"
                      style="height: 44px; width: auto;"
                    />`
                  : html`
                      <div
                        class="bg-primary text-white rounded-3 p-2 d-flex align-items-center justify-content-center shadow-sm"
                        style="width: 42px; height: 42px;"
                      >
                        <i class="fas fa-graduation-cap fs-4"></i>
                      </div>
                    `
              }
              <div>
                <span class="fw-bold text-dark fs-5 d-block">${getEffectiveBrandName(resLocals?.institution)}</span>
                <span class="text-secondary small d-none d-sm-block">${platformBranding.brandSubtitle}</span>
              </div>
            </a>
            <div class="d-flex align-items-center gap-2">
              <a href="/pl/request_course" class="btn btn-outline-primary btn-sm fw-medium">
                <i class="fas fa-plus-circle me-1"></i> ${uiStrings.landing.requestCourseBtn}
              </a>
              <button
                type="button"
                class="btn btn-light btn-sm fw-medium border text-secondary"
                data-bs-toggle="modal"
                data-bs-target="#supportModal"
              >
                <i class="fas fa-question-circle me-1 text-primary"></i> ${uiStrings.landing.supportBtn}
              </button>
            </div>
          </div>
        </header>

        <!-- Main Content Area: Split Showcase & Login Panel -->
        <main class="login-wrapper py-4 py-lg-5">
          <div class="container" style="max-width: 1140px;">
            <div class="row g-4 align-items-stretch justify-content-center">
              
              <!-- Right Column (Showcase & Benefits + Guidance Box) -->
              <div class="col-12 col-lg-7 order-2 order-lg-1">
                <div class="landing-showcase-panel h-100 d-flex flex-column justify-content-between p-4 p-md-5">
                  <div>
                    <div class="d-inline-flex align-items-center gap-2 px-3 py-1 mb-3 rounded-pill bg-primary-subtle text-primary border border-primary-subtle small fw-medium">
                      <i class="fas fa-sparkles text-primary"></i>
                      <span>${uiStrings.landing.badge}</span>
                    </div>

                    <h1 class="fw-bold text-dark display-6 mb-2 lh-base">
                      ${uiStrings.landing.title}
                    </h1>

                    <p class="text-secondary lead fs-6 mb-4 lh-lg">
                      ${uiStrings.landing.description}
                    </p>

                    <!-- 3 Pillar Feature Cards -->
                    <div class="d-flex flex-column gap-3 mb-4">
                      <div class="benefit-card d-flex align-items-start gap-3 p-3">
                        <div class="rounded-circle bg-primary-subtle text-primary d-flex align-items-center justify-content-center flex-shrink-0" style="width: 44px; height: 44px; font-size: 1.2rem;">
                          <i class="fas fa-shapes"></i>
                        </div>
                        <div>
                          <h6 class="fw-bold mb-1 text-dark">${uiStrings.landing.benefit1Title}</h6>
                          <small class="text-secondary d-block lh-base">${uiStrings.landing.benefit1Desc}</small>
                        </div>
                      </div>

                      <div class="benefit-card d-flex align-items-start gap-3 p-3">
                        <div class="rounded-circle bg-success-subtle text-success d-flex align-items-center justify-content-center flex-shrink-0" style="width: 44px; height: 44px; font-size: 1.2rem;">
                          <i class="fas fa-code"></i>
                        </div>
                        <div>
                          <h6 class="fw-bold mb-1 text-dark">${uiStrings.landing.benefit2Title}</h6>
                          <small class="text-secondary d-block lh-base">${uiStrings.landing.benefit2Desc}</small>
                        </div>
                      </div>

                      <div class="benefit-card d-flex align-items-start gap-3 p-3">
                        <div class="rounded-circle bg-warning-subtle text-warning-emphasis d-flex align-items-center justify-content-center flex-shrink-0" style="width: 44px; height: 44px; font-size: 1.2rem;">
                          <i class="fas fa-check-double"></i>
                        </div>
                        <div>
                          <h6 class="fw-bold mb-1 text-dark">${uiStrings.landing.benefit3Title}</h6>
                          <small class="text-secondary d-block lh-base">${uiStrings.landing.benefit3Desc}</small>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Guidance Box («چگونه وارد شوم؟») -->
                  <div class="guide-callout p-4 mt-2">
                    <h6 class="fw-bold text-dark mb-3 d-flex align-items-center gap-2">
                      <i class="fas fa-compass text-success fs-5"></i>
                      <span>${uiStrings.landing.guideTitle}</span>
                    </h6>
                    <div class="d-flex flex-column gap-2 text-secondary small lh-lg">
                      <div>
                        <strong class="text-primary d-inline-block me-1">
                          <i class="fas fa-user-graduate me-1"></i> ${uiStrings.landing.learnerHeading}
                        </strong>
                        <span>${uiStrings.landing.learnerDesc}</span>
                      </div>
                      <div>
                        <strong class="text-success d-inline-block me-1">
                          <i class="fas fa-chalkboard-teacher me-1"></i> ${uiStrings.landing.instructorHeading}
                        </strong>
                        <span>${uiStrings.landing.instructorDesc}</span>
                      </div>
                      ${
                        config.devMode
                          ? html`
                              <div class="mt-2 pt-2 border-top border-success-subtle">
                                <strong class="text-dark d-inline-block me-1">
                                  <i class="fas fa-bolt text-warning me-1"></i> ${uiStrings.landing.devModeNoteHeading}
                                </strong>
                                <span class="text-muted">${uiStrings.landing.devModeNoteDesc}</span>
                              </div>
                            `
                          : ''
                      }
                    </div>
                    <div class="d-flex flex-wrap gap-2 mt-3 pt-2 border-top border-success-subtle">
                      <a href="/pl/request_course" class="btn btn-success btn-sm fw-medium shadow-xs">
                        <i class="fas fa-plus-circle me-1"></i> ${uiStrings.landing.requestCourseBtn}
                      </a>
                      <button
                        type="button"
                        class="btn btn-outline-success btn-sm fw-medium"
                        data-bs-toggle="modal"
                        data-bs-target="#supportModal"
                      >
                        <i class="fas fa-life-ring me-1"></i> ${uiStrings.landing.supportBtn}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Left Column: The Login & Fast Registration Card -->
              <div class="col-12 col-lg-5 order-1 order-lg-2">
                <div class="login-form-card h-100 p-4 p-md-4 d-flex flex-column justify-content-between">
                  <div>
                    ${
                      errorMessage
                        ? html`
                            <div class="alert alert-danger py-2 px-3 small mb-3 border-0 bg-danger-subtle text-danger-emphasis d-flex align-items-center gap-2" role="alert">
                              <i class="fas fa-exclamation-circle text-danger flex-shrink-0"></i>
                              <span>${errorMessage}</span>
                            </div>
                          `
                        : ''
                    }

                    ${
                      isCourseRequestService
                        ? html`
                            <div class="alert alert-primary py-2 px-3 small mb-3 border-0 bg-primary-subtle text-primary-emphasis">
                              <i class="fas fa-info-circle me-1"></i>
                              ${uiStrings.auth.courseRequestInstructorNotice}
                            </div>
                          `
                        : ''
                    }

                    <div class="text-center mb-3">
                      <div class="bg-primary-subtle text-primary rounded-circle d-inline-flex align-items-center justify-content-center mb-2" style="width: 52px; height: 52px;">
                        <i class="fas fa-user-circle fs-3"></i>
                      </div>
                      <h2 class="h5 fw-bold text-dark mb-1">${uiStrings.landing.loginCardTitle}</h2>
                      <p class="text-secondary small mb-3">
                        ${service ? `دسترسی به بخش ${service}` : uiStrings.landing.loginCardSubtitle}
                      </p>
                    </div>

                    <!-- Mode Toggle (ورود / ثبت‌نام سریع) -->
                    <div class="d-flex bg-light rounded-pill p-1 mb-3 border">
                      <button
                        type="button"
                        class="btn btn-sm w-50 rounded-pill fw-medium auth-tab-btn ${initialTab === 'login' ? 'active' : 'text-secondary'}"
                        id="tab-login-btn"
                        onclick="setAuthMode('login')"
                      >
                        ${uiStrings.auth.loginTab}
                      </button>
                      <button
                        type="button"
                        class="btn btn-sm w-50 rounded-pill fw-medium auth-tab-btn ${initialTab === 'register' ? 'active' : 'text-secondary'}"
                        id="tab-signup-btn"
                        onclick="setAuthMode('register')"
                      >
                        ${uiStrings.auth.registerTab}
                      </button>
                    </div>

                    ${children}
                  </div>

                  <div class="pt-3 border-top text-center mt-3">
                    <small class="text-muted d-block mb-2">${uiStrings.landing.loginFooterHelp}</small>
                    <div class="d-flex justify-content-center gap-3">
                      <a href="/pl/request_course" class="text-decoration-none small text-primary fw-medium">
                        ${uiStrings.landing.requestCourseBtn}
                      </a>
                      <span class="text-muted">•</span>
                      <a
                        href="#"
                        data-bs-toggle="modal"
                        data-bs-target="#supportModal"
                        class="text-decoration-none small text-secondary"
                      >
                        ${uiStrings.landing.supportBtn}
                      </a>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </main>

        <!-- Cohesive Clean Footer -->
        <footer class="bg-white border-top py-3 mt-auto">
          <div class="container d-flex flex-column flex-md-row justify-content-between align-items-center gap-2" style="max-width: 1140px;">
            <span class="text-secondary small">${uiStrings.landing.footerCopyright}</span>
            <div class="d-flex gap-3 small">
              <a href="${platformBranding.docsUrl}" target="_blank" rel="noreferrer" class="text-secondary text-decoration-none">
                <i class="fas fa-book me-1"></i> ${uiStrings.landing.footerDocsLink}
              </a>
              <span class="text-muted">•</span>
              <a href="${platformBranding.repoUrl}" target="_blank" rel="noreferrer" class="text-secondary text-decoration-none">
                <i class="fab fa-github me-1"></i> ${uiStrings.landing.footerRepoLink}
              </a>
              <span class="text-muted">•</span>
              <a href="#" data-bs-toggle="modal" data-bs-target="#supportModal" class="text-secondary text-decoration-none">
                <i class="fas fa-headset me-1"></i> ${uiStrings.landing.footerSupportLink}
              </a>
            </div>
          </div>
        </footer>

        <script>
          function setAuthMode(mode) {
            const loginBtn = document.getElementById('tab-login-btn');
            const signupBtn = document.getElementById('tab-signup-btn');
            const loginPane = document.getElementById('login-form-pane');
            const registerPane = document.getElementById('register-form-pane');

            if (mode === 'register' || mode === 'signup') {
              if (loginBtn) { loginBtn.classList.remove('active'); loginBtn.classList.add('text-secondary'); }
              if (signupBtn) { signupBtn.classList.add('active'); signupBtn.classList.remove('text-secondary'); }
              if (loginPane) loginPane.classList.add('d-none');
              if (registerPane) registerPane.classList.remove('d-none');
            } else {
              if (signupBtn) { signupBtn.classList.remove('active'); signupBtn.classList.add('text-secondary'); }
              if (loginBtn) { loginBtn.classList.add('active'); loginBtn.classList.remove('text-secondary'); }
              if (registerPane) registerPane.classList.add('d-none');
              if (loginPane) loginPane.classList.remove('d-none');
            }
          }
          document.addEventListener('DOMContentLoaded', () => {
            setAuthMode('${initialTab}');
          });
        </script>

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

function LocalLoginForm({
  csrfToken,
  initialIdentifier,
}: {
  csrfToken: string;
  initialIdentifier?: string;
}) {
  return html`
    <form method="POST" dir="rtl">
      <input type="hidden" name="__csrf_token" value="${csrfToken}" />
      <div class="mb-3">
        <label class="form-label fw-bold d-block" for="login_identifier">
          <bdi>${uiStrings.auth.identifierLabel}</bdi>
        </label>
        <input
          type="text"
          class="form-control"
          id="login_identifier"
          name="identifier"
          value="${initialIdentifier ?? ''}"
          placeholder="${uiStrings.auth.identifierPlaceholder}"
          required
          autocomplete="username"
        />
      </div>
      <div class="mb-3">
        <label class="form-label fw-bold d-block" for="login_password">
          <bdi>${uiStrings.auth.passwordLabel}</bdi>
        </label>
        <input
          type="password"
          class="form-control"
          id="login_password"
          name="password"
          placeholder="${uiStrings.auth.passwordPlaceholder}"
          required
          autocomplete="current-password"
        />
      </div>
      <button
        type="submit"
        class="btn btn-primary d-block w-100 py-2 shadow-sm mb-2"
        name="__action"
        value="local_login"
      >
        <span class="fw-bold"><i class="fas fa-sign-in-alt me-1"></i> ${uiStrings.auth.loginBtn}</span>
      </button>
      <div class="text-center mt-2">
        <small class="text-muted">${uiStrings.auth.forgotPasswordHint}</small>
      </div>
    </form>
  `;
}

function LocalRegisterForm({
  csrfToken,
  initialIdentifier,
}: {
  csrfToken: string;
  initialIdentifier?: string;
}) {
  return html`
    <form method="POST" dir="rtl">
      <input type="hidden" name="__csrf_token" value="${csrfToken}" />
      <div class="mb-3">
        <label class="form-label fw-bold d-block" for="reg_name">${uiStrings.auth.nameLabel}</label>
        <input
          type="text"
          class="form-control"
          id="reg_name"
          name="name"
          placeholder="${uiStrings.auth.namePlaceholder}"
          required
          autocomplete="name"
        />
      </div>
      <div class="mb-3">
        <label class="form-label fw-bold d-block" for="reg_email">
          <bdi>${uiStrings.auth.emailLabel}</bdi>
        </label>
        <input
          type="email"
          class="form-control"
          id="reg_email"
          name="email"
          value="${initialIdentifier ?? ''}"
          placeholder="${uiStrings.auth.emailPlaceholder}"
          required
          autocomplete="email"
        />
      </div>
      <div class="row g-2 mb-3">
        <div class="col-12 col-sm-6">
          <label class="form-label fw-bold d-block" for="reg_password">
            <bdi>${uiStrings.auth.passwordLabel}</bdi>
          </label>
          <input
            type="password"
            class="form-control"
            id="reg_password"
            name="password"
            placeholder="${uiStrings.auth.passwordPlaceholder}"
            minlength="6"
            required
            autocomplete="new-password"
          />
        </div>
        <div class="col-12 col-sm-6">
          <label class="form-label fw-bold d-block" for="reg_confirm_password">
            <bdi>${uiStrings.auth.confirmPasswordLabel}</bdi>
          </label>
          <input
            type="password"
            class="form-control"
            id="reg_confirm_password"
            name="confirm_password"
            placeholder="${uiStrings.auth.confirmPasswordPlaceholder}"
            minlength="6"
            required
            autocomplete="new-password"
          />
        </div>
      </div>
      <div class="mb-3">
        <label class="form-label d-block" for="reg_uin">${uiStrings.auth.uinLabel}</label>
        <input
          type="text"
          class="form-control"
          id="reg_uin"
          name="uin"
          placeholder="${uiStrings.auth.uinPlaceholder}"
          aria-describedby="reg_uin_help"
        />
        <small id="reg_uin_help" class="form-text text-muted d-block">
          ${uiStrings.auth.uinHelp}
        </small>
      </div>
      <button
        type="submit"
        class="btn btn-success d-block w-100 py-2 shadow-sm mb-2"
        name="__action"
        value="local_register"
      >
        <span class="fw-bold"><i class="fas fa-user-plus me-1"></i> ${uiStrings.auth.registerBtn}</span>
      </button>
      <div class="text-center mt-2">
        <small class="text-muted">${uiStrings.auth.registerNotice}</small>
      </div>
    </form>
  `;
}

export function AuthLogin({
  institutionAuthnProviders,
  service,
  resLocals,
  errorMessage,
  initialTab = 'login',
  initialIdentifier,
}: {
  institutionAuthnProviders: InstitutionAuthnProvider[] | null;
  service: string | null;
  resLocals: UntypedResLocals;
  errorMessage?: string;
  initialTab?: 'login' | 'register';
  initialIdentifier?: string;
}) {
  const hasExternalProviders =
    (config.hasShib && !config.hideShibLogin) ||
    config.hasOauth ||
    (config.hasAzure && isEnterprise()) ||
    Boolean(institutionAuthnProviders?.length);

  return LoginPageContainer({
    service,
    resLocals,
    errorMessage,
    initialTab,
    children: html`
      <!-- Tab 1: Login Form -->
      <div id="login-form-pane" class="${initialTab === 'register' ? 'd-none' : ''}">
        ${LocalLoginForm({
          csrfToken: resLocals.__csrf_token,
          initialIdentifier,
        })}
      </div>

      <!-- Tab 2: Fast Registration Form -->
      <div id="register-form-pane" class="${initialTab === 'register' ? '' : 'd-none'}">
        ${LocalRegisterForm({
          csrfToken: resLocals.__csrf_token,
          initialIdentifier,
        })}
      </div>

      <!-- Dev Mode Quick Bypass (Available in dev mode) -->
      ${
        config.devMode
          ? html`
              <div class="mt-4 pt-3 border-top">
                <div class="d-flex align-items-center gap-2 mb-2 text-muted small">
                  <i class="fas fa-bolt text-warning"></i>
                  <span class="fw-bold">${uiStrings.auth.devLoginTitle}</span>
                </div>
                ${DevModeBypass()}
              </div>
            `
          : ''
      }

      <!-- Official SSO and University Providers -->
      ${
        hasExternalProviders
          ? html`
              <div class="institution-header text-muted my-3">${uiStrings.auth.ssoDivider}</div>
              <div class="d-flex flex-column gap-2">
                ${config.hasShib && !config.hideShibLogin ? ShibLoginButton() : ''}
                ${config.hasOauth ? GoogleLoginButton() : ''}
                ${config.hasAzure && isEnterprise() ? MicrosoftLoginButton() : ''}
              </div>
            `
          : ''
      }
      ${
        institutionAuthnProviders?.length
          ? html`
              <div class="institution-header text-muted my-3">${uiStrings.auth.institutionHeader}</div>
              <input
                type="search"
                id="js-institution-search"
                class="form-control mb-2"
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
                ${uiStrings.landing.noInstitutionsFound}
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

