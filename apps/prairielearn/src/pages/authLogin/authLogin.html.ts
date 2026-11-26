import clsx from 'clsx';

import { type HtmlValue, html, unsafeHtml } from '@prairielearn/html';
import { run } from '@prairielearn/run';

import { HeadContents } from '../../components/HeadContents.js';
import { SupportModal } from '../../components/SupportModal.js';
import { assetPath } from '../../lib/assets.js';
import { getEffectiveBrandName, platformBranding, uiStrings } from '../../lib/branding.js';
import { config } from '../../lib/config.js';
import type { AuthnProvider } from '../../lib/db-types.js';
import { isEnterprise } from '../../lib/license.js';
import type { UntypedResLocals } from '../../lib/res-locals.types.js';

const AUTH_CLIENT_SCRIPT = String.raw`(function () {
  var PERSIAN = '۰۱۲۳۴۵۶۷۸۹', ARABIC = '٠١٢٣٤٥٦٧٨٩';
  function normUin(v) {
    return v.replace(/[۰-۹]/g, function (d) { return PERSIAN.indexOf(d); })
      .replace(/[٠-٩]/g, function (d) { return ARABIC.indexOf(d); })
      .replace(/[\s\u200B-\u200F\u202A-\u202E\uFEFF]/g, '');
  }
  var FACULTIES = {
    '44': 'دانشکده ریاضی و علوم کامپیوتر',
    '52': 'دانشکده مهندسی کامپیوتر',
    '41': 'دانشکده مهندسی برق',
    '42': 'دانشکده مهندسی عمران / علوم پایه',
    '43': 'دانشکده مهندسی مکانیک'
  };
  function toFa(s) { return String(s).replace(/\d/g, function (d) { return PERSIAN[Number(d)]; }); }
  function isDummy(u) {
    if (u.indexOf('000') === 0 || /^(\d)\1+$/.test(u) || /^(\d{2})\1+$/.test(u)) return true;
    var d = {}, n = 0;
    for (var i = 1; i < u.length; i++) { var x = (Number(u[i]) - Number(u[i - 1]) + 10) % 10; if (!d[x]) { d[x] = 1; n++; } }
    return n === 1 && (d[1] || d[9]);
  }
  function uinState(u, isStaff) {
    if (!u) return { ok: false, msg: '' };
    if (!/^[0-9]+$/.test(u)) return { ok: false, msg: 'فقط ارقام مجاز است.' };
    if (isStaff) {
      if (u.length < 5 || u.length > 12) return { ok: false, msg: 'کد پرسنلی باید ۵ تا ۱۲ رقم باشد (اکنون ' + toFa(u.length) + ' رقم).' };
      if (isDummy(u)) return { ok: false, msg: 'کد پرسنلی وارد شده معتبر به نظر نمی‌رسد.' };
      return { ok: true, msg: '✓ کد پرسنلی / کادر آموزشی معتبر است' };
    }
    if (u.length < 8 || u.length > 10) return { ok: false, msg: 'شماره دانشجویی علم و صنعت ۹ رقم (ورودی ۱۴۰۰ به بعد) یا ۸ رقم (قبل از ۱۴۰۰) است — اکنون ' + toFa(u.length) + ' رقم.' };
    if (isDummy(u)) return { ok: false, msg: 'شماره دانشجویی وارد شده معتبر به نظر نمی‌رسد. لطفاً شماره واقعی گلستان خود را وارد کنید.' };
    if (u.length === 9) {
      var y3 = Number(u.slice(0, 3));
      if (y3 < 400 || y3 > 410) return { ok: false, msg: 'سه رقم اول شماره ۹ رقمی باید سال ورود معتبر (۴۰۰ تا ۴۱۰، مثلاً 404) باشد.' };
      var fac = u.slice(3, 5), ser = u.slice(6, 9);
      if (Number(fac) < 10 || ser === '000') return { ok: false, msg: 'ساختار کد دانشکده یا شماره سریال نامعتبر است.' };
      var fn = FACULTIES[fac];
      return { ok: true, msg: '✓ ساختار معتبر علم و صنعت — ورودی ' + toFa(1000 + y3) + (fn ? ' | ' + fn : ' (کد دانشکده ' + toFa(fac) + ')') };
    }
    if (u.length === 8) {
      var y2 = Number(u.slice(0, 2));
      if (y2 < 90 || y2 > 99) return { ok: false, msg: 'شماره ۸ رقمی مخصوص ورودی‌های ۹۰ تا ۹۹ است؛ برای ۱۴۰۰ به بعد ۹ رقم وارد کنید.' };
      var fac8 = u.slice(2, 4), ser8 = u.slice(5, 8);
      if (Number(fac8) < 10 || ser8 === '000') return { ok: false, msg: 'ساختار شماره دانشجویی نامعتبر است.' };
      var fn8 = FACULTIES[fac8];
      return { ok: true, msg: '✓ ساختار معتبر علم و صنعت — ورودی ' + toFa(1300 + y2) + (fn8 ? ' | ' + fn8 : '') };
    }
    var y3g = Number(u.slice(0, 3)), y2g = Number(u.slice(0, 2));
    if (!((y3g >= 400 && y3g <= 410) || (y2g >= 90 && y2g <= 99))) return { ok: false, msg: 'پیش‌شماره سال ورود معتبر نیست.' };
    return { ok: true, msg: '✓ ساختار معتبر علم و صنعت — ورودی ' + toFa(y3g >= 400 && y3g <= 410 ? 1000 + y3g : 1300 + y2g) };
  }

  // ---- Altcha-style proof of work ----
  function b64(obj) { return btoa(unescape(encodeURIComponent(JSON.stringify(obj)))); }
  async function sha256Hex(text) {
    var buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
    var a = new Uint8Array(buf), h = '';
    for (var i = 0; i < a.length; i++) h += (a[i] < 16 ? '0' : '') + a[i].toString(16);
    return h;
  }
  async function solveWidget(w) {
    var input = w.querySelector('input[name="altcha"]');
    var status = w.querySelector('[data-altcha-status]');
    var form = w.closest('form');
    var btns = form ? form.querySelectorAll('button[type="submit"]') : [];
    function setBtns(dis) { for (var i = 0; i < btns.length; i++) btns[i].disabled = dis; }
    w.classList.remove('altcha-done', 'altcha-error');
    input.value = '';
    setBtns(true);
    status.textContent = 'من ربات نیستم — بررسی امنیتی خودکار';
    try {
      if (!window.crypto || !crypto.subtle) throw new Error('nocrypto');
      var res = await fetch('/pl/login/altcha-challenge', { cache: 'no-store', credentials: 'same-origin' });
      if (!res.ok) throw new Error('fetch');
      var c = await res.json();
      var found = -1;
      for (var n = 0; n <= c.maxnumber; n++) {
        if ((await sha256Hex(c.salt + n)) === c.challenge) { found = n; break; }
        if (n % 2000 === 0) await new Promise(function (r) { setTimeout(r, 0); });
      }
      if (found < 0) throw new Error('nosolution');
      input.value = b64({ algorithm: c.algorithm, salt: c.salt, challenge: c.challenge, maxnumber: c.maxnumber, expires: c.expires, signature: c.signature, number: found });
      w.classList.add('altcha-done');
      status.textContent = 'تایید امنیتی انجام شد';
      setBtns(false);
      setTimeout(function () { solveWidget(w); }, Math.max(10000, c.expires - Date.now() - 20000));
    } catch (e) {
      w.classList.add('altcha-error');
      status.textContent = 'تایید امنیتی ناموفق بود. برای تلاش دوباره کلیک کنید.';
      setBtns(false);
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    var widgets = document.querySelectorAll('[data-altcha-widget]');
    (async function () { for (var i = 0; i < widgets.length; i++) await solveWidget(widgets[i]); })();
    widgets.forEach(function (w) { w.addEventListener('click', function () { if (w.classList.contains('altcha-error')) solveWidget(w); }); });

    // Show/hide password
    document.querySelectorAll('[data-toggle-password]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var inp = document.getElementById(btn.getAttribute('data-toggle-password'));
        if (!inp) return;
        var show = inp.type === 'password';
        inp.type = show ? 'text' : 'password';
        btn.setAttribute('aria-pressed', show ? 'true' : 'false');
        btn.setAttribute('aria-label', show ? 'پنهان کردن رمز عبور' : 'نمایش رمز عبور');
        var ic = btn.querySelector('i'); if (ic) ic.className = show ? 'fas fa-eye-slash' : 'fas fa-eye';
      });
    });

    // UIN live normalization + IUST decoder badge + staff toggle
    var uin = document.getElementById('reg_uin'), hint = document.getElementById('reg_uin_live'), staffCb = document.getElementById('reg_is_staff_uin');
    function updUin() {
      var v = normUin(uin.value);
      if (v !== uin.value) uin.value = v;
      var isStaff = !!(staffCb && staffCb.checked);
      var s = uinState(v, isStaff);
      hint.textContent = s.msg;
      hint.className = 'form-text d-block fw-medium ' + (v ? (s.ok ? 'text-success' : 'text-danger') : 'text-muted');
      uin.setCustomValidity(v && !s.ok ? s.msg : '');
    }
    if (uin && hint) {
      uin.addEventListener('input', updUin);
      if (staffCb) staffCb.addEventListener('change', updUin);
      updUin();
    }

    // Email normalization
    var em = document.getElementById('reg_email');
    if (em) em.addEventListener('blur', function () { em.value = em.value.trim().toLowerCase(); });
    var li = document.getElementById('login_identifier');
    if (li) li.addEventListener('blur', function () { li.value = li.value.trim(); });

    // Password strength + match
    var pw = document.getElementById('reg_password'), cf = document.getElementById('reg_confirm_password');
    var sh = document.getElementById('reg_password_strength'), mh = document.getElementById('reg_password_match');
    function updPw() {
      var v = pw.value, score = 0;
      if (v.length >= 6) score++;
      if (v.length >= 8) score++;
      if (/[a-z]/.test(v) && /[A-Z]/.test(v)) score++;
      if (/\d/.test(v)) score++;
      if (/[^A-Za-z0-9]/.test(v)) score++;
      var labels = ['خیلی ضعیف', 'ضعیف', 'متوسط', 'خوب', 'قوی', 'عالی'];
      var cls = ['text-danger', 'text-danger', 'text-warning', 'text-success', 'text-success', 'text-success'];
      if (!v) { sh.textContent = 'ترجیحاً حداقل ۸ کاراکتر، ترکیب حروف و عدد.'; sh.className = 'form-text d-block text-muted'; }
      else { sh.textContent = 'قدرت رمز عبور: ' + labels[score] + (v.length < 6 ? ' (حداقل ۶ کاراکتر)' : (v.length < 8 ? ' — ۸ کاراکتر یا بیشتر توصیه می‌شود' : '')); sh.className = 'form-text d-block ' + cls[score]; }
      if (!cf.value) { mh.textContent = ''; cf.setCustomValidity(''); }
      else if (cf.value === v) { mh.textContent = 'رمزها مطابقت دارند ✓'; mh.className = 'form-text d-block text-success'; cf.setCustomValidity(''); }
      else { mh.textContent = 'رمز عبور و تکرار آن یکسان نیست.'; mh.className = 'form-text d-block text-danger'; cf.setCustomValidity('رمز عبور و تکرار آن یکسان نیست.'); }
    }
    if (pw && cf && sh && mh) { pw.addEventListener('input', updPw); cf.addEventListener('input', updPw); updPw(); }
  });
})();
`;

const AUTH_STYLE = `
  .altcha-widget { display:flex; align-items:center; gap:.6rem; border:1px solid #ced4da; border-radius:.5rem; padding:.55rem .8rem; background:#f8f9fa; font-size:.9rem; cursor:default; }
  .altcha-widget .altcha-box { width:1.4rem; height:1.4rem; border:2px solid #adb5bd; border-radius:.3rem; display:inline-flex; align-items:center; justify-content:center; flex-shrink:0; background:#fff; }
  .altcha-widget .altcha-check { display:none; color:#fff; font-size:.8rem; }
  .altcha-widget:not(.altcha-done):not(.altcha-error) .altcha-box { border-top-color:#0d6efd; animation:altcha-spin .8s linear infinite; border-radius:50%; }
  .altcha-widget.altcha-done { border-color:#198754; background:#e9f7ef; color:#146c43; }
  .altcha-widget.altcha-done .altcha-box { background:#198754; border-color:#198754; }
  .altcha-widget.altcha-done .altcha-check { display:inline; }
  .altcha-widget.altcha-error { border-color:#dc3545; background:#fdecee; color:#b02a37; cursor:pointer; }
  @keyframes altcha-spin { to { transform:rotate(360deg); } }
  .password-toggle { border-color:#ced4da; }
`;

function AltchaWidget() {
  return html`
    <div class="mb-3">
      <div class="altcha-widget" data-altcha-widget dir="rtl" role="status" aria-live="polite">
        <span class="altcha-box"><i class="fas fa-check altcha-check"></i></span>
        <span data-altcha-status>من ربات نیستم — بررسی امنیتی خودکار</span>
        <input type="hidden" name="altcha" value="" />
      </div>
    </div>
  `;
}

function PasswordInput({
  id,
  name,
  placeholder,
  autocomplete,
  minlength,
}: {
  id: string;
  name: string;
  placeholder: string;
  autocomplete: string;
  minlength?: number;
}) {
  return html`
    <div class="input-group" dir="ltr">
      <input
        type="password"
        class="form-control"
        dir="ltr"
        id="${id}"
        name="${name}"
        placeholder="${placeholder}"
        ${minlength ? html`minlength="${minlength}"` : ''}
        required
        autocomplete="${autocomplete}"
      />
      <button
        type="button"
        class="btn btn-outline-secondary password-toggle"
        data-toggle-password="${id}"
        aria-label="نمایش رمز عبور"
        aria-pressed="false"
        tabindex="0"
      >
        <i class="fas fa-eye"></i>
      </button>
    </div>
  `;
}

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
          ${unsafeHtml(AUTH_STYLE)}
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
        <header class="bg-white border-bottom py-2 py-sm-3 shadow-xs">
          <div class="container d-flex justify-content-between align-items-center gap-2" style="max-width: 1140px;">
            <a href="/" class="text-decoration-none d-flex align-items-center gap-2 gap-sm-3 min-w-0" style="min-width: 0;">
              ${
                platformBranding.logoUrl
                  ? html`<img
                      src="${platformBranding.logoUrl}"
                      alt="${getEffectiveBrandName(resLocals?.institution)}"
                      class="flex-shrink-0"
                      style="height: 40px; width: auto;"
                    />`
                  : html`
                      <div
                        class="bg-primary text-white rounded-3 d-flex align-items-center justify-content-center shadow-sm flex-shrink-0"
                        style="width: 38px; height: 38px;"
                      >
                        <i class="fas fa-graduation-cap fs-5"></i>
                      </div>
                    `
              }
              <div class="min-w-0" style="min-width: 0;">
                <span class="fw-bold text-dark fs-6 d-block d-md-none text-truncate">${platformBranding.brandShortName}</span>
                <span class="fw-bold text-dark fs-5 d-none d-md-block text-truncate">${getEffectiveBrandName(resLocals?.institution)}</span>
                <span class="text-secondary small d-none d-lg-block text-truncate">${platformBranding.brandSubtitle}</span>
              </div>
            </a>
            <div class="d-flex align-items-center gap-1 gap-sm-2 flex-shrink-0">
              <button
                type="button"
                class="btn btn-outline-primary btn-sm fw-medium text-nowrap"
                data-bs-toggle="modal"
                data-bs-target="#courseRequestWarningModal"
              >
                <i class="fas fa-plus-circle me-1"></i>
                <span class="d-none d-sm-inline">${uiStrings.landing.requestCourseBtn}</span>
                <span class="d-inline d-sm-none">درخواست درس</span>
              </button>
              <button
                type="button"
                class="btn btn-light btn-sm fw-medium border text-secondary text-nowrap"
                data-bs-toggle="modal"
                data-bs-target="#supportModal"
                aria-label="${uiStrings.landing.supportBtn}"
              >
                <i class="fas fa-question-circle text-primary"></i>
                <span class="d-none d-sm-inline ms-1">${uiStrings.landing.supportBtn}</span>
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
                      <button
                        type="button"
                        class="btn btn-success btn-sm fw-medium shadow-xs"
                        data-bs-toggle="modal"
                        data-bs-target="#courseRequestWarningModal"
                      >
                        <i class="fas fa-plus-circle me-1"></i> ${uiStrings.landing.requestCourseBtn}
                      </button>
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
                            <div class="alert alert-warning py-3 px-3 mb-3 border-0 bg-warning-subtle text-warning-emphasis d-flex align-items-start gap-2 shadow-xs rounded-3 text-end" role="alert">
                              <i class="fas fa-exclamation-triangle fs-4 text-warning flex-shrink-0 mt-1"></i>
                              <div>
                                <h3 class="h6 fw-bold mb-1 text-dark">${uiStrings.auth.courseRequestWarningHeader}</h3>
                                <p class="small mb-0 text-secondary">
                                  ${uiStrings.auth.courseRequestInstructorNotice}
                                </p>
                              </div>
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
                        ${isCourseRequestService ? 'جهت ثبت درخواست ایجاد درس یا دوره جدید' : service ? `دسترسی به بخش ${service}` : uiStrings.landing.loginCardSubtitle}
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
                      <button
                        type="button"
                        class="btn btn-link p-0 text-decoration-none small text-primary fw-medium border-0 align-baseline"
                        data-bs-toggle="modal"
                        data-bs-target="#courseRequestWarningModal"
                      >
                        ${uiStrings.landing.requestCourseBtn}
                      </button>
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
            <span class="text-secondary small">
              توسعه و نگه‌داری:
              <a href="${platformBranding.developer.telegramUrl}" target="_blank" rel="noreferrer" class="text-secondary text-decoration-none fw-medium">
                ${platformBranding.developer.name}
              </a>
              (${platformBranding.developer.affiliation})
            </span>
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
            if (window.location.search.includes('service=request_course')) {
              setTimeout(() => {
                const modalEl = document.getElementById('courseRequestWarningModal');
                if (modalEl && window.bootstrap) {
                  new window.bootstrap.Modal(modalEl).show();
                }
              }, 250);
            }
          });
        </script>

        <script>
          ${unsafeHtml(AUTH_CLIENT_SCRIPT)}
        </script>

        ${CourseRequestWarningModal()}
        ${SupportModal()}
      </body>
    </html>
  `;
}

function CourseRequestWarningModal() {
  return html`
    <div
      class="modal fade"
      id="courseRequestWarningModal"
      tabindex="-1"
      aria-labelledby="courseRequestWarningModalLabel"
      aria-hidden="true"
      dir="rtl"
      style="font-family: var(--font-persian);"
    >
      <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
          <div class="modal-header bg-warning-subtle text-warning-emphasis border-bottom border-warning-subtle py-3 px-4">
            <h5 class="modal-title fw-bold fs-6 d-flex align-items-center gap-2 m-0" id="courseRequestWarningModalLabel">
              <i class="fas fa-exclamation-triangle fs-5 text-warning"></i>
              <span>ورود یا ثبت‌نام الزامی است</span>
            </h5>
            <button
              type="button"
              class="btn-close ms-0 me-auto"
              data-bs-dismiss="modal"
              aria-label="بستن"
            ></button>
          </div>
          <div class="modal-body p-4 text-secondary lh-lg">
            <div class="d-flex align-items-center gap-3 mb-3">
              <div class="bg-primary-subtle text-primary p-3 rounded-circle d-flex align-items-center justify-content-center" style="width: 50px; height: 50px;">
                <i class="fas fa-chalkboard-teacher fs-4"></i>
              </div>
              <div>
                <h6 class="fw-bold text-dark mb-1">درخواست ایجاد درس یا دوره آموزشی</h6>
                <small class="text-muted">مخصوص اساتید، مدرسان و طراحان دوره</small>
              </div>
            </div>
            <p class="mb-2 text-dark fw-medium">
              استاد یا متقاضی گرامی؛
            </p>
            <p class="small text-secondary mb-0">
              برای ثبت درخواست دوره جدید و اتصال به مخزن اختصاصی، ابتدا لازم است در سامانه <strong>ثبت‌نام</strong> فرمایید یا در صورت داشتن حساب، <strong>وارد شوید</strong>. پس از ورود موفق، فرم ایجاد درس بلافاصله در اختیار شما قرار خواهد گرفت.
            </p>
          </div>
          <div class="modal-footer bg-light border-0 py-3 px-4 d-flex justify-content-end gap-2">
            <button
              type="button"
              class="btn btn-primary btn-sm px-3 fw-medium"
              data-bs-dismiss="modal"
              onclick="setAuthMode('login'); document.getElementById('login-form-pane')?.scrollIntoView({ behavior: 'smooth' });"
            >
              <i class="fas fa-sign-in-alt me-1"></i> ورود به حساب
            </button>
            <button
              type="button"
              class="btn btn-outline-success btn-sm px-3 fw-medium"
              data-bs-dismiss="modal"
              onclick="setAuthMode('register'); document.getElementById('register-form-pane')?.scrollIntoView({ behavior: 'smooth' });"
            >
              <i class="fas fa-user-plus me-1"></i> ایجاد حساب کاربری (ثبت‌نام)
            </button>
          </div>
        </div>
      </div>
    </div>
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
          dir="ltr"
          maxlength="254"
          autocapitalize="none"
          spellcheck="false"
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
        ${PasswordInput({
          id: 'login_password',
          name: 'password',
          placeholder: uiStrings.auth.passwordPlaceholder,
          autocomplete: 'current-password',
        })}
      </div>
      ${AltchaWidget()}
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
  initialName,
  initialUin,
  initialIsStaffUin,
}: {
  csrfToken: string;
  initialIdentifier?: string;
  initialName?: string;
  initialUin?: string;
  initialIsStaffUin?: boolean;
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
          value="${initialName ?? ''}"
          maxlength="200"
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
          dir="ltr"
          maxlength="254"
          autocapitalize="none"
          spellcheck="false"
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
          ${PasswordInput({
            id: 'reg_password',
            name: 'password',
            placeholder: uiStrings.auth.passwordPlaceholder,
            autocomplete: 'new-password',
            minlength: 6,
          })}
        </div>
        <div class="col-12 col-sm-6">
          <label class="form-label fw-bold d-block" for="reg_confirm_password">
            <bdi>${uiStrings.auth.confirmPasswordLabel}</bdi>
          </label>
          ${PasswordInput({
            id: 'reg_confirm_password',
            name: 'confirm_password',
            placeholder: uiStrings.auth.confirmPasswordPlaceholder,
            autocomplete: 'new-password',
            minlength: 6,
          })}
        </div>
      </div>
      <div class="mb-3 mt-n2">
        <small id="reg_password_strength" class="form-text d-block text-muted" aria-live="polite"></small>
        <small id="reg_password_match" class="form-text d-block" aria-live="polite"></small>
      </div>
      <div class="mb-3">
        <label class="form-label fw-bold d-block" for="reg_uin">${uiStrings.auth.uinLabel}</label>
        <input
          type="text"
          class="form-control"
          id="reg_uin"
          name="uin"
          dir="ltr"
          value="${initialUin ?? ''}"
          inputmode="numeric"
          autocomplete="off"
          maxlength="16"
          placeholder="${uiStrings.auth.uinPlaceholder}"
          required
          aria-describedby="reg_uin_help"
        />
        <small id="reg_uin_help" class="form-text text-muted d-block">
          شماره دانشجویی ۹ رقمی گلستان دانشگاه علم و صنعت (مثلاً <code>405441001</code>) — ارقام فارسی خودکار تبدیل می‌شوند.
        </small>
        <small id="reg_uin_live" class="form-text d-block text-muted" aria-live="polite"></small>
        <div class="form-check mt-2">
          <input
            class="form-check-input"
            type="checkbox"
            id="reg_is_staff_uin"
            name="is_staff_uin"
            value="on"
            ${initialIsStaffUin ? 'checked' : ''}
          />
          <label class="form-check-label small text-secondary" for="reg_is_staff_uin">
            استاد، دستیار آموزشی یا کادر دانشگاه (کد پرسنلی) هستم
          </label>
        </div>
      </div>
      ${AltchaWidget()}
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
  initialName,
  initialUin,
  initialIsStaffUin,
}: {
  institutionAuthnProviders: InstitutionAuthnProvider[] | null;
  service: string | null;
  resLocals: UntypedResLocals;
  errorMessage?: string;
  initialTab?: 'login' | 'register';
  initialIdentifier?: string;
  initialName?: string;
  initialUin?: string;
  initialIsStaffUin?: boolean;
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
          initialName,
          initialUin,
          initialIsStaffUin,
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
              روش احراز هویت انتخاب‌شده توسط دانشگاه یا موسسه شما پشتیبانی نمی‌شود.
              ${run(() => {
                if (loginOptions.length > 0) {
                  return 'لطفاً با یکی از روش‌های پشتیبانی‌شده مجدداً تلاش کنید.';
                }

                if (supportsAnyLti) {
                  return 'لطفاً ورود خود را از طریق سامانه مدیریت یادگیری (LMS) دانشگاه آغاز نمایید.';
                }

                // This institution somehow has no login options.
                return 'برای اطلاعات بیشتر با پشتیبانی دانشگاه تماس بگیرید.';
              })}
            </div>
          `;
        }

        if (!supportsNonLti && supportsAnyLti) {
          return html`
            <div class="alert alert-danger text-center mb-0" role="alert">
              لطفاً ورود خود را از طریق سامانه مدیریت یادگیری (LMS) دانشگاه آغاز نمایید.
            </div>
          `;
        }

        if (loginOptions.length === 0) {
          return html`
            <div class="alert alert-danger text-center mb-0" role="alert">
              هیچ روش احراز هویتی برای این موسسه پیکربندی نشده است. لطفاً با پشتیبانی تماس بگیرید.
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

