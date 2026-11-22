import type { StaffAssessmentQuestionRow } from '../lib/assessment-question.shared.js';

export function AssessmentQuestionHeaders({
  question,
  nTableCols,
}: {
  question: StaffAssessmentQuestionRow;
  nTableCols: number;
}) {
  return (
    <>
      {question.start_new_zone ? (
        <tr>
          <th colSpan={nTableCols} scope="rowgroup">
            <div className="d-flex align-items-center">
              بخش {question.zone.number}. {question.zone.title}{' '}
              {question.zone.number_choose == null
                ? '(انتخاب تمامی سوالات)'
                : question.zone.number_choose === 1
                  ? '(انتخاب ۱ سوال)'
                  : `(انتخاب ${question.zone.number_choose} سوال)`}
              {question.zone.max_points != null
                ? ` (حداکثر ${question.zone.max_points} نمره)`
                : ''}
              {question.zone.best_questions != null
                ? ` (بهترین ${question.zone.best_questions} سوال)`
                : ''}
              {question.zone.lockpoint ? (
                <span className="badge text-bg-warning ms-2">
                  <i className="bi bi-lock-fill me-1" aria-hidden="true" />
                  مرحله عطف
                </span>
              ) : null}
            </div>
          </th>
        </tr>
      ) : (
        ''
      )}
      {question.start_new_alternative_pool && question.alternative_pool_size > 1 ? (
        <tr>
          <td colSpan={nTableCols}>
            {question.alternative_pool.number}.{' '}
            {question.alternative_pool.number_choose == null
              ? 'انتخاب تمامی سوالات از:'
              : question.alternative_pool.number_choose === 1
                ? 'انتخاب ۱ سوال از:'
                : `انتخاب ${question.alternative_pool.number_choose} سوال از:`}
          </td>
        </tr>
      ) : (
        ''
      )}
    </>
  );
}

/**
 * Renders a question number badge such as "3." or "3.2.".
 */
export function AssessmentQuestionNumber({
  questionNumber,
  alternativeNumber,
  className,
}: {
  questionNumber: number;
  alternativeNumber?: number | null;
  className?: string;
}) {
  return (
    <span className={className} style={{ fontVariant: 'tabular-nums' }}>
      {alternativeNumber != null ? `${questionNumber}.${alternativeNumber}.` : `${questionNumber}.`}
    </span>
  );
}
