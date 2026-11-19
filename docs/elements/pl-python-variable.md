# المان `pl-python-variable`

مقدار یک متغیر پایتون را نمایش می‌دهد. این المان از گزینه‌هایی مشابه ماژول [pprint](https://docs.python.org/3/library/pprint.html) برای قالب‌بندی داده‌های خروجی استفاده می‌کند و می‌تواند ساختارهای داده تودرتو را به صورت بازگشتی چاپ کند. از این رو، برخی از توضیحات زیر مستقیماً از مستندات آن برگرفته شده‌اند.

## المان نمونه

![تصویر المان pl-python-variable](pl-python-variable.png)

```html title="question.html"
<pl-python-variable params-name="variable"></pl-python-variable>
```

```python title="server.py"
import prairielearn as pl


def generate(data):
    data_dictionary = {"a": 1, "b": 2, "c": 3}
    data["params"]["variable"] = pl.to_json(data_dictionary)
```

## سفارشی‌سازی‌ها

| ویژگی | نوع | پیش‌فرض | توضیحات |
| --- | --- | --- | --- |
| `compact-sequences` | boolean | false | بر نحوه قالب‌بندی توالی‌های طولانی (لیست‌ها، چندتایی‌ها، مجموعه‌ها و غیره) تأثیر می‌گذارد. اگر `compact-sequences` برابر با false (پیش‌فرض) باشد، هر آیتم از یک توالی در یک خط جداگانه قرار می‌گیرد. در صورت true بودن، هر تعداد آیتم که در عرض مشخص‌شده بگنجد در هر خط خروجی قالب‌بندی خواهد شد. |
| `copy-code-button` | boolean | false | مشخص می‌کند که آیا دکمه‌ای برای کپی کردن کد نمایش‌داده‌شده توسط این المان تعبیه شود یا خیر. |
| `depth` | integer | — | تعداد سطوح تودرتویی که می‌توانند چاپ شوند؛ اگر ساختار داده در حال چاپ بیش از حد عمیق باشد، سطح بعدی درون آن با ... جایگزین می‌شود. به طور پیش‌فرض، هیچ محدودیتی روی عمق اشیای قالب‌بندی‌شده وجود ندارد. |
| `indent` | integer | 1 | مقدار تورفتگی اضافه‌شده برای هر سطح تودرتو هنگام چاپ اشیای تودرتو را مشخص می‌کند. |
| `no-highlight` | boolean | false | غیرفعال کردن برجسته‌سازی نحو (syntax highlighting). |
| `params-name` | string | — | نام کلید در `data["params"]` برای خواندن مقدار از آن. |
| `prefix` | string | (خالی) | هرگونه پیشوندی که قبل از خروجی افزوده می‌شود. |
| `prefix-newline` | boolean | false | افزودن یک خط جدید (انتقال به خط بعد) به انتهای `prefix`. |
| `show-line-numbers` | boolean | false | مشخص می‌کند که آیا شماره خطوط در کد نمایش‌داده‌شده توسط این المان نشان داده شوند یا خیر. |
| `sort-dicts` | boolean | false | در صورت true بودن، دیکشنری‌ها با کلیدهای مرتب‌شده قالب‌بندی می‌شوند، در غیر این صورت به ترتیب درج نمایش داده خواهند شد. |
| `suffix` | string | (خالی) | هرگونه پسوندی که به انتهای خروجی الحاق می‌شود. |
| `suffix-newline` | boolean | false | افزودن یک خط جدید قبل از شروع `suffix`. |
| `width` | integer | 80 | حداکثر تعداد کاراکترهای دلخواه در هر خط از خروجی را تعیین می‌کند. اگر یک ساختار نتواند درون محدودیت عرض قالب‌بندی شود، بهترین تلاش ممکن انجام خواهد شد. |

### مهاجرت از ویژگی‌های منسوخ‌شده

ویژگی منسوخ‌شده زیر همچنان جهت سازگاری با نسخه‌های گذشته پشتیبانی می‌شود:

| نحو قدیمی | نحو جدید |
| --- | --- |
| `compact="<value>"` | `compact-sequences="<value>"` |

چاپ DataFrames در پانداس (Pandas) با این المان منسوخ شده است، به همراه ویژگی‌های `text`، `show-header`، `show-index` و `show-dimensions` که آن نمایش را کنترل می‌کردند. لطفاً به جای آن از المان جدید [`pl-dataframe`](pl-dataframe.md) استفاده فرمایید.

## جزئیات

این المان از نمایش اشیای پایتون از طریق `repr()` پشتیبانی می‌کند، به همراه پشتیبانی از گزینه‌های نمایش پیچیده‌تر مشابه کتابخانه داخلی `pprint`. **اشیایی که باید نمایش داده شوند حتماً باید قابلیت سریال‌سازی به JSON را داشته باشند.** برای جزئیات بیشتر درباره اینکه چه اشیایی می‌توانند سریال‌سازی شوند و نحوه انجام این کار با توابع ارائه‌شده `to_json` و `from_json`، به [مستندات نگارش سوال](../question/server.md#question-data-storage) مراجعه کنید. برای نمایش اشیایی که به راحتی قابل سریال‌سازی به JSON نیستند، لطفاً سوال نمونه `pl-code` در [element/code] را بررسی کنید.

## نمونه‌های پیاده‌سازی

- [element/pythonVariable]

## همچنین ببینید

- [`pl-code` برای نمایش بلوک‌های کد با برجسته‌سازی نحو](pl-code.md)
- [`pl-variable-output` برای نمایش ماتریس یا المان به صورت کد.](pl-variable-output.md)
- [`pl-dataframe` برای نمایش دیتافریم‌ها.](pl-dataframe.md)

---

[element/code]: https://github.com/PrairieLearn/PrairieLearn/tree/master/exampleCourse/questions/element/code
[element/pythonvariable]: https://github.com/PrairieLearn/PrairieLearn/tree/master/exampleCourse/questions/element/pythonVariable
