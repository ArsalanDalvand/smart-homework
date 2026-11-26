import { useEffect, useState } from 'react';
import { Alert, Button } from 'react-bootstrap';

import type { ConversationState } from '@prairielearn/course-agent-types';
import { formatIntervalMinutes } from '@prairielearn/formatter';

const blockedMessage = {
  usage_limit: "به سقف مصرف ساعتی هوش مصنوعی رسیده‌اید.",
  startup_failed:
    'دستیار درس نتوانست شروع به کار کند. برای پاک‌سازی راه‌اندازی ناقص روی «ادامه» کلیک کنید و سپس پیام جدیدی بفرستید.',
  runtime_failed:
    "دستیار درس متوقف شد. ممکن است تغییراتی اعمال کرده باشد و پاسخش ناقص باشد. برای ادامه روی «ادامه» کلیک کنید؛ پیام قبلی شما دوباره اجرا نخواهد شد.",
  checkpoint_failed:
    "دستیار درس نتوانست متوقف شود. برای تلاش مجدد روی «ادامه» کلیک کنید؛ تغییرات آن همچنان محفوظ است.",
  cleanup_failed: 'دستیار درس متوقف شد، اما پاک‌سازی به پایان نرسید. برای تکمیل پاک‌سازی روی «ادامه» کلیک کنید.',
} satisfies Record<Extract<ConversationState, { status: 'blocked' }>['reason'], string>;

export function BlockedNotice({
  state,
  disabled,
  onResume,
}: {
  state: Extract<ConversationState, { status: 'blocked' }>;
  disabled: boolean;
  onResume: () => void;
}) {
  const [now, setNow] = useState(Date.now);
  const retryAt = state.reason === 'usage_limit' ? state.retryAt : undefined;
  // Derive the countdown from the persisted deadline so refreshes and background tabs stay accurate.
  useEffect(() => {
    if (!retryAt) return;
    const timer = window.setInterval(() => {
      const current = Date.now();
      setNow(current);
      if (current >= Date.parse(retryAt)) window.clearInterval(timer);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [retryAt]);
  const remaining = retryAt ? Math.max(0, Date.parse(retryAt) - now) : 0;
  return (
    <Alert variant="warning">
      <p>
        {retryAt && remaining === 0
          ? 'سقف مصرف ساعتی هوش مصنوعی بازنشانی شد.'
          : blockedMessage[state.reason]}
        {retryAt && remaining > 0 && ` تا ${formatIntervalMinutes(remaining)} دیگر بازنشانی می‌شود.`}
      </p>
      <Button
        variant="outline-dark"
        size="sm"
        disabled={disabled || remaining > 0}
        onClick={onResume}
      >
        ادامه
      </Button>
    </Alert>
  );
}
