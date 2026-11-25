import { useMutation } from '@tanstack/react-query';
import { type ReactNode, useState } from 'react';
import { Button, Dropdown, Modal } from 'react-bootstrap';

import { type AppError, getAppError } from '@prairielearn/trpc/client';
import { AppErrorAlert } from '@prairielearn/trpc/react';

import {
  getAssessmentDownloadsUrl,
  getCourseInstanceJobSequenceUrl,
} from '../../../lib/client/url.js';
import type { AssessmentUploadsError } from '../../../trpc/assessment/assessment-uploads.js';
import { useTRPC } from '../../../trpc/assessment/context.js';

type OpenUploadModal = 'instanceQuestionScores' | 'assessmentInstanceScores' | 'submissions' | null;

export function UploadDropdown({
  courseInstanceId,
  assessmentId,
  groupWork,
  isDevMode,
}: {
  courseInstanceId: string;
  assessmentId: string;
  groupWork: boolean;
  isDevMode: boolean;
}) {
  const trpc = useTRPC();
  const [openModal, setOpenModal] = useState<OpenUploadModal>(null);
  const downloadsUrl = getAssessmentDownloadsUrl({ courseInstanceId, assessmentId });

  const redirectToJob = ({ jobSequenceId }: { jobSequenceId: string }) => {
    window.location.assign(getCourseInstanceJobSequenceUrl(courseInstanceId, jobSequenceId));
  };

  const instanceQuestionScores = useMutation({
    ...trpc.assessmentUploads.instanceQuestionScores.mutationOptions(),
    onSuccess: redirectToJob,
  });
  const assessmentInstanceScores = useMutation({
    ...trpc.assessmentUploads.assessmentInstanceScores.mutationOptions(),
    onSuccess: redirectToJob,
  });
  const submissions = useMutation({
    ...trpc.assessmentUploads.submissions.mutationOptions(),
    onSuccess: redirectToJob,
  });

  const uploadFile = (mutation: { mutate: (input: FormData) => void }, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    mutation.mutate(formData);
  };

  return (
    <>
      <Dropdown>
        <Dropdown.Toggle size="sm" variant="light" id="upload-actions">
          <i className="bi bi-upload me-2" aria-hidden="true" />
          بارگذاری
        </Dropdown.Toggle>
        <Dropdown.Menu>
          <Dropdown.Item onClick={() => setOpenModal('instanceQuestionScores')}>
            بارگذاری نمرات سوالات
          </Dropdown.Item>
          <Dropdown.Item onClick={() => setOpenModal('assessmentInstanceScores')}>
            بارگذاری نمرات کل
          </Dropdown.Item>
          {isDevMode && (
            <Dropdown.Item onClick={() => setOpenModal('submissions')}>
              بارگذاری ارسال‌ها
            </Dropdown.Item>
          )}
        </Dropdown.Menu>
      </Dropdown>

      <UploadCsvModal
        show={openModal === 'instanceQuestionScores'}
        title="بارگذاری نمرات جدید سوالات"
        description="تنظیم نمرات و بازخورد هر سوال برای دانشجویان."
        inputId="upload-instance-question-scores-file"
        helpTitle="قالب‌های قابل پذیرش"
        help={<InstanceQuestionScoresHelp groupWork={groupWork} downloadsUrl={downloadsUrl} />}
        isPending={instanceQuestionScores.isPending}
        appError={getAppError<AssessmentUploadsError['instanceQuestionScores']>(
          instanceQuestionScores.error,
        )}
        onHide={() => setOpenModal(null)}
        onUpload={(file) => uploadFile(instanceQuestionScores, file)}
        onReset={() => instanceQuestionScores.reset()}
      />

      <UploadCsvModal
        show={openModal === 'assessmentInstanceScores'}
        title="بارگذاری نمرات کل جدید"
        description="تنظیم نمره کل ارزیابی برای دانشجویان."
        inputId="upload-assessment-instance-scores-file"
        helpTitle="قالب‌های قابل پذیرش"
        help={<AssessmentInstanceScoresHelp groupWork={groupWork} />}
        isPending={assessmentInstanceScores.isPending}
        appError={getAppError<AssessmentUploadsError['assessmentInstanceScores']>(
          assessmentInstanceScores.error,
        )}
        onHide={() => setOpenModal(null)}
        onUpload={(file) => uploadFile(assessmentInstanceScores, file)}
        onReset={() => assessmentInstanceScores.reset()}
      />

      {isDevMode && (
        <UploadCsvModal
          show={openModal === 'submissions'}
          title="بارگذاری فایل CSV ارسال‌ها"
          description="بازسازی کاربران، نمونه‌های ارزیابی، سوالات، نسخه‌ها و ارسال‌ها از فایل CSV دانلودشده. فقط در حالت توسعه در دسترس است."
          inputId="upload-submissions-file"
          warning={
            <div className="alert alert-danger">
              این عمل <strong>تمام نمونه‌های ارزیابی و ارسال‌های موجود</strong> برای این ارزیابی را
              حذف کرده و محتوای فایل CSV را جایگزین آن‌ها می‌کند. این عمل قابل بازگشت نیست.
            </div>
          }
          helpTitle="پیش از بارگذاری"
          help={<SubmissionsHelp downloadsUrl={downloadsUrl} />}
          isPending={submissions.isPending}
          appError={getAppError<AssessmentUploadsError['submissions']>(submissions.error)}
          onHide={() => setOpenModal(null)}
          onUpload={(file) => uploadFile(submissions, file)}
          onReset={() => submissions.reset()}
        />
      )}
    </>
  );
}

function UploadCsvModal({
  show,
  onHide,
  title,
  description,
  inputId,
  warning,
  helpTitle,
  help,
  isPending,
  appError,
  onUpload,
  onReset,
}: {
  show: boolean;
  onHide: () => void;
  title: string;
  description: ReactNode;
  inputId: string;
  warning?: ReactNode;
  helpTitle: string;
  help: ReactNode;
  isPending: boolean;
  appError: AppError<never> | null;
  onUpload: (file: File) => void;
  onReset: () => void;
}) {
  const [file, setFile] = useState<File | null>(null);

  return (
    <Modal
      size="lg"
      show={show}
      onHide={onHide}
      onExited={() => {
        setFile(null);
        onReset();
      }}
    >
      <Modal.Header closeButton>
        <Modal.Title>{title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p>{description}</p>
        {warning}
        <div className="mb-4">
          <label className="form-label fw-semibold" htmlFor={inputId}>
            انتخاب فایل CSV
          </label>
          <input
            type="file"
            accept=".csv"
            className="form-control"
            id={inputId}
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
        </div>
        <section className="border-top pt-3">
          <h2 className="h6 fw-semibold">{helpTitle}</h2>
          {help}
        </section>
        <AppErrorAlert
          error={appError}
          render={{ UNKNOWN: ({ message }) => message }}
          onDismiss={onReset}
        />
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          انصراف
        </Button>
        <Button
          variant="primary"
          disabled={!file || isPending}
          onClick={() => file && onUpload(file)}
        >
          {isPending ? 'در حال بارگذاری...' : 'بارگذاری'}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

function InstanceQuestionScoresHelp({
  groupWork,
  downloadsUrl,
}: {
  groupWork: boolean;
  downloadsUrl: string;
}) {
  const idColumn = groupWork ? 'group_name' : 'uid';
  const id1 = groupWork ? 'group1' : 'student1@example.com';
  const id2 = groupWork ? 'group2' : 'student2@example.com';
  return (
    <>
      <p className="mb-2">یک فایل CSV با یکی از قالب‌های زیر بارگذاری کنید:</p>
      <ul>
        <li>
          فایل{' '}
          <code>
            <i>&lt;assessment&gt;</i>_submissions_for_manual_grading.csv
          </code>{' '}
          از <a href={downloadsUrl}>تب فایل‌های قابل دانلود</a>.
        </li>
        <li>
          یک فایل CSV شامل ستون‌های <code>{idColumn}</code>، <code>instance</code>،{' '}
          <code>qid</code>، <code>score_perc</code> و <code>feedback</code>:
        </li>
      </ul>
      <pre className="ms-4">
        {`${idColumn},instance,qid,score_perc,feedback
${id1},1,addTwoNumbers,34.5,The second step was wrong
${id2},1,addTwoNumbers,78.92,
${id2},1,matrixMultiply,100,Great job!`}
      </pre>
      <p className="mb-0">
        برای به‌روزرسانی امتیاز به جای درصد، یا به‌روزرسانی فقط بخش خودکار یا دستی نمره، به{' '}
        <a
          href="https://docs.prairielearn.com/manualGrading/#manual-grading-using-file-uploads"
          target="_blank"
          rel="noopener noreferrer"
        >
          مستندات تصحیح دستی
        </a>{' '}
        مراجعه کنید.
      </p>
    </>
  );
}

function AssessmentInstanceScoresHelp({ groupWork }: { groupWork: boolean }) {
  const idColumn = groupWork ? 'group_name' : 'uid';
  const id1 = groupWork ? 'group1' : 'student1@example.com';
  const id2 = groupWork ? 'group2' : 'student2@example.com';
  const subject = groupWork ? 'گروه' : 'دانشجو';
  return (
    <>
      <p className="mb-2">
        برای تنظیم نمرات درصدی، یک فایل CSV با ستون <code>score_perc</code> بارگذاری کنید:
      </p>
      <pre className="ms-4">
        {`${idColumn},instance,score_perc
${id1},1,63.5
${id2},1,100`}
      </pre>
      <p>
        این کار درصد نمره کل ارزیابی را برای{' '}
        {groupWork ? (
          <>
            گروه <code>group1</code>
          </>
        ) : (
          <code>student1@example.com</code>
        )}{' '}
        روی ۶۳.۵٪ و برای{' '}
        {groupWork ? (
          <>
            گروه <code>group2</code>
          </>
        ) : (
          <code>student2@example.com</code>
        )}{' '}
        روی ۱۰۰٪ تنظیم می‌کند. ستون <code>instance</code> مشخص می‌کند کدام نمونه ارزیابی ویرایش شود
        و زمانی که تنها یک نمونه به ازای هر {subject} وجود دارد باید برابر با <code>1</code> باشد.
      </p>
      <p className="mb-2">
        برای تنظیم نمره امتیازی به جای درصد، یک فایل CSV با ستون <code>points</code> بارگذاری کنید:
      </p>
      <pre className="ms-4 mb-0">
        {`${idColumn},instance,points
${id1},1,120
${id2},1,130.27`}
      </pre>
    </>
  );
}

function SubmissionsHelp({ downloadsUrl }: { downloadsUrl: string }) {
  return (
    <ul className="mb-0">
      <li>
        یکی از فایل‌های CSV ارسال‌ها (<code>*_all_submissions.csv</code>،{' '}
        <code>*_final_submissions.csv</code> یا <code>*_best_submissions.csv</code>) را از{' '}
        <a href={downloadsUrl}>تب فایل‌های قابل دانلود</a> بارگذاری کنید.
      </li>
      <li>
        فرآیند دانلود و بارگذاری مجدد ممکن است همراه با از دست رفتن برخی اطلاعات باشد. اطلاعاتی
        مانند <code>format_errors</code>، <code>raw_submitted_answers</code>، قابل تصحیح بودن ارسال
        و نمرات (از جمله تصحیح دستی و معیارهای نمره‌دهی) حفظ نخواهند شد.
      </li>
      <li>
        اگر ارزیابی دارای سوالاتی است که از <b>معیار نمره‌دهی (Rubric)</b> استفاده می‌کنند، پیش از
        بارگذاری فایل CSV معیارهای نمره‌دهی آن‌ها را بارگذاری کنید. معیارها باید دقیقاً مطابق با
        زمان دانلود ارسال‌ها باشند.
      </li>
    </ul>
  );
}
