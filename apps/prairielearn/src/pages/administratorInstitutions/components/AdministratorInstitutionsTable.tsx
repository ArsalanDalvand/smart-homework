import { QueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import { QueryClientProviderDebug } from '@prairielearn/trpc/react';
import type { Timezone } from '@prairielearn/utils/timezone';

import { uiStrings } from '../../../lib/branding.js';
import type { AdminInstitution, StaffAuthnProvider } from '../../../lib/client/safe-db-types.js';
import { createAdministratorTrpcClient } from '../../../trpc/administrator/client.js';
import { TRPCProvider } from '../../../trpc/administrator/context.js';

import { AddInstitutionModal } from './AddInstitutionModal.js';

interface InstitutionRow {
  institution: AdminInstitution;
  authn_providers: StaffAuthnProvider['name'][];
}

export function AdministratorInstitutionsTable({
  institutions,
  availableTimezones,
  supportedAuthenticationProviders,
  trpcCsrfToken,
  isEnterprise,
  aiSecretsConfigured,
}: {
  institutions: InstitutionRow[];
  availableTimezones: Timezone[];
  supportedAuthenticationProviders: StaffAuthnProvider[];
  trpcCsrfToken: string;
  isEnterprise: boolean;
  aiSecretsConfigured: boolean;
}) {
  const [showModal, setShowModal] = useState(false);
  const [queryClient] = useState(() => new QueryClient());
  const [trpcClient] = useState(() => createAdministratorTrpcClient({ csrfToken: trpcCsrfToken }));

  return (
    <QueryClientProviderDebug client={queryClient}>
      <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
        <>
          <div id="institutions" className="card mb-4" style={{ fontFamily: 'var(--font-persian)' }}>
            <div className="card-header bg-primary text-white d-flex align-items-center">
              <h1 className="h4 mb-0">{uiStrings.adminInstitutions.pageTitle}</h1>
              <button
                type="button"
                className="btn btn-sm btn-light ms-auto"
                onClick={() => setShowModal(true)}
              >
                <i className="fas fa-plus me-1" />
                <span className="d-none d-sm-inline">{uiStrings.adminInstitutions.addBtn}</span>
              </button>
            </div>
            <div className="table-responsive">
              <table className="table table-sm table-hover table-striped" aria-label={uiStrings.adminInstitutions.tableAria}>
                <thead>
                  <tr>
                    <th>${uiStrings.adminInstitutions.colShortName}</th>
                    <th>${uiStrings.adminInstitutions.colLongName}</th>
                    <th>${uiStrings.adminInstitutions.colTimezone}</th>
                    <th>${uiStrings.adminInstitutions.colUidRegexp}</th>
                    <th>${uiStrings.adminInstitutions.colAuthnProviders}</th>
                  </tr>
                </thead>
                <tbody>
                  {institutions.map(({ institution, authn_providers }) => (
                    <tr key={institution.id}>
                      <td>
                        {isEnterprise ? (
                          <a href={`/pl/administrator/institution/${institution.id}`}>
                            {institution.short_name}
                          </a>
                        ) : (
                          institution.short_name
                        )}
                      </td>
                      <td>{institution.long_name}</td>
                      <td>{institution.display_timezone}</td>
                      <td>
                        {institution.uid_regexp ? (
                          <span className="font-monospace" dir="ltr">{institution.uid_regexp}</span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td>{authn_providers.join(', ') || uiStrings.adminInstitutions.defaultAuthn}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <AddInstitutionModal
            show={showModal}
            availableTimezones={availableTimezones}
            supportedAuthenticationProviders={supportedAuthenticationProviders}
            aiSecretsConfigured={aiSecretsConfigured}
            onClose={() => setShowModal(false)}
          />
        </>
      </TRPCProvider>
    </QueryClientProviderDebug>
  );
}

AdministratorInstitutionsTable.displayName = 'AdministratorInstitutionsTable';
