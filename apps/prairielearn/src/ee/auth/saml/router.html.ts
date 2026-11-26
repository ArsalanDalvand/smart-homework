import { html } from '@prairielearn/html';

import { HeadContents } from '../../../components/HeadContents.js';
import type { UntypedResLocals } from '../../../lib/res-locals.types.js';

export const SamlTest = ({
  uid,
  uin,
  name,
  givenName,
  familyName,
  email,
  uidAttribute,
  uinAttribute,
  nameAttribute,
  givenNameAttribute,
  familyNameAttribute,
  emailAttribute,
  attributes,
  resLocals,
}: {
  /** Resolved UID value from the SAML response. */
  uid: string | null;
  /** Resolved UIN value from the SAML response. */
  uin: string | null;
  /** The assembled display name (from either `name_attribute` or `given_name + family_name`). */
  name: string | null;
  /** The raw given name value, if a split name mapping is configured. */
  givenName: string | null;
  /** The raw family name value, if a split name mapping is configured. */
  familyName: string | null;
  email: string | null;
  /** Configured UID attribute mapping name from the SAML provider. */
  uidAttribute: string | null;
  /** Configured UIN attribute mapping name from the SAML provider. */
  uinAttribute: string | null;
  nameAttribute: string | null;
  /** Configured together with `familyNameAttribute` as an alternative to `nameAttribute`. */
  givenNameAttribute: string | null;
  /** Configured together with `givenNameAttribute` as an alternative to `nameAttribute`. */
  familyNameAttribute: string | null;
  emailAttribute: string | null;
  attributes: Record<string, any>;
  resLocals: UntypedResLocals;
}) => {
  const hasUidAttribute = !!uidAttribute;
  const hasUinAttribute = !!uinAttribute;
  const hasNameAttribute = !!nameAttribute;
  const hasGivenNameAttribute = !!givenNameAttribute;
  const hasFamilyNameAttribute = !!familyNameAttribute;
  const hasSplitNameMapping = hasGivenNameAttribute && hasFamilyNameAttribute;
  const hasNameMapping = hasNameAttribute || hasSplitNameMapping;
  const hasEmailAttribute = !!emailAttribute;

  const hasUid = !!uid;
  const hasUin = !!uin;
  const hasName = !!name;
  const hasGivenName = !!givenName;
  const hasFamilyName = !!familyName;
  const hasSplitNameValues = hasGivenName && hasFamilyName;
  const hasEmail = !!email;
  const usedNameFallback =
    hasSplitNameMapping && !hasSplitNameValues && hasNameAttribute && hasName;

  // Note that even though the normal login flow doesn't yet validate the
  // presence of an email, we want to make it obvious during all future SAML
  // configuration processes that `emailAttribute` should be set and that the
  // corresponding value should be present.
  const hasError =
    !hasUidAttribute ||
    !hasUinAttribute ||
    !hasNameMapping ||
    !hasEmailAttribute ||
    !hasUid ||
    !hasUin ||
    !hasName ||
    !hasEmail;

  return html`
    <!doctype html>
    <html lang="en">
      <head>
        ${HeadContents({ resLocals, pageTitle: 'آزمون SAML' })}
      </head>
      <body>
        <main id="content" class="container mb-4">
          ${
            usedNameFallback
              ? html`
                  <div class="alert alert-warning">
                    <h2 class="h4">استفاده از صفت نام جایگزین (Fallback)</h2>
                    <p class="mb-0">
                      نگاشت‌های نام و نام خانوادگی پیکربندی شده‌اند، اما یک یا چند مقدار در این پاسخ SAML یافت نشد. سامانه از صفت نام پیکربندی‌شده (<code>${nameAttribute}</code>) به عنوان جایگزین استفاده کرد.
                    </p>
                  </div>
                `
              : ''
          }
          ${
            hasError
              ? html`
                  <div class="alert alert-danger">
                    <h2 class="h4">
                      هنگام اعتبارسنجی پاسخ SAML یک یا چند خطا رخ داد.
                    </h2>
                    <ul class="mb-0">
                      ${
                        !hasUidAttribute
                          ? html`<li>
                              هیچ نگاشت صفت UID برای این موسسه پیکربندی نشده است
                            </li>`
                          : ''
                      }
                      ${
                        !hasUinAttribute
                          ? html`<li>
                              هیچ نگاشت صفت UIN برای این موسسه پیکربندی نشده است
                            </li>`
                          : ''
                      }
                      ${
                        !hasNameMapping
                          ? html`<li>
                              هیچ نگاشت صفت نام برای این موسسه پیکربندی نشده است
                            </li>`
                          : ''
                      }
                      ${
                        !hasEmailAttribute
                          ? html`<li>
                              هیچ نگاشت صفت ایمیل برای این موسسه پیکربندی نشده است
                            </li>`
                          : ''
                      }
                      ${
                        hasUidAttribute && !hasUid
                          ? html`<li>
                              مقداری برای صفت UID پیکربندی‌شده یافت نشد
                              (<code>${uidAttribute}</code>)
                            </li>`
                          : ''
                      }
                      ${
                        hasUinAttribute && !hasUin
                          ? html`<li>
                              مقداری برای صفت UIN پیکربندی‌شده یافت نشد
                              (<code>${uinAttribute}</code>)
                            </li>`
                          : ''
                      }
                      ${
                        hasNameAttribute && !hasName
                          ? html`<li>
                              مقداری برای صفت نام پیکربندی‌شده یافت نشد
                              (<code>${nameAttribute}</code>)
                            </li>`
                          : ''
                      }
                      ${
                        hasGivenNameAttribute && !hasGivenName
                          ? html`<li>
                              مقداری برای صفت نام کوچک پیکربندی‌شده یافت نشد
                              (<code>${givenNameAttribute}</code>)
                            </li>`
                          : ''
                      }
                      ${
                        hasFamilyNameAttribute && !hasFamilyName
                          ? html`<li>
                              مقداری برای صفت نام خانوادگی پیکربندی‌شده یافت نشد
                              (<code>${familyNameAttribute}</code>)
                            </li>`
                          : ''
                      }
                      ${
                        hasEmailAttribute && !hasEmail
                          ? html`<li>
                              مقداری برای صفت ایمیل پیکربندی‌شده یافت نشد
                              (<code>${emailAttribute}</code>)
                            </li>`
                          : ''
                      }
                    </ul>
                  </div>
                `
              : ''
          }
          ${
            hasUid || hasUin || hasName
              ? html`
                  <h2 class="h4">صفات نگاشت‌شده SAML</h2>
                  <ul>
                    ${
                      hasUid
                        ? html`<li><strong>شناسه کاربری (UID):</strong> ${uid} (<code>${uidAttribute}</code>)</li>`
                        : ''
                    }
                    ${
                      hasUin
                        ? html`<li><strong>شماره شناسایی (UIN):</strong> ${uin} (<code>${uinAttribute}</code>)</li>`
                        : ''
                    }
                    ${
                      hasName
                        ? html`<li>
                            <strong>نام:</strong> ${name}
                            ${
                              hasSplitNameValues
                                ? html`(<code>${givenNameAttribute}</code> +
                                    <code>${familyNameAttribute}</code>)`
                                : usedNameFallback
                                  ? html`(<code>${nameAttribute}</code>، جایگزین)`
                                  : html`(<code>${nameAttribute}</code>)`
                            }
                          </li>`
                        : ''
                    }
                    ${
                      hasEmail
                        ? html`<li>
                            <strong>ایمیل:</strong> ${email} (<code>${emailAttribute}</code>)
                          </li>`
                        : ''
                    }
                  </ul>
                `
              : ''
          }

          <h2 class="h4">تمامی صفات SAML</h2>
          <pre><code>${JSON.stringify(attributes, null, 2)}</code></pre>
        </main>
      </body>
    </html>
  `.toString();
};
