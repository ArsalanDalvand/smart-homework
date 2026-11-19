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
  const heading = hasInstructorCourses ? 'درس‌های من (دسترسی دانشجو)' : 'درس‌های من';
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
      <div className="card-header bg-primary text-white d-flex align-items-center">
        <h2>{heading}</h2>
        {canAddCourses && (
          <button
            type="button"
            className="btn btn-light btn-sm ms-auto"
            onClick={() => setShowJoinModal(true)}
          >
            <i className="bi bi-plus-circle me-sm-1" aria-hidden="true" />
            <span className="d-none d-sm-inline">عضویت در درس</span>
          </button>
        )}
      </div>

      {studentCourses.length === 0 ? (
        hasInstructorCourses ? (
          <div className="card-body text-secondary">
            در حال حاضر درسی با نقش دانشجو برای شما ثبت نشده است. درس‌های تحت مدیریت آموزشی شما در جدول بالا قرار دارند.
            {canAddCourses && ' جهت عضویت در درس‌های دیگر با نقش دانشجو، بر روی دکمه «عضویت در درس» کلیک نمایید.'}
          </div>
        ) : isDevMode ? (
          <div className="card-body text-secondary">
            هیچ درسی بارگذاری نشده است. بر روی دکمه <strong>«همگام‌سازی دیسک»</strong> در نوار بالا کلیک کنید.
          </div>
        ) : (
          <div className="card-body text-secondary">
            درسی یافت نشد.
            {canAddCourses && ' جهت افزودن درس، بر روی دکمه «عضویت در درس» کلیک کنید.'}
          </div>
        )
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
                        <span className="ms-2 badge bg-warning text-dark">{uiStrings.home.invitationBadge}</span>
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
        show={rejectInvitationModal.show}
        backdrop="static"
        onHide={rejectInvitationModal.onHide}
        onExited={rejectInvitationModal.onExited}
        style={{ fontFamily: 'var(--font-persian)' }}
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
        show={removeCourseModal.show}
        backdrop="static"
        onHide={removeCourseModal.onHide}
        onExited={removeCourseModal.onExited}
        style={{ fontFamily: 'var(--font-persian)' }}
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
