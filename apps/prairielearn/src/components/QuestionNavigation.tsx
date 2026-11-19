import { type HtmlValue, html } from '@prairielearn/html';

type QuestionAccessMode =
  | 'default'
  | 'blocked_sequence'
  | 'blocked_lockpoint'
  | 'read_only_lockpoint';

export function QuestionNavSideGroup({
  urlPrefix,
  assessmentInstanceId,
  prevInstanceQuestionId,
  nextInstanceQuestionId,
  nextQuestionAccessMode,
  prevGroupRolePermissions,
  nextGroupRolePermissions,
  advanceScorePerc,
  userGroupRoles,
}: {
  urlPrefix: string;
  assessmentInstanceId: string;
  prevInstanceQuestionId: string | null;
  nextInstanceQuestionId: string | null;
  nextQuestionAccessMode: QuestionAccessMode | null;
  prevGroupRolePermissions: { can_view?: boolean } | null | undefined;
  nextGroupRolePermissions: { can_view?: boolean } | null | undefined;
  advanceScorePerc: number | null;
  userGroupRoles: string | null;
}) {
  return html`
    <div class="text-center mb-2">
      ${QuestionNavSideButton({
        instanceQuestionId: prevInstanceQuestionId,
        urlPrefix,
        assessmentInstanceId,
        whichButton: 'previous',
        groupRolePermissions: prevGroupRolePermissions,
        userGroupRoles,
      })}
      ${QuestionNavSideButton({
        instanceQuestionId: nextInstanceQuestionId,
        nextQuestionAccessMode,
        urlPrefix,
        assessmentInstanceId,
        whichButton: 'next',
        groupRolePermissions: nextGroupRolePermissions,
        advanceScorePerc,
        userGroupRoles,
      })}
    </div>
  `;
}

export function QuestionNavSideButton({
  instanceQuestionId,
  nextQuestionAccessMode,
  urlPrefix,
  assessmentInstanceId,
  whichButton,
  groupRolePermissions,
  advanceScorePerc,
  userGroupRoles,
}: {
  instanceQuestionId: string | null;
  nextQuestionAccessMode?: QuestionAccessMode | null;
  groupRolePermissions: { can_view?: boolean } | null | undefined;
  whichButton: 'next' | 'previous';
  urlPrefix: string;
  assessmentInstanceId: string;
  advanceScorePerc?: number | null;
  userGroupRoles: string | null;
}) {
  const { buttonId, buttonContent } =
    whichButton === 'next'
      ? { buttonId: 'question-nav-next', buttonContent: html`سوال بعدی <i class="fa fa-arrow-left ms-1"></i>` }
      : { buttonId: 'question-nav-prev', buttonContent: html`<i class="fa fa-arrow-right me-1"></i> سوال قبلی` };
  let disabledExplanation: HtmlValue | null = null;

  if (instanceQuestionId != null) {
    if (groupRolePermissions?.can_view === false) {
      disabledExplanation = html`دسترسی به این سوال برای نقش شما محدود است.`;
    } else if (nextQuestionAccessMode === 'blocked_sequence') {
      disabledExplanation = html`برای باز شدن سوال بعدی باید حداقل <b>${advanceScorePerc}%</b> نمره این سوال را کسب کنید.`;
    } else if (nextQuestionAccessMode === 'blocked_lockpoint') {
      disabledExplanation = html`از بخش <a href="${urlPrefix}/assessment_instance/${assessmentInstanceId}/">نمای کلی ارزیابی</a> مرحله را رد کنید.`;
    }
  }

  return html`
    <span
      id="${buttonId}-container"
      class="d-inline-block align-top mx-1 mb-3"
      style="max-width: 22rem"
    >
      ${
        instanceQuestionId == null || disabledExplanation != null
          ? html`
              <button
                id="${buttonId}"
                type="button"
                class="btn ${
                  disabledExplanation != null ? 'btn-secondary pl-sequence-locked' : 'btn-primary'
                }"
                disabled
              >
                ${buttonContent}
                ${
                  disabledExplanation != null
                    ? html`<i class="fas fa-lock ms-1" aria-hidden="true"></i>`
                    : ''
                }
              </button>
            `
          : html`
              <a
                id="${buttonId}"
                class="btn btn-primary"
                href="${urlPrefix}/instance_question/${instanceQuestionId}/"
              >
                ${buttonContent}
              </a>
            `
      }
      ${
        disabledExplanation != null
          ? html`
              <span id="${buttonId}-reason" class="d-block small lh-sm text-muted mt-2">
                ${disabledExplanation}
              </span>
            `
          : ''
      }
    </span>
  `;
}
