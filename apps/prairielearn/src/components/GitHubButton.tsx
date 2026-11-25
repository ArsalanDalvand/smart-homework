import clsx from 'clsx';

export function GitHubButton({
  gitHubLink,
  variant = 'light',
}: {
  gitHubLink: string | null;
  variant?: 'light' | 'outline-secondary';
}) {
  if (!gitHubLink) return null;
  return (
    <a
      className={clsx('btn btn-sm d-inline-flex align-items-center gap-2', `btn-${variant}`)}
      target="_blank"
      rel="noreferrer"
      aria-label="مشاهده در گیت‌هاب"
      href={gitHubLink}
    >
      <i className="bi bi-github" />
      <span className="d-none d-sm-inline">مشاهده در گیت‌هاب</span>
    </a>
  );
}
