import { type ReactNode } from 'react';

import { type AssessmentQuestion } from '../../lib/db-types.js';

interface StatDescription {
  field: keyof AssessmentQuestion;
  title: ReactNode;
  non_html_title: string;
  description: string;
}

export const STAT_DESCRIPTIONS: Record<string, StatDescription> = {
  MEAN_SCORE: {
    field: 'mean_question_score',
    title: <bdi>میانگین (μ)</bdi>,
    non_html_title: 'میانگین (μ)',
    description: 'میانگین نمره: میانگین نمرات تمامی دانشجویان در این سوال.',
  },
  MEDIAN_SCORE: {
    field: 'median_question_score',
    title: <bdi>میانه (Median)</bdi>,
    non_html_title: 'میانه (Median)',
    description:
      'میانه نمره: نمره‌ای که نمرات دانشجویان را به دو نیمه مساوی بالا و پایین تقسیم می‌کند.',
  },
  VARIANCE: {
    field: 'question_score_variance',
    title: <bdi>انحراف معیار (σ)</bdi>,
    non_html_title: 'انحراف معیار (σ)',
    description: 'انحراف معیار (σ): میزان پراکندگی نمرات دانشجویان در این سوال.',
  },
  DISCRIMINATION: {
    field: 'discrimination',
    title: <bdi>ضریب تمیز</bdi>,
    non_html_title: 'ضریب تمیز (Discrim)',
    description:
      'ضریب تمیز (Discrimination): ضریب همبستگی بین نمرات این سوال و نمرات کل آزمون (تفکیک دانشجویان قوی از ضعیف).',
  },
  SOME_SUBMISSION_PERCENTAGE: {
    field: 'some_submission_perc',
    title: <bdi>حداقل یک ارسال (%)</bdi>,
    non_html_title: 'حداقل یک ارسال (%)',
    description:
      'درصد حداقل یک ارسال: درصد دانشجویانی که حداقل یک پاسخ معتبر و قابل تصحیح خودکار ارسال نموده‌اند.',
  },
  SOME_PERFECT_SUBMISSION_PERCENTAGE: {
    field: 'some_perfect_submission_perc',
    title: <bdi>ارسال با نمره ۱۰۰٪ (%)</bdi>,
    non_html_title: 'ارسال با نمره ۱۰۰٪ (%)',
    description:
      'درصد نمره کامل: درصد دانشجویانی که پاسخی با نمره کامل تصحیح خودکار ارسال کرده‌اند.',
  },
  SOME_NONZERO_SUBMISSION_PERCENTAGE: {
    field: 'some_nonzero_submission_perc',
    title: <bdi>ارسال با نمره مثبت (%)</bdi>,
    non_html_title: 'ارسال با نمره مثبت (%)',
    description:
      'درصد نمره مثبت: درصد دانشجویانی که پاسخی با نمره بزرگتر از صفر ثبت نموده‌اند.',
  },
  AVERAGE_FIRST_SUBMISSION_SCORE: {
    field: 'average_first_submission_score',
    title: (
      <span dir="ltr">
        μ<sub>ارسال اول</sub>
      </span>
    ),
    non_html_title: 'میانگین نمره ارسال اول',
    description:
      'میانگین نمره ارسال اول: میانگین نمرات تصحیح خودکار در اولین ارسال میان دانشجویانی که حداقل یک پاسخ ثبت کرده‌اند.',
  },
  FIRST_SUBMISSION_SCORE_VARIANCE: {
    field: 'first_submission_score_variance',
    title: (
      <span dir="ltr">
        σ<sub>ارسال اول</sub>
      </span>
    ),
    non_html_title: 'انحراف معیار ارسال اول',
    description:
      'انحراف معیار ارسال اول: انحراف معیار نمرات اولین ارسال تصحیح خودکار دانشجویان.',
  },
  FIRST_SUBMISSION_SCORE_HIST: {
    field: 'first_submission_score_hist',
    title: <bdi>هیستوگرام ارسال اول</bdi>,
    non_html_title: 'هیستوگرام ارسال اول',
    description:
      'هیستوگرام ارسال اول: نمودار توزیع فراوانی نمرات اولین ارسال تصحیح خودکار.',
  },
  AVERAGE_LAST_SUBMISSION_SCORE: {
    field: 'average_last_submission_score',
    title: (
      <span dir="ltr">
        μ<sub>ارسال آخر</sub>
      </span>
    ),
    non_html_title: 'میانگین نمره ارسال آخر',
    description:
      'میانگین نمره ارسال آخر: میانگین نمرات تصحیح خودکار در آخرین ارسال میان دانشجویانی که حداقل یک پاسخ ثبت کرده‌اند.',
  },
  LAST_SUBMISSION_SCORE_VARIANCE: {
    field: 'last_submission_score_variance',
    title: (
      <span dir="ltr">
        σ<sub>ارسال آخر</sub>
      </span>
    ),
    non_html_title: 'انحراف معیار ارسال آخر',
    description:
      'انحراف معیار ارسال آخر: انحراف معیار نمرات آخرین ارسال تصحیح خودکار دانشجویان.',
  },
  LAST_SUBMISSION_SCORE_HIST: {
    field: 'last_submission_score_hist',
    title: <bdi>هیستوگرام ارسال آخر</bdi>,
    non_html_title: 'هیستوگرام ارسال آخر',
    description:
      'هیستوگرام ارسال آخر: نمودار توزیع فراوانی نمرات آخرین ارسال تصحیح خودکار.',
  },
  AVERAGE_MAX_SUBMISSION_SCORE: {
    field: 'average_max_submission_score',
    title: (
      <span dir="ltr">
        μ<sub>بهترین نمره</sub>
      </span>
    ),
    non_html_title: 'میانگین بهترین نمره',
    description:
      'میانگین بهترین نمره: میانگین بالاترین نمره تصحیح خودکار کسب‌شده توسط هر دانشجو.',
  },
  MAX_SUBMISSION_SCORE_VARIANCE: {
    field: 'max_submission_score_variance',
    title: (
      <span dir="ltr">
        σ<sub>بهترین نمره</sub>
      </span>
    ),
    non_html_title: 'انحراف معیار بهترین نمره',
    description:
      'انحراف معیار بهترین نمره: انحراف معیار بالاترین نمرات تصحیح خودکار.',
  },
  MAX_SUBMISSIONS_SCORE_HIST: {
    field: 'max_submission_score_hist',
    title: <bdi>هیستوگرام بهترین نمره</bdi>,
    non_html_title: 'هیستوگرام بهترین نمره',
    description:
      'هیستوگرام بهترین نمره: نمودار توزیع فراوانی بالاترین نمرات تصحیح خودکار هر دانشجو.',
  },
  AVERAGE_AVERAGE_SUBMISSION_SCORE: {
    field: 'average_average_submission_score',
    title: (
      <span dir="ltr">
        μ<sub>میانگین ارسال‌ها</sub>
      </span>
    ),
    non_html_title: 'میانگینِ میانگین ارسال‌ها',
    description:
      'میانگینِ میانگین ارسال‌ها: میانگین میانگین نمرات ارسال‌های هر دانشجو.',
  },
  AVERAGE_SUBMISSION_SCORE_VARIANCE: {
    field: 'average_submission_score_variance',
    title: (
      <span dir="ltr">
        σ<sub>میانگین ارسال‌ها</sub>
      </span>
    ),
    non_html_title: 'انحراف معیار میانگین ارسال‌ها',
    description:
      'واریانس میانگین ارسال‌ها: واریانس میانگین نمرات ارسال‌های تصحیح خودکار دانشجویان.',
  },
  AVERAGE_SUBMISSION_SCORE_HIST: {
    field: 'average_submission_score_hist',
    title: <bdi>هیستوگرام میانگین ارسال‌ها</bdi>,
    non_html_title: 'هیستوگرام میانگین ارسال‌ها',
    description:
      'هیستوگرام میانگین ارسال‌ها: نمودار توزیع فراوانی میانگین نمرات ارسال‌های هر دانشجو.',
  },
  SUBMISSION_SCORE_ARRAY_AVERAGES: {
    field: 'submission_score_array_averages',
    title: (
      <span dir="ltr">
        μ<sub>دنباله نمرات</sub>
      </span>
    ),
    non_html_title: 'میانگین دنباله نمرات ارسال',
    description:
      'دنباله نمرات ارسال: میانگین نمرات تصحیح خودکار در ارسال اول، دوم، سوم و... به ازای دانشجویان.',
  },
  INCREMENTAL_SUBMISSION_SCORE_ARRAY_AVERAGES: {
    field: 'incremental_submission_score_array_averages',
    title: (
      <span dir="ltr">
        μ<sub>رشد نمره ارسال</sub>
      </span>
    ),
    non_html_title: 'میانگین رشد نمره در ارسال‌ها',
    description:
      'دنباله رشد نمره: میانگین افزایش نمره تصحیح خودکار در ارسال‌های متوالی (ارسال nام منهای ارسال‌های پیشین).',
  },
  INCREMENTAL_SUBMISSION_SCORE_POINTS_AVERAGES: {
    field: 'incremental_submission_points_array_averages',
    title: (
      <span dir="ltr">
        μ<sub>امتیاز افزایشی</sub>
      </span>
    ),
    non_html_title: 'میانگین امتیاز افزایشی در ارسال‌ها',
    description:
      'دنباله امتیازات افزایشی: میانگین امتیاز اضافی کسب‌شده در ارسال‌های متوالی (مخصوص آزمون‌ها).',
  },
  AVERAGE_NUMBER_SUBMISSIONS: {
    field: 'average_number_submissions',
    title: (
      <span dir="ltr">
        μ<sub>تعداد ارسال‌ها</sub>
      </span>
    ),
    non_html_title: 'میانگین تعداد ارسال‌ها',
    description:
      'میانگین تعداد ارسال‌ها: میانگین دفعات تلاش و ارسال ثبت‌شده برای این سوال به ازای هر دانشجو.',
  },
  NUMBER_SUBMISSIONS_VARIANCE: {
    field: 'number_submissions_variance',
    title: (
      <span dir="ltr">
        σ<sub>تعداد ارسال‌ها</sub>
      </span>
    ),
    non_html_title: 'انحراف معیار تعداد ارسال‌ها',
    description:
      'انحراف معیار تعداد ارسال‌ها: انحراف معیار دفعات ارسال‌های ثبت‌شده توسط دانشجویان.',
  },
  NUMBER_SUBMISSIONS_HIST: {
    field: 'number_submissions_hist',
    title: <bdi>هیستوگرام تعداد ارسال‌ها</bdi>,
    non_html_title: 'هیستوگرام تعداد ارسال‌ها',
    description:
      'هیستوگرام تعداد ارسال‌ها: نمودار توزیع فراوانی تعداد ارسال‌های ثبت‌شده توسط دانشجویان.',
  },
  QUINTILE_SCORES_AS_ARRAY: {
    field: 'quintile_question_scores',
    title: <bdi>نمرات پنجک‌ها (Quintiles)</bdi>,
    non_html_title: 'نمرات پنجک‌ها (Quintiles)',
    description:
      'نمرات پنجک‌ها (Quintiles): میانگین نمرات تصحیح خودکار برای ۲۰٪ ضعیف‌ترین دانشجویان کلاس (چپ)، ۲۰٪ بعدی و... تا ۲۰٪ برتر کلاس (راست).',
  },
};
