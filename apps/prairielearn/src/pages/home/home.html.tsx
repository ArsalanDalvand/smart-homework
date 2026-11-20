import { Hydrate } from '@prairielearn/react/server';

import { platformBranding, uiStrings } from '../../lib/branding.js';
import { type StaffInstitution } from '../../lib/client/safe-db-types.js';
import { type NewsItem } from '../../lib/db-types.js';

import { HomeCards } from './components/HomeCards.js';
import { NewsAlert } from './components/NewsAlert.js';
import type { InstructorHomePageCourse, StudentHomePageCourse } from './home.types.js';

export function Home({
  canAddCourses,
  csrfToken,
  instructorCourses,
  studentCourses,
  adminInstitutions,
  urlPrefix,
  isDevMode,
  search,
  unreadNewsItems,
  blogUrl,
  now,
}: {
  canAddCourses: boolean;
  csrfToken: string;
  instructorCourses: InstructorHomePageCourse[];
  studentCourses: StudentHomePageCourse[];
  adminInstitutions: StaffInstitution[];
  urlPrefix: string;
  isDevMode: boolean;
  search: string;
  unreadNewsItems: NewsItem[];
  blogUrl: string | null;
  now: Date;
}) {
  return (
    <div className="pt-4 mx-auto" style={{ maxWidth: 1000, fontFamily: 'var(--font-persian)' }}>
      <h1 className="visually-hidden">{platformBranding.brandName}</h1>
      <DevModeCard isDevMode={isDevMode} />
      <AdminInstitutionsCard adminInstitutions={adminInstitutions} />
      <NewsAlert newsItems={unreadNewsItems} csrfToken={csrfToken} blogUrl={blogUrl} now={now} />
      <InstructorCoursesCard instructorCourses={instructorCourses} urlPrefix={urlPrefix} />
      <Hydrate>
        <HomeCards
          studentCourses={studentCourses}
          hasInstructorCourses={instructorCourses.length > 0}
          canAddCourses={canAddCourses}
          csrfToken={csrfToken}
          urlPrefix={urlPrefix}
          isDevMode={isDevMode}
          search={search}
        />
      </Hydrate>
    </div>
  );
}

function DevModeCard({ isDevMode }: { isDevMode: boolean }) {
  if (!isDevMode) return null;

  return (
    <div className="card mb-4" style={{ fontFamily: 'var(--font-persian)' }}>
      <div className="card-header bg-primary text-white">
        <h2>{uiStrings.home.devModeTitle}</h2>
      </div>
      <div className="card-body">
        <p>{uiStrings.home.devModeNotice}</p>
        <p className="mb-0 text-muted">{uiStrings.home.devModeHint}</p>
      </div>
    </div>
  );
}

interface AdminInstitutionsCardProps {
  adminInstitutions: StaffInstitution[];
}

function AdminInstitutionsCard({ adminInstitutions }: AdminInstitutionsCardProps) {
  if (adminInstitutions.length === 0) return null;

  return (
    <div className="card mb-4" style={{ fontFamily: 'var(--font-persian)' }}>
      <div className="card-header bg-primary text-white">
        <h2>{uiStrings.home.adminInstitutionsTitle}</h2>
      </div>
      <ul className="list-group list-group-flush">
        {adminInstitutions.map((institution) => (
          <li key={institution.id} className="list-group-item">
            <a href={`/pl/institution/${institution.id}/admin/courses`}>
              {institution.short_name}: {institution.long_name}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

interface InstructorCoursesCardProps {
  instructorCourses: InstructorHomePageCourse[];
  urlPrefix: string;
}

function InstructorCoursesCard({ instructorCourses, urlPrefix }: InstructorCoursesCardProps) {
  if (instructorCourses.length === 0) return null;

  return (
    <div className="card mb-4" style={{ fontFamily: 'var(--font-persian)' }}>
      <div className="card-header bg-primary text-white d-flex align-items-center">
        <h2>{uiStrings.home.instructorCoursesTitle}</h2>
        <a
          href={`${urlPrefix}/request_course`}
          className="btn btn-light btn-sm ms-auto d-inline-flex align-items-center gap-1 shadow-xs"
        >
          <i className="bi bi-plus-circle" aria-hidden="true" />
          <span className="d-none d-sm-inline">{uiStrings.nav.requestCourse}</span>
        </a>
      </div>

      <div className="table-responsive">
        <table
          className="table table-sm table-hover table-striped"
          aria-label={uiStrings.home.instructorCoursesTitle}
        >
          <tbody>
            {instructorCourses.map((course) => (
              <tr key={course.id}>
                <td className="w-50 align-middle">
                  {course.can_open_course ? (
                    <a href={`${urlPrefix}/course/${course.id}`}>
                      {course.short_name}: {course.title}
                    </a>
                  ) : (
                    `${course.short_name}: ${course.title}`
                  )}
                </td>
                <td className="js-course-instance-list">
                  <CourseInstanceList
                    courseInstances={course.course_instances.filter((ci) => !ci.expired)}
                    urlPrefix={urlPrefix}
                  />
                  {course.course_instances.some((ci) => ci.expired) && (
                    <details>
                      <summary className="text-muted small">{uiStrings.home.pastTerms}</summary>
                      <CourseInstanceList
                        courseInstances={course.course_instances.filter((ci) => ci.expired)}
                        urlPrefix={urlPrefix}
                      />
                    </details>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

interface CourseInstanceListProps {
  courseInstances: InstructorHomePageCourse['course_instances'];
  urlPrefix: string;
}

function CourseInstanceList({ courseInstances, urlPrefix }: CourseInstanceListProps) {
  return (
    <div className="d-flex flex-wrap gap-2 my-1">
      {courseInstances.map((courseInstance) => (
        <a
          key={courseInstance.id}
          className="btn btn-outline-primary btn-sm"
          href={`${urlPrefix}/course_instance/${courseInstance.id}/instructor`}
        >
          {courseInstance.long_name}
        </a>
      ))}
    </div>
  );
}
