import { filesize } from 'filesize';

import { escapeHtml, html } from '@prairielearn/html';

import { config } from '../lib/config.js';
import type { AssessmentInstance, File } from '../lib/db-types.js';

export function PersonalNotesPanel({
  fileList,
  courseInstanceId,
  assessment_instance,
  authz_result,
  variantId,
  allowNewUploads = true,
  lockdownBrowser = false,
  csrfToken,
  context,
}: {
  fileList: File[];
  courseInstanceId: string;
  assessment_instance: Pick<AssessmentInstance, 'id' | 'open'>;
  authz_result: Record<string, any>;
  variantId?: string;
  allowNewUploads?: boolean;
  /** Hides the file-picker form; its OS file dialog would let students open desktop files. */
  lockdownBrowser?: boolean;
  csrfToken: string;
  context: 'question' | 'assessment';
}) {
  return html`
    <div class="card mb-4" id="attach-file-panel">
      <div class="card-header bg-secondary text-white d-flex align-items-center">
        <i class="fas fa-paperclip me-2"></i>
        <h2>یادداشت‌های شخصی</h2>
      </div>
      ${
        fileList.length === 0
          ? html`<div class="card-body"><span class="text-muted small">یادداشتی پیوست نشده است.</span></div>`
          : html`
              <ul class="list-group list-group-flush">
                ${fileList.map(
                  (file) => html`
                    <li class="list-group-item d-flex align-items-center">
                      <a
                        class="text-break me-2"
                        href="/pl/course_instance/${courseInstanceId}/assessment_instance/${assessment_instance.id}/file/${file.id}/${file.display_filename}"
                        data-testid="attached-file"
                      >
                        ${file.display_filename}
                      </a>
                      ${
                        assessment_instance.open &&
                        authz_result.active &&
                        authz_result.authorized_edit &&
                        allowNewUploads &&
                        file.type === 'student_upload'
                          ? html`
                              <div class="ms-auto">
                                ${DeletePersonalNoteButton({ file, variantId, csrfToken })}
                              </div>
                            `
                          : ''
                      }
                    </li>
                  `,
                )}
              </ul>
            `
      }
      ${
        allowNewUploads
          ? html`
              <div class="card-footer">
                ${
                  !assessment_instance.open || !authz_result.active
                    ? html`
                        <p class="small mb-0">
                          به دلیل بسته بودن تکلیف/آزمون، امکان افزودن یا حذف یادداشت وجود ندارد.
                        </p>
                      `
                    : !authz_result.authorized_edit
                      ? html`
                          <div class="alert alert-warning mb-0" role="alert">
                            شما در حال مشاهده نمونه ${context === 'question' ? 'سوال' : 'تکلیف/آزمون'} کاربر دیگری هستید و مجاز به افزودن یا حذف یادداشت‌های شخصی نیستید.
                          </div>
                        `
                      : html`
                          ${lockdownBrowser ? '' : AttachFileForm({ variantId, csrfToken })}
                          ${UploadTextForm({
                            variantId,
                            csrfToken,
                            defaultFilename: getAvailableFilename(
                              fileList.map((file) => file.display_filename),
                            ),
                          })}
                        `
                }
              </div>
            `
          : ''
      }
    </div>
  `;
}

function AttachFileForm({ variantId, csrfToken }: { variantId?: string; csrfToken: string }) {
  return html`
    <div>
      <button
        class="btn btn-xs btn-secondary"
        type="button"
        data-bs-toggle="collapse"
        data-bs-target="#attachFileCollapse"
        aria-expanded="false"
        aria-controls="attachFileCollapse"
      >
        <i class="fa fa-paperclip me-1"></i> پیوست فایل <i class="far fa-caret-square-down ms-1"></i>
      </button>
      <div class="collapse" id="attachFileCollapse">
        <form
          class="attach-file-form mb-3"
          name="attach-file-form"
          method="POST"
          enctype="multipart/form-data"
        >
          <p class="small mt-3">
            فایل‌های پیوست‌شده در این بخش به عنوان یادداشت شخصی ذخیره می‌شوند و نقشی در نمره‌دهی ندارند.
          </p>
          <div class="mb-3">
            <label class="form-label" for="attachFileInput">انتخاب فایل</label>
            <input type="file" name="file" class="form-control" id="attachFileInput" />
            <small class="form-text text-muted">
              حداکثر حجم مجاز: ${filesize(config.fileUploadMaxBytes, { base: 10, round: 0 })}
            </small>
          </div>
          <div class="mb-3">
            <input type="hidden" name="__action" value="attach_file" />
            ${
              variantId != null
                ? html`<input type="hidden" name="__variant_id" value="${variantId}" />`
                : ''
            }
            <input type="hidden" name="__csrf_token" value="${csrfToken}" />
            <button type="submit" class="btn btn-primary" disabled>بارگذاری پیوست</button>
          </div>
        </form>

        <script type="module">
          // This script is type="module" so that it is deferred and runs after the DOM is ready.
          const form = document.querySelector('form.attach-file-form');
          const fileInput = form.querySelector('#attachFileInput');
          const submitButton = form.querySelector('button[type="submit"]');
          fileInput.addEventListener('change', (e) => {
            // Only enable the "submit" button if a file is selected.
            submitButton.disabled = fileInput.files.length === 0;
          });
        </script>
      </div>
    </div>
  `;
}

function UploadTextForm({
  variantId,
  csrfToken,
  defaultFilename,
}: {
  variantId?: string;
  csrfToken: string;
  defaultFilename: string;
}) {
  return html`
    <div>
      <button
        class="btn btn-xs btn-secondary"
        type="button"
        data-bs-toggle="collapse"
        data-bs-target="#attachTextCollapse"
        aria-expanded="false"
        aria-controls="attachTextCollapse"
      >
        <i class="fa fa-sticky-note me-1"></i> افزودن یادداشت متنی <i class="far fa-caret-square-down ms-1"></i>
      </button>
      <div class="collapse" id="attachTextCollapse">
        <form method="POST" class="attach-text-form">
          <p class="small mt-3">
            یادداشت‌های متنی ذخیره‌شده صرفاً برای مرور و استفاده شخصی شماست و در نمره‌دهی تاثیری ندارد.
          </p>
          <input
            type="text"
            class="form-control"
            aria-label="نام فایل یادداشت"
            name="filename"
            value="${defaultFilename}"
          />
          <div class="mt-1 mb-3">
            <textarea
              class="form-control"
              rows="5"
              aria-label="محتوای یادداشت"
              name="contents"
              placeholder="متن یادداشت یا نکات خود را اینجا تایپ کنید..."
            ></textarea>
          </div>
          ${
            variantId != null
              ? html`<input type="hidden" name="__variant_id" value="${variantId}" />`
              : ''
          }
          <input type="hidden" name="__csrf_token" value="${csrfToken}" />
          <button type="submit" class="btn btn-sm btn-primary" name="__action" value="attach_text">
            ذخیره یادداشت
          </button>
        </form>
      </div>
    </div>
  `;
}

function DeletePersonalNoteButton({
  file,
  variantId,
  csrfToken,
}: {
  file: File;
  variantId?: string;
  csrfToken: string;
}) {
  const popoverContent = html`
    <form name="attach-file-delete-form" method="POST">
      <p>آیا از حذف <strong>${file.display_filename}</strong> اطمینان دارید؟</p>
      <input type="hidden" name="__action" value="delete_file" />
      <input type="hidden" name="__csrf_token" value="${csrfToken}" />
      ${
        variantId != null
          ? html`<input type="hidden" name="__variant_id" value="${variantId}" />`
          : ''
      }
      <input type="hidden" name="file_id" value="${file.id}" />
      <div class="text-end">
        <button type="button" class="btn btn-secondary" data-bs-dismiss="popover">انصراف</button>
        <button type="submit" class="btn btn-primary">حذف</button>
      </div>
    </form>
  `;

  return html`
    <button
      class="btn btn-xs btn-secondary"
      aria-label="حذف یادداشت شخصی ${file.display_filename}"
      data-bs-toggle="popover"
      data-bs-container="body"
      data-bs-html="true"
      data-bs-placement="auto"
      data-bs-title="تایید حذف"
      data-bs-content="${escapeHtml(popoverContent)}"
      data-testid="delete-personal-note-button"
    >
      <i class="far fa-trash-alt"></i>
    </button>
  `;
}

/**
 * Returns a display filename for notes file that does not collide with any existing name
 */
function getAvailableFilename(existingNames: Iterable<string>): string {
  const taken = new Set(existingNames);
  if (!taken.has('notes.txt')) return 'notes.txt';

  for (let n = 2; ; n++) {
    const candidate = `notes${n}.txt`;
    if (!taken.has(candidate)) return candidate;
  }
}
