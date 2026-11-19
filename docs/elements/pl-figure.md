# المان `pl-figure`

نمایش یک تصویر تولیدشده به صورت ایستا (static) یا پویا (dynamic). از فرمت‌های فایل تصویری متعددی از جمله PNG، JPEG و SVG پشتیبانی می‌کند.

!!! warning "هشدار"

    این المان از فایل‌های PDF پشتیبانی _نمی‌کند_. برای قرار دادن فایل PDF جهت دانلود، از المان [`pl-file-download`](pl-file-download.md) استفاده کنید.

## نمونه المان

![تصویر المان pl-figure](pl-figure.png)

```html title="question.html"
<!-- نمایش یک شکل از یک فایل موجود -->
<pl-figure file-name="figure.png" directory="clientFilesCourse"></pl-figure>

<!-- نمایش یک شکل از فایلی که با کد تولید شده است -->
<pl-figure file-name="figure.png" type="dynamic"></pl-figure>
```

## سفارشی‌سازی‌ها

| ویژگی | نوع | پیش‌فرض | توضیحات |
| ----------- | ------------------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `alt`       | string                    | —                       | متن جایگزین که تصویر یا هدف آن را توصیف می‌کند. مقدار `alt=""` را برای تصاویر تزئینی که اطلاعاتی به محتوای سوال اضافه نمی‌کنند، تنظیم کنید. در صورت حذف، تصویر رندرشده ویژگی `alt` نخواهد داشت. |
| `directory` | string                    | `"clientFilesQuestion"` | پوشه‌ای که فایل را در بر دارد؛ یا `"clientFilesQuestion"` یا `clientFilesCourse` (به [فایل‌های کلاینت و سرور](../clientServerFiles.md) مراجعه کنید). اگر `type="dynamic"` باشد نمی‌توان دایرکتوری را مشخص کرد. |
| `display`   | `"block"` یا `"inline"`   | `"block"`               | نمایش تصویر به صورت درون‌خطی در متن (`"inline"`) یا در یک خط مجزا (`"block"`).                                                                                                                               |
| `file-name` | string                    | —                       | نام فایل تصویر.                                                                                                                                                                                           |
| `type`      | `"static"` یا `"dynamic"` | `"static"`              | نوع فایل؛ یا 'static' (یک فایل موجود) یا 'dynamic' (فایلی که توسط کد المان یا سرور تولید شده است).                                                                                                   |
| `width`     | string                    | —                       | عرض تصویر بر حسب پیکسل، مثلاً `250`.                                                                                                                                                                     |

### مهاجرت از ویژگی‌های منسوخ‌شده

ویژگی منسوخ‌شده زیر همچنان برای سازگاری با نسخه‌های پیشین پشتیبانی می‌شود:

| نحو قدیمی | نحو جدید |
| --------------- | ------------------ |
| `inline="true"` | `display="inline"` |

## تصاویر تولیدشده به صورت پویا

اگر `type="dynamic"` باشد، محتویات فایل تصویر باید توسط یک تابع `file()` که در کد المان یا در `server.py` قرار دارد بازگردانده شود. محتوا باید یک رشته (با انکودینگ utf-8)، یک شیء شبه‌بایت (bytes-like object) یا یک شیء شبه‌فایل (file-like object) باشد. نام فایل به عنوان `data["filename"]` در دسترس این تابع خواهد بود. به عنوان مثال، برای تولید `figure.png` برای المان پویای `pl-figure` بالا، این کد ممکن است در `server.py` برای تولید یک `figure.png` ساختگی قرار داده شود:

```python title="server.py"
def file(data):
    if data["filename"] == "figure.png":
        plt.plot([1, 2, 3], [3, 4, -2])
        buf = io.BytesIO()
        plt.savefig(buf, format="png")
        return buf
```

اگر `file()` چیزی برنگرداند، همانند این رفتار خواهد شد که `file()` رشته خالی برگردانده است.

## پیاده‌سازی‌های نمونه

- [demo/randomPlot]
- [demo/fixedCheckbox]
- [element/figure]

## همچنین ببینید

- [`pl-file-download` برای امکان دانلود فایل‌ها.](pl-file-download.md)
- [`pl-code` برای نمایش کد به صورت متن با برجسته‌سازی نحو (syntax highlighting).](pl-code.md)

---

[demo/fixedcheckbox]: https://github.com/PrairieLearn/PrairieLearn/tree/master/exampleCourse/questions/demo/fixedCheckbox
[demo/randomplot]: https://github.com/PrairieLearn/PrairieLearn/tree/master/exampleCourse/questions/demo/randomPlot
[element/figure]: https://github.com/PrairieLearn/PrairieLearn/tree/master/exampleCourse/questions/element/figure
