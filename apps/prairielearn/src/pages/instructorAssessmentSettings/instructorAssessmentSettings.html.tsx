import { QueryClient, useMutation, useQuery } from '@tanstack/react-query';
import clsx from 'clsx';
import { useState } from 'react';
import { Alert, Button, Form, InputGroup, Modal, Spinner } from 'react-bootstrap';
import { useForm } from 'react-hook-form';

import { run } from '@prairielearn/run';
import { getAppError, renderAppError } from '@prairielearn/trpc/client';
import { AppErrorAlert, QueryClientProviderDebug } from '@prairielearn/trpc/react';
import { StickySaveBar, type StickySaveBarAlert, useModalState } from '@prairielearn/ui';

import { CalculatorPreviewButton } from '../../components/CalculatorPreviewButton.js';
import { CalculatorTypeInput } from '../../components/CalculatorTypeInput.js';
import { GitHubButton } from '../../components/GitHubButton.js';
import { StudentLinkSharing } from '../../components/LinkSharing.js';
import { ShareSourcePubliclyCard } from '../../components/ShareSourcePubliclyCard.js';
import { AssessmentShortNameDescription } from '../../components/ShortNameDescriptions.js';
import type {
  StaffAssessment,
  StaffAssessmentModule,
  StaffAssessmentSet,
  StaffCourseInstance,
} from '../../lib/client/safe-db-types.js';
import { syncJobFailedRenderer } from '../../lib/client/syncJobFailedRenderer.js';
import {
  getAssessmentLogsUrl,
  getAssessmentStudentsUrl,
  getCourseInstanceSettingsUrl,
  getQuestionSettingsUrl,
} from '../../lib/client/url.js';
import type { AssessmentToolsConfig } from '../../lib/editors.js';
import { validateShortName } from '../../lib/short-name.js';
import { type CalculatorType } from '../../schemas/infoAssessment.js';
import type {
  AssessmentSettingsError,
  TypeChangeLocation,
} from '../../trpc/assessment/assessment-settings.js';
import { createAssessmentTrpcClient } from '../../trpc/assessment/client.js';
import { TRPCProvider, useTRPC } from '../../trpc/assessment/context.js';

function ScoringSummary({
  zonePointsRange,
  useCustomMaxPoints,
  customMaxPoints,
  bonusPoints,
}: {
  zonePointsRange: { min: number; max: number };
  useCustomMaxPoints: boolean;
  customMaxPoints: number;
  bonusPoints: number;
}) {
  const totalPoints = useCustomMaxPoints ? customMaxPoints + bonusPoints : zonePointsRange.max;

  if (useCustomMaxPoints) {
    if (customMaxPoints <= 0) {
      return (
        <Alert variant="light" className="mb-0 small">
          <i className="bi bi-info-circle-fill me-2" aria-hidden="true" />
          {bonusPoints > 0 ? (
            <>
              دانشجویان تا {totalPoints} امتیاز دریافت می‌کنند: تمام امتیازها به عنوان امتیاز تشویقی
              در نظر گرفته می‌شوند &mdash; نمره ۱۰۰٪ با ۰ امتیاز حاصل می‌شود.
            </>
          ) : (
            <>دانشجویان برای کسب نمره ۱۰۰٪ به ۰ امتیاز نیاز دارند.</>
          )}
        </Alert>
      );
    }
    const maxPerc =
      bonusPoints > 0 ? Math.round(((customMaxPoints + bonusPoints) / customMaxPoints) * 100) : 100;
    return (
      <Alert variant="light" className="mb-0 small">
        <i className="bi bi-info-circle-fill me-2" aria-hidden="true" />
        {bonusPoints > 0 ? (
          <>
            دانشجویان تا {totalPoints} امتیاز دریافت می‌کنند: نمره ۱۰۰٪ با {customMaxPoints} امتیاز،
            و تا {maxPerc}٪ با {bonusPoints} امتیاز تشویقی.
          </>
        ) : (
          <>دانشجویان برای کسب نمره ۱۰۰٪ به {customMaxPoints} امتیاز نیاز دارند.</>
        )}
      </Alert>
    );
  }

  if (bonusPoints >= zonePointsRange.max && bonusPoints > 0) {
    return (
      <Alert variant="light" className="mb-0 small">
        <i className="bi bi-info-circle-fill me-2" aria-hidden="true" />
        دانشجویان تا {totalPoints} امتیاز دریافت می‌کنند: تمام امتیاز بخش‌ها به عنوان امتیاز
        تشویقی در نظر گرفته می‌شوند &mdash; نمره ۱۰۰٪ با ۰ امتیاز حاصل می‌شود.
      </Alert>
    );
  }

  const effectiveMax = Math.max(zonePointsRange.max - bonusPoints, 0);
  const effectiveMin = Math.max(zonePointsRange.min - bonusPoints, 0);
  const isRange = effectiveMin !== effectiveMax;
  const neededText = isRange ? `${effectiveMin}–${effectiveMax}` : String(effectiveMax);
  const maxPerc =
    bonusPoints > 0 ? Math.round(((effectiveMax + bonusPoints) / effectiveMax) * 100) : 100;

  return (
    <Alert variant="light" className="mb-0 small">
      <i className="bi bi-info-circle-fill me-2" aria-hidden="true" />
      {bonusPoints > 0 ? (
        <>
          دانشجویان تا {totalPoints} امتیاز دریافت می‌کنند: نمره ۱۰۰٪ با {neededText} امتیاز، و تا{' '}
          {maxPerc}٪ با {bonusPoints} امتیاز تشویقی.
        </>
      ) : (
        <>دانشجویان برای کسب نمره ۱۰۰٪ به {neededText} امتیاز نیاز دارند.</>
      )}
    </Alert>
  );
}

interface SettingsFormValues {
  aid: string;
  title: string;
  set: string;
  number: string;
  module: string;
  text?: string;
  allow_issue_reporting: boolean;
  allow_personal_notes: boolean;
  showQuestionTitles: boolean;
  multiple_instance: boolean;
  auto_close: boolean;
  require_honor_code: boolean;
  honor_code?: string;
  max_points: string;
  max_bonus_points: string;
  constant_question_value: boolean;
  shuffle_questions: boolean;
  advance_score_perc: string;
  allow_real_time_grading: boolean;
  grade_rate_minutes: string;
  tools?: Record<string, boolean>;
  calculatorType: CalculatorType;
  share_source_publicly?: boolean;
}

interface InstructorAssessmentSettingsProps {
  trpcCsrfToken: string;
  urlPrefix: string;
  canEdit: boolean;
  canViewLogs: boolean;
  origHash: string;
  assessment: StaffAssessment;
  assessmentSet: StaffAssessmentSet;
  assessmentGHLink: string | null;
  tids: string[];
  studentLink: string;
  publicLink: string;
  assessmentSets: StaffAssessmentSet[];
  assessmentModules: StaffAssessmentModule[];
  courseInstance: StaffCourseInstance;
  assessmentTools: AssessmentToolsConfig;
  zonePointsRange: { min: number; max: number };
  nonPublicQuestionsInAssessment: { id: string; qid: string }[];
  questionSharingEnabled: boolean;
  hasInstances: boolean;
}

export function InstructorAssessmentSettings({
  trpcCsrfToken,
  urlPrefix,
  canEdit,
  canViewLogs,
  origHash,
  assessment: initialAssessment,
  assessmentSet,
  assessmentGHLink,
  tids,
  studentLink,
  publicLink,
  assessmentSets,
  assessmentModules,
  courseInstance,
  assessmentTools,
  zonePointsRange: initialZonePointsRange,
  nonPublicQuestionsInAssessment,
  questionSharingEnabled,
  hasInstances,
}: InstructorAssessmentSettingsProps) {
  const [queryClient] = useState(() => new QueryClient());
  const [trpcClient] = useState(() =>
    createAssessmentTrpcClient({
      csrfToken: trpcCsrfToken,
      courseInstanceId: courseInstance.id,
      assessmentId: initialAssessment.id,
    }),
  );
  const [assessment, setAssessment] = useState(initialAssessment);
  const [zonePointsRange, setZonePointsRange] = useState(initialZonePointsRange);
  const [currentOrigHash, setCurrentOrigHash] = useState(origHash);
  const [typeChangeMessage, setTypeChangeMessage] = useState<string | null>(null);

  return (
    <QueryClientProviderDebug client={queryClient}>
      <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
        <InstructorAssessmentSettingsInner
          key={assessment.type}
          urlPrefix={urlPrefix}
          canEdit={canEdit}
          canViewLogs={canViewLogs}
          origHash={currentOrigHash}
          setCurrentOrigHash={setCurrentOrigHash}
          assessment={assessment}
          setAssessment={setAssessment}
          assessmentSet={assessmentSet}
          assessmentGHLink={assessmentGHLink}
          tids={tids}
          studentLink={studentLink}
          publicLink={publicLink}
          assessmentSets={assessmentSets}
          assessmentModules={assessmentModules}
          assessmentTools={assessmentTools}
          zonePointsRange={zonePointsRange}
          setZonePointsRange={setZonePointsRange}
          nonPublicQuestionsInAssessment={nonPublicQuestionsInAssessment}
          courseInstanceSharedPublicly={courseInstance.share_source_publicly}
          questionSharingEnabled={questionSharingEnabled}
          hasInstances={hasInstances}
          typeChangeMessage={typeChangeMessage}
          setTypeChangeMessage={setTypeChangeMessage}
        />
      </TRPCProvider>
    </QueryClientProviderDebug>
  );
}

InstructorAssessmentSettings.displayName = 'InstructorAssessmentSettings';

function CopyAssessmentModal({
  show,
  onHide,
  onExited,
  assessment,
  assessmentSet,
  assessmentSets,
  tidSet,
  urlPrefix,
}: {
  show: boolean;
  onHide: () => void;
  onExited: () => void;
  assessment: StaffAssessment;
  assessmentSet: StaffAssessmentSet;
  assessmentSets: StaffAssessmentSet[];
  tidSet: Set<string>;
  urlPrefix: string;
}) {
  const trpc = useTRPC();
  const copyMutation = useMutation(trpc.assessmentSettings.copyAssessment.mutationOptions());
  const copyError = getAppError<AssessmentSettingsError['CopyAssessment']>(copyMutation.error);

  const placeholderNumber = assessment.number;
  const defaultSet = assessmentSet.name;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<{ aid: string; title: string; number: string; set: string }>({
    mode: 'onSubmit',
    defaultValues: { aid: '', title: '', number: '', set: defaultSet },
  });

  const handleExited = () => {
    copyMutation.reset();
    reset({ aid: '', title: '', number: '', set: defaultSet });
    onExited();
  };

  const onSubmit = handleSubmit((data) => {
    copyMutation.mutate(data, {
      onSuccess: (result) => {
        window.location.href = `${urlPrefix}/assessment/${result.assessmentId}/settings`;
      },
    });
  });

  return (
    <Modal show={show} onHide={onHide} onExited={handleExited}>
      <Modal.Header closeButton>
        <Modal.Title>ایجاد کپی از این ارزیابی</Modal.Title>
      </Modal.Header>
      <form onSubmit={onSubmit}>
        <Modal.Body>
          <AppErrorAlert
            error={copyError}
            render={{
              SYNC_JOB_FAILED: syncJobFailedRenderer(urlPrefix),
              UNKNOWN: ({ message }) => message,
            }}
            onDismiss={() => copyMutation.reset()}
          />
          <p className="text-muted small mb-3">
            ایجاد یک کپی از <code>{assessment.tid}</code>.
          </p>
          <div className="mb-3">
            <label className="form-label" htmlFor="copy-assessment-title">
              عنوان
            </label>
            <input
              id="copy-assessment-title"
              type="text"
              className={clsx('form-control', errors.title && 'is-invalid')}
              aria-invalid={errors.title ? 'true' : 'false'}
              {...(errors.title ? { 'aria-errormessage': 'copy-assessment-title-error' } : {})}
              defaultValue=""
              {...register('title', {
                validate: (value) => (value.trim() === '' ? 'وارد کردن عنوان الزامی است' : true),
              })}
            />
            {errors.title && (
              <div id="copy-assessment-title-error" className="invalid-feedback">
                {errors.title.message}
              </div>
            )}
          </div>
          <div className="mb-3">
            <label className="form-label" htmlFor="copy-assessment-aid">
              کد اختصاری (Short name)
            </label>
            <input
              id="copy-assessment-aid"
              type="text"
              className={clsx('form-control font-monospace', errors.aid && 'is-invalid')}
              aria-describedby="copy-assessment-aid-help"
              aria-invalid={errors.aid ? 'true' : 'false'}
              {...(errors.aid ? { 'aria-errormessage': 'copy-assessment-aid-error' } : {})}
              defaultValue=""
              {...register('aid', {
                validate: (value) => {
                  const trimmed = value.trim();
                  if (trimmed === '') return 'وارد کردن کد اختصاری الزامی است';
                  const result = validateShortName(trimmed);
                  if (!result.valid) return result.message;
                  if (tidSet.has(trimmed)) return 'این شناسه قبلاً استفاده شده است';
                  return true;
                },
              })}
            />
            {errors.aid && (
              <div id="copy-assessment-aid-error" className="invalid-feedback">
                {errors.aid.message}
              </div>
            )}
            <small id="copy-assessment-aid-help" className="form-text text-muted">
              <AssessmentShortNameDescription />
            </small>
          </div>
          <div className="row">
            <div className="col-md-6 mb-3 mb-md-0">
              <label className="form-label" htmlFor="copy-assessment-set">
                دسته‌بندی (Set)
              </label>
              <Form.Select id="copy-assessment-set" defaultValue={defaultSet} {...register('set')}>
                {assessmentSets.map((set) => (
                  <option key={set.id} value={set.name}>
                    {set.name}
                  </option>
                ))}
              </Form.Select>
            </div>
            <div className="col-md-6 mb-0">
              <label className="form-label" htmlFor="copy-assessment-number">
                شماره
              </label>
              <input
                id="copy-assessment-number"
                type="text"
                className="form-control"
                placeholder={placeholderNumber}
                defaultValue=""
                {...register('number')}
              />
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" disabled={copyMutation.isPending} onClick={onHide}>
            انصراف
          </Button>
          <Button type="submit" variant="primary" disabled={copyMutation.isPending}>
            {copyMutation.isPending ? 'در حال کپی...' : 'ایجاد کپی'}
          </Button>
        </Modal.Footer>
      </form>
    </Modal>
  );
}

function formatTypeChangeLocation(location: TypeChangeLocation): string {
  if (location.kind === 'assessment') return 'ارزیابی';
  const zoneLabel = location.zoneTitle
    ? `بخش ${location.zoneIndex + 1} (${location.zoneTitle})`
    : `بخش ${location.zoneIndex + 1}`;
  if (location.kind === 'zone') return zoneLabel;
  const questionLabel = location.qid
    ? `${zoneLabel}، سوال ${location.qid}`
    : `${zoneLabel}، سوال ${location.questionIndex + 1}`;
  if (location.kind === 'question') return questionLabel;
  return location.alternativeQid
    ? `${questionLabel}، گزینه جایگزین ${location.alternativeQid}`
    : `${questionLabel}، گزینه جایگزین ${location.alternativeIndex + 1}`;
}

const BLOCKER_FIELD_LABELS: Record<string, string> = {
  multipleInstance: 'چندین بار شرکت در آزمون',
  autoClose: 'غیرفعال بودن بسته‌شدن خودکار',
  requireHonorCode: 'الزام تعهدنامه اخلاقی',
  honorCode: 'متن سفارشی تعهدنامه اخلاقی',
  advanceScorePerc: 'حد نصاب نمره برای سوال بعدی',
  allowRealTimeGrading: 'غیرفعال بودن تصحیح هم‌زمان',
  constantQuestionValue: 'ارزش ثابت سوال',
  maxPoints: 'سقف حداکثر امتیاز',
  maxAutoPoints: 'سقف حداکثر امتیاز خودکار',
};

function ChangeTypeModal({
  show,
  newType,
  currentType,
  hasInstances,
  origHash,
  onHide,
  onExited,
  urlPrefix,
  studentsTabUrl,
  onSuccess,
}: {
  show: boolean;
  newType: 'Exam' | 'Homework' | null;
  currentType: 'Exam' | 'Homework';
  hasInstances: boolean;
  origHash: string;
  onHide: () => void;
  onExited: () => void;
  urlPrefix: string;
  studentsTabUrl: string;
  onSuccess: (result: {
    origHash: string;
    assessment: StaffAssessment;
    zonePointsRange: { min: number; max: number };
  }) => void;
}) {
  const trpc = useTRPC();
  const [acknowledged, setAcknowledged] = useState(false);

  const analysisQuery = useQuery(
    trpc.assessmentSettings.analyzeTypeChange.queryOptions(
      { newType: newType ?? currentType, origHash },
      { enabled: show && !hasInstances && newType != null && newType !== currentType },
    ),
  );

  const changeMutation = useMutation(
    trpc.assessmentSettings.changeAssessmentType.mutationOptions(),
  );

  const changeError = getAppError<AssessmentSettingsError['ChangeAssessmentType']>(
    changeMutation.error,
  );

  const blockers = analysisQuery.data?.blockers ?? [];
  const pointsListCollapses = analysisQuery.data?.pointsListCollapses ?? [];
  const pointsListPromotions = analysisQuery.data?.pointsListPromotions ?? [];
  const hasDestructiveChanges =
    blockers.length > 0 || pointsListCollapses.length > 0 || pointsListPromotions.length > 0;

  const handleExited = () => {
    setAcknowledged(false);
    changeMutation.reset();
    onExited();
  };

  const handleConfirm = () => {
    if (newType == null) return;
    changeMutation.mutate({ newType, origHash }, { onSuccess });
  };

  const formatAssessmentTypeFa = (t: 'Exam' | 'Homework' | null) =>
    t === 'Exam' ? 'امتحان (Exam)' : t === 'Homework' ? 'تکلیف منزل (Homework)' : '';

  return (
    <Modal show={show} backdrop="static" size="lg" onHide={onHide} onExited={handleExited}>
      <Modal.Header closeButton>
        <Modal.Title>تغییر نوع ارزیابی</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {hasInstances ? (
          <Alert variant="warning" className="mb-0">
            دانشجویان قبلاً این ارزیابی را شروع کرده‌اند. تا زمانی که نمونه‌های شرکت در آزمون وجود
            دارند، امکان تغییر نوع ارزیابی نیست. برای ایجاد تغییر، همه نمونه‌ها را در{' '}
            <Alert.Link href={studentsTabUrl}>بخش دانشجویان</Alert.Link> حذف کنید.
          </Alert>
        ) : (
          <>
            <p className="mb-3">
              در حال تغییر نوع این ارزیابی از <strong>{formatAssessmentTypeFa(currentType)}</strong>{' '}
              به <strong>{formatAssessmentTypeFa(newType ?? currentType)}</strong> هستید.
            </p>

            <Alert variant="info" className="small mb-3">
              <strong>تغییرات اعمال‌شده:</strong>
              {newType === 'Homework' ? (
                <ul className="mb-0 mt-1 ps-3">
                  <li>
                    هر سوال در هر تلاش نسخه جدیدی تولید می‌کند و امتیازها در طول تلاش‌ها جمع
                    می‌شوند.
                  </li>
                  <li>تصحیح هم‌زمان همیشه فعال است و نمی‌توان آن را غیرفعال کرد.</li>
                  <li>
                    چندین بار شرکت در آزمون، محدودیت زمانی، رمز عبور، بسته‌شدن خودکار و تعهدنامه
                    اخلاقی پشتیبانی نمی‌شوند.
                  </li>
                  <li>ترتیب سوالات به صورت پیش‌فرض ثابت است و تعهدنامه اخلاقی خاموش است.</li>
                </ul>
              ) : newType === 'Exam' ? (
                <ul className="mb-0 mt-1 ps-3">
                  <li>
                    هر دانشجو برای هر سوال یک نسخه دریافت می‌کند و می‌تواند با امتیاز کاهشی دوباره
                    تلاش کند.
                  </li>
                  <li>
                    چندین بار شرکت در آزمون، محدودیت زمانی، رمز عبور، بسته‌شدن خودکار و تعهدنامه
                    اخلاقی در دسترس قرار می‌گیرند.
                  </li>
                  <li>
                    تصحیح هم‌زمان را می‌توان در سطح ارزیابی، بخش، سوال یا گزینه جایگزین غیرفعال کرد.
                  </li>
                  <li>
                    ترتیب سوالات به صورت پیش‌فرض تصادفی (به‌هم‌ریخته) است و تعهدنامه اخلاقی فعال
                    است.
                  </li>
                </ul>
              ) : null}
            </Alert>

            {analysisQuery.isLoading && (
              <div className="text-center py-3">
                <Spinner animation="border" role="status" size="sm" />
                <span className="ms-2 text-muted">در حال تحلیل پیکربندی فعلی...</span>
              </div>
            )}

            {analysisQuery.isError && (
              <Alert variant="danger">
                تحلیل پیکربندی فعلی ناموفق بود. لطفاً دوباره تلاش کنید.
              </Alert>
            )}

            {blockers.length > 0 && (
              <Alert variant="warning" className="mb-3">
                <strong>تنظیمات زیر حذف خواهند شد:</strong>
                <ul className="mb-0 mt-2 ps-3 small">
                  {blockers.map((b) => {
                    const locationKey = formatTypeChangeLocation(b.location);
                    return (
                      <li key={`${b.field}:${locationKey}`}>
                        <code>{BLOCKER_FIELD_LABELS[b.field] ?? b.field}</code> در {locationKey}
                      </li>
                    );
                  })}
                </ul>
              </Alert>
            )}

            {pointsListCollapses.length > 0 && (
              <Alert variant="warning" className="mb-3">
                <strong>فهرست امتیاز سوالات به یک مقدار خلاصه می‌شود:</strong>
                <ul className="mb-0 mt-2 ps-3 small">
                  {pointsListCollapses.map((r) => {
                    const locationKey = formatTypeChangeLocation(r.location);
                    return (
                      <li key={`${r.field}:${locationKey}`}>
                        {locationKey} ({r.field}): <code>[{r.currentValue.join(', ')}]</code> →{' '}
                        <code>{r.newValue}</code>
                      </li>
                    );
                  })}
                </ul>
                <div className="small mt-2 mb-0">
                  سوالات تکلیف منزل از یک مقدار امتیاز برای هر نسخه استفاده می‌کنند. مقادیر سایر
                  تلاش‌ها حذف می‌شوند. پس از تغییر می‌توانید امتیاز هر سوال را تنظیم کنید.
                </div>
              </Alert>
            )}

            {pointsListPromotions.length > 0 && (
              <Alert variant="warning" className="mb-3">
                <strong>هر سوال به صورت تک‌تلاش آغاز می‌شود:</strong>
                <ul className="mb-0 mt-2 ps-3 small">
                  {pointsListPromotions.map((r) => {
                    const locationKey = formatTypeChangeLocation(r.location);
                    return (
                      <li key={`${r.field}:${locationKey}`}>
                        {locationKey} ({r.field}): <code>{r.currentValue}</code> →{' '}
                        <code>[{r.newValue.join(', ')}]</code>
                      </li>
                    );
                  })}
                </ul>
                <div className="small mt-2 mb-0">
                  تکلیف منزل در هر تلاش نسخه همان امتیاز را می‌دهد؛ امتحان امتیاز را یک بار و در
                  صورت تمایل با جدول کاهشی تلاش مجدد اعطا می‌کند. پس از تغییر می‌توانید هر سوال را
                  برای افزودن امتیازهای تلاش مجدد (مثلاً <code>[10, 7, 5]</code>) ویرایش کنید.
                </div>
              </Alert>
            )}

            <AppErrorAlert
              error={changeError}
              render={{
                SYNC_JOB_FAILED: syncJobFailedRenderer(urlPrefix),
                UNKNOWN: ({ message }) => message,
              }}
              onDismiss={() => changeMutation.reset()}
            />

            {hasDestructiveChanges && (
              <Form.Check
                id="change-type-acknowledge"
                type="checkbox"
                className="mb-0"
                label="متوجه تغییراتی که اعمال می‌شود هستم و می‌دانم این عملیات غیرقابل بازگشت است."
                checked={acknowledged}
                onChange={(e) => setAcknowledged(e.target.checked)}
              />
            )}
          </>
        )}
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" disabled={changeMutation.isPending} onClick={onHide}>
          {hasInstances ? 'بستن' : 'انصراف'}
        </Button>
        {!hasInstances && (
          <Button
            variant="primary"
            disabled={
              newType == null ||
              analysisQuery.isLoading ||
              analysisQuery.isError ||
              (hasDestructiveChanges && !acknowledged) ||
              changeMutation.isPending
            }
            onClick={handleConfirm}
          >
            {changeMutation.isPending
              ? 'در حال تغییر نوع...'
              : `تغییر به ${formatAssessmentTypeFa(newType)}`}
          </Button>
        )}
      </Modal.Footer>
    </Modal>
  );
}

function InstructorAssessmentSettingsInner({
  urlPrefix,
  canEdit,
  canViewLogs,
  origHash,
  setCurrentOrigHash,
  assessment,
  setAssessment,
  assessmentSet,
  assessmentGHLink,
  tids,
  studentLink,
  publicLink,
  assessmentSets,
  assessmentModules,
  assessmentTools,
  zonePointsRange,
  setZonePointsRange,
  nonPublicQuestionsInAssessment,
  courseInstanceSharedPublicly,
  questionSharingEnabled,
  hasInstances,
  typeChangeMessage,
  setTypeChangeMessage,
}: Omit<InstructorAssessmentSettingsProps, 'trpcCsrfToken' | 'courseInstance'> & {
  setCurrentOrigHash: (hash: string) => void;
  setAssessment: (assessment: StaffAssessment) => void;
  setZonePointsRange: (range: { min: number; max: number }) => void;
  courseInstanceSharedPublicly: boolean;
  typeChangeMessage: string | null;
  setTypeChangeMessage: (message: string | null) => void;
}) {
  const trpc = useTRPC();
  const copyModalState = useModalState<true>();
  const deleteModalState = useModalState<true>();
  const typeChangeModalState = useModalState<'Exam' | 'Homework'>();

  const currentType =
    assessment.type === 'Exam' || assessment.type === 'Homework' ? assessment.type : null;
  const [displayType, setDisplayType] = useState<'Exam' | 'Homework' | null>(currentType);

  const tidSet = new Set(tids);

  const currentModuleName =
    assessmentModules.find((m) => m.id === assessment.assessment_module_id)?.name ??
    assessmentModules[0]?.name;

  const defaultValues: SettingsFormValues = {
    aid: assessment.tid ?? '',
    title: assessment.title ?? '',
    set: assessmentSet.name,
    number: assessment.number,
    module: currentModuleName,
    text: assessment.text ?? '',
    allow_issue_reporting: assessment.allow_issue_reporting ?? true,
    allow_personal_notes: assessment.allow_personal_notes,
    showQuestionTitles: assessment.show_question_titles,
    multiple_instance: assessment.multiple_instance,
    auto_close: assessment.auto_close ?? true,
    require_honor_code: assessment.require_honor_code ?? true,
    honor_code: assessment.honor_code ?? '',
    max_points: assessment.max_points != null ? String(assessment.max_points) : '',
    max_bonus_points:
      assessment.max_bonus_points != null ? String(assessment.max_bonus_points) : '',
    constant_question_value: assessment.constant_question_value ?? false,
    shuffle_questions: assessment.shuffle_questions ?? assessment.type === 'Exam',
    advance_score_perc:
      assessment.advance_score_perc != null ? String(assessment.advance_score_perc) : '',
    allow_real_time_grading: assessment.json_allow_real_time_grading !== false,
    grade_rate_minutes:
      assessment.json_grade_rate_minutes != null ? String(assessment.json_grade_rate_minutes) : '',
    tools: Object.fromEntries(assessmentTools.map(({ name, enabled }) => [name, enabled])),
    calculatorType: assessmentTools.find((tool) => tool.name === 'calculator')?.type ?? 'advanced',
    share_source_publicly: assessment.share_source_publicly,
  };

  const {
    register,
    reset,
    watch,
    setValue,
    getValues,
    handleSubmit,
    formState: { isDirty, errors, isSubmitting },
  } = useForm<SettingsFormValues>({
    mode: 'onChange',
    defaultValues,
  });

  const [useCustomMaxPoints, setUseCustomMaxPoints] = useState(assessment.max_points != null);

  const saveMutation = useMutation(trpc.assessmentSettings.updateAssessment.mutationOptions());
  const deleteMutation = useMutation(trpc.assessmentSettings.deleteAssessment.mutationOptions());

  const appError = getAppError<AssessmentSettingsError['UpdateAssessment']>(saveMutation.error);
  const deleteError = getAppError<AssessmentSettingsError['DeleteAssessment']>(
    deleteMutation.error,
  );

  const saveAlert = run<StickySaveBarAlert | null>(() => {
    if (appError) {
      return {
        variant: 'danger',
        message: renderAppError(appError, {
          SYNC_JOB_FAILED: syncJobFailedRenderer(urlPrefix),
          UNKNOWN: ({ message }) => message,
        }),
        onDismiss: () => saveMutation.reset(),
      };
    }
    if (typeChangeMessage) {
      return {
        variant: 'success',
        message: typeChangeMessage,
        onDismiss: () => setTypeChangeMessage(null),
      };
    }
    if (saveMutation.isSuccess) {
      return {
        variant: 'success',
        message: 'تنظیمات ارزیابی با موفقیت به‌روزرسانی شد.',
        onDismiss: () => saveMutation.reset(),
      };
    }
    return null;
  });

  const toNullableNumber = (v: string) => (v === '' ? null : Number(v));

  const onFormSubmit = (data: SettingsFormValues) => {
    saveMutation.mutate(
      {
        ...data,
        share_source_publicly: data.share_source_publicly,
        max_points: useCustomMaxPoints ? toNullableNumber(data.max_points) : null,
        max_bonus_points: toNullableNumber(data.max_bonus_points),
        advance_score_perc: toNullableNumber(data.advance_score_perc),
        grade_rate_minutes: toNullableNumber(data.grade_rate_minutes),
        origHash,
      },
      {
        onSuccess: (result) => {
          setCurrentOrigHash(result.origHash);
          // The sharing card reflects `assessment.share_source_publicly` (not form
          // state), and the mutation returns only the new hash, so mirror the saved
          // value onto `assessment` to avoid showing stale sharing status until the
          // next page load. `??` keeps the current value when the field was omitted
          // (e.g. a disabled checkbox).
          setAssessment({
            ...assessment,
            share_source_publicly: data.share_source_publicly ?? assessment.share_source_publicly,
          });
          reset(data);
          setUseCustomMaxPoints(data.max_points !== '');
        },
      },
    );
  };

  const requireHonorCode = watch('require_honor_code');
  const currentAid = watch('aid');
  const currentBonusPoints = Number(watch('max_bonus_points')) || 0;
  const effectiveMaxPoints = Math.max(zonePointsRange.max - currentBonusPoints, 0);
  const effectiveMinPoints = Math.max(zonePointsRange.min - currentBonusPoints, 0);
  const effectiveMaxPointsDisplay =
    effectiveMinPoints !== effectiveMaxPoints
      ? `${effectiveMinPoints}–${effectiveMaxPoints}`
      : String(effectiveMaxPoints);

  const currentGHLink =
    assessmentGHLink && assessment.tid
      ? assessmentGHLink.replace(
          `/assessments/${encodeURIComponent(assessment.tid)}`,
          `/assessments/${encodeURIComponent(currentAid)}`,
        )
      : assessmentGHLink;

  return (
    <>
      <CopyAssessmentModal
        show={copyModalState.show}
        assessment={assessment}
        assessmentSet={assessmentSet}
        assessmentSets={assessmentSets}
        tidSet={tidSet}
        urlPrefix={urlPrefix}
        onHide={copyModalState.onHide}
        onExited={copyModalState.onExited}
      />

      {currentType != null && (
        <ChangeTypeModal
          show={typeChangeModalState.show}
          newType={typeChangeModalState.data}
          currentType={currentType}
          hasInstances={hasInstances}
          origHash={origHash}
          urlPrefix={urlPrefix}
          studentsTabUrl={getAssessmentStudentsUrl({
            courseInstanceId: assessment.course_instance_id,
            assessmentId: assessment.id,
          })}
          onHide={() => {
            setDisplayType(currentType);
            typeChangeModalState.onHide();
          }}
          onExited={typeChangeModalState.onExited}
          onSuccess={(result) => {
            setAssessment(result.assessment);
            setZonePointsRange(result.zonePointsRange);
            setCurrentOrigHash(result.origHash);
            setTypeChangeMessage(
              `نوع ارزیابی به ${result.assessment.type === 'Exam' ? 'امتحان (Exam)' : 'تکلیف منزل (Homework)'} تغییر یافت.`,
            );
            typeChangeModalState.onHide();
          }}
        />
      )}

      <Modal
        show={deleteModalState.show}
        onHide={deleteModalState.onHide}
        onExited={() => {
          deleteMutation.reset();
          deleteModalState.onExited();
        }}
      >
        <Modal.Header closeButton>
          <Modal.Title>حذف</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <AppErrorAlert
            error={deleteError}
            render={{
              SYNC_JOB_FAILED: syncJobFailedRenderer(urlPrefix),
              UNKNOWN: ({ message }) => message,
            }}
            onDismiss={() => deleteMutation.reset()}
          />
          <p>
            آیا از حذف ارزیابی <b>{assessment.tid}</b> مطمئن هستید؟
          </p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={deleteModalState.onHide}>
            انصراف
          </Button>
          <Button
            variant="danger"
            disabled={deleteMutation.isPending}
            onClick={() =>
              deleteMutation.mutate(undefined, {
                onSuccess: () => {
                  window.location.href = `${urlPrefix}/instance_admin/assessments`;
                },
              })
            }
          >
            {deleteMutation.isPending ? 'در حال حذف...' : 'حذف'}
          </Button>
        </Modal.Footer>
      </Modal>

      <form name="edit-assessment-settings-form" onSubmit={handleSubmit(onFormSubmit)}>
        <div className="container d-flex flex-column gap-3 py-3">
          <div className="card">
            <div className="card-body">
              <h2 className="h5 card-title mb-3">عمومی</h2>
              <div className="mb-3">
                <label className="form-label" htmlFor="title">
                  عنوان
                </label>
                <input
                  type="text"
                  className="form-control"
                  id="title"
                  aria-describedby="title-help"
                  disabled={!canEdit}
                  defaultValue={defaultValues.title}
                  {...register('title')}
                />
                <small id="title-help" className="form-text text-muted">
                  نام کامل ارزیابی که برای کاربران نمایش داده می‌شود.
                </small>
              </div>
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label" htmlFor="aid">
                    کد اختصاری (Short name)
                  </label>
                  <input
                    type="text"
                    className={clsx('form-control font-monospace', errors.aid && 'is-invalid')}
                    id="aid"
                    aria-invalid={errors.aid ? 'true' : 'false'}
                    aria-describedby="aid-help"
                    {...(errors.aid ? { 'aria-errormessage': 'aid-error' } : {})}
                    disabled={!canEdit}
                    defaultValue={defaultValues.aid}
                    {...register('aid', {
                      required: 'وارد کردن کد اختصاری الزامی است',
                      validate: {
                        shortName: (value) => {
                          const result = validateShortName(value, defaultValues.aid);
                          return result.valid || result.message;
                        },
                        duplicate: (value) => {
                          if (tidSet.has(value) && value !== defaultValues.aid) {
                            return 'این شناسه قبلاً استفاده شده است';
                          }
                          return true;
                        },
                      },
                    })}
                  />
                  {errors.aid && (
                    <div id="aid-error" className="invalid-feedback">
                      {errors.aid.message}
                    </div>
                  )}
                  <small id="aid-help" className="form-text text-muted">
                    <AssessmentShortNameDescription />
                  </small>
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label" htmlFor="type">
                    نوع ارزیابی
                  </label>
                  {currentType == null ? (
                    <input
                      type="text"
                      className="form-control"
                      id="type"
                      aria-describedby="type-help"
                      value={assessment.type}
                      disabled
                      readOnly
                    />
                  ) : (
                    <Form.Select
                      id="type"
                      aria-describedby="type-help"
                      disabled={!canEdit || isDirty}
                      value={displayType ?? currentType}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value !== 'Exam' && value !== 'Homework') return;
                        setDisplayType(value);
                        if (value !== currentType) {
                          typeChangeModalState.showWithData(value);
                        }
                      }}
                    >
                      <option value="Exam">امتحان (Exam)</option>
                      <option value="Homework">تکلیف منزل (Homework)</option>
                    </Form.Select>
                  )}
                  <small id="type-help" className="form-text text-muted">
                    نوع ارزیابی؛ می‌تواند یکی از گزینه‌های{' '}
                    <a href="https://docs.prairielearn.com/assessment/configuration/#assessment-types">
                      تکلیف منزل (Homework) یا امتحان (Exam)
                    </a>{' '}
                    باشد.{' '}
                    {isDirty
                      ? 'پیش از تغییر نوع ارزیابی، سایر تغییرات خود را ذخیره یا لغو کنید.'
                      : 'تغییر نوع ممکن است تنظیمات موجود را تغییر دهد یا حذف کند.'}
                  </small>
                </div>
              </div>
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label" htmlFor="set">
                    دسته‌بندی (Set)
                  </label>
                  <Form.Select
                    id="set"
                    aria-describedby="set-help"
                    disabled={!canEdit}
                    defaultValue={defaultValues.set}
                    {...register('set')}
                  >
                    {assessmentSets.map((set) => (
                      <option key={set.id} value={set.name}>
                        {set.name}
                      </option>
                    ))}
                  </Form.Select>
                  <small id="set-help" className="form-text text-muted">
                    <a href={`${urlPrefix}/course_admin/sets`}>دسته‌بندی ارزیابی (Set)</a> که این
                    ارزیابی به آن تعلق دارد.
                  </small>
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label" htmlFor="number">
                    شماره
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    id="number"
                    aria-describedby="number-help"
                    disabled={!canEdit}
                    defaultValue={defaultValues.number}
                    {...register('number')}
                  />
                  <small id="number-help" className="form-text text-muted">
                    شماره ارزیابی در این دسته‌بندی.
                  </small>
                </div>
              </div>
              <div className="mb-3">
                <label className="form-label" htmlFor="module">
                  سرفصل / ماژول
                </label>
                <Form.Select
                  id="module"
                  aria-describedby="module-help"
                  disabled={!canEdit}
                  defaultValue={defaultValues.module}
                  {...register('module')}
                >
                  {assessmentModules.map((mod) => (
                    <option key={mod.id} value={mod.name}>
                      {mod.name}
                    </option>
                  ))}
                </Form.Select>
                <small id="module-help" className="form-text text-muted">
                  <a href={`${urlPrefix}/course_admin/modules`}>سرفصل (Module)</a> که این ارزیابی
                  به آن تعلق دارد.
                </small>
              </div>
              <div className="mb-3">
                <label className="form-label" htmlFor="text">
                  متن توضیحات
                </label>
                <textarea
                  className="form-control"
                  id="text"
                  aria-describedby="text-help"
                  disabled={!canEdit}
                  defaultValue={defaultValues.text}
                  {...register('text')}
                />
                <small id="text-help" className="form-text text-muted">
                  متن HTML که در صفحه نمای کلی ارزیابی نمایش داده می‌شود.
                </small>
              </div>

              <StudentLinkSharing
                studentLink={studentLink}
                studentLinkMessage="لینکی که دانشجویان برای دسترسی به این ارزیابی استفاده خواهند کرد."
              />
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <h2 className="h5 card-title mb-3">نمره‌دهی</h2>
              <div className="form-check mb-3">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="use_custom_max_points"
                  checked={useCustomMaxPoints}
                  disabled={!canEdit}
                  onChange={(e) => {
                    setUseCustomMaxPoints(e.target.checked);
                    if (e.target.checked) {
                      if (getValues('max_points') === '') {
                        setValue(
                          'max_points',
                          String(Math.max(zonePointsRange.max - currentBonusPoints, 0)),
                          { shouldDirty: true },
                        );
                      }
                    } else {
                      setValue('max_points', '', { shouldDirty: true });
                    }
                  }}
                />
                <label className="form-check-label" htmlFor="use_custom_max_points">
                  تعیین حداکثر امتیاز سفارشی
                </label>
                <div className="small text-muted">
                  به صورت پیش‌فرض، حداکثر امتیاز برابر مجموع امتیاز تمام بخش‌هاست.
                </div>
              </div>
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label" htmlFor="max_points">
                    حداکثر امتیاز
                  </label>
                  {useCustomMaxPoints ? (
                    <input
                      type="number"
                      className={clsx('form-control', errors.max_points && 'is-invalid')}
                      id="max_points"
                      aria-describedby="max-points-help"
                      aria-invalid={errors.max_points ? 'true' : 'false'}
                      {...(errors.max_points ? { 'aria-errormessage': 'max-points-error' } : {})}
                      step="any"
                      disabled={!canEdit}
                      defaultValue={defaultValues.max_points}
                      {...register('max_points', {
                        validate: (v) => v === '' || Number(v) >= 0 || 'باید ۰ یا بیشتر باشد',
                      })}
                    />
                  ) : (
                    <input
                      type="text"
                      className="form-control"
                      id="max_points"
                      aria-describedby="max-points-help"
                      value={effectiveMaxPointsDisplay}
                      disabled
                      readOnly
                    />
                  )}
                  {errors.max_points && (
                    <div id="max-points-error" className="invalid-feedback">
                      {errors.max_points.message}
                    </div>
                  )}
                  <small id="max-points-help" className="form-text text-muted">
                    مقدار امتیازی که برای کسب نمره ۱۰۰٪ در این ارزیابی باید به دست آید.
                    {useCustomMaxPoints
                      ? ` جایگزین مجموع محاسبه‌شده امتیاز بخش‌ها (${zonePointsRange.min !== zonePointsRange.max ? `${zonePointsRange.min}–${zonePointsRange.max}` : zonePointsRange.max}).`
                      : ''}
                  </small>
                  {zonePointsRange.min !== zonePointsRange.max && (
                    <Alert variant="warning" className="mt-2 mb-0 py-2 small">
                      دانشجویان ممکن است مجموع امتیاز متفاوتی دریافت کنند زیرا این ارزیابی دارای
                      بخش‌ها یا مجموعه‌های جایگزینی است که سوالات را به صورت تصادفی با امتیازهای
                      متفاوت انتخاب می‌کنند.
                    </Alert>
                  )}
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label" htmlFor="max_bonus_points">
                    امتیاز تشویقی
                  </label>
                  <input
                    type="number"
                    className={clsx('form-control', errors.max_bonus_points && 'is-invalid')}
                    id="max_bonus_points"
                    aria-describedby="max-bonus-points-help"
                    aria-invalid={errors.max_bonus_points ? 'true' : 'false'}
                    {...(errors.max_bonus_points
                      ? { 'aria-errormessage': 'max-bonus-points-error' }
                      : {})}
                    placeholder="0"
                    step="any"
                    disabled={!canEdit}
                    defaultValue={defaultValues.max_bonus_points}
                    {...register('max_bonus_points', {
                      validate: (v) => v === '' || Number(v) >= 0 || 'باید ۰ یا بیشتر باشد',
                    })}
                  />
                  {errors.max_bonus_points && (
                    <div id="max-bonus-points-error" className="invalid-feedback">
                      {errors.max_bonus_points.message}
                    </div>
                  )}
                  <small id="max-bonus-points-help" className="form-text text-muted">
                    امتیاز اضافی که دانشجویان می‌توانند فراتر از ۱۰۰٪ در این ارزیابی کسب کنند.
                  </small>
                </div>
              </div>
              <ScoringSummary
                zonePointsRange={zonePointsRange}
                useCustomMaxPoints={useCustomMaxPoints}
                customMaxPoints={Number(watch('max_points')) || 0}
                bonusPoints={currentBonusPoints}
              />
              {assessment.type === 'Homework' && (
                <div className="form-check border-top mt-3 pt-3">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="constant_question_value"
                    aria-describedby="constant-question-value-help"
                    disabled={!canEdit}
                    defaultChecked={defaultValues.constant_question_value}
                    {...register('constant_question_value')}
                  />
                  <label className="form-check-label" htmlFor="constant_question_value">
                    ارزش ثابت سوال
                  </label>
                  <div id="constant-question-value-help" className="small text-muted">
                    ثابت نگه داشتن ارزش سوال پس از آنکه دانشجو آن را به درستی حل کرد.
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <h2 className="h5 card-title mb-3">رفتار سوالات</h2>
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="shuffle_questions"
                  aria-describedby="shuffle-questions-help"
                  disabled={!canEdit}
                  defaultChecked={defaultValues.shuffle_questions}
                  {...register('shuffle_questions')}
                />
                <label className="form-check-label" htmlFor="shuffle_questions">
                  بر زدن ترتیب سوالات
                </label>
                <div id="shuffle-questions-help" className="small text-muted">
                  تعیین می‌کند که آیا سوالات در نمای دانشجو به صورت تصادفی مرتب شوند یا خیر.
                </div>
              </div>
              {assessment.type === 'Exam' && (
                <div className="border-top mt-3 pt-3">
                  <label className="form-label" htmlFor="advance_score_perc">
                    حد نصاب نمره برای سوال بعدی
                  </label>
                  <div className="row">
                    <div className="col-md-4">
                      <InputGroup>
                        <input
                          type="number"
                          className={clsx(
                            'form-control',
                            errors.advance_score_perc && 'is-invalid',
                          )}
                          id="advance_score_perc"
                          aria-describedby="advance-score-perc-help"
                          aria-invalid={errors.advance_score_perc ? 'true' : 'false'}
                          {...(errors.advance_score_perc
                            ? { 'aria-errormessage': 'advance-score-perc-error' }
                            : {})}
                          step="1"
                          disabled={!canEdit}
                          defaultValue={defaultValues.advance_score_perc}
                          {...register('advance_score_perc', {
                            validate: (v) => {
                              if (v === '') return true;
                              const n = Number(v);
                              if (n < 0 || n > 100) return 'باید بین ۰ تا ۱۰۰ باشد';
                              return true;
                            },
                          })}
                        />
                        <InputGroup.Text>%</InputGroup.Text>
                      </InputGroup>
                    </div>
                  </div>
                  {errors.advance_score_perc && (
                    <div id="advance-score-perc-error" className="invalid-feedback d-block">
                      {errors.advance_score_perc.message}
                    </div>
                  )}
                  <small id="advance-score-perc-help" className="form-text text-muted">
                    حداقل درصد نمره پیش‌فرض تصحیح خودکار در هر سوال برای باز شدن سوال بعدی. می‌توان
                    آن را برای سوالات جداگانه بازنویسی کرد.
                  </small>
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <h2 className="h5 card-title mb-3">تصحیح و نمره‌دهی</h2>
              {assessment.type === 'Exam' && (
                <div className="form-check mb-3 pb-3 border-bottom">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="allow_real_time_grading"
                    aria-describedby="allow-real-time-grading-help"
                    disabled={!canEdit}
                    defaultChecked={defaultValues.allow_real_time_grading}
                    {...register('allow_real_time_grading')}
                  />
                  <label className="form-check-label" htmlFor="allow_real_time_grading">
                    اجازه تصحیح هم‌زمان
                  </label>
                  <div id="allow-real-time-grading-help" className="small text-muted">
                    اجازه به دانشجویان برای مشاهده نتایج تصحیح در حین شرکت در آزمون. به صورت
                    پیش‌فرض فعال است.
                  </div>
                </div>
              )}
              <div>
                <label className="form-label" htmlFor="grade_rate_minutes">
                  فاصله زمانی تصحیح (دقیقه)
                </label>
                <div className="row">
                  <div className="col-md-4">
                    <input
                      type="number"
                      className={clsx('form-control', errors.grade_rate_minutes && 'is-invalid')}
                      id="grade_rate_minutes"
                      aria-describedby="grade-rate-minutes-help"
                      aria-invalid={errors.grade_rate_minutes ? 'true' : 'false'}
                      {...(errors.grade_rate_minutes
                        ? { 'aria-errormessage': 'grade-rate-minutes-error' }
                        : {})}
                      placeholder="0"
                      step="any"
                      disabled={!canEdit}
                      defaultValue={defaultValues.grade_rate_minutes}
                      {...register('grade_rate_minutes', {
                        validate: (v) => v === '' || Number(v) >= 0 || 'باید ۰ یا بیشتر باشد',
                      })}
                    />
                    {errors.grade_rate_minutes && (
                      <div id="grade-rate-minutes-error" className="invalid-feedback">
                        {errors.grade_rate_minutes.message}
                      </div>
                    )}
                  </div>
                </div>
                <small id="grade-rate-minutes-help" className="form-text text-muted">
                  حداقل زمان (به دقیقه) بین دو ارسال نمره‌دهی‌شده برای یک سوال یکسان.
                </small>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <h2 className="h5 card-title mb-3">تنظیمات دانشجو</h2>
              <div className="form-check mb-3">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="allow_issue_reporting"
                  aria-describedby="allow-issue-reporting-help"
                  disabled={!canEdit}
                  defaultChecked={defaultValues.allow_issue_reporting}
                  {...register('allow_issue_reporting')}
                />
                <label className="form-check-label" htmlFor="allow_issue_reporting">
                  اجازه گزارش مشکل
                </label>
                <div id="allow-issue-reporting-help" className="small text-muted">
                  اجازه به دانشجویان برای گزارش مشکل در سوالات ارزیابی.
                </div>
              </div>
              <div className="form-check mb-3">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="allow_personal_notes"
                  aria-describedby="allow-personal-notes-help"
                  disabled={!canEdit}
                  defaultChecked={defaultValues.allow_personal_notes}
                  {...register('allow_personal_notes')}
                />
                <label className="form-check-label" htmlFor="allow_personal_notes">
                  اجازه یادداشت‌های شخصی
                </label>
                <div id="allow-personal-notes-help" className="small text-muted">
                  اجازه به دانشجویان برای بارگذاری یادداشت‌های شخصی برای این ارزیابی.
                </div>
              </div>
              <div className={clsx('form-check', assessment.type === 'Exam' && 'mb-3')}>
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="show_question_titles"
                  aria-describedby="show-question-titles-help"
                  disabled={!canEdit}
                  defaultChecked={defaultValues.showQuestionTitles}
                  {...register('showQuestionTitles')}
                />
                <label className="form-check-label" htmlFor="show_question_titles">
                  نمایش عنوان سوالات به دانشجویان
                </label>
                <div id="show-question-titles-help" className="small text-muted">
                  عنوان سوالات به دانشجویان در شناسایی سوال کمک می‌کند، اما ممکن است شامل نام
                  موضوع یا اطلاعاتی باشد که فقط برای مدرسین است.
                </div>
              </div>
              {assessment.type === 'Exam' && (
                <>
                  <div className="form-check mb-3">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="multiple_instance"
                      aria-describedby="multiple-instance-help"
                      disabled={!canEdit}
                      defaultChecked={defaultValues.multiple_instance}
                      {...register('multiple_instance')}
                    />
                    <label className="form-check-label" htmlFor="multiple_instance">
                      چندین بار شرکت در آزمون
                    </label>
                    <div id="multiple-instance-help" className="small text-muted">
                      اجازه به دانشجویان برای ایجاد دفعات بیشتر شرکت در ارزیابی.
                    </div>
                  </div>
                  <div className="form-check mb-3">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="auto_close"
                      aria-describedby="auto-close-help"
                      disabled={!canEdit}
                      defaultChecked={defaultValues.auto_close}
                      {...register('auto_close')}
                    />
                    <label className="form-check-label" htmlFor="auto_close">
                      بسته‌شدن خودکار
                    </label>
                    <div id="auto-close-help" className="small text-muted">
                      بستن خودکار ارزیابی پس از ۶ ساعت عدم فعالیت.
                    </div>
                  </div>
                  <div className={clsx('form-check', requireHonorCode && 'mb-3')}>
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="require_honor_code"
                      aria-describedby="require-honor-code-help"
                      disabled={!canEdit}
                      defaultChecked={defaultValues.require_honor_code}
                      {...register('require_honor_code')}
                    />
                    <label className="form-check-label" htmlFor="require_honor_code">
                      الزام تعهدنامه اخلاقی
                    </label>
                    <div id="require-honor-code-help" className="small text-muted">
                      الزام دانشجویان به پذیرش تعهدنامه اخلاقی پیش از شروع آزمون.
                    </div>
                  </div>
                  {requireHonorCode && (
                    <div className="mb-0">
                      <label className="form-label" htmlFor="honor_code">
                        متن سفارشی تعهدنامه اخلاقی
                      </label>
                      <textarea
                        className="form-control"
                        id="honor_code"
                        aria-describedby="honor-code-help"
                        disabled={!canEdit}
                        defaultValue={defaultValues.honor_code}
                        {...register('honor_code')}
                      />
                      <small id="honor-code-help" className="form-text text-muted">
                        متن تعهدنامه اخلاقی سفارشی که پیش از شروع آزمون به دانشجویان نمایش داده
                        می‌شود. از قالب‌بندی Markdown پشتیبانی می‌کند؛ HTML پشتیبانی نمی‌شود. برای
                        درج نام دانشجو از <code>{'{{user_name}}'}</code> استفاده کنید. برای استفاده
                        از تعهدنامه پیش‌فرض، این بخش را خالی بگذارید.
                      </small>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-body">
              <h2 className="h5 card-title mb-3">ابزارها</h2>
              {assessmentTools.map(({ name, label, enabled }, i) => (
                <div
                  key={name}
                  className={clsx(
                    'd-flex flex-wrap align-items-center justify-content-between gap-3',
                    i < assessmentTools.length - 1 && 'mb-3',
                  )}
                >
                  <div className="form-check">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id={`tool_${name}`}
                      disabled={!canEdit}
                      defaultChecked={enabled}
                      {...register(`tools.${name}`)}
                    />
                    <label className="form-check-label" htmlFor={`tool_${name}`}>
                      {name === 'calculator' ? 'ماشین‌حساب' : label}
                    </label>
                  </div>
                  {name === 'calculator' && watch('tools.calculator') && (
                    <CalculatorPreviewButton type={watch('calculatorType')} />
                  )}
                </div>
              ))}
              {watch('tools.calculator') && (
                <CalculatorTypeInput
                  id="calculator-type"
                  value={watch('calculatorType')}
                  disabled={!canEdit}
                  onChange={(value) => setValue('calculatorType', value, { shouldDirty: true })}
                />
              )}
            </div>
          </div>

          {questionSharingEnabled && (
            <ShareSourcePubliclyCard
              alreadyShared={assessment.share_source_publicly}
              canEdit={canEdit}
              registerProps={register('share_source_publicly')}
              defaultChecked={defaultValues.share_source_publicly}
              blockingChildren={nonPublicQuestionsInAssessment.map((q) => ({
                id: q.id,
                href: getQuestionSettingsUrl({
                  questionId: q.id,
                  courseInstanceId: assessment.course_instance_id,
                }),
                label: q.qid,
              }))}
              publicLink={publicLink}
              entityNoun="ارزیابی"
              childNoun="سوالات"
              unshareBlock={
                assessment.share_source_publicly && courseInstanceSharedPublicly
                  ? {
                      parentNoun: 'ارائه درس',
                      href: getCourseInstanceSettingsUrl(assessment.course_instance_id),
                    }
                  : undefined
              }
            />
          )}

          {(currentGHLink || canViewLogs || canEdit) && (
            <div className="card">
              <div className="card-body">
                <h2 className="h5 card-title mb-3">مدیریت ارزیابی</h2>
                <div className="d-flex flex-column gap-3">
                  {currentGHLink && (
                    <div className="d-flex flex-wrap align-items-center justify-content-between gap-3">
                      <div>
                        <div className="fw-semibold">مشاهده کد منبع در GitHub</div>
                        <div className="small text-muted">
                          باز کردن فایل‌های منبع این ارزیابی در مخزن درس.
                        </div>
                      </div>
                      <GitHubButton gitHubLink={currentGHLink} variant="outline-secondary" />
                    </div>
                  )}
                  {canViewLogs && (
                    <div
                      className={clsx(
                        'd-flex flex-wrap align-items-center justify-content-between gap-3',
                        currentGHLink && 'border-top pt-3',
                      )}
                    >
                      <div>
                        <div className="fw-semibold">مشاهده گزارش‌های ارزیابی</div>
                        <div className="small text-muted">
                          مرور تاریخچه عملیات دسته‌ای انجام‌شده روی نمونه‌های این ارزیابی.
                        </div>
                      </div>
                      <a
                        href={getAssessmentLogsUrl({
                          courseInstanceId: assessment.course_instance_id,
                          assessmentId: assessment.id,
                        })}
                        className="btn btn-sm btn-outline-secondary"
                      >
                        <i className="bi bi-clock-history me-1" aria-hidden="true" />
                        مشاهده گزارش‌ها
                      </a>
                    </div>
                  )}
                  {canEdit && (
                    <>
                      <div
                        className={clsx(
                          'd-flex flex-wrap align-items-center justify-content-between gap-3',
                          (currentGHLink || canViewLogs) && 'border-top pt-3',
                        )}
                      >
                        <div>
                          <div className="fw-semibold">ایجاد کپی از این ارزیابی</div>
                          <div className="small text-muted">
                            ساخت یک نسخه تکراری از این ارزیابی برای استفاده به عنوان نقطه شروع.
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline-primary"
                          onClick={() => copyModalState.showWithData(true)}
                        >
                          <i className="bi bi-copy me-1" aria-hidden="true" />
                          ایجاد کپی
                        </Button>
                      </div>
                      <div className="d-flex flex-wrap align-items-center justify-content-between gap-3 border-top pt-3">
                        <div>
                          <div className="fw-semibold">حذف این ارزیابی</div>
                          <div className="small text-muted">
                            حذف دائمی این ارزیابی و تمامی داده‌های دانشجویان مرتبط با آن.
                          </div>
                        </div>
                        <Button
                          size="sm"
                          variant="outline-danger"
                          onClick={() => deleteModalState.showWithData(true)}
                        >
                          <i className="bi bi-trash me-1" aria-hidden="true" />
                          حذف
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {canEdit && (
          <StickySaveBar
            visible={isDirty}
            isSaving={isSubmitting || saveMutation.isPending}
            alert={saveAlert}
            onCancel={() => {
              reset();
              setUseCustomMaxPoints(getValues('max_points') !== '');
              saveMutation.reset();
            }}
          />
        )}
      </form>
    </>
  );
}
