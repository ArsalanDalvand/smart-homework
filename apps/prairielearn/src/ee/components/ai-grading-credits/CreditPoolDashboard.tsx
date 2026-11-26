import { useQuery } from '@tanstack/react-query';
import { type createTRPCContext } from '@trpc/tanstack-react-query';
import clsx from 'clsx';
import { useState } from 'react';
import { Alert, Dropdown, Spinner } from 'react-bootstrap';

import type { CreditPoolRouter } from '../../lib/credit-pool-trpc.js';

import { BalanceCards } from './BalanceCards.js';
import { DailySpendingChart, type GroupByOption } from './DailySpendingChart.js';
import { TransactionHistoryTable } from './TransactionHistoryTable.js';
import { CHART_DAYS_OPTIONS, type ChartDays, DEFAULT_CHART_DAYS } from './constants.js';

type CreditPoolContext = ReturnType<typeof createTRPCContext<CreditPoolRouter>>;
type CreditPoolTRPC = ReturnType<CreditPoolContext['useTRPC']>;

export function CreditPoolDashboard({
  trpc,
  balanceContext,
  dimmed,
  onPurchaseClick,
  onRedeemFreeCreditClick,
  canEdit = true,
  header,
  children,
  showRefundActions,
  onRefund,
  isRefunding,
}: {
  trpc: CreditPoolTRPC;
  balanceContext: 'admin' | 'instructor';
  dimmed?: boolean;
  onPurchaseClick?: () => void;
  onRedeemFreeCreditClick?: () => void;
  canEdit?: boolean;
  header?: React.ReactNode;
  children?: React.ReactNode;
  showRefundActions?: boolean;
  onRefund?: (checkoutSessionId: string) => void;
  isRefunding?: boolean;
}) {
  const showEmptyState = balanceContext === 'instructor';
  const [showHistory, setShowHistory] = useState(false);
  const [page, setPage] = useState(1);
  const [chartDays, setChartDays] = useState<ChartDays>(DEFAULT_CHART_DAYS);
  const [groupBy, setGroupBy] = useState<GroupByOption>('none');

  const poolQuery = useQuery(trpc.creditPool.queryOptions());
  const changesQuery = useQuery({
    ...trpc.creditPoolChanges.queryOptions({ page }),
    enabled: showHistory || (showEmptyState && poolQuery.data != null),
  });
  const dailySpendingQuery = useQuery(trpc.dailySpending.queryOptions({ days: chartDays }));
  const validGroupBy = groupBy !== 'none' ? groupBy : undefined;
  const groupedSpendingQuery = useQuery({
    ...trpc.dailySpendingGrouped.queryOptions({
      days: chartDays,
      group_by: validGroupBy ?? 'user',
    }),
    enabled: validGroupBy != null,
  });

  if (poolQuery.isError) {
    return <Alert variant="danger">بارگذاری اطلاعات مخزن اعتبار ناموفق بود.</Alert>;
  }

  if (!poolQuery.data) {
    return (
      <div className="text-center py-4">
        <Spinner animation="border" size="sm" className="me-2" />
        در حال بارگذاری اعتبارهای تصحیح هوشمند...
      </div>
    );
  }

  const pool = poolQuery.data;
  const hasNoBalance =
    pool.credit_transferable_milli_dollars === 0 &&
    pool.credit_non_transferable_milli_dollars === 0;

  if (hasNoBalance && showEmptyState && !dimmed) {
    if (changesQuery.isError) {
      return <Alert variant="danger">بارگذاری تاریخچه تراکنش‌ها ناموفق بود.</Alert>;
    }
    if (!changesQuery.isFetched) {
      return (
        <div className="text-center py-4">
          <Spinner animation="border" size="sm" className="me-2" />
          در حال بارگذاری اعتبارهای تصحیح هوشمند...
        </div>
      );
    }
    const hasTransactions = (changesQuery.data?.totalCount ?? 0) > 0;
    if (!hasTransactions) {
      return (
        <div className="text-center py-5">
          <i
            className="bi bi-stars d-block mb-3 text-muted"
            aria-hidden="true"
            style={{ fontSize: '2.5rem' }}
          />
          <h3 className="h5 mb-2">شروع به کار با تصحیح هوشمند (AI Grading)</h3>
          <p className="text-muted mb-3">
            {canEdit
              ? 'برای شروع تصحیح ارسال‌ها با هوش مصنوعی اعتبار خریداری کنید.'
              : 'برای خرید یا دریافت اعتبار رایگان تصحیح هوشمند باید مالک درس باشید.'}
          </p>
          <div className="d-flex flex-column align-items-center gap-2">
            {onRedeemFreeCreditClick && (
              <button
                type="button"
                className="btn btn-success d-inline-flex align-items-center gap-2"
                disabled={!canEdit}
                onClick={onRedeemFreeCreditClick}
              >
                <i className="bi bi-gift-fill" aria-hidden="true" />
                دریافت اعتبار رایگان
              </button>
            )}
            {onPurchaseClick && (
              <button
                type="button"
                className="btn btn-primary d-inline-flex align-items-center gap-2"
                disabled={!canEdit}
                onClick={onPurchaseClick}
              >
                <i className="bi bi-cart-plus" aria-hidden="true" />
                خرید اعتبار
              </button>
            )}
          </div>
        </div>
      );
    }
  }

  return (
    <>
      {header}
      <BalanceCards pool={pool} context={balanceContext} dimmed={dimmed} />
      {children}
      <div>
        <div className="mb-3">
          <div className="d-flex justify-content-between align-items-center mb-2">
            <h3 className="h6 mb-0">مصرف روزانه</h3>
            <div className="d-flex align-items-center gap-2">
              <Dropdown onSelect={(key) => setGroupBy((key ?? 'none') as GroupByOption)}>
                <Dropdown.Toggle variant="outline-secondary" size="sm">
                  {groupBy === 'none' && 'گروه‌بندی بر اساس'}
                  {groupBy === 'user' && 'گروه‌بندی بر اساس کاربر'}
                  {groupBy === 'assessment' && 'گروه‌بندی بر اساس آزمون/تکلیف'}
                  {groupBy === 'question' && 'گروه‌بندی بر اساس سوال'}
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  <Dropdown.Item eventKey="none" active={groupBy === 'none'}>
                    بدون گروه‌بندی
                  </Dropdown.Item>
                  <Dropdown.Item eventKey="user" active={groupBy === 'user'}>
                    بر اساس کاربر
                  </Dropdown.Item>
                  <Dropdown.Item eventKey="assessment" active={groupBy === 'assessment'}>
                    بر اساس آزمون/تکلیف
                  </Dropdown.Item>
                  <Dropdown.Item eventKey="question" active={groupBy === 'question'}>
                    بر اساس سوال
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
              <div className="btn-group btn-group-sm" role="group" aria-label="بازه زمانی">
                {CHART_DAYS_OPTIONS.map((d) => (
                  <button
                    key={d}
                    type="button"
                    className={clsx(
                      'btn',
                      d === chartDays ? 'btn-primary' : 'btn-outline-secondary',
                    )}
                    onClick={() => setChartDays(d)}
                  >
                    {d} روز
                  </button>
                ))}
              </div>
            </div>
          </div>
          {dailySpendingQuery.data && (
            <DailySpendingChart
              data={dailySpendingQuery.data}
              groupedData={groupBy !== 'none' ? groupedSpendingQuery.data : undefined}
            />
          )}
        </div>

        <div>
          <button
            type="button"
            className="btn btn-sm btn-outline-secondary"
            onClick={() => {
              setShowHistory(!showHistory);
              if (!showHistory) setPage(1);
            }}
          >
            {showHistory ? 'پنهان کردن تاریخچه تراکنش‌ها' : 'نمایش تاریخچه تراکنش‌ها'}
          </button>

          {showHistory && (
            <div className="mt-3">
              {changesQuery.isLoading && (
                <p className="text-muted">در حال بارگذاری تاریخچه تراکنش‌ها...</p>
              )}
              {changesQuery.isError && (
                <Alert variant="danger">بارگذاری تاریخچه تراکنش‌ها ناموفق بود.</Alert>
              )}
              {changesQuery.data && (
                <TransactionHistoryTable
                  rows={changesQuery.data.rows}
                  totalCount={changesQuery.data.totalCount}
                  page={page}
                  showRefundActions={showRefundActions}
                  transferableMilliDollars={pool.credit_transferable_milli_dollars}
                  isRefunding={isRefunding}
                  onPageChange={setPage}
                  onRefund={onRefund}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
