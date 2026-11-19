# راهنمای توسعه‌دهندگان اکستنشن‌های المان

اکستنشن‌ها (Extensions) روشی برای افزودن منطق سفارشی و قابلیت‌های پیچیده‌تر به المان‌های موجود هستند. هر المان این قابلیت را دارد که اکستنشن‌های مرتبط را بارگذاری کند، از این رو اکستنشن‌ها باید به صورت اختصاصی برای یک المان خاص طراحی شوند.

## ساختار اکستنشن (Extension anatomy)

اکستنشن‌ها فقط در سطح یک درس قابل تعریف هستند و در مسیر `[course directory]/elementExtensions` قرار می‌گیرند. این پوشه به گونه‌ای سازمان‌دهی شده است که المان‌ها به صورت زیرپوشه در آن قرار دارند و سپس اکستنشن‌ها داخل پوشه هر المان قرار می‌گیرند. برای مثال، اگر اکستنشنی به نام `exampleExtension` داشته باشید که المان `exampleElement` را گسترش می‌دهد، ساختار پوشه به صورت `[course directory]/elementExtensions/exampleElement/exampleExtension` خواهد بود.

هر اکستنشن تنها به یک فایل `info.json` حاوی متادیتا درباره المان نیاز دارد و می‌تواند شامل اطلاعات اختیاری مانند اسکریپت‌های پایتون، استایل‌های CSS و فایل‌های جاوااسکریپت سمت کلاینت باشد.

فایل `info.json` از نظر ساختاری شبیه به فایل info المان است و ممکن است شامل فیلدهای زیر باشد:

```json title="info.json"
{
  "controller": "Python script",
  "dependencies": {
    "nodeModulesStyles": ["style_file_path"],
    "nodeModulesScripts": ["script_file_path"],
    "clientFilesCourseStyles": ["style_file_path"],
    "clientFilesCourseScripts": ["script_file_path"],
    "extensionStyles": ["style_file_path"],
    "extensionScripts": ["script_file_path"]
  },
  "dynamicDependencies": {
    "nodeModulesScripts": { "module_name": "module_path" },
    "clientFilesCourseScripts": { "file_name": "file_path" },
    "extensionScripts": { "file_name": "file_path" }
  }
}
```

برای اطلاعات بیشتر درباره مواردی که می‌توان به این فایل اضافه کرد، به [مرجع `infoElementExtension.json`](./schemas/infoElementExtension.md) مراجعه کنید.

### کنترلر پایتون (Python Controller)

اسکریپت اصلی کنترلر پایتون ساختار از پیش‌تعیین‌شده‌ای ندارد و در عوض توسط المانی که در حال گسترش است تعریف می‌شود. هرگونه تابع و متغیر سراسری (Global) برای استفاده توسط المان میزبان در دسترس خواهد بود.

یک المان میزبان می‌تواند تابع `load_extension()` را برای بارگذاری یک اکستنشن خاص، یا تابع `load_all_extensions()` را برای بارگذاری تمام اکستنشن‌های در دسترس فراخوانی کند. این توابع در ماژول `prairielearn` تعریف شده‌اند.

یک جریان دوطرفه از منطق و داده بین المان‌ها و اکستنشن‌های آنها وجود دارد.

#### ایمپورت کردن یک اکستنشن از داخل یک المان

بارگذاری اسکریپت‌های پایتون اکستنشن، یک تاپل نام‌دار (Named tuple) شامل تمام توابع و متغیرهای تعریف‌شده سراسری را برمی‌گرداند. بارگذاری تمام اکستنشن‌ها، یک دیکشنری برمی‌گرداند که نام هر اکستنشن را به تاپل نام‌دار آن نگاشت می‌کند. به عنوان مثال، اگر یک اکستنشن در کنترلر خود موارد زیر را تعریف کند:

```python
def my_cool_function():
    return "hello, world!"
```

المان میزبان می‌تواند با اجرای کد زیر آن را فراخوانی کند:

```python
import prairielearn as pl


def render(element_html, data):
    extension = pl.load_extension(data, "extension_name")
    contents = extension.my_cool_function()
    return contents
```

این مثال کوچک بالا، متن `"hello world!"` را در صفحه سوال رندر می‌کند. توجه داشته باشید که هنگام بارگذاری تمام اکستنشن‌ها با استفاده از `load_all_extensions()`، ماژول‌ها به ترتیب صعودی الفبایی بازگردانده می‌شوند.

#### ایمپورت کردن المان میزبان از داخل یک اکستنشن

اکستنشن‌ها همچنین می‌توانند فایل‌ها را با استفاده از تابع `load_host_script()` از المان میزبان خود ایمپورت کنند. این کار می‌تواند برای دریافت توابع کمکی، تعاریف کلاس‌ها، متغیرهای ثابت و غیره استفاده شود.
به عنوان مثال، اگر المان میزبان شامل کد زیر باشد:

```python
import prairielearn as pl

STATIC_VARIABLE = "hello"


def render(element_html, data):
    extension = pl.load_extension(data, "extension_name")
    contents = extension.my_cool_function()
    return contents
```

اکستنشن می‌تواند با ایمپورت اسکریپت میزبان به `STATIC_VARIABLE` دسترسی پیدا کند:

```python hl_lines="3"
import prairielearn as pl

host_element = pl.load_host_script("pl-host-element.py")


def my_cool_function():
    return host_element.STATIC_VARIABLE
```

### وابستگی‌های اکستنشن (Extension Dependencies)

مشابه روشی که سوالات و المان‌ها ممکن است به دارایی‌های سمت کلاینت نیاز داشته باشند (همان‌طور که در [راهنمای توسعه‌دهندگان المان](./devElements.md#element-dependencies) توضیح داده شده است)، اکستنشن‌ها نیز ممکن است به جاوااسکریپت و CSS سمت کلاینت نیاز داشته باشند. ویژگی‌های مختلف در اینجا خلاصه شده است. توجه داشته باشید که وابستگی‌های اسکریپت را می‌توان به صورت وابستگی‌های استاتیک یا داینامیک تنظیم کرد، در حالی که استایل‌ها فقط می‌توانند به عنوان وابستگی‌های استاتیک تنظیم شوند.

| ویژگی (Property) | توضیحات |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `nodeModulesStyles` | استایل‌های مورد نیاز این اکستنشن، به صورت نسبی نسبت به `[PrairieLearn directory]/node_modules`. |
| `nodeModulesScripts` | اسکریپت‌های مورد نیاز این اکستنشن، به صورت نسبی نسبت به `[PrairieLearn directory]/node_modules`. |
| `extensionStyles` | استایل‌های مورد نیاز این المان، به صورت نسبی نسبت به پوشه اکستنشن، `[course directory]/elementExtensions/element-name/extension-name`. |
| `extensionScripts` | اسکریپت‌های مورد نیاز این المان، به صورت نسبی نسبت به پوشه اکستنشن، `[course directory]/elementExtensions/element-name/extension-name`. |
| `clientFilesCourseStyles` | استایل‌های مورد نیاز این اکستنشن، به صورت نسبی نسبت به `[course directory]/clientFilesCourse`. |
| `clientFilesCourseScripts` | اسکریپت‌های مورد نیاز این اکستنشن، به صورت نسبی نسبت به `[course directory]/clientFilesCourse`. |

توجه داشته باشید که دارایی‌های اعلام‌شده اکستنشن المان در `dependencies` همیشه بارگذاری خواهند شد، صرف‌نظر از اینکه کنترلر پایتون آنها بارگذاری شده باشد یا خیر. به همین دلیل، توصیه می‌شود که اکستنشن‌ها در صورت امکان از `dynamicDependencies` استفاده کنند تا اسکریپت‌ها فقط در صورت لزوم و بر اساس زمینه و نحوه استفاده از المان بارگذاری شوند.

!!! warning "هشدار"

    به یاد داشته باشید که باید از وابستگی‌های node_modules خودداری شود، زیرا ممکن است بدون اطلاع قبلی به‌روزرسانی شوند و در برخی موارد اکستنشن شما را با خطا مواجه کنند. اطلاعات بیشتر را می‌توانید در [راهنمای توسعه‌دهندگان المان](./devElements.md#using-node-dependencies-in-element-code) بیابید.

### سایر فایل‌های کلاینت (Other Client Files)

سایر فایل‌های در دسترس کلاینت، مانند تصاویر یا هرگونه محتوای قابل دانلود نیز می‌توانند بارگذاری شوند. این فایل‌های کلاینت باید در پوشه `clientFilesExtension` در دایرکتوری اکستنشن قرار گیرند، و URL کامل به آن پوشه در `data["options"]["client_files_extensions_url"][extension_name]` به اکستنشن میزبان داده می‌شود. اگر این مسیر توسط خود اکستنشن مورد نیاز باشد، می‌توان آن را به عنوان آرگومان به تابع تعریف‌شده اکستنشن ارسال کرد.
