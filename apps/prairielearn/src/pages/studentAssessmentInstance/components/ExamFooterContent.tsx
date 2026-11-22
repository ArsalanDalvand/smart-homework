import { html } from '@prairielearn/html';

export function ExamFooterContent({
  someQuestionsAllowRealTimeGrading,
  someQuestionsForbidRealTimeGrading,
  savedAnswers,
  suspendedSavedAnswers,
  authorizedEdit,
  hasPassword,
  showClosedAssessment,
  csrfToken,
}: {
  someQuestionsAllowRealTimeGrading: boolean;
  someQuestionsForbidRealTimeGrading: boolean;
  savedAnswers: number;
  suspendedSavedAnswers: number;
  authorizedEdit: boolean;
  hasPassword: boolean;
  showClosedAssessment: boolean;
  csrfToken: string;
}) {
  if (someQuestionsAllowRealTimeGrading) {
    return html`
      <form name="grade-form" method="POST">
        <input type="hidden" name="__action" value="grade" />
        <input type="hidden" name="__csrf_token" value="${csrfToken}" />
        ${
          savedAnswers > 0
            ? html`
                <button type="submit" class="btn btn-info" ${!authorizedEdit ? 'disabled' : ''}>
                  تصحیح ${savedAnswers} پاسخ ذخیره‌شده
                </button>
              `
            : html`
                <button type="submit" class="btn btn-info" disabled>
                  هیچ پاسخ ذخیره‌شده‌ای برای تصحیح وجود ندارد
                </button>
              `
        }
      </form>
      <ul class="mb-0">
        ${
          suspendedSavedAnswers > 1
            ? html`
                <li>
                  تعداد ${suspendedSavedAnswers} پاسخ ذخیره‌شده هنوز به دلیل محدودیت زمانی تصحیح مجدد قابل داوری نیستند. این موارد با نماد
                  <i class="fa fa-hourglass-half"></i> در جدول بالا مشخص شده‌اند. با تازه‌سازی صفحه می‌توانید وضعیت را به‌روز نمایید.
                </li>
              `
            : suspendedSavedAnswers === 1
              ? html`
                  <li>
                    There is one saved answer that cannot be graded yet because its grade rate has
                    not been reached. It is marked with the
                    <i class="fa fa-hourglass-half"></i> icon above. Reload this page to update this
                    information.
                  </li>
                `
              : ''
        }
        <li>
          پاسخ خود به هر سوال را با دکمه‌های <strong>ارسال و تصحیح خودکار</strong> یا <strong>ذخیره پیش‌نویس</strong> در صفحه هر سوال ثبت فرمایید.
        </li>
        <li>
          ستون <strong>وضعیت</strong> را بررسی کنید تا مطمئن شوید هر سوال ${someQuestionsForbidRealTimeGrading ? 'ذخیره یا تصحیح' : 'تصحیح'} شده است. سوالاتی که دارای <strong>نمره در دسترس</strong> هستند را می‌توانید برای کسب امتیاز بالاتر مجدداً امتحان کنید؛ تلاش‌های جدید هرگز نمره کسب‌شده فعلی شما را کاهش نمی‌دهد.
        </li>
        ${
          hasPassword ||
          !showClosedAssessment ||
          // If this is true, this assessment has a mix of real-time-graded and
          // non-real-time-graded questions. We need to show the "Finish assessment"
          // button.
          someQuestionsForbidRealTimeGrading
            ? html`
                <li>
                  پس از پاسخگویی به تمامی سوالات، جهت ثبت نهایی بر روی دکمه زیر کلیک نمایید:
                  <button
                    class="btn btn-danger"
                    data-bs-toggle="modal"
                    data-bs-target="#confirmFinishModal"
                    ${!authorizedEdit ? 'disabled' : ''}
                  >
                    ثبت و پایان قطعی آزمون
                  </button>
                </li>
              `
            : html`
                <li>
                  پس از اتمام کار، از حساب خود خارج شده و مرورگر را ببندید. در صورتی که پاسخ ذخیره‌شده‌ای باقی مانده باشد، پیش از محاسبه نمره نهایی به طور خودکار تصحیح خواهد شد.
                </li>
              `
        }
      </ul>
    `;
  }

  return html`
    <ul class="mb-0">
      <li>
        پاسخ خود به هر سوال را با دکمه <strong>ذخیره پاسخ</strong> در صفحه همان سوال ثبت فرمایید.
      </li>
      <li>
        پس از پاسخگویی به تمامی سوالات، جهت ثبت نهایی کلیک نمایید:
        <button
          class="btn btn-danger"
          data-bs-toggle="modal"
          data-bs-target="#confirmFinishModal"
          ${!authorizedEdit ? 'disabled' : ''}
        >
          ثبت و پایان قطعی آزمون
        </button>
      </li>
    </ul>
  `;
}
