import { z } from 'zod';

import { compiledScriptTag } from '@prairielearn/compiled-assets';
import { html } from '@prairielearn/html';

import { Modal } from '../../components/Modal.js';
import { PageLayout } from '../../components/PageLayout.js';
import { uiStrings } from '../../lib/branding.js';
import { type Course, type CourseInstance, type Institution } from '../../lib/db-types.js';
import type { FeatureName } from '../../lib/features/index.js';
import type { ResLocalsForPage } from '../../lib/res-locals.js';

export const FeatureGrantRowSchema = z.object({
  id: z.string(),
  name: z.string(),
  enabled: z.boolean(),
  institution_id: z.string().nullable(),
  institution_short_name: z.string().nullable(),
  institution_long_name: z.string().nullable(),
  course_id: z.string().nullable(),
  course_title: z.string().nullable(),
  course_short_name: z.string().nullable(),
  course_instance_id: z.string().nullable(),
  course_instance_short_name: z.string().nullable(),
  course_instance_long_name: z.string().nullable(),
  user_id: z.string().nullable(),
  user_uid: z.string().nullable(),
  user_name: z.string().nullable(),
});
type FeatureGrantRow = z.infer<typeof FeatureGrantRowSchema>;

export function AdministratorFeatures({
  features,
  resLocals,
}: {
  features: FeatureName[];
  resLocals: ResLocalsForPage<'plain'>;
}) {
  return PageLayout({
    resLocals,
    pageTitle: 'قابلیت‌ها و فلگ‌ها',
    navContext: {
      type: 'administrator',
      page: 'admin',
      subPage: 'features',
    },
    content: html`
      <div class="card mb-4" style="font-family: var(--font-persian);">
        <div class="card-header bg-primary text-white">
          <h1 class="h4 mb-0">قابلیت‌ها و فلگ‌های سیستمی</h1>
        </div>
        ${
          features.length > 0
            ? html`
                <div class="list-group list-group-flush">
                  ${features.map((feature) => {
                    return html`
                      <div class="list-group-item d-flex align-items-center">
                        <a
                          href="${resLocals.urlPrefix}/administrator/features/${feature}"
                          class="me-auto font-monospace"
                          dir="ltr"
                        >
                          ${feature}
                        </a>
                      </div>
                    `;
                  })}
                </div>
              `
            : html`<div class="card-body text-center text-secondary">قابلیتی ثبت نشده است.</div>`
        }
      </div>
    `,
  });
}

export function AdministratorFeature({
  feature,
  featureGrants,
  featureInConfig,
  institutions,
  resLocals,
}: {
  feature: string;
  institutions: Institution[];
  featureGrants: FeatureGrantRow[];
  featureInConfig: boolean | null;
  resLocals: ResLocalsForPage<'plain'>;
}) {
  return PageLayout({
    resLocals,
    pageTitle: 'قابلیت‌ها و فلگ‌ها',
    navContext: {
      type: 'administrator',
      page: 'admin',
      subPage: 'features',
    },
    headContent: html`
      ${compiledScriptTag('administratorFeaturesClient.ts')}
      <style>
        .list-inline-item:not(:first-child):before {
          margin-right: 0.5rem;
          content: '/';
        }
        [data-loading] {
          display: none;
        }
      </style>
    `,
    content: html`
      <div class="card mb-4" style="font-family: var(--font-persian);">
        <div class="card-header bg-primary text-white d-flex align-items-center">
          <span class="font-monospace">${feature}</span>
          <button
            class="btn btn-light ms-auto"
            data-bs-toggle="modal"
            data-bs-target="#add-feature-grant-modal"
          >
            ${uiStrings.adminFeatures.modalTitle}
          </button>
        </div>
        ${
          featureGrants.length > 0 || featureInConfig != null
            ? html`
                <div class="list-group list-group-flush">
                  ${
                    featureInConfig != null
                      ? html`
                          <div class="list-group-item">
                            <i
                              class="fa-solid me-1 ${
                                featureInConfig ? 'fa-check text-success' : 'fa-times text-danger'
                              }"
                            ></i>
                            این قابلیت در فایل پیکربندی سرور ${featureInConfig ? 'فعال' : 'غیرفعال'} است.
                          </div>
                        `
                      : ''
                  }
                  ${featureGrants.map((featureGrant) =>
                    FeatureGrant({
                      featureGrant,
                      overridden: featureInConfig != null,
                      csrfToken: resLocals.__csrf_token,
                    }),
                  )}
                </div>
              `
            : html`
                <div class="card-body text-center text-secondary">
                  ${uiStrings.adminFeatures.noGrants}
                </div>
              `
        }
      </div>
    `,
    postContent: html`
      ${AddFeatureGrantModal({
        feature,
        // Default to enabled for new grants.
        enabled: true,
        institutions,
        csrfToken: resLocals.__csrf_token,
      })}
    `,
  });
}

function FeatureGrantBreadcrumbs({ featureGrant }: { featureGrant: FeatureGrantRow }) {
  const hasInstitution = featureGrant.institution_id !== null;
  const hasCourse = featureGrant.course_id !== null;
  const hasCourseInstance = featureGrant.course_instance_id !== null;
  const hasUser = featureGrant.user_id !== null;
  const isGlobal = !hasInstitution && !hasCourse && !hasCourseInstance && !hasUser;
  return html`
    <ol class="list-inline mb-0">
      ${
        isGlobal
          ? html`<li class="list-inline-item inline-flex">
              <i class="fa-solid fa-globe me-1"></i>
              سراسری (Global)
            </li>`
          : null
      }
      ${
        hasInstitution
          ? html`
              <li class="list-inline-item inline-flex">
                ${featureGrant.institution_long_name} (${featureGrant.institution_short_name})
              </li>
            `
          : null
      }
      ${
        hasCourse
          ? html`<li class="list-inline-item inline-flex">
              ${featureGrant.course_short_name}: ${featureGrant.course_title}
            </li>`
          : null
      }
      ${
        hasCourseInstance
          ? html`<li class="list-inline-item inline-flex">
              ${featureGrant.course_instance_long_name} (${featureGrant.course_instance_short_name})
            </li>`
          : null
      }
      ${
        hasUser
          ? html`<li class="list-inline-item inline-flex">
              ${featureGrant.user_uid} (${featureGrant.user_name})
            </li>`
          : null
      }
      </li>
    </ol>
  `;
}

function FeatureGrant({
  featureGrant,
  overridden,
  csrfToken,
}: {
  featureGrant: FeatureGrantRow;
  overridden: boolean;
  csrfToken: string;
}) {
  return html`
    <div
      class="list-group-item d-flex flex-column flex-md-row flex-nowrap align-items-md-center ${
        overridden ? 'text-muted' : ''
      }"
    >
      <div>${FeatureGrantBreadcrumbs({ featureGrant })}</div>
      <div class="ms-auto d-flex flex-row flex-nowrap flex-shrink-0">
        <form
          method="POST"
          class="me-2"
          hx-boost="true"
          hx-trigger="change"
          hx-ext="morphdom-swap"
          hx-swap="morphdom"
        >
          <input type="hidden" name="__csrf_token" value="${csrfToken}" />
          <input type="hidden" name="feature_grant_id" value="${featureGrant.id}" />
          <input type="hidden" name="__action" value="update_feature_grant_enabled" />
          <select
            class="form-select form-select-sm"
            aria-label="${uiStrings.adminFeatures.statusAria}"
            name="feature_grant_enabled"
          >
            <option value="enabled" ${featureGrant.enabled ? 'selected' : ''}>${uiStrings.adminFeatures.statusEnabled}</option>
            <option value="disabled" ${featureGrant.enabled ? '' : 'selected'}>${uiStrings.adminFeatures.statusDisabled}</option>
          </select>
        </form>

        <form
          method="POST"
          hx-boost="true"
          hx-confirm="${uiStrings.adminFeatures.revokeConfirm}"
          hx-ext="morphdom-swap"
          hx-swap="morphdom"
        >
          <input type="hidden" name="__csrf_token" value="${csrfToken}" />
          <input type="hidden" name="feature_grant_id" value="${featureGrant.id}" />
          <button
            type="submit"
            name="__action"
            value="revoke_feature_grant"
            class="btn btn-sm btn-outline-danger"
          >
            ${uiStrings.adminFeatures.revokeBtn}
          </button>
        </form>
      </div>
    </div>
  `;
}

interface FeatureGrantModalProps {
  feature: string;
  enabled: boolean;
  institutions: Institution[];
  institution_id?: string | null;
  courses?: Course[];
  course_id?: string | null;
  course_instances?: CourseInstance[];
  course_instance_id?: string | null;
  csrfToken: string;
}

function AddFeatureGrantModal(props: FeatureGrantModalProps) {
  return Modal({
    title: uiStrings.adminFeatures.modalTitle,
    id: 'add-feature-grant-modal',
    body: html`
      <div style="font-family: var(--font-persian);" dir="rtl">
        ${AddFeatureGrantModalBody(props)}
        <div class="mt-3">
          <label class="form-label" for="feature-grant-user">${uiStrings.adminFeatures.userLabel}</label>
          <input
            type="text"
            class="form-control text-start"
            id="feature-grant-user"
            name="user_uid"
            dir="ltr"
            placeholder="${uiStrings.adminFeatures.userPlaceholder}"
          />
          <div class="form-text">${uiStrings.adminFeatures.userHelp}</div>
        </div>
      </div>
    `,
    footer: html`
      <input type="hidden" name="__csrf_token" value="${props.csrfToken}" />
      <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">${uiStrings.adminFeatures.cancelBtn}</button>
      <button type="submit" name="__action" value="add_feature_grant" class="btn btn-primary">
        ${uiStrings.adminFeatures.submitBtn}
      </button>
    `,
  });
}

export function AddFeatureGrantModalBody({
  feature,
  enabled,
  institutions,
  institution_id,
  courses,
  course_id,
  course_instances,
  course_instance_id,
}: Omit<FeatureGrantModalProps, 'csrfToken'>) {
  const modalUrl = `/pl/administrator/features/${feature}/modal`;
  return html`
    <fieldset
      hx-get="${modalUrl}"
      hx-trigger="change"
      hx-target="this"
      hx-include="closest .modal-body"
      hx-ext="loading-states,morphdom-swap"
      hx-swap="morphdom"
      data-loading-disable
      data-loading-delay="200"
      style="font-family: var(--font-persian);"
      dir="rtl"
    >
      <div class="form-check">
        <input
          type="radio"
          class="form-check-input"
          id="feature-grant-enabled"
          name="enabled"
          value="true"
          ${enabled ? 'checked' : ''}
        />
        <label class="form-check-label" for="feature-grant-enabled">${uiStrings.adminFeatures.enableFeature}</label>
      </div>
      <div class="form-check">
        <input
          type="radio"
          class="form-check-input"
          id="feature-grant-disabled"
          name="enabled"
          value="false"
          ${enabled ? '' : 'checked'}
        />
        <label class="form-check-label" for="feature-grant-disabled">${uiStrings.adminFeatures.disableFeature}</label>
        <div class="small text-muted mt-1">
          ${uiStrings.adminFeatures.overrideNotice}
        </div>
      </div>

      <hr />

      <div class="mb-3">
        <label class="form-label" for="feature-grant-institution">
          ${uiStrings.adminFeatures.institutionLabel}
          <div class="spinner-border spinner-border-sm" role="status" data-loading></div>
        </label>
        <select class="form-select" id="feature-grant-institution" name="institution_id">
          <option value="">${uiStrings.adminFeatures.allInstitutions}</option>
          ${institutions.map((institution) => {
            return html`
              <option
                value="${institution.id}"
                ${institution.id === institution_id ? 'selected' : ''}
              >
                ${institution.short_name}: ${institution.long_name} (${institution.id})
              </option>
            `;
          })}
        </select>
      </div>

      <div class="mb-3">
        <label class="form-label" for="feature-grant-course">
          ${uiStrings.adminFeatures.courseLabel}
          <div class="spinner-border spinner-border-sm" role="status" data-loading></div>
        </label>
        <select
          class="form-select"
          id="feature-grant-course"
          name="course_id"
          ${!institution_id ? 'disabled' : ''}
        >
          <option value="">${uiStrings.adminFeatures.allCourses}</option>
          ${(courses ?? []).map((course) => {
            return html`
              <option value="${course.id}" ${course.id === course_id ? 'selected' : ''}>
                ${course.short_name}: ${course.title} (${course.id})
              </option>
            `;
          })}
        </select>
      </div>

      <div class="mb-3">
        <label class="form-label" for="feature-grant-course-instance">
          ${uiStrings.adminFeatures.instanceLabel}
          <div class="spinner-border spinner-border-sm" role="status" data-loading></div>
        </label>
        <select
          class="form-select"
          id="feature-grant-course-instance"
          name="course_instance_id"
          ${!course_id ? 'disabled' : ''}
        >
          <option value="">${uiStrings.adminFeatures.allInstances}</option>
          ${(course_instances ?? []).map((course_instance) => {
            return html`
              <option
                value="${course_instance.id}"
                ${course_instance.id === course_instance_id ? 'selected' : ''}
              >
                ${course_instance.short_name}: ${course_instance.long_name} (${course_instance.id})
              </option>
            `;
          })}
        </select>
      </div>
    </fieldset>
  `;
}
