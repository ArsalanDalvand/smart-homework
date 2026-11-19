# المان `pl-excalidraw`

رسم یک نمودار برداری با استفاده از [excalidraw](https://github.com/excalidraw/excalidraw).

توجه داشته باشید که تنها نمره‌دهی دستی پشتیبانی می‌شود. برای ترسیم‌های دارای قابلیت نمره‌دهی خودکار، استفاده از [`pl-drawing`](../pl-drawing/index.md) یا [`pl-sketch`](pl-sketch.md) را در نظر بگیرید.

![تصویر صفحه از المان pl-excalidraw](pl-excalidraw.png)

```html title="question.html"
<p>مورد دیگری را با یک دیاگرام اولیه رسم کنید</p>

<pl-excalidraw
  gradable="true"
  answers-name="vector"
  source-file-name="starter.excalidraw"
  directory="clientFilesQuestion"
  width="100%"
  height="600px"
></pl-excalidraw>
```

## سفارشی‌سازی‌ها

| ویژگی | نوع | پیش‌فرض | توضیحات |
| --- | --- | --- | --- |
| `answers-name` | string | — | نام یکتا برای شناسایی ویجت. پاسخ‌های ارسالی ترسیمی با این نام ذخیره می‌شوند. در صورت تنظیم `gradable` الزامی است. |
| `directory` | `"serverFilesCourse"`، `"clientFilesCourse"`، `"clientFilesQuestion"` یا `"."` | `"."` | دایرکتوری محل بارگذاری `"source-file-name"`. به طور پیش‌فرض، به دایرکتوری سوال `"."` اشاره دارد. |
| `gradable` | boolean | "true" | مشخص می‌کند که آیا دیاگرام ورودی از سمت کاربر را می‌پذیرد یا خیر. |
| `height` | string | `"800px"` | ارتفاع ویجت، سازگار با مشخصات [height در CSS][css-height-mdn]. |
| `source-file-name` | string | — | فایل اختیاری برای بارگذاری به عنوان دیاگرام اولیه. |
| `width` | string | `"100%"` | عرض ویجت، سازگار با مشخصات [width در CSS][css-width-mdn]. |

ویژگی‌های `width` و `height` به عنوان مقادیر ویژگی‌های CSS استفاده می‌شوند. اعداد بدون یکا مانند `height="900"` نامعتبر هستند؛ برای پیکسل از `height="900px"` استفاده کنید.

## دسترس‌پذیری

المان `pl-excalidraw` یک ابزار ترسیم مبتنی بر Canvas است و به طور کامل دسترس‌پذیر نیست. با وجود اینکه می‌توان با صفحه کلید به نوار ابزار دسترسی پیدا کرد، اما شکل‌ها را نمی‌توان صرفاً با صفحه کلید رسم کرد و بوم ترسیم برای صفحه‌خوان‌ها قابل خواندن نیست. جهت بررسی سایر روش‌هایی که دانشجویان می‌توانند پاسخ دهند، به [جایگزین‌های ورودی ترسیمی](../question/accessibility.md#alternatives-to-drawing-input) مراجعه فرمایید.

## پیاده‌سازی‌های نمونه

- [element/excalidraw]

---

[css-height-mdn]: https://developer.mozilla.org/en-US/docs/Web/CSS/height
[css-width-mdn]: https://developer.mozilla.org/en-US/docs/Web/CSS/width
[element/excalidraw]: https://github.com/PrairieLearn/PrairieLearn/tree/master/exampleCourse/questions/element/excalidraw
