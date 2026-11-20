import { filesize } from 'filesize';
import { z } from 'zod';

import { formatDate } from '@prairielearn/formatter';
import { escapeHtml, html } from '@prairielearn/html';
import { IdSchema } from '@prairielearn/zod';

import { JobStatusHtml } from '../../components/JobStatus.js';
import { PageLayout } from '../../components/PageLayout.js';
import { getCourseAdminQuestionsUrl } from '../../lib/client/url.js';
import { config } from '../../lib/config.js';
import { type Course, JobSequenceSchema, QuestionSchema, UserSchema } from '../../lib/db-types.js';
import type { ResLocalsForPage } from '../../lib/res-locals.js';

export const ImageRowSchema = z.object({
  image: z.string(),
  questions: z.object({ id: IdSchema, qid: QuestionSchema.shape.qid }).array(),
  external_grading_questions: z.object({ id: IdSchema, qid: QuestionSchema.shape.qid }).array(),
  workspace_questions: z.object({ id: IdSchema, qid: QuestionSchema.shape.qid }).array(),
  tag: z.string().optional(),
  imageSyncNeeded: z.boolean().optional(),
  invalid: z.boolean().optional(),
  digest: z.string().optional(),
  size: z.number().optional(),
  pushed_at: z.date().nullish(),
});
type ImageRow = z.infer<typeof ImageRowSchema>;

export const JobSequenceRowSchema = JobSequenceSchema.extend({
  user_uid: UserSchema.shape.uid.nullable(),
});
type JobSequenceRow = z.infer<typeof JobSequenceRowSchema>;

export function CourseSyncs({
  resLocals,
  images,
  jobSequences,
  jobSequenceCount,
  showAllJobSequences,
}: {
  resLocals: ResLocalsForPage<'course' | 'course-instance'>;
  images: ImageRow[];
  jobSequences: JobSequenceRow[];
  jobSequenceCount: number;
  showAllJobSequences: boolean;
}) {
  const { course, __csrf_token, urlPrefix } = resLocals;
  const courseInstanceId = resLocals.course_instance?.id;

  return PageLayout({
    resLocals,
    pageTitle: 'همگام‌سازی محتوای درس',
    navContext: {
      type: 'instructor',
      page: 'course_admin',
      subPage: 'syncs',
    },
    options: {
      fullWidth: true,
    },
    content: html`
      <h1 class="visually-hidden">همگام‌سازی محتوای درس</h1>
      <div class="card mb-4" style="font-family: var(--font-persian);">
        <div class="card-header bg-primary text-white">
          <h2 class="h5 mb-0">وضعیت مخزن کدهای درس</h2>
        </div>
        <div class="table-responsive">
          <table class="table table-sm" aria-label="وضعیت مخزن کدهای درس">
            <tbody>
              <tr>
                <th class="align-middle w-25">شناسه آخرین کامیت (Commit Hash)</th>
                <td colspan="2"><span class="font-monospace" dir="ltr">${course.commit_hash ?? html`&mdash;`}</span></td>
              </tr>
              <tr>
                <th class="align-middle">مسیر پوشه روی دیسک سرور</th>
                <td class="align-middle font-monospace" dir="ltr">${course.path}</td>
                <td class="text-end">
                  <form name="confirm-form" method="POST">
                    <input type="hidden" name="__action" value="status" />
                    <input type="hidden" name="__csrf_token" value="${__csrf_token}" />
                    <button type="submit" class="btn btn-sm btn-primary">
                      <i class="fa fa-info-circle me-1" aria-hidden="true"></i>
                      مشاهده وضعیت گیت سرور
                    </button>
                  </form>
                </td>
              </tr>
              <tr>
                <th class="align-middle">مخزن ریموت گیت‌هاب / گیت‌لب</th>
                <td class="align-middle font-monospace" dir="ltr">${course.repository ?? html`&mdash;`}</td>
                <td class="text-end">
                  ${
                    config.devMode
                      ? html`
                          <span
                            class="d-inline-block"
                            tabindex="0"
                            data-bs-toggle="tooltip"
                            data-bs-title="دریافت از مخزن ریموت در حالت توسعه (Dev Mode) پشتیبانی نمی‌شود."
                          >
                            <button type="button" class="btn btn-sm btn-primary" disabled>
                              <i class="fa fa-cloud-download-alt me-1" aria-hidden="true"></i>
                              دریافت تغییرات از مخزن ریموت (Git Pull)
                            </button>
                          </span>
                        `
                      : html`
                          <form name="confirm-form" method="POST">
                            <input type="hidden" name="__action" value="pull" />
                            <input type="hidden" name="__csrf_token" value="${__csrf_token}" />
                            <button type="submit" class="btn btn-sm btn-primary">
                              <i class="fa fa-cloud-download-alt me-1" aria-hidden="true"></i>
                              دریافت تغییرات از مخزن ریموت (Git Pull)
                            </button>
                          </form>
                        `
                  }
                </td>
              </tr>
              <tr>
                <th class="align-middle">شاخه فعال (Branch)</th>
                <td colspan="2"><span class="font-monospace" dir="ltr">${course.branch}</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="card mb-4" style="font-family: var(--font-persian);">
        <div class="card-header bg-primary text-white">
          <h2 class="h5 mb-0">ایمیج‌های داکر داوری خودکار</h2>
        </div>
        ${ImageTable({ images, course, courseInstanceId, urlPrefix, __csrf_token })}
      </div>

      <div class="card mb-4" style="font-family: var(--font-persian);">
        <div class="card-header bg-primary text-white">
          <h2 class="h5 mb-0">تاریخچه عملیات همگام‌سازی</h2>
        </div>
        <div class="table-responsive">
          <table class="table table-sm table-hover" aria-label="تاریخچه عملیات همگام‌سازی">
            <thead>
              <tr>
                <th>شماره</th>
                <th>تاریخ و زمان</th>
                <th>شرح عملیات</th>
                <th>کاربر اجراکننده</th>
                <th>وضعیت</th>
                <th>عملیات</th>
              </tr>
            </thead>
            <tbody>
              ${jobSequences.map(
                (jobSequence) => html`
                  <tr>
                    <td>${jobSequence.number}</td>
                    <td dir="ltr" class="text-end">
                      ${
                        jobSequence.start_date == null
                          ? html`&mdash;`
                          : formatDate(jobSequence.start_date, course.display_timezone)
                      }
                    </td>
                    <td>${jobSequence.description}</td>
                    <td>${jobSequence.user_uid ?? '(سیستم)'}</td>
                    <td>${JobStatusHtml({ status: jobSequence.status })}</td>
                    <td>
                      <a
                        href="${urlPrefix}/jobSequence/${jobSequence.id}"
                        class="btn btn-xs btn-info"
                      >
                        جزئیات
                      </a>
                    </td>
                  </tr>
                `,
              )}
            </tbody>
          </table>
        </div>
        ${
          !showAllJobSequences && jobSequenceCount > jobSequences.length
            ? html`
                <div class="card-footer text-muted small">
                  نمایش ${jobSequences.length} از ${jobSequenceCount} عملیات همگام‌سازی.
                  <a href="?all" aria-label="مشاهده تمامی عملیات همگام‌سازی" class="ms-1">مشاهده همه</a>
                </div>
              `
            : ''
        }
      </div>
    `,
  });
}

function ImageTable({
  images,
  course,
  courseInstanceId,
  urlPrefix,
  __csrf_token,
}: {
  images: ImageRow[];
  course: Course;
  courseInstanceId?: string;
  urlPrefix: string;
  __csrf_token: string;
}) {
  if (images.length === 0) {
    return html`<div class="card-body"><em>هیچ سوالی از ایمیج‌های داکر داوری استفاده نمی‌کند.</em></div>`;
  }

  return html`
    <div class="table-responsive">
      <table class="table table-sm" aria-label="ایمیج‌های داکر داوری خودکار">
        <thead>
          <tr>
            <th>نام ایمیج</th>
            <th>تگ (Tag)</th>
            <th>هش شناسه (Digest)</th>
            <th>حجم ایمیج</th>
            <th>آخرین همگام‌سازی</th>
            <th>عملیات</th>
            <th>مورد استفاده در</th>
          </tr>
        </thead>
        <tbody>
          ${images.map(
            (image) => html`
              <tr>
                <td>
                  <div class="d-flex flex-row align-items-center">
                    <span class="me-2 font-monospace" dir="ltr">${image.image}</span>
                    ${
                      image.invalid
                        ? html`<span class="badge text-bg-danger">نام ایمیج نامعتبر است</span>`
                        : ''
                    }
                  </div>
                </td>
                <td><span class="font-monospace" dir="ltr">${image.tag}</span></td>
                <td>
                  ${
                    image.digest
                      ? html`
                          <code class="mb-0" dir="ltr" title="${image.digest}">
                            ${
                              image.digest.length <= 24
                                ? image.digest
                                : `${image.digest.slice(0, 24)}...`
                            }
                          </code>
                        `
                      : html`&mdash;`
                  }
                </td>
                <td dir="ltr" class="text-end">${(image.size ?? 0) > 0 ? filesize(image.size ?? 0) : ''}</td>
                <td dir="ltr" class="text-end">
                  ${
                    image.imageSyncNeeded
                      ? html`<span class="text-warning">در رجیستری محلی یافت نشد</span>`
                      : image.pushed_at
                        ? formatDate(image.pushed_at, course.display_timezone)
                        : html`&mdash;`
                  }
                </td>
                <td>
                  ${
                    config.cacheImageRegistry
                      ? html`
                          <form method="POST">
                            <input type="hidden" name="__csrf_token" value="${__csrf_token}" />
                            <input type="hidden" name="__action" value="syncImage" />
                            <input type="hidden" name="single_image" value="${image.image}" />
                            <button type="submit" class="btn btn-xs btn-primary">
                              <i class="fa fa-sync me-1" aria-hidden="true"></i> همگام‌سازی
                            </button>
                          </form>
                        `
                      : ''
                  }
                </td>
                <td>
                  ${
                    image.questions.length > 0
                      ? html`
                          ${QuestionUsageLink({
                            courseId: course.id,
                            courseInstanceId,
                            image: image.image,
                            questions: image.external_grading_questions,
                            filterType: 'external_grading_image',
                            label: 'داوری خودکار خارجی',
                          })}
                          ${QuestionUsageLink({
                            courseId: course.id,
                            courseInstanceId,
                            image: image.image,
                            questions: image.workspace_questions,
                            filterType: 'workspace_image',
                            label: 'میزکار ابری',
                          })}

                          <button
                            type="button"
                            class="btn btn-xs btn-secondary"
                            data-bs-toggle="popover"
                            data-bs-container="body"
                            data-bs-html="true"
                            data-bs-title="سوالات استفاده‌کننده از ${image.image}"
                            data-bs-content="${escapeHtml(
                              ListQuestionsPopover({ image, urlPrefix }),
                            )}"
                          >
                            مشاهده
                          </button>
                        `
                      : 'هیچ سوالی'
                  }
                </td>
              </tr>
            `,
          )}
        </tbody>
      </table>
    </div>
    ${
      config.cacheImageRegistry
        ? html`
            <div class="card-footer">
              <form name="confirm-form" method="POST">
                <input type="hidden" name="__action" value="syncImages" />
                <input type="hidden" name="__csrf_token" value="${__csrf_token}" />
                <button type="submit" class="btn btn-sm btn-primary">
                  <i class="fa fa-sync me-1" aria-hidden="true"></i>
                  همگام‌سازی تمامی ایمیج‌ها با رجیستری محلی
                </button>
              </form>
            </div>
          `
        : ''
    }
  `;
}

function QuestionUsageLink({
  courseId,
  courseInstanceId,
  image,
  questions,
  filterType,
  label,
}: {
  courseId: string;
  courseInstanceId?: string;
  image: string;
  questions: ImageRow['questions'];
  filterType: 'external_grading_image' | 'workspace_image';
  label: string;
}) {
  if (questions.length === 0) return '';

  return html`
    <div>
      ${label}:
      <a
        href="${getCourseAdminQuestionsUrl({
          courseId,
          courseInstanceId,
          filter: { type: filterType, value: image },
        })}"
      >
        ${questions.length} سوال
      </a>
    </div>
  `;
}

function ListQuestionsPopover({ image, urlPrefix }: { image: ImageRow; urlPrefix: string }) {
  return html`
    <div>
      <ul>
        ${image.questions
          .slice(0, 5)
          .map(
            (question) => html`
              <li><a href="${urlPrefix}/question/${question.id}">${question.qid}</a></li>
            `,
          )}
      </ul>
      ${image.questions.length > 5 ? html`و ${image.questions.length - 5} سوال دیگر&hellip;` : ''}
    </div>
  `;
}
