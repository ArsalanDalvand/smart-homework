import { z } from 'zod';

import { html } from '@prairielearn/html';
import { renderHtml } from '@prairielearn/react';
import { IdSchema } from '@prairielearn/zod';

import { PageLayout } from '../../components/PageLayout.js';
import { compiledScriptTag } from '../../lib/assets.js';
import {
  AssessmentQuestionSchema,
  AssessmentSchema,
  AssessmentSetSchema,
  CourseInstanceSchema,
  CourseSchema,
  QuestionSchema,
  TagSchema,
  TopicSchema,
} from '../../lib/db-types.js';
import { formatFloat } from '../../lib/format.js';
import type { ResLocalsForPage } from '../../lib/res-locals.js';
import { STAT_DESCRIPTIONS } from '../shared/assessmentStatDescriptions.js';

export const AssessmentQuestionStatsRowSchema = AssessmentQuestionSchema.extend({
  course_short_name: CourseSchema.shape.short_name,
  course_instance_short_name: CourseInstanceSchema.shape.short_name,
  assessment_label: z.string(),
  assessment_color: AssessmentSetSchema.shape.color,
  assessment_id: IdSchema,
  assessment_type: AssessmentSchema.shape.type,
  course_instance_id: IdSchema,
  qid: QuestionSchema.shape.qid,
  question_title: QuestionSchema.shape.title,
  question_topic: TopicSchema.shape.name,
  question_tags: z.array(TagSchema.shape.name),
  assessment_question_number: z.string(),
});
export type AssessmentQuestionStatsRow = z.infer<typeof AssessmentQuestionStatsRowSchema>;

export function InstructorQuestionStatistics({
  questionStatsCsvFilename,
  rows,
  resLocals,
}: {
  questionStatsCsvFilename: string;
  rows: AssessmentQuestionStatsRow[];
  resLocals: ResLocalsForPage<'instructor-question'>;
}) {
  const histminiOptions = { width: 60, height: 20, ymax: 1 };

  return PageLayout({
    resLocals,
    pageTitle: 'آمار و ارقام سوال',
    navContext: {
      type: 'instructor',
      page: 'question',
      subPage: 'statistics',
    },
    options: {
      fullWidth: true,
      pageNote: resLocals.question.qid!,
    },
    headContent: compiledScriptTag('instructorQuestionStatisticsClient.ts'),
    content: html`
      <div class="card mb-4">
        <div class="card-header bg-primary text-white">
          <h1 class="h4 mb-0">آمار و ارقام تفصیلی آزمون‌ها برای سوال ${resLocals.question.qid}</h1>
        </div>

        <div class="table-responsive">
          <table
            class="table table-sm table-hover tablesorter table-bordered"
            aria-label="آمار و ارقام سوال به تفکیک آزمون‌ها"
          >
            <thead>
              <tr>
                <th class="text-center">دوره / ترم</th>
                <th class="text-center">آزمون</th>
                ${Object.values(STAT_DESCRIPTIONS).map((stat) => {
                  return html`
                    <th class="text-center text-nowrap" title="${stat.description}">
                      ${renderHtml(stat.title)}
                    </th>
                  `;
                })}
              </tr>
            </thead>
            <tbody>
              ${rows.map((row) => {
                return html`
                  <tr>
                    <td>${row.course_instance_short_name}</td>
                    <td style="width: 1%">
                      <a
                        href="/pl/course_instance/${row.course_instance_id}/instructor/assessment/${row.assessment_id}/"
                        class="btn btn-badge color-${row.assessment_color}"
                      >
                        ${row.assessment_label}
                      </a>
                    </td>
                    <td class="text-center">${formatFloat(row.mean_question_score, 1)}</td>
                    <td class="text-center">${formatFloat(row.median_question_score, 1)}</td>
                    <td class="text-center">${formatFloat(row.question_score_variance, 1)}</td>
                    <td class="text-center">${formatFloat(row.discrimination, 1)}</td>
                    <td class="text-center">${formatFloat(row.some_submission_perc, 1)}</td>
                    <td class="text-center">${formatFloat(row.some_perfect_submission_perc, 1)}</td>
                    <td class="text-center">${formatFloat(row.some_nonzero_submission_perc, 1)}</td>
                    <td class="text-center">
                      ${formatFloat(row.average_first_submission_score, 2)}
                    </td>
                    <td class="text-center">
                      ${formatFloat(row.first_submission_score_variance, 2)}
                    </td>
                    <td class="text-center">
                      ${
                        row.first_submission_score_hist !== null
                          ? html`
                              <div
                                class="js-histmini"
                                data-options="${JSON.stringify({
                                  ...histminiOptions,
                                  normalize: true,
                                })}"
                                data-data="${JSON.stringify(row.first_submission_score_hist)}"
                              ></div>
                            `
                          : ''
                      }
                    </td>
                    <td class="text-center">
                      ${formatFloat(row.average_last_submission_score, 2)}
                    </td>
                    <td class="text-center">
                      ${formatFloat(row.last_submission_score_variance, 2)}
                    </td>
                    <td class="text-center">
                      ${
                        row.last_submission_score_hist !== null
                          ? html`
                              <div
                                class="js-histmini"
                                data-options="${JSON.stringify({
                                  ...histminiOptions,
                                  normalize: true,
                                })}"
                                data-data="${JSON.stringify(row.last_submission_score_hist)}"
                              ></div>
                            `
                          : ''
                      }
                    </td>
                    <td class="text-center">${formatFloat(row.average_max_submission_score, 2)}</td>
                    <td class="text-center">
                      ${formatFloat(row.max_submission_score_variance, 2)}
                    </td>
                    <td class="text-center">
                      ${
                        row.max_submission_score_hist !== null
                          ? html`
                              <div
                                class="js-histmini"
                                data-options="${JSON.stringify({
                                  ...histminiOptions,
                                  normalize: true,
                                })}"
                                data-data="${JSON.stringify(row.max_submission_score_hist)}"
                              ></div>
                            `
                          : ''
                      }
                    </td>
                    <td class="text-center">
                      ${formatFloat(row.average_average_submission_score, 2)}
                    </td>
                    <td class="text-center">
                      ${formatFloat(row.average_submission_score_variance, 2)}
                    </td>
                    <td class="text-center">
                      ${
                        row.average_submission_score_hist !== null
                          ? html`
                              <div
                                class="js-histmini"
                                data-options="${JSON.stringify({
                                  ...histminiOptions,
                                  normalize: true,
                                })}"
                                data-data="${JSON.stringify(row.average_submission_score_hist)}"
                              ></div>
                            `
                          : ''
                      }
                    </td>
                    <td class="text-center">
                      ${
                        row.submission_score_array_averages !== null
                          ? html`
                              <div
                                class="js-histmini"
                                data-options="${JSON.stringify(histminiOptions)}"
                                data-data="${JSON.stringify(row.submission_score_array_averages)}"
                              ></div>
                            `
                          : ''
                      }
                    </td>
                    <td class="text-center">
                      ${
                        row.incremental_submission_score_array_averages !== null
                          ? html`
                              <div
                                class="js-histmini"
                                data-options="${JSON.stringify(histminiOptions)}"
                                data-data="${JSON.stringify(
                                  row.incremental_submission_score_array_averages,
                                )}"
                              ></div>
                            `
                          : ''
                      }
                    </td>
                    <td class="text-center">
                      ${
                        row.assessment_type !== 'Homework'
                          ? html`
                              ${
                                row.incremental_submission_points_array_averages != null
                                  ? html`
                                      <div
                                        class="js-histmini"
                                        data-options="${JSON.stringify({
                                          ...histminiOptions,
                                          ymax: row.max_points,
                                        })}"
                                        data-data="${JSON.stringify(
                                          row.incremental_submission_points_array_averages,
                                        )}"
                                      ></div>
                                    `
                                  : ''
                              }
                            `
                          : 'N/A'
                      }
                    </td>
                    <td class="text-center">${formatFloat(row.average_number_submissions, 2)}</td>
                    <td class="text-center">${formatFloat(row.number_submissions_variance, 2)}</td>
                    <td class="text-center">
                      ${
                        row.number_submissions_hist !== null
                          ? html`
                              <div
                                class="js-histmini"
                                data-options="${JSON.stringify({
                                  ...histminiOptions,
                                  normalize: true,
                                })}"
                                data-data="${JSON.stringify(row.number_submissions_hist)}"
                              ></div>
                            `
                          : ''
                      }
                    </td>
                    <td class="text-center">
                      ${
                        row.quintile_question_scores !== null
                          ? html`
                              <div
                                class="js-histmini"
                                data-options="${JSON.stringify({
                                  ...histminiOptions,
                                  ymax: 100,
                                })}"
                                data-data="${JSON.stringify(row.quintile_question_scores)}"
                              ></div>
                            `
                          : ''
                      }
                    </td>
                  </tr>
                `;
              })}
            </tbody>
          </table>
        </div>

        <div class="card-footer">
          <p class="mb-2">
            دریافت فایل داده‌های آماری:
            <a
              href="${resLocals.urlPrefix}/question/${
                resLocals.question.id
              }/statistics/${questionStatsCsvFilename}"
              class="fw-bold"
              dir="ltr"
            >
              ${questionStatsCsvFilename}
            </a>
          </p>
          <div class="small">
            <ul class="mb-3">
              ${Object.keys(STAT_DESCRIPTIONS).map((stat) => {
                return html`
                  <li class="mb-1">
                    <strong> ${renderHtml(STAT_DESCRIPTIONS[stat].title)}: </strong>
                    ${STAT_DESCRIPTIONS[stat].description}
                  </li>
                `;
              })}
            </ul>
            <p class="mb-0 text-muted">
              در صورتی که یک دانشجو این آزمون را چندین بار شرکت کرده باشد (برای مثال در آزمون‌های تمرینی)،
              محاسبه آمار و ارقام فوق ابتدا با میانگین‌گیری از آزمون‌های هر دانشجو و سپس میانگین‌گیری بین کل دانشجویان صورت می‌پذیرد.
            </p>
          </div>
        </div>
      </div>
    `,
  });
}
