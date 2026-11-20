import { QueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Button } from 'react-bootstrap';

import { formatDate } from '@prairielearn/formatter';
import { QueryClientProviderDebug } from '@prairielearn/trpc/react';
import { OverlayTrigger } from '@prairielearn/ui';

import { SyncProblemButton } from '../../components/SyncProblemButton.js';
import type { StaffCourse } from '../../lib/client/safe-db-types.js';

import { CreateCourseInstanceModal } from './components/CreateCourseInstanceModal.js';
import { EmptyState } from './components/EmptyState.js';
import type { InstructorCourseAdminInstanceRow } from './instructorCourseAdminInstances.shared.js';

const accessRuleRecommendation = (
  <p>
    Course instance access rules are deprecated. It is recommended that you switch to the new
    publishing system. You can do so by editing the <code>infoCourseInstance.json</code> file for
    the course instance. For more information, see the{' '}
    <a
      href="https://docs.prairielearn.com/courseInstance/#migrating-from-allowaccess"
      target="_blank"
      rel="noreferrer"
    >
      documentation on migrating to publishing
    </a>
    .
  </p>
);

const popoverStartDateBody = (
  <>
    <p>
      This date is the earliest <code>startDate</code> that appears in any <code>accessRule</code>{' '}
      for the course instance. Course instances are listed in order from newest to oldest according
      to this date.
    </p>
    {accessRuleRecommendation}
  </>
);

const popoverEndDateBody = (
  <>
    <p>
      This date is the latest <code>endDate</code> that appears in any <code>accessRule</code> for
      the course instance. If two course instances have the same &quot;Earliest Access Date,&quot;
      then they are listed from newest to oldest according to this &quot;Latest Access Date.&quot;
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
                  const startDate = row.publishing_start_date
                    ? `${formatDate(row.publishing_start_date, row.display_timezone)}`
                    : row.start_date
                      ? `${formatDate(row.start_date, row.display_timezone)}`
                      : '—';
                  const endDate = row.publishing_end_date
                    ? `${formatDate(row.publishing_end_date, row.display_timezone)}`
                    : row.end_date
                      ? `${formatDate(row.end_date, row.display_timezone)}`
                      : '—';
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
                      <td className="align-middle" dir="ltr">
                        {startDate}
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
                      <td className="align-middle" dir="ltr">
                        {endDate}
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
