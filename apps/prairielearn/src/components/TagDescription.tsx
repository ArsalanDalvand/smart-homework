import { type Tag } from '../lib/db-types.js';

export function TagDescription({ tag }: { tag: Tag }) {
  if (!tag.implicit) {
    return tag.description;
  }

  return (
    <span className="text-muted">
      ایجادشده به‌صورت خودکار از طریق استفاده در یک سوال؛ برای سفارشی‌سازی این برچسب را ویرایش کنید
    </span>
  );
}
