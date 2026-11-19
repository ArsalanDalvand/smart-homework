# المان `pl-submission-panel`

نحوه نمایش اطلاعات واردشده توسط کاربر قبل از نمره‌دهی را سفارشی‌سازی می‌کند.

## نمونه المان

```html title="question.html"
<pl-submission-panel>این محتوا فقط در پنل پاسخ ارسالی نمایش داده می‌شود.</pl-submission-panel>
```

## جزئیات

به طور کلی، محتویات فایل `question.html` در پنل سوال (question panel)، پنل پاسخ ارسالی (submission panel) و پنل پاسخ صحیح (answer panel) نمایش داده می‌شوند. برای جلوگیری از نمایش محتوا در پنل سوال و پنل پاسخ صحیح (به طوری که فقط در پنل پاسخ ارسالی نمایش داده شود)، آن محتوا را درون تگ‌های `<pl-submission-panel>` قرار دهید.

پنل پاسخ ارسالی تنها پس از ارسال پاسخ توسط دانشجو نمایش داده می‌شود. این پاسخ ممکن است درست، نادرست یا نامعتبر باشد.

## پیاده‌سازی‌های نمونه

- [demo/custom/gradeFunction]
- [demo/autograder/codeUpload]
- [demo/autograder/codeEditor]

## همچنین ببینید

- [`pl-question-panel` برای نمایش صورت و دستورالعمل سوال.](pl-question-panel.md)
- [`pl-answer-panel` برای نمایش راه‌حل و پاسخ صحیح سوال.](pl-answer-panel.md)
- [`pl-hide-in-panel` برای مخفی کردن محتوا در یک یا چند پنل نمایش.](pl-hide-in-panel.md)
- [`pl-external-grader-results` برای نمایش نتایج سوالات برنامه‌نویسی نمره‌دهی‌شده به صورت خارجی.](pl-external-grader-results.md)

---

## المان‌های منسوخ‌شده

!!! note "یادداشت"

    المان‌های پریری‌لرن زیر **منسوخ (deprecated)** شده‌اند. این المان‌ها همچنان برای سازگاری با نسخه‌های قبلی پشتیبانی می‌شوند، اما نباید در سوالات جدید استفاده شوند.

[demo/autograder/codeeditor]: https://github.com/PrairieLearn/PrairieLearn/tree/master/exampleCourse/questions/demo/autograder/codeEditor
[demo/autograder/codeupload]: https://github.com/PrairieLearn/PrairieLearn/tree/master/exampleCourse/questions/demo/autograder/codeUpload
[demo/custom/gradefunction]: https://github.com/PrairieLearn/PrairieLearn/tree/master/exampleCourse/questions/demo/custom/gradeFunction
