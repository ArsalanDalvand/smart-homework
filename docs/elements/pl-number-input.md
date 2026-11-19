# المان `pl-number-input`

یک فیلد جای خالی برای ورود مقادیر **عددی** در محدوده تلورانس‌های مشخص.

## المان نمونه

![تصویر المان pl-number-input با تلورانس نسبی](pl-number-input-rtol.png)

```html title="question.html"
<pl-number-input answers-name="ans_rtol" label="$x =$"> </pl-number-input>
```

```python title="server.py"
import random


def generate(data):

    # Generate a random value
    x = random.uniform(1, 2)

    # Answer to fill in the blank input
    data["correct_answers"]["ans_rtol"] = x
```

---

![تصویر المان pl-number-input با ارقام با معنی](pl-number-input-sigfig.png)

```html title="question.html"
<pl-number-input answers-name="ans_sig" comparison="sigfig" digits="2" label="$x =$">
</pl-number-input>
```

```python title="server.py"
import random


def generate(data):

    # Generate a random value
    x = random.uniform(1, 2)

    # Answer to fill in the blank input
    data["correct_answers"]["ans_sig"] = round(x, 2)
```

## سفارشی‌سازی‌ها

| ویژگی | نوع | پیش‌فرض | توضیحات |
| --- | --- | --- | --- |
| `allow-blank` | boolean | false | مشخص می‌کند که آیا کادر ورودی خالی مجاز است یا خیر. به طور پیش‌فرض، کادرهای ورودی خالی نمره‌دهی نخواهند شد (فرمت نامعتبر). |
| `allow-complex` | boolean | false | مشخص می‌کند که آیا اعداد مختلط به عنوان پاسخ مجاز هستند یا خیر. اگر پاسخ صحیح در `server.py` به صورت یک شیء مختلط تعیین شده باشد، باید از `import prairielearn as pl` و `data["correct_answers"][answers-name] = pl.to_json(ans)` استفاده کنید. |
| `allow-fractions` | boolean | true | مشخص می‌کند که آیا پاسخ‌ها می‌توانند به صورت یک عدد گویا با قالب `a/b` بیان شوند یا خیر. |
| `answers-name` | string | — | نام متغیر برای ذخیره داده‌ها. توجه داشته باشید که این ویژگی باید در یک سوال یکتا باشد؛ یعنی هیچ مقداری برای این ویژگی نباید درون یک سوال تکرار شود. |
| `aria-label` | string | — | یک برچسب دسترس‌پذیری برای ورودی. |
| `atol` | number | 1e-8 | تلورانس مطلق برای `comparison="relabs"`. |
| `blank-value` | string | 0 (zero) | مقداری که در صورت خالی ماندن المان، به عنوان پاسخ در نظر گرفته می‌شود. تنها زمانی اعمال می‌شود که `allow-blank` برابر `true` باشد. باید `""` (رشته خالی) باشد یا از همان فرمت مورد انتظار ورودی کاربر پیروی کند (مثلاً کسرها در صورت مجاز بودن، اعداد مختلط در صورت مجاز بودن و غیره). |
| `comparison` | `"relabs"`, `"sigfig"` یا `"decdig"` | `"relabs"` | نحوه نمره‌دهی. `"relabs"` از تلورانس‌های نسبی (`rtol`) و مطلق (`atol`) استفاده می‌کند. `"sigfig"` و `"decdig"` از ارقام با معنی یا ارقام اعشار به تعداد `digits` استفاده می‌کنند. |
| `correct-answer` | float یا `""` | توضیحات را ببینید | پاسخ صحیح برای نمره‌دهی. مقدار پیش‌فرض آن `data["correct_answers"][answers-name]` است. یک پاسخ صحیح خالی (`correct-answer=""`) تنها زمانی معتبر است که `allow-blank="true"` و `blank-value=""` باشند. |
| `custom-format` | string | توضیحات را ببینید | قالب سفارشی مورد استفاده هنگام قالب‌بندی پاسخ ارسالی یا صحیح. به طور پیش‌فرض، پاسخ‌های ارسالی با فرمت `".12g"` نمایش داده می‌شوند، در حالی که پاسخ صحیح در صورت استفاده از روش مقایسه `"relabs"` از فرمت `".12g"`، یا در صورت استفاده از روش مقایسه `"sigfig"` یا `"decdig"` از یک قالب سفارشی بر اساس تعداد ارقام استفاده می‌کند. توضیحات کامل قالب را می‌توان در [صفحه مستندات پایتون](https://docs.python.org/3/library/string.html#format-specification-mini-language) یافت. |
| `digits` | integer | 2 | تعداد ارقامی که برای `comparison="sigfig"` یا `comparison="decdig"` باید صحیح باشند. |
| `display` | `"block"` یا `"inline"` | `"inline"` | نحوه نمایش فیلد ورودی. |
| `initial-value` | string | — | مقدار اولیه برای پر کردن پیش‌فرض کادر ورودی در اولین باری که رندر می‌شود. |
| `label` | string | — | یک پیشوند برای نمایش قبل از کادر ورودی (به عنوان مثال، `label="$F =$"`). |
| `placeholder` | string | توضیحات را ببینید | متن جایگزین سفارشی (placeholder). به طور پیش‌فرض، متن جایگزین نمایش‌داده‌شده بیانگر روش مقایسه پیش‌فرض است. |
| `rtol` | number | 1e-2 | تلورانس نسبی برای `comparison="relabs"`. |
| `show-correct-answer` | boolean | true | کنترل می‌کند که آیا پاسخ مرجع صحیح در پانل پاسخ نمایش داده شود یا خیر. |
| `show-help-text` | boolean | true | نمایش علامت سوال در انتهای ورودی که پارامترهای ورودی مورد نیاز را نشان می‌دهد. |
| `show-placeholder` | boolean | true | آیا متن جایگزین تولیدشده در زمانی که `placeholder` مشخص نشده است نمایش داده شود یا خیر. |
| `show-score` | boolean | true | آیا نشان نمره در کنار این المان نمایش داده شود یا خیر. |
| `size` | integer | 35 | اندازه کادر ورودی. |
| `suffix` | string | — | یک پسوند برای نمایش پس از کادر ورودی (به عنوان مثال، `suffix="$\rm m/s^2$"`). |
| `weight` | integer | 1 | ضریب وزنی مورد استفاده هنگام محاسبه میانگین نمره وزن‌دار روی المان‌ها. |

## نمونه‌های پیاده‌سازی

- [element/numberInput]
- [demo/calculation]

## همچنین ببینید

- [`pl-integer-input` برای ورودی اعداد صحیح](pl-integer-input.md)
- [`pl-symbolic-input` برای ورودی عبارت ریاضی](pl-symbolic-input.md)
- [`pl-string-input` برای ورودی رشته‌ای](pl-string-input.md)

---

[demo/calculation]: https://github.com/PrairieLearn/PrairieLearn/tree/master/exampleCourse/questions/demo/calculation
[element/numberinput]: https://github.com/PrairieLearn/PrairieLearn/tree/master/exampleCourse/questions/element/numberInput
