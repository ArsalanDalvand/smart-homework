# المان `pl-hide-in-panel`

محتوا را پنهان می‌کند به طوری که در پنل‌های مشخصی ("question"، "submission" یا "answer") نمایش داده **نمی‌شود**.

## نمونه المان

```html title="question.html"
<pl-hide-in-panel submission="true" answer="true">
  This text will be hidden in the submission panel and answer panel.
</pl-hide-in-panel>
```

## سفارشی‌سازی‌ها

| ویژگی | نوع | پیش‌فرض | توضیحات |
| ------------ | ------- | ------- | ------------------------------------------------------------- |
| `answer`     | boolean | false   | مشخص می‌کند که آیا محتوای المان در پنل پاسخ و راه‌حل (answer panel) پنهان شود یا خیر.     |
| `question`   | boolean | false   | مشخص می‌کند که آیا محتوای المان در پنل سوال (question panel) پنهان شود یا خیر.   |
| `submission` | boolean | false   | مشخص می‌کند که آیا محتوای المان در پنل ارسال پاسخ (submission panel) پنهان شود یا خیر. |

## جزئیات

محتوای المان را در پنل‌هایی که ویژگی مربوط به آن‌ها برابر `true` است پنهان می‌کند. این المان معکوس المان‌های
[`pl-question-panel`](pl-question-panel.md)،
[`pl-submission-panel`](pl-submission-panel.md) یا
[`pl-answer-panel`](pl-answer-panel.md) عمل می‌کند که همگی محتوای المان را صریحاً فقط در یک پنل خاص نشان می‌دهند.

## پیاده‌سازی‌های نمونه

- [element/panels]

## همچنین ببینید

- [`pl-question-panel` برای نمایش صورت سوال.](pl-question-panel.md)
- [`pl-submission-panel` برای تغییر نحوه نمایش پاسخ ارسال‌شده.](pl-submission-panel.md)
- [`pl-answer-panel` برای نمایش پاسخ و راه‌حل سوال.](pl-answer-panel.md)
- [`pl-external-grader-results` برای نمایش نتایج حاصل از یک سوال کدنویسی تصحیح‌شده به صورت خارجی.](pl-external-grader-results.md)

---

[element/panels]: https://github.com/PrairieLearn/PrairieLearn/tree/master/exampleCourse/questions/element/panels
