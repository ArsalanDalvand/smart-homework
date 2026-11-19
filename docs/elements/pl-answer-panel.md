# المان `pl-answer-panel`

ارائه اطلاعات در خصوص پاسخ سوال پس از آنکه دانشجو دیگر قادر به ارسال پاسخ‌های بیشتر برای نمره‌دهی نیست.

## المان نمونه

```html
<pl-answer-panel>این محتوا فقط در پانل پاسخ صحیح نمایش داده می‌شود.</pl-answer-panel>
```

## جزئیات

به طور کلی، محتویات `question.html` در پانل سوال، پانل پاسخ ارسالی و پانل پاسخ صحیح ظاهر می‌شوند. برای جلوگیری از نمایش محتوا در پانل پاسخ ارسالی و پانل سوال (به طوری که فقط در پانل پاسخ صحیح نشان داده شود)، آن محتوا را بین تگ‌های `<pl-answer-panel>` قرار دهید.

دلایل متداولی که موجب نمایش پانل پاسخ صحیح می‌شوند عبارتند از:

- سوال کاملاً درست پاسخ داده شده باشد.
- فرصت‌های ارسال پاسخ (تلاش‌ها) به پایان رسیده باشد.
- محدودیت زمانی ارزیابی منقضی شده باشد.

## پیاده‌سازی‌های نمونه

- [demo/custom/gradeFunction]

## همچنین ببینید

- [`pl-question-panel` برای نمایش صورت سوال.](pl-question-panel.md)
- [`pl-submission-panel` برای تغییر نحوه نمایش پاسخ ارسال‌شده.](pl-submission-panel.md)
- [`pl-hide-in-panel` برای پنهان کردن محتوا در یک یا چند پانل نمایش.](pl-hide-in-panel.md)
- [`pl-external-grader-results` برای نمایش نتایج حاصل از سوالات برنامه‌نویسی با نمره‌دهی خارجی.](pl-external-grader-results.md)

---

[demo/custom/gradefunction]: https://github.com/PrairieLearn/PrairieLearn/tree/master/exampleCourse/questions/demo/custom/gradeFunction
