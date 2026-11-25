import { type Topic } from '../lib/db-types.js';

export function TopicDescription({ topic }: { topic: Topic }) {
  if (!topic.implicit) {
    return <>{topic.description}</>;
  }

  return (
    <span className="text-muted">
      ایجادشده به‌صورت خودکار از طریق استفاده در یک سوال؛ برای سفارشی‌سازی این مبحث را ویرایش کنید
    </span>
  );
}
