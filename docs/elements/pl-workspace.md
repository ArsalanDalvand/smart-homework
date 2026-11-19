# المان `pl-workspace`

یک راه‌انداز محیط کاری (workspace launcher) را در سوال تعبیه می‌کند که امکان اجرای کدهایی را که به محیط غنی‌تری نیاز دارند (چندین فایل، یک ترمینال، یک IDE یا چرخه ساخت/اجرا) فراهم می‌سازد. برای جزئیات کامل درباره نحوه پیکربندی محیط کاری، به مستندات [محیط کاری (Workspace)](../workspaces/index.md) مراجعه کنید.

## نمونه المان

```html title="question.html"
<!-- تعبیه یک راه‌انداز محیط کاری در سوال -->
<pl-workspace></pl-workspace>

<!-- تعبیه یک راه‌انداز محیط کاری در سوال با برچسب سفارشی -->
<pl-workspace label="Open IDE"></pl-workspace>
```

## سفارشی‌سازی‌ها

| ویژگی | نوع | پیش‌فرض | توضیحات |
| --- | --- | --- | --- |
| `label` | string | "Open workspace" | متنی که روی دکمه محیط کاری نمایش داده می‌شود. |

## پیاده‌سازی‌های نمونه

- [demo/workspace/vscode-python]
- [demo/workspace/rstudio]

## همچنین ببینید

- [`pl-file-editor` برای ارائه یک محیط کدنویسی درون مرورگر](pl-file-editor.md)

[demo/workspace/vscode-python]: https://github.com/PrairieLearn/PrairieLearn/tree/master/exampleCourse/questions/demo/workspace/vscode-python
[demo/workspace/rstudio]: https://github.com/PrairieLearn/PrairieLearn/tree/master/exampleCourse/questions/demo/workspace/rstudio
