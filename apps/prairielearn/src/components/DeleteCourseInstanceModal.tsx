import clsx from 'clsx';
import { useEffect, useRef, useState } from 'react';

export function DeleteCourseInstanceModal({
  shortName,
  enrolledCount,
  csrfToken,
}: {
  shortName: string;
  enrolledCount: number;
  csrfToken: string;
}) {
  const [step, setStep] = useState(1);
  const [checks, setChecks] = useState({
    impact: false,
    irreversible: false,
    recovery: false,
  });
  const [confirmationText, setConfirmationText] = useState('');

  const allChecked = Object.values(checks).every(Boolean);
  const canContinue = step === 1 ? allChecked : confirmationText === shortName;

  const labelId = 'deleteCourseInstanceModalLabel';

  // Reset state whenever the Bootstrap modal fully hides (after fade animation)
  const modalRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = modalRef.current;
    if (!el) return;

    const handleHidden = () => {
      setStep(1);
      setChecks({ impact: false, recovery: false, irreversible: false });
      setConfirmationText('');
    };

    // Bootstrap dispatches 'hidden.bs.modal' after the hide transition completes
    el.addEventListener('hidden.bs.modal', handleHidden);
    return () => {
      el.removeEventListener('hidden.bs.modal', handleHidden);
    };
  }, []);

  return (
    <div
      ref={modalRef}
      className="modal fade"
      id="deleteCourseInstanceModal"
      tabIndex={-1}
      role="dialog"
      aria-labelledby={labelId}
    >
      <div className="modal-dialog" role="document">
        <div className="modal-content">
          <div className="modal-header">
            <h2 className="modal-title h4" id={labelId}>
              حذف دوره آموزشی
            </h2>
            <button
              type="button"
              className="btn-close"
              data-bs-dismiss="modal"
              aria-label="بستن"
            />
          </div>
          <div className="modal-body">
            {step === 1 && (
              <div>
                <div role="alert" className="alert alert-warning mb-3">
                  لطفاً پیش از ادامه این موارد را با دقت مطالعه کنید!
                </div>
                <div className="form-check mb-2">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="impact"
                    checked={checks.impact}
                    onChange={({ currentTarget }) => {
                      setChecks((c) => ({ ...c, impact: currentTarget.checked }));
                    }}
                  />
                  <label className="form-check-label" htmlFor="impact">
                    متوجه هستم که <strong>{enrolledCount}</strong> دانشجوی ثبت‌نام‌شده دسترسی خود
                    به این دوره آموزشی را از دست خواهند داد.
                  </label>
                </div>
                <div className="form-check mb-3">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="irreversible"
                    checked={checks.irreversible}
                    onChange={({ currentTarget }) => {
                      setChecks((c) => ({ ...c, irreversible: currentTarget.checked }));
                    }}
                  />
                  <label className="form-check-label" htmlFor="irreversible">
                    متوجه هستم که پس از حذف، این دوره آموزشی از طریق رابط وب سامانه قابل بازیابی
                    نخواهد بود.
                  </label>
                </div>
                <div className="form-check mb-2">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="recovery"
                    checked={checks.recovery}
                    onChange={({ currentTarget }) =>
                      setChecks((c) => ({ ...c, recovery: currentTarget.checked }))
                    }
                  />
                  <label className="form-check-label" htmlFor="recovery">
                    متوجه هستم که بازیابی داده‌ها نیازمند انجام عملیات دستی Git روی مخزن درس است.
                  </label>
                </div>
              </div>
            )}
            {step === 2 && (
              <div>
                <div className="card text-bg-light mb-3">
                  <div className="card-body">
                    <h3 className="h5 card-title">اطلاعات بازیابی</h3>
                    <p>در صورت نیاز به بازیابی این دوره آموزشی، باید مراحل زیر را انجام دهید:</p>
                    <ol className="mb-0">
                      <li>دسترسی به مخزن Git درس</li>
                      <li>استفاده از دستورات Git برای بازیابی دوره آموزشی از تاریخچه کامیت‌ها</li>
                      <li>ارسال (Push) تغییرات به مخزن</li>
                      <li>همگام‌سازی تغییرات در سامانه</li>
                    </ol>
                  </div>
                </div>
                <div>
                  <label htmlFor="confirmShortName" className="form-label">
                    برای تایید حذف، عبارت <strong>{shortName}</strong> را وارد کنید:
                  </label>
                  <input
                    id="confirmShortName"
                    name="confirmShortName"
                    className="form-control"
                    value={confirmationText}
                    autoComplete="off"
                    autoFocus
                    onInput={(e) => setConfirmationText(e.currentTarget.value)}
                  />
                </div>
              </div>
            )}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">
              انصراف
            </button>
            {step === 1 && (
              <button
                type="button"
                className="btn btn-primary"
                disabled={!canContinue}
                onClick={() => setStep(2)}
              >
                ادامه
              </button>
            )}
            {/* Hide with CSS, not conditional rendering, so that the tests can find the form */}
            <form method="POST" className={clsx({ 'd-none': step !== 2 })}>
              <input type="hidden" name="__action" value="delete_course_instance" />
              <input type="hidden" name="__csrf_token" value={csrfToken} />
              <button type="submit" className="btn btn-danger" disabled={!canContinue}>
                حذف
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

DeleteCourseInstanceModal.displayName = 'DeleteCourseInstanceModal';
