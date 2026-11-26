import { compiledScriptTag } from '@prairielearn/compiled-assets';
import { html } from '@prairielearn/html';

import { PageLayout } from '../../../components/PageLayout.js';
import { type Course, type CourseInstance } from '../../../lib/db-types.js';
import type { ResLocalsForPage } from '../../../lib/res-locals.js';
import { type PlanName } from '../../lib/billing/plans-types.js';
import { formatStripePrice } from '../../lib/billing/stripe.shared.js';

export function StudentCourseInstanceUpgrade({
  course,
  courseInstance,
  lti13AdmissionPending,
  missingPlans,
  planPrices,
  resLocals,
}: {
  course: Course;
  courseInstance: CourseInstance;
  /**
   * Whether this upgrade started with an LTI invitation that is still pending.
   * The hidden field lets the server look up the saved invitation again after
   * the form submission and Stripe checkout.
   */
  lti13AdmissionPending: boolean;
  missingPlans: PlanName[];
  /**
   * `null` here will indicate that we aren't configured with Stripe credentials
   * and thus that we can't show prices of the upgrade button
   */
  planPrices: Record<string, number> | null;
  resLocals: ResLocalsForPage<'course-instance'>;
}) {
  return PageLayout({
    resLocals,
    pageTitle: 'نیاز به ارتقا',
    navContext: {
      type: 'student',
      page: 'upgrade',
    },
    headContent: compiledScriptTag('studentCourseInstanceUpgradeClient.ts'),
    content: html`
      <h1>
        <i class="fa-solid fa-lock"></i>
        نیاز به ارتقا
      </h1>
      <p>
        <strong>${course.short_name}: ${course.title}, ${courseInstance.long_name}</strong>
        برای پشتیبانی از برخی امکانات انتخاب‌شده توسط مدرس، نیاز به ارتقا دارد.
      </p>

      ${
        planPrices == null
          ? html`<p>لطفاً برای اطلاعات بیشتر با مدرس خود تماس بگیرید.</p>`
          : html`
              ${PriceTable({ planNames: missingPlans, planPrices })}

              <form method="POST" action="/pl/course_instance/${courseInstance.id}/upgrade">
                <div class="form-check mb-3">
                  <input
                    type="checkbox"
                    class="form-check-input"
                    id="js-terms-agreement"
                    name="terms_agreement"
                    value="1"
                  />
                  <label class="form-check-label" for="js-terms-agreement">
                    با
                    <a href="https://www.prairielearn.com/legal/terms">شرایط استفاده از خدمات</a> و
                    <a href="https://www.prairielearn.com/legal/privacy">سیاست حفظ حریم خصوصی</a> سامانه موافقم.
                  </label>
                </div>

                <input type="hidden" name="__csrf_token" value="${resLocals.__csrf_token}" />
                ${
                  lti13AdmissionPending
                    ? html`<input type="hidden" name="lti13_relaunch" value="1" />`
                    : ''
                }
                ${missingPlans.map(
                  (plan) => html`
                    <input type="hidden" name="unsafe_plan_names" value="${plan}" />
                  `,
                )}
                <button
                  id="js-upgrade"
                  type="submit"
                  name="__action"
                  value="upgrade"
                  class="btn btn-primary d-block w-100"
                  disabled
                >
                  ارتقا
                </button>
              </form>
            `
      }
    `,
  });
}

export function Lti13CourseInstanceRelaunch({
  course,
  courseInstance,
  resLocals,
}: {
  course: Course;
  courseInstance: CourseInstance;
  resLocals: ResLocalsForPage<'course-instance'>;
}) {
  return PageLayout({
    resLocals,
    pageTitle: 'بازگشت به LMS',
    navContext: {
      type: 'student',
      page: 'upgrade',
    },
    content: html`
      <h1>بازگشت به LMS</h1>
      <p>
        درس ${course.short_name}: ${courseInstance.long_name} آماده است. به LMS خود بازگردید و برای تکمیل ثبت‌نام، این درس را دوباره باز کنید.
      </p>
    `,
  });
}

export function CourseInstanceStudentUpdateSuccess({
  course,
  courseInstance,
  requireLti13Relaunch,
  paid,
  resLocals,
}: {
  course: Course;
  courseInstance: CourseInstance;
  /**
   * Whether the saved LTI invitation could not be used after payment and the
   * student must launch the course from the LMS again.
   */
  requireLti13Relaunch: boolean;
  paid: boolean;
  resLocals: ResLocalsForPage<'course-instance'>;
}) {
  if (paid && requireLti13Relaunch) {
    return Lti13CourseInstanceRelaunch({ course, courseInstance, resLocals });
  }

  return PageLayout({
    resLocals,
    pageTitle: 'ارتقا با موفقیت انجام شد',
    navContext: {
      type: 'student',
      page: 'upgrade',
    },
    content: html`
      <h1>سپاسگزاریم!</h1>

      ${
        paid
          ? html`
              <p>پرداخت شما با موفقیت انجام شد. اکنون می‌توانید به درس دسترسی داشته باشید.</p>

              <a href="/pl/course_instance/${courseInstance.id}" class="btn btn-primary">
                ادامه به ${course.short_name}
              </a>
            `
          : html`
              <p>
                پس از پردازش کامل پرداخت شما، برای دسترسی به درس دوباره به این صفحه مراجعه کنید.
              </p>
            `
      }
    `,
  });
}

function getPlanDetails(planName: PlanName) {
  switch (planName) {
    case 'basic':
      return {
        name: 'دسترسی به درس',
        description: 'دسترسی به این درس را فراهم می‌کند.',
      };
    case 'compute':
      return {
        name: 'محاسبات (Compute)',
        description: 'امکاناتی مانند محیط توسعه در مرورگر و تصحیح خودکار کد را فعال می‌کند.',
      };
    default:
      throw new Error(`Unknown plan name: ${planName}`);
  }
}

function BillingLineItem({ planName, planPrice }: { planName: PlanName; planPrice: number }) {
  const { name, description } = getPlanDetails(planName);

  const formattedPrice = formatStripePrice(planPrice);

  return html`
    <li class="list-group-item d-flex justify-content-between align-items-center">
      <div class="d-flex flex-column">
        ${name}
        <small class="text-muted text-small">${description}</small>
      </div>
      <div>
        <strong class="text-nowrap">${formattedPrice} USD</strong>
      </div>
    </li>
  `;
}

function PriceTable({
  planNames,
  planPrices,
}: {
  planNames: PlanName[];
  planPrices: Record<string, number>;
}) {
  const totalPrice = planNames.reduce((total, planName) => total + planPrices[planName], 0);
  const formattedTotalPrice = formatStripePrice(totalPrice);

  return html`
    <ul class="list-group mb-3">
      ${planNames.map((planName) => BillingLineItem({ planName, planPrice: planPrices[planName] }))}
      <li class="list-group-item d-flex justify-content-between align-items-center bg-light">
        <strong>جمع کل</strong>
        <strong class="text-nowrap">${formattedTotalPrice} USD</strong>
      </li>
    </ul>
  `;
}
