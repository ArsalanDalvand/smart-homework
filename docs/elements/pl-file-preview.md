# المان `pl-file-preview`

فهرستی از تمام فایل‌های ارسال‌شده توسط دانشجو از طریق المان‌های ارسال پاسخ مانند `pl-file-editor`، `pl-file-upload` و `pl-rich-text-editor` یا از طریق [محیط‌های کاری (workspaces)](../workspaces/index.md) را درون مرورگر فراهم می‌کند. همچنین پیش‌نمایشی از محتوای هر فایل برای فایل‌های متنی (شامل کد منبع)، تصاویر، فایل‌های PDF و نوت‌بوک‌های ژوپیتر (Jupyter Notebooks) نمایش داده می‌شود. این المان معمولاً در پنل ارسال پاسخ (submission panel) در کنار المان `pl-external-grader-results` استفاده می‌شود، هرچند زمانی که از نمره‌دهی دستی یا داخلی برای نمره‌دهی فایل‌ها استفاده می‌شود نیز می‌تواند به کار رود.

## نمونه المان

```html
<pl-file-preview></pl-file-preview>
```

## پیاده‌سازی‌های نمونه

- [element/fileEditor]
- [demo/autograder/codeEditor]

## همچنین ببینید

- [`pl-file-editor` برای فراهم کردن محیط کدنویسی درون مرورگر](pl-file-editor.md)
- [`pl-file-upload` برای دریافت فایل‌ها به عنوان پاسخ ارسالی](pl-file-upload.md)
- [`pl-external-grader-results` برای گنجاندن خروجی حاصل از کد تصحیح‌شده به صورت خودکار](pl-external-grader-results.md)
- [`pl-code` برای نمایش بلوک‌های کد با برجسته‌سازی نحو](pl-code.md)
- [`pl-xss-safe` برای نمایش کدهای HTML یا Markdown ارائه‌شده توسط دانشجویان](pl-xss-safe.md)

---

[demo/autograder/codeeditor]: https://github.com/PrairieLearn/PrairieLearn/tree/master/exampleCourse/questions/demo/autograder/codeEditor
[element/fileeditor]: https://github.com/PrairieLearn/PrairieLearn/tree/master/exampleCourse/questions/element/fileEditor
