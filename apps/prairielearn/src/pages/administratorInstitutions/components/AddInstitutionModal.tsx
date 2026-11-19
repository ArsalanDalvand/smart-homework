import { useMutation, useQuery } from '@tanstack/react-query';
import clsx from 'clsx';
import { Modal } from 'react-bootstrap';
import { useForm } from 'react-hook-form';
import ReactMarkdown from 'react-markdown';

import { getAppError } from '@prairielearn/trpc/client';
import { AppErrorAlert } from '@prairielearn/trpc/react';
import { OverlayTrigger } from '@prairielearn/ui';
import { type Timezone, formatTimezone } from '@prairielearn/utils/timezone';

import type { StaffAuthnProvider } from '../../../lib/client/safe-db-types.js';
import { UidRegexpSchema } from '../../../lib/uid-regexp.js';
import { useTRPC } from '../../../trpc/administrator/context.js';
import type { AdministratorInstitutionsError } from '../../../trpc/administrator/institutions.js';

interface AddInstitutionFormData {
  short_name: string;
  long_name: string;
  display_timezone: string;
  uid_regexp: string;
  enabled_authn_provider_ids: string[];
}

export function AddInstitutionModal({
  show,
  availableTimezones,
  supportedAuthenticationProviders,
  onClose,
  aiSecretsConfigured,
}: {
  show: boolean;
  availableTimezones: Timezone[];
  supportedAuthenticationProviders: StaffAuthnProvider[];
  onClose: () => void;
  aiSecretsConfigured: boolean;
}) {
  const trpc = useTRPC();
  const mutation = useMutation(trpc.institutions.addInstitution.mutationOptions());
  const appError = getAppError<AdministratorInstitutionsError['AddInstitution']>(mutation.error);

  const defaultCheckedIds = supportedAuthenticationProviders
    .filter((p) => p.name === 'Google' || p.name === 'Azure')
    .map((p) => p.id);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { isSubmitting, errors },
  } = useForm<AddInstitutionFormData>({
    mode: 'onSubmit',
    defaultValues: {
      display_timezone: '',
      enabled_authn_provider_ids: defaultCheckedIds,
    },
  });
  const institutionName = watch('long_name');
  const emailDomain = watch('short_name');

  const onSubmit = (data: AddInstitutionFormData) => {
    mutation.mutate(
      {
        shortName: data.short_name,
        longName: data.long_name,
        displayTimezone: data.display_timezone,
        uidRegexp: data.uid_regexp,
        enabledAuthnProviderIds: data.enabled_authn_provider_ids,
      },
      { onSuccess: () => window.location.reload() },
    );
  };

  const timezoneQuery = useQuery({
    ...trpc.institutions.suggestTimezone.queryOptions({ institutionName, emailDomain }),
    enabled: false,
  });

  const validTimezoneNames = new Set(availableTimezones.map((tz) => tz.name));

  async function handleSuggestTimezone() {
    const { data } = await timezoneQuery.refetch();
    if (data?.timezone && validTimezoneNames.has(data.timezone)) {
      setValue('display_timezone', data.timezone, { shouldValidate: true, shouldDirty: true });
    } else {
      setValue('display_timezone', '', { shouldValidate: true });
    }
  }

  return (
    <Modal show={show} onHide={onClose} style={{ fontFamily: 'var(--font-persian)' }}>
      <Modal.Header closeButton>
        <Modal.Title>تعریف دانشکده یا واحد آموزشی جدید</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <form id="add-institution-form" onSubmit={handleSubmit(onSubmit)}>
          <div className="mb-3">
            <label className="form-label" htmlFor="short_name">
              کد اختصاری دانشکده
            </label>
            <input
              type="text"
              className={clsx('form-control', errors.short_name && 'is-invalid')}
              id="short_name"
              placeholder="مثال: CE"
              dir="ltr"
              aria-describedby="short_name_help"
              aria-invalid={errors.short_name ? true : undefined}
              aria-errormessage={errors.short_name ? 'short_name-error' : undefined}
              {...register('short_name', { required: 'کد اختصاری را وارد نمایید' })}
            />
            {errors.short_name && (
              <div id="short_name-error" className="invalid-feedback">
                {errors.short_name.message}
              </div>
            )}
            <small id="short_name_help" className="form-text text-muted">
              نام اختصاری دانشکده یا موسسه (مانند CE, EE, MATH, MECH, UT, SUT).
            </small>
          </div>
          <div className="mb-3">
            <label className="form-label" htmlFor="long_name">
              نام کامل دانشکده / موسسه
            </label>
            <input
              type="text"
              className={clsx('form-control', errors.long_name && 'is-invalid')}
              id="long_name"
              placeholder="مثال: دانشکده مهندسی کامپیوتر یا دانشگاه تهران"
              aria-describedby="long_name_help"
              aria-invalid={errors.long_name ? true : undefined}
              aria-errormessage={errors.long_name ? 'long_name-error' : undefined}
              {...register('long_name', { required: 'نام کامل را وارد نمایید' })}
            />
            {errors.long_name && (
              <div id="long_name-error" className="invalid-feedback">
                {errors.long_name.message}
              </div>
            )}
            <small id="long_name_help" className="form-text text-muted">
              نام رسمی و کامل دانشکده یا دانشگاه طبق مصوبه آموزشی.
            </small>
          </div>
          <div className="mb-3">
            <label className="form-label" htmlFor="display_timezone">
              منطقه زمانی
            </label>
            <div className="d-flex gap-2 align-items-center">
              <select
                className={clsx('form-select', errors.display_timezone && 'is-invalid')}
                id="display_timezone"
                aria-describedby="display_timezone_help"
                aria-invalid={errors.display_timezone ? true : undefined}
                aria-errormessage={errors.display_timezone ? 'display_timezone-error' : undefined}
                {...register('display_timezone', { required: 'منطقه زمانی را انتخاب نمایید' })}
              >
                <option value="" disabled hidden>
                  انتخاب منطقه زمانی...
                </option>
                {availableTimezones.map((tz, i) => (
                  <option key={tz.name} value={tz.name} id={`timezone-${i}`}>
                    {formatTimezone(tz)}
                  </option>
                ))}
              </select>
            </div>
            {errors.display_timezone && (
              <div id="display_timezone-error" className="invalid-feedback d-block">
                {errors.display_timezone.message}
              </div>
            )}
          </div>
          <div className="mb-3">
            <label className="form-label" htmlFor="uid_regexp">
              الگوی شناسه (UID Regexp)
            </label>
            <input
              type="text"
              className={clsx('form-control', errors.uid_regexp && 'is-invalid')}
              id="uid_regexp"
              placeholder="@iust\.ac\.ir$"
              dir="ltr"
              aria-describedby="uid_regexp_help"
              aria-invalid={errors.uid_regexp ? true : undefined}
              aria-errormessage={errors.uid_regexp ? 'uid_regexp-error' : undefined}
              {...register('uid_regexp', {
                validate: (value) => {
                  const result = UidRegexpSchema.safeParse(value);
                  return result.success || result.error.issues[0].message;
                },
              })}
            />
            {errors.uid_regexp && (
              <div id="uid_regexp-error" className="invalid-feedback">
                {errors.uid_regexp.message}
              </div>
            )}
            <small id="uid_regexp_help" className="form-text text-muted">
              الگوی اعتبارسنجی ایمیل سازمانی، به صورت <code dir="ltr">@.*\.ac\.ir$</code> یا دامنه ایمیل دانشگاه.
            </small>
          </div>
          <AppErrorAlert
            error={appError}
            render={{ UNKNOWN: ({ message }) => message }}
            onDismiss={() => mutation.reset()}
          />
        </form>
      </Modal.Body>
      <Modal.Footer>
        <button type="button" className="btn btn-secondary" onClick={onClose}>
          انصراف
        </button>
        <button
          type="submit"
          className="btn btn-primary"
          form="add-institution-form"
          disabled={isSubmitting || mutation.isPending}
        >
          ثبت و ایجاد دانشکده
        </button>
      </Modal.Footer>
    </Modal>
  );
}

AddInstitutionModal.displayName = 'AddInstitutionModal';
