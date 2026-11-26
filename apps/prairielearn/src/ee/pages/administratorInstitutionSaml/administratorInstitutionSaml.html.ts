import { html } from '@prairielearn/html';

import { Modal } from '../../../components/Modal.js';
import { PageLayout } from '../../../components/PageLayout.js';
import {
  type AuthnProvider,
  type Institution,
  type Lti13Instance,
  type SamlProvider,
} from '../../../lib/db-types.js';
import type { ResLocalsForPage } from '../../../lib/res-locals.js';

export function AdministratorInstitutionSaml({
  institution,
  samlProvider,
  institutionAuthenticationProviders,
  lti13InstancesWithRosterSyncAllowed,
  host,
  resLocals,
}: {
  institution: Institution;
  samlProvider: SamlProvider | null;
  institutionAuthenticationProviders: AuthnProvider[];
  lti13InstancesWithRosterSyncAllowed: Lti13Instance[];
  host: string;
  resLocals: ResLocalsForPage<'plain'>;
}) {
  const hasSamlProvider = !!samlProvider;
  const hasEnabledSaml = institutionAuthenticationProviders.some((p) => p.name === 'SAML');
  const hasRosterSyncAllowed = lti13InstancesWithRosterSyncAllowed.length > 0;

  const hasNameMapping =
    !!samlProvider?.name_attribute ||
    (!!samlProvider?.given_name_attribute && !!samlProvider.family_name_attribute);
  const hasPartialSplitNameMapping =
    !!samlProvider?.given_name_attribute !== !!samlProvider?.family_name_attribute;
  const missingAttributeMappings =
    !samlProvider?.uid_attribute || !samlProvider.uin_attribute || !hasNameMapping;

  const issuer = `https://${host}/saml/institution/${institution.id}`;
  const metadataUrl = `https://${host}/pl/auth/institution/${institution.id}/saml/metadata`;
  const assertionConsumerServiceUrl = `https://${host}/pl/auth/institution/${institution.id}/saml/callback`;
  const testSamlUrl = `https://${host}/pl/auth/institution/${institution.id}/saml/login?RelayState=test`;
  const testSamlStrictUrl = `https://${host}/pl/auth/institution/${institution.id}/saml/login?RelayState=test,strict`;

  return PageLayout({
    resLocals: {
      ...resLocals,
      institution,
    },
    pageTitle: 'ورود یکپارچه (SAML / SSO) - مدیریت موسسه',
    navContext: {
      type: 'administrator_institution',
      page: 'administrator_institution',
      subPage: 'saml',
    },
    preContent: DeleteSamlConfigurationModal({ csrfToken: resLocals.__csrf_token }),
    content: html`
      ${
        hasRosterSyncAllowed
          ? html`
              <div class="alert alert-info" id="saml-lti-roster-sync-dependencies">
                <h2 class="h6">وابستگی‌های همگام‌سازی فهرست دانشجویان</h2>
                <p>همگام‌سازی فهرست دانشجویان برای نمونه‌های LTI 1.3 زیر مجاز شده است:</p>
                <ul>
                  ${lti13InstancesWithRosterSyncAllowed.map(
                    (instance) => html`
                      <li>
                        <a href="${resLocals.urlPrefix}/lti13/${instance.id}">
                          ${instance.name} (#${instance.id})
                        </a>
                        — <code>${instance.uin_attribute}</code>
                      </li>
                    `,
                  )}
                </ul>
                <p class="mb-0">
                  صادرکننده SAML و صفت UIN قفل شده‌اند. پیش از تغییر آن‌ها یا حذف این پیکربندی، همگام‌سازی فهرست را برای تمام نمونه‌های فهرست‌شده غیرمجاز کنید.
                </p>
              </div>
            `
          : ''
      }
      ${
        hasSamlProvider && !hasEnabledSaml
          ? html`
              <div class="alert alert-warning">
                <h2 class="h5">ورود یکپارچه SAML فعال نیست</h2>
                <p class="mb-0">
                  پس از <a href="${testSamlUrl}">آزمایش پیکربندی SAML</a>، باید به صفحه
                  <a href="${resLocals.urlPrefix}/sso">پیکربندی ورود یکپارچه (SSO)</a> بروید و احراز هویت SAML را فعال کنید.
                </p>
              </div>
            `
          : ''
      }
      ${
        hasSamlProvider && missingAttributeMappings
          ? html`
              <div class="alert alert-warning">
                <h2 class="h5">نگاشت صفات ناقص است</h2>
                <p class="mb-0">
                  یک یا چند نگاشت صفت تنظیم نشده‌اند. این موارد برای عملکرد صحیح احراز هویت ضروری هستند.
                </p>
              </div>
            `
          : ''
      }
      ${
        hasSamlProvider && hasPartialSplitNameMapping
          ? html`
              <div class="alert alert-warning">
                <h2 class="h5">پیکربندی ناقص نام تفکیک‌شده</h2>
                <p class="mb-0">
                  فقط یکی از صفات نام کوچک یا نام خانوادگی پیکربندی شده است. برای اعمال نگاشت تفکیک‌شده نام، هر دو باید با هم تنظیم شوند.
                </p>
              </div>
            `
          : ''
      }
      ${
        hasSamlProvider && hasEnabledSaml && !missingAttributeMappings
          ? html`
              <div class="alert alert-success">
                <h2 class="h5">ورود یکپارچه SAML پیکربندی و فعال شده است!</h2>
                <p class="mb-0">
                  کاربران می‌توانند با استفاده از ارائه‌دهنده SAML پیکربندی‌شده وارد موسسه شما شوند.
                </p>
              </div>
            `
          : ''
      }
      ${
        hasSamlProvider
          ? html`
              <div class="card mb-4">
                <div class="card-header bg-primary text-white d-flex align-items-center">
                  اطلاعات مورد نیاز ارائه‌دهنده هویت (Identity Provider) شما
                </div>
                <div class="card-body">
                  <p>
                    اگر ارائه‌دهنده هویت شما از دریافت پیکربندی ارائه‌دهنده سرویس (SP) از طریق نشانی متادیتا پشتیبانی می‌کند، از نشانی زیر استفاده کنید:
                  </p>
                  <small class="text-muted">نشانی متادیتا (Metadata URL)</small>
                  <div class="form-control mb-3">${metadataUrl}</div>
                  <p>در غیر این صورت، از مقادیر زیر برای پیکربندی ارائه‌دهنده هویت خود استفاده کنید:</p>
                  <small class="text-muted">صادرکننده / شناسه موجودیت (Issuer / Entity ID)</small>
                  <div class="form-control mb-3">${issuer}</div>
                  <small class="text-muted">نشانی سرویس مصرف‌کننده ادعا (ACS URL)</small>
                  <div class="form-control mb-3">${assertionConsumerServiceUrl}</div>
                  <small class="text-muted">کلید عمومی (Public Key)</small>
                  <pre
                    class="form-control mb-0"
                    style="height: auto;"
                  ><code>${samlProvider.public_key}</code></pre>
                </div>
              </div>
            `
          : ''
      }

      <h2 class="h4">پیکربندی ارائه‌دهنده هویت (IdP)</h2>
      <form method="POST" class="mb-3 js-configure-form" ${!hasSamlProvider ? 'hidden' : ''}>
        <div class="mb-3">
          <label class="form-label" for="issuer">صادرکننده / شناسه موجودیت (Issuer / Entity ID)</label>
          <input
            type="text"
            class="form-control"
            name="issuer"
            id="issuer"
            value="${samlProvider?.issuer ?? ''}"
            aria-describedby="issuerHelp${
              hasRosterSyncAllowed ? ' saml-lti-roster-sync-dependencies' : ''
            }"
            ${hasRosterSyncAllowed ? 'disabled' : ''}
          />
          <small id="issuerHelp" class="form-text text-muted">
            معمولاً یک نشانی یکتا است که توسط ارائه‌دهنده هویت شما تولید می‌شود.
          </small>
        </div>

        <div class="mb-3">
          <label class="form-label" for="sso_login_url">نشانی ورود یکپارچه (SSO Login URL)</label>
          <input
            type="text"
            class="form-control"
            name="sso_login_url"
            id="sso_login_url"
            value="${samlProvider?.sso_login_url ?? ''}"
            aria-describedby="ssoLoginUrlHelp"
          />
          <small id="ssoLoginUrlHelp" class="form-text text-muted">
            نشانی نقطه پایانی SAML که توسط ارائه‌دهنده هویت شما تولید شده است. سامانه فقط از اتصال HTTP Redirect پشتیبانی می‌کند؛ HTTP POST پشتیبانی نمی‌شود.
          </small>
        </div>

        <div class="mb-3">
          <label class="form-label" for="certificate">گواهی عمومی (Public Certificate)</label>
          <textarea
            class="form-control"
            name="certificate"
            id="certificate"
            rows="20"
            aria-describedby="certificateHelp"
          >
${samlProvider?.certificate ?? '-----BEGIN CERTIFICATE-----\n-----END CERTIFICATE-----'}</textarea>
          <small id="certificateHelp" class="form-text text-muted">
            گواهی عمومی ارائه‌دهنده هویت. این گواهی برای تایید امضای پاسخ SAML استفاده می‌شود و <strong>باید</strong> یک گواهی معتبر X.509 در قالب PEM شامل سرآیند و پاورقی باشد.
          </small>
        </div>

        <div class="mb-3 form-check">
          <input
            type="checkbox"
            class="form-check-input"
            id="validate_audience"
            name="validate_audience"
            value="1"
            ${(samlProvider?.validate_audience ?? true) ? 'checked' : ''}
            aria-describedby="validateAudienceHelp"
          />
          <label class="form-check-label" for="validate_audience">اعتبارسنجی مخاطب (Validate audience)</label>
          <div id="validateAudienceHelp" class="small text-muted">
            مشخص می‌کند که مخاطب پاسخ SAML اعتبارسنجی شود یا خیر. این گزینه باید فعال باشد مگر اینکه ارائه‌دهنده هویت مقدار صحیحی برای مخاطب ارسال نکند.
          </div>
        </div>

        <div class="mb-3 form-check">
          <input
            type="checkbox"
            class="form-check-input"
            id="want_assertions_signed"
            name="want_assertions_signed"
            value="1"
            ${(samlProvider?.want_assertions_signed ?? true) ? 'checked' : ''}
            aria-describedby="wantAssertionsSignedHelp"
          />
          <label class="form-check-label" for="want_assertions_signed">
            الزام به امضای ادعاها (Signed assertions)
          </label>
          <div id="wantAssertionsSignedHelp" class="small text-muted">
            مشخص می‌کند که امضای ادعاها الزامی باشد یا خیر. این گزینه باید فعال باشد مگر اینکه ارائه‌دهنده هویت ادعاها را امضا نکند.
          </div>
        </div>

        <div class="mb-3 form-check">
          <input
            type="checkbox"
            class="form-check-input"
            id="want_authn_response_signed"
            name="want_authn_response_signed"
            value="1"
            ${(samlProvider?.want_authn_response_signed ?? true) ? 'checked' : ''}
            aria-describedby="wantAuthnResponseSignedHelp"
          />
          <label class="form-check-label" for="want_authn_response_signed">
            الزام به امضای پاسخ (Signed response)
          </label>
          <div id="wantAuthnResponseSignedHelp" class="small text-muted">
            مشخص می‌کند که امضای پاسخ الزامی باشد یا خیر. این گزینه باید فعال باشد مگر اینکه ارائه‌دهنده هویت پاسخ‌ها را امضا نکند.
          </div>
        </div>

        <h3 class="h5">نگاشت صفات</h3>
        <p>
          باید نگاشتی از صفات ارائه‌دهنده هویت خود به صفات کاربر در سامانه مشخص کنید. این مقادیر بسته به ارائه‌دهنده متفاوت است، اما معمولاً به شکل
          <code>urn:oid:...</code> هستند.
        </p>

        ${
          !hasSamlProvider
            ? html`<div class="alert alert-info">
                اگر مطمئن نیستید کدام صفات در دسترس هستند، فعلاً می‌توانید این فیلدها را خالی بگذارید و پس از راه‌اندازی ارائه‌دهنده هویت از پیوند «آزمایش ورود SAML» استفاده کنید.
              </div>`
            : ''
        }

        <div class="mb-3">
          <label class="form-label" for="name_attribute">صفت نام</label>
          <input
            type="text"
            class="form-control"
            name="name_attribute"
            id="name_attribute"
            value="${samlProvider?.name_attribute ?? ''}"
            aria-describedby="nameAttributeHelp"
          />
          <small id="nameAttributeHelp" class="form-text text-muted">
            این صفت باید شامل نام کامل کاربر باشد، مانند «سارا محمدی». اگر ارائه‌دهنده هویت شما نام کامل را ارائه نمی‌دهد، می‌توانید صفات نام کوچک و نام خانوادگی را در پایین به صورت جداگانه پیکربندی کنید. در صورتی که هر دو مقدار در پاسخ SAML موجود باشند، اولویت با آن‌هاست و در صورت نبود یکی، سامانه به این صفت نام برمی‌گردد.
          </small>
        </div>

        <div class="mb-3">
          <label class="form-label" for="given_name_attribute">صفت نام کوچک</label>
          <input
            type="text"
            class="form-control"
            name="given_name_attribute"
            id="given_name_attribute"
            value="${samlProvider?.given_name_attribute ?? ''}"
            aria-describedby="givenNameAttributeHelp"
          />
          <small id="givenNameAttributeHelp" class="form-text text-muted">
            اختیاری. نام کوچک کاربر. معمولاً با نام <code>givenName</code> یا
            <code>urn:oid:2.5.4.42</code> شناخته می‌شود. وقتی هر دو صفت نام کوچک و نام خانوادگی پیکربندی و ارسال شوند، با هم ترکیب شده و به جای صفت نام بالا استفاده می‌شوند. در صورت نبود یکی، سامانه به صفت نام برمی‌گردد.
          </small>
        </div>

        <div class="mb-3">
          <label class="form-label" for="family_name_attribute">صفت نام خانوادگی</label>
          <input
            type="text"
            class="form-control"
            name="family_name_attribute"
            id="family_name_attribute"
            value="${samlProvider?.family_name_attribute ?? ''}"
            aria-describedby="familyNameAttributeHelp"
          />
          <small id="familyNameAttributeHelp" class="form-text text-muted">
            اختیاری. نام خانوادگی کاربر. معمولاً با نام <code>sn</code> یا
            <code>urn:oid:2.5.4.4</code> شناخته می‌شود.
          </small>
        </div>

        <div class="mb-3 form-check">
          <input
            type="checkbox"
            class="form-check-input"
            id="allow_missing_name"
            name="allow_missing_name"
            value="1"
            ${samlProvider?.allow_missing_name ? 'checked' : ''}
            aria-describedby="allowMissingNameHelp"
          />
          <label class="form-check-label" for="allow_missing_name">
            اجازه ورود بدون نام
          </label>
          <div id="allowMissingNameHelp" class="small text-muted">
            به کاربران اجازه می‌دهد حتی زمانی که صفات نام پیکربندی‌شده در پاسخ SAML وجود ندارند وارد شوند. نام‌های قبلی حفظ می‌شوند و کاربران بدون نام ذخیره‌شده تا زمان دریافت نام با UID نمایش داده می‌شوند.
          </div>
        </div>

        <div class="mb-3">
          <label class="form-label" for="uid_attribute">صفت UID</label>
          <input
            type="text"
            class="form-control"
            name="uid_attribute"
            id="uid_attribute"
            value="${samlProvider?.uid_attribute ?? ''}"
            aria-describedby="uidAttributeHelp"
          />
          <small id="uidAttributeHelp" class="form-text text-muted">
            شناسه UID یک شناسه قابل مشاهده برای کاربر است و باید شبیه ایمیل باشد، مانند «user@example.com». با این حال نیازی نیست حتماً آدرس ایمیل واقعی باشد؛ سامانه هرگز ایمیلی به آن ارسال نمی‌کند. این صفت ممکن است تغییر کند، مثلاً اگر دانشجو نام خود را در دانشگاه تغییر دهد.
          </small>
        </div>

        <div class="mb-3">
          <label class="form-label" for="uin_attribute">صفت UIN</label>
          <input
            type="text"
            class="form-control"
            name="uin_attribute"
            id="uin_attribute"
            value="${samlProvider?.uin_attribute ?? ''}"
            aria-describedby="uinAttributeHelp${
              hasRosterSyncAllowed ? ' saml-lti-roster-sync-dependencies' : ''
            }"
            ${hasRosterSyncAllowed ? 'disabled' : ''}
          />
          <small id="uinAttributeHelp" class="form-text text-muted">
            شناسه UIN به عنوان یک شناسه داخلی و تغییرناپذیر برای کاربر استفاده می‌شود و برای یک فرد <strong>هرگز نباید</strong> تغییر کند، حتی اگر نام یا ایمیل او تغییر یابد.
          </small>
        </div>

        <div class="mb-3">
          <label class="form-label" for="email_attribute">صفت ایمیل</label>
          <input
            type="text"
            class="form-control"
            name="email_attribute"
            id="email_attribute"
            value="${samlProvider?.email_attribute ?? ''}"
            aria-describedby="emailAttributeHelp"
          />
          <small id="emailAttributeHelp" class="form-text text-muted">
            صفت ایمیل باید شامل آدرس ایمیل کاربر باشد، مانند «user@example.com». در برخی موسسات ممکن است با صفت UID یکسان باشد. باید مطمئن شوید مقادیر دریافتی در این صفت آدرس‌های ایمیل قابل ارسال هستند.
          </small>
        </div>

        <input type="hidden" name="__csrf_token" value="${resLocals.__csrf_token}" />
        <button type="submit" class="btn btn-primary" name="__action" value="save">ذخیره</button>
        <a class="btn btn-secondary" href="">انصراف</a>
      </form>
      <div class="js-configure-prompt" ${hasSamlProvider ? 'hidden' : ''}>
        <p>هنوز ارائه‌دهنده هویت SAML پیکربندی نشده است.</p>
        <button type="button" class="btn btn-primary js-configure-prompt-button">
          پیکربندی ارائه‌دهنده هویت SAML
        </button>
      </div>
      ${
        hasSamlProvider
          ? html`
              <p>
                <a href="${testSamlUrl}" target="_blank">آزمایش ورود SAML</a>: تمام صفات دریافتی از IdP را بدون ایجاد نشست نمایش می‌دهد.
              </p>

              <p>
                <a href="${testSamlStrictUrl}" target="_blank">آزمایش ورود SAML (حالت سخت‌گیرانه)</a>:
                گزینه‌های «اعتبارسنجی مخاطب»، «الزام به امضای ادعاها» و «الزام به امضای پاسخ» را به صورت اجباری فعال می‌کند.
              </p>

              <p>
                <a href="${metadataUrl}" target="_blank">مشاهده متادیتای SAML</a>: این متادیتا می‌تواند برای کمک به پیکربندی IdP در اختیار موسسات قرار گیرد.
              </p>

              <p>
                <button
                  class="btn btn-danger"
                  type="button"
                  data-bs-toggle="modal"
                  data-bs-target="#deleteModal"
                  ${hasRosterSyncAllowed ? 'disabled' : ''}
                >
                  حذف پیکربندی SAML
                </button>
                ${
                  hasRosterSyncAllowed
                    ? html`
                        <small class="d-block text-muted">
                          ابتدا همگام‌سازی فهرست را برای تمام نمونه‌های LTI 1.3 فهرست‌شده غیرمجاز کنید.
                        </small>
                      `
                    : ''
                }
              </p>

              <h2 class="h4">رمزگشایی ادعای SAML</h2>

              <form method="POST">
                <div class="mb-3">
                  <label class="form-label" for="encodedAssertion">ادعای کدگذاری‌شده (Encoded assertion)</label>
                  <textarea
                    class="form-control"
                    id="encodedAssertion"
                    rows="10"
                    name="encoded_assertion"
                    aria-describedby="encodedAssertionHelp"
                  ></textarea>
                  <small class="form-text text-muted">
                    این مقدار باید داده خام کدگذاری‌شده در base64 از پارامتر
                    <code>SAMLResponse</code> در درخواست POST ارسالی از IdP باشد.
                  </small>
                </div>

                <div class="mb-3 form-check">
                  <input
                    type="checkbox"
                    class="form-check-input"
                    id="strictMode"
                    name="strict_mode"
                    value="1"
                    aria-describedby="strictModeHelp"
                  />
                  <label class="form-check-label" for="strictMode">حالت سخت‌گیرانه (Strict mode)</label>
                  <small id="strictModeHelp" class="form-text text-muted mt-0">
                    گزینه‌های «اعتبارسنجی مخاطب»، «الزام به امضای ادعاها» و «الزام به امضای پاسخ» را به صورت اجباری فعال می‌کند.
                  </small>
                </div>

                <input type="hidden" name="__csrf_token" value="${resLocals.__csrf_token}" />
                <button
                  class="btn btn-primary"
                  type="button"
                  name="__action"
                  value="decode_assertion"
                  hx-post="${resLocals.urlPrefix}/saml"
                  hx-target="#decodedAssertion"
                  hx-swap="innerHTML show:top"
                >
                  رمزگشایی
                </button>
                <div id="decodedAssertion"></div>
              </form>
            `
          : ''
      }
    `,
    postContent: html`
      <script>
        (function () {
          // Show the configuration form when the button is clicked.
          document
            .querySelector('.js-configure-prompt-button')
            .addEventListener('click', function () {
              document.querySelector('.js-configure-prompt').hidden = true;
              document.querySelector('.js-configure-form').hidden = false;
            });
        })();
      </script>
    `,
  });
}

function DeleteSamlConfigurationModal({ csrfToken }: { csrfToken: string }) {
  return Modal({
    id: 'deleteModal',
    title: 'تایید حذف',
    body: html`
      <p>
        آیا از حذف پیکربندی SAML اطمینان دارید؟ کاربران موسسه شما، از جمله خودتان، ممکن است نتوانند وارد سامانه شوند.
      </p>
    `,
    footer: html`
      <input type="hidden" name="__csrf_token" value="${csrfToken}" />
      <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">بستن</button>
      <button class="btn btn-danger" type="submit" name="__action" value="delete">
        حذف پیکربندی SAML
      </button>
    `,
  });
}

export function DecodedAssertion({ xml, profile }: { xml: string; profile: string }) {
  return html`
    <h3 class="h5 mt-3">XML رمزگشایی‌شده</h3>
    <pre class="bg-dark text-white rounded p-3 mt-3 mb-0">${xml}</pre>

    <h3 class="h5 mt-3">پروفایل</h3>
    <pre class="bg-dark text-white rounded p-3 mt-3 mb-0">${profile}</pre>
  `.toString();
}
