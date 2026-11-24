const DOC_LINKS = [
  {
    href: 'https://docs.prairielearn.com/question/overview/',
    label: 'ساختار سوال‌ها چگونه است',
  },
  {
    href: 'https://docs.prairielearn.com/elements/',
    label: 'المان‌های قابل استفاده',
  },
  {
    href: 'https://docs.prairielearn.com/question/template/',
    label: 'نوشتن HTML سوال',
  },
];

export function NewToPrairieLearnCard() {
  return (
    <div className="card bg-light text-start small">
      <div className="card-body py-2 px-3">
        <p className="fw-semibold mb-1">تازه‌کار هستید؟ راهنمای ساخت سوال:</p>
        <ul className="mb-0 ps-3">
          {DOC_LINKS.map((link) => (
            <li key={link.href}>
              <a href={link.href} target="_blank" rel="noopener noreferrer">
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
