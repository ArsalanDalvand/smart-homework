import { EncodedData } from '@prairielearn/browser-utils';
import { formatInterval } from '@prairielearn/formatter';
import { html } from '@prairielearn/html';
import { renderHtml } from '@prairielearn/react';
import { run } from '@prairielearn/run';

import { AssessmentModuleHeadingHtml } from '../../components/AssessmentModuleHeading.js';
import { AssessmentSetHeadingHtml } from '../../components/AssessmentSetHeading.js';
import { IssueBadgeHtml } from '../../components/IssueBadge.js';
import { ManualGradingBadgeHtml } from '../../components/ManualGradingBadge.js';
import { Modal } from '../../components/Modal.js';
import { PageLayout } from '../../components/PageLayout.js';
import { ScorebarHtml } from '../../components/Scorebar.js';
import { AssessmentShortNameDescription } from '../../components/ShortNameDescriptions.js';
import { SyncProblemButtonHtml } from '../../components/SyncProblemButton.js';
import { compiledScriptTag } from '../../lib/assets.js';
import { getCourseAdminQtiImportUrl } from '../../lib/client/url.js';
import { type AssessmentModule, type AssessmentSet } from '../../lib/db-types.js';
import type { ResLocalsForPage } from '../../lib/res-locals.js';
import { SHORT_NAME_PATTERN } from '../../lib/short-name.js';
import { type AssessmentRow, type AssessmentStatsRow } from '../../models/assessment.js';

import { type StatsUpdateData } from './instructorAssessments.types.js';

export function InstructorAssessments({
  resLocals,
  rows,
  assessmentIdsNeedingStatsUpdate,
  csvFilename,
  assessmentSets,
  assessmentModules,
  assessmentsGroupBy,
}: {
  resLocals: ResLocalsForPage<'assessment'>;
  rows: AssessmentRow[];
  assessmentIdsNeedingStatsUpdate: string[];
  csvFilename: string;
  assessmentSets: AssessmentSet[];
  assessmentModules: AssessmentModule[];
  assessmentsGroupBy: 'Set' | 'Module';
}) {
  const { urlPrefix, authz_data, course, course_instance, __csrf_token } = resLocals;
  const assessmentGroups: AssessmentRow[][] = [];
  rows.forEach((row) => {
    if (row.start_new_assessment_group || assessmentGroups.length === 0) {
      assessmentGroups.push([row]);
    } else {
      assessmentGroups[assessmentGroups.length - 1].push(row);
    }
  });

  return PageLayout({
    resLocals,
    pageTitle: 'تکالیف و آزمون‌ها',
    navContext: {
      type: 'instructor',
      page: 'instance_admin',
      subPage: 'assessments',
    },
    options: {
      fullWidth: true,
    },
    headContent: html`
      ${compiledScriptTag('instructorAssessmentsClient.ts')}
      ${EncodedData<StatsUpdateData>(
        { assessmentIdsNeedingStatsUpdate, urlPrefix },
        'stats-update-data',
      )}
    `,
    content: html`
      <div class="card mb-4">
        <div class="card-header bg-primary text-white d-flex align-items-center">
          <h1>تکالیف و آزمون‌ها</h1>
          ${
            authz_data.has_course_permission_edit && !course.example_course
              ? html`
                  <div class="d-flex gap-2 ms-auto">
                    <a
                      href="${getCourseAdminQtiImportUrl({ courseInstanceId: course_instance.id })}"
                      class="btn btn-sm btn-light"
                      aria-label="Import content"
                    >
                      <i class="bi bi-cloud-arrow-up" aria-hidden="true"></i>
                      <span class="d-none d-sm-inline">درون‌ریزی محتوا</span>
                    </a>
                    ${
                      rows.length > 0
                        ? html`
                            <button
                              type="button"
                              class="btn btn-sm btn-light"
                              data-bs-toggle="modal"
                              data-bs-target="#createAssessmentModal"
                              aria-label="Add assessment"
                            >
                              <i class="fa fa-plus" aria-hidden="true"></i>
                              <span class="d-none d-sm-inline">افزودن ارزیابی</span>
                            </button>
                          `
                        : ''
                    }
                  </div>
                `
              : ''
          }
        </div>
        ${
          rows.length > 0
            ? html`
                <div class="table-responsive">
                  <table class="table table-sm table-hover" aria-label="Assessments">
                    <thead>
                      <tr>
                        <th style="width: 1%"><span class="visually-hidden">Label</span></th>
                        <th><span class="visually-hidden">Title</span></th>
                        <th>کد اختصاری</th>
                        <th class="text-center">دانشجویان</th>
                        <th class="text-center">نمرات</th>
                        <th class="text-center">میانگین نمره</th>
                        <th class="text-center">میانگین زمان</th>
                      </tr>
                    </thead>
                    ${assessmentGroups.map(
                      (groupRows) => html`
                        <tbody>
                          <tr>
                            <th colspan="7" scope="rowgroup">
                              ${
                                assessmentsGroupBy === 'Set'
                                  ? AssessmentSetHeadingHtml({
                                      assessment_set: groupRows[0].assessment_set,
                                    })
                                  : AssessmentModuleHeadingHtml({
                                      assessment_module: groupRows[0].assessment_module,
                                    })
                              }
                            </th>
                          </tr>
                          ${groupRows.map(
                            (row) => html`
                              <tr id="row-${row.id}">
                                <td class="align-middle" style="width: 1%">
                                  <span class="badge color-${row.assessment_set.color}">
                                    ${row.label}
                                  </span>
                                </td>
                                <td class="align-middle">
                                  ${
                                    row.sync_errors
                                      ? SyncProblemButtonHtml({
                                          type: 'error',
                                          output: row.sync_errors,
                                        })
                                      : row.sync_warnings
                                        ? SyncProblemButtonHtml({
                                            type: 'warning',
                                            output: row.sync_warnings,
                                          })
                                        : ''
                                  }
                                  <a href="${urlPrefix}/assessment/${row.id}/">
                                    ${row.title}
                                    ${
                                      row.team_work
                                        ? html` <i class="fas fa-users" aria-hidden="true"></i> `
                                        : ''
                                    }
                                  </a>
                                  ${IssueBadgeHtml({
                                    count: row.open_issue_count,
                                    courseInstanceId: course_instance.id,
                                    issueAid: row.tid,
                                  })}
                                  ${
                                    resLocals.authz_data.has_course_instance_permission_view
                                      ? ManualGradingBadgeHtml({
                                          ungradedSubmissionCount:
                                            row.ungraded_manual_grading_submission_count,
                                          courseInstanceId: course_instance.id,
                                          assessmentId: row.id,
                                        })
                                      : ''
                                  }
                                </td>

                                <td class="align-middle">${row.tid}</td>

                                ${AssessmentStats({ row })}
                              </tr>
                            `,
                          )}
                        </tbody>
                      `,
                    )}
                  </table>
                </div>
                <div class="card-footer">
                  Download
                  <a href="${urlPrefix}/instance_admin/assessments/file/${csvFilename}">
                    ${csvFilename}
                  </a>
                  (includes more statistics columns than displayed above)
                </div>
              `
            : html`
                <div class="my-4 card-body text-center" style="text-wrap: balance;">
                  <p class="fw-bold">ارزیابی‌ای یافت نشد.</p>
                  <p class="mb-0">
                    هر ارزیابی مجموعه‌ای از سوالات و تمرین‌ها جهت سنجش و ارتقای یادگیری دانشجویان است.
                  </p>
                  <p>
                    اطلاعات بیشتر در
                    <a
                      href="https://docs.prairielearn.com/assessment/overview/"
                      target="_blank"
                      rel="noreferrer"
                      >assessments documentation</a
                    >.
                  </p>
                  ${run(() => {
                    if (course.example_course) {
                      return html`<p>You can't add assessments to the example course.</p>`;
                    }
                    if (!authz_data.has_course_permission_edit) {
                      return html`<p>ویرایشگران درس می‌توانند ارزیابی‌های جدید ایجاد نمایند.</p>`;
                    }
                    return html`
                      <button
                        type="button"
                        class="btn btn-sm btn-primary"
                        data-bs-toggle="modal"
                        data-bs-target="#createAssessmentModal"
                      >
                        <i class="fa fa-plus" aria-hidden="true"></i>
                        <span class="d-none d-sm-inline">افزودن ارزیابی</span>
                      </button>
                    `;
                  })}
                </div>
              `
        }
      </div>
    `,
    postContent: html`
      ${CreateAssessmentModal({
        csrfToken: __csrf_token,
        urlPrefix,
        assessmentSets,
        assessmentModules,
        assessmentsGroupBy,
      })}
    `,
  });
}

export function AssessmentStats({ row }: { row: AssessmentStatsRow }) {
  const spinner = html`
    <div class="spinner-border spinner-border-sm" role="status">
      <span class="visually-hidden">Loading...</span>
    </div>
  `;
  return html`
    <td class="text-center align-middle score-stat-number" style="white-space: nowrap;">
      ${row.needs_statistics_update ? spinner : row.score_stat_number}
    </td>

    <td class="text-center align-middle score-stat-score-hist" style="white-space: nowrap;">
      ${
        row.needs_statistics_update
          ? spinner
          : row.score_stat_number > 0
            ? html`
                <div
                  class="js-histmini d-inline-block"
                  data-data="${JSON.stringify(row.score_stat_hist)}"
                  data-options="${JSON.stringify({ width: 60, height: 20 })}"
                ></div>
              `
            : html`&mdash;`
      }
    </td>

    <td class="text-center align-middle score-stat-mean" style="white-space: nowrap;">
      ${
        row.needs_statistics_update
          ? spinner
          : row.score_stat_number > 0
            ? html`
                <div class="d-inline-block align-middle" style="min-width: 8em; max-width: 20em;">
                  ${ScorebarHtml(Math.round(row.score_stat_mean))}
                </div>
              `
            : html`&mdash;`
      }
    </td>

    <td class="text-center align-middle duration-stat-mean" style="white-space: nowrap;">
      ${
        row.needs_statistics_update
          ? spinner
          : row.score_stat_number > 0
            ? formatInterval(row.duration_stat_mean)
            : html`&mdash;`
      }
    </td>
  `;
}

function CreateAssessmentModal({
  csrfToken,
  urlPrefix,
  assessmentSets,
  assessmentModules,
  assessmentsGroupBy,
}: {
  csrfToken: string;
  urlPrefix: string;
  assessmentSets: AssessmentSet[];
  assessmentModules: AssessmentModule[];
  assessmentsGroupBy: 'Set' | 'Module';
}) {
  return Modal({
    id: 'createAssessmentModal',
    title: 'تعریف ارزیابی جدید',
    formMethod: 'POST',
    // TODO: if/when this page is converted to React, use `validateShortName`
    // from `../../lib/short-name.js` with react-hook-form to provide more specific
    // validation feedback (e.g., "cannot start with a slash").
    body: html`
      <div class="mb-3">
        <label class="form-label" for="title">عنوان ارزیابی</label>
        <input
          type="text"
          class="form-control"
          id="title"
          name="title"
          required
          aria-describedby="title_help"
        />
        <small id="title_help" class="form-text text-muted">
          عنوان کامل ارزیابی که برای کاربران نمایش داده می‌شود.
        </small>
      </div>
      <div class="mb-3">
        <label class="form-label" for="aid">کد اختصاری</label>
        <input
          type="text"
          class="form-control"
          id="aid"
          name="aid"
          required
          pattern="${SHORT_NAME_PATTERN}"
          aria-describedby="aid_help"
        />
        <small id="aid_help" class="form-text text-muted">
          ${renderHtml(<AssessmentShortNameDescription />)}
        </small>
      </div>
      <div class="mb-3">
        <label class="form-label" for="type">نوع ارزیابی</label>
        <select class="form-select" id="type" name="type" aria-describedby="type_help" required>
          <option value="Homework">تکلیف منزل (Homework)</option>
          <option value="Exam">امتحان (Exam)</option>
        </select>
        <small id="type_help" class="form-text text-muted">
          The type of the assessment. This can be either
          <a href="https://docs.prairielearn.com/assessment/configuration/#assessment-types">
            Homework or Exam</a
          >.
        </small>
      </div>
      <div class="mb-3">
        <label class="form-label" for="set">دسته‌بندی (Set)</label>
        <select class="form-select" id="set" name="set" aria-describedby="set_help" required>
          ${assessmentSets.map((set) => html`<option value="${set.name}">${set.heading}</option>`)}
        </select>
        <small id="set_help" class="form-text text-muted">
          The <a href="${urlPrefix}/course_admin/sets">assessment set</a> this assessment belongs
          to.
        </small>
      </div>
      ${
        assessmentsGroupBy === 'Module'
          ? html`
              <div class="mb-3">
                <label class="form-label" for="module">سرفصل / ماژول</label>
                <select
                  class="form-select"
                  id="module"
                  name="module"
                  aria-describedby="module_help"
                  required
                >
                  ${assessmentModules.map(
                    (module) => html`<option value="${module.name}">${module.name}</option>`,
                  )}
                </select>
                <small id="module_help" class="form-text text-muted">
                  The <a href="${urlPrefix}/course_admin/modules">module</a> this assessment belongs
                  to.
                </small>
              </div>
            `
          : ''
      }
    `,
    footer: html`
      <input type="hidden" name="__action" value="add_assessment" />
      <input type="hidden" name="__csrf_token" value="${csrfToken}" />
      <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">انصراف</button>
      <button type="submit" class="btn btn-primary">ایجاد ارزیابی</button>
    `,
  });
}
