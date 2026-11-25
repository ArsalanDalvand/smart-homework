import clsx from 'clsx';
import { useCallback, useMemo, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';

import { run } from '@prairielearn/run';

import { NewToPrairieLearnCard } from '../../../components/NewToPrairieLearnCard.js';
import { QuestionShortNameDescription } from '../../../components/ShortNameDescriptions.js';
import { SHORT_NAME_PATTERN } from '../../../lib/short-name.js';
import type {
  TemplateQuestion,
  TemplateQuestionZone,
} from '../../instructorQuestions/templateQuestions.js';

import { WireframePreview, getCardInfo, hasWireframePreview } from './WireframePreview.js';
import { TEMPLATE_QUESTIONS_FA } from './templateQuestionsFa.js';

export const ZONE_INFO: Partial<Record<string, { heading: string; description: string }>> = {
  'Basic questions: no randomization': {
    heading: 'سوال‌های پایه',
    description:
      'این سوال‌ها دارای متن و پاسخ ثابت هستند و برای شروع سریع بسیار مناسب‌اند.',
  },
  'Intermediate questions: randomization without Python': {
    heading: 'سوال‌های متوسط (تصادفی بدون کد)',
    description:
      'این سوال‌ها بدون نیاز به کدنویسی و با ابزارهای داخلی سامانه برای هر دانشجو نسخه تصادفی می‌سازند.',
  },
  'Advanced questions: randomization with Python': {
    heading: 'سوال‌های پیشرفته (تصادفی با پایتون)',
    description:
      'این سوال‌ها از پایتون برای تولید پارامترهای تصادفی، محاسبات پیچیده و شکل‌های پویا استفاده می‌کنند.',
  },
};

/** Compact radio buttons for the "Start from" selector. */
function RadioCardGroup({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { id: string; title: string; description: string }[];
  onChange: (value: string) => void;
}) {
  const ids = useMemo(() => options.map((o) => o.id), [options]);
  const { getItemProps } = useRadioGroupNavigation({
    items: ids,
    selectedValue: value,
    onSelect: onChange,
  });

  return (
    <div
      role="radiogroup"
      aria-label={label}
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))',
        gap: '0.5rem',
      }}
    >
      {options.map((option, index) => {
        const isSelected = value === option.id;
        return (
          <div
            key={option.id}
            {...getItemProps(index)}
            className={clsx('border rounded-3 px-3 py-2 text-center', {
              'border-primary bg-primary bg-opacity-10 text-primary fw-semibold': isSelected,
            })}
            style={{ cursor: 'pointer' }}
            aria-label={option.description}
          >
            {option.title}
          </div>
        );
      })}
    </div>
  );
}

/**
 * Keyboard navigation and accessibility props for a radiogroup.
 * Handles arrow-key wrapping, Home/End, and Enter/Space activation.
 * Returns `getItemProps(index)` to spread onto each radio item.
 */
function useRadioGroupNavigation({
  items,
  selectedValue,
  onSelect,
}: {
  items: string[];
  selectedValue: string;
  onSelect: (value: string) => void;
}) {
  const cardsRef = useRef<(HTMLElement | null)[]>([]);
  const hasSelection = items.includes(selectedValue);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent, index: number) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onSelect(items[index]);
        return;
      }

      let newIndex = index;

      switch (e.key) {
        case 'ArrowDown':
        case 'ArrowRight':
          e.preventDefault();
          newIndex = (index + 1) % items.length;
          break;
        case 'ArrowUp':
        case 'ArrowLeft':
          e.preventDefault();
          newIndex = index === 0 ? items.length - 1 : index - 1;
          break;
        case 'Home':
          e.preventDefault();
          newIndex = 0;
          break;
        case 'End':
          e.preventDefault();
          newIndex = items.length - 1;
          break;
        default:
          return;
      }

      onSelect(items[newIndex]);

      setTimeout(() => {
        cardsRef.current[newIndex]?.focus();
      }, 0);
    },
    [items, onSelect],
  );

  function getItemProps(index: number) {
    return {
      ref: (el: HTMLElement | null) => {
        cardsRef.current[index] = el;
      },
      role: 'radio' as const,
      tabIndex: items[index] === selectedValue || (!hasSelection && index === 0) ? 0 : -1,
      'aria-checked': items[index] === selectedValue,
      onClick: () => onSelect(items[index]),
      onKeyDown: (e: React.KeyboardEvent) => handleKeyDown(e, index),
    };
  }

  return { getItemProps };
}

/**
 * Renders template cards without a radiogroup wrapper. The parent is
 * responsible for providing the `role="radiogroup"` container.
 */
function TemplateCards({
  cards,
  selectedQid,
  showPreviews,
  showQid,
  flatIndexOffset,
  getItemProps,
}: {
  cards: TemplateQuestion[];
  selectedQid: string;
  showPreviews: boolean;
  showQid?: boolean;
  flatIndexOffset: number;
  getItemProps: (index: number) => {
    ref: (el: HTMLElement | null) => void;
    role: 'radio';
    tabIndex: number;
    'aria-checked': boolean;
    onClick: () => void;
    onKeyDown: (e: React.KeyboardEvent) => void;
  };
}) {
  if (showPreviews) {
    return (
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(min(200px, calc(50% - 0.5rem)), 1fr))',
          gap: '1rem',
        }}
      >
        {cards.map((card, index) => {
          const isSelected = selectedQid === card.qid;
          const cardInfo = getCardInfo(card.qid);
          return (
            <div
              key={card.qid}
              {...getItemProps(flatIndexOffset + index)}
              className={clsx('card overflow-hidden', {
                'border-primary': isSelected,
              })}
              style={{ cursor: 'pointer' }}
              aria-label={cardInfo?.label ?? card.title}
            >
              <WireframePreview qid={card.qid} />
              <div
                className={clsx('card-body py-2 px-3', {
                  'bg-primary bg-opacity-10': isSelected,
                })}
              >
                <div
                  className={clsx('card-title mb-0 fw-bold', {
                    'text-primary': isSelected,
                  })}
                  style={{ fontSize: '0.85rem' }}
                >
                  {cardInfo?.label ?? card.title}
                </div>
                {cardInfo && (
                  <div className="text-muted" style={{ fontSize: '0.75rem' }}>
                    {cardInfo.description}
                  </div>
                )}
              </div>
              {isSelected && (
                <div className="position-absolute top-0 end-0 p-1">
                  <i className="fa fa-check-circle text-primary" aria-hidden="true" />
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  // Compact list for intermediate/advanced templates
  return (
    <div className="d-flex flex-column gap-2">
      {cards.map((card, index) => {
        const isSelected = selectedQid === card.qid;
        const fa = TEMPLATE_QUESTIONS_FA[card.qid];
        const displayTitle = fa?.title ?? card.title;
        const displayReadme = fa?.readme ?? card.readme;
        return (
          <div
            key={card.qid}
            {...getItemProps(flatIndexOffset + index)}
            className={clsx('card', {
              'border-primary bg-primary bg-opacity-10': isSelected,
            })}
            style={{ cursor: 'pointer' }}
            aria-label={displayTitle}
          >
            <div className="card-body py-2 px-3">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <div
                    className={clsx('small', {
                      'text-primary fw-bold': isSelected,
                    })}
                  >
                    {displayTitle}
                  </div>
                  {showQid && (
                    <div className="text-muted small" style={{ fontSize: '0.75rem' }}>
                      {card.qid}
                    </div>
                  )}
                </div>
                {isSelected && <i className="fa fa-check-circle text-primary" aria-hidden="true" />}
              </div>
              {isSelected && displayReadme && (
                <div className="small mt-1 markdown-body">
                  <ReactMarkdown>{displayReadme.trim()}</ReactMarkdown>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function matchesSearch(query: string, question: TemplateQuestion): boolean {
  const lowerQuery = query.toLowerCase();
  if (question.title.toLowerCase().includes(lowerQuery)) return true;
  if (question.readme?.toLowerCase().includes(lowerQuery)) return true;
  const fa = TEMPLATE_QUESTIONS_FA[question.qid];
  if (fa?.title.toLowerCase().includes(lowerQuery)) return true;
  if (fa?.readme.toLowerCase().includes(lowerQuery)) return true;
  const cardInfo = getCardInfo(question.qid);
  if (cardInfo?.label.toLowerCase().includes(lowerQuery)) return true;
  if (cardInfo?.description.toLowerCase().includes(lowerQuery)) return true;
  return false;
}

function matchesCourseTemplateSearch(
  query: string,
  template: { qid: string; title: string },
): boolean {
  const lowerQuery = query.toLowerCase();
  return (
    template.title.toLowerCase().includes(lowerQuery) ||
    template.qid.toLowerCase().includes(lowerQuery)
  );
}

export function CreateQuestionForm({
  exampleCourseZones,
  courseTemplates,
  csrfToken,
  questionsUrl,
}: {
  exampleCourseZones: TemplateQuestionZone[];
  courseTemplates: { qid: string; title: string }[];
  csrfToken: string;
  questionsUrl: string;
}) {
  const [startFrom, setStartFrom] = useState(
    exampleCourseZones.length > 0 ? 'example' : courseTemplates.length > 0 ? 'course' : 'empty',
  );
  const [selectedTemplateQid, setSelectedTemplateQid] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const hasExampleTemplates = exampleCourseZones.length > 0;
  const isTemplateSelected = ['example', 'course'].includes(startFrom);

  // Filter zones/templates by search query
  const filteredZones = useMemo(() => {
    if (!searchQuery) return exampleCourseZones;
    return exampleCourseZones
      .map((zone) => ({
        ...zone,
        questions: zone.questions.filter((q) => matchesSearch(searchQuery, q)),
      }))
      .filter((zone) => zone.questions.length > 0);
  }, [searchQuery, exampleCourseZones]);

  const filteredCourseTemplates = useMemo(() => {
    if (!searchQuery) return courseTemplates;
    return courseTemplates.filter((t) => matchesCourseTemplateSearch(searchQuery, t));
  }, [searchQuery, courseTemplates]);

  // Build flat QID lists for radiogroup keyboard navigation.
  const exampleQids = useMemo(
    () => filteredZones.flatMap((z) => z.questions.map((q) => q.qid)),
    [filteredZones],
  );
  const courseQids = useMemo(
    () => filteredCourseTemplates.map((t) => t.qid),
    [filteredCourseTemplates],
  );

  const exampleNav = useRadioGroupNavigation({
    items: exampleQids,
    selectedValue: selectedTemplateQid,
    onSelect: setSelectedTemplateQid,
  });
  const courseNav = useRadioGroupNavigation({
    items: courseQids,
    selectedValue: selectedTemplateQid,
    onSelect: setSelectedTemplateQid,
  });

  const totalFilteredCount = run(() => {
    if (startFrom === 'example') return exampleQids.length;
    if (startFrom === 'course') return courseQids.length;
    return 0;
  });

  // Deselect template if it's been filtered out
  const handleSearch = useCallback(
    (query: string) => {
      setSearchQuery(query);
      if (query && selectedTemplateQid) {
        // Check if the selected template is still visible
        const isVisible =
          startFrom === 'example'
            ? exampleCourseZones.some((z) =>
                z.questions.some((q) => q.qid === selectedTemplateQid && matchesSearch(query, q)),
              )
            : courseTemplates.some(
                (t) => t.qid === selectedTemplateQid && matchesCourseTemplateSearch(query, t),
              );
        if (!isVisible) {
          setSelectedTemplateQid('');
        }
      }
    },
    [startFrom, selectedTemplateQid, exampleCourseZones, courseTemplates],
  );

  const handleStartFromChange = useCallback((value: string) => {
    setStartFrom(value);
    setSelectedTemplateQid('');
    setSearchQuery('');
  }, []);

  // Build start from options
  const startFromOptions = [];

  if (hasExampleTemplates) {
    startFromOptions.push({
      id: 'example',
      title: 'قالب آماده سامانه',
      description: 'شروع با یک قالب از پیش آماده‌شده',
    });
  }

  startFromOptions.push(
    {
      id: 'course',
      title: 'قالب‌های همین درس',
      description: 'شروع با یکی از قالب‌های تعریف‌شده در درس شما',
    },
    {
      id: 'empty',
      title: 'سوال خالی',
      description: 'شروع از صفر با یک سوال کاملاً خالی',
    },
  );

  return (
    <div className="bg-light p-4">
      <div className="card p-3" style={{ maxWidth: '64rem', margin: '0 auto' }}>
        <nav aria-label="breadcrumb" className="mb-3">
          <ol className="breadcrumb mb-0">
            <li className="breadcrumb-item">
              <a href={questionsUrl}>سوال‌ها</a>
            </li>
            <li className="breadcrumb-item active" aria-current="page">
              ایجاد سوال جدید
            </li>
          </ol>
        </nav>
        <form method="POST" autoComplete="off" onSubmit={() => setIsSubmitting(true)}>
          <div className="mb-5">
            <h2 className="h5">مشخصات سوال</h2>
            <div className="mb-3">
              <label className="form-label" htmlFor="title">
                عنوان سوال
              </label>
              <input
                type="text"
                className="form-control"
                id="title"
                name="title"
                aria-describedby="title_help"
                required
              />
              <small id="title_help" className="form-text text-muted">
                نام کامل سوال که برای کاربران نمایش داده می‌شود.
              </small>
            </div>

            <div className="mb-3">
              <label className="form-label" htmlFor="qid">
                شناسه سوال (QID)
              </label>
              <input
                type="text"
                className="form-control"
                id="qid"
                name="qid"
                aria-describedby="qid_help"
                // TODO: use `validateShortName` with react-hook-form to provide more specific
                //validation feedback (e.g., "cannot start with a slash").
                pattern={SHORT_NAME_PATTERN}
                required
              />
              <small id="qid_help" className="form-text text-muted">
                <QuestionShortNameDescription />
              </small>
            </div>
          </div>

          <div className="mb-3 mt-4">
            <h2 className="h5 mb-1">انتخاب نقطه شروع</h2>
            <p className="text-muted mb-3">
              برای شروع سریع یک قالب انتخاب کنید یا از صفر بسازید.
            </p>
            <RadioCardGroup
              label="انتخاب نقطه شروع"
              value={startFrom}
              options={startFromOptions}
              onChange={handleStartFromChange}
            />
          </div>

          {/* Hidden inputs for form submission */}
          <input type="hidden" name="start_from" value={startFrom} />
          <input
            type="hidden"
            name="template_qid"
            value={isTemplateSelected ? selectedTemplateQid : ''}
          />

          {/* Search + template gallery */}
          {isTemplateSelected && (
            <div className="mb-3">
              {startFrom === 'course' && courseTemplates.length === 0 ? (
                <EmptyCourseTemplatesState />
              ) : (
                <>
                  {startFrom === 'course' && (
                    <p className="text-muted small mb-3">
                      قالب‌های درس نقاط شروع قابل استفاده مجدد در همین درس هستند. هر سوالی که QID آن با <code>template/</code> شروع شود اینجا نمایش داده می‌شود.
                    </p>
                  )}
                  <input
                    type="search"
                    className="form-control"
                    id="template_search"
                    aria-label="جستجوی قالب‌ها"
                    placeholder="جستجوی قالب‌ها..."
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.currentTarget.value)}
                  />

                  {/* Live region for search result count */}
                  <div className="visually-hidden" aria-live="polite" aria-atomic="true">
                    {searchQuery
                      ? `${totalFilteredCount} قالب یافت شد`
                      : ''}
                  </div>

                  {/* PrairieLearn templates */}
                  {startFrom === 'example' && (
                    <div className="mt-4">
                      {filteredZones.length > 0 ? (
                        <div
                          role="radiogroup"
                          aria-label="انتخاب قالب"
                          className="d-flex flex-column gap-5"
                        >
                          {filteredZones.map((zone) => {
                            const zoneInfo = ZONE_INFO[zone.title];
                            const zoneLabel = zoneInfo?.heading ?? zone.title;
                            const showPreviews = zone.questions.every((q) =>
                              hasWireframePreview(q.qid),
                            );
                            // Compute where this zone's cards start in the flat list.
                            let flatIndexOffset = 0;
                            for (const z of filteredZones) {
                              if (z === zone) break;
                              flatIndexOffset += z.questions.length;
                            }
                            return (
                              <div key={zone.title} role="group" aria-label={zoneLabel}>
                                <h3 className="h6 fw-semibold mb-1">{zoneLabel}</h3>
                                {zoneInfo?.description && (
                                  <p className="text-muted small mb-2">{zoneInfo.description}</p>
                                )}
                                <TemplateCards
                                  cards={zone.questions}
                                  selectedQid={selectedTemplateQid}
                                  showPreviews={showPreviews}
                                  flatIndexOffset={flatIndexOffset}
                                  getItemProps={exampleNav.getItemProps}
                                />
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <EmptySearchState
                          query={searchQuery}
                          onStartFromScratch={() => handleStartFromChange('empty')}
                        />
                      )}
                    </div>
                  )}

                  {/* Course templates */}
                  {startFrom === 'course' && (
                    <div className="mt-3">
                      {filteredCourseTemplates.length > 0 ? (
                        <div role="radiogroup" aria-label="قالب‌های درس">
                          <TemplateCards
                            cards={filteredCourseTemplates.map((t) => ({
                              ...t,
                              // TODO: read README.md from the course directory
                              // to show descriptions like we do for built-in templates.
                              readme: null,
                            }))}
                            selectedQid={selectedTemplateQid}
                            showPreviews={false}
                            flatIndexOffset={0}
                            getItemProps={courseNav.getItemProps}
                            showQid
                          />
                        </div>
                      ) : (
                        <EmptySearchState
                          query={searchQuery}
                          onStartFromScratch={() => handleStartFromChange('empty')}
                        />
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          <input type="hidden" name="__action" value="add_question" />
          <input type="hidden" name="__csrf_token" value={csrfToken} />

          {/* Empty question state */}
          {startFrom === 'empty' && <StartFromScratchState isSubmitting={isSubmitting} />}

          {/* Sticky footer for template states */}
          {isTemplateSelected && !(startFrom === 'course' && courseTemplates.length === 0) && (
            <div style={{ position: 'sticky', bottom: 0, marginBottom: '-1rem' }}>
              <div
                style={{
                  height: '2rem',
                  background: 'linear-gradient(to bottom, rgba(255,255,255,0), white)',
                  pointerEvents: 'none',
                }}
              />
              <div className="d-grid pb-3" style={{ backgroundColor: 'white' }}>
                <button
                  type="submit"
                  className="btn btn-primary text-center"
                  disabled={!selectedTemplateQid || isSubmitting}
                >
                  <CreateQuestionButtonContent isSubmitting={isSubmitting} />
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}

CreateQuestionForm.displayName = 'CreateQuestionForm';

function EmptySearchState({
  query,
  onStartFromScratch,
}: {
  query: string;
  onStartFromScratch: () => void;
}) {
  return (
    <div className="text-center py-4">
      <p className="text-muted mb-2">هیچ قالبی مطابق با جستجو{query ? ` «${query}»` : ''} پیدا نشد.</p>
      <button type="button" className="btn btn-link btn-sm" onClick={onStartFromScratch}>
        شروع از صفر
      </button>
    </div>
  );
}

function EmptyCourseTemplatesState() {
  return (
    <div className="text-center py-4">
      <p className="mb-1">این درس هنوز هیچ قالبی ندارد.</p>
      <p className="small mb-0">
        قالب‌های درس نقاط شروع قابل استفاده مجدد در درس شما هستند. برای ساخت یک قالب، سوالی با QID شروع‌شونده با <code>template/</code> اضافه کنید.
      </p>
    </div>
  );
}

function StartFromScratchState({ isSubmitting }: { isSubmitting: boolean }) {
  return (
    <div className="d-grid gap-3">
      <p className="mb-0">
        کار را با فایل‌های خالی <code>question.html</code> و <code>server.py</code> شروع خواهید کرد.
      </p>
      <NewToPrairieLearnCard />
      <button type="submit" className="btn btn-primary text-nowrap" disabled={isSubmitting}>
        <CreateQuestionButtonContent isSubmitting={isSubmitting} />
      </button>
    </div>
  );
}

/** Button content for the "Create question" submit buttons; shows a spinner while submitting. */
function CreateQuestionButtonContent({ isSubmitting }: { isSubmitting: boolean }) {
  if (isSubmitting) {
    return (
      <>
        <span className="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true" />
        در حال ایجاد...
      </>
    );
  }
  return (
    <>
      ایجاد سوال <i className="fa fa-arrow-left ms-1" aria-hidden="true" />
    </>
  );
}
