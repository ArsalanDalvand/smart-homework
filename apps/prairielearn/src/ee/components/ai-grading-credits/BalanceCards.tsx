import { useId } from 'react';

import { OverlayTrigger } from '@prairielearn/ui';

import { formatMilliDollars } from '../../../lib/ai-grading-credits.js';

const TOOLTIP_TEXT = {
  instructor: {
    transferable: 'این اعتبارها قابل انتقال بین ارائه‌های درس در موسسه شما هستند.',
    nonTransferable:
      'این اعتبارها مخصوص همین ارائه درس هستند و قابل انتقال نیستند.',
  },
  admin: {
    transferable:
      'اعتبارهایی که بین ارائه‌های درس در همان موسسه قابل انتقال هستند.',
    nonTransferable: 'اعتبارهای قفل‌شده به این ارائه درس که قابل انتقال نیستند.',
  },
};

export function BalanceCards({
  pool,
  context,
  dimmed = false,
}: {
  pool: {
    total_milli_dollars: number;
    credit_transferable_milli_dollars: number;
    credit_non_transferable_milli_dollars: number;
  };
  context: 'instructor' | 'admin';
  dimmed?: boolean;
}) {
  const transferableTooltipId = useId();
  const nonTransferableTooltipId = useId();
  const tooltips = TOOLTIP_TEXT[context];

  const dimStyle = dimmed ? { opacity: 0.4 } : undefined;

  return (
    <>
      <div className="row mb-3 g-3">
        <div className="col-md-4">
          <div className="border rounded p-3 text-center" style={dimStyle}>
            <div className="text-muted small">کل اعتبار در دسترس</div>
            <div className="h4 mb-0">{formatMilliDollars(pool.total_milli_dollars)}</div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="border rounded p-3 text-center" style={dimStyle}>
            <div className="text-muted small">
              قابل انتقال{' '}
              <OverlayTrigger
                placement="top"
                tooltip={{
                  body: tooltips.transferable,
                  props: { id: transferableTooltipId },
                }}
              >
                <button
                  type="button"
                  className="btn btn-link p-0 border-0 align-baseline"
                  aria-label="اطلاعات بیشتر درباره اعتبارهای قابل انتقال"
                >
                  <i className="bi bi-info-circle" aria-hidden="true" />
                </button>
              </OverlayTrigger>
            </div>
            <div className="h5 mb-0">
              {formatMilliDollars(pool.credit_transferable_milli_dollars)}
            </div>
          </div>
        </div>
        <div className="col-md-4">
          <div className="border rounded p-3 text-center" style={dimStyle}>
            <div className="text-muted small">
              غیرقابل انتقال{' '}
              <OverlayTrigger
                placement="top"
                tooltip={{
                  body: tooltips.nonTransferable,
                  props: { id: nonTransferableTooltipId },
                }}
              >
                <button
                  type="button"
                  className="btn btn-link p-0 border-0 align-baseline"
                  aria-label="اطلاعات بیشتر درباره اعتبارهای غیرقابل انتقال"
                >
                  <i className="bi bi-info-circle" aria-hidden="true" />
                </button>
              </OverlayTrigger>
            </div>
            <div className="h5 mb-0">
              {formatMilliDollars(pool.credit_non_transferable_milli_dollars)}
            </div>
          </div>
        </div>
      </div>
      {context === 'instructor' && pool.credit_transferable_milli_dollars < 0 && (
        <p className="text-muted small mb-3">
          موجودی قابل انتقال منفی زمانی رخ می‌دهد که درخواست‌های تصحیح هوشمند در حال انجام پس از اتمام اعتبار شما تکمیل شوند. مبلغ بدهی از خرید اعتبار بعدی شما کسر خواهد شد.
        </p>
      )}
    </>
  );
}
