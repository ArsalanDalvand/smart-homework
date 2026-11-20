import { EnrollmentCodeForm } from '../../components/EnrollmentCodeForm.js';

export function EnrollmentCodeRequired({ courseInstanceId }: { courseInstanceId: string }) {
  return (
    <div className="container-fluid" style={{ fontFamily: 'var(--font-persian)' }}>
      <div className="row justify-content-center">
        <div className="col-lg-8 col-xl-6">
          <div className="card">
            <div className="card-header bg-primary text-white">
              <h1 className="h4 mb-0">عضویت در دوره با کد اختصاصی ثبت‌نام</h1>
            </div>
            <div className="card-body">
              <EnrollmentCodeForm
                style="raw-form"
                courseInstanceId={courseInstanceId}
                leadingContent={
                  <p>
                    جهت دسترسی به این دوره، لطفاً کد ثبت‌نامی که توسط استاد یا کادر آموزشی درس در اختیارتان قرار گرفته است را وارد فرمایید.
                  </p>
                }
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

EnrollmentCodeRequired.displayName = 'EnrollmentCodeRequired';
