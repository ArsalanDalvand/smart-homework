# المان `pl-matrix-input`

المان `pl-matrix-input` یک فیلد ورودی را نمایش می‌دهد که یک ماتریس (یعنی یک آرایه ۲ بعدی) را در قالب یکی از زبان‌های برنامه‌نویسی پشتیبانی‌شده (متلب MATLAB یا کتابخانه numpy در پایتون Python) دریافت می‌کند.

## المان نمونه

![تصویر المان pl-matrix-input](pl-matrix-input.png)

```html title="question.html"
<pl-matrix-input answers-name="matrixB" label="$B=$"></pl-matrix-input>
```

```python title="server.py"
import prairielearn as pl
import numpy as np


def generate(data):
    # Randomly generate a 2x2 matrix
    matrixB = np.random.random((2, 2))

    # Answer exported to question.
    data["correct_answers"]["matrixB"] = pl.to_json(matrixB)
```

## سفارشی‌سازی‌ها

| ویژگی | نوع | پیش‌فرض | توضیحات |
| --- | --- | --- | --- |
| `allow-complex` | boolean | false | مشخص می‌کند که آیا اعداد مختلط به عنوان پاسخ مجاز هستند یا خیر. |
| `answers-name` | string | — | نام متغیر برای ذخیره داده‌ها. توجه داشته باشید که این ویژگی باید در یک سوال یکتا باشد؛ یعنی هیچ مقداری برای این ویژگی نباید درون یک سوال تکرار شود. |
| `aria-label` | string | — | یک برچسب دسترس‌پذیری برای ورودی. |
| `atol` | number | 1e-8 | تلورانس مطلق برای `comparison="relabs"`. |
| `comparison` | `"relabs"`, `"sigfig"` یا `"decdig"` | `"relabs"` | نحوه نمره‌دهی. `"relabs"` از تلورانس‌های نسبی (`rtol`) و مطلق (`atol`) استفاده می‌کند. `"sigfig"` و `"decdig"` از ارقام با معنی یا ارقام اعشار به تعداد `digits` استفاده می‌کنند. |
| `digits` | integer | 2 | تعداد ارقامی که برای `comparison="sigfig"` یا `comparison="decdig"` باید صحیح باشند. |
| `initial-value` | string | — | مقدار اولیه برای پر کردن پیش‌فرض کادر ورودی در اولین باری که رندر می‌شود. |
| `label` | string | — | یک پیشوند برای نمایش قبل از کادر ورودی (به عنوان مثال، `label="$F =$"`). |
| `rtol` | number | 1e-2 | تلورانس نسبی برای `comparison="relabs"`. |
| `show-help-text` | boolean | true | نمایش علامت سوال در انتهای ورودی که پارامترهای ورودی مورد نیاز را نشان می‌دهد. |
| `weight` | integer | 1 | ضریب وزنی مورد استفاده هنگام محاسبه میانگین نمره وزن‌دار روی المان‌ها. |

## جزئیات

المان `pl-matrix-input` یک ماتریس واردشده در فرمت `MATLAB` یا `Python` را تجزیه (parse) می‌کند. موارد زیر گزینه‌های قالب ورودی معتبر هستند:

**فرمت MATLAB:**

```m
[1.23; 4.56]
```

**فرمت Python:**

```python
[[1.23], [4.56]]
```

**نکته:** یک کمیت اسکالر هم به صورت ماتریسی با ابعاد ۱ × ۱ (مانند `[1.23]` یا `[[1.23]]`) و هم به صورت یک عدد تنها (مانند `1.23`) پذیرفته می‌شود.

در پانل پاسخ (answer panel)، المان `pl-matrix-input` پاسخ درست را نمایش می‌دهد و به کاربر امکان می‌دهد بین فرمت MATLAB و Python جابجا شود.

در پانل پاسخ ارسالی (submission panel)، المان `pl-matrix-input` پاسخ ارسال‌شده را (با همان قالبی که ارسال شده بود، متلب یا پایتون) یا یادداشتی مبنی بر نامعتبر بودن پاسخ ارسالی (به همراه توضیح دلیل آن) نمایش می‌دهد.

## نمونه‌های پیاده‌سازی

- [demo/matrixComplexAlgebra]

## همچنین ببینید

- [`pl-matrix-component-input` برای کادرهای ورودی مجزا به ازای هر درایه در ماتریس](pl-matrix-component-input.md)
- [`pl-number-input` برای ورودی یک عدد تکی](pl-number-input.md)
- [`pl-symbolic-input` برای ورودی عبارت ریاضی](pl-symbolic-input.md)

---

[demo/matrixcomplexalgebra]: https://github.com/PrairieLearn/PrairieLearn/tree/master/exampleCourse/questions/demo/matrixComplexAlgebra
