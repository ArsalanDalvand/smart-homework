import { Button, Form } from 'react-bootstrap';
import { useFormContext } from 'react-hook-form';

import { OverlayTrigger } from '@prairielearn/ui';

import { useAccessControlRuleEditable } from './AccessControlEditabilityContext.js';
import { DefaultAfterCompleteForm } from './AfterCompleteForm.js';
import { DefaultDateControlForm } from './DateControlForm.js';
import { IntegrationsSection } from './IntegrationsSection.js';
import { type AccessControlFormData } from './types.js';

const beforeReleasePopoverConfig = {
  header: '«پیش از انتشار» به چه معناست؟',
  body: (
    <ul className="mb-0">
      <li>اگر کنترل تاریخ فعال باشد، این بازه پیش از تاریخ انتشار است.</li>
      <li>اگر PrairieTest فعال باشد، این بازه پیش از بسته شدن امتحان است.</li>
      <li>اگر هیچ‌کدام فعال نباشند و این گزینه تیک خورده باشد، ارزیابی همیشه نمایش داده می‌شود.</li>
    </ul>
  ),
  props: { id: 'before-release-info-popover' },
};

export function DefaultRuleForm({
  displayTimezone,
  isExam,
  hasExamAutoClose,
}: {
  displayTimezone: string;
  isExam: boolean;
  hasExamAutoClose: boolean;
}) {
  const ruleEditable = useAccessControlRuleEditable();
  const { register } = useFormContext<AccessControlFormData>();

  return (
    <div className="d-flex flex-column gap-3">
      <DefaultDateControlForm displayTimezone={displayTimezone} isExam={isExam} />
      <IntegrationsSection />
      <div>
        <div className="d-flex align-items-center section-header mb-3">
          <strong>پیش از انتشار</strong>
          <OverlayTrigger trigger="click" placement="auto" popover={beforeReleasePopoverConfig}>
            <Button
              variant="link"
              size="sm"
              className="ms-2 p-0"
              aria-label="«پیش از انتشار» به چه معناست؟"
            >
              <i className="bi bi-info-circle" aria-hidden="true" />
            </Button>
          </OverlayTrigger>
        </div>
        <Form.Check
          type="checkbox"
          id="defaultRule-before-release-listed"
          label={<strong>نمایش در فهرست پیش از انتشار</strong>}
          disabled={!ruleEditable}
          {...register('defaultRule.beforeReleaseListed')}
          aria-describedby="defaultRule-before-release-listed-help"
        />
        <Form.Text id="defaultRule-before-release-listed-help" className="text-muted">
          دانشجویان می‌توانند عنوان ارزیابی را پیش از انتشار مشاهده کنند
        </Form.Text>
      </div>
      <DefaultAfterCompleteForm
        displayTimezone={displayTimezone}
        isExam={isExam}
        hasExamAutoClose={hasExamAutoClose}
      />
    </div>
  );
}
