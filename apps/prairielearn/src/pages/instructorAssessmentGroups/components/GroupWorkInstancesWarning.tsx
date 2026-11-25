import { Alert } from 'react-bootstrap';

import { getAssessmentStudentsUrl } from '../../../lib/client/url.js';

export function GroupWorkInstancesWarning({
  action,
  courseInstanceId,
  assessmentId,
  className,
}: {
  action: 'enabling' | 'disabling';
  courseInstanceId: string;
  assessmentId: string;
  className?: string;
}) {
  const subject = action === 'enabling' ? 'برخی دانشجویان' : 'برخی گروه‌ها';
  const instanceKind = action === 'enabling' ? 'فردی' : 'گروهی';
  const actionText = action === 'enabling' ? 'فعال‌سازی' : 'غیرفعال‌سازی';
  const assessmentStudentsUrl = getAssessmentStudentsUrl({ courseInstanceId, assessmentId });
  return (
    <Alert variant="warning" className={className}>
      {subject} قبلاً این ارزیابی را شروع کرده‌اند. پیش از {actionText} کار گروهی، همه نمونه‌های{' '}
      {instanceKind} این ارزیابی را از <Alert.Link href={assessmentStudentsUrl}>بخش دانشجویان</Alert.Link>{' '}
      حذف کنید.
    </Alert>
  );
}
