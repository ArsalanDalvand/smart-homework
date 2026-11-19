import { QueryClient, useMutation } from '@tanstack/react-query';
import clsx from 'clsx';
import { useState } from 'react';

import { formatDate } from '@prairielearn/formatter';
import { getAppError } from '@prairielearn/trpc/client';
import { AppErrorAlert, QueryClientProviderDebug } from '@prairielearn/trpc/react';

import type { UserAccessToken } from '../../../lib/client/safe-db-types.js';
import { createUserTrpcClient } from '../../../trpc/user/client.js';
import { TRPCProvider, useTRPC } from '../../../trpc/user/context.js';
import type { UserSettingsError } from '../../../trpc/user/user-settings.js';

import { DeleteTokenModal } from './DeleteTokenModal.js';
import { GenerateTokenModal } from './GenerateTokenModal.js';

interface UserSettingsPageProps {
  user: {
    uid: string;
    name: string | null;
    uin: string | null;
    email: string | null;
  };
  institution: {
    long_name: string;
    short_name: string;
  };
  authnProviderName: string;
  ipAddress: string | undefined;
  accessTokens: UserAccessToken[];
  newAccessTokens: string[];
  isExamMode: boolean;
  csrfToken: string;
  trpcCsrfToken: string;
  initialEnableSingleKeyShortcuts: boolean;
}

export function UserSettingsPage({
  user,
  institution,
  authnProviderName,
  ipAddress,
  accessTokens,
  newAccessTokens,
  isExamMode,
  csrfToken,
  trpcCsrfToken,
  initialEnableSingleKeyShortcuts,
}: UserSettingsPageProps) {
  const [queryClient] = useState(() => new QueryClient());
  const [trpcClient] = useState(() => createUserTrpcClient({ csrfToken: trpcCsrfToken }));

  return (
    <QueryClientProviderDebug client={queryClient}>
      <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
        <div style={{ fontFamily: 'var(--font-persian)' }}>
          <h1 className="mb-4 h2">تنظیمات حساب کاربری</h1>

          <UserProfileCard
            user={user}
            institution={institution}
            authnProviderName={authnProviderName}
            ipAddress={ipAddress}
          />

          <UserSettingsCard initialEnableSingleKeyShortcuts={initialEnableSingleKeyShortcuts} />

          <PersonalAccessTokensCard
            accessTokens={accessTokens}
            newAccessTokens={newAccessTokens}
            isExamMode={isExamMode}
            csrfToken={csrfToken}
          />

          <BrowserConfigurationCard />
        </div>
      </TRPCProvider>
    </QueryClientProviderDebug>
  );
}

UserSettingsPage.displayName = 'UserSettingsPage';

function UserProfileCard({
  user,
  institution,
  authnProviderName,
  ipAddress,
}: {
  user: UserSettingsPageProps['user'];
  institution: UserSettingsPageProps['institution'];
  authnProviderName: string;
  ipAddress: string | undefined;
}) {
  return (
    <div className="card mb-4">
      <div className="card-header bg-primary text-white d-flex align-items-center">
        <h2 className="h5 mb-0">مشخصات و هویت کاربر</h2>
      </div>
      <div className="table-responsive">
        <table
          className="table table-sm two-column-description"
          aria-label="اطلاعات کاربری"
        >
          <tbody>
            <tr>
              <th>شناسه کاربری (UID)</th>
              <td dir="ltr" style={{ textAlign: 'right' }}>{user.uid}</td>
            </tr>
            <tr>
              <th>نام و نام خانوادگی</th>
              <td>{user.name || '—'}</td>
            </tr>
            <tr>
              <th>شماره دانشجویی / پرسنلی (UIN)</th>
              <td>{user.uin || '—'}</td>
            </tr>
            <tr>
              <th>آدرس ایمیل</th>
              <td dir="ltr" style={{ textAlign: 'right' }}>{user.email || '—'}</td>
            </tr>
            <tr>
              <th>دانشکده / موسسه دانشگاهی</th>
              <td>
                {institution.long_name} ({institution.short_name})
              </td>
            </tr>
            <tr>
              <th>روش احراز هویت</th>
              <td>{authnProviderName}</td>
            </tr>
            <tr>
              <th>آدرس IP کاربر</th>
              <td dir="ltr" style={{ textAlign: 'right' }}>{ipAddress ?? <em>نامشخص</em>}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PersonalAccessTokensCard({
  accessTokens,
  newAccessTokens,
  isExamMode,
  csrfToken,
}: {
  accessTokens: UserAccessToken[];
  newAccessTokens: string[];
  isExamMode: boolean;
  csrfToken: string;
}) {
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [tokenToDelete, setTokenToDelete] = useState<UserAccessToken | null>(null);

  return (
    <>
      <div className="card mb-4">
        <div className="card-header bg-primary text-white d-flex align-items-center">
          <h2 className="h5 mb-0">توکن‌های دسترسی شخصی (API Tokens)</h2>
          {!isExamMode && (
            <button
              type="button"
              className="btn btn-light btn-sm ms-auto"
              data-testid="generate-token-button"
              aria-label="ایجاد توکن دسترسی"
              onClick={() => setShowGenerateModal(true)}
            >
              <i className="fa fa-plus me-1" aria-hidden="true" />
              <span className="d-none d-sm-inline">ایجاد توکن جدید</span>
            </button>
          )}
        </div>
        {newAccessTokens.length > 0 && (
          <div className="card-body">
            <div className="alert alert-primary" role="alert">
              توکن دسترسی جدید با موفقیت ایجاد شد! حتماً اکنون آن را کپی نمایید، زیرا پس از بستن این بخش مجدداً نمایش داده نخواهد شد.
            </div>
            {newAccessTokens.map((token) => (
              <div key={token} className="alert alert-success mb-0 d-flex align-items-center justify-content-between" role="alert">
                <span className="new-access-token font-monospace" dir="ltr">{token}</span>
                <button
                  type="button"
                  className="ms-2 btn btn-sm btn-outline-success js-copy-button"
                  data-clipboard-text={token}
                  aria-label="کپی توکن"
                >
                  <i className="bi bi-clipboard me-1" /> کپی
                </button>
              </div>
            ))}
          </div>
        )}
        <ul className="list-group list-group-flush">
          <TokenList
            accessTokens={accessTokens}
            isExamMode={isExamMode}
            onDeleteToken={setTokenToDelete}
          />
        </ul>
        <div className="card-footer small text-muted">
          از توکن‌های دسترسی می‌توان جهت فراخوانی API سامانه توسط اسکریپت‌های اساتید یا دستیاران آموزشی استفاده نمود. در حفظ و نگهداری آن کوشا باشید.
        </div>
      </div>

      <GenerateTokenModal
        show={showGenerateModal}
        csrfToken={csrfToken}
        onClose={() => setShowGenerateModal(false)}
      />

      <DeleteTokenModal
        token={tokenToDelete}
        csrfToken={csrfToken}
        onClose={() => setTokenToDelete(null)}
      />
    </>
  );
}

function TokenList({
  accessTokens,
  isExamMode,
  onDeleteToken,
}: {
  accessTokens: UserAccessToken[];
  isExamMode: boolean;
  onDeleteToken: (token: UserAccessToken) => void;
}) {
  if (isExamMode) {
    return (
      <li className="list-group-item">
        <span className="text-muted">در حالت آزمون، توکن‌های دسترسی غیرفعال هستند.</span>
      </li>
    );
  }

  if (accessTokens.length === 0) {
    return (
      <li className="list-group-item">
        <span className="text-muted">در حال حاضر توکن دسترسی فعالی ایجاد نکرده‌اید.</span>
      </li>
    );
  }

  return (
    <>
      {accessTokens.map((token) => (
        <li key={token.id} className="list-group-item d-flex align-items-center">
          <div className="d-flex flex-column me-3">
            <strong>{token.name}</strong>
            <span className="text-muted small">تاریخ ایجاد: {formatDate(token.created_at, 'Asia/Tehran')}</span>
            <span className="text-muted small">
              {token.last_used_at !== null
                ? `آخرین استفاده: ${formatDate(token.last_used_at, 'Asia/Tehran')}`
                : 'تاکنون استفاده نشده'}
            </span>
          </div>
          <button
            type="button"
            className="btn btn-outline-danger btn-sm ms-auto"
            onClick={() => onDeleteToken(token)}
          >
            حذف توکن
          </button>
        </li>
      ))}
    </>
  );
}

// Example of broken LaTeX rendering that users might see if MathJax isn't working.
const EXAMPLE_BROKEN_LATEX = String.raw`$ x = \frac{-b \pm \sqrt{b^2 - 4ac}}{2a} $`;

function BrowserConfigurationCard() {
  const handleResetMathJax = () => {
    localStorage.removeItem('MathJax-Menu-Settings');
    // oxlint-disable-next-line no-alert -- Matches original behavior for user feedback
    alert('تنظیمات فونت ریاضی MathJax بازنشانی شد.');
  };

  return (
    <div className="card mb-4">
      <div className="card-header bg-primary text-white d-flex">
        <h2 className="h5 mb-0">تنظیمات فرمول‌نویسی و رندر مرورگر</h2>
      </div>
      <div className="card-body">
        <p>
          این بخش به شما امکان می‌دهد تنظیمات رندر فرمول‌های ریاضی و کش محلی مرورگر را در صورت مشاهده بهم‌ریختگی بازنشانی نمایید.
        </p>
        <p>
          اگر فرمول‌های ریاضی به‌صورت کد خام مانند <span dir="ltr"><strong>{EXAMPLE_BROKEN_LATEX}</strong></span> نمایش داده می‌شوند، کلیک بر روی دکمه زیر مشکل را برطرف می‌کند.
        </p>
        <button type="button" className="btn btn-sm btn-primary" onClick={handleResetMathJax}>
          بازنشانی تنظیمات فرمول‌های ریاضی (MathJax)
        </button>
      </div>
    </div>
  );
}

function UserSettingsCard({
  initialEnableSingleKeyShortcuts,
}: {
  initialEnableSingleKeyShortcuts: boolean;
}) {
  const trpc = useTRPC();
  const [enableSingleKeyShortcuts, setEnableSingleKeyShortcuts] = useState(
    initialEnableSingleKeyShortcuts,
  );
  const [savedEnableSingleKeyShortcuts, setSavedEnableSingleKeyShortcuts] = useState(
    initialEnableSingleKeyShortcuts,
  );
  const updateMutation = useMutation({
    ...trpc.settings.update.mutationOptions(),
    onSuccess: ({ enableSingleKeyShortcuts: savedValue }) => {
      setEnableSingleKeyShortcuts(savedValue);
      setSavedEnableSingleKeyShortcuts(savedValue);
    },
  });
  const appError = getAppError<UserSettingsError['Update']>(updateMutation.error);
  const isDirty = enableSingleKeyShortcuts !== savedEnableSingleKeyShortcuts;

  return (
    <div className="card mb-4">
      <div className="card-header bg-primary text-white d-flex align-items-center">
        <h2 className="h5 mb-0">ترجیحات کاربری و کلیدهای میانبر</h2>
      </div>
      <div className="card-body">
        <div className="form-check form-switch">
          <input
            id="enable-keyboard-shortcuts"
            className="form-check-input"
            type="checkbox"
            // False positive: https://github.com/oxc-project/oxc/issues/24838
            // oxlint-disable-next-line jsx-a11y/role-has-required-aria-props
            role="switch"
            aria-describedby="enable-keyboard-shortcuts-description"
            checked={enableSingleKeyShortcuts}
            disabled={updateMutation.isPending}
            onChange={(event) => {
              updateMutation.reset();
              setEnableSingleKeyShortcuts(event.currentTarget.checked);
            }}
          />
          <label className="form-check-label fw-semibold" htmlFor="enable-keyboard-shortcuts">
            فعال‌سازی کلیدهای میانبر تک‌کلیدی
          </label>
          <div id="enable-keyboard-shortcuts-description" className="form-text mt-1">
            امکان استفاده از میانبرهای کیبورد برای جابجایی سریع میان سوالات و ثبت نمرات تصحیح دستی.
          </div>
        </div>

        <AppErrorAlert
          error={appError}
          className="mt-3 mb-0"
          render={{ UNKNOWN: ({ message }) => message }}
          onDismiss={() => updateMutation.reset()}
        />

        <div className="d-flex align-items-center gap-2 mt-3">
          <button
            type="button"
            className="btn btn-primary"
            disabled={!isDirty || updateMutation.isPending}
            onClick={() => updateMutation.mutate({ enableSingleKeyShortcuts })}
          >
            {updateMutation.isPending && (
              <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />
            )}
            {updateMutation.isPending ? 'در حال ذخیره‌سازی…' : 'ذخیره تنظیمات'}
          </button>
          <span
            className={clsx('small text-success', {
              invisible: !updateMutation.isSuccess || isDirty,
            })}
            aria-hidden={!updateMutation.isSuccess || isDirty}
          >
            <i className="bi bi-check-circle-fill me-1" aria-hidden="true" />
            تنظیمات با موفقیت ذخیره گردید.
          </span>
          <span className="visually-hidden" role="status" aria-live="polite">
            {updateMutation.isSuccess && !isDirty ? 'تنظیمات ذخیره شد' : ''}
          </span>
        </div>
      </div>
    </div>
  );
}
