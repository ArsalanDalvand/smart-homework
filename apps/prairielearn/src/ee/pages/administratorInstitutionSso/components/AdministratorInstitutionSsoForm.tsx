import { useState } from 'react';

import { isInstitutionalAuthenticationProvider } from '../../../../lib/authn-provider-classification.js';
import type { StaffAuthnProvider, StaffInstitution } from '../../../../lib/client/safe-db-types.js';
import type { AuthnProvider } from '../../../../lib/db-types.js';

function formatProviderList(providers: AuthnProvider[]) {
  if (providers.length === 2) {
    return `${providers[0].name} و ${providers[1].name}`;
  }
  if (providers.length > 2) {
    return (
      providers
        .slice(0, -1)
        .map((p) => p.name)
        .join('، ') + ` و ${providers[providers.length - 1].name}`
    );
  }
}

export function AdministratorInstitutionSsoForm({
  institution,
  hasSamlProvider,
  supportedAuthenticationProviders,
  institutionAuthenticationProviders,
  hasRosterSyncAllowed,
  urlPrefix,
  csrfToken,
}: {
  institution: StaffInstitution;
  hasSamlProvider: boolean;
  supportedAuthenticationProviders: StaffAuthnProvider[];
  institutionAuthenticationProviders: StaffAuthnProvider[];
  hasRosterSyncAllowed: boolean;
  urlPrefix: string;
  csrfToken: string;
}) {
  const [enabledProviderIds, setEnabledProviderIds] = useState(
    () => new Set(institutionAuthenticationProviders.map((p) => p.id)),
  );

  const [defaultProviderId, setDefaultProviderId] = useState(institution.default_authn_provider_id);

  // LTI sessions must start in an LMS, so LTI providers do not count as institutional sign-on
  // providers for this guardrail.
  const enabledInstitutionalProviders = supportedAuthenticationProviders.filter(
    (provider) =>
      enabledProviderIds.has(provider.id) && isInstitutionalAuthenticationProvider(provider.name),
  );

  return (
    <form method="POST">
      <div className="mb-3">
        <h2 className="h4">ارائه‌دهندگان فعال ورود یکپارچه (SSO)</h2>
        {hasRosterSyncAllowed && (
          <div className="alert alert-info" role="alert">
            همگام‌سازی فهرست دانشجویان (Roster syncing) برای یک نمونه LTI 1.3 مجاز شده است. SAML باید تنها ارائه‌دهنده فعال ورود یکپارچه موسسه باقی بماند. LTI و LTI 1.3 می‌توانند فعال بمانند زیرا نشست‌های آن‌ها در سامانه مدیریت یادگیری (LMS) آغاز می‌شوند. پیش از تغییر این تنظیمات، همگام‌سازی فهرست را برای تمام نمونه‌های LTI 1.3 مرتبط غیرفعال کنید.
          </div>
        )}
        {supportedAuthenticationProviders.map((provider) => {
          const isEnabled = enabledProviderIds.has(provider.id);
          const isInstitutionalProvider = isInstitutionalAuthenticationProvider(provider.name);
          const isLockedEnabledSaml = hasRosterSyncAllowed && provider.name === 'SAML' && isEnabled;
          const isLockedDisabledProvider =
            hasRosterSyncAllowed &&
            isInstitutionalProvider &&
            provider.name !== 'SAML' &&
            !isEnabled;
          const isDisabled =
            (provider.name === 'SAML' && !hasSamlProvider) ||
            isLockedEnabledSaml ||
            isLockedDisabledProvider;
          return (
            <div key={provider.id} className="form-check">
              {isLockedEnabledSaml && (
                <input type="hidden" name="enabled_authn_provider_ids" value={provider.id} />
              )}
              <input
                className="form-check-input js-authentication-provider"
                type="checkbox"
                value={provider.id}
                id={`provider-${provider.id}-enabled`}
                name="enabled_authn_provider_ids"
                checked={isEnabled}
                disabled={isDisabled}
                onChange={({ currentTarget }) => {
                  setEnabledProviderIds((prev) => {
                    const newSet = new Set(prev);
                    if (currentTarget.checked) {
                      newSet.add(provider.id);
                    } else {
                      newSet.delete(provider.id);
                    }
                    return newSet;
                  });

                  // If the default provider is being disabled, reset to null (none).
                  if (!currentTarget.checked && defaultProviderId === provider.id) {
                    setDefaultProviderId(null);
                  }
                }}
              />
              <label className="form-check-label" htmlFor={`provider-${provider.id}-enabled`}>
                {provider.name}
                {provider.name === 'SAML' && !hasSamlProvider ? (
                  <small className="d-block">
                    پیش از فعال‌سازی باید <a href={`${urlPrefix}/saml`}>SAML را پیکربندی کنید</a>.
                  </small>
                ) : (
                  ''
                )}
              </label>
            </div>
          );
        })}
        {enabledInstitutionalProviders.length > 1 && (
          <div className="alert alert-warning mt-2" role="alert">
            فعال‌سازی هم‌زمان {formatProviderList(enabledInstitutionalProviders)}{' '}
            <strong>توصیه نمی‌شود</strong>. این کار ممکن است تنها در شرایطی مناسب باشد که دانشجویان از یک ارائه‌دهنده ورود و کارکنان از ارائه‌دهنده دیگری استفاده می‌کنند، یا در حال انتقال از یک ارائه‌دهنده به دیگری هستید. در صورت داشتن سوال با مدیر فنی تماس بگیرید.
          </div>
        )}
        {enabledProviderIds.size === 0 && (
          <div className="alert alert-warning mt-2" role="alert">
            در حال حاضر هیچ ارائه‌دهنده ورود یکپارچه‌ای برای این موسسه فعال نیست. تا زمانی که حداقل یک ارائه‌دهنده فعال نشود، کاربران امکان ورود نخواهند داشت.
          </div>
        )}
      </div>
      <div className="mb-3">
        <h2 className="h4" id="defaultProviderLabel">
          ارائه‌دهنده پیش‌فرض ورود یکپارچه (SSO)
        </h2>
        <select
          className="form-select js-default-authentication-provider"
          id="defaultProvider"
          name="default_authn_provider_id"
          aria-labelledby="defaultProviderLabel"
          value={defaultProviderId || ''}
          onChange={(e) => setDefaultProviderId(e.currentTarget.value || null)}
        >
          <option value="">هیچ‌کدام</option>
          {supportedAuthenticationProviders.map((provider) => {
            if (provider.name === 'LTI' || provider.name === 'LTI 1.3') return null;

            return (
              <option
                key={provider.id}
                value={provider.id}
                disabled={!enabledProviderIds.has(provider.id)}
              >
                {provider.name}
              </option>
            );
          })}
        </select>
        <div className="form-text">
          هنگامی که یک ارائه‌دهنده پیش‌فرض ورود یکپارچه تنظیم شده باشد، کاربران می‌توانند در صفحه ورود روی نام موسسه شما کلیک کرده و مستقیماً به ارائه‌دهنده مناسب هدایت شوند. توجه داشته باشید که LTI و LTI 1.3 نمی‌توانند به عنوان ارائه‌دهنده پیش‌فرض انتخاب شوند.
        </div>
      </div>
      <input type="hidden" name="__csrf_token" value={csrfToken} />
      <button type="submit" className="btn btn-primary">
        ذخیره
      </button>
    </form>
  );
}

AdministratorInstitutionSsoForm.displayName = 'AdministratorInstitutionSsoForm';
