import { z } from 'zod';

import { EncodedData } from '@prairielearn/browser-utils';
import { html } from '@prairielearn/html';

import { PageLayout } from '../../../components/PageLayout.js';
import { compiledScriptTag } from '../../../lib/assets.js';
import {
  type Institution,
  Lti13CourseInstanceSchema,
  type Lti13Instance,
} from '../../../lib/db-types.js';
import { LTI13_ROSTER_SYNC_CONFIRMATION_FIELDS } from '../../../lib/institution-identity.js';
import type { ResLocalsForPage } from '../../../lib/res-locals.js';
import { getLti13CourseDisplayName } from '../../lib/lti13-course-instance.js';

import { type LTI13InstancePlatforms } from './administratorInstitutionLti13.types.js';

export const LinkedCourseInstanceSchema = z.object({
  lti13_course_instance: Lti13CourseInstanceSchema,
  course_instance_short_name: z.string().nullable(),
  course_short_name: z.string().nullable(),
  lineitem_resource_links: z
    .object({
      resource_link_id: z.string(),
      label: z.string().nullable(),
      assessment_title: z.string().nullable(),
    })
    .array(),
});
type LinkedCourseInstance = z.infer<typeof LinkedCourseInstanceSchema>;

export function AdministratorInstitutionLti13({
  institution,
  lti13Instances,
  instance,
  linkedCourseInstances,
  resLocals,
  platform_defaults,
  canonicalHost,
  rosterSyncPrerequisiteIssues,
}: {
  institution: Institution;
  lti13Instances: Lti13Instance[];
  instance: Lti13Instance | null;
  linkedCourseInstances: LinkedCourseInstance[];
  resLocals: ResLocalsForPage<'plain'>;
  platform_defaults: LTI13InstancePlatforms;
  canonicalHost: string;
  rosterSyncPrerequisiteIssues: string[];
}): string {
  return PageLayout({
    resLocals: {
      ...resLocals,
      institution,
    },
    pageTitle: 'اتصال LMS (LTI 1.3) - مدیریت موسسه',
    headContent: compiledScriptTag('administratorInstitutionLti13Client.ts'),
    navContext: {
      type: 'administrator_institution',
      page: 'administrator_institution',
      subPage: 'lti13',
    },
    content: html`
      <h2 class="h4">اتصال LMS (LTI 1.3) / تعامل‌پذیری ابزارهای یادگیری</h2>
      <p>${lti13Instances.length} نمونه پیکربندی شده است.</p>
      <hr />

      <div class="row">
        <div class="col-3">
          ${lti13Instances.length > 0 ? 'لطفاً یک نمونه را انتخاب کنید:' : ''}

          <nav class="nav nav-pills flex-column">
            ${lti13Instances.map((i) => {
              return html`
                <a class="nav-link ${i.id === instance?.id ? 'active' : ''}" href="${i.id}">
                  <span style="white-space: nowrap">${i.name}</span>
                  <span style="white-space: nowrap">(${i.platform})</span>
                </a>
              `;
            })}
          </nav>
          <form method="POST">
            <input type="hidden" name="__csrf_token" value="${resLocals.__csrf_token}" />
            <button
              class="btn btn-outline-success d-block w-100 my-4"
              type="submit"
              name="__action"
              value="add_instance"
            >
              افزودن نمونه جدید LTI 1.3
            </button>
          </form>
        </div>

        <div class="col-9">
          ${LTI13Instance({
            instance,
            linkedCourseInstances,
            resLocals,
            platform_defaults,
            canonicalHost,
            rosterSyncPrerequisiteIssues,
          })}
        </div>
      </div>
    `,
  });
}

function LTI13Instance({
  instance,
  linkedCourseInstances,
  resLocals,
  platform_defaults,
  canonicalHost,
  rosterSyncPrerequisiteIssues,
}: {
  instance: Lti13Instance | null;
  linkedCourseInstances: LinkedCourseInstance[];
  resLocals: ResLocalsForPage<'plain'>;
  platform_defaults: LTI13InstancePlatforms;
  canonicalHost: string;
  rosterSyncPrerequisiteIssues: string[];
}) {
  if (instance) {
    const platformConfigurationLocked = instance.roster_sync_allowed;

    return html`
      <h3>${instance.name} (شناسه #${instance.id})</h3>
      <p>
        ایجادشده در ${instance.created_at.toString()}
        <button
          class="btn btn-sm btn-secondary"
          type="button"
          data-bs-toggle="modal"
          data-bs-target="#instanceData"
        >
          <i class="fa-solid fa-screwdriver-wrench"></i> نمایش جزئیات
        </button>
      </p>

      <div class="modal fade" id="instanceData" tabindex="-1">
        <div class="modal-dialog modal-xl modal-dialog-scrollable">
          <div class="modal-content">
            <div class="modal-header">
              <h5 class="modal-title">داده‌های نمونه LTI 1.3</h5>
              <button
                type="button"
                class="btn-close"
                data-bs-dismiss="modal"
                aria-label="بستن"
              ></button>
            </div>
            <div class="modal-body">
              <pre><code>${JSON.stringify(instance, null, 1)}</code></pre>
            </div>
          </div>
        </div>
      </div>

      <p>
        <a href="${canonicalHost}/pl/lti13_instance/${instance.id}/config"
          >پیکربندی LTI 1.3 برای نمونه</a
        >
        |
        <a href="${canonicalHost}/pl/lti13_instance/${instance.id}/jwks">پیوند مخزن کلید JWKS</a>
        (${instance.keystore?.keys ? instance.keystore.keys.length : 0} کلید)
      </p>

      <hr />
      <h5>نام:</h5>
      ${
        instance.tool_platform_name
          ? html` سامانه LMS خود را با نام زیر معرفی کرده است:
              <strong>${instance.tool_platform_name}</strong>`
          : ''
      }
      <form class="form" method="POST">
        <input type="hidden" name="__csrf_token" value="${resLocals.__csrf_token}" />
        <input type="hidden" name="__action" value="update_name" />
        <div class="mb-3 my-2">
          <label for="name" class="form-label">نام نمایشی پلتفرم: </label>
          <input
            id="name"
            class="form-control"
            type="text"
            size="80"
            spellcheck="false"
            name="name"
            value="${instance.name}"
            aria-describedby="nameHelp"
          />
          <small id="nameHelp" class="form-text text-muted">
            از این نام در داخل سامانه برای اشاره به LMS استفاده کنید (هر نامی که موسسه شما به آن می‌دهد).
          </small>
        </div>
        <button type="submit" class="btn btn-info">ذخیره نام</button>
        <input type="reset" class="btn btn-secondary" value="بازنشانی گزینه‌ها" />
      </form>

      <hr />
      <h5>پلتفرم:</h5>

      ${EncodedData(platform_defaults, 'platform_defaults_data')}

      <form class="form" method="POST" data-lti13-platform-configuration>
        <input type="hidden" name="__csrf_token" value="${resLocals.__csrf_token}" />
        <input type="hidden" name="__action" value="update_platform" />

        ${
          platformConfigurationLocked
            ? html`
                <div class="alert alert-info">
                  Platform configuration is locked while roster syncing is allowed.
                  <a href="#roster-sync-controls">همگام‌سازی فهرست را در پایین غیرفعال کنید</a> before changing
                  these options.
                </div>
              `
            : ''
        }

        <div class="mb-3">
          <label class="form-label" for="choosePlatform">نوع پلتفرم: </label>
          <select
            class="form-select mb-2"
            id="choosePlatform"
            name="platform"
            ${platformConfigurationLocked ? 'disabled' : ''}
          >
            ${platform_defaults.map((d) => {
              return html`
                <option value="${d.platform}" ${d.platform === instance.platform ? 'selected' : ''}>
                  ${d.platform}
                </option>
              `;
            })}
          </select>

          <div class="form-check form-check-inline">
            <label class="form-check-label">
              <input
                id="update_params"
                class="form-check-input"
                type="checkbox"
                name="platform_update"
                value="1"
                checked
                ${platformConfigurationLocked ? 'disabled' : ''}
              />
              هنگام تغییر، مقادیر پیش‌فرض در فرم بارگذاری شوند&nbsp;<em>(ویرایش و ذخیره را فراموش نکنید!)</em>
            </label>
          </div>
        </div>

        <div class="mb-3 mt-2">
          <label for="issuer_params"> پارامترهای صادرکننده (Issuer params): </label>
          <textarea
            class="form-control"
            id="issuer_params"
            name="issuer_params"
            rows="8"
            spellcheck="false"
            ${platformConfigurationLocked ? 'disabled' : ''}
          >
${JSON.stringify(instance.issuer_params, null, 3)}</textarea>
        </div>

        <div class="mb-3 mt-2">
          <label for="client_id">شناسه کلاینت (Client ID): </label>
          <input
            id="client_id"
            class="form-control"
            type="text"
            spellcheck="false"
            name="client_id"
            value="${instance.client_params?.client_id}"
            aria-describedby="client_idHelp"
            ${platformConfigurationLocked ? 'disabled' : ''}
          />
          <small id="client_idHelp" class="form-text text-muted">
            این شناسه یکتا را از LMS دریافت کنید.
          </small>
        </div>

        <div class="mb-3 mt-2">
          <label for="custom_fields">پیشنهادهای فیلدهای سفارشی (Custom fields): </label>
          <textarea
            class="form-control"
            id="custom_fields"
            name="custom_fields"
            rows="4"
            spellcheck="false"
            ${platformConfigurationLocked ? 'disabled' : ''}
          >
${JSON.stringify(instance.custom_fields, null, 3)}</textarea>
          <small id="custom_fieldsHelp" class="form-text text-muted">
            پیشنهادهایی را در JSON پیکربندی برای نحوه تنظیم فیلدهای سفارشی LTI 1.3 به LMS ارائه دهید.
            <a
              href="https://canvas.instructure.com/doc/api/file.tools_variable_substitutions.html"
              target="_blank"
              rel="noreferrer"
              >مستندات جایگزینی متغیرهای Canvas</a
            >
          </small>
        </div>

        <div class="mb-3">
          <button
            type="submit"
            class="btn btn-info"
            ${platformConfigurationLocked ? 'disabled' : ''}
          >
            ذخیره گزینه‌های پلتفرم
          </button>
          <input
            type="reset"
            class="btn btn-secondary"
            value="بازنشانی گزینه‌ها"
            ${platformConfigurationLocked ? 'disabled' : ''}
          />
        </div>
      </form>

      <hr />
      <h5>مخزن کلید (Keystore):</h5>

      <a href="${canonicalHost}/pl/lti13_instance/${instance.id}/jwks">مخزن کلید JWKS</a>
      شامل ${instance.keystore?.keys ? instance.keystore.keys.length : 0} کلید است.<br />
      <ul>
        ${instance.keystore?.keys.map((k) => {
          return html`<li>
            <form method="POST">
              <input type="hidden" name="__csrf_token" value="${resLocals.__csrf_token}" />
              <input type="hidden" name="__action" value="delete_key" />
              <input type="hidden" name="kid" value="${k.kid}" />
              ${k.kid}
              <input
                class="btn btn-xs btn-outline-warning"
                type="submit"
                value="حذف کلید"
                onclick="return confirm('آیا از حذف کلید ${k.kid} اطمینان دارید؟')"
              />
            </form>
          </li>`;
        })}
      </ul>
      <form method="POST">
        <input type="hidden" name="__csrf_token" value="${resLocals.__csrf_token}" />
        <button type="submit" name="__action" value="add_key" class="btn btn-success">
          افزودن کلید به مخزن
        </button>
        <button
          type="submit"
          name="__action"
          value="delete_keys"
          class="btn btn-warning"
          onclick="return confirm('آیا از حذف همه کلیدها از مخزن اطمینان دارید؟')"
        >
          حذف همه کلیدها از مخزن
        </button>
      </form>

      <hr />
      <h5>پیکربندی سامانه</h5>

      <form method="POST">
        <input type="hidden" name="__csrf_token" value="${resLocals.__csrf_token}" />
        <input type="hidden" name="__action" value="save_pl_config" />

        <h6>کدام صفات از ادعای کاربر LTI 1.3 باید به هویت‌های سامانه نگاشت شوند؟</h6>
        <div class="mb-3">
          <label class="form-label" for="name_attribute">صفت نام</label>
          <input
            type="text"
            class="form-control"
            name="name_attribute"
            id="name_attribute"
            value="${instance.name_attribute}"
            aria-describedby="nameAttributeHelp"
          />
          <small id="nameAttributeHelp" class="form-text text-muted">
            این صفت باید شامل نام کامل کاربر باشد، مانند «سارا محمدی».
          </small>
        </div>

        <div class="mb-3">
          <label class="form-label" for="uid_attribute">صفت UID</label>
          <input
            type="text"
            class="form-control"
            name="uid_attribute"
            id="uid_attribute"
            value="${instance.uid_attribute}"
            aria-describedby="uidAttributeHelp"
          />
          <small id="uidAttributeHelp" class="form-text text-muted">
            شناسه UID یک شناسه قابل مشاهده برای کاربر است. معمولاً باید شبیه ایمیل باشد، مانند «user@example.com». با این حال، نیازی نیست حتماً آدرس ایمیل واقعی باشد؛ سامانه هرگز ایمیلی به آن ارسال نمی‌کند. این صفت ممکن است تغییر کند، مثلاً اگر دانشجو نام خود را در دانشگاه تغییر دهد.
          </small>
        </div>

        <div class="mb-3">
          <label class="form-label" for="uin_attribute">صفت UIN</label>
          <input
            type="text"
            class="form-control"
            name="uin_attribute"
            id="uin_attribute"
            value="${instance.uin_attribute ?? ''}"
            aria-describedby="uinAttributeHelp${
              instance.roster_sync_allowed ? ' uinAttributeLockedHelp' : ''
            }"
            ${instance.roster_sync_allowed ? 'disabled' : ''}
          />
          <small id="uinAttributeHelp" class="form-text text-muted">
            شناسه UIN به عنوان یک شناسه داخلی و تغییرناپذیر برای کاربر استفاده می‌شود. این مقدار برای یک فرد <strong>هرگز نباید</strong> تغییر کند، حتی اگر نام یا UID او تغییر یابد. مثلاً
            <code>["https://purl.imsglobal.org/spec/lti/claim/lis"]["person_sourcedid"]</code> or
            <code>["https://purl.imsglobal.org/spec/lti/claim/custom"]["uin"]</code>
          </small>
          ${
            instance.roster_sync_allowed
              ? html`
                  <small id="uinAttributeLockedHelp" class="form-text text-muted d-block">
                    این صفت تا زمانی که همگام‌سازی فهرست مجاز است، قفل شده است.
                    <a href="#roster-sync-controls">همگام‌سازی فهرست را در پایین غیرفعال کنید</a> پیش از تغییر آن.
                  </small>
                `
              : ''
          }
        </div>

        <div class="mb-3">
          <label class="form-label" for="email_attribute">صفت ایمیل</label>
          <input
            type="text"
            class="form-control"
            name="email_attribute"
            id="email_attribute"
            value="${instance.email_attribute}"
            aria-describedby="emailAttributeHelp"
          />
          <small id="emailAttributeHelp" class="form-text text-muted">
            این صفت باید شامل آدرس ایمیل کاربر باشد. در صورت وجود، سامانه از آن برای ارسال ایمیل به کاربر استفاده خواهد کرد.
          </small>
        </div>

        <div class="mb-3 form-check">
          <input
            type="checkbox"
            class="form-check-input"
            name="require_linked_lti_user"
            id="require_linked_lti_user"
            value="true"
            aria-describedby="requireLtiUserHelp"
            ${instance.require_linked_lti_user ? 'checked' : ''}
          />
          <label class="form-check-label" for="require_linked_lti_user">
            الزام به احراز هویت LTI
          </label>
          <small id="requireLtiUserHelp" class="form-text text-muted d-block">
            در صورت فعال بودن، دانشجویانی که از طریق ارائه‌دهنده غیر-LTI وارد می‌شوند، پیش از دسترسی به ارائه‌های درس متصل به این نمونه LTI، باید از طریق پلتفرم LTI نیز احراز هویت شوند. در اکثر موارد نباید فعال شود و عمدتاً برای موسساتی کاربرد دارد که UID یا ایمیل معتبری از طریق LTI ارائه نمی‌دهند.
          </small>
        </div>

        <button type="submit" class="btn btn-info">ذخیره پیکربندی سامانه</button>
      </form>

      <hr />
      ${RosterSyncControls({
        instance,
        rosterSyncPrerequisiteIssues,
        resLocals,
      })}

      <hr />
      ${RosterInspector({ linkedCourseInstances, resLocals })}

      <hr />
      <p>
        برای آزمایش، از مدیر LMS بخواهید نشانی شروع OpenID Connect خود را روی مقدار زیر تنظیم کند:
        <a href="${canonicalHost}/pl/lti13_instance/${instance.id}/auth/login?test">
          ${canonicalHost}/pl/lti13_instance/${instance.id}/auth/login?test
        </a>
      </p>

      <form method="POST">
        <input type="hidden" name="__csrf_token" value="${resLocals.__csrf_token}" />
        <input type="hidden" name="__action" value="remove_instance" />
        <button
          type="submit"
          class="btn btn-danger my-2"
          onclick="return confirm('آیا از حذف این نمونه LTI 1.3 اطمینان دارید؟')"
        >
          حذف نمونه LTI 1.3
        </button>
      </form>
    `;
  } else {
    return html`لطفاً یک نمونه را از منو انتخاب کنید.`;
  }
}

function RosterSyncControls({
  instance,
  rosterSyncPrerequisiteIssues,
  resLocals,
}: {
  instance: Lti13Instance;
  rosterSyncPrerequisiteIssues: string[];
  resLocals: ResLocalsForPage<'plain'>;
}) {
  return html`
    <h5 id="roster-sync-controls">همگام‌سازی فهرست دانشجویان (Roster syncing)</h5>
    ${
      instance.roster_sync_allowed
        ? html`
            <div class="alert alert-success">
              همگام‌سازی فهرست برای این نمونه LTI 1.3 مجاز است. تنظیمات پلتفرم و UIN آن و همچنین تنظیمات هویت SAML موسسه برای محافظت از تطبیق کاربران قفل شده‌اند.
            </div>
            <form method="POST">
              <input type="hidden" name="__csrf_token" value="${resLocals.__csrf_token}" />
              <input type="hidden" name="__action" value="disallow_roster_sync" />
              <button
                type="submit"
                class="btn btn-outline-danger"
                onclick="return confirm('همگام‌سازی فهرست برای این نمونه غیرمجاز شود؟')"
              >
                غیرمجاز کردن همگام‌سازی فهرست
              </button>
            </form>
          `
        : rosterSyncPrerequisiteIssues.length > 0
          ? html`
              <div class="alert alert-warning mb-0">
                <p>تا زمانی که پیش‌نیازهای زیر برآورده نشوند، همگام‌سازی فهرست مجاز نخواهد بود:</p>
                <ul>
                  ${rosterSyncPrerequisiteIssues.map((issue) => html`<li>${issue}</li>`)}
                </ul>
                <p class="mb-0">
                  در صورت نیاز، صفت UIN در بالا یا تنظیمات
                  <a href="${resLocals.urlPrefix}/saml">SAML</a> و
                  <a href="${resLocals.urlPrefix}/sso">ورود یکپارچه (SSO)</a> موسسه را به‌روزرسانی کنید.
                </p>
              </div>
            `
          : html`
              <p>
                تنها پس از اطمینان از اینکه SAML و LTI کاربران را با یک UIN یکسان و تغییرناپذیر شناسایی می‌کنند، همگام‌سازی فهرست را مجاز کنید.
              </p>
              <form method="POST">
                <input type="hidden" name="__csrf_token" value="${resLocals.__csrf_token}" />
                <input type="hidden" name="__action" value="allow_roster_sync" />
                <div class="form-check mb-2">
                  <input
                    class="form-check-input"
                    type="checkbox"
                    id="lti13-roster-sync-same-canonical-uin"
                    name="${LTI13_ROSTER_SYNC_CONFIRMATION_FIELDS.sameCanonicalUin}"
                    value="1"
                    required
                  />
                  <label class="form-check-label" for="lti13-roster-sync-same-canonical-uin">
                    تایید می‌کنم که SAML و LTI برای هر کاربر یک UIN یکسان و استاندارد ارائه می‌دهند.
                  </label>
                </div>
                <div class="form-check mb-3">
                  <input
                    class="form-check-input"
                    type="checkbox"
                    id="lti13-roster-sync-users-backfilled"
                    name="${LTI13_ROSTER_SYNC_CONFIRMATION_FIELDS.usersBackfilled}"
                    value="1"
                    required
                  />
                  <label class="form-check-label" for="lti13-roster-sync-users-backfilled">
                    تایید می‌کنم که کاربران فعلی که ممکن است همگام‌سازی شوند، با این UIN به‌روزرسانی (Backfill) شده‌اند.
                  </label>
                </div>
                <button type="submit" class="btn btn-primary">مجاز کردن همگام‌سازی فهرست</button>
              </form>
            `
    }
  `;
}

function RosterInspector({
  linkedCourseInstances,
  resLocals,
}: {
  linkedCourseInstances: LinkedCourseInstance[];
  resLocals: ResLocalsForPage<'plain'>;
}) {
  return html`
    <h5>بازرس فهرست NRPS</h5>
    <p class="text-muted">
      ابزار عیب‌یابی فقط-خواندنی. خروجی خام سرویس Names and Role Provisioning Service (NRPS) را برای یک ارائه درس متصل نمایش می‌دهد و به صورت اختیاری ادعاهای سفارشی هر عضو را برای پیوند منبع انتخاب‌شده درخواست می‌کند. این کار <code>sub</code>، ایمیل و UIN هر عضو را نمایش می‌دهد. هیچ ثبت‌نام یا کاربری ایجاد یا تغییر داده نمی‌شود.
    </p>
    ${
      linkedCourseInstances.length === 0
        ? html`<p>هنوز هیچ ارائه درسی به این نمونه LTI 1.3 متصل نشده است.</p>`
        : linkedCourseInstances.map((linked) => RosterInspectorForm({ linked, resLocals }))
    }
  `;
}

function RosterInspectorForm({
  linked,
  resLocals,
}: {
  linked: LinkedCourseInstance;
  resLocals: ResLocalsForPage<'plain'>;
}) {
  const lci = linked.lti13_course_instance;
  const courseLabel =
    `${linked.course_short_name ?? ''} ${linked.course_instance_short_name ?? ''}`.trim() ||
    `ارائه درس ${lci.course_instance_id}`;

  return html`
    <div class="card mb-2">
      <div class="card-body">
        <h6 class="card-title mb-1">
          <a
            href="/pl/course_instance/${lci.course_instance_id}/instructor/instance_admin/lti13_instance/${lci.id}"
            target="_blank"
            rel="noreferrer"
          >
            ${courseLabel}
          </a>
          <span class="text-muted fw-normal">(${getLti13CourseDisplayName(lci)})</span>
        </h6>
        ${
          lci.context_memberships_url === null
            ? html`
                <p class="text-muted mb-0">
                  هنوز <code>context_memberships_url</code> ذخیره نشده است. از یک مدرس بخواهید سامانه را از طریق این درس در LMS اجرا کند تا مقداردهی شود.
                </p>
              `
            : html`
                <form method="POST" class="row g-2 align-items-end">
                  <input type="hidden" name="__csrf_token" value="${resLocals.__csrf_token}" />
                  <input type="hidden" name="__action" value="inspect_roster" />
                  <input type="hidden" name="lti13_course_instance_id" value="${lci.id}" />
                  <div class="col-md-9">
                    <label class="form-label" for="rlid-${lci.id}">پیوند منبع (Resource link)</label>
                    <select class="form-select" id="rlid-${lci.id}" name="rlid">
                      <option value="">هیچ‌کدام (فهرست ساده، بدون ادعاهای سفارشی)</option>
                      ${
                        lci.resource_link_id
                          ? html`
                              <option value="${lci.resource_link_id}">
                                ناوبری درس (${lci.resource_link_id})
                              </option>
                            `
                          : ''
                      }
                      ${linked.lineitem_resource_links.map(
                        (li) => html`
                          <option value="${li.resource_link_id}">
                            آزمون/تکلیف: ${li.assessment_title ?? li.label ?? li.resource_link_id}
                            (${li.resource_link_id})
                          </option>
                        `,
                      )}
                    </select>
                  </div>
                  <div class="col-md-3">
                    <button type="submit" class="btn btn-primary w-100">دریافت فهرست</button>
                  </div>
                </form>
              `
        }
      </div>
    </div>
  `;
}
