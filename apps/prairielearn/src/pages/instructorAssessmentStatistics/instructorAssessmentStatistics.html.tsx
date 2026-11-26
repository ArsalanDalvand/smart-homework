import { range } from 'es-toolkit';
import { z } from 'zod';

import {
  SECOND_IN_MILLISECONDS,
  formatInterval,
} from '@prairielearn/formatter';
import { DateFromISOString, IdSchema } from '@prairielearn/zod';

import { FriendlyDate } from '../../components/FriendlyDate.js';
import { Scorebar } from '../../components/Scorebar.js';
import { formatJalaliFriendly } from '../../lib/jalali.js';
import {
  getAssessmentStatisticsDownloadUrl,
  getManualGradingAssessmentQuestionUrl,
  getQuestionUrl,
} from '../../lib/client/url.js';
import {
  AlternativePoolSchema,
  type Assessment,
  AssessmentInstanceSchema,
  AssessmentQuestionSchema,
  type AssessmentSet,
  type CourseInstance,
  CourseInstanceSchema,
  CourseSchema,
  QuestionSchema,
  TagSchema,
  TopicSchema,
  ZoneSchema,
} from '../../lib/db-types.js';
import { formatFloat } from '../../lib/format.js';
import { STAT_DESCRIPTIONS } from '../shared/assessmentStatDescriptions.js';

export const AssessmentScoreHistogramByDateSchema = z.object({
  date: DateFromISOString,
  number: z.number(),
  mean_score_perc: z.number(),
  histogram: z.array(z.number()),
});
type AssessmentScoreHistogramByDate = z.infer<typeof AssessmentScoreHistogramByDateSchema>;

export const UserScoreSchema = z.object({
  duration: AssessmentInstanceSchema.shape.duration,
  score_perc: AssessmentInstanceSchema.shape.score_perc,
});
type UserScore = z.infer<typeof UserScoreSchema>;

export const AssessmentQuestionStatsRowSchema = AssessmentQuestionSchema.extend({
  course_short_name: CourseSchema.shape.short_name,
  course_instance_short_name: CourseInstanceSchema.shape.short_name,
  assessment_label: z.string(),
  qid: QuestionSchema.shape.qid,
  question_title: QuestionSchema.shape.title,
  topic: TopicSchema,
  question_tags: z.array(TagSchema.shape.name),
  question_id: IdSchema,
  assessment_question_number: z.string(),
  alternative_pool_number: AlternativePoolSchema.shape.number,
  alternative_pool_size: z.number(),
  zone_title: ZoneSchema.shape.title,
  start_new_zone: z.boolean(),
  start_new_alternative_pool: z.boolean(),
});
export type AssessmentQuestionStatsRow = z.infer<typeof AssessmentQuestionStatsRowSchema>;

export interface Filenames {
  scoreStatsCsvFilename: string;
  durationStatsCsvFilename: string;
  statsByDateCsvFilename: string;
  questionStatsCsvFilename: string;
}

export function InstructorAssessmentStatistics({
  assessment,
  courseInstance,
  assessmentSet,
  hasCoursePermissionPreview,
  hasCoursePermissionEdit,
  hasCourseInstancePermissionEdit,
  csrfToken,
  assessmentScoreHistogramByDate,
  userScores,
  rows,
  filenames,
}: {
  assessment: Assessment;
  courseInstance: CourseInstance;
  assessmentSet: AssessmentSet;
  hasCoursePermissionPreview: boolean;
  hasCoursePermissionEdit: boolean;
  hasCourseInstancePermissionEdit: boolean;
  csrfToken: string;
  assessmentScoreHistogramByDate: AssessmentScoreHistogramByDate[];
  userScores: UserScore[];
  rows: AssessmentQuestionStatsRow[];
  filenames: Filenames;
}) {
  const histminiOptions = { width: 60, height: 20, ymax: 1 };
  // Use assessments.stats_last_updated (the time when we last updated
  // the _question_ statistics for this assessment). Note that this is
  // different to assessments.statistics_last_updated_at (the time we last
  // updated the assessment instance statistics stored in the assessments
  // row itself).
  const statsLastUpdated =
    assessment.stats_last_updated == null ? (
      'تاکنون محاسبه نشده'
    ) : (
      <FriendlyDate
        date={assessment.stats_last_updated}
        timezone={courseInstance.display_timezone}
      />
    );

  return (
    <>
      <h1 className="visually-hidden">
        آمار {assessmentSet.name} {assessment.number}
      </h1>

      <h2 className="h4">آمار و ارقام آزمون</h2>
      <div className="mb-4">
        <details open>
          <summary>آمار نمرات</summary>
          {assessment.score_stat_number > 0 ? (
            <>
              <div className="card-body">
                <div
                  className="js-histogram"
                  data-histogram={JSON.stringify(assessment.score_stat_hist)}
                  data-xgrid={JSON.stringify(range(0, 110, 10))}
                  data-options={JSON.stringify({
                    ymin: 0,
                    xlabel: 'نمره / درصد',
                    ylabel: 'تعداد دانشجویان',
                  })}
                />
              </div>

              <div className="table-responsive">
                <table
                  className="table table-sm table-hover"
                  aria-label="آمار نمرات آزمون"
                >
                  <tbody>
                    <tr>
                      <td>تعداد شرکت‌کنندگان (دانشجویان)</td>
                      <td>{assessment.score_stat_number}</td>
                    </tr>
                    <tr>
                      <td>میانگین نمرات</td>
                      <td>{Math.round(assessment.score_stat_mean)}%</td>
                    </tr>
                    <tr>
                      <td>انحراف معیار (SD)</td>
                      <td>{Math.round(assessment.score_stat_std)}%</td>
                    </tr>
                    <tr>
                      <td>میانه نمرات</td>
                      <td>{Math.round(assessment.score_stat_median)}%</td>
                    </tr>
                    <tr>
                      <td>حداقل نمره</td>
                      <td>{Math.round(assessment.score_stat_min)}%</td>
                    </tr>
                    <tr>
                      <td>حداکثر نمره</td>
                      <td>{Math.round(assessment.score_stat_max)}%</td>
                    </tr>
                    <tr>
                      <td>تعداد نمرات صفر (۰٪)</td>
                      <td>
                        {assessment.score_stat_n_zero} (
                        {Math.round(assessment.score_stat_n_zero_perc)}٪ از{' '}
                        {assessment.score_stat_number})
                      </td>
                    </tr>
                    <tr>
                      <td>تعداد نمرات کامل (۱۰۰٪)</td>
                      <td>
                        {assessment.score_stat_n_hundred} (
                        {Math.round(assessment.score_stat_n_hundred_perc)}٪ از{' '}
                        {assessment.score_stat_number})
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="card-footer">
                <small>
                  دریافت فایل داده‌های آماری:{' '}
                  <a
                    href={getAssessmentStatisticsDownloadUrl({
                      courseInstanceId: courseInstance.id,
                      assessmentId: assessment.id,
                      filename: filenames.scoreStatsCsvFilename,
                    })}
                    dir="ltr"
                  >
                    {filenames.scoreStatsCsvFilename}
                  </a>
                  . داده‌های خارج از بازه نمودار در آخرین ستون محاسبه شده‌اند.
                </small>
              </div>
            </>
          ) : (
            <div className="card-body">هیچ داده‌ای از شرکت دانشجویان ثبت نشده است.</div>
          )}
        </details>
        <details>
          <summary>آمار مدت زمان پاسخگویی</summary>
          {assessment.score_stat_number > 0 ? (
            <>
              <div className="card-body">
                <div
                  className="js-histogram"
                  data-histogram={JSON.stringify(assessment.duration_stat_hist)}
                  data-xgrid={JSON.stringify(
                    assessment.duration_stat_thresholds.map(
                      (durationMs) => durationMs / SECOND_IN_MILLISECONDS,
                    ),
                  )}
                  data-options={JSON.stringify({
                    ymin: 0,
                    xlabel: 'مدت زمان',
                    ylabel: 'تعداد دانشجویان',
                    xTickLabels: assessment.duration_stat_thresholds.map(durationLabel),
                  })}
                />
              </div>

              <div className="table-responsive">
                <table
                  className="table table-sm table-hover"
                  aria-label="آمار مدت زمان آزمون"
                >
                  <tbody>
                    <tr>
                      <td>میانگین زمان پاسخگویی</td>
                      <td>{formatInterval(assessment.duration_stat_mean)}</td>
                    </tr>
                    <tr>
                      <td>میانه زمان پاسخگویی</td>
                      <td>{formatInterval(assessment.duration_stat_median)}</td>
                    </tr>
                    <tr>
                      <td>حداقل زمان پاسخگویی</td>
                      <td>{formatInterval(assessment.duration_stat_min)}</td>
                    </tr>
                    <tr>
                      <td>حداکثر زمان پاسخگویی</td>
                      <td>{formatInterval(assessment.duration_stat_max)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="card-footer">
                <small>
                  دریافت فایل داده‌های آماری:{' '}
                  <a
                    href={getAssessmentStatisticsDownloadUrl({
                      courseInstanceId: courseInstance.id,
                      assessmentId: assessment.id,
                      filename: filenames.durationStatsCsvFilename,
                    })}
                    dir="ltr"
                  >
                    {filenames.durationStatsCsvFilename}
                  </a>
                  . داده‌های خارج از بازه نمودار در آخرین ستون محاسبه شده‌اند.
                </small>
              </div>
            </>
          ) : (
            <div className="card-body">هیچ داده‌ای از شرکت دانشجویان ثبت نشده است.</div>
          )}
        </details>
        <details>
          <summary>نمودار زمان پاسخگویی در برابر نمره</summary>
          {assessment.score_stat_number > 0 ? (
            <>
              <div className="card-body">
                <div
                  className="js-scatter"
                  data-xdata={JSON.stringify(
                    userScores.map((user) => (user.duration ?? 0) / SECOND_IN_MILLISECONDS),
                  )}
                  data-ydata={JSON.stringify(userScores.map((user) => user.score_perc))}
                  data-options={JSON.stringify({
                    xgrid: assessment.duration_stat_thresholds.map(
                      (durationMs) => durationMs / SECOND_IN_MILLISECONDS,
                    ),
                    ygrid: range(0, 110, 10),
                    xlabel: 'مدت زمان',
                    ylabel: 'نمره / درصد',
                    xTickLabels: assessment.duration_stat_thresholds.map(durationLabel),
                  })}
                />
              </div>

              <div className="card-footer">
                <small>
                  هر نقطه بیانگر آزمون یک دانشجو است. نقاط خارج از محدوده در حاشیه نمودار ترسیم شده‌اند.
                </small>
              </div>
            </>
          ) : (
            <div className="card-body">هیچ داده‌ای از شرکت دانشجویان ثبت نشده است.</div>
          )}
        </details>
        <details>
          <summary>آمار نمرات بر اساس تاریخ</summary>
          {assessment.score_stat_number > 0 ? (
            <>
              <div className="card-body">
                <div
                  className="js-parallel-histograms overflow-x-scroll overflow-y-hidden"
                  data-histograms={JSON.stringify(
                    assessmentScoreHistogramByDate.map((day) => ({
                      // The date is already extracted from the timestamp in the
                      // query and returned as UTC, so we can safely format it
                      // without worrying about timezones here.
                      label: formatJalaliFriendly(day.date, 'UTC', { dateOnly: true, includeTz: false }),
                      mean: day.mean_score_perc,
                      histogram: day.histogram,
                    })),
                  )}
                  data-options={JSON.stringify({
                    ygrid: range(0, 110, 10),
                    xgrid: assessmentScoreHistogramByDate.length,
                    xlabel: 'تاریخ شروع',
                    ylabel: 'نمره / درصد',
                    yTickLabels: range(100, -10, -10),
                    width: assessmentScoreHistogramByDate.length * 200,
                  })}
                />
              </div>

              <div className="card-footer">
                <small>
                  دریافت فایل داده‌های آماری:{' '}
                  <a
                    href={getAssessmentStatisticsDownloadUrl({
                      courseInstanceId: courseInstance.id,
                      assessmentId: assessment.id,
                      filename: filenames.statsByDateCsvFilename,
                    })}
                    dir="ltr"
                  >
                    {filenames.statsByDateCsvFilename}
                  </a>
                  .
                  <br />
                  هر ستون روزانه یک هیستوگرام از نمرات کسب‌شده در آن روز را نمایش می‌دهد.
                  خطوط افقی مشکی پررنگ، نشان‌دهنده میانگین نمرات در هر روز هستند.
                </small>
              </div>
            </>
          ) : (
            <div className="card-body">هیچ داده‌ای از شرکت دانشجویان ثبت نشده است.</div>
          )}
        </details>
      </div>

      <hr className="my-4" />
      <div className="d-flex flex-wrap align-items-center justify-content-between gap-2 mb-2">
        <h2 className="h4 mb-0">آمار و ارقام سوالات</h2>
        {hasCoursePermissionEdit ? (
          <div className="d-flex align-items-center gap-2">
            <span className="text-muted small">آخرین محاسبه: {statsLastUpdated}</span>
            <form method="post" className="mb-0">
              <input type="hidden" name="__action" value="refresh_stats" />
              <input type="hidden" name="__csrf_token" value={csrfToken} />
              <button type="submit" className="btn btn-sm btn-primary text-nowrap">
                <i className="fa fa-sync" aria-hidden="true" /> محاسبه مجدد
              </button>
            </form>
          </div>
        ) : null}
      </div>
      <div className="mb-4">
        <details open>
          <summary>آمار کلی سوالات</summary>
          <div className="table-responsive">
            <table
              className="table table-sm table-hover tablesorter"
              aria-label="آمار سوالات"
            >
              <thead>
                <tr>
                  <th className="text-center">سوال</th>
                  <th className="text-center">میانگین نمره</th>
                  <th className="text-center">ضریب تمیز</th>
                  <th className="text-center">تلاش‌های تصحیح خودکار</th>
                  <th className="text-center">پنجک‌ها</th>
                  <th>عملیات</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td>
                      {hasCoursePermissionPreview ? (
                        <a
                          href={getQuestionUrl({
                            courseInstanceId: courseInstance.id,
                            questionId: row.question_id,
                          })}
                        >
                          {row.assessment_question_number}. {row.question_title}
                        </a>
                      ) : (
                        <>
                          {row.assessment_question_number}. {row.question_title}
                        </>
                      )}
                    </td>
                    <td className="text-center align-middle">
                      <Scorebar
                        score={
                          row.mean_question_score == null
                            ? null
                            : Math.round(row.mean_question_score)
                        }
                      />
                    </td>
                    <td className="text-center align-middle">
                      <Scorebar
                        score={row.discrimination == null ? null : Math.round(row.discrimination)}
                      />
                    </td>
                    <td className="text-center">
                      {(row.max_auto_points ?? 0) > 0 ||
                      row.max_manual_points === 0 ||
                      (row.average_number_submissions ?? 0) > 0
                        ? formatFloat(row.average_number_submissions)
                        : '—'}
                    </td>
                    {row.quintile_question_scores !== null ? (
                      <td className="text-center">
                        <div
                          className="js-histmini"
                          data-data={JSON.stringify(row.quintile_question_scores)}
                          data-options={JSON.stringify({
                            ...histminiOptions,
                            ymax: 100,
                          })}
                        />
                      </td>
                    ) : (
                      <td className="text-center" />
                    )}
                    <td className="align-middle text-nowrap" style={{ width: '1em' }}>
                      {hasCourseInstancePermissionEdit ? (
                        <a
                          className="btn btn-xs btn-primary"
                          href={getManualGradingAssessmentQuestionUrl({
                            courseInstanceId: courseInstance.id,
                            assessmentId: assessment.id,
                            assessmentQuestionId: row.id,
                          })}
                        >
                          تصحیح دستی
                        </a>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="card-footer">
            <p className="mb-2">
              دریافت فایل داده‌های آماری:{' '}
              <a
                href={getAssessmentStatisticsDownloadUrl({
                  courseInstanceId: courseInstance.id,
                  assessmentId: assessment.id,
                  filename: filenames.questionStatsCsvFilename,
                })}
                class="fw-bold"
                dir="ltr"
              >
                {filenames.questionStatsCsvFilename}
              </a>
            </p>
            <div className="small">
              <ul className="mb-0">
                <li className="mb-1">
                  <strong>میانگین نمره:</strong> میانگین نمرات تمامی دانشجویان در این سوال. در یک آزمون متعادل، وجود سوالاتی با تنوع سختی (آسان با میانگین بالای ۹۰٪ و چالش‌برانگیز با میانگین زیر ۵۰٪) مطلوب است.
                </li>
                <li className="mb-1">
                  <strong>ضریب تمیز:</strong> ضریب همبستگی بین نمرات کسب‌شده در این سوال و نمره کل آزمون. این مقدار مطلوب است بالای ۲۰٪ باشد مگر برای سوالات بسیار ساده (میانگین بالای ۹۵٪). مقادیر بالاتر همواره بیانگر قدرت تفکیک بهتر دانشجویان قوی از ضعیف است.
                </li>
                <li className="mb-1">
                  <strong>تلاش‌های تصحیح خودکار:</strong> میانگین دفعات ارسال و تلاش خودکار دانشجویان برای حل سوال.
                </li>
                <li className="mb-1">
                  <strong>نمرات پنجک‌ها (Quintiles):</strong> میانگین نمرات سوال برای دانشجویان ۲۰٪ ضعیف‌تر (سمت چپ) تا ۲۰٪ برتر کلاس (سمت راست). در سوالات مطلوب، پنجک اول کمترین نمره و پنجک آخر بیشترین نمره را خواهد داشت.
                </li>
              </ul>
            </div>
          </div>
        </details>
        <details>
          <summary>نمودار سطح سختی در برابر تمیز سوالات</summary>
          {assessment.score_stat_number > 0 ? (
            <>
              <div className="card-body">
                <div
                  id="difficultyDiscriminationScatter"
                  className="js-scatter"
                  data-xdata={JSON.stringify(rows.map((q) => q.mean_question_score))}
                  data-ydata={JSON.stringify(rows.map((q) => q.discrimination))}
                  data-options={JSON.stringify({
                    xgrid: range(0, 110, 10),
                    ygrid: range(0, 110, 10),
                    xlabel: 'میانگین نمره / درصد',
                    ylabel: 'ضریب تمیز / درصد',
                    radius: 2,
                    topMargin: 30,
                    labels: rows.map((q) => q.assessment_question_number),
                  })}
                />
              </div>
              <div className="card-footer small">
                <ul className="mb-0">
                  <li className="mb-1">
                    <strong>میانگین نمره:</strong> میانگین نمرات تمامی دانشجویان در این سوال.
                  </li>
                  <li className="mb-1">
                    <strong>ضریب تمیز:</strong> ضریب همبستگی بین نمرات سوال و نمره نهایی آزمون جهت تفکیک دانشجویان.
                  </li>
                </ul>
              </div>
            </>
          ) : (
            <div className="card-body">هیچ داده‌ای از شرکت دانشجویان ثبت نشده است.</div>
          )}
        </details>
        <details>
          <summary>آمار و ارقام تفصیلی سوالات</summary>
          <div className="table-responsive">
            <table
              className="table table-sm table-hover tablesorter table-bordered"
              aria-label="آمار و ارقام تفصیلی سوالات"
            >
              <thead>
                <tr>
                  <th className="text-center">سوال</th>
                  {Object.keys(STAT_DESCRIPTIONS).map((stat) => {
                    if (
                      stat !== 'INCREMENTAL_SUBMISSION_SCORE_POINTS_AVERAGES' ||
                      assessment.type !== 'Homework'
                    ) {
                      return (
                        <th
                          key={stat}
                          className="text-center"
                          title={STAT_DESCRIPTIONS[stat].description}
                        >
                          {STAT_DESCRIPTIONS[stat].title}
                        </th>
                      );
                    }
                    return null;
                  })}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td className="text-nowrap">
                      {hasCoursePermissionPreview ? (
                        <a
                          href={getQuestionUrl({
                            courseInstanceId: courseInstance.id,
                            questionId: row.question_id,
                          })}
                        >
                          {row.assessment_question_number}. {row.qid}
                        </a>
                      ) : (
                        <>
                          {row.assessment_question_number}. {row.qid}
                        </>
                      )}
                    </td>
                    <td className="text-center">{formatFloat(row.mean_question_score, 1)}</td>
                    <td className="text-center">{formatFloat(row.median_question_score, 1)}</td>
                    <td className="text-center">{formatFloat(row.question_score_variance, 1)}</td>
                    <td className="text-center">{formatFloat(row.discrimination, 1)}</td>
                    {(row.max_auto_points ?? 0) > 0 || row.max_manual_points === 0 ? (
                      <>
                        <td className="text-center">{formatFloat(row.some_submission_perc, 1)}</td>
                        <td className="text-center">
                          {formatFloat(row.some_perfect_submission_perc, 1)}
                        </td>
                        <td className="text-center">
                          {formatFloat(row.some_nonzero_submission_perc, 1)}
                        </td>
                        <td className="text-center">
                          {formatFloat(row.average_first_submission_score, 2)}
                        </td>
                        <td className="text-center">
                          {formatFloat(row.first_submission_score_variance, 2)}
                        </td>
                        <td className="text-center">
                          {row.first_submission_score_hist !== null ? (
                            <div
                              className="js-histmini"
                              data-data={JSON.stringify(row.first_submission_score_hist)}
                              data-options={JSON.stringify({
                                ...histminiOptions,
                                normalize: true,
                              })}
                            />
                          ) : null}
                        </td>
                        <td className="text-center">
                          {formatFloat(row.average_last_submission_score, 2)}
                        </td>
                        <td className="text-center">
                          {formatFloat(row.last_submission_score_variance, 2)}
                        </td>
                        <td className="text-center">
                          {row.last_submission_score_hist !== null ? (
                            <div
                              className="js-histmini"
                              data-data={JSON.stringify(row.last_submission_score_hist)}
                              data-options={JSON.stringify({
                                ...histminiOptions,
                                normalize: true,
                              })}
                            />
                          ) : null}
                        </td>
                        <td className="text-center">
                          {formatFloat(row.average_max_submission_score, 2)}
                        </td>
                        <td className="text-center">
                          {formatFloat(row.max_submission_score_variance, 2)}
                        </td>
                        <td className="text-center">
                          {row.max_submission_score_hist !== null ? (
                            <div
                              className="js-histmini"
                              data-data={JSON.stringify(row.max_submission_score_hist)}
                              data-options={JSON.stringify({
                                ...histminiOptions,
                                normalize: true,
                              })}
                            />
                          ) : null}
                        </td>
                        <td className="text-center">
                          {formatFloat(row.average_average_submission_score, 2)}
                        </td>
                        <td className="text-center">
                          {formatFloat(row.average_submission_score_variance, 2)}
                        </td>
                        <td className="text-center">
                          {row.average_submission_score_hist !== null ? (
                            <div
                              className="js-histmini"
                              data-data={JSON.stringify(row.average_submission_score_hist)}
                              data-options={JSON.stringify({
                                ...histminiOptions,
                                normalize: true,
                              })}
                            />
                          ) : null}
                        </td>
                        <td className="text-center">
                          {row.submission_score_array_averages !== null ? (
                            <div
                              className="js-histmini"
                              data-data={JSON.stringify(row.submission_score_array_averages)}
                              data-options={JSON.stringify(histminiOptions)}
                            />
                          ) : null}
                        </td>
                        <td className="text-center">
                          {row.incremental_submission_score_array_averages !== null ? (
                            <div
                              className="js-histmini"
                              data-data={JSON.stringify(
                                row.incremental_submission_score_array_averages,
                              )}
                              data-options={JSON.stringify(histminiOptions)}
                            />
                          ) : null}
                        </td>
                        {assessment.type !== 'Homework' ? (
                          <td className="text-center">
                            {row.incremental_submission_points_array_averages != null ? (
                              <div
                                className="js-histmini"
                                data-data={JSON.stringify(
                                  row.incremental_submission_points_array_averages,
                                )}
                                data-options={JSON.stringify({
                                  ...histminiOptions,
                                  ymax: row.max_points,
                                })}
                              />
                            ) : null}
                          </td>
                        ) : null}
                        <td className="text-center">
                          {formatFloat(row.average_number_submissions, 2)}
                        </td>
                        <td className="text-center">
                          {formatFloat(row.number_submissions_variance, 2)}
                        </td>
                        <td className="text-center">
                          {row.number_submissions_hist !== null ? (
                            <div
                              className="js-histmini"
                              data-data={JSON.stringify(row.number_submissions_hist)}
                              data-options={JSON.stringify({
                                ...histminiOptions,
                                normalize: true,
                              })}
                            />
                          ) : null}
                        </td>
                        <td className="text-center">
                          {row.quintile_question_scores !== null ? (
                            <div
                              className="js-histmini"
                              data-data={JSON.stringify(row.quintile_question_scores)}
                              data-options={JSON.stringify({
                                ...histminiOptions,
                                ymax: 100,
                              })}
                            />
                          ) : null}
                        </td>
                      </>
                    ) : (
                      <td
                        className="text-center text-muted"
                        colSpan={assessment.type === 'Homework' ? 21 : 22}
                      >
                        سوال با تصحیح دستی
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="card-footer">
            <p className="mb-2">
              دریافت فایل داده‌های آماری:{' '}
              <a
                href={getAssessmentStatisticsDownloadUrl({
                  courseInstanceId: courseInstance.id,
                  assessmentId: assessment.id,
                  filename: filenames.questionStatsCsvFilename,
                })}
                class="fw-bold"
                dir="ltr"
              >
                {filenames.questionStatsCsvFilename}
              </a>
            </p>
            <div className="small">
              <ul className="mb-3">
                {Object.keys(STAT_DESCRIPTIONS).map((stat) => (
                  <li key={stat} className="mb-1">
                    <strong>{STAT_DESCRIPTIONS[stat].title}: </strong>{' '}
                    {STAT_DESCRIPTIONS[stat].description}
                  </li>
                ))}
              </ul>
              <p className="mb-0 text-muted">
                در صورتی که یک دانشجو این آزمون را چندین بار شرکت کرده باشد (برای مثال در آزمون‌های تمرینی)،
                محاسبه آمار و ارقام فوق ابتدا با میانگین‌گیری از آزمون‌های هر دانشجو و سپس میانگین‌گیری بین کل دانشجویان صورت می‌پذیرد.
              </p>
            </div>
          </div>
        </details>
      </div>
    </>
  );
}

function durationLabel(durationMs: number) {
  return formatInterval(durationMs).replaceAll(' ', '');
}
