# ترجیحات سوال (Question Preferences)

ترجیحات سوال این امکان را فراهم می‌کنند که یک سوال منفرد برای ارزیابی‌های مختلف بدون نیاز به کپی کردن سوال سفارشی‌سازی شود. یک سوال یک **طرح‌واره ترجیحات (Preferences Schema)** را در فایل `info.json` خود تعریف می‌کند، و هر ارزیابی می‌تواند مقادیر پیش‌فرض را هنگام گنجاندن سوال **بازنویسی (Override)** کند.

ترجیحات هم در `server.py` (از طریق `data["preferences"]`) و هم در `question.html` (از طریق `{{preferences.key}}`) در دسترس هستند.

## تعریف ترجیحات

ترجیحات را می‌توان از طریق صفحه **Question Settings** یا با ویرایش مستقیم فایل `info.json` مدیریت کرد.

### استفاده از صفحه تنظیمات سوال

در صفحه تنظیمات سوال، بخش **Preferences** جدولی را نمایش می‌دهد که می‌توانید در آن ترجیحات را اضافه، ویرایش، بازآرایی و حذف کنید. هر ترجیح دارای موارد زیر است:

- **نام (Name)**: یک شناسه یکتا که برای ارجاع به ترجیح در کد استفاده می‌شود (مثلاً `show_hints`).
- **نوع (Type)**: نوع داده، شامل `string`، `number`، یا `boolean`.
- **پیش‌فرض (Default)**: مقداری که در صورت عدم ارائه مقدار بازنویسی توسط ارزیابی استفاده می‌شود.
- **مقادیر مجاز (Allowed values)**: مجموعه‌ای اختیاری از مقادیر مجاز. هنگام تنظیم، مقدار پیش‌فرض و هرگونه مقدار بازنویسی ارزیابی باید یکی از این مقادیر باشند. اگر خالی بماند (به عنوان "Any" نمایش داده می‌شود)، هر مقداری که با نوع داده مطابقت داشته باشد پذیرفته می‌شود.

ترجیحات را می‌توان با کشیدن دستگیره در سمت چپ هر سطر جابه‌جا و بازآرایی کرد.

### استفاده از JSON

یک شیء `preferences` به فایل `info.json` سوال خود اضافه کنید. هر کلید یک فیلد ترجیح را با یک `type`، یک مقدار `default`، و یک `enum` اختیاری از مقادیر مجاز تعریف می‌کند.

```json title="info.json"
{
  "uuid": "302d2d6c-a8a4-4413-97dc-79344d75a5f0",
  "title": "Force on a falling object",
  "topic": "Forces",
  "type": "v3",
  "preferences": {
    "gravitational_constant": {
      "type": "number",
      "default": 9.8
    },
    "fired_object": {
      "type": "string",
      "enum": ["cannon ball", "bowling ball"],
      "default": "cannon ball"
    }
  }
}
```

### ویژگی‌های فیلد ترجیح

| ویژگی | نوع | توضیحات |
| --- | --- | --- |
| `type` | `"string"`, `"number"`, or `"boolean"` | نوع داده مقدار ترجیح. (اجباری) |
| `default` | string, number, or boolean | مقدار پیش‌فرضی که در صورت عدم ارائه مقدار بازنویسی توسط ارزیابی استفاده می‌شود. باید با `type` اعلان‌شده مطابقت داشته باشد. (اجباری) |
| `enum` | array of strings or numbers | یک فهرست اختیاری از مقادیر مجاز. در صورت ارائه، هم مقدار پیش‌فرض و هم هرگونه مقدار بازنویسی ارزیابی باید در این فهرست باشند. |

## بازنویسی ترجیحات در ارزیابی‌ها

مقادیر بازنویسی ترجیحات را می‌توان از طریق ویرایشگر **Assessment Questions** یا با ویرایش مستقیم `infoAssessment.json` تنظیم کرد.

### استفاده از ویرایشگر سوالات ارزیابی

در صفحه سوالات ارزیابی، روی **Edit** کلیک کنید تا وارد حالت ویرایش شوید، سپس سوالی را که ترجیحات را تعریف می‌کند باز کنید. هر ترجیح با مقدار بازنویسی فعلی خود نشان داده می‌شود. مقداری را از منوی کشویی انتخاب کنید یا مقداری را برای بازنویسی پیش‌فرض سوال تایپ کنید. برای بازگشت به پیش‌فرض سوال، فیلد را پاک کنید یا گزینه "Default" را انتخاب نمایید.

### استفاده از JSON

در `infoAssessment.json`، یک شیء `preferences` به ورودی سوال اضافه کنید. تنها ترجیحاتی که مشخص می‌کنید بازنویسی می‌شوند؛ مابقی از مقادیر پیش‌فرض خود استفاده می‌کنند.

```json title="infoAssessment.json"
{
  "uuid": "c113ec72-acb7-41fb-8e76-62f2e79cd7f0",
  "type": "Homework",
  "set": "Homework",
  "number": "5",
  "title": "Forces on Earth",
  "zones": [
    {
      "questions": [
        {
          "id": "forces/fallingObject",
          "autoPoints": 1,
          "preferences": {
            "fired_object": "bowling ball",
            "gravitational_constant": 9.8
          }
        }
      ]
    }
  ]
}
```

مقادیر بازنویسی در حین همگام‌سازی (Sync) با طرح‌واره ترجیحات سوال اعتبارسنجی می‌شوند. اگر مقداری ارائه دهید که با `type` اعلان‌شده مطابقت نداشته باشد یا در فهرست `enum` نباشد، یک خطای همگام‌سازی گزارش می‌شود.

!!! warning

    پشتیبانی از ترجیحات در سوالات به اشتراک‌گذاشته‌شده بی‌نقص نیست؛ ترجیحات تنها در زمان همگام‌سازی در برابر طرح‌واره ترجیحات سوال اشتراکی اعتبارسنجی می‌شوند.

ترجیحات را می‌توان روی گزینه‌های جایگزین منفرد (Individual alternatives) در یک استخر جایگزین سوال نیز تنظیم کرد:

```json title="infoAssessment.json"
{
  "numberChoose": 1,
  "alternatives": [
    {
      "id": "forces/fallingObject",
      "preferences": { "gravitational_constant": 9.8 }
    },
    {
      "id": "kinematics/projectileRange",
      "preferences": { "unit_system": "imperial" }
    }
  ]
}
```

## زمان ذخیره مقادیر ترجیحات

ترجیحات روی هر گونه از سوال زمانی که آن گونه ایجاد می‌شود ذخیره می‌گردند، با استفاده از ادغام مقادیر پیش‌فرض سوال با هرگونه بازنویسی ارزیابی. تمام استفاده‌های بعدی از آن گونه، مقادیر ذخیره‌شده را می‌خوانند، از جمله `render()`، نمره‌دهی و `question.html`. زمان ملاک، زمانی است که **گونه سوال (Question variant)** ایجاد می‌شود، نه زمانی که نمونه ارزیابی (Assessment instance) ایجاد می‌گردد.

تغییر دادن یک پیش‌فرض در `info.json` یا یک مقدار بازنویسی در `infoAssessment.json` و سپس همگام‌سازی، فقط بر گونه‌های جدید ایجادشده تأثیر می‌گذارد. گونه‌های موجود ترجیحات ذخیره‌شده خود را حفظ می‌کنند، حتی پس از آنکه دانشجویان صفحه را مجدداً بارگذاری کنند یا مدرس پاسخ‌های ارسالی آن‌ها را مجدداً نمره‌دهی کند. به عنوان مثال، تغییر `show_hints` از `true` به `false`، راهنماها را در گونه‌هایی که با مقدار `show_hints` برابر با `true` ایجاد شده‌اند پنهان نمی‌کند.

اگر یک ترجیح جدید اضافه کنید، گونه‌های موجود حاوی آن کلید نخواهند بود. در کد پایتون که ممکن است روی گونه‌های موجود اجرا شود، از یک مقدار جایگزین (Fallback) مناسب مانند `data["preferences"].get("show_hints", True)` استفاده کنید. این کار فقدان کلید را مدیریت می‌کند؛ اما مقداری را که قبلاً روی گونه ذخیره شده است جایگزین نمی‌کند.

## استفاده از ترجیحات در `question.html`

مقادیر ترجیحات در قالب‌های Mustache تحت فضای نام `{{preferences.key}}`، درست مانند `{{params.key}}` در دسترس هستند:

<!-- prettier-ignore -->
```html title="question.html"
<pl-question-panel>
  <p>
    A {{preferences.fired_object}} with mass $m = {{params.m}} \rm\ kg$
    is dropped from a cliff.
  </p>
  <p>
    Assume the acceleration due to gravity is
    $g = {{preferences.gravitational_constant}} \rm\ m/s^2$.
  </p>
  <p>What is the magnitude of the net force acting on the {{preferences.fired_object}}?</p>
</pl-question-panel>

<pl-number-input answers-name="force" label="$F = $"></pl-number-input>
```

## استفاده از ترجیحات در `server.py`

مقادیر ترجیحات در دیکشنری `data["preferences"]` در دسترس هستند. این دیکشنری فقط‌خواندنی است و در تمام توابع `server.py` (`generate`، `prepare`، `render`، `parse`، `grade`، `file`، `test`) در دسترس قرار دارد.

```python title="server.py"
import random


def generate(data):
    m = random.choice([2, 5, 10, 15, 20, 25, 50])
    g = float(data["preferences"]["gravitational_constant"])

    data["params"]["m"] = m
    data["correct_answers"]["force"] = m * g
```

## مثال‌ها

### پیکربندی واحدها (SI در مقابل واحدهای امپریال)

یک سوال می‌تواند با تعریف یک ترجیح، از سیستم‌های مختلف واحد پشتیبانی کند:

```json title="info.json"
{
  "uuid": "...",
  "title": "Projectile range",
  "topic": "Kinematics",
  "type": "v3",
  "preferences": {
    "unit_system": {
      "type": "string",
      "enum": ["SI", "imperial"],
      "default": "SI"
    }
  }
}
```

```python title="server.py"
import random
import math


def generate(data):
    if data["preferences"]["unit_system"] == "SI":
        g = 9.8
        unit = "m"
    else:
        g = 32.2
        unit = "ft"

    v0 = random.choice([10, 15, 20, 25])
    angle = random.choice([30, 45, 60])

    data["params"]["v0"] = v0
    data["params"]["angle"] = angle
    data["params"]["unit"] = unit
    data["correct_answers"]["range"] = round(
        v0**2 * math.sin(2 * math.radians(angle)) / g, 2
    )
```

سپس یک ارزیابی می‌تواند از `"preferences": { "unit_system": "SI" }` و دیگری می‌تواند از `"preferences": { "unit_system": "imperial" }` استفاده کند، و همان سوال را مجدداً به کار بگیرد.

### تنظیم سطح دشواری

یک ترجیح بولی می‌تواند نمایش داده شدن راهنماها را کنترل کند:

```json title="info.json (preferences only)"
{
  "preferences": {
    "show_hints": {
      "type": "boolean",
      "default": true
    }
  }
}
```

<!-- prettier-ignore -->
```html title="question.html"
{{#preferences.show_hints}}
<pl-hidden-hints>
  <pl-hint>Remember that $F = ma$.</pl-hint>
</pl-hidden-hints>
{{/preferences.show_hints}}
```

یک تکلیف تمرینی می‌تواند مقدار پیش‌فرض (`true`) را حفظ کند، در حالی که یک ارزیابی آزمون آن را بازنویسی می‌کند:

```json
{ "id": "forces/fallingObject", "autoPoints": 5, "preferences": { "show_hints": false } }
```

### استفاده مجدد از یک سوال در دوره‌های مختلف با زمینه‌های متفاوت

یک سوال درباره آمار می‌تواند زمینه مجموعه داده را تغییر دهد:

```json title="info.json (preferences only)"
{
  "preferences": {
    "dataset_context": {
      "type": "string",
      "enum": ["weather", "stock prices", "exam scores"],
      "default": "exam scores"
    }
  }
}
```

<!-- prettier-ignore -->
```html title="question.html"
<pl-question-panel>
  <p>Given the following {{preferences.dataset_context}} data, compute the sample mean.</p>
</pl-question-panel>
```
