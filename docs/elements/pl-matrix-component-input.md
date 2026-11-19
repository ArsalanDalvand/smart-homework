# المان `pl-matrix-component-input`

المان `pl-matrix-component-input` شبکه‌ای از فیلدهای ورودی را با ابعادی هم‌اندازه با متغیر ذخیره‌شده در `answers-name` نمایش می‌دهد (تنها آرایه‌های دوبعدی از اعداد حقیقی می‌توانند در `answers-name` ذخیره شوند).

## المان نمونه

![تصویر المان pl-matrix-component-input](pl-matrix-component-input.png)

```html title="question.html"
<pl-matrix-component-input answers-name="matrixA" label="$A=$"></pl-matrix-component-input>
```

```python title="server.py"
import prairielearn as pl
import numpy as np


def generate(data):

    # Generate a random 3x3 matrix
    mat = np.random.random((3, 3))

    # Answer to each matrix entry converted to JSON
    data["correct_answers"]["matrixA"] = pl.to_json(mat)
```

## سفارشی‌سازی‌ها

| ویژگی | نوع | پیش‌فرض | توضیحات |
| --- | --- | --- | --- |
| `allow-blank` | boolean | false | مشخص می‌کند که آیا فیلدهای ورودی خالی مجاز هستند یا خیر. به طور پیش‌فرض، ماتریس‌هایی با حداقل یک فیلد خالی نمره‌دهی نخواهند شد (فرمت نامعتبر). |
| `allow-feedback` | boolean | `"allow-partial-credit"` | مشخص می‌کند که آیا بازخوردی مبنی بر اینکه کدام مؤلفه‌های ماتریس نادرست هستند مجاز باشد یا خیر. مقدار پیش‌فرض `allow-feedback` همان مقدار `"allow-partial-credit"` است. |
| `allow-fractions` | boolean | true | مشخص می‌کند که آیا پاسخ‌ها می‌توانند به صورت یک عدد گویا با قالب `a/b` بیان شوند یا خیر. |
| `allow-partial-credit` | boolean | false | مشخص می‌کند که آیا به هر مؤلفه صحیح ماتریس نمره تعلق گیرد یا خیر. به طور پیش‌فرض، متغیر تنها زمانی صحیح نمره‌دهی می‌شود که تمام مؤلفه‌های ماتریس درست باشند. |
| `answers-name` | string | — | نام متغیر برای ذخیره داده‌ها. توجه داشته باشید که این ویژگی باید در یک سوال یکتا باشد؛ یعنی هیچ مقداری برای این ویژگی نباید درون یک سوال تکرار شود. |
| `aria-label` | string | — | یک برچسب دسترس‌پذیری برای ورودی. |
| `atol` | number | 1e-8 | تلورانس مطلق برای `comparison="relabs"`. |
| `blank-value` | string | 0 (zero) | مقداری که در صورت خالی ماندن یک مؤلفه، به عنوان پاسخ آن در نظر گرفته می‌شود. تنها زمانی اعمال می‌شود که `allow-blank` برابر `true` باشد. باید از همان فرمت مورد انتظار ورودی کاربر پیروی کند (مثلاً کسرها در صورت مجاز بودن و غیره). |
| `columns` | integer | — | تعداد ستون‌های ماتریس. در صورتی که پاسخ صحیحی در `data["correct_answers"]` ارائه نشده باشد، الزامی است (و باید حداقل ۱ باشد)؛ در غیر این صورت اندازه ماتریس از پاسخ صحیح استنباط می‌شود. |
| `comparison` | `"relabs"`, `"sigfig"` یا `"decdig"` | `"relabs"` | نحوه نمره‌دهی. `"relabs"` از تلورانس‌های نسبی (`rtol`) و مطلق (`atol`) استفاده می‌کند. `"sigfig"` و `"decdig"` از ارقام با معنی (بااهمیت) یا ارقام اعشار به تعداد `digits` استفاده می‌کنند. |
| `digits` | integer | 2 | تعداد ارقامی که برای `comparison="sigfig"` یا `comparison="decdig"` باید صحیح باشند. |
| `label` | string | — | یک پیشوند برای نمایش قبل از کادر ورودی (مانند `label="$F =$"`). |
| `rows` | integer | — | تعداد سطرهای ماتریس. در صورتی که پاسخ صحیحی در `data["correct_answers"]` ارائه نشده باشد، الزامی است (و باید حداقل ۱ باشد)؛ در غیر این صورت اندازه ماتریس از پاسخ صحیح استنباط می‌شود. |
| `rtol` | number | 1e-2 | تلورانس نسبی برای `comparison="relabs"`. |
| `suffix` | string | — | یک پسوند برای نمایش بعد از کادر ورودی (مانند `suffix="$\rm m/s^2$"`). |
| `weight` | integer | 1 | ضریب وزنی مورد استفاده هنگام محاسبه میانگین نمره وزن‌دار روی المان‌ها. |

## جزئیات

سوال تنها زمانی نمره‌دهی می‌شود که تمام مؤلفه‌های ماتریس وارد شده باشند، مگر اینکه ویژگی `allow-blank` فعال شده باشد.

## نمونه‌های پیاده‌سازی

- [element/matrixComponentInput]

## همچنین ببینید

- [`pl-matrix-input` برای ماتریس قالب‌بندی‌شده در زبان‌های برنامه‌نویسی پیاده‌سازی‌شده](pl-matrix-input.md)
- [`pl-number-input` برای ورودی یک عدد تکی](pl-number-input.md)
- [`pl-symbolic-input` برای ورودی عبارت ریاضی](pl-symbolic-input.md)

---

[element/matrixcomponentinput]: https://github.com/PrairieLearn/PrairieLearn/tree/master/exampleCourse/questions/element/matrixComponentInput
