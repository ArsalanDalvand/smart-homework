import { platformBranding, uiStrings } from '../../../lib/branding.js';

export function EmptyStateCards({
  urlPrefix,
  setShowJoinModal,
}: {
  urlPrefix: string;
  setShowJoinModal: (value: boolean) => void;
}) {
  return (
    <div className="row" style={{ fontFamily: 'var(--font-persian)' }}>
      <div className="col-lg-6 mb-4">
        <div className="card h-100">
          <div className="card-body text-center d-flex flex-column">
            <div className="mb-3">
              <i className="bi bi-person-badge text-primary" style={{ fontSize: '3rem' }} />
            </div>
            <h3 className="card-title mb-3">{uiStrings.emptyState.studentTitle}</h3>
            <p className="card-text mb-4">{uiStrings.emptyState.studentDesc}</p>
            <div className="mt-auto">
              <button
                type="button"
                className="btn btn-primary w-100 d-flex gap-2 justify-content-center"
                onClick={() => setShowJoinModal(true)}
              >
                <i className="bi bi-plus-circle" />
                {uiStrings.home.joinCourseBtn}
              </button>
            </div>
          </div>
        </div>
      </div>
      <div className="col-lg-6 mb-4">
        <div className="card h-100">
          <div className="card-body text-center d-flex flex-column">
            <div className="mb-3">
              <i className="bi bi-mortarboard text-primary" style={{ fontSize: '3rem' }} />
            </div>
            <h3 className="card-title mb-3">{uiStrings.emptyState.instructorTitle}</h3>
            <p className="card-text mb-4">{uiStrings.emptyState.instructorDesc}</p>
            <div className="mt-auto">
              <div className="d-flex flex-wrap gap-2">
                <a
                  href={`${urlPrefix}/request_course`}
                  className="btn btn-primary flex-fill d-flex gap-2 justify-content-center"
                >
                  <i className="bi bi-book" />
                  {uiStrings.nav.requestCourse}
                </a>
                <a
                  href={platformBranding.repoUrl}
                  className="btn btn-outline-primary flex-fill d-flex gap-2 justify-content-center"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <i className="fab fa-github" aria-hidden="true" />
                  {uiStrings.home.githubRepoBtn}
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

EmptyStateCards.displayName = 'EmptyStateCards';
