import { platformBranding } from '../lib/branding.js';

export function PageFooter() {
  return (
    <footer
      className="footer sh-footer py-3 border-top mt-auto"
      style={{ fontFamily: 'var(--font-persian)' }}
    >
      <div className="container">
        <div className="row align-items-center">
          <div className="col-md-6 col-12 mb-2 mb-md-0 d-flex align-items-center gap-3">
            <a
              href="/"
              className="text-decoration-none d-flex align-items-center gap-2 text-body"
              aria-label={platformBranding.brandShortName}
            >
              <i className="fas fa-graduation-cap text-body fs-3" aria-hidden="true" />
              <div className="d-flex flex-column text-start">
                <span className="fw-bold sh-footer-brand" style={{ fontSize: '0.95rem' }}>
                  {platformBranding.brandTitle}
                </span>
                <span className="text-body-secondary" style={{ fontSize: '0.8rem' }}>
                  {platformBranding.brandSubtitle}
                </span>
              </div>
            </a>
          </div>
          <div className="col-md-6 col-12 d-flex flex-wrap align-items-center justify-content-md-end gap-3">
            <a
              href={platformBranding.docsUrl}
              className="text-decoration-none text-body-secondary d-flex align-items-center gap-1"
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
              className="text-decoration-none text-body-secondary d-flex align-items-center gap-1"
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
              className="text-decoration-none text-body-secondary d-flex align-items-center gap-1"
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
          <div
            className="col-12 d-flex flex-wrap align-items-center justify-content-between text-body-secondary small"
            style={{ fontSize: '0.78rem' }}
          >
            <span>
              توسعه و نگه‌داری:{' '}
              <a
                href={platformBranding.developer.telegramUrl}
                target="_blank"
                rel="noreferrer"
                className="text-body-secondary text-decoration-none fw-medium"
                title={`${platformBranding.developer.name} (${platformBranding.developer.email})`}
              >
                {platformBranding.developer.name}
              </a>{' '}
              ({platformBranding.developer.affiliation})
            </span>
            <span>
              بر پایه پلتفرم آزاد{' '}
              <bdi dir="ltr">
                <a
                  href="https://www.prairielearn.com"
                  target="_blank"
                  rel="noreferrer"
                  className="text-body-secondary text-decoration-none"
                >
                  PrairieLearn
                </a>{' '}
                &copy; PrairieLearn, Inc.
              </bdi>{' '}
              و هیئت امنای دانشگاه ایلینوی (<bdi dir="ltr">UIUC</bdi>) تحت پروانه{' '}
              <bdi dir="ltr">
                <a
                  href={platformBranding.licenseUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-body-secondary text-decoration-none"
                >
                  {platformBranding.licenseName}
                </a>
              </bdi>
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
