import { assetPath } from '../lib/assets.js';

export function PageFooter() {
  return (
    <footer className="footer py-3 bg-light border-top mt-auto" style={{ fontFamily: 'var(--font-persian)' }}>
      <div className="container">
        <div className="row align-items-center">
          <div className="col-md-7 col-12 mb-2 mb-md-0 d-flex align-items-center gap-3">
            <a
              href="/"
              className="text-decoration-none d-flex align-items-center gap-2 text-dark"
              aria-label="IUST Home"
            >
              <img
                src={assetPath('images/iust-logo.svg')}
                alt="دانشگاه علم و صنعت ایران"
                style={{ height: '36px', width: 'auto' }}
              />
              <div className="d-flex flex-column text-start">
                <span className="fw-bold" style={{ fontSize: '0.95rem', color: '#0f2b48' }}>
                  دانشگاه علم و صنعت ایران
                </span>
                <span className="text-muted" style={{ fontSize: '0.8rem' }}>
                  دانشکده مهندسی کامپیوتر &bull; سامانه آموزش و سنجش پایتون
                </span>
              </div>
            </a>
          </div>
          <div className="col-md-5 col-12 d-flex flex-wrap align-items-center justify-content-md-end gap-3">
            <a
              href="https://github.com/ArsalanDalvand/PrairieLearn"
              className="text-decoration-none text-secondary d-flex align-items-center gap-1"
              aria-label="GitHub"
              target="_blank"
              rel="noreferrer"
              style={{ fontSize: '0.85rem' }}
            >
              <i className="fab fa-github" aria-hidden="true" />
              <span>مخزن درس</span>
            </a>
            <a
              href="https://t.me/iust_bp_fall2026"
              className="text-decoration-none text-secondary d-flex align-items-center gap-1"
              aria-label="Telegram"
              target="_blank"
              rel="noreferrer"
              style={{ fontSize: '0.85rem' }}
            >
              <i className="fab fa-telegram" aria-hidden="true" />
              <span>کانال حل تمرین</span>
            </a>
            <span className="text-muted small">
              &copy; ۱۴۰۵ تمامی حقوق محفوظ است
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
