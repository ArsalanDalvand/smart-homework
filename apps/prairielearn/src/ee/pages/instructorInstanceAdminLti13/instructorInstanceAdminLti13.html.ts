import { z } from 'zod';

import { formatDateYMDHM } from '@prairielearn/formatter';
import { type HtmlSafeString, html } from '@prairielearn/html';

import { Modal } from '../../../components/Modal.js';
import { PageLayout } from '../../../components/PageLayout.js';
import {
  AssessmentSchema,
  AssessmentSetSchema,
  type Lti13Assessment,
  type Lti13Instance,
} from '../../../lib/db-types.js';
import type { ResLocalsForPage } from '../../../lib/res-locals.js';
import { getLti13CourseDisplayName } from '../../lib/lti13-course-instance.js';
import { type Lineitems, type Lti13CombinedInstance } from '../../lib/lti13.js';

export const AssessmentRowSchema = AssessmentSchema.extend({
  abbreviation: AssessmentSetSchema.shape.abbreviation,
  name: AssessmentSetSchema.shape.name,
  color: AssessmentSetSchema.shape.color,
  start_new_assessment_group: z.boolean(),
  assessment_group_heading: AssessmentSetSchema.shape.heading,
  label: z.string(),
});
type AssessmentRow = z.infer<typeof AssessmentRowSchema>;

function getLti13ConnectionDisplayName(instance: Lti13CombinedInstance): string {
  return `${instance.lti13_instance.name}: ${getLti13CourseDisplayName(instance.lti13_course_instance)}`;
}

export function InstructorInstanceAdminLti13NoInstances({
  resLocals,
  lti13_instances,
}: {
  resLocals: ResLocalsForPage<'course-instance'>;
  lti13_instances: Lti13Instance[];
}): string {
  return PageLayout({
    resLocals,
    pageTitle: 'اتصال LMS (LTI 1.3)',
    navContext: {
      type: 'instructor',
      page: 'instance_admin',
      subPage: 'lms_connections',
    },
    options: {
      fullWidth: true,
    },
    content: html`
      <div class="card mb-4">
        <div class="card-header bg-primary text-white d-flex align-items-center">
          <h1>اتصال LMS (LTI 1.3)</h1>
        </div>
        <div class="card-body">
          ${
            lti13_instances.length === 0
              ? html`
                  <p>
                    هیچ سامانه مدیریت یادگیری (LMS) در موسسه شما برای یکپارچه‌سازی با سامانه در دسترس نیست. لطفاً برای راه‌اندازی اتصال با مدیران فناوری اطلاعات خود تماس بگیرید. می‌توانید آن‌ها را به
                    <a target="_blank" href="https://docs.prairielearn.com/lti13/" rel="noreferrer"
                      >مستندات</a
                    > ارجاع دهید.
                  </p>
                `
              : html`
                  <p>
                    سامانه‌های مدیریت یادگیری (LMS) زیر در موسسه شما برای یکپارچه‌سازی با سامانه در دسترس هستند:
                  </p>

                  <ul>
                    ${lti13_instances.map((i) => {
                      return html`<li>${i.name}</li>`;
                    })}
                  </ul>
                  <p>
                    <a
                      target="_blank"
                      href="https://docs.prairielearn.com/lmsIntegrationInstructor/"
                      rel="noreferrer"
                    >
                      چگونه درس خود را به یک LMS متصل کنم؟
                    </a>
                  </p>
                `
          }
          <p class="mb-0">
            یکپارچه‌سازی به شما امکان می‌دهد نمرات آزمون‌ها و تکالیف را از سامانه به LMS ارسال کنید.
          </p>
        </div>
      </div>
    `,
  });
}

export function InstructorInstanceAdminLti13({
  resLocals,
  instance,
  instances,
  assessments,
  lineitems,
}: {
  resLocals: ResLocalsForPage<'course-instance'>;
  instance: Lti13CombinedInstance;
  instances: Lti13CombinedInstance[];
  assessments: AssessmentRow[];
  lineitems: Lti13Assessment[];
}): string {
  const lmsConnectionName = getLti13ConnectionDisplayName(instance);
  // Coursera may retain duplicate LTI line items that aren't visible in its UI, making bulk
  // creation difficult to recover from. See https://github.com/PrairieLearn/PrairieLearn/issues/15643.
  const allowBulkAssignmentCreation =
    instance.lti13_instance.issuer_params?.issuer !== 'https://coursera.org';

  return PageLayout({
    resLocals,
    pageTitle: 'اتصال LMS (LTI 1.3)',
    navContext: {
      type: 'instructor',
      page: 'instance_admin',
      subPage: 'lms_connections',
    },
    options: {
      fullWidth: true,
    },
    content: html`
      <div class="card mb-4">
        <div class="card-header bg-primary text-white d-flex">
          <h1>پیکربندی LTI 1.3</h1>
        </div>
        <div class="card-body">
          <div class="row">
            <div class="col-2">
              <div class="dropdown mb-2">
                <button
                  type="button"
                  class="btn dropdown-toggle border w-100 text-start pe-4"
                  data-bs-toggle="dropdown"
                  aria-haspopup="true"
                  aria-expanded="false"
                  data-bs-boundary="window"
                >
                  <span class="d-inline-block text-wrap w-100">${lmsConnectionName}</span>
                </button>
                <div class="dropdown-menu">
                  ${instances.map((i) => {
                    return html`
                      <a
                        class="dropdown-item ${
                          instance.lti13_course_instance.id === i.lti13_course_instance.id
                            ? 'active'
                            : ''
                        }"
                        href="/pl/course_instance/${
                          resLocals.course_instance.id
                        }/instructor/instance_admin/lti13_instance/${i.lti13_course_instance.id}"
                        aria-current="${
                          instance.lti13_course_instance.id === i.lti13_course_instance.id
                            ? 'true'
                            : ''
                        }"
                      >
                        ${getLti13ConnectionDisplayName(i)}
                      </a>
                    `;
                  })}
                </div>
              </div>
              پیوندهای سریع:
              <ul>
                <li><a href="#assessments">آزمون‌ها و تکالیف متصل</a></li>
                <li><a href="#connection">اتصال به LMS</a></li>
              </ul>
              ایجادشده در:
              ${formatDateYMDHM(
                instance.lti13_course_instance.created_at,
                resLocals.course_instance.display_timezone,
              )}
            </div>
            <div class="col-10">
              <h3 id="assessments">آزمون‌ها و تکالیف متصل</h3>
              ${
                instance.lti13_course_instance.context_memberships_url &&
                instance.lti13_course_instance.lineitems_url
                  ? LinkedAssessments({
                      resLocals,
                      lmsConnectionName,
                      assessments,
                      lineitems,
                      hasMultipleLmsCourses: instances.length > 1,
                      allowBulkAssignmentCreation,
                    })
                  : html`
                      <p>
                        سامانه متادیتای کافی LTI برای اتصال تکالیف و ارسال خودکار نمرات را در اختیار ندارد.
                      </p>
                      <p>
                        برای به‌روزرسانی متادیتا، به LMS بازگردید و به عنوان مدرس یک اتصال جدید از طریق LTI برقرار کنید، سپس به این صفحه برگردید.
                      </p>
                    `
              }

              <h3 id="connection">اتصال به LMS</h3>
              <form method="POST">
                <input type="hidden" name="__action" value="delete_lti13_course_instance" />
                <input type="hidden" name="__csrf_token" value="${resLocals.__csrf_token}" />
                <button
                  class="btn btn-danger btn-sm"
                  onclick="return confirm('آیا از حذف این اتصال اطمینان دارید؟');"
                >
                  حذف اتصال LTI 1.3 با ${instance.lti13_instance.name}:
                  ${getLti13CourseDisplayName(instance.lti13_course_instance)}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    `,
  });
}

function LinkedAssessments({
  resLocals,
  lmsConnectionName,
  assessments,
  lineitems,
  hasMultipleLmsCourses,
  allowBulkAssignmentCreation,
}: {
  resLocals: ResLocalsForPage<'course-instance'>;
  lmsConnectionName: string;
  assessments: AssessmentRow[];
  lineitems: Lti13Assessment[];
  hasMultipleLmsCourses: boolean;
  allowBulkAssignmentCreation: boolean;
}): HtmlSafeString {
  const { urlPrefix } = resLocals;
  const { assessments_group_by } = resLocals.course_instance;
  const assessmentGroups: AssessmentRow[][] = [];
  assessments.forEach((row) => {
    if (row.start_new_assessment_group || assessmentGroups.length === 0) {
      assessmentGroups.push([row]);
    } else {
      assessmentGroups[assessmentGroups.length - 1].push(row);
    }
  });

  return html`
    <div class="table-responsive">
      <table class="table table-sm table-hover">
        <thead>
          <tr>
            <th colspan="2" scope="colgroup">آزمون/تکلیف در سامانه</th>
            <th>عملیات</th>
            <th>
              <form method="POST">
                <input type="hidden" name="__action" value="poll_lti13_assessments" />
                <input type="hidden" name="__csrf_token" value="${resLocals.__csrf_token}" />
                تکلیف در ${lmsConnectionName}
                <button class="btn btn-success btn-xs">همگام‌سازی متادیتا</button>
              </form>
            </th>
          </tr>
        </thead>
        ${assessmentGroups.map((groupRows) => {
          const group = groupRows[0];
          return html`
            <tbody>
              <tr>
                <th colspan="4" scope="rowgroup">
                  ${Modal({
                    id: `bulk-${group.assessment_set_id}-${group.assessment_module_id}`,
                    title: `عملیات گروهی ${group.assessment_group_heading}`,
                    body: html`<p>
                        این عملیات گروهی به صورت یکجا روی تمام آزمون‌ها و تکالیف این گروه که امکان‌پذیر باشد اعمال می‌شوند.
                      </p>

                      <form method="POST">
                        <input
                          type="hidden"
                          name="__csrf_token"
                          value="${resLocals.__csrf_token}"
                        />

                        <input
                          type="hidden"
                          name="assessment_set_id"
                          value="${group.assessment_set_id}"
                        />
                        <input
                          type="hidden"
                          name="assessment_module_id"
                          value="${group.assessment_module_id}"
                        />

                        ${
                          allowBulkAssignmentCreation
                            ? html`
                                <button
                                  class="btn btn-success"
                                  name="__action"
                                  value="bulk_create_assessments"
                                  onclick="return confirm('آیا اطمینان دارید؟');"
                                >
                                  ایجاد و اتصال تکالیف در ${lmsConnectionName}
                                </button>
                                که هنوز متصل نشده‌اند.
                                <br />
                              `
                            : ''
                        }
                        <button
                          class="btn btn-med-light"
                          name="__action"
                          value="bulk_unlink_assessments"
                          onclick="return confirm('آیا اطمینان دارید؟');"
                        >
                          قطع اتصال آزمون‌ها/تکالیف
                        </button>
                        که متصل هستند.
                      </form>`,
                    footer: html`<button
                      type="button"
                      class="btn btn-secondary"
                      data-bs-dismiss="modal"
                    >
                      بستن
                    </button>`,
                  })}
                  ${group.assessment_group_heading}
                  <button
                    class="btn btn-sm btn-secondary ms-2"
                    type="button"
                    data-bs-toggle="modal"
                    data-bs-target="#bulk-${group.assessment_set_id}-${group.assessment_module_id}"
                  >
                    عملیات گروهی
                  </button>
                </th>
              </tr>
              ${groupRows.map((row) => {
                const lineitems_linked = lineitems.filter((item) => {
                  return item.assessment_id === row.id;
                });
                return html`
                  <tr id="row-${row.id}">
                    <td class="align-middle" style="width: 1%">
                      <span class="badge color-${row.color}">${row.label}</span>
                    </td>
                    <td class="align-middle">
                      <a href="${urlPrefix}/assessment/${row.id}/"
                        >${row.title}
                        ${
                          row.team_work
                            ? html` <i class="fas fa-users" aria-hidden="true"></i> `
                            : ''
                        }</a
                      >
                    </td>
                    <td>
                      ${Modal({
                        body: html`
                          <p>کدام تکلیف در ${lmsConnectionName} متصل شود؟</p>
                          <form method="POST">
                            <input
                              type="hidden"
                              name="__csrf_token"
                              value="${resLocals.__csrf_token}"
                            />
                            <input type="hidden" name="unsafe_assessment_id" value="${row.id}" />
                            <button
                              class="btn btn-success"
                              name="__action"
                              value="create_link_assessment"
                            >
                              ایجاد تکلیف جدید با نام ${row.label}: ${row.title}
                            </button>
                          </form>
                          <form method="POST">
                            <input
                              type="hidden"
                              name="__csrf_token"
                              value="${resLocals.__csrf_token}"
                            />
                            <input type="hidden" name="unsafe_assessment_id" value="${row.id}" />
                            <button
                              class="btn btn-primary"
                              hx-get="?lineitems"
                              hx-target="next .line-items-inputs"
                              onclick="this.querySelector('.refresh-button').classList.remove('d-none');"
                            >
                              انتخاب از تکالیف موجود در ${lmsConnectionName}
                              <span class="refresh-button d-none"
                                ><i class="fa fa-refresh"></i
                              ></span>
                            </button>
                            <div class="line-items-inputs"></div>
                          </form>
                        `,
                        footer: html`<button
                          type="button"
                          class="btn btn-secondary"
                          data-bs-dismiss="modal"
                        >
                          بستن
                        </button>`,
                        id: `assignment-${row.id}`,
                        title: `پیکربندی ${row.title} در ${lmsConnectionName}`,
                      })}

                      <form method="POST">
                        <input
                          type="hidden"
                          name="__csrf_token"
                          value="${resLocals.__csrf_token}"
                        />
                        <input type="hidden" name="unsafe_assessment_id" value="${row.id}" />
                        ${
                          lineitems_linked.length === 0
                            ? html`
                                <button
                                  class="btn btn-med-light"
                                  type="button"
                                  data-bs-toggle="modal"
                                  data-bs-target="#assignment-${row.id}"
                                >
                                  اتصال تکلیف
                                </button>
                              `
                            : html`
                                <div class="btn-group">
                                  <button class="btn btn-info" name="__action" value="send_grades">
                                    ارسال نمرات
                                  </button>
                                  <button
                                    type="button"
                                    class="btn btn-info dropdown-toggle dropdown-toggle-split"
                                    data-bs-toggle="dropdown"
                                    aria-expanded="false"
                                    aria-label="باز و بسته کردن منو"
                                  ></button>
                                  <ul class="dropdown-menu">
                                    ${
                                      hasMultipleLmsCourses
                                        ? html`
                                            <li>
                                              <button
                                                class="dropdown-item"
                                                name="__action"
                                                value="send_grades_all_lms_courses"
                                              >
                                                ارسال نمرات به همه درس‌های LMS
                                              </button>
                                            </li>
                                          `
                                        : ''
                                    }
                                    <li>
                                      <button
                                        class="dropdown-item"
                                        name="__action"
                                        value="unlink_assessment"
                                      >
                                        قطع اتصال تکلیف
                                      </button>
                                    </li>
                                  </ul>
                                </div>
                              `
                        }
                      </form>
                    </td>
                    <td class="align-middle">
                      ${lineitems_linked.map((i) =>
                        LineItem(i, resLocals.course_instance.display_timezone),
                      )}
                    </td>
                  </tr>
                `;
              })}
            </tbody>
          `;
        })}
      </table>
    </div>
  `;
}

function LineItem(item: Lti13Assessment, timezone: string) {
  return html`
    <span title="${item.lineitem_id_url}">${item.lineitem.label}</span>
    <p>
      <em>آخرین فعالیت: ${formatDateYMDHM(item.last_activity, timezone)}</em>
    </p>
  `;
}

export function LineitemsInputs(lineitems: Lineitems) {
  const disclaimer = html`
    <details>
      <summary>چرا تکلیف من اینجا نمایش داده نمی‌شود؟</summary>
      <p>
        سامانه فقط می‌تواند تکالیفی در LMS را دریافت کند که به سامانه متصل شده باشند.
      </p>
      <p>
        در Canvas، نوع ارسال تکلیف (Submission Type) را به «External Tool» تغییر دهید و نشانی External Tool را روی پیوند دانشجویی آزمون تنظیم کنید (این پیوند در صفحه تنظیمات مدرس آزمون قرار دارد). سپس به اینجا بازگردید و فهرست را بازنشانی کنید.
      </p>
    </details>
  `;
  if (lineitems.length === 0) {
    return html`
      <p>موردی یافت نشد.</p>
      ${disclaimer}
    `.toString();
  }
  return html`
    ${lineitems.map(
      (lineitem) => html`
        <div class="form-check">
          <label class="form-check-label">
            <input
              class="form-check-input"
              type="radio"
              name="lineitem_id"
              value="${lineitem.id}"
              required
            />
            <span title="${lineitem.id}">${lineitem.label}</span>
          </label>
        </div>
      `,
    )}
    <button name="__action" value="link_assessment" class="btn btn-primary">اتصال تکلیف</button>
    ${disclaimer}
  `.toString();
}
