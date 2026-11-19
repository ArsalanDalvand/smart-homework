# المان `pl-dataframe`

نمایش قالب‌بندی‌شده‌ی دیتافریم‌های پانداس (Pandas DataFrames)، همراه با گزینه‌های گوناگون برای نمایش انواع ستون‌ها و کدی برای بازتولید دیتافریم.

## المان‌های نمونه

```html title="question.html"
<pl-dataframe params-name="df" show-index="false" show-dimensions="false" digits="4"></pl-dataframe>
```

```python title="server.py"
import pandas as pd
import prairielearn as pl


def generate(data):
    df = pd.read_csv("breast-cancer-train.dat", header=None)
    data["params"]["df"] = pl.to_json(df.head(15))
```

## سفارشی‌سازی‌ها

| ویژگی | نوع | پیش‌فرض | توضیحات |
| --- | --- | --- | --- |
| `digits` | integer | — | تعداد ارقام نمایشی برای مقادیر ممیز شناور. |
| `display-language` | `"python"`، یا `"r"` | `"python"` | زبان مورد استفاده برای نمایش انواع داده‌ها و اندیس‌ها. |
| `display-variable-name` | string | `"df"` | نام متغیر نمایشی در کدی که دیتافریم را مجدداً ایجاد می‌کند. |
| `params-name` | string | — | نام کلید در `data["params"]` برای دریافت مقدار. |
| `presentation-type` | `"e"`، `"E"`، `"f"`، `"F"`، `"g"`، `"G"`، `"n"`، یا `"%"` | `"g"` | قالب نمایش اعداد ممیز شناور. اگر `digits` مشخص شده باشد، با استفاده از `'{:.{digits}{presentation-type}}'` قالب‌بندی می‌شود؛ در غیر این صورت با `'{:{presentation-type}}'`. برای اطلاعات بیشتر در خصوص معنای هر نوع نمایش برای مقادیر `float` و `Decimal`، به [مستندات پایتون](https://docs.python.org/3/library/string.html#format-specification-mini-language) مراجعه کنید. |
| `show-dimensions` | boolean | true | نمایش پاورقی حاوی ابعاد دیتافریم. |
| `show-dtype` | boolean | false | نمایش انواع داده‌های موجود در هر ستون دیتافریم در پایین همان ستون. انواع استفاده‌شده با پارامتر `display-language` مطابقت دارند. |
| `show-header` | boolean | true | نمایش سطر سربرگ (Header) دیتافریم. |
| `show-index` | boolean | true | نمایش ستون اندیس دیتافریم. در صورتی که از اندیس پیش‌فرض استفاده شود و `display-language` برابر "r" باشد، به اندیس‌گذاری بر مبنای ۱ تغییر می‌یابد. |
| `show-python` | boolean | true | نمایش کدی که می‌توان با آن دیتافریم را در پایتون در یک تب جداگانه بازتولید کرد. |
| `width` | integer | 500 | حداکثر تعداد نویسه‌ها در هر خط برای نمایش کد پایتون. |

## جزئیات

هنگام تنظیم یک پارامتر، از تابع توکار `pl.to_json()` در PrairieLearn روی دیتافریم برای نمایش استفاده نمایید. توجه داشته باشید که چندین گزینه سریال‌سازی برای دیتافریم‌های Pandas وجود دارد. کدگذاری دیتافریم `df` با تنظیم `pl.to_json(df, df_encoding_version=2)` امکان استفاده از مقادیر گمشده و تاریخ/زمان را فراهم می‌کند، در حالی که `pl.to_json(df, df_encoding_version=1)` (پیش‌فرض) این قابلیت را ندارد. با این حال، `df_encoding_version=1` از اعداد مختلط پشتیبانی می‌کند، در حالی که `df_encoding_version=2` پشتیبانی نمی‌کند.

توجه داشته باشید که برخی از انواع داده پایتون ممکن است در کد ارائه‌شده برای بازسازی دیتافریم به درستی سریال‌سازی نشوند.

## پیاده‌سازی‌های نمونه

- [element/dataframe]
- [demo/randomDataFrame]

## همچنین ببینید

- [`pl-code` برای نمایش بلوک‌های کد همراه با رنگ‌آمیزی ساختار نحوی](pl-code.md)
- [`pl-variable-output` برای نمایش یک ماتریس یا المان در قالب کد.](pl-variable-output.md)
- [`pl-python-variable` برای نمایش خروجی قالب‌بندی‌شده متغیرهای پایتون.](pl-python-variable.md)

---

[demo/randomdataframe]: https://github.com/PrairieLearn/PrairieLearn/tree/master/exampleCourse/questions/demo/randomDataFrame
[element/dataframe]: https://github.com/PrairieLearn/PrairieLearn/tree/master/exampleCourse/questions/element/dataframe
