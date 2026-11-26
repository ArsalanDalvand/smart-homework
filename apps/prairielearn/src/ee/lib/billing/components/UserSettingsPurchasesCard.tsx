import { type StripeCheckoutSession } from '../../../../lib/db-types.js';
import { type Purchase } from '../purchases.js';
import { formatStripePrice } from '../stripe.shared.js';

export function UserSettingsPurchasesCard({ purchases }: { purchases: Purchase[] }) {
  return (
    <div className="card mb-4">
      <div className="card-header bg-primary text-white d-flex">
        <h2>خریدها</h2>
      </div>

      {purchases.length === 0 ? (
        <div className="card-body text-muted">در حال حاضر هیچ خریدی ندارید.</div>
      ) : (
        <PurchaseTable purchases={purchases} />
      )}
    </div>
  );
}

UserSettingsPurchasesCard.displayName = 'UserSettingsPurchasesCard';

function PurchaseTable({ purchases }: { purchases: Purchase[] }) {
  return (
    <div className="table-responsive">
      <table className="table" aria-label="خریدها">
        <thead>
          <tr>
            <th>شناسه</th>
            <th>درس</th>
            <th>تاریخ</th>
            <th>مبلغ</th>
            <th>وضعیت</th>
          </tr>
        </thead>
        <tbody>
          {purchases.map((purchase) => {
            const courseName = purchase.course
              ? `${purchase.course.short_name}: ${purchase.course.title}`
              : 'درس ناشناخته';

            const courseInstanceName =
              purchase.course_instance?.long_name ?? 'ارائه درس ناشناخته';

            return (
              <tr key={purchase.stripe_checkout_session.id}>
                <td>{purchase.stripe_checkout_session.id}</td>
                <td>
                  {purchase.course_instance != null ? (
                    <a href={`/pl/course_instance/${purchase.course_instance.id}`}>
                      {courseName} ({courseInstanceName})
                    </a>
                  ) : (
                    <span>
                      {courseName} ({courseInstanceName})
                    </span>
                  )}
                </td>
                <td>{purchase.stripe_checkout_session.created_at.toUTCString()}</td>
                <td>{formatStripePrice(purchase.stripe_checkout_session.data.amount_total)} USD</td>
                <td>
                  <StripeCheckoutSessionPaymentStatus session={purchase.stripe_checkout_session} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="card-footer">
        برای درخواست بازپرداخت یا هرگونه سوال درباره خریدهایتان، با <a href="mailto:support@prairielearn.com">support@prairielearn.com</a> تماس بگیرید.
      </div>
    </div>
  );
}

function StripeCheckoutSessionPaymentStatus({ session }: { session: StripeCheckoutSession }) {
  if (session.data.payment_status === 'paid') {
    return <span className="badge text-bg-success">پرداخت دریافت شد</span>;
  } else if (session.data.payment_status === 'unpaid') {
    return <span className="badge text-bg-secondary">در انتظار</span>;
  } else {
    return <span className="badge text-bg-warning">نامشخص</span>;
  }
}
