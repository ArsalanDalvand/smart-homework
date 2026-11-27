import clsx from 'clsx';

import { renderHtml } from '@prairielearn/react';

import { toPersianDigits } from '../lib/jalali.js';

export function Scorebar({
  score,
  className = '',
  minWidth = '5em',
  maxWidth = '20em',
}: {
  score: number | null;
  minWidth?: string;
  maxWidth?: string;
  className?: string;
}) {
  if (score == null) return '';
  const tier = score >= 100 ? 'perfect' : score >= 70 ? 'high' : score >= 40 ? 'mid' : 'low';
  const clampedPct = Math.max(0, Math.floor(Math.min(100, score)));
  const label = `${toPersianDigits(Math.floor(score))}٪`;

  return (
    <div
      className={clsx('progress', 'border', 'sh-scorebar', 'sh-tabular', className)}
      style={{ minWidth, maxWidth }}
      data-testid="scorebar"
      data-score-tier={tier}
    >
      <div className="progress-bar" style={{ width: `${clampedPct}%` }}>
        {score >= 50 ? label : ''}
      </div>
      <div
        className="d-flex flex-column justify-content-center text-center sh-scorebar-remainder"
        style={{ width: `${100 - clampedPct}%` }}
      >
        {score >= 50 ? '' : label}
      </div>
    </div>
  );
}

export function ScorebarHtml(
  score: number | null,
  {
    minWidth = '5em',
    maxWidth = '20em',
    classes = '',
  }: { minWidth?: string; maxWidth?: string; classes?: string } = {},
) {
  return renderHtml(
    <Scorebar score={score} className={classes} minWidth={minWidth} maxWidth={maxWidth} />,
  );
}
