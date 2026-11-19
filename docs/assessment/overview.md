# ارزیابی‌ها (Assessments)

ارزیابی‌ها مجموعه‌ای از سوالات هستند که به دانشجویان ارائه می‌شوند. از آن‌ها می‌توان برای ایجاد تکالیف و آزمون‌ها استفاده کرد.

هر ارزیابی یک دایرکتوری مجزا در پوشه `assessments` یا هر یک از زیرپوشه‌های آن است. ارزیابی‌ها می‌توانند در زیردایرکتوری‌های پوشه `assessments` به‌صورت تو در تو قرار گیرند. دایرکتوری ارزیابی باید شامل یک فایل منفرد به نام `infoAssessment.json` باشد که ارزیابی را توصیف می‌کند و به شکل زیر است:

```json title="infoAssessment.json"
{
  "uuid": "cef0cbf3-6458-4f13-a418-ee4d7e7505dd",
  "type": "Exam",
  "title": "Coordinates and Vectors",
  "set": "Quiz",
  "module": "Linear algebra review",
  "number": "2",
  "accessControl": [],
  "zones": [],
  "comment": "You can add comments to JSON files using this property."
}
```

شناسه ارزیابی (Assessment ID) همان مسیر کامل نسبت به پوشه `assessments` است.

ایجاد یک ارزیابی در دو بخش مجزا انجام می‌شود:

1. [پیکربندی سوالات، نمره‌دهی و سایر تنظیمات اختصاصی ارزیابی](configuration.md)
2. [پیکربندی کنترل دسترسی ارزیابی (مهلت‌های تحویل، نمره و غیره)](accessControl.md)
