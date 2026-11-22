import { compiledScriptTag } from '@prairielearn/compiled-assets';
import { html, unsafeHtml } from '@prairielearn/html';

import { GroupWorkInfoContainer } from '../../components/GroupWorkInfoContainer.js';
import { PageLayout } from '../../components/PageLayout.js';
import { type Assessment, type GroupConfig, type User } from '../../lib/db-types.js';
import type { GroupInfo } from '../../lib/groups.shared.js';
import type { ResLocalsForPage } from '../../lib/res-locals.js';

export function StudentAssessment({
  resLocals,
  groupConfig,
  groupInfo,
  userCanAssignRoles,
  customHonorCode,
}: {
  resLocals: ResLocalsForPage<'assessment'>;
  groupConfig?: GroupConfig;
  groupInfo?: GroupInfo | null;
  userCanAssignRoles?: boolean;
  customHonorCode: string;
}) {
  const { assessment_set, assessment, course, authz_result, user, __csrf_token } = resLocals;

  return PageLayout({
    resLocals,
    pageTitle: `${assessment_set.abbreviation}${assessment.number}: ${assessment.title}`,
    navContext: {
      type: 'student',
      page: 'assessment',
    },
    headContent: html`
      ${compiledScriptTag('studentAssessmentClient.ts')}
      <style>
        .honor-code :last-child {
          margin-bottom: 0;
        }
      </style>
    `,
    content: html`
      <div class="card mb-4">
        <div class="card-header bg-primary text-white d-flex align-items-center">
          <h1>${assessment_set.abbreviation}${assessment.number}: ${assessment.title}</h1>
          ${assessment.team_work ? html`&nbsp;<i class="fas fa-users"></i>` : ''}
        </div>

        <div class="card-body">
          ${
            authz_result.mode === 'Exam' || authz_result.password != null
              ? html`
                  <p class="lead text-center">لطفاً تا زمان اعلام شروع آزمون توسط مراقب منتظر بمانید</p>
                `
              : ''
          }

          <p class="lead text-center">
            این ارزیابی مربوط به
            <strong>${assessment_set.name} ${assessment.number}: ${assessment.title}</strong>
            برای درس <strong>${course.short_name}</strong> است.
          </p>

          ${
            authz_result.time_limit_min != null
              ? html`
                  <p class="lead text-center">
                    مدت زمان تعیین‌شده برای این ارزیابی
                    <strong>
                      ${authz_result.time_limit_min}
                      دقیقه
                    </strong>
                    است.
                  </p>
                `
              : ''
          }
          ${
            assessment.team_work
              ? StudentGroupControls({ groupConfig, groupInfo, userCanAssignRoles, resLocals })
              : StartAssessmentForm({
                  assessment,
                  user,
                  __csrf_token,
                  startAllowed: true,
                  customHonorCode,
                })
          }
        </div>
      </div>
    `,
  });
}

function StartAssessmentForm({
  assessment,
  user,
  __csrf_token,
  startAllowed,
  customHonorCode,
}: {
  assessment: Assessment;
  user: User;
  __csrf_token: string;
  startAllowed: boolean;
  customHonorCode?: string;
}) {
  return html`
    ${
      startAllowed && assessment.type === 'Exam' && assessment.require_honor_code
        ? HonorPledge({
            user,
            groupWork: !!assessment.team_work,
            customHonorCode,
          })
        : ''
    }
    <form
      id="confirm-form"
      name="confirm-form"
      method="POST"
      class="mt-4 d-flex justify-content-center"
    >
      <input type="hidden" name="__action" value="new_instance" />
      <input type="hidden" name="__csrf_token" value="${__csrf_token}" />
      <button
        id="start-assessment"
        type="submit"
        class="btn btn-primary"
        ${
          (assessment.type === 'Exam' && assessment.require_honor_code) || !startAllowed
            ? 'disabled'
            : ''
        }
      >
        شروع ارزیابی
      </button>
    </form>
  `;
}

function HonorPledge({
  user,
  groupWork,
  customHonorCode,
}: {
  user: User;
  groupWork: boolean;
  customHonorCode?: string;
}) {
  return html`
    <div class="card card-secondary mb-4" data-testid="honor-code">
      ${
        customHonorCode
          ? html`<div class="px-3 py-2 honor-code">${unsafeHtml(customHonorCode)}</div>`
          : html`<ul class="list-group list-group-flush">
              <li class="list-group-item py-2">
                تأیید می‌کنم که اینجانب ${user.name} هستم و ${groupWork ? 'گروه ما' : 'من'} مجاز به شرکت در این آزمون ${groupWork ? 'می‌باشیم' : 'می‌باشم'}.
              </li>
              <li class="list-group-item py-2">
                به شرافت خود سوگند یاد می‌کنم که در طول این آزمون هیچ‌گونه کمک غیرمجازی دریافت نکرده و به دیگران نخواهم رساند و تمام پاسخ‌های ارائه‌شده حاصل کار و تلاش ${groupWork ? 'گروه ما' : 'شخص من'} خواهد بود.
              </li>
            </ul>`
      }
      <div class="card-footer d-flex justify-content-center">
        <span class="form-check">
          <input type="checkbox" class="form-check-input" id="certify-pledge" />
          <label class="form-check-label fw-bold" for="certify-pledge">
            تعهدنامه و سوگند اخلاقی فوق را تأیید و امضا می‌نمایم.
          </label>
        </span>
      </div>
    </div>
  `;
}

function StudentGroupControls({
  groupConfig,
  groupInfo,
  userCanAssignRoles = false,
  resLocals,
}: {
  resLocals: ResLocalsForPage<'assessment'>;
  groupConfig?: GroupConfig;
  groupInfo?: GroupInfo | null;
  userCanAssignRoles?: boolean;
}) {
  if (groupConfig == null) return '';

  const { user, __csrf_token, assessment } = resLocals;
  if (groupInfo == null) {
    return GroupCreationJoinForm({ groupConfig, __csrf_token });
  }

  return html`
    ${GroupWorkInfoContainer({
      groupConfig,
      groupInfo,
      userCanAssignRoles,
      csrfToken: __csrf_token,
    })}
    ${StartAssessmentForm({ assessment, user, __csrf_token, startAllowed: groupInfo.start })}
    ${
      groupConfig.minimum != null && groupConfig.minimum > groupInfo.groupSize
        ? html`
            <p class="text-center">
              * حداقل تعداد اعضای گروه ${groupConfig.minimum} نفر است. برای شروع به حداقل ${groupConfig.minimum - groupInfo.groupSize} عضو دیگر نیاز دارید.
            </p>
          `
        : ''
    }
  `;
}

function GroupCreationJoinForm({
  groupConfig,
  __csrf_token,
}: {
  groupConfig: GroupConfig;
  __csrf_token: string;
}) {
  if (!groupConfig.student_authz_join && !groupConfig.student_authz_create) {
    return html`
      <p class="text-center">
        این یک ارزیابی گروهی است. لطفاً منتظر گروه‌بندی توسط استاد یا دستیار آموزشی بمانید.
      </p>
    `;
  }

  return html`
    <p class="text-center">
      ${
        (groupConfig.minimum ?? 0) > 1
          ? html`
              این یک ارزیابی گروهی است. هر گروه باید ${
                groupConfig.maximum != null
                  ? `بین ${groupConfig.minimum} تا ${groupConfig.maximum}`
                  : `حداقل شامل ${groupConfig.minimum}`
              } دانشجو باشد.
            `
          : html`
              این ارزیابی را می‌توان به صورت انفرادی یا گروهی انجام داد. ${
                groupConfig.maximum
                  ? `هر گروه حداکثر می‌تواند ${groupConfig.maximum} دانشجو داشته باشد.`
                  : ''
              }
              <br />برای فعالیت انفرادی نیز باید یک گروه تشکیل دهید اما نیازی به اشتراک‌گذاری کد عضویت آن با دیگران نیست.
            `
      }
    </p>
    <div class="container-fluid">
      <div class="row">
        ${
          groupConfig.student_authz_create
            ? html`
                <div class="col-sm bg-light py-4 px-4 border">
                  <form id="create-form" name="create-form" method="POST">
                    ${
                      groupConfig.student_authz_choose_name
                        ? html`
                            <label for="group-name-input">نام گروه</label>
                            <input
                              type="text"
                              class="form-control"
                              id="group-name-input"
                              name="group_name"
                              maxlength="30"
                              pattern="[a-zA-Z0-9]+"
                              placeholder="مثال: گروه۱"
                              aria-label="Group name"
                              aria-describedby="group-name-help"
                            />
                            <small id="group-name-help" class="form-text text-muted">
                              نام گروه فقط می‌تواند شامل حروف و اعداد باشد و حداکثر ۳۰ کاراکتر است. در صورت خالی گذاشتن، یک نام خودکار برای گروه شما انتخاب خواهد شد.
                            </small>
                          `
                        : ''
                    }
                    <div class="mt-4 d-flex justify-content-center">
                      <div class="mb-3">
                        <input type="hidden" name="__action" value="create_group" />
                        <input type="hidden" name="__csrf_token" value="${__csrf_token}" />
                        <button type="submit" class="btn btn-primary">ایجاد گروه جدید</button>
                      </div>
                    </div>
                  </form>
                </div>
              `
            : ''
        }
        ${
          groupConfig.student_authz_join
            ? html`
                <div class="col-sm bg-light py-4 px-4 border">
                  <form id="joingroup-form" name="joingroup-form" method="POST">
                    <label for="join-code-input">کد عضویت گروه</label>
                    <input
                      type="text"
                      class="form-control"
                      id="join-code-input"
                      name="join_code"
                      placeholder="abcd-1234"
                      pattern="[a-zA-Z0-9]+-[0-9]{4}"
                      maxlength="35"
                      required
                    />
                    <div class="mt-4 d-flex justify-content-center">
                      <div class="mb-3">
                        <input type="hidden" name="__action" value="join_group" />
                        <input type="hidden" name="__csrf_token" value="${__csrf_token}" />
                        <button type="submit" class="btn btn-primary">عضویت در گروه</button>
                      </div>
                    </div>
                  </form>
                </div>
              `
            : ''
        }
      </div>
    </div>
  `;
}
