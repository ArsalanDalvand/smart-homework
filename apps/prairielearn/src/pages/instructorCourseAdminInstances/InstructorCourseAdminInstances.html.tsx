import { QueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Button } from 'react-bootstrap';

import { QueryClientProviderDebug } from '@prairielearn/trpc/react';
import { OverlayTrigger } from '@prairielearn/ui';

import { FriendlyDate } from '../../components/FriendlyDate.js';
import { SyncProblemButton } from '../../components/SyncProblemButton.js';
import type { StaffCourse } from '../../lib/client/safe-db-types.js';

import { CreateCourseInstanceModal } from './components/CreateCourseInstanceModal.js';
import { EmptyState } from './components/EmptyState.js';
import type { InstructorCourseAdminInstanceRow } from './instructorCourseAdminInstances.shared.js';

const accessRuleRecommendation = (
  <p className="mt-2 mb-0 small text-muted">
    قوانین دسترسی قدیمی منسوخ شده‌اند. پیشنهاد می‌شود از سیستم جدید انتشار دوره‌ها استفاده نمایید.
    جهت کسب اطلاعات بیشتر، مستندات سامانه را مطالعه فرمایید.
  </p>
);

const popoverStartDateBody = (
  <>
    <p className="mb-0">
      این تاریخ، اولین <code>startDate</code> تعریف‌شده در قوانین دسترسی دوره است.
      دوره‌ها بر اساس این تاریخ از جدیدترین به قدیمی‌ترین مرتب می‌شوند.
    </p>
    {accessRuleRecommendation}
  </>
);

const popoverEndDateBody = (
  <>
    <p className="mb-0">
      این تاریخ، آخرین <code>endDate</code> تعریف‌شده در قوانین دسترسی دوره است.
      در صورت یکسان بودن تاریخ شروع، دوره‌ها بر اساس این تاریخ مرتب می‌شوند.
    </p>
    {accessRuleRecommendation}
  </>
);

interface InstructorCourseAdminInstancesInnerProps {
  courseInstances: InstructorCourseAdminInstanceRow[];
  course: StaffCourse;
  canEditCourse: boolean;
  needToSync: boolean;
  csrfToken: string;
  urlPrefix: string;
  isAdministrator: boolean;
}

function InstructorCourseAdminInstancesInner({
  courseInstances,
  course,
  canEditCourse,
  needToSync,
  csrfToken,
  urlPrefix,
  isAdministrator,
}: InstructorCourseAdminInstancesInnerProps) {
  const [showCreateModal, setShowCreateModal] = useState(false);

  const canCreateInstances = canEditCourse && !course.example_course && !needToSync;

  return (
    <>
      <CreateCourseInstanceModal
        show={showCreateModal}
        course={course}
        csrfToken={csrfToken}
        isAdministrator={isAdministrator}
        onHide={() => setShowCreateModal(false)}
      />

      <div className="card mb-4" style={{ fontFamily: 'var(--font-persian)' }}>
        <div className="card-header bg-primary text-white d-flex align-items-center justify-content-between">
          <h1 className="h4 mb-0">ترم‌ها و دوره‌های ارائه شده</h1>
          {courseInstances.length > 0 && canCreateInstances && (
            <Button
              variant="light"
              size="sm"
              type="button"
              onClick={() => setShowCreateModal(true)}
            >
              <i className="fa fa-plus me-1" aria-hidden="true" />
              <span className="d-none d-sm-inline">افزودن دوره جدید</span>
            </Button>
          )}
        </div>
        {courseInstances.length > 0 ? (
          <div className="table-responsive">
            <table
              className="table table-sm table-hover table-striped"
              aria-label="ترم‌ها و دوره‌های ارائه شده"
            >
              <thead>
                <tr>
                  <th>عنوان کامل دوره / ترم</th>
                  <th>نام اختصاری (کد ترم)</th>
                  <th>تاریخ شروع</th>
                  <th>تاریخ پایان</th>
                  <th>تعداد فراگیران</th>
                </tr>
              </thead>
              <tbody>
                {courseInstances.map((row) => {
                  const isLegacyStartDate = row.start_date !== null;
                  const isLegacyEndDate = row.end_date !== null;
                  const startDate = row.publishing_start_date ?? row.start_date;
                  const endDate = row.publishing_end_date ?? row.end_date;
                  return (
                    <tr key={row.id}>
                      <td className="align-middle">
                        {row.sync_errors ? (
                          <SyncProblemButton type="error" output={row.sync_errors} />
                        ) : row.sync_warnings ? (
                          <SyncProblemButton type="warning" output={row.sync_warnings} />
                        ) : null}
                        <a href={`/pl/course_instance/${row.id}/instructor/instance_admin`}>
                          {row.long_name}
                        </a>
                      </td>
                      <td className="align-middle font-monospace" dir="ltr">{row.short_name}</td>
                      <td className="align-middle">
                        {startDate ? (
                          <FriendlyDate date={startDate} timezone={row.display_timezone} />
                        ) : (
                          '—'
                        )}
                        {isLegacyStartDate ? (
                          <OverlayTrigger
                            placement="bottom"
                            trigger="click"
                            popover={{
                              props: {
                                id: `popover-start-date-${row.id}`,
                              },
                              header: 'اولین تاریخ دسترسی',
                              body: popoverStartDateBody,
                            }}
                            rootClose
                          >
                            <Button
                              variant="ghost"
                              className="btn-xs ms-1"
                              aria-label="اطلاعات درباره تاریخ شروع"
                            >
                              <i className="far fa-question-circle" aria-hidden="true" />
                            </Button>
                          </OverlayTrigger>
                        ) : null}
                      </td>
                      <td className="align-middle">
                        {endDate ? (
                          <FriendlyDate date={endDate} timezone={row.display_timezone} />
                        ) : (
                          '—'
                        )}
                        {isLegacyEndDate ? (
                          <OverlayTrigger
                            placement="bottom"
                            trigger="click"
                            popover={{
                              props: {
                                id: `popover-end-date-${row.id}`,
                              },
                              header: 'آخرین تاریخ دسترسی',
                              body: popoverEndDateBody,
                            }}
                            rootClose
                          >
                            <Button
                              variant="ghost"
                              className="btn-xs ms-1"
                              aria-label="اطلاعات درباره تاریخ پایان"
                            >
                              <i className="far fa-question-circle" aria-hidden="true" />
                            </Button>
                          </OverlayTrigger>
                        ) : null}
                      </td>
                      <td className="align-middle">{row.enrollment_count}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState
            courseExample={course.example_course}
            canEditCourse={canEditCourse}
            needToSync={needToSync}
            urlPrefix={urlPrefix}
            onCreateClick={() => setShowCreateModal(true)}
          />
        )}
      </div>
    </>
  );
}

export function InstructorCourseAdminInstances({
  ...props
}: InstructorCourseAdminInstancesInnerProps) {
  const [queryClient] = useState(() => new QueryClient());
  return (
    <QueryClientProviderDebug client={queryClient}>
      <InstructorCourseAdminInstancesInner {...props} />
    </QueryClientProviderDebug>
  );
}
InstructorCourseAdminInstances.displayName = 'InstructorCourseAdminInstances';
