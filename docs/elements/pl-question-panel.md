# المان `pl-question-panel`

محتوای دستورالعمل‌ها و صورت سوال را نمایش می‌دهد.

## نمونه المان

```html title="question.html"
<pl-question-panel>این محتوا فقط در پنل سوال نمایش داده می‌شود.</pl-question-panel>
```

## جزئیات

به طور کلی، محتویات فایل `question.html` در پنل سوال (question panel)، پنل پاسخ ارسالی (submission panel) و پنل پاسخ صحیح (answer panel) نمایش داده می‌شوند. برای جلوگیری از نمایش محتوا در پنل پاسخ ارسالی و پنل پاسخ صحیح (به طوری که فقط در پنل سوال نمایش داده شود)، آن محتوا را درون تگ‌های `<pl-question-panel>` قرار دهید.

## پیاده‌سازی‌های نمونه

- [demo/calculation]

## همچنین ببینید

- [`pl-submission-panel` برای تغییر نحوه نمایش پاسخ ارسالی.](pl-submission-panel.md)
- [`pl-answer-panel` برای نمایش راه‌حل و پاسخ صحیح سوال.](pl-answer-panel.md)
- [`pl-hide-in-panel` برای مخفی کردن محتوا در یک یا چند پنل نمایش.](pl-hide-in-panel.md)

---

[demo/calculation]: https://github.com/PrairieLearn/PrairieLearn/tree/master/exampleCourse/questions/demo/calculation
