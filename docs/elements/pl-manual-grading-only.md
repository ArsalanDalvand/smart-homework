# المان `pl-manual-grading-only`

محتوا را پنهان می‌کند به طوری که **فقط** برای مصححان در صفحه نمره‌دهی دستی، یا برای نمره‌دهی با هوش مصنوعی (AI grading) نمایش داده شود.

## المان نمونه

```html title="question.html"
<pl-manual-grading-only>
  این متن به مصححان نمایش داده می‌شود، اما به دانشجویان نشان داده نخواهد شد.
</pl-manual-grading-only>
```

## جزئیات

این المان معمولاً برای ارائه اطلاعات اضافی به مصححان دوره آموزشی یا فرآیند نمره‌دهی هوش مصنوعی استفاده می‌شود؛ اطلاعاتی که نباید به دانشجویان نمایش داده شوند. نمونه‌های کاربردی شامل دستورالعمل‌های نمره‌دهی، نمونه پاسخ‌ها، مقادیر قابل‌قبول برای نتایج مجزا، پارامترهای تصادفی استفاده‌شده در تولید سوال، یا مقادیر از پیش محاسبه‌شده در توابع صریح `parse` است. این المان عملکرد معکوس [المان `pl-hide-in-manual-grading`](pl-hide-in-manual-grading.md) دارد که صراحتاً محتوا را هنگام نمره‌دهی پنهان می‌کند. توجه داشته باشید که در نمره‌دهی هوش مصنوعی، محتوا تنها در پانل سوال (question panel) و پانل پاسخ صحیح (answer panel) نمایش داده می‌شود، نه در پانل پاسخ ارسالی (submission panel).

## نمونه‌های پیاده‌سازی

- [demo/manualGrade/codeUpload]

## همچنین ببینید

- [`pl-hide-in-manual-grading` برای پنهان کردن محتوا حین نمره‌دهی دستی.](pl-hide-in-manual-grading.md)
- [`pl-question-panel` برای نمایش صورت سوال.](pl-question-panel.md)
- [`pl-submission-panel` برای تغییر نحوه نمایش پاسخ ارسالی.](pl-submission-panel.md)
- [`pl-answer-panel` برای نمایش راه‌حل و پاسخ سوال.](pl-answer-panel.md)
- [`pl-hide-in-panel` برای پنهان کردن محتوا در یک یا چند پانل نمایش.](pl-hide-in-panel.md)

---

[demo/manualgrade/codeupload]: https://github.com/PrairieLearn/PrairieLearn/tree/master/exampleCourse/questions/demo/manualGrade/codeUpload
