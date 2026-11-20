import { assetPath } from '../lib/assets.js';
import { platformBranding } from '../lib/branding.js';

export function PageFooter() {
  return (
    <footer className="footer py-3 bg-light border-top mt-auto" style={{ fontFamily: 'var(--font-persian)' }}>
      <div className="container">
        <div className="row align-items-center">
          <div className="col-md-6 col-12 mb-2 mb-md-0 d-flex align-items-center gap-3">
            <a
              href="/"
              className="text-decoration-none d-flex align-items-center gap-2 text-dark"
              aria-label={platformBranding.brandShortName}
            >
              <i className="fas fa-graduation-cap text-primary fs-3" aria-hidden="true" />
              <div className="d-flex flex-column text-start">
                <span className="fw-bold" style={{ fontSize: '0.95rem', color: '#0f2b48' }}>
                  {platformBranding.brandTitle}
                </span>
                <span className="text-muted" style={{ fontSize: '0.8rem' }}>
                  {platformBranding.brandSubtitle}
                </span>
              </div>
            </a>
          </div>
          <div className="col-md-6 col-12 d-flex flex-wrap align-items-center justify-content-md-end gap-3">
            <a
              href={platformBranding.docsUrl}
              className="text-decoration-none text-secondary d-flex align-items-center gap-1"
              aria-label="مستندات سامانه"
              target="_blank"
              rel="noreferrer"
              style={{ fontSize: '0.85rem' }}
            >
              <i className="fas fa-book" aria-hidden="true" />
              <span>مستندات و راهنما</span>
            </a>
            <a
              href={platformBranding.repoUrl}
              className="text-decoration-none text-secondary d-flex align-items-center gap-1"
              aria-label="GitHub"
              target="_blank"
              rel="noreferrer"
              style={{ fontSize: '0.85rem' }}
            >
              <i className="fab fa-github" aria-hidden="true" />
              <span>مخزن گیت‌هاب</span>
            </a>
            <a
              href={platformBranding.licenseUrl}
              className="text-decoration-none text-secondary d-flex align-items-center gap-1"
              aria-label="مجوز نرم‌افزار"
              target="_blank"
              rel="noreferrer"
              style={{ fontSize: '0.85rem' }}
            >
              <i className="fas fa-balance-scale" aria-hidden="true" />
              <span>مجوز {platformBranding.licenseName}</span>
            </a>
          </div>
        </div>
        <div className="row mt-2 pt-2 border-top">
          <div className="col-12 d-flex flex-wrap align-items-center justify-content-between text-muted small" style={{ fontSize: '0.78rem' }}>
            <span>
              توسعه و نگه‌داری: {' '}
              <a
                href={platformBranding.developer.telegramUrl}
                target="_blank"
                rel="noreferrer"
                className="text-secondary text-decoration-none fw-medium"
                title={`${platformBranding.developer.name} (${platformBranding.developer.email})`}
              >
                {platformBranding.developer.name}
              </a>{' '}
              ({platformBranding.developer.affiliation})
            </span>
            <span>
              بر پایه پلتفرم آزاد <a href="https://www.prairielearn.com" target="_blank" rel="noreferrer" className="text-secondary text-decoration-none">PrairieLearn</a> &copy; PrairieLearn, Inc. &amp; هیئت امنای دانشگاه ایلینوی (UIUC) تحت پروانه <a href={platformBranding.licenseUrl} target="_blank" rel="noreferrer" className="text-secondary text-decoration-none">{platformBranding.licenseName}</a>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
