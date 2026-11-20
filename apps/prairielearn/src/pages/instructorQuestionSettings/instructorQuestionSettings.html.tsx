import clsx from 'clsx';
import { useMemo, useRef, useState } from 'react';
import { Form } from 'react-bootstrap';
import { useController, useForm } from 'react-hook-form';

import {
  imageRegistryErrorText,
  imageRegistryHelpText,
  imageRegistryRestrictionsText,
  isSupportedImageRegistry,
} from '@prairielearn/docker-utils/registry';
import { ComboBox, type ComboBoxItem, StickySaveBar, TagPicker } from '@prairielearn/ui';

import { PublicLinkSharing } from '../../components/LinkSharing.js';
import { QuestionShortNameDescription } from '../../components/ShortNameDescriptions.js';
import { TagBadge } from '../../components/TagBadge.js';
import { TagDescription } from '../../components/TagDescription.js';
import { TopicBadge } from '../../components/TopicBadge.js';
import { TopicDescription } from '../../components/TopicDescription.js';
import type {
  StaffCourseInstance,
  StaffQuestion,
  StaffTag,
  StaffTopic,
} from '../../lib/client/safe-db-types.js';
import { idsEqual } from '../../lib/id.js';
import { validateShortName } from '../../lib/short-name.js';
import type { QuestionSharingSetRow } from '../../models/sharing-set.js';
import { coerceToNumber } from '../instructorAssessmentQuestions/utils/formHelpers.js';

import { PreferencesTable } from './components/PreferencesTable.js';
import { QuestionSettingsCardFooter } from './components/QuestionSettingsCardFooter.js';
import { QuestionTestsForm } from './components/QuestionTestsForm.js';
import type {
  EditableCourse,
  PreferenceField,
  QuestionSettingsFormValues,
  SelectedAssessments,
} from './instructorQuestionSettings.types.js';

function AuthorLabel({ uid, name }: { uid: string; name?: string | null }) {
  if (/^https:\/\/orcid\.org\/\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/.test(uid)) {
    return (
      <a href={uid} target="_blank" rel="noopener noreferrer">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 32 32"
          fill="none"
          width="16"
          height="16"
          role="img"
          aria-label="ORCID iD"
          className="me-1"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M29.474 16c0 7.442-6.032 13.474-13.474 13.474S2.526 23.442 2.526 16 8.558 2.526 16 2.526 29.474 8.558 29.474 16Z"
            fill="#fff"
          />
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M32 16c0 8.837-7.163 16-16 16S0 24.837 0 16 7.163 0 16 0s16 7.163 16 16ZM16 29.474c7.442 0 13.474-6.032 13.474-13.474S23.442 2.526 16 2.526 2.526 8.558 2.526 16 8.558 29.474 16 29.474Z"
            fill="#7FAA26"
          />
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M18.22 10.973h-4.547v11.6h4.569c3.8 0 6.133-2.82 6.133-5.8 0-1.365-.469-2.815-1.478-3.925-1.013-1.115-2.557-1.875-4.676-1.875Zm-.177 9.732h-2.347v-7.864h2.264c1.521 0 2.603.46 3.304 1.167.703.709 1.046 1.688 1.046 2.765 0 .654-.2 1.641-.83 2.46-.621.808-1.677 1.473-3.437 1.473Zm-.083-8.073c3.13 0 4.558 1.898 4.558 4.141 0-2.243-1.429-4.141-4.558-4.141h-2.472 2.472Zm6.205 4.017.001.124c0 2.869-2.242 5.591-5.924 5.591h-4.36V11.182v11.182h4.36c3.682 0 5.924-2.722 5.924-5.591l-.001-.124ZM9.5 11.005v11.588h2.024V11.005H9.5Zm1.815.208v11.172-11.172H9.71h1.606ZM10.512 10.15c.7 0 1.262-.575 1.262-1.263 0-.687-.561-1.262-1.262-1.262-.7 0-1.262.563-1.262 1.262 0 .688.561 1.262 1.262 1.262Zm.614-.408a1.044 1.044 0 0 0 0 0Z"
            fill="#7FAA26"
          />
        </svg>
        {uid}
      </a>
    );
  }
  return name ? (
    <>
      <span className="text-body">{name}</span>{' '}
      <span className="text-secondary fw-normal">{uid}</span>
    </>
  ) : (
    <span className="text-body">{uid}</span>
  );
}

function ImageRegistryHelp({ id }: { id: string }) {
  return (
    <small id={id} className="form-text text-muted">
      از ایمیج‌های عمومی مخازن Docker Hub (مانند <code>docker.io</code>)، GHCR (مانند <code>ghcr.io</code>)، Quay، GitLab یا Amazon ECR Public استفاده کنید. به عنوان مثال: <code>docker.io/org/image:tag</code> یا <code>ghcr.io/org/image:tag</code>. دامنه‌های سفارشی رجیستری و پورت‌های صریح پشتیبانی نمی‌شوند.
    </small>
  );
}

function AssessmentBadges({
  assessmentsWithQuestion,
  courseInstanceId,
}: {
  assessmentsWithQuestion: SelectedAssessments[];
  courseInstanceId: string;
}) {
  const assessmentsInCourseInstance = assessmentsWithQuestion.find((a) =>
    idsEqual(a.course_instance_id, courseInstanceId),
  );

  if (
    !assessmentsInCourseInstance?.assessments ||
    assessmentsInCourseInstance.assessments.length === 0
  ) {
    return (
      <small className="text-muted text-center">
        این سوال در هیچ ارزیابی در این دوره گنجانده نشده است.
      </small>
    );
  }

  return (
    <div className="d-flex flex-wrap gap-1">
      {assessmentsInCourseInstance.assessments.map((assessment) => (
        <a
          key={assessment.assessment_id}
          href={`/pl/course_instance/${assessmentsInCourseInstance.course_instance_id}/instructor/assessment/${assessment.assessment_id}`}
          className={`btn btn-badge color-${assessment.color}`}
        >
          {assessment.label}
        </a>
      ))}
    </div>
  );
}

function validateJsonObject(value: string): string | true {
  if (!value || value.trim() === '' || value.trim() === '{}') return true;
  try {
    const parsed = JSON.parse(value);
    if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) {
      return 'باید یک شیء معتبر JSON باشد';
    }
    return true;
  } catch {
    return 'فرمت JSON نامعتبر است';
  }
}

interface QuestionSharingConstraints {
  used_in_other_course: boolean;
  used_in_same_course_public_assessment: boolean;
  locked_sharing_set_names: string[];
}

type SharingMessage =
  | 'used-in-other-course'
  | 'public-assessment-share-publicly'
  | 'public-assessment-share-source-publicly';

function getSharingControlState({
  canEdit,
  constraints,
  persistedSharePublicly,
  sharePublicly,
  shareSourcePublicly,
}: {
  canEdit: boolean;
  constraints: QuestionSharingConstraints;
  persistedSharePublicly: boolean;
  sharePublicly: boolean;
  shareSourcePublicly: boolean;
}): {
  sharePubliclyDisabled: boolean;
  shareSourcePubliclyDisabled: boolean;
  sharePubliclyMessage: SharingMessage | null;
  shareSourcePubliclyMessage: SharingMessage | null;
} {
  const sharePubliclyLockedByOtherCourse =
    persistedSharePublicly && constraints.used_in_other_course;
  const canUncheckSharePublicly =
    !sharePubliclyLockedByOtherCourse &&
    (!constraints.used_in_same_course_public_assessment || shareSourcePublicly);
  const canUncheckShareSourcePublicly =
    !constraints.used_in_same_course_public_assessment || sharePublicly;

  return {
    sharePubliclyDisabled: !canEdit || (sharePublicly && !canUncheckSharePublicly),
    shareSourcePubliclyDisabled:
      !canEdit || (shareSourcePublicly && !canUncheckShareSourcePublicly),
    sharePubliclyMessage:
      sharePublicly && sharePubliclyLockedByOtherCourse
        ? 'used-in-other-course'
        : sharePublicly && constraints.used_in_same_course_public_assessment && !shareSourcePublicly
          ? 'public-assessment-share-publicly'
          : null,
    shareSourcePubliclyMessage:
      shareSourcePublicly && constraints.used_in_same_course_public_assessment && !sharePublicly
        ? 'public-assessment-share-source-publicly'
        : null,
  };
}

function SharingMessageText({ message }: { message: SharingMessage }) {
  if (message === 'used-in-other-course') {
    return (
      <> این سوال به صورت عمومی به اشتراک گذاشته شده و توسط درس دیگری در حال استفاده است، بنابراین امکان لغو اشتراک وجود ندارد.</>
    );
  }

  const isSharePubliclyMessage = message === 'public-assessment-share-publicly';
  return (
    <>
      {' '}
      این سوال در یک ارزیابی با اشتراک‌گذاری عمومی استفاده شده است.{' '}
      {isSharePubliclyMessage ? (
        <>
          برای لغو اشتراک‌گذاری عمومی این سوال، ابتدا گزینه «اشتراک‌گذاری سورس‌کد به صورت عمومی» را علامت بزنید.
          همچنین می‌توانید آزمون را از حالت اشتراک خارج کرده یا این سوال را از آزمون بردارید.
        </>
      ) : (
        <>
          برای متوقف کردن اشتراک‌گذاری سورس‌کد این سوال، ابتدا گزینه «اشتراک‌گذاری عمومی سوال» را مجدداً تیک بزنید.
        </>
      )}
    </>
  );
}

export const InstructorQuestionSettingsForm = ({
  authorStaff,
  initialAuthors,
  currentUid,
  question,
  topic,
  courseInstance,
  assessmentsWithQuestion,
  courseTopics,
  courseTags,
  questionTags,
  qids,
  origHash,
  csrfToken,
  canEdit,
  hasCoursePermissionView,
  editableCourses,
  questionGHLink,
  publicLink,
  sharing,
  questionTest,
}: {
  authorStaff: { uid: string; name: string | null }[];
  initialAuthors: string[] | null;
  currentUid: string;
  question: StaffQuestion;
  courseInstance?: StaffCourseInstance | null;
  assessmentsWithQuestion: SelectedAssessments[];
  topic: StaffTopic;
  courseTopics: StaffTopic[];
  courseTags: StaffTag[];
  questionTags: StaffTag[];
  qids: string[];
  origHash: string;
  csrfToken: string;
  canEdit: boolean;
  hasCoursePermissionView: boolean;
  editableCourses: EditableCourse[];
  questionGHLink: string | null;
  publicLink: string;
  sharing: {
    enabled: boolean;
    sets: QuestionSharingSetRow[];
    constraints: QuestionSharingConstraints;
  };
  questionTest: { path: string; csrfToken: string };
}) => {
  const canCopy = editableCourses.length > 0 && hasCoursePermissionView;
  const showTestsSection =
    question.type === 'Freeform' &&
    question.grading_method !== 'External' &&
    hasCoursePermissionView;
  // `handleSubmit` runs after react-hook-form processes the submit event, so use a
  // stable ref rather than depending on `event.currentTarget` here.
  // If we didn't wrap in `handleSubmit`, we could use `event.currentTarget`.
  const formRef = useRef<HTMLFormElement>(null);

  const preferences = Object.entries(question.preferences_schema ?? {}).map(
    ([name, schema]): PreferenceField => ({
      name,
      type: schema.type,
      default: String(schema.default),
      enum: schema.enum?.map(String) ?? [],
    }),
  );

  const defaultValues: QuestionSettingsFormValues = {
    authors: initialAuthors ?? [],
    qid: question.qid ?? '',
    title: question.title ?? '',
    topic: topic.name,
    tags: questionTags.map((t) => t.name),
    grading_method: question.grading_method,
    single_variant: question.single_variant ?? false,
    show_correct_answer: question.show_correct_answer ?? true,
    partial_credit: question.partial_credit ?? question.type === 'Freeform',
    workspace_enabled: !!question.workspace_image,
    workspace_image: question.workspace_image ?? '',
    workspace_port: question.workspace_port?.toString() ?? '',
    workspace_home: question.workspace_home ?? '',
    workspace_graded_files: question.workspace_graded_files?.join(', ') ?? '',
    workspace_args: question.workspace_args ?? '',
    workspace_environment:
      Object.keys(question.workspace_environment ?? {}).length > 0
        ? JSON.stringify(question.workspace_environment, null, 2)
        : '{}',
    workspace_enable_networking: question.workspace_enable_networking ?? false,
    workspace_rewrite_url:
      question.workspace_url_rewrite === null
        ? 'null'
        : question.workspace_url_rewrite
          ? 'true'
          : 'false',
    preferences,
    // The state of the checkbox, defaulting to the presence of an external grading image
    external_grading_enabled: !!question.external_grading_image,
    external_grading_image: question.external_grading_image ?? '',
    external_grading_entrypoint: question.external_grading_entrypoint ?? '',
    external_grading_files: question.external_grading_files?.join(', ') ?? '',
    external_grading_timeout: question.external_grading_timeout ?? undefined,
    external_grading_enable_networking: question.external_grading_enable_networking ?? false,
    external_grading_environment:
      Object.keys(question.external_grading_environment).length > 0
        ? JSON.stringify(question.external_grading_environment, null, 2)
        : '{}',
    share_publicly: question.share_publicly,
    share_source_publicly: question.share_source_publicly,
    sharing_sets: sharing.sets.filter((s) => s.in_set).map((s) => s.name),
  };

  const {
    handleSubmit,
    register,
    watch,
    setValue,
    clearErrors,
    control,
    reset,
    formState: { errors, isDirty, dirtyFields, isSubmitting },
  } = useForm<QuestionSettingsFormValues>({
    mode: 'onChange',
    defaultValues,
  });

  const [pendingAuthor, setPendingAuthor] = useState('');
  const pendingAuthorUid = pendingAuthor.trim();
  const selectedAuthors = watch('authors');
  // Serialize pending text before submit so Save includes it without waiting for a state update.
  const authorsToSave =
    pendingAuthorUid && !selectedAuthors.includes(pendingAuthorUid)
      ? [...selectedAuthors, pendingAuthorUid]
      : selectedAuthors;
  const authorItems = selectedAuthors.map((uid) => {
    const name = authorStaff.find((user) => user.uid === uid)?.name;
    return { id: uid, label: name ? `${name}  ${uid}` : uid, data: { uid, name } };
  });
  const selectedTopic = watch('topic');
  const selectedTags = watch('tags');
  const selectedGradingMethod = watch('grading_method');
  const workspaceEnabled = watch('workspace_enabled');
  const externalGradingEnabled = watch('external_grading_enabled');
  const watchedSharingSets = watch('sharing_sets');
  const { field: sharePubliclyInput } = useController({
    control,
    name: 'share_publicly',
  });
  const { field: shareSourcePubliclyInput } = useController({
    control,
    name: 'share_source_publicly',
  });
  const sharePublicly = sharePubliclyInput.value;
  const shareSourcePublicly = shareSourcePubliclyInput.value;
  const lockedSharingSetNamesSet = new Set(sharing.constraints.locked_sharing_set_names);
  const {
    sharePubliclyDisabled,
    shareSourcePubliclyDisabled,
    sharePubliclyMessage,
    shareSourcePubliclyMessage,
  } = getSharingControlState({
    canEdit,
    constraints: sharing.constraints,
    persistedSharePublicly: defaultValues.share_publicly,
    sharePublicly,
    shareSourcePublicly,
  });

  const isExternalGrading = selectedGradingMethod === 'External';

  const topicItems: ComboBoxItem<StaffTopic>[] = useMemo(
    () =>
      courseTopics.map((t) => ({
        id: t.name,
        data: t,
        label: t.name,
        searchableText: `${t.name} ${t.description}`,
      })),
    [courseTopics],
  );

  const tagItems: ComboBoxItem<StaffTag>[] = useMemo(
    () =>
      [...courseTags]
        .sort((a, b) => {
          // Sort explicit tags above implicit tags, then by name
          if (a.implicit !== b.implicit) {
            return a.implicit ? 1 : -1;
          }
          return a.name.localeCompare(b.name);
        })
        .map((t) => ({
          id: t.name,
          data: t,
          label: t.name,
          searchableText: `${t.name} ${t.description}`,
        })),
    [courseTags],
  );

  const currentTopicData = courseTopics.find((t) => t.name === selectedTopic);
  const currentTagsData = courseTags.filter((t) => selectedTags.includes(t.name));

  const otherQids = new Set(qids.filter((q) => q !== defaultValues.qid));

  const handleFormSubmit = handleSubmit(() => {
    formRef.current?.submit();
  });

  return (
    <div className="d-flex flex-column gap-3">
      <form
        ref={formRef}
        name="edit-question-settings-form"
        id="edit-question-settings-form"
        method="POST"
        className="d-flex flex-column gap-3"
        onSubmit={handleFormSubmit}
      >
        <input type="hidden" name="__csrf_token" value={csrfToken} />
        <input type="hidden" name="__action" value="update_question" />
        <input type="hidden" name="orig_hash" value={origHash} />

        <div className="card" style={{ fontFamily: 'var(--font-persian)' }}>
          <div className="card-body">
            <h2 className="h5 card-title mb-3">اطلاعات عمومی سوال</h2>
            <div className="row">
              <div className="col-md-6 mb-3">
                <label className="form-label" htmlFor="title">
                  عنوان سوال
                </label>
                <input
                  type="text"
                  className="form-control"
                  id="title"
                  placeholder="مثال: محاسبه مساحت دایره"
                  disabled={!canEdit}
                  defaultValue={defaultValues.title}
                  {...register('title')}
                />
                <small className="form-text text-muted">
                  عنوان یا نام نمایشی سوال برای مدرس و دانشجویان.
                </small>
              </div>
              <div className="col-md-6 mb-3">
                <label className="form-label" htmlFor="qid">
                  شناسه سوال (QID)
                </label>
                <input
                  type="text"
                  className={clsx('form-control font-monospace', errors.qid && 'is-invalid')}
                  id="qid"
                  dir="ltr"
                  disabled={!canEdit}
                  aria-invalid={!!errors.qid || undefined}
                  defaultValue={defaultValues.qid}
                  aria-errormessage={errors.qid ? 'qid-error' : undefined}
                  {...register('qid', {
                    required: 'وارد کردن شناسه سوال (QID) الزامی است',
                    validate: {
                      shortName: (value) => {
                        const result = validateShortName(value, defaultValues.qid);
                        return result.valid || result.message;
                      },
                      duplicate: (value) => {
                        if (otherQids.has(value)) {
                          return 'این شناسه سوال (QID) قبلا ثبت شده است';
                        }
                        return true;
                      },
                    },
                  })}
                />
                {errors.qid && (
                  <div id="qid-error" className="invalid-feedback">
                    {errors.qid.message}
                  </div>
                )}
                <small className="form-text text-muted">
                  <QuestionShortNameDescription />
                </small>
              </div>
            </div>

            <div className="mb-3">
              <label className="form-label" id="topic-label" htmlFor="topic">
                مبحث / موضوع درس
              </label>
              {canEdit ? (
                <ComboBox
                  id="topic"
                  name="topic"
                  items={topicItems}
                  value={selectedTopic}
                  placeholder="انتخاب مبحث درسی"
                  aria-labelledby="topic-label"
                  renderItem={(item) => (
                    <div className="preferences-combobox-item">
                      <TopicBadge topic={item.data!} />
                      {item.data!.description && (
                        <div>
                          <small className="text-muted">
                            <TopicDescription topic={item.data!} />
                          </small>
                        </div>
                      )}
                    </div>
                  )}
                  onChange={(value) => setValue('topic', value ?? '', { shouldDirty: true })}
                />
              ) : currentTopicData ? (
                <div>
                  <TopicBadge topic={currentTopicData} />
                </div>
              ) : null}
            </div>

            <div className="mb-3">
              <label className="form-label" id="tags-label" htmlFor="tags">
                برچسب‌ها
              </label>
              {canEdit ? (
                <TagPicker
                  id="tags"
                  name="tags"
                  items={tagItems}
                  value={selectedTags}
                  placeholder="انتخاب برچسب‌ها"
                  aria-labelledby="tags-label"
                  renderItem={(item) => (
                    <div className="preferences-combobox-item">
                      <TagBadge tag={item.data!} />
                      {!item.data!.implicit && item.data!.description && (
                        <div>
                          <small className="text-muted">
                            <TagDescription tag={item.data!} />
                          </small>
                        </div>
                      )}
                    </div>
                  )}
                  renderTagContent={(data) => data.name}
                  tagClassName={(data) => `badge color-${data.color}`}
                  onChange={(value) => setValue('tags', value, { shouldDirty: true })}
                />
              ) : (
                <div>
                  {currentTagsData.map((tag) => (
                    <span key={tag.name} className="me-1">
                      <TagBadge tag={tag} />
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="mb-3">
              <label className="form-label" id="authors-label" htmlFor="authors">
                طراحان و مولفان سوال
              </label>
              {canEdit ? (
                <>
                  {initialAuthors !== null && (dirtyFields.authors || pendingAuthorUid) && (
                    <input type="hidden" name="authors" value={JSON.stringify(authorsToSave)} />
                  )}
                  <TagPicker
                    id="authors"
                    aria-labelledby="authors-label"
                    createButtonLabel="افزودن طراح"
                    inputValue={pendingAuthor}
                    items={authorItems}
                    value={selectedAuthors}
                    placeholder="شناسه کاربری (UID / ایمیل) یا آدرس ORCID"
                    disabled={initialAuthors === null}
                    tagClassName={() => 'badge color-gray1 fw-normal text-wrap text-break'}
                    renderTagContent={({ uid, name }) => <AuthorLabel uid={uid} name={name} />}
                    onInputChange={setPendingAuthor}
                    onChange={(uids) => setValue('authors', uids, { shouldDirty: true })}
                    onCreate={(uid) =>
                      setValue('authors', [...selectedAuthors, uid], { shouldDirty: true })
                    }
                  />
                </>
              ) : (
                <div>
                  {authorItems.map((author) => (
                    <span key={author.id} className="me-1">
                      <span className="badge color-gray1 fw-normal text-wrap text-break">
                        <AuthorLabel uid={author.data.uid} name={author.data.name} />
                      </span>
                    </span>
                  ))}
                </div>
              )}
              <small className="form-text text-muted">
                مشخصات و شناسه‌های افرادی که در طراحی این سوال مشارکت داشته‌اند.{' '}
                {canEdit &&
                  initialAuthors !== null &&
                  !selectedAuthors.includes(currentUid.trim()) && (
                    <>
                      <button
                        type="button"
                        className="btn btn-link btn-sm p-0 border-0 align-baseline"
                        onClick={() => {
                          setValue('authors', [...selectedAuthors, currentUid.trim()], {
                            shouldDirty: true,
                          });
                        }}
                      >
                        افزودن نام خودم
                      </button>
                      .
                    </>
                  )}
              </small>
              {canEdit && initialAuthors === null && (
                <div className="form-text text-danger">
                  امکان بارگذاری مشخصات طراحان از info.json وجود نداشت.
                </div>
              )}
            </div>

            {courseInstance && (
              <div className="mb-0">
                <p className="form-label mb-1">آزمون‌های مرتبط</p>
                <AssessmentBadges
                  assessmentsWithQuestion={assessmentsWithQuestion}
                  courseInstanceId={courseInstance.id}
                />
              </div>
            )}
          </div>
        </div>

        <div className="card" style={{ fontFamily: 'var(--font-persian)' }}>
          <div className="card-body">
            <h2 className="h5 card-title mb-3">رفتار و قوانین پاسخگویی سوال</h2>
            <div className="mb-3">
              <label className="form-label" htmlFor="grading_method">
                روش تصحیح نمره
              </label>
              <select
                className="form-select"
                id="grading_method"
                disabled={!canEdit}
                defaultValue={defaultValues.grading_method}
                {...register('grading_method')}
              >
                <option value="Internal">Internal (محاسبه داخلی در سرور)</option>
                <option value="External">External (داوری خودکار با کانتینر داکر)</option>
                <option value="Manual">Manual (تصحیح دستی توسط اساتید)</option>
              </select>
              <small className="form-text text-muted">
                روش محاسبه و تعیین نمره در این سوال.
              </small>
            </div>

            <div className="form-check mb-3">
              <input
                className="form-check-input"
                type="checkbox"
                id="single_variant"
                disabled={!canEdit}
                defaultChecked={defaultValues.single_variant}
                {...register('single_variant')}
              />
              <label className="form-check-label" htmlFor="single_variant">
                تک‌گونه (یک مدل مسئله برای هر دانشجو)
              </label>
              <div className="small text-muted">
                در صورت فعال بودن، دانشجو در یک آزمون فقط یک گونه تصادفی از این سوال را دریافت می‌کند و با هربار تلاش مجدد، صورت سوال تغییر نخواهد کرد.
              </div>
            </div>

            <div className="form-check mb-3">
              <input
                className="form-check-input"
                type="checkbox"
                id="show_correct_answer"
                disabled={!canEdit}
                defaultChecked={defaultValues.show_correct_answer}
                {...register('show_correct_answer')}
              />
              <label className="form-check-label" htmlFor="show_correct_answer">
                نمایش پاسخ صحیح پس از پایان فرصت‌ها
              </label>
              <div className="small text-muted">
                در صورت فعال بودن، پس از اتمام تمامی تلاش‌های مجاز دانشجو، پنل و پاسخ صحیح کامل به او نمایش داده خواهد شد.
              </div>
            </div>

            <div className="form-check">
              <input
                className="form-check-input"
                type="checkbox"
                id="partial_credit"
                disabled={!canEdit}
                defaultChecked={defaultValues.partial_credit}
                {...register('partial_credit')}
              />
              <label className="form-check-label" htmlFor="partial_credit">
                نمره جزئی برای پاسخ‌های ناقص
              </label>
              <div className="small text-muted">
                در صورت فعال بودن، برای پاسخ‌های چندبخشی یا کدهایی که بخشی از تست‌ها را پاس کرده‌اند نمره متناسب لحاظ می‌شود.
                در غیر این صورت تنها نمره صفر یا ۱۰۰ تعلق می‌گیرد.
              </div>
            </div>
          </div>
        </div>

        <PreferencesTable
          control={control}
          canEdit={canEdit}
          register={register}
          watch={watch}
          setValue={setValue}
          clearErrors={clearErrors}
          errors={errors.preferences}
        />

        <div className="card" style={{ fontFamily: 'var(--font-persian)' }}>
          <div className="card-body">
            <div className="form-check">
              <input
                className="form-check-input"
                type="checkbox"
                id="workspaceEnabled"
                checked={workspaceEnabled}
                disabled={!canEdit}
                onChange={() => {
                  if (workspaceEnabled) {
                    clearErrors([
                      'workspace_image',
                      'workspace_port',
                      'workspace_home',
                      'workspace_environment',
                    ]);
                  }
                  setValue('workspace_enabled', !workspaceEnabled, { shouldDirty: true });
                }}
              />
              <label className="form-check-label h5 card-title mb-0" htmlFor="workspaceEnabled">
                محیط کدنویسی و توسعه ابری (Workspace)
              </label>
            </div>
            <small className="text-muted pe-4 d-block mt-1">
              پیکربندی محیط کاربری ابری (شامل ادیتور یا ترمینال آنلاین) برای دانشجویان.
            </small>
            {workspaceEnabled && (
              <div className="mt-3 pe-4" id="workspace-options">
                <div className="mb-3">
                  <label className="form-label" htmlFor="workspace_image">
                    ایمیج داکر محیط کاری
                  </label>
                  <input
                    type="text"
                    className={clsx('form-control font-monospace', errors.workspace_image && 'is-invalid')}
                    id="workspace_image"
                    dir="ltr"
                    aria-describedby="workspace_image-help"
                    disabled={!canEdit}
                    aria-invalid={!!errors.workspace_image || undefined}
                    defaultValue={defaultValues.workspace_image}
                    aria-errormessage={errors.workspace_image ? 'workspace_image-error' : undefined}
                    {...register('workspace_image', {
                      required: 'وارد کردن نام ایمیج برای محیط کار ابری الزامی است',
                      validate: (value) =>
                        isSupportedImageRegistry(value.trim()) || imageRegistryErrorText,
                    })}
                  />
                  {errors.workspace_image && (
                    <div id="workspace_image-error" className="invalid-feedback">
                      {errors.workspace_image.message}
                    </div>
                  )}
                  <ImageRegistryHelp id="workspace_image-help" />
                </div>

                <div className="mb-3">
                  <label className="form-label" htmlFor="workspace_graded_files">
                    فایل‌های تحویلی جهت داوری و تصحیح
                  </label>
                  <input
                    type="text"
                    className="form-control font-monospace"
                    id="workspace_graded_files"
                    dir="ltr"
                    disabled={!canEdit}
                    defaultValue={defaultValues.workspace_graded_files}
                    {...register('workspace_graded_files')}
                  />
                  <small className="form-text text-muted">
                    فایل‌ها یا پوشه‌هایی که پس از ثبت پاسخ دانشجو از محیط ابری کپی شده و ذخیره می‌شوند (با کاما جدا کنید).
                  </small>
                </div>

                <div className="mb-3">
                  <label className="form-label" htmlFor="workspace_args">
                    آرگومان‌های اجرای کانتینر
                  </label>
                  <input
                    type="text"
                    className="form-control font-monospace"
                    id="workspace_args"
                    dir="ltr"
                    disabled={!canEdit}
                    defaultValue={defaultValues.workspace_args}
                    {...register('workspace_args')}
                  />
                  <small className="form-text text-muted">
                    آرگومان‌های خط فرمان ارسالی به کانتینر داکر که با فاصله جدا می‌شوند.
                  </small>
                </div>

                <div className="mb-3">
                  <label className="form-label" htmlFor="workspace_environment">
                    متغیرهای محیطی (JSON)
                  </label>
                  <textarea
                    className={clsx('form-control font-monospace', errors.workspace_environment && 'is-invalid')}
                    id="workspace_environment"
                    dir="ltr"
                    disabled={!canEdit}
                    aria-invalid={!!errors.workspace_environment || undefined}
                    defaultValue={defaultValues.workspace_environment}
                    aria-errormessage={
                      errors.workspace_environment ? 'workspace_environment-error' : undefined
                    }
                    {...register('workspace_environment', {
                      validate: validateJsonObject,
                    })}
                  />
                  {errors.workspace_environment && (
                    <div id="workspace_environment-error" className="invalid-feedback">
                      {errors.workspace_environment.message}
                    </div>
                  )}
                  <small className="form-text text-muted">
                    متغیرهای محیطی کانتینر به صورت یک شیء معتبر JSON (مثلا <code>{'{"PORT":"8080"}'}</code>).
                  </small>
                </div>

                <div className="mb-3 form-check">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="workspace_enable_networking"
                    disabled={!canEdit}
                    defaultChecked={defaultValues.workspace_enable_networking}
                    {...register('workspace_enable_networking')}
                  />
                  <label className="form-check-label" htmlFor="workspace_enable_networking">
                    دسترسی به شبکه و اینترنت
                  </label>
                  <div className="small text-muted">
                    آیا محیط ابری اجازه ارتباط با شبکه بیرونی را داشته باشد یا خیر (پیش‌فرض: غیرفعال).
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label" htmlFor="workspace_port">
                    پورت وب‌سرویس کانتینر
                  </label>
                  <input
                    type="number"
                    step="1"
                    className={clsx('form-control font-monospace', errors.workspace_port && 'is-invalid')}
                    id="workspace_port"
                    dir="ltr"
                    disabled={!canEdit}
                    aria-invalid={!!errors.workspace_port || undefined}
                    defaultValue={defaultValues.workspace_port}
                    aria-errormessage={errors.workspace_port ? 'workspace_port-error' : undefined}
                    {...register('workspace_port', {
                      validate: (value) => {
                        if (value === '') return true;
                        const n = Number(value);
                        if (!Number.isInteger(n)) return 'شماره پورت باید یک عدد صحیح باشد';
                        return true;
                      },
                    })}
                  />
                  {errors.workspace_port && (
                    <div id="workspace_port-error" className="invalid-feedback">
                      {errors.workspace_port.message}
                    </div>
                  )}
                  <small className="form-text text-muted">
                    شماره پورت درونی وب‌سرویس. در صورت خالی بودن، پورت پیش‌فرض ایمیج استفاده می‌شود.
                  </small>
                </div>

                <div className="mb-3">
                  <label className="form-label" htmlFor="workspace_home">
                    مسیر پوشه کاربری (Home)
                  </label>
                  <input
                    type="text"
                    className={clsx('form-control font-monospace', errors.workspace_home && 'is-invalid')}
                    id="workspace_home"
                    dir="ltr"
                    disabled={!canEdit}
                    aria-invalid={!!errors.workspace_home || undefined}
                    defaultValue={defaultValues.workspace_home}
                    aria-errormessage={errors.workspace_home ? 'workspace_home-error' : undefined}
                    {...register('workspace_home')}
                  />
                  {errors.workspace_home && (
                    <div id="workspace_home-error" className="invalid-feedback">
                      {errors.workspace_home.message}
                    </div>
                  )}
                  <small className="form-text text-muted">
                    پوشه خانگی در کانتینر. در صورت عدم درج، مقدار پیش‌فرض ایمیج لحاظ خواهد شد.
                  </small>
                </div>

                <div className="mb-3">
                  <label className="form-label" htmlFor="workspace_rewrite_url">
                    نحوه پردازش URL در پراکسی محیط ابری
                  </label>
                  <Form.Select
                    id="workspace_rewrite_url"
                    disabled={!canEdit}
                    defaultValue={defaultValues.workspace_rewrite_url}
                    {...register('workspace_rewrite_url')}
                  >
                    <option value="null">استفاده از تنظیمات پیش‌فرض ایمیج</option>
                    <option value="true">حذف پیشوند کانتینر از آدرس (Strip Prefix)</option>
                    <option value="false">ارسال آدرس بدون تغییر (No Change)</option>
                  </Form.Select>
                  <small className="form-text text-muted">
                    نحوه بازنویسی مسیر منابع درونی محیط کار ابری توسط پراکسی سامانه.
                  </small>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="card" style={{ fontFamily: 'var(--font-persian)' }}>
          <div className="card-body">
            {isExternalGrading ? (
              <h2 className="h5 card-title mb-0">تصحیح خودکار با کانتینر داکر (External Grading)</h2>
            ) : (
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id="externalGradingEnabled"
                  disabled={!canEdit}
                  defaultChecked={defaultValues.external_grading_enabled}
                  {...register('external_grading_enabled')}
                />
                <label
                  className="form-check-label h5 card-title mb-0"
                  htmlFor="externalGradingEnabled"
                >
                  تصحیح خودکار با کانتینر داکر (External Grading)
                </label>
              </div>
            )}
            <small className={clsx('text-muted d-block mt-1', !isExternalGrading && 'pe-4')}>
              پیکربندی داوری و تصحیح خودکار برنامه‌ها با کانتینر ایزوله داکر.
            </small>
            {(isExternalGrading || externalGradingEnabled) && (
              <div
                className={clsx('mt-3', !isExternalGrading && 'pe-4')}
                id="external-grading-options"
              >
                <div className="mb-3">
                  <label className="form-label" htmlFor="external_grading_image">
                    ایمیج داکر داوری (Grader Image)
                  </label>
                  <input
                    type="text"
                    className={clsx('form-control font-monospace', errors.external_grading_image && 'is-invalid')}
                    id="external_grading_image"
                    dir="ltr"
                    aria-describedby="external_grading_image-help"
                    disabled={!canEdit}
                    aria-invalid={!!errors.external_grading_image || undefined}
                    defaultValue={defaultValues.external_grading_image}
                    aria-errormessage={
                      errors.external_grading_image ? 'external_grading_image-error' : undefined
                    }
                    {...register('external_grading_image', {
                      required: 'وارد کردن نام ایمیج برای داوری خودکار الزامی است',
                      validate: (value) =>
                        isSupportedImageRegistry(value.trim()) || imageRegistryErrorText,
                    })}
                  />
                  {errors.external_grading_image && (
                    <div id="external_grading_image-error" className="invalid-feedback">
                      {errors.external_grading_image.message}
                    </div>
                  )}
                  <ImageRegistryHelp id="external_grading_image-help" />
                </div>

                <div className="mb-3">
                  <label className="form-label" htmlFor="external_grading_entrypoint">
                    نقطه ورود اجرای داوری (Entrypoint)
                  </label>
                  <input
                    type="text"
                    className="form-control font-monospace"
                    id="external_grading_entrypoint"
                    dir="ltr"
                    disabled={!canEdit}
                    defaultValue={defaultValues.external_grading_entrypoint}
                    {...register('external_grading_entrypoint')}
                  />
                  <small className="form-text text-muted">
                    دستور یا برنامه آغازین فرآیند داوری. در صورت خالی بودن، نقطه ورود پیش‌فرض ایمیج اجرا می‌شود.
                  </small>
                </div>

                <div className="mb-3">
                  <label className="form-label" htmlFor="external_grading_files">
                    فایل‌های سرور جهت داوری
                  </label>
                  <input
                    type="text"
                    className="form-control font-monospace"
                    id="external_grading_files"
                    dir="ltr"
                    disabled={!canEdit}
                    defaultValue={defaultValues.external_grading_files}
                    {...register('external_grading_files')}
                  />
                  <small className="form-text text-muted">
                    فایل‌ها یا پوشه‌هایی که از پوشه <code>serverFilesCourse</code> به فرآیند داوری کپی می‌شوند (با کاما جدا کنید).
                  </small>
                </div>

                <div className="mb-3">
                  <label className="form-label" htmlFor="external_grading_timeout">
                    حداکثر زمان اجرای داوری (ثانیه)
                  </label>
                  <input
                    type="number"
                    step="1"
                    className={clsx(
                      'form-control font-monospace',
                      errors.external_grading_timeout && 'is-invalid',
                    )}
                    id="external_grading_timeout"
                    dir="ltr"
                    disabled={!canEdit}
                    aria-invalid={!!errors.external_grading_timeout || undefined}
                    defaultValue={defaultValues.external_grading_timeout}
                    aria-errormessage={
                      errors.external_grading_timeout ? 'external_grading_timeout-error' : undefined
                    }
                    {...register('external_grading_timeout', {
                      setValueAs: coerceToNumber,
                      min: {
                        value: 0,
                        message: 'زمان مجاز باید حداقل ۰ ثانیه باشد',
                      },
                      validate: (value) => {
                        if (value == null) return true;
                        if (!Number.isInteger(value)) return 'زمان باید یک عدد صحیح باشد';
                        return true;
                      },
                    })}
                  />
                  {errors.external_grading_timeout && (
                    <div id="external_grading_timeout-error" className="invalid-feedback">
                      {errors.external_grading_timeout.message}
                    </div>
                  )}
                  <small className="form-text text-muted">
                    مدت زمانی که پس از سپری شدن آن، اجرای کدهای داوری متوقف (Timeout) می‌شود.
                  </small>
                </div>

                <div className="mb-3">
                  <label className="form-label" htmlFor="external_grading_environment">
                    متغیرهای محیطی داوری (JSON)
                  </label>
                  <textarea
                    className={clsx(
                      'form-control font-monospace',
                      errors.external_grading_environment && 'is-invalid',
                    )}
                    id="external_grading_environment"
                    dir="ltr"
                    disabled={!canEdit}
                    aria-invalid={!!errors.external_grading_environment || undefined}
                    defaultValue={defaultValues.external_grading_environment}
                    aria-errormessage={
                      errors.external_grading_environment
                        ? 'external_grading_environment-error'
                        : undefined
                    }
                    {...register('external_grading_environment', {
                      validate: validateJsonObject,
                    })}
                  />
                  {errors.external_grading_environment && (
                    <div id="external_grading_environment-error" className="invalid-feedback">
                      {errors.external_grading_environment.message}
                    </div>
                  )}
                  <small className="form-text text-muted">
                    متغیرهای محیطی کانتینر داوری در قالب یک شیء استاندارد JSON.
                  </small>
                </div>

                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="external_grading_enable_networking"
                    disabled={!canEdit}
                    defaultChecked={defaultValues.external_grading_enable_networking}
                    {...register('external_grading_enable_networking')}
                  />
                  <label className="form-check-label" htmlFor="external_grading_enable_networking">
                    دسترسی کانتینر داوری به شبکه و اینترنت
                  </label>
                  <div className="small text-muted">
                    آیا کانتینر داور خودکار در حین اجرا اجازه دسترسی به اینترنت را دارد یا خیر (پیش‌فرض: غیرفعال جهت امنیت).
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {sharing.enabled && (
          <div className="card" style={{ fontFamily: 'var(--font-persian)' }}>
            <div className="card-body">
              <h2 className="h5 card-title mb-3">اشتراک‌گذاری و دسترسی آزاد</h2>
              {/* Hidden inputs preserve locked-on flags whose checkbox is disabled;
                  must mirror the disabled gate to avoid silently flipping the value. */}
              {sharePublicly && sharePubliclyDisabled && (
                <input type="hidden" name="share_publicly" value="on" />
              )}
              <Form.Check
                ref={sharePubliclyInput.ref}
                type="checkbox"
                id="share_publicly"
                name={sharePubliclyInput.name}
                value="on"
                label="اشتراک‌گذاری عمومی سوال (Public)"
                className="mb-1"
                disabled={sharePubliclyDisabled}
                checked={sharePublicly}
                aria-describedby="share_publicly-description"
                onChange={sharePubliclyInput.onChange}
                onBlur={sharePubliclyInput.onBlur}
              />
              <small id="share_publicly-description" className="form-text text-muted d-block mb-2">
                تمامی دروس و کاربران سامانه امکان مشاهده، درون‌ریزی و استفاده از این سوال را خواهند داشت.
                {sharePubliclyMessage && <SharingMessageText message={sharePubliclyMessage} />}
              </small>

              {shareSourcePublicly && shareSourcePubliclyDisabled && (
                <input type="hidden" name="share_source_publicly" value="on" />
              )}
              <Form.Check
                ref={shareSourcePubliclyInput.ref}
                type="checkbox"
                id="share_source_publicly"
                name={shareSourcePubliclyInput.name}
                value="on"
                label="اشتراک‌گذاری سورس‌کد سوال (Public Source)"
                className="mb-1"
                disabled={shareSourcePubliclyDisabled}
                checked={shareSourcePublicly}
                aria-describedby="share_source_publicly-description"
                onChange={shareSourcePubliclyInput.onChange}
                onBlur={shareSourcePubliclyInput.onBlur}
              />
              <small
                id="share_source_publicly-description"
                className="form-text text-muted d-block mb-3"
              >
                کدهای منبع این سوال به صورت باز و عمومی در دسترس دیگران قرار می‌گیرد.
                {shareSourcePubliclyMessage && (
                  <SharingMessageText message={shareSourcePubliclyMessage} />
                )}
              </small>

              <div>
                <label id="sharing-sets-label" className="form-label" htmlFor="sharing_sets">
                  مجموعه‌های اشتراک‌گذاری (Sharing Sets)
                </label>
                {sharing.sets.length === 0 ? (
                  <div className="small text-muted">
                    هیچ مجموعه اشتراک‌گذاری در این درس تعریف نشده است.
                  </div>
                ) : (
                  <>
                    {/* Hidden inputs are derived from the RHF state, which is the
                        single source of truth for which sharing sets get submitted.
                        TagPicker is intentionally rendered without a `name` prop so
                        it doesn't emit its own hidden inputs in parallel. */}
                    {watchedSharingSets.map((name) => (
                      <input key={name} type="hidden" name="sharing_sets" value={name} />
                    ))}
                    {lockedSharingSetNamesSet.size > 0 && (
                      <div className="d-flex flex-wrap gap-1 mb-2">
                        {Array.from(lockedSharingSetNamesSet, (name) => (
                          <span
                            key={name}
                            className="badge color-gray1"
                            title="غیرقابل حذف: درسی که از طریق این دسته دسترسی دارد هم‌اکنون از این سوال استفاده می‌کند."
                          >
                            {name}
                          </span>
                        ))}
                      </div>
                    )}
                    <TagPicker
                      id="sharing_sets"
                      items={sharing.sets
                        .filter((s) => !lockedSharingSetNamesSet.has(s.name))
                        .map((s) => ({
                          id: s.name,
                          data: s,
                          label: s.name,
                          searchableText: s.name,
                        }))}
                      value={watchedSharingSets.filter((n) => !lockedSharingSetNamesSet.has(n))}
                      placeholder="انتخاب مجموعه‌های اشتراک‌گذاری"
                      aria-labelledby="sharing-sets-label"
                      disabled={!canEdit}
                      renderTagContent={(data) => data.name}
                      tagClassName={() => 'badge color-gray1'}
                      onChange={(value) => {
                        setValue(
                          'sharing_sets',
                          [...Array.from(lockedSharingSetNamesSet), ...value],
                          {
                            shouldDirty: true,
                          },
                        );
                      }}
                    />
                    <small className="form-text text-muted">
                      دسته‌هایی که به دروس مشخص اجازه استفاده اشتراکی از این سوال را می‌دهند.
                    </small>
                  </>
                )}
              </div>

              {question.share_publicly || question.share_source_publicly ? (
                <div className="mt-3">
                  <PublicLinkSharing
                    publicLink={publicLink}
                    sharingMessage={
                      question.share_source_publicly
                        ? "سورس‌کد این سوال به صورت عمومی به اشتراک گذاشته شده است."
                        : 'این سوال به صورت عمومی به اشتراک گذاشته شده است.'
                    }
                    publicLinkMessage="پیوند اختصاصی جهت مشاهده این سوال توسط سایر اساتید و مدرسان."
                  />
                </div>
              ) : null}
            </div>
          </div>
        )}
      </form>

      {showTestsSection && (
        <div className="card" style={{ fontFamily: 'var(--font-persian)' }}>
          <div className="card-body">
            <h2 className="h5 card-title mb-3">تست‌ها و ارزیابی درستی عملکرد سوال</h2>
            <QuestionTestsForm
              questionTestPath={questionTest.path}
              csrfToken={questionTest.csrfToken}
            />
          </div>
        </div>
      )}

      <QuestionSettingsCardFooter
        canEdit={canEdit}
        canCopy={canCopy}
        editableCourses={editableCourses}
        courseId={question.course_id}
        qid={defaultValues.qid}
        assessmentsWithQuestion={assessmentsWithQuestion}
        csrfToken={csrfToken}
        questionGHLink={questionGHLink}
      />

      {canEdit && (
        <StickySaveBar
          visible={isDirty || !!pendingAuthorUid}
          isSaving={isSubmitting}
          formId="edit-question-settings-form"
          onCancel={() => {
            reset();
            setPendingAuthor('');
          }}
        />
      )}
    </div>
  );
};

InstructorQuestionSettingsForm.displayName = 'InstructorQuestionSettingsForm';
