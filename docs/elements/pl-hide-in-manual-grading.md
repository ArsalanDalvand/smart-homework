# المان `pl-hide-in-manual-grading`

محتوا را پنهان می‌کند به طوری که در صفحه نمره‌دهی دستی یا در فرآیند نمره‌دهی هوش مصنوعی برای مصححان نمایش داده **نمی‌شود**.

## نمونه المان

```html
<pl-hide-in-manual-grading>
  This text will be shown to students, but not to graders.
</pl-hide-in-manual-grading>
```

## جزئیات

این المان معمولاً برای مختصر کردن توضیحات سوال و فراهم ساختن امکان تمرکز مصححان بر پاسخ‌های واقعی در طول نمره‌دهی استفاده می‌شود. همچنین می‌تواند برای ارائه دستورالعمل‌هایی به کار رود که برای دانشجویان مفید است اما نیازی به مشاهده آن‌ها توسط مصححان نیست، مواردی همچون دستورالعمل‌های تست، راهنمایی‌ها، نمونه‌های اجرا و اطلاعات مشابه. این المان عملکرد معکوس [المان `pl-manual-grading-only`](pl-manual-grading-only.md) را دارد که محتوا را صریحاً فقط هنگام نمره‌دهی نمایش می‌دهد.

## پیاده‌سازی‌های نمونه

- [demo/manualGrade/codeUpload]

## همچنین ببینید

- [`pl-manual-grading-only` برای نمایش محتوا فقط در هنگام نمره‌دهی دستی.](pl-manual-grading-only.md)
- [`pl-question-panel` برای نمایش صورت سوال.](pl-question-panel.md)
- [`pl-submission-panel` برای تغییر نحوه نمایش پاسخ ارسال‌شده.](pl-submission-panel.md)
- [`pl-answer-panel` برای نمایش پاسخ و راه‌حل سوال.](pl-answer-panel.md)
- [`pl-hide-in-panel` برای پنهان کردن محتوا در یک یا چند پنل نمایشی.](pl-hide-in-panel.md)

---

[demo/manualgrade/codeupload]: https://github.com/PrairieLearn/PrairieLearn/tree/master/exampleCourse/questions/demo/manualGrade/codeUpload
