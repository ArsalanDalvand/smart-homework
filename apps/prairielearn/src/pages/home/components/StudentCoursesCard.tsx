import { Modal } from 'react-bootstrap';

import { useModalState } from '@prairielearn/ui';

import { uiStrings } from '../../../lib/branding.js';
import type { StudentHomePageCourse } from '../home.types.js';

export function StudentCoursesCard({
  studentCourses,
  hasInstructorCourses,
  canAddCourses,
  csrfToken,
  urlPrefix,
  isDevMode,
  setShowJoinModal,
}: {
  studentCourses: StudentHomePageCourse[];
  hasInstructorCourses: boolean;
  canAddCourses: boolean;
  csrfToken: string;
  urlPrefix: string;
  isDevMode: boolean;
  setShowJoinModal: (value: boolean) => void;
}) {
  const heading = hasInstructorCourses
    ? uiStrings.home.studentCoursesTitle
    : uiStrings.home.studentCoursesTitleSimple;
  const rejectInvitationModal = useModalState<{
    courseInstanceId: string;
    enrollmentId: string;
  }>();
  const removeCourseModal = useModalState<{
    courseInstanceId: string;
    invitationEnrollmentId?: string;
  }>();

  const uidInvitations = studentCourses.filter(
    (course): course is StudentHomePageCourse & { access_type: 'uid_invitation' } =>
      course.access_type === 'uid_invitation',
  );
  const accessibleCourses = studentCourses.filter(
    (course) => course.access_type === 'institution_access' || course.access_type === 'joined',
  );

  return (
    <div className="card mb-4">
      <div className="card-header bg-primary text-white sh-hero-header d-flex align-items-center">
        <h2>{heading}</h2>
        {canAddCourses && (
          <button
            type="button"
            aria-label={uiStrings.home.joinCourseBtn}
            className="btn btn-light btn-sm ms-auto"
            onClick={() => setShowJoinModal(true)}
          >
            <i className="bi bi-plus-circle me-1" aria-hidden="true" />
            <span>{uiStrings.home.joinCourseBtn}</span>
          </button>
        )}
      </div>

      {studentCourses.length === 0 ? (
        hasInstructorCourses ? (
          <div className="card-body text-secondary">
            {uiStrings.home.noStudentCoursesWithInstructor}
            {canAddCourses && ` ${uiStrings.home.joinCourseHint}`}
          </div>
        ) : isDevMode ? (
          <div className="card-body text-secondary">{uiStrings.home.noCoursesDevMode}</div>
        ) : (
          <div className="card-body text-secondary">{uiStrings.home.noCoursesGeneral}</div>
        )
      ) : !hasInstructorCourses ? (
        <div className="card-body">
          {uidInvitations.length > 0 && (
            <div className="d-flex flex-column gap-2 mb-3">
              {uidInvitations.map((entry) => (
                <div
                  key={`invite-${entry.course_instance.id}`}
                  className="sh-course-invite d-flex flex-wrap align-items-center justify-content-between gap-2 p-3 border rounded"
                >
                  <div>
                    <span className="fw-semibold text-body">
                      {entry.course.short_name}: {entry.course.title}،{' '}
                      {entry.course_instance.long_name}
                    </span>
                    <span className="ms-2 badge bg-warning-subtle text-warning-emphasis border border-warning-subtle">
                      {uiStrings.home.invitationBadge}
                    </span>
                  </div>
                  <div className="d-flex gap-2">
                    <form method="POST">
                      <input type="hidden" name="__action" value="accept_invitation" />
                      <input type="hidden" name="__csrf_token" value={csrfToken} />
                      <input
                        type="hidden"
                        name="enrollment_id"
                        value={entry.invitation_enrollment_id}
                      />
                      <input
                        type="hidden"
                        name="course_instance_id"
                        value={entry.course_instance.id}
                      />
                      <button type="submit" className="btn btn-primary btn-sm">
                        {uiStrings.home.acceptInvitation}
                      </button>
                    </form>
                    <button
                      type="button"
                      className="btn btn-outline-danger btn-sm"
                      onClick={() =>
                        rejectInvitationModal.showWithData({
                          courseInstanceId: entry.course_instance.id,
                          enrollmentId: entry.invitation_enrollment_id,
                        })
                      }
                    >
                      {uiStrings.home.rejectInvitation}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="sh-course-grid">
            {accessibleCourses.map((entry) => (
              <div key={entry.course_instance.id} className="sh-course-card">
                <div className="d-flex align-items-start justify-content-between gap-2">
                  <span className="sh-course-code" dir="ltr">
                    {entry.course.short_name}
                  </span>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm p-1"
                    aria-label={`${uiStrings.home.removeCourse} ${entry.course.title}`}
                    title={uiStrings.home.removeCourse}
                    onClick={() =>
                      removeCourseModal.showWithData({
                        courseInstanceId: entry.course_instance.id,
                        ...(entry.access_type === 'institution_access'
                          ? { invitationEnrollmentId: entry.invitation_enrollment_id }
                          : {}),
                      })
                    }
                  >
                    <i className="bi bi-x-lg" aria-hidden="true" />
                  </button>
                </div>
                <div className="mt-2 mb-3">
                  <a
                    href={`${urlPrefix}/course_instance/${entry.course_instance.id}`}
                    className="sh-course-title stretched-link"
                  >
                    {entry.course.title}
                  </a>
                  <div className="sh-course-term">{entry.course_instance.long_name}</div>
                </div>
                <div className="mt-auto pt-2 border-top d-flex align-items-center justify-content-between small text-body-secondary">
                  <span>مشاهده تکالیف و کارنامه</span>
                  <i className="bi bi-arrow-left" aria-hidden="true" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table table-sm table-hover table-striped" aria-label={heading}>
            <tbody>
              {uidInvitations.map((entry) => (
                <tr key={`invite-${entry.course_instance.id}`} className="table-warning">
                  <td className="align-middle">
                    <div className="d-flex align-items-center justify-content-between gap-2">
                      <div>
                        <span className="fw-semibold">
                          {entry.course.short_name}: {entry.course.title},{' '}
                          {entry.course_instance.long_name}
                        </span>
                        <span className="ms-2 badge bg-warning text-dark">
                          {uiStrings.home.invitationBadge}
                        </span>
                      </div>
                      <div className="d-flex gap-2">
                        <form method="POST">
                          <input type="hidden" name="__action" value="accept_invitation" />
                          <input type="hidden" name="__csrf_token" value={csrfToken} />
                          <input
                            type="hidden"
                            name="enrollment_id"
                            value={entry.invitation_enrollment_id}
                          />
                          <input
                            type="hidden"
                            name="course_instance_id"
                            value={entry.course_instance.id}
                          />
                          <button type="submit" className="btn btn-primary btn-sm">
                            {uiStrings.home.acceptInvitation}
                          </button>
                        </form>
                        <button
                          type="button"
                          className="btn btn-danger btn-sm"
                          onClick={() =>
                            rejectInvitationModal.showWithData({
                              courseInstanceId: entry.course_instance.id,
                              enrollmentId: entry.invitation_enrollment_id,
                            })
                          }
                        >
                          {uiStrings.home.rejectInvitation}
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
              {accessibleCourses.map((entry) => (
                <tr key={entry.course_instance.id}>
                  <td className="align-middle">
                    <div className="d-flex align-items-center justify-content-between gap-2">
                      <a href={`${urlPrefix}/course_instance/${entry.course_instance.id}`}>
                        {entry.course.short_name}: {entry.course.title},{' '}
                        {entry.course_instance.long_name}
                      </a>
                      <button
                        type="button"
                        className="btn btn-danger btn-sm"
                        onClick={() =>
                          removeCourseModal.showWithData({
                            courseInstanceId: entry.course_instance.id,
                            ...(entry.access_type === 'institution_access'
                              ? { invitationEnrollmentId: entry.invitation_enrollment_id }
                              : {}),
                          })
                        }
                      >
                        {uiStrings.home.removeCourse}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        backdrop="static"
        show={rejectInvitationModal.show}
        style={{ fontFamily: 'var(--font-persian)' }}
        onExited={rejectInvitationModal.onExited}
        onHide={rejectInvitationModal.onHide}
      >
        <Modal.Header closeButton>
          <Modal.Title>{uiStrings.home.rejectModalTitle}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>{uiStrings.home.rejectModalDesc}</p>
        </Modal.Body>
        <Modal.Footer>
          <button type="button" className="btn btn-secondary" onClick={rejectInvitationModal.hide}>
            {uiStrings.common.cancel}
          </button>
          <form method="POST">
            <input type="hidden" name="__csrf_token" value={csrfToken} />
            <input type="hidden" name="__action" value="reject_invitation" />
            <input
              type="hidden"
              name="course_instance_id"
              value={rejectInvitationModal.data?.courseInstanceId ?? ''}
            />
            <input
              type="hidden"
              name="enrollment_id"
              value={rejectInvitationModal.data?.enrollmentId ?? ''}
            />
            <button type="submit" className="btn btn-danger">
              {uiStrings.home.rejectModalConfirm}
            </button>
          </form>
        </Modal.Footer>
      </Modal>

      <Modal
        backdrop="static"
        show={removeCourseModal.show}
        style={{ fontFamily: 'var(--font-persian)' }}
        onExited={removeCourseModal.onExited}
        onHide={removeCourseModal.onHide}
      >
        <Modal.Header closeButton>
          <Modal.Title>{uiStrings.home.removeModalTitle}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>{uiStrings.home.removeModalDesc}</p>
          <p className="text-muted">{uiStrings.home.removeModalNotice}</p>
          {removeCourseModal.data?.invitationEnrollmentId !== undefined && (
            <p className="small text-info">{uiStrings.home.removeModalReappear}</p>
          )}
        </Modal.Body>
        <Modal.Footer>
          <button type="button" className="btn btn-secondary" onClick={removeCourseModal.hide}>
            {uiStrings.common.cancel}
          </button>
          <form method="POST">
            <input type="hidden" name="__csrf_token" value={csrfToken} />
            <input
              type="hidden"
              name="__action"
              value={
                removeCourseModal.data?.invitationEnrollmentId === undefined
                  ? 'unenroll'
                  : 'remove_institution_access'
              }
            />
            <input
              type="hidden"
              name="course_instance_id"
              value={removeCourseModal.data?.courseInstanceId ?? ''}
            />
            {removeCourseModal.data?.invitationEnrollmentId !== undefined && (
              <input
                type="hidden"
                name="enrollment_id"
                value={removeCourseModal.data.invitationEnrollmentId}
              />
            )}
            <button type="submit" className="btn btn-danger">
              {uiStrings.home.removeModalConfirm}
            </button>
          </form>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

StudentCoursesCard.displayName = 'StudentCoursesCard';
