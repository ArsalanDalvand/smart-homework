import type { ReactNode } from 'react';

import { PageLayout } from '../../components/PageLayout.js';
import { assetPath } from '../../lib/assets.js';
import { toPersianDigits } from '../../lib/jalali.js';
import type { ResLocalsForPage } from '../../lib/res-locals.js';
import type { SkillTreeNode, StudentSkillTreeData } from '../../lib/student-gamification.js';

const EN_PAREN_REGEX = /\([A-Za-z][^()]*[A-Za-z0-9]\)/g;

function renderBidiText(text: string): ReactNode {
  const parts: ReactNode[] = [];
  let lastIndex = 0;
  for (const match of text.matchAll(EN_PAREN_REGEX)) {
    const start = match.index;
    if (start > lastIndex) {
      parts.push(text.slice(lastIndex, start));
    }
    parts.push(
      <bdi key={`${start}-${match[0]}`} dir="ltr">
        {match[0]}
      </bdi>,
    );
    lastIndex = start + match[0].length;
  }
  if (lastIndex === 0) return text;
  if (lastIndex < text.length) {
    parts.push(text.slice(lastIndex));
  }
  return parts;
}

const STATUS_META: Record<SkillTreeNode['status'], { label: string; badgeClass: string }> = {
  unstarted: { label: 'شروع‌نشده', badgeClass: 'bg-body-tertiary text-body-secondary border' },
  learning: {
    label: 'در حال یادگیری',
    badgeClass: 'bg-warning-subtle text-warning-emphasis border border-warning-subtle',
  },
  proficient: { label: 'مسلط', badgeClass: 'bg-body-tertiary text-body border' },
  mastered: {
    label: 'تسلط کامل',
    badgeClass: 'bg-success-subtle text-success-emphasis border border-success-subtle',
  },
};

const SOURCE_LABEL: Record<StudentSkillTreeData['groupingSource'], string> = {
  topic: 'مباحث درس (Topics)',
  module: 'ماژول‌های آموزشی',
  assessment: 'مسیر تمرین‌های ترم',
};

function SkillProgressRing({ perc, status }: { perc: number; status: SkillTreeNode['status'] }) {
  const radius = 19;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, perc));
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <svg
      className={`sh-skill-ring is-${status}`}
      width="48"
      height="48"
      viewBox="0 0 48 48"
      aria-hidden="true"
    >
      <circle className="sh-skill-ring-track" cx="24" cy="24" r={radius} strokeWidth="4" />
      <circle
        className="sh-skill-ring-fill"
        cx="24"
        cy="24"
        r={radius}
        strokeWidth="4"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform="rotate(-90 24 24)"
      />
      <text x="24" y="27" textAnchor="middle" className="sh-skill-ring-text">
        {toPersianDigits(clamped)}٪
      </text>
    </svg>
  );
}

export function StudentSkills({
  resLocals,
  data,
}: {
  resLocals: ResLocalsForPage<'course-instance'>;
  data: StudentSkillTreeData;
}) {
  const activeNodeId = data.recommendedNodeId ?? (data.nodes.length > 0 ? data.nodes[0].id : null);

  return PageLayout({
    resLocals,
    pageTitle: 'درخت مهارت (Skill Tree)',
    navContext: {
      type: 'student',
      page: 'skills',
    },
    headContent: (
      <>
        <link href={assetPath('stylesheets/student-engagement.css')} rel="stylesheet" />
        <script src={assetPath('javascripts/student-skill-tree.js')} defer />
      </>
    ),
    content: (
      <div className="se-section" style={{ fontFamily: 'var(--font-persian)' }}>
        {/* Header Card */}
        <div className="se-card mb-4">
          <div className="se-card-header sh-hero-header py-3">
            <div>
              <h1 className="h4 fw-bold text-body mb-1">
                <i className="bi bi-diagram-3 me-2" aria-hidden="true" />
                درخت مهارت و مسیر یادگیری
              </h1>
              <div className="se-card-subtitle">
                گروه‌بندی بر اساس {SOURCE_LABEL[data.groupingSource]} — روی هر گره کلیک کنید تا سوالات
                همان مبحث را ببینید و ادامه دهید.
              </div>
            </div>
            <span className="badge bg-body-tertiary text-body border px-3 py-2 sh-tabular">
              {toPersianDigits(data.nodes.length)} گره مهارت
            </span>
          </div>
        </div>

        {/* Summary Stat Strip */}
        <div className="sh-stat-strip mb-4">
          <div className="sh-stat-cell">
            <div className="sh-stat-label">تسلط کل مسیر</div>
            <div className="sh-stat-value" dir="ltr">
              {toPersianDigits(data.overallMasteryPerc)}٪
            </div>
            <div className="sh-stat-sub">پیشرفت کلی در تمرین‌های فعال</div>
          </div>
          <div className="sh-stat-cell">
            <div className="sh-stat-label">سوالات حل‌شده</div>
            <div className="sh-stat-value">
              {toPersianDigits(data.totalSolved)} از {toPersianDigits(data.totalQuestions)}
            </div>
            <div className="sh-stat-sub">سوالات با نمره ۱۰۰٪</div>
          </div>
          <div className="sh-stat-cell">
            <div className="sh-stat-label">مباحث تکمیل‌شده</div>
            <div className="sh-stat-value">
              {toPersianDigits(data.masteredNodes)} از {toPersianDigits(data.nodes.length)}
            </div>
            <div className="sh-stat-sub">تکمیل ۱۰۰٪ سوالات هر گره</div>
          </div>
          <div className="sh-stat-cell">
            <div className="sh-stat-label">پیشنهاد بعدی</div>
            <div className="sh-stat-value" style={{ fontSize: '1.05rem' }}>
              {data.nodes.find((n) => n.id === data.recommendedNodeId)?.title ?? 'تکمیل کامل!'}
            </div>
            <div className="sh-stat-sub">نزدیک‌ترین گره آماده تکمیل</div>
          </div>
        </div>

        {data.nodes.length === 0 ? (
          <div className="se-card p-4 text-center text-body-secondary">
            هنوز تمرینی برای نمایش در مسیر مهارت منتشر نشده است.
          </div>
        ) : (
          <div className="row g-4">
            {/* Skill Tree Nodes Grid */}
            <div className="col-lg-7">
              <div className="sh-skill-grid" role="tablist" aria-label="گره‌های درخت مهارت">
                {data.nodes.map((node, idx) => {
                  const meta = STATUS_META[node.status];
                  const isSelected = node.id === activeNodeId;
                  return (
                    <button
                      key={node.id}
                      type="button"
                      role="tab"
                      aria-selected={isSelected ? 'true' : 'false'}
                      data-skill-node-btn={node.id}
                      className={`sh-skill-node is-${node.status} ${isSelected ? 'is-selected' : ''}`}
                    >
                      <SkillProgressRing perc={node.masteryPerc} status={node.status} />
                      <div className="flex-grow-1 min-w-0 text-start">
                        <div className="d-flex flex-wrap align-items-center justify-content-between gap-2">
                          <span className="fw-bold text-body text-break lh-sm">
                            <span className="text-body-secondary me-1 sh-tabular">
                              {toPersianDigits(idx + 1)}.
                            </span>
                            {renderBidiText(node.title)}
                          </span>
                          <span className={`badge flex-shrink-0 ${meta.badgeClass}`}>
                            {meta.label}
                          </span>
                        </div>
                        <div className="small text-body-secondary text-break mt-1">
                          {renderBidiText(node.subtitle)}
                        </div>
                        <div className="small text-body-secondary mt-1 sh-tabular">
                          {toPersianDigits(node.solvedQuestions)} از{' '}
                          {toPersianDigits(node.totalQuestions)} سوال کامل
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selected Node Detail Panel */}
            <div className="col-lg-5">
              {data.nodes.map((node) => {
                const isSelected = node.id === activeNodeId;
                return (
                  <div
                    key={node.id}
                    data-skill-node-panel={node.id}
                    className={`se-card sh-skill-detail ${isSelected ? '' : 'd-none'}`}
                    role="tabpanel"
                  >
                    <div className="se-card-header">
                      <div>
                        <h2 className="se-card-title">{node.title}</h2>
                        <div className="small text-body-secondary">{node.subtitle}</div>
                      </div>
                      {node.nextUnsolvedUrl && (
                        <a href={node.nextUnsolvedUrl} className="btn btn-primary btn-sm">
                          <span>ادامه این مبحث</span>
                          <i className="bi bi-arrow-left ms-1" aria-hidden="true" />
                        </a>
                      )}
                    </div>

                    <div className="list-group list-group-flush">
                      {node.questions.map((q) => {
                        const icon =
                          q.status === 'solved'
                            ? 'bi-check-circle-fill text-success'
                            : q.status === 'partial'
                              ? 'bi-circle-half text-warning'
                              : 'bi-circle text-body-secondary';
                        return (
                          <a
                            key={q.assessmentQuestionId}
                            href={q.href}
                            className="list-group-item list-group-item-action d-flex align-items-center justify-content-between gap-3 px-3 py-2"
                          >
                            <div className="d-flex align-items-center gap-2 min-w-0">
                              <i className={`bi ${icon} flex-shrink-0`} aria-hidden="true" />
                              <div className="min-w-0">
                                <div className="fw-medium text-body text-break lh-sm">
                                  {renderBidiText(q.questionTitle)}
                                </div>
                                <div className="small text-body-secondary">
                                  <span dir="ltr" className="me-1">
                                    {q.assessmentLabel}
                                  </span>
                                  · {q.assessmentTitle}
                                </div>
                              </div>
                            </div>

                            <div className="d-flex align-items-center gap-2 flex-shrink-0 sh-tabular">
                              {q.isOneShot && (
                                <span className="sh-honor-chip sh-en-term" title="One-Shot">
                                  <i
                                    className="bi bi-lightning-charge-fill text-warning"
                                    aria-hidden="true"
                                  />
                                  One-Shot
                                </span>
                              )}
                              <span className="badge bg-body-tertiary text-body border">
                                {toPersianDigits(Math.round(q.scorePerc))}٪
                              </span>
                            </div>
                          </a>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    ),
  });
}
