import { type SubmitEvent, useMemo, useState } from 'react';
import { Alert, Button, Card, Form, Spinner } from 'react-bootstrap';

import type { IRSourceBankRef } from '@prairielearn/question-conversion';

import {
  type CollisionStrategy,
  type CourseInstanceOption,
  type ParseWarning,
  type QuestionOverrides,
  type SerializedConversionResult,
  type SerializedQuestionOutput,
  type StrippedAccessRules,
  getUnresolvedSourceBankRefs,
  hasCanvasUnresolvedSourceBankRefs,
} from '../instructorQtiImport.types.js';

import { QuestionReviewPanel } from './QuestionReviewPanel.js';

function isRubricWarning(message: string): boolean {
  return message.includes('rubric') || message.includes('Rubric');
}

function uniqueCanvasCourseIds(refs: IRSourceBankRef[]): string[] {
  return [...new Set(refs.flatMap((ref) => (ref.externalCourseId ? [ref.externalCourseId] : [])))];
}

function CanvasCourseIdList({ courseIds }: { courseIds: string[] }) {
  return (
    <ul className="mb-0">
      {courseIds.map((id) => (
        <li key={id}>
          شناسه درس Canvas: <strong>{id}</strong>{' '}
          <span className="text-muted">
            (در نشانی <code dir="ltr">/courses/{id}</code> در سامانه Canvas قابل مشاهده است)
          </span>
        </li>
      ))}
    </ul>
  );
}

function countReferencedBankQuestions(refs: IRSourceBankRef[]) {
  return refs.reduce((sum, ref) => sum + (ref.numberChoose ?? 1), 0);
}

function sourceBankRefKey(ref: IRSourceBankRef) {
  return ref.sourceBankExportId ?? ref.sourceBankRef;
}

function uniqueSourceBankRefs(refs: IRSourceBankRef[]): IRSourceBankRef[] {
  const seen = new Set<string>();
  return refs.filter((ref) => {
    const key = sourceBankRefKey(ref);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function UnresolvedBankWarnings({ results }: { results: SerializedConversionResult[] }) {
  const refs = results.flatMap((result) => getUnresolvedSourceBankRefs(result));
  if (refs.length === 0) return null;

  const courseIds = uniqueCanvasCourseIds(refs);
  const isCanvasExport = hasCanvasUnresolvedSourceBankRefs(refs);

  return (
    <Alert variant="warning" className="mb-3">
      <div className="d-flex align-items-start gap-2">
        <i className="bi bi-exclamation-triangle-fill mt-1" aria-hidden="true" />
        <div>
          <strong>برخی از بانک‌های سوال یافت نشدند</strong>
          <p className="mb-2 mt-1">
            {refs.length} ارجاع به بانک سوال با محتوای بارگذاری‌شده تطبیق داده نشد. این سوال‌ها وارد نخواهند شد، مگر اینکه از ابتدا شروع کرده و{' '}
            {isCanvasExport ? 'فایل خروجی درس Canvas' : 'فایل خروجی'} حاوی بانک‌های مورد نظر را بارگذاری کنید.
          </p>
          {courseIds.length > 0 && (
            <>
              <p className="mb-1">Canvas این درس‌های مبدا را شناسایی کرده است:</p>
              <CanvasCourseIdList courseIds={courseIds} />
            </>
          )}
        </div>
      </div>
    </Alert>
  );
}

export function QuestionBankDeduplicationWarning({
  deduplicatedQuestionCount,
}: {
  deduplicatedQuestionCount: number;
}) {
  if (deduplicatedQuestionCount === 0) return null;

  return (
    <Alert variant="info" className="mb-3">
      <div className="d-flex align-items-start gap-2">
        <i className="bi bi-info-circle-fill mt-1" aria-hidden="true" />
        <div>
          <strong>سوال‌های تکراری بانک‌های سوال حذف شدند</strong>
          <p className="mb-0 mt-1">
            {deduplicatedQuestionCount} سوال در چند بانک سوال تکرار شده بودند و تنها یک بار وارد خواهند شد.
          </p>
        </div>
      </div>
    </Alert>
  );
}

export function NonRubricWarnings({
  warnings,
  questions,
  questionOverrides = new Map(),
}: {
  warnings: SerializedConversionResult['warnings'];
  questions: SerializedQuestionOutput[];
  questionOverrides?: Map<string, QuestionOverrides>;
}) {
  const filtered = warnings.filter((w) => !isRubricWarning(w.message));
  const duplicateQuestionTitles = findDuplicateQuestionTitles(questions, questionOverrides);
  if (filtered.length === 0 && duplicateQuestionTitles.length === 0) return null;

  const individualWarnings = uniqueWarnings(filtered);

  const questionById = new Map<string, { title: string; number: number }>();
  for (const [index, question] of questions.entries()) {
    const questionInfo = { title: question.infoJson.title, number: index + 1 };
    questionById.set(question.sourceId, questionInfo);
    questionById.set(question.directoryName, questionInfo);
    questionById.set(question.originalDirectoryName, questionInfo);
  }

  return (
    <Alert variant="warning" className="mb-3">
      <strong>هشدارها:</strong>
      <ul className="mb-0 mt-1">
        <DuplicateQuestionTitleWarningListItem duplicateTitles={duplicateQuestionTitles} />
        {individualWarnings.map((w) => {
          const q = questionById.get(w.questionId);
          return (
            <li key={warningKey(w)}>
              {q ? `برای سوال «${q.title}» (شماره ${q.number}): ${w.message}` : w.message}
            </li>
          );
        })}
      </ul>
    </Alert>
  );
}

export function findDuplicateQuestionTitles(
  questions: SerializedQuestionOutput[],
  questionOverrides: Map<string, QuestionOverrides>,
): string[] {
  const titleCounts = new Map<string, number>();
  for (const question of questions) {
    const override = questionOverrides.get(question.directoryName);
    if (override?.included === false) continue;

    const title = (override?.title ?? question.infoJson.title).trim();
    if (title === '') continue;

    titleCounts.set(title, (titleCounts.get(title) ?? 0) + 1);
  }

  return [...titleCounts.entries()].filter(([, count]) => count > 1).map(([title]) => title);
}

function DuplicateQuestionTitleWarningListItem({ duplicateTitles }: { duplicateTitles: string[] }) {
  if (duplicateTitles.length === 0) return null;

  return duplicateTitles.length === 1 ? (
    <li key="duplicate-question-title">
      چند سوال با عنوان یکسان &laquo;{duplicateTitles[0]}&raquo; شناسایی شد. پیشنهاد می‌کنیم برای یافتن و ویرایش آسان‌تر در سامانه، نام‌های معنادار و متمایز برای این سوال‌ها انتخاب کنید.
    </li>
  ) : (
    <li key="duplicate-question-titles">
      چندین سوال با عنوان‌های تکراری شناسایی شد. پیشنهاد می‌کنیم برای یافتن و ویرایش آسان‌تر در سامانه، نام‌های معنادار و متمایز برای این سوال‌ها انتخاب کنید.
    </li>
  );
}

function warningKey(warning: SerializedConversionResult['warnings'][number]): string {
  return [warning.questionId, warning.message, warning.level, warning.externalCourseId].join('\0');
}

function uniqueWarnings(
  warnings: SerializedConversionResult['warnings'],
): SerializedConversionResult['warnings'] {
  const seen = new Set<string>();
  return warnings.filter((warning) => {
    const key = warningKey(warning);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export function ImportSummary({
  results,
  strippedAccessRules,
  parseWarnings,
  canImportAssessments,
}: {
  results: SerializedConversionResult[];
  strippedAccessRules: StrippedAccessRules | null;
  parseWarnings: ParseWarning[];
  canImportAssessments: boolean;
}) {
  const totalAssessments = results.filter((r) => r.sourceType === 'assessment').length;
  const totalQuestionBanks = results.filter((r) => r.sourceType === 'question-bank').length;
  const uniqueQuestions = new Map(
    results.flatMap((result) =>
      result.questions.map((question) => [question.directoryName, question] as const),
    ),
  );
  const totalQuestions = uniqueQuestions.size;
  let totalAssets = 0;
  let totalExternalImageFilesCopied = 0;
  let totalSkippedVideos = 0;
  for (const question of uniqueQuestions.values()) {
    totalAssets += Object.keys(question.clientFiles).length;
    totalExternalImageFilesCopied += question.copiedExternalImageFileCount;
    totalSkippedVideos += question.skippedVideos.length;
  }

  const allWarnings = results.flatMap((r) => r.warnings);
  const rubricWarnings = allWarnings.filter((w) => isRubricWarning(w.message));
  const hasRubricIssues = rubricWarnings.length > 0;

  const unsupportedTypes = allWarnings
    .filter((w) => !isRubricWarning(w.message) && w.message.includes('Unsupported'))
    .map((w) => w.message);
  const uniqueUnsupported = [...new Set(unsupportedTypes)];

  const notImportedItems: string[] = [];
  if (!canImportAssessments && totalAssessments > 0) {
    notImportedItems.push(
      `${totalAssessments} آزمون (برای وارد کردن آزمون‌ها یک دوره ایجاد کنید؛ سوال‌های آن‌ها همچنان وارد می‌شوند)`,
    );
  }
  if (hasRubricIssues) notImportedItems.push('روبریک‌ها (در خروجی آزمون QTI پشتیبانی نمی‌شوند)');
  if (strippedAccessRules?.hasTimeLimits) notImportedItems.push('محدودیت‌های زمانی');
  if (strippedAccessRules?.hasPasswords) notImportedItems.push('رمزهای دسترسی');
  if (strippedAccessRules?.hasDates) notImportedItems.push('تاریخ‌های دسترسی (زمان شروع و پایان)');
  if (totalSkippedVideos > 0) {
    notImportedItems.push(
      `${totalSkippedVideos} فایل ویدیویی (برای جزئیات به هر سوال مراجعه کنید)`,
    );
  }
  notImportedItems.push(...uniqueUnsupported);
  for (const pw of parseWarnings) {
    notImportedItems.push(`${pw.filename}: ${pw.message}`);
  }

  const hasNotImported = notImportedItems.length > 0;

  return (
    <div className="row g-3 mb-4">
      <div className={hasNotImported ? 'col-md-6' : 'col-12'}>
        <Card className="h-100">
          <Card.Body>
            <h2 className="h6 mb-2">
              <i className="bi bi-check-circle text-success me-2" aria-hidden="true" />
              موارد قابل وارد کردن
            </h2>
            <ul className="mb-0">
              {canImportAssessments && totalAssessments > 0 && (
                <li>
                  <strong>{totalAssessments}</strong> آزمون
                </li>
              )}
              {totalQuestionBanks > 0 && (
                <li>
                  <strong>{totalQuestionBanks}</strong> بانک سوال
                </li>
              )}
              <li>
                <strong>{totalQuestions}</strong> سوال
              </li>
              {totalAssets > 0 && (
                <li>
                  <strong>{totalAssets}</strong> تصویر و فایل منبع دیگر
                  {totalExternalImageFilesCopied > 0 && (
                    <>
                      ، شامل <strong>{totalExternalImageFilesCopied}</strong> تصویر که از وب‌سایت‌های خارجی کپی خواهند شد
                    </>
                  )}
                </li>
              )}
            </ul>
          </Card.Body>
        </Card>
      </div>
      {hasNotImported && (
        <div className="col-md-6">
          <Card className="h-100">
            <Card.Body>
              <h2 className="h6 mb-2">
                <i className="bi bi-info-circle text-muted me-2" aria-hidden="true" />
                مواردی که وارد نخواهند شد
              </h2>
              <ul className="mb-0">
                {notImportedItems.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </Card.Body>
          </Card>
        </div>
      )}
    </div>
  );
}

export type ProcessingPhase = 'idle' | 'trimming' | 'uploading';

const PROCESSING_PHASE_LABELS: Record<ProcessingPhase, string> = {
  idle: '',
  trimming: 'در حال استخراج محتوای QTI\u2026',
  uploading: 'در حال بارگذاری\u2026',
};

export function UploadStep({
  uploading,
  processingPhase,
  onSubmit,
  courseInstances,
  courseInstancesUrl,
  selectedCourseInstanceId,
  onCourseInstanceChange,
}: {
  uploading: boolean;
  processingPhase: ProcessingPhase;
  onSubmit: (e: SubmitEvent<HTMLFormElement>) => void;
  courseInstances: CourseInstanceOption[];
  /** Where to send users who need to create a course instance before importing quizzes. */
  courseInstancesUrl: string;
  selectedCourseInstanceId: string | null;
  onCourseInstanceChange: (id: string) => void;
}) {
  return (
    <form encType="multipart/form-data" onSubmit={onSubmit}>
      <p>
        محتوای آزمون و سوال را از Canvas یا سایر سامانه‌های مدیریت یادگیری (LMS) وارد کنید. فایل خروجی آزمون (<code dir="ltr">.zip</code>) یا خروجی کامل درس (<code dir="ltr">.imscc</code>) را با فرمت QTI 1.2 بارگذاری نمایید.{' '}
        <a href="https://docs.prairielearn.com/importingContent/" target="_blank" rel="noreferrer">
          اطلاعات بیشتر درباره وارد کردن محتوا
        </a>
      </p>
      {courseInstances.length === 0 && (
        <Alert variant="info" className="mb-3">
          این درس هنوز هیچ دوره‌ای ندارد؛ بنابراین آزمون‌ها به عنوان آزمون قابل وارد کردن نیستند. سوال‌های آن‌ها به صورت سوال‌های مستقل وارد می‌شوند تا پس از{' '}
          <Alert.Link href={courseInstancesUrl}>ایجاد یک دوره</Alert.Link> بتوانید آن‌ها را به آزمون‌ها اضافه کنید.
        </Alert>
      )}
      {courseInstances.length === 1 && (
        <div className="mb-3">
          <Form.Label htmlFor="course-instance-target">دوره مقصد</Form.Label>
          <Form.Control
            id="course-instance-target"
            defaultValue={`${courseInstances[0].shortName}: ${courseInstances[0].longName}`}
            plaintext
            readOnly
          />
          <Form.Text>آزمون‌ها در این دوره ایجاد خواهند شد.</Form.Text>
        </div>
      )}
      {courseInstances.length > 1 && (
        <div className="mb-3">
          <Form.Label htmlFor="course-instance-select">دوره مقصد</Form.Label>
          <Form.Select
            id="course-instance-select"
            value={selectedCourseInstanceId ?? ''}
            disabled={uploading}
            onChange={(e) => onCourseInstanceChange(e.target.value)}
          >
            {courseInstances.map((ci) => (
              <option key={ci.id} value={ci.id}>
                {ci.shortName}: {ci.longName}
              </option>
            ))}
          </Form.Select>
          <Form.Text>آزمون‌ها در این دوره ایجاد خواهند شد.</Form.Text>
        </div>
      )}
      <div className="mb-3">
        <Form.Label htmlFor="qti-file">فایل خروجی (Export)</Form.Label>
        <Form.Control
          id="qti-file"
          type="file"
          name="file"
          accept=".zip,.imscc"
          disabled={uploading}
          aria-describedby="qti-file-help"
          required
        />
        <Form.Text id="qti-file-help">
          فرمت‌های پشتیبانی‌شده: <span dir="ltr">.zip</span> (خروجی آزمون)، <span dir="ltr">.imscc</span> (خروجی درس).
        </Form.Text>
      </div>
      <Button type="submit" variant="primary" disabled={uploading}>
        {uploading ? (
          <>
            <Spinner size="sm" className="me-2" />
            {PROCESSING_PHASE_LABELS[processingPhase]}
          </>
        ) : (
          <>
            <i className="bi bi-cloud-arrow-up me-2" aria-hidden="true" />
            وارد کردن محتوا
          </>
        )}
      </Button>
    </form>
  );
}

export function MissingBanksStep({
  results,
  uploading,
  processingPhase,
  uploadingBankKey,
  successMessage,
  onSubmit,
  onSkip,
  onStartOver,
}: {
  results: SerializedConversionResult[];
  uploading: boolean;
  processingPhase: ProcessingPhase;
  uploadingBankKey: string | null;
  successMessage: string | null;
  onSubmit: (e: SubmitEvent<HTMLFormElement>) => void;
  onSkip: () => void;
  onStartOver: () => void;
}) {
  const refs = results.flatMap((result) => getUnresolvedSourceBankRefs(result));
  const uniqueRefs = uniqueSourceBankRefs(refs);
  const courseIds = uniqueCanvasCourseIds(refs);
  const importedQuestionCount = results.reduce((sum, result) => sum + result.questions.length, 0);
  const missingQuestionCount = countReferencedBankQuestions(refs);
  const totalQuestionCount = importedQuestionCount + missingQuestionCount;
  const hasUnknownCounts = refs.some((ref) => ref.numberChoose == null);
  const countPrefix = hasUnknownCounts ? 'حداقل ' : '';
  const isCanvasExport = hasCanvasUnresolvedSourceBankRefs(refs);

  return (
    <>
      {successMessage && (
        <Alert variant="success" className="mb-3">
          <div className="d-flex align-items-start gap-2">
            <i className="bi bi-check-circle-fill mt-1" aria-hidden="true" />
            <div>{successMessage}</div>
          </div>
        </Alert>
      )}

      <Alert variant="warning" className="mb-3">
        <div className="d-flex align-items-start gap-2">
          <i className="bi bi-exclamation-triangle-fill mt-1" aria-hidden="true" />
          <div>
            <strong>برخی سوال‌ها در بانک‌های سوال قرار دارند</strong>
            <p className="mb-2 mt-1">
              این فایل خروجی به {refs.length} بانک سوال ارجاع داده است که{' '}
              {isCanvasExport ? 'توسط Canvas در خروجی قرار نگرفته‌اند' : 'در خروجی گنجانده نشده‌اند'}.
              از بخش‌های زیر برای بارگذاری فایل خروجی هر بانک مفقود استفاده کنید تا سوال‌های منطبق به بخش بررسی آزمون اضافه شوند.
            </p>
            {isCanvasExport && courseIds.length > 1 && (
              <p className="mb-2">
                هر بخش، درس Canvas حاوی آن بانک سوال را (در صورت ارائه شناسه درس توسط Canvas) مشخص می‌کند.
              </p>
            )}
            <p className="mb-2">
              {countPrefix}
              <strong>{missingQuestionCount}</strong> سوال از مجموع <strong>{totalQuestionCount}</strong>{' '}
              سوال در این فایل بدون بارگذاری محتوای تکمیلی مفقود خواهند بود.
            </p>
          </div>
        </div>
      </Alert>

      <div className="d-flex flex-column gap-3 mb-3">
        {uniqueRefs.map((ref, i) => {
          const inputId = `qti-bank-file-${i}`;
          const refKey = sourceBankRefKey(ref);
          const isUploadingThisBank = uploading && uploadingBankKey === refKey;
          const label = ref.externalCourseId
            ? `فایل خروجی تکمیلی برای «${ref.title}» از درس Canvas شماره ${ref.externalCourseId}`
            : `فایل خروجی تکمیلی برای «${ref.title}»`;
          const hasCanvasRef = ref.sourceBankExportId != null || ref.externalCourseId != null;

          return (
            <form
              key={refKey}
              data-source-bank-key={refKey}
              encType="multipart/form-data"
              className="border rounded p-3"
              onSubmit={onSubmit}
            >
              <div className="fw-semibold">{ref.title}</div>
              <div className="text-muted small mb-2">
                {ref.externalCourseId ? (
                  <>
                    شناسه درس Canvas: <strong>{ref.externalCourseId}</strong>{' '}
                    <span>
                      (در نشانی <code dir="ltr">/courses/{ref.externalCourseId}</code> در سامانه Canvas قابل مشاهده است)
                    </span>
                  </>
                ) : hasCanvasRef ? (
                  'Canvas شناسه درس مبدا را برای این بانک سوال مشخص نکرده است.'
                ) : (
                  'فایل خروجی حاوی این بانک سوال را بارگذاری کنید.'
                )}
              </div>
              <Form.Label htmlFor={inputId}>{label}</Form.Label>
              <div className="d-flex flex-column flex-md-row gap-2 align-items-md-start">
                <div className="flex-grow-1">
                  <Form.Control
                    id={inputId}
                    type="file"
                    name="file"
                    accept=".zip,.imscc"
                    disabled={uploading}
                    aria-describedby={`${inputId}-help`}
                    required
                  />
                  <Form.Text id={`${inputId}-help`}>
                    {hasCanvasRef ? 'فایل خروجی درس Canvas' : 'فایل خروجی'} حاوی این بانک سوال را بارگذاری کنید.
                  </Form.Text>
                </div>
                <Button
                  type="submit"
                  className="flex-shrink-0"
                  variant="primary"
                  disabled={uploading}
                  aria-label={`بارگذاری فایل خروجی برای ${ref.title}`}
                >
                  {isUploadingThisBank ? (
                    <>
                      <Spinner size="sm" className="me-2" />
                      {PROCESSING_PHASE_LABELS[processingPhase]}
                    </>
                  ) : (
                    <>
                      <i className="bi bi-cloud-arrow-up me-2" aria-hidden="true" />
                      بارگذاری فایل خروجی
                    </>
                  )}
                </Button>
              </div>
            </form>
          );
        })}
      </div>

      <div className="d-flex gap-2">
        <Button
          variant="outline-secondary"
          type="button"
          disabled={uploading}
          onClick={onStartOver}
        >
          <i className="bi bi-arrow-left me-1" aria-hidden="true" />
          شروع مجدد
        </Button>
        <Button variant="outline-secondary" type="button" disabled={uploading} onClick={onSkip}>
          ادامه بدون محتوای تکمیلی
        </Button>
      </div>
    </>
  );
}

export function AssessmentQuestionsSection({
  questions,
  warnings,
  questionOverrides,
  existingDirs,
  onUpdateOverride,
}: {
  questions: SerializedQuestionOutput[];
  warnings: SerializedConversionResult['warnings'];
  questionOverrides: Map<string, QuestionOverrides>;
  existingDirs: Set<string>;
  onUpdateOverride: (dirName: string, updates: Partial<QuestionOverrides>) => void;
}) {
  const [expansionCommand, setExpansionCommand] = useState({
    version: 0,
    expanded: false,
  });
  const conflictingQuestions = useMemo(
    () => questions.filter((q) => questionOverrides.get(q.directoryName)?.collides),
    [questions, questionOverrides],
  );
  const questionWarningsByDirectoryName = useMemo(
    () => buildQuestionWarningsByDirectoryName(questions, warnings),
    [questions, warnings],
  );
  const conflictCount = conflictingQuestions.length;

  const setAllConflictStrategy = (strategy: CollisionStrategy) => {
    for (const q of conflictingQuestions) {
      onUpdateOverride(q.directoryName, { collisionStrategy: strategy });
    }
  };

  return (
    <>
      {conflictCount > 0 && (
        <div className="d-flex align-items-center gap-2 p-2 bg-light border rounded mb-2 small">
          <i className="bi bi-exclamation-circle text-warning" aria-hidden="true" />
          <span className="flex-grow-1">
            {conflictCount} سوال با سوال‌های موجود تداخل دارد
          </span>
          <Button
            variant="outline-secondary"
            size="sm"
            onClick={() => setAllConflictStrategy('overwrite')}
          >
            جایگزینی همه
          </Button>
          <Button
            variant="outline-secondary"
            size="sm"
            onClick={() => setAllConflictStrategy('rename')}
          >
            تغییر نام همه
          </Button>
        </div>
      )}

      <details>
        <summary>سوال‌ها ({questions.length})</summary>

        <div className="d-flex gap-2 mb-2 mt-1 small">
          <button
            type="button"
            className="btn btn-link btn-sm p-0"
            onClick={() =>
              setExpansionCommand(({ version }) => ({ version: version + 1, expanded: true }))
            }
          >
            باز کردن همه
          </button>
          <button
            type="button"
            className="btn btn-link btn-sm p-0"
            onClick={() =>
              setExpansionCommand(({ version }) => ({ version: version + 1, expanded: false }))
            }
          >
            بستن همه
          </button>
        </div>

        <div className="d-flex flex-column gap-2 mt-2">
          {questions.map((q, qi) => (
            <QuestionReviewPanel
              key={q.directoryName}
              question={q}
              questionNumber={qi + 1}
              warnings={questionWarningsByDirectoryName.get(q.directoryName) ?? []}
              overrides={questionOverrides.get(q.directoryName)}
              existingDirs={existingDirs}
              expansionCommand={expansionCommand}
              onUpdateOverride={onUpdateOverride}
            />
          ))}
        </div>
      </details>
    </>
  );
}

export function buildQuestionWarningsByDirectoryName(
  questions: SerializedQuestionOutput[],
  warnings: SerializedConversionResult['warnings'],
): Map<string, SerializedConversionResult['warnings']> {
  const warningsByQuestionId = new Map<string, SerializedConversionResult['warnings']>();
  for (const warning of warnings) {
    if (isRubricWarning(warning.message)) continue;
    const questionWarnings = warningsByQuestionId.get(warning.questionId) ?? [];
    questionWarnings.push(warning);
    warningsByQuestionId.set(warning.questionId, questionWarnings);
  }

  const questionWarningsByDirectoryName = new Map<string, SerializedConversionResult['warnings']>();
  for (const question of questions) {
    const matchingWarnings: SerializedConversionResult['warnings'] = [];
    const seenWarningKeys = new Set<string>();
    for (const questionId of [
      question.directoryName,
      question.originalDirectoryName,
      question.sourceId,
    ]) {
      for (const warning of warningsByQuestionId.get(questionId) ?? []) {
        const key = warning.message;
        if (seenWarningKeys.has(key)) continue;
        seenWarningKeys.add(key);
        matchingWarnings.push(warning);
      }
    }
    questionWarningsByDirectoryName.set(question.directoryName, matchingWarnings);
  }

  return questionWarningsByDirectoryName;
}
