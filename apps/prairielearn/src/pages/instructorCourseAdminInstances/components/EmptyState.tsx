import { Button } from 'react-bootstrap';

export function EmptyState({
  courseExample,
  canEditCourse,
  needToSync,
  urlPrefix,
  onCreateClick,
}: {
  courseExample: boolean;
  canEditCourse: boolean;
  needToSync: boolean;
  urlPrefix: string;
  onCreateClick: () => void;
}) {
  return (
    <div className="my-4 card-body text-center" style={{ textWrap: 'balance' }}>
      <p className="fw-bold">هیچ ترم یا دوره ارائه‌ای برای این درس یافت نشد.</p>
      <p className="mb-0">
        یک دوره یا ترم ارائه، دربرگیرنده آزمون‌ها، تکالیف و تنظیمات آموزشی مربوط به یک دوره برگزاری درس است.
      </p>
      <p>
        جهت کسب اطلاعات بیشتر،{' '}
        <a href="https://docs.prairielearn.com/courseInstance/" target="_blank" rel="noreferrer">
          مستندات دوره‌ها و ترم‌های ارائه
        </a>{' '}
        را مطالعه فرمایید.
      </p>
      {courseExample ? (
        <p className="text-muted">امکان افزودن دوره به درس نمونه وجود ندارد.</p>
      ) : !canEditCourse ? (
        <p className="text-muted">تنها ویرایشگران و مدیران درس امکان ایجاد دوره‌های ارائه جدید را دارند.</p>
      ) : needToSync ? (
        <p>
          پیش از ایجاد دوره جدید، ابتدا باید{' '}
          <a href={`${urlPrefix}/course_admin/syncs`}>درس را همگام‌سازی نمایید</a>.
        </p>
      ) : (
        <Button variant="primary" size="sm" type="button" onClick={onCreateClick}>
          <i className="fa fa-plus me-1" aria-hidden="true" />
          <span className="d-none d-sm-inline">افزودن دوره ارائه جدید</span>
        </Button>
      )}
    </div>
  );
}
