# المان `pl-xss-safe`

اسکریپت‌های بالقوه خطرناک را از HTML حذف می‌کند. استفاده از این المان هنگام تجزیه و نمایش محتوای ارائه‌شده توسط دانشجو توصیه می‌شود. این المان مواردی مانند تگ‌های اسکریپت و محرک‌ها (triggers) را که ممکن است به صورت مخرب توسط دانشجو درج شده باشند حذف می‌کند. توجه داشته باشید که هر کدی که توسط این المان پردازش می‌شود باید مستقیماً توسط مرورگر پشتیبانی شود؛ به این معنی که نمی‌تواند شامل المان‌های پریری‌لرن یا تگ‌های ویژه باشد.

## نمونه المان

```html title="question.html"
<!-- محتوای برگرفته از یک فایل ارسالی (مثلاً pl-file-editor یا pl-file-upload) -->
<pl-xss-safe submitted-file-name="answer.html"></pl-xss-safe>

<!-- محتوای برگرفته از یک المان معمولی (مثلاً pl-string-input) -->
<pl-xss-safe contents="{{submitted_answers.answer}}"></pl-xss-safe>
```

## سفارشی‌سازی‌ها

| ویژگی | نوع | پیش‌فرض | توضیحات |
| --- | --- | --- | --- |
| `contents` | string | — | محتوای خام برای نمایش. |
| `language` | string | html | زبان کد ارائه‌شده. در حال حاضر مقادیر "html" یا "markdown" پشتیبانی می‌شوند. |
| `source-file-name` | string | — | نام فایل منبع حاوی کد مورد استفاده (به جای استفاده از کد موجود بین تگ‌های المان همان‌طور که در قطعه کد بالا نشان داده شده است). |
| `submitted-file-name` | string | — | نام فایل ارسال‌شده توسط کاربر (معمولاً با استفاده از المان `pl-file-editor` یا `pl-file-upload`) حاوی کدی که باید استفاده شود. |

توجه داشته باشید که در یک المان یکسان، فقط یکی از ویژگی‌های `source-file-name`، `submitted-file-name` یا `contents` می‌تواند ارائه شود.

## پیاده‌سازی‌های نمونه

- [demo/markdownEditorLivePreview]
- [element/xssSafe]

## همچنین ببینید

- [`pl-file-editor` برای ارائه یک محیط کدنویسی درون مرورگر](pl-file-editor.md)

[demo/markdowneditorlivepreview]: https://github.com/PrairieLearn/PrairieLearn/tree/master/exampleCourse/questions/demo/markdownEditorLivePreview
[element/xsssafe]: https://github.com/PrairieLearn/PrairieLearn/tree/master/exampleCourse/questions/element/xssSafe
