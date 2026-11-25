import { Button, Form } from 'react-bootstrap';

import { OverlayTrigger } from '@prairielearn/ui';

import { type CalculatorType, CalculatorTypeSchema } from '../schemas/infoAssessment.js';

const presets = {
  basic: {
    label: 'پایه',
    description: 'عملیات حسابی، کسرها، درصدها و پاسخ قبلی.',
  },
  scientific: {
    label: 'مهندسی',
    description: 'عملیات پایه به‌همراه توان، ریشه، لگاریتم، مثلثات و ثابت‌ها.',
  },
  advanced: {
    label: 'پیشرفته',
    description: 'ماشین‌حساب بدون محدودیت، شامل پنل‌های حروف و توابع.',
  },
};

export function CalculatorTypeInput({
  id,
  value,
  disabled,
  onChange,
}: {
  id: string;
  value: CalculatorType;
  disabled: boolean;
  onChange: (value: CalculatorType) => void;
}) {
  return (
    <fieldset className="mt-3 ms-4" aria-label="نوع ماشین‌حساب">
      {CalculatorTypeSchema.options.map((type) => (
        <div key={type} className="mb-2">
          <div className="d-flex align-items-center gap-2">
            <Form.Check
              type="radio"
              name={id}
              id={`${id}-${type}`}
              label={presets[type].label}
              aria-describedby={`${id}-${type}-help`}
              checked={value === type}
              disabled={disabled}
              onChange={() => onChange(type)}
            />
            {type === 'advanced' && (
              <OverlayTrigger
                trigger="click"
                placement="auto"
                popover={{
                  header: 'ماشین‌حساب پیشرفته',
                  body: 'دانشجویان می‌توانند انتگرال و مشتق را محاسبه کرده و متغیرها و توابع تعریف کنند. اگر این قابلیت‌ها برای تکلیف/آزمون شما مناسب نیست، گزینه پایه یا مهندسی را انتخاب کنید.',
                  props: { id: `${id}-advanced-info` },
                }}
                rootClose
              >
                <Button
                  variant="link"
                  size="sm"
                  className="p-0"
                  aria-label="درباره ماشین‌حساب پیشرفته"
                >
                  <i className="bi bi-info-circle" aria-hidden="true" />
                </Button>
              </OverlayTrigger>
            )}
          </div>
          <Form.Text id={`${id}-${type}-help`} className="d-block ms-4 mt-0">
            {presets[type].description}
          </Form.Text>
        </div>
      ))}
    </fieldset>
  );
}
