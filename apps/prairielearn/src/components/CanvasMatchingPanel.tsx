import clsx from 'clsx';
import { useCallback, useRef, useState } from 'react';
import Alert from 'react-bootstrap/Alert';
import Form from 'react-bootstrap/Form';

import {
  type CanvasStudent,
  type StrategyResult,
  type Student,
  parseCanvasCsv,
  runAllStrategies,
} from '../lib/canvas-matching.js';

export interface CanvasMatchingState {
  canvasStudents: CanvasStudent[];
  allResults: StrategyResult[];
  bestResult: StrategyResult;
}

/**
 * Shared panel for uploading a Canvas gradebook CSV and displaying the
 * auto-selected matching strategy result. Used in both the Gradebook and
 * Assessment Downloads Canvas export modals.
 */
export function CanvasMatchingPanel({
  students,
  matchingState,
  onMatchingStateChange,
}: {
  students: Student[];
  matchingState: CanvasMatchingState | null;
  onMatchingStateChange: (state: CanvasMatchingState | null) => void;
}) {
  const [parseError, setParseError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) {
        onMatchingStateChange(null);
        setParseError(null);
        return;
      }

      const text = await file.text();
      const { students: canvasStudents, error } = parseCanvasCsv(text);

      if (error) {
        setParseError(error);
        onMatchingStateChange(null);
        return;
      }

      if (canvasStudents.length === 0) {
        setParseError('هیچ ردیف دانشجویی در فایل CSV بارگذاری‌شده یافت نشد.');
        onMatchingStateChange(null);
        return;
      }

      setParseError(null);

      const results = runAllStrategies(students, canvasStudents);
      const best = results.reduce((a, b) => (b.score > a.score ? b : a));

      onMatchingStateChange({
        canvasStudents,
        allResults: results,
        bestResult: best,
      });
    },
    [students, onMatchingStateChange],
  );

  const handleClear = useCallback(() => {
    onMatchingStateChange(null);
    setParseError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [onMatchingStateChange]);

  return (
    <div>
      <h6>ورود دفترچه نمره Canvas</h6>
      <p className="text-muted small mb-1">
        یک فایل CSV دفترچه نمره خروجی‌گرفته‌شده از Canvas را بارگذاری کنید تا سامانه بتواند از شناسه فهرست
        هر دانشجو در آن فایل دوباره استفاده کند. بدون این کار، ستون‌های هویتی که دانشجویان را به
        Canvas معرفی می‌کنند خالی خواهند ماند.
      </p>
      <p className="small mb-3">
        <a
          href="https://prairielearn.readthedocs.io/en/latest/lmsIntegrationInstructor/#exporting-canvas-compatible-csv-files"
          target="_blank"
          rel="noopener noreferrer"
        >
          اطلاعات بیشتر درباره خروجی گرفتن نمرات برای Canvas
        </a>
      </p>

      <Form.Group controlId="canvas-csv-upload" className="mb-3">
        <Form.Label>فایل CSV دفترچه نمره Canvas</Form.Label>
        <div className="d-flex align-items-center gap-2">
          <Form.Control ref={fileInputRef} type="file" accept=".csv" onChange={handleFileChange} />
          {matchingState && (
            <button
              type="button"
              className="btn btn-sm btn-outline-secondary text-nowrap"
              onClick={handleClear}
            >
              پاک کردن
            </button>
          )}
        </div>
      </Form.Group>

      {parseError && <Alert variant="danger">{parseError}</Alert>}

      {matchingState && <MatchingSummary bestResult={matchingState.bestResult} />}
    </div>
  );
}

function MatchingSummary({ bestResult }: { bestResult: StrategyResult }) {
  const { result, strategy } = bestResult;
  const { matched, ambiguousPl, ambiguousCanvas, unmatchedPl, unmatchedCanvas } = result;

  if (matched.length === 0) {
    return (
      <Alert variant="danger" className="d-flex align-items-start gap-2">
        <i className="bi bi-x-circle-fill" />
        <div>
          تطبیق هیچ‌یک از رکوردهای دانشجویان Canvas با دانشجویان سامانه امکان‌پذیر نبود. ستون‌های
          هویتی در فایل CSV خروجی خالی خواهند بود. مطمئن شوید که فایل بارگذاری‌شده یک CSV دفترچه
          نمره خروجی از Canvas است.
        </div>
      </Alert>
    );
  }

  const hasProblems =
    ambiguousPl.length > 0 ||
    ambiguousCanvas.length > 0 ||
    unmatchedPl.length > 0 ||
    unmatchedCanvas.length > 0;

  const variant = hasProblems ? 'warning' : 'success';
  const icon = hasProblems ? 'bi-exclamation-triangle-fill' : 'bi-check-circle-fill';

  return (
    <div>
      <Alert variant={variant} className="d-flex align-items-start gap-2">
        <i className={`bi ${icon}`} />
        <div>
          <div className="mb-1">
            تعداد <strong>{matched.length}</strong> دانشجو با استفاده از{' '}
            <strong>{strategy.label}</strong> تطبیق داده شد
          </div>
          {(ambiguousPl.length > 0 || ambiguousCanvas.length > 0) && (
            <div
              className={clsx(
                'small',
                unmatchedPl.length > 0 || unmatchedCanvas.length > 0 ? 'mb-1' : '',
              )}
            >
              {ambiguousPl.length > 0 && (
                <>
                  <strong>{ambiguousPl.length}</strong> دانشجو در سامانه
                </>
              )}
              {ambiguousCanvas.length > 0 && (
                <>
                  {ambiguousPl.length > 0 ? ' و ' : ''}
                  <strong>{ambiguousCanvas.length}</strong> دانشجو در Canvas
                </>
              )}{' '}
              قابل ابهام‌زدایی نبودند و در فایل CSV خروجی نام آن‌ها درج می‌شود اما ستون‌های هویتی
              خالی خواهند ماند.
            </div>
          )}
          {unmatchedPl.length > 0 && (
            <div className={clsx('small', unmatchedCanvas.length > 0 ? 'mb-1' : '')}>
              <strong>{unmatchedPl.length}</strong> دانشجوی تطبیق‌نیافته سامانه در فایل CSV خروجی
              دارای نام خواهند بود اما ستون‌های هویتی آن‌ها خالی می‌ماند.
            </div>
          )}
          {unmatchedCanvas.length > 0 && (
            <div className="small">
              <strong>{unmatchedCanvas.length}</strong> دانشجوی تطبیق‌نیافته Canvas از خروجی حذف
              خواهند شد.
            </div>
          )}
        </div>
      </Alert>

      {(ambiguousPl.length > 0 || ambiguousCanvas.length > 0) && (
        <AmbiguousStudentsList ambiguousPl={ambiguousPl} ambiguousCanvas={ambiguousCanvas} />
      )}

      {(unmatchedPl.length > 0 || unmatchedCanvas.length > 0) && (
        <UnmatchedStudentsList unmatchedPl={unmatchedPl} unmatchedCanvas={unmatchedCanvas} />
      )}
    </div>
  );
}

function AmbiguousStudentsList({
  ambiguousPl,
  ambiguousCanvas,
}: {
  ambiguousPl: Student[];
  ambiguousCanvas: CanvasStudent[];
}) {
  return (
    <details className="mb-3">
      <summary className="fw-semibold small">
        دانشجویان مبهم ({ambiguousPl.length + ambiguousCanvas.length})
      </summary>
      <p className="text-muted small mt-1">
        این دانشجویان دارای شناسه مشترک با دانشجوی دیگری در همان طرف هستند و نمی‌توان آن‌ها را
        به‌صورت خودکار تطبیق داد.
      </p>
      {ambiguousPl.length > 0 && (
        <div className="mb-2">
          <div className="fw-semibold small">سامانه</div>
          <StudentList students={ambiguousPl} />
        </div>
      )}
      {ambiguousCanvas.length > 0 && (
        <div>
          <div className="fw-semibold small">Canvas</div>
          <CanvasStudentList students={ambiguousCanvas} />
        </div>
      )}
    </details>
  );
}

function UnmatchedStudentsList({
  unmatchedPl,
  unmatchedCanvas,
}: {
  unmatchedPl: Student[];
  unmatchedCanvas: CanvasStudent[];
}) {
  return (
    <>
      {unmatchedPl.length > 0 && (
        <details className="mb-3">
          <summary className="fw-semibold small">
            دانشجویان تطبیق‌نیافته سامانه ({unmatchedPl.length})
          </summary>
          <div className="mt-1">
            <StudentList students={unmatchedPl} />
          </div>
        </details>
      )}
      {unmatchedCanvas.length > 0 && (
        <details className="mb-3">
          <summary className="fw-semibold small">
            دانشجویان تطبیق‌نیافته Canvas ({unmatchedCanvas.length})
          </summary>
          <div className="mt-1">
            <CanvasStudentList students={unmatchedCanvas} />
          </div>
        </details>
      )}
    </>
  );
}

function StudentList({ students }: { students: Student[] }) {
  return (
    <ul className="list-unstyled small ps-3">
      {/* Students in the ambiguous list share the same uid by definition */}
      {students.map((s, i) => (
        // oxlint-disable-next-line react/no-array-index-key
        <li key={`${s.uid}-${i}`}>
          {s.userName ?? '(بدون نام)'} <span className="text-muted">({s.uid})</span>
        </li>
      ))}
    </ul>
  );
}

function CanvasStudentList({ students }: { students: CanvasStudent[] }) {
  return (
    <ul className="list-unstyled small ps-3">
      {students.map((c) => (
        <li key={`${c.id}-${c.sisLoginId}-${c.sisUserId}`}>
          {c.name} <span className="text-muted">({c.sisLoginId || c.sisUserId || c.id})</span>
        </li>
      ))}
    </ul>
  );
}
