# نمره‌دهنده خودکار C/C++

این سند به تشریح نمره‌دهنده خودکار پیش‌فرض C/C++ موجود در ایمیج داکر `prairielearn/grader-c` می‌پردازد. برای اطلاعات کلی در مورد نحوه راه‌اندازی یک نمره‌دهنده خارجی، مستندات [نمره‌دهی خارجی](../externalGrading.md) را مشاهده کنید.

## راه‌اندازی {#setting-up}

### `info.json`

ابتدا باید سوال را برای فعال‌سازی [نمره‌دهی خارجی](../externalGrading.md) تنظیم کرد، به این صورت که `"gradingMethod": "External"` در تنظیمات `info.json` قرار گیرد. برای استفاده از نمره‌دهنده خودکار خاص C/C++ که در این سند شرح داده شده است، در دیکشنری `"externalGradingOptions"`، مقدار `"image"` باید برابر با `"prairielearn/grader-c"` تنظیم شود. نیازی به ارائه `"entrypoint"` نیست.

یک فایل کامل `info.json` به شکل زیر خواهد بود:

```json title="info.json"
{
  "uuid": "...",
  "title": "...",
  "topic": "...",
  "tags": ["..."],
  "type": "v3",
  "singleVariant": true,
  "gradingMethod": "External",
  "externalGradingOptions": {
    "image": "prairielearn/grader-c",
    "timeout": 10
  }
}
```

### `question.html`

بیشتر سوالاتی که از این نمره‌دهنده خودکار استفاده می‌کنند حاوی المان `pl-file-editor` یا `pl-file-upload` خواهند بود، هرچند سوالاتی که از المان‌های دیگر استفاده می‌کنند (مثلاً `pl-string-input` برای عبارات کوتاه) نیز امکان‌پذیر هستند. سوال همچنین باید در `pl-submission-panel` شامل یک المان `pl-external-grader-results` باشد تا وضعیت کارهای نمره‌دهی را نشان دهد. همچنین توصیه می‌شود یک المان `pl-file-preview` در پانل پاسخ ارسالی قرار داده شود تا دانشجویان بتوانند کدهای ارسالی قبلی خود را مشاهده کنند. یک نمونه نشانه‌گذاری سوال در زیر آمده است:

```html
<pl-question-panel>
  <pl-file-editor file-name="square.c" ace-mode="ace/mode/c_cpp"></pl-file-editor>
</pl-question-panel>

<pl-submission-panel>
  <pl-external-grader-results></pl-external-grader-results>
  <pl-file-preview></pl-file-preview>
</pl-submission-panel>
```

### `tests/test.py`

فایل `test.py` حاوی تست‌های پایه‌ای خواهد بود که باید توسط نمره‌دهنده C/C++ اجرا شوند. یک `test.py` ساده برای نمره‌دهی کد C به این شکل خواهد بود:

```python
#! /usr/bin/python3

import cgrader

class QuestionGrader(cgrader.CGrader):

    def tests(self):
        # Include tests here

g = QuestionGrader()
g.start()
```

یک `test.py` ساده برای نمره‌دهی کد C++ به شکل زیر خواهد بود (تنها تفاوت، کلاس والد است):

```python
#! /usr/bin/python3

import cgrader

class QuestionGrader(cgrader.CPPGrader):

    def tests(self):
        # Include tests here

g = QuestionGrader()
g.start()
```

متد `tests` در بالا مبنای تست‌های کاربر را در بر می‌گیرد و به برخی از توابع عادی ارائه‌شده توسط نمره‌دهنده C/C++ دسترسی خواهد داشت. برخی از متدهایی که می‌توان فراخوانی کرد در ادامه فهرست شده‌اند.

هر فایلی که با استفاده از `pl-file-editor` یا `pl-file-upload` یا از طریق محیط‌های کاری ارسال شود، برای استفاده توسط نمره‌دهنده C/C++ در دسترس خواهد بود. برای ایجاد تست‌ها بر اساس پارامترهای تعریف‌شده توسط `server.py` یا دسترسی به داده‌های ارسالی از سایر المان‌ها مانند المان‌های `pl-string-input`، می‌توانید به دیکشنری `self.data` دسترسی داشته باشید. این دیکشنری شامل کلیدهایی مشابه کلیدهای موجود در تابع `grade()` در `server.py` است، از جمله `self.data["params"]` یا `self.data["submitted_answers"]`.

## گزینه‌های تست موجود {#available-test-options}

پس از کامپایل کدهای دانشجو و مدرس، تست‌ها را می‌توان با استفاده از یکی از سه روش زیر ایجاد کرد. انتخاب روش به نوع کدی که انتظار می‌رود دانشجویان بنویسند و نوع اعتبارسنجی مورد نیاز بستگی دارد. سه گزینه اصلی عبارتند از:

- اجرای فایل اجرایی کامپایل‌شده از کد دانشجو و [بررسی خروجی آن](#running-a-program-and-checking-its-standard-output). این گزینه در صورتی توصیه می‌شود که از دانشجویان انتظار می‌رود برنامه‌های کامل و مستقلی بنویسند که از طریق خط فرمان قابل اجرا باشند و هدف اصلی برنامه، تولید خروجی از پیش تعیین‌شده‌ای بر اساس ورودی استاندارد، آرگومان‌های خط فرمان یا فایل‌های خارجی باشد.
- اجرای یک [مجموعه تست واحد بر پایه فریم‌ورک Check](#running-a-check-framework-test-suite). این گزینه برای حالت‌های پیچیده‌تر اکیداً توصیه می‌شود؛ جایی که از دانشجویان انتظار می‌رود توابع خاصی را با رفتار مشخص پیاده‌سازی کنند و لازم است چندین مورد آزمون (Test case) و سناریوی مختلف بررسی شوند. همچنین اگر می‌خواهید نشت حافظه و اشاره‌گرهای معلق را بررسی کنید، این گزینه با استفاده از [قابلیت AddressSanitizer](#identifying-dangling-pointers-memory-leaks-and-similar-issues) پیشنهاد می‌شود.
- انجام بررسی‌های سفارشی خود در `test.py`. از این گزینه می‌توان برای بررسی‌هایی استفاده کرد که متکی به تجزیه (Parsing) خودِ کد دانشجو هستند (مثلاً بررسی وجود ویژگی‌هایی مانند بازگشت یا استفاده از کتابخانه‌های خاص) یا بررسی اثرات جانبی (مانند بررسی اینکه آیا فایل‌ها به درستی ایجاد یا تغییر یافته‌اند یا خیر). می‌توانید [از متد `self.run_command()` استفاده کنید](#running-a-command-without-creating-a-test) تا کد دانشجو را اجرا کرده و خروجی آن را دریافت کنید، و سپس [نتایج تست اختصاصی خود را بسازید](#manually-adding-test-results). همچنین می‌توانید از کتابخانه‌هایی مانند `clang` برای تجزیه کد دانشجو و بررسی ویژگی‌های خاص یا انجام تحلیل ایستای کد استفاده کنید. این کار می‌تواند با اجرای کد دانشجو از طریق سایر روش‌های بالا ترکیب شود.

## کامپایل یک برنامه C/C++ {#compiling-a-cc-program}

برای کامپایل یک فایل C یا C++، می‌توانید از متد `self.compile_file()` استفاده کنید. یک فراخوانی معمول برای این متد، با این فرض که دانشجویان یک فایل کامل C شامل تابع `main` را می‌نویسند، شامل دو پارامتر خواهد بود: نام فایل C یا C++ که باید کامپایل شود (فایل ارسال‌شده توسط دانشجو)، و نام فایل اجرایی که باید ایجاد شود.

```python
# Compile the file, but do not create a unit test result
self.compile_file("square.c", "square")
# Compile the file and give one point to student if compilation is successful
self.test_compile_file("square.c", "square")
```

به‌طور پیش‌فرض، این متدها از `gcc` و `g++` (به ترتیب برای `CGrader` و `CPPGrader`) برای کامپایل کد استفاده می‌کنند. برای استفاده از یک کامپایلر دیگر (مانند `clang`)، آرگومان `compiler` را تنظیم کنید:

```python
self.compile_file("square.c", "square", compiler="clang")
```

به‌طور پیش‌فرض، اگر کامپایل با شکست مواجه شود، تمام تست‌ها متوقف شده و پاسخ ارسالی به عنوان غیرقابل نمره‌دهی (Ungradable) برگردانده می‌شود. این بدان معناست که این پاسخ ارسالی جزو محدودیت دفعات ارسال دانشجو محاسبه نخواهد شد و دانشجو نمره‌ای دریافت نخواهد کرد. با این حال، دانشجو نتیجه کامپایل را مشاهده خواهد کرد. اگر می‌خواهید در صورت شکست کامپایل نیز تست‌ها ادامه پیدا کنند، می‌توانید تابع را به این صورت فراخوانی کنید:

```python
self.compile_file("square.c", "square", ungradable_if_failed=False)
```

به‌طور پیش‌فرض، اگر کامپایل موفقیت‌آمیز باشد اما اخطار (Warning) داشته باشد، پیامی حاوی اخطار در پیام اصلی نتایج و در بالای نتایج تست درج می‌شود. اگر تمایلی ندارید که اخطارها در بالای نتایج فهرست شوند، می‌توانید تابع را به این صورت فراخوانی کنید:

```python
self.compile_file("square.c", "square", add_warning_result_msg=False)
```

### تنظیم فلگ‌های کامپایل {#setting-compilation-flags}

همچنین می‌توانید فلگ‌های کامپایل اضافی قابل قبول برای `gcc` (یا `g++`) را با آرگومان `flags` وارد کنید؛ این آرگومان می‌تواند یک رشته منفرد یا آرایه‌ای از رشته‌ها باشد:

```python
self.compile_file("square.c", "square", flags="-Wall -O3")  # single string
self.compile_file("square.c", "square", flags=["-Wall", "-O3"])  # array
```

برای فلگ‌های مبتنی بر `pkg-config`، از `pkg_config_flags` همراه با کتابخانه یا کتابخانه‌هایی که باید مورد پرس‌وجو قرار گیرند استفاده کنید:

```python
self.compile_file(
    "square.c", "square", pkg_config_flags="check ncurses"
)  # single string
self.compile_file("square.c", "square", pkg_config_flags=["check", "ncurses"])  # array
```

### کار با چندین فایل {#working-with-multiple-files}

همچنین امکان تست برنامه‌هایی که در آن‌ها دانشجو تنها بخشی از یک برنامه را ارسال می‌کند، وجود دارد. برای کامپایل فایل C/C++ ارسال‌شده توسط کاربر در کنار برخی از توابع (از جمله به عنوان مثال تابع `main`) که توسط مدرس پیاده‌سازی شده‌اند، می‌توانید یک فایل `main.c` (یا `main.cpp`) را در داخل پوشه `tests` ذخیره کرده و دستور زیر را اجرا کنید:

```python
self.compile_file("square.c", "square", add_c_file="/grade/tests/main.c")
```

دستور بالا فایل C/C++ ارائه‌شده توسط دانشجو را به همراه فایل C/C++ ارائه‌شده توسط مدرس در قالب یک فایل اجرایی واحد کامپایل می‌کند.

اگر دانشجو تابعی را پیاده‌سازی کند که در کد مدرس نیز پیاده‌سازی شده است (از جمله `main` در صورت وجود)، تابع دانشجو نادیده گرفته شده و اولویت با توابع ارائه‌شده توسط مدرس خواهد بود. این کار با کامپایل کد با فلگ `-Wl,--allow-multiple-definition` در `gcc` انجام می‌شود. با این حال، اگر نیاز به ارجاع به برخی از این توابع پیاده‌سازی‌شده توسط دانشجو باشد، می‌توان از گزینه `objcopy_args` استفاده کرد. در صورت ارائه این گزینه، [دستور `objcopy`](https://man7.org/linux/man-pages/man1/objcopy.1.html) با لیست آرگومان‌های مشخص‌شده روی کد دانشجو اجرا می‌شود. این گزینه فقط روی فایل‌های دانشجو اعمال می‌شود و نه روی فایل‌های اضافه‌شده (ارائه‌شده توسط مدرس). به عنوان مثال، دستورالعمل زیر همان فایل‌های بالا را کامپایل می‌کند، اما تابع `main` دانشجو را به `student_main` تغییر نام داده و تابع ایستای `my_static_fn` را سراسری (Global) می‌کند تا تابع `main` مدرس بتواند هر دوی این توابع را مستقیماً فراخوانی کند.

```python
self.compile_file(
    "square.c",
    "square",
    add_c_file="/grade/tests/main.c",
    objcopy_args=[
        "--redefine-sym",
        "main=student_main",
        "--globalize-symbol",
        "my_static_fn",
    ],
)
```

همچنین می‌توان چندین فایل دانشجو و چندین فایل ارائه‌شده توسط سوال را با ارائه فهرستی از فایل‌ها، در قالب یک فایل اجرایی واحد کامپایل کرد:

```python
self.compile_file(
    ["student_file1.c", "student_file2.c"],
    "executable",
    add_c_file=["/grade/tests/question_file1.c", "/grade/tests/question_file2.c"],
    flags=["-I/grade/tests", "-I/grade/student"],
)
```

اگر کامپایل شامل فایل‌های هدر (`.h`) باشد، استفاده از فلگ‌های `-I/grade/tests` (برای هدرهای ارائه‌شده توسط سوال) و `-I/grade/student` (برای هدرهای ارائه‌شده توسط دانشجو) نیز توصیه می‌شود. نیازی نیست فایل‌های `.h` به صورت جداگانه به عنوان آرگومان‌های `compile_file` ذکر شوند.

اگر نام فایل اجرایی ارائه نشود، فایل‌ها تنها به فایل‌های آبجکت معادل (با پسوند `.o`) کامپایل می‌شوند. برای لینک کردن این فایل‌ها به یک فایل اجرایی، می‌توان از `link_object_files` استفاده کرد. این تابع سه آرگومان اجباری دریافت می‌کند: فایل‌های آبجکت دانشجو، فایل‌های آبجکت اضافی (که در صورت عدم وجود می‌توان مقدار آن را برابر با `None` قرار داد) و نام فایل اجرایی. این تفکیک امکان تنظیم دقیق‌تر فلگ‌های کامپایل را میان فایل‌های مختلف C یا بین مراحل کامپایل و لینک فراهم می‌کند و همچنین اجازه می‌دهد عملیات دیگری روی فایل‌های آبجکت تولیدشده انجام شود. به عنوان مثال، توالی زیر فایل‌های دانشجو و فایل‌های مدرس را با فلگ‌های متفاوتی کامپایل می‌کند:

```python
self.compile_file(
    ["student_file1.c", "student_file2.c"],
    flags=["-I/grade/tests", "-I/grade/student", "-Wall", "-g"],
)
self.compile_file(
    [],  # No student files in this invocation
    add_c_file=["/grade/tests/question_file1.c", "/grade/tests/question_file2.c"],
    flags=["-I/grade/tests", "-I/grade/student"],
)
self.link_object_files(
    ["student_file1.o", "student_file2.o"],
    ["/grade/tests/question_file1.o", "/grade/tests/question_file2.o"],
    "executable",
)
```

تابع `link_object_files` همچنین آرگومان‌هایی مانند `flags`، `pkg_config_flags`، `add_warning_result_msg=False` و `ungradable_if_failed=False` را با همان کاربرد موجود در `self.compile_file()` یا `self.test_compile_file()` می‌پذیرد.

### محدود کردن استفاده از توابع یا متغیرهای سراسری خاص {#restricting-the-use-of-specific-functions-or-global-variables}

برای سوالاتی که در آن‌ها دانشجویان مجاز به استفاده از مجموعه خاصی از توابع یا متغیرهای سراسری نیستند (برای مثال، دانشجویان مجاز به استفاده از فراخوانی کتابخانه‌ای `system` نباشند)، می‌توان مجموعه‌ای از نمادها (Symbols) را رد کرد. در صورت ارجاع به هر یک از این نمادها در کد، این گزینه خطایی مشابه خطای کامپایل ایجاد می‌کند. تنها فایل‌های دانشجو در برابر این لیست از نمادها بررسی می‌شوند، بنابراین می‌توان همچنان از آن‌ها در کد مدرس استفاده کرد.

```python
self.compile_file(
    ["student_file1.c", "student_file2.c"],
    "executable",
    add_c_file=["/grade/tests/question_file1.c", "/grade/tests/question_file2.c"],
    flags=["-I/grade/tests", "-I/grade/student", "-lrt"],
    reject_symbols=[
        "system",
        "vfork",
        "clone",
        "clone3",
        "posix_spawn",
        "posix_spawnp",
    ],
)
```

### ایجاد نتیجه تست برای فرآیند کامپایل {#creating-a-test-result-for-the-compilation}

برای ایجاد یک نتیجه تست بر اساس خودِ عملیات کامپایل، به جای `self.compile_file()` از `self.test_compile_file()` استفاده کنید. این متد همان آرگومان‌های `self.compile_file()` را می‌پذیرد، اما به‌طور پیش‌فرض تستی به نام «Compilation» با ارزش یک نمره ایجاد می‌کند.

```python
# Compile the file and give one point to student if compilation is successful
self.test_compile_file("square.c", "square")
```

برای تغییر نام و/یا نمره، آرگومان‌های `name` یا `points` را به صورت زیر تنظیم کنید:

```python
self.test_compile_file(
    "square.c", "square", name="Compilation of the first file", points=3
)
```

توجه داشته باشید که اگر می‌خواهید یک نتیجه تست برای کامپایل ایجاد کنید اما قصد ندارید نمره‌ای به آن اختصاص دهید، می‌توانید `points` را روی صفر تنظیم کنید. این حالت در ترکیب با آرگومان `add_warning_result_msg=False` می‌تواند مفید باشد، چرا که در این صورت اخطار به جای پیام اصلی نتایج، در خروجی تست نمایش داده می‌شود.

```python
self.test_compile_file("square.c", "square", points=0, add_warning_result_msg=False)
```

## اجرای برنامه و بررسی خروجی استاندارد آن {#running-a-program-and-checking-its-standard-output}

متد `self.test_run()` را می‌توان برای اجرای یک فایل اجرایی و بررسی خروجی آن استفاده کرد. این برنامه معمولاً همان برنامه‌ای خواهد بود که توسط کامپایلر بالا تولید شده است، اما می‌توان از آن برای هر برنامه‌ای استفاده کرد. برنامه [به عنوان یک کاربر غیرممتاز](#sandbox-execution) اجرا خواهد شد.

تنها آرگومان اجباری، آرگومان `command` است که مربوط به دستوری است که باید اجرا شود. اگر پارامتر اضافی دیگری تنظیم نشود، در صورتی که برنامه در یک محدودیت زمانی مشخص به پایان برسد، تست قبول می‌شود.

```python
self.test_run("./square")
```

### اعتبارسنجی خروجی برنامه اجراشده {#validating-the-output-of-the-executed-program}

با این حال، در اغلب موارد، این برنامه برای بررسی خروجی آن اجرا می‌شود که این کار را می‌توان با قرار دادن آرگومان `exp_output` انجام داد. در ساده‌ترین حالت، `exp_output` می‌تواند به صورت یک رشته واحد ارائه شود، و اگر آن رشته در جایی از خروجی برنامه پیدا شود، تست قبول خواهد شد.

```python
self.test_run("./square", exp_output="SUCCESS")
```

آرگومان `exp_output` همچنین می‌تواند با ارسال فهرستی از رشته‌ها، برای بررسی چندین الگوی خروجی مورد استفاده قرار گیرد. در این حالت، تست به دنبال تمام الگوها در خروجی برنامه می‌گردد و نتیجه تست به فلگ `must_match_all_outputs` بستگی خواهد داشت. این فلگ می‌تواند مقادیر زیر را داشته باشد:

- `must_match_all_outputs="any"`: اگر هر یک از الگوها در خروجی برنامه پیدا شود، تست قبول شده و نمره کامل اختصاص می‌یابد (این حالت پیش‌فرض است). مقدار `False` نیز برای سازگاری با نسخه‌های پیشین پذیرفته می‌شود.
- `must_match_all_outputs="all"`: برای قبولی در تست، تمام الگوها باید در خروجی برنامه یافت شوند. مقدار `True` نیز برای سازگاری با نسخه‌های پیشین پذیرفته می‌شود.
- `must_match_all_outputs="partial"`: نمره اختصاص‌یافته به تست بر اساس تعداد الگوهای یافت‌شده در خروجی برنامه محاسبه می‌شود (برای مثال، اگر از چهار الگو سه الگو پیدا شود، تست ۰٫۷۵ نمره دریافت می‌کند).

```python
# default, either SUCCESS or CORRECT are enough for full points
self.test_run("./square", exp_output=["SUCCESS", "CORRECT"])
# Test passes with 0, 0.5 or 1, depending on if none, one or two patterns are found
self.test_run(
    "./square",
    exp_output=["TEST 1 PASSED", "TEST 2 PASSED"],
    must_match_all_outputs="partial",
)
```

گاهی اوقات یک تست باید اطمینان حاصل کند که برخی رشته‌ها در خروجی برنامه یافت _نمی‌شوند_. این امر با استفاده از آرگومان `reject_output` حاصل می‌شود که آن هم می‌تواند یک آرایه یا یک رشته منفرد باشد.

```python
self.test_run("diff -q output.txt expected.txt", reject_output=["differ"])
```

اگر می‌خواهید در پیام یا خروجی تست، خروجی‌های مورد انتظار و ردشده برجسته (Highlight) شوند، می‌توانید از آرگومان `highlight_matches` استفاده کنید. این گزینه تمام رشته‌هایی را که در خروجی برنامه مطابقت یافته‌اند، با رنگ سبز (برای خروجی‌های مورد انتظار) و قرمز (برای خروجی‌های ردشده) برجسته می‌کند.

```python
self.test_run(
    "./square",
    exp_output=["TEST 1 PASSED", "TEST 2 PASSED"],
    reject_output=["ERROR", "FAIL"],
    must_match_all_outputs="all",
    highlight_matches=True,
)
```

به‌طور پیش‌فرض، هر توالی از نویسه‌های فاصله‌مانند (فاصله، شکست خط، بازگشت مکان‌نما، تب) در خروجی برنامه، رشته‌های خروجی مورد انتظار و خروجی‌های ردشده، برای مقایسه به عنوان یک فاصله منفرد در نظر گرفته می‌شوند. این بدان معناست که تفاوت در تعداد و نوع فاصله‌گذاری نادیده گرفته می‌شود. بنابراین، برای مثال، اگر خروجی دو عدد را به صورت `1 \n 2` چاپ کند، در حالی که خروجی مورد انتظار `1 2` باشد، تست قبول خواهد شد. با این حال، اگر هدف این باشد که فاصله‌ها دقیقاً با الگو مطابقت داشته باشند، می‌توان گزینه `ignore_consec_spaces` را برابر با `False` قرار داد:

```python
self.test_run(
    "./pattern",
    exp_output="  1  2  3\n  4  5  6\n  7  8  9",
    ignore_consec_spaces=False,
)
```

به‌طور پیش‌فرض، تفاوت در بزرگی و کوچکی حروف (Case) نادیده گرفته می‌شود. برای حساس کردن تمام مقایسه‌ها به حروف بزرگ و کوچک، آرگومان `ignore_case` را برابر با `False` قرار دهید:

```python
self.test_run("./lowercase ABC", exp_output="abc", ignore_case=False)
```

هم برای `exp_output` و هم برای `reject_output`، می‌توان از عبارات منظم (Regular Expressions) با ارائه یک شیء الگوی کامپایل‌شده از [ماژول `re` در پایتون](https://docs.python.org/3/library/re.html#re.compile) استفاده کرد. توجه: در صورت استفاده از شیء الگو، آرگومان‌های `ignore_consec_spaces` و `ignore_case` اعمال نخواهند شد. اگر لازم است این الگوها فاصله‌های متوالی را نادیده بگیرند، می‌توان از الگویی مانند `\\s+` به جای فاصله‌ها استفاده کرد، و با استفاده از [فلگ `re.I`](https://docs.python.org/3/library/re.html#re.I) بزرگی و کوچکی حروف را نادیده گرفت:

```python
self.test_run(
    "./valid_date",
    exp_output=re.compile("([12]\d{3}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01]))"),
)
```

### ارسال ورودی به برنامه در حال اجرا {#providing-input-to-the-executed-program}

به این متد همچنین می‌توان از طریق آرگومان `input` یک رشته ورودی برای ارسال به ورودی استاندارد برنامه ارائه کرد:

```python
self.test_run("./square", input="3\n", exp_output="9")
```

برای استفاده از آرگومان‌های خط فرمان برای یک دستور، می‌توان آرگومان‌ها را مستقیماً در خودِ `command` قرار داد یا از طریق آرگومان `args` ارائه کرد که می‌تواند یک آرگومان منفرد به صورت رشته یا چندین آرگومان در قالب یک لیست باشد:

```python
self.test_run("./square 3 5", exp_output=["9", "25"], must_match_all_outputs="all")
self.test_run("./square", args="3", exp_output="9")
self.test_run(
    "./square", args=["3", "5"], exp_output=["9", "25"], must_match_all_outputs="all"
)
```

### محدود کردن زمان اجرا و حجم خروجی {#limiting-the-execution-time-and-output-size}

برای جلوگیری از مشکلاتی که ناشی از طولانی‌تر شدن اجرای کد دانشجو نسبت به حد انتظار است (مانند حلقه‌های بی‌نهایت)، برنامه پس از یک ثانیه با پایان مهلت زمانی (Timeout) مواجه خواهد شد. در این حالت، تست ناموفق در نظر گرفته می‌شود. این تنظیم را می‌توان با آرگومان `timeout` که باید برابر با تعداد ثانیه‌ها باشد، تغییر داد:

```python
self.test_run("./slowprogram", exp_output="COMPLETED", timeout=10)
```

برای جلوگیری از مشکلاتی ناشی از تولید خروجی‌های بسیار بزرگ توسط کد دانشجو که مدیریت آن‌ها برای PrairieLearn دشوار است، به‌طور پیش‌فرض هر برنامه‌ای با خروجی بیش از ۱۰ کیلوبایت (دقیق‌تر: ۱۰۲۴۰ نویسه) ناموفق شده و خروجی آن کوتاه (Truncate) می‌شود. برای تغییر این محدودیت، از آرگومان `size_limit` استفاده کنید که باید بر حسب تعداد نویسه‌ها تنظیم شود:

```python
self.test_run("./verboseprogram", exp_output="COMPLETED", size_limit=102400)
```

### تنظیم نام تست، پیام و نمره سفارشی {#setting-a-custom-test-name-message-and-points}

تست ایجاد شده و به کاربر نشان داده می‌شود که به‌طور پیش‌فرض ارزش آن ۱ نمره است. نام پیش‌فرض برای تستی که شامل آرگومان `input` است، برابر است با: `Test with input "<INPUT>"` (که در آن `INPUT` همان ورودی ارائه‌شده است). برای تستی که از `args` استفاده می‌کند، نام پیش‌فرض برابر است با `Test with arguments "<ARGS>"` (که در آن `ARGS` مجموعه‌ای از آرگومان‌هاست که با فاصله از هم جدا شده‌اند). همچنین پیامی شامل خلاصه‌ای از خروجی‌های مورد انتظار و ردشده درج خواهد شد. برای تغییر این تنظیمات، از آرگومان‌های `max_points`، `msg` و/یا `name` استفاده کنید:

```python
self.test_run(
    "diff -q output.txt expected.txt",
    reject_output=["differ"],
    name="Comparing final output",
    max_points=3,
    msg="Output file should match expected file.",
)
```

## اجرای یک مجموعه تست فریم‌ورک Check {#running-a-check-framework-test-suite}

برای تست‌هایی که شامل سناریوهای پیچیده‌تر هستند، به‌ویژه مواردی که به فراخوانی توابع منفرد و تست‌های واحد مربوط می‌شوند، نمره‌دهنده خودکار C امکان یکپارچه‌سازی با نسخه‌ای تغییریافته از [فریم‌ورک Check](https://libcheck.github.io/check/) را فراهم می‌کند. این فریم‌ورک قابلیت اجرای چندین مجموعه تست (Test suites) و مورد آزمون (Test cases) را همراه با تست‌های واحد مجزا فراهم می‌آورد. همچنین قادر است با اجرای تست‌های واحد در یک فرآیند ایزوله، سیگنال‌ها (مانند خطای Segmentation fault) را دریافت و مدیریت کند.

برای اجرای یک مجموعه Check، یک فایل اصلی C در دایرکتوری `tests` ایجاد کنید که شامل تست‌ها و یک تابع `main` برای اجرای مجموعه Check باشد. این فایل C ممکن است به این شکل باشد:

```c title="main.c"
#include <check.h>

extern int factorial(int x);

START_TEST(test_factorial) {
    ck_assert_int_eq(factorial(0), 1);
    ck_assert_int_eq(factorial(1), 1);
    ck_assert_int_eq(factorial(2), 2);
    ck_assert_int_eq(factorial(5), 120);
    ck_assert_int_eq(factorial(10), 3628800);
}
END_TEST

int main(void) {
    Suite *s = suite_create("factorial");

    TCase *tc_factorial = tcase_create("Check factorial return value");
    tcase_add_test(tc_factorial, test_factorial);
    suite_add_tcase(s, tc_factorial);

    SRunner *sr = srunner_create(s);
    srunner_run_all(sr, CK_NORMAL);
    srunner_free(sr);
    return 0;
}
```

آموزشی همراه با دستورالعمل‌های نحوه ایجاد مجموعه‌های تست، موارد آزمون و تست‌های واحد را می‌توانید در [مستندات رسمی Check](https://libcheck.github.io/check/doc/check_html/check_3.html#Tutorial) بیابید. درس نمونه نیز شامل [سوالات پایه‌ای](https://github.com/PrairieLearn/PrairieLearn/tree/master/exampleCourse/questions/demo/autograder/c) است که می‌تواند به عنوان نقطه شروع استفاده شود.

!!! note "توجه"

    توجه داشته باشید که قابلیت کار با فریم‌ورک Check به [ویژگی‌های ثبت گزارش تست (Test logging)](https://libcheck.github.io/check/doc/check_html/check_4.html#Test-Logging) آن وابسته است. برای اطمینان از اینکه تست‌ها به درستی توسط نمره‌دهنده خودکار ثبت می‌شوند، نباید فایل‌های گزارش را رونویسی کنید.

یک فایل نمونه `test.py` برای یک مجموعه مبتنی بر Check شبیه به این خواهد بود، با این فرض که `student_code.c` شامل کد دانشجو است و `/grade/tests/main.c` شامل تست‌های Check مشابه مثال بالا می‌باشد:

```python title="test.py"
import cgrader


class DemoGrader(cgrader.CGrader):
    def tests(self):
        self.compile_file(
            "student_code.c",
            "main",
            add_c_file="/grade/tests/main.c",
            # The following must be included if compiling a Check test
            pkg_config_flags="check",
        )
        self.run_check_suite("./main")


g = DemoGrader()
g.start()
```

برای کامپایل کد دانشجو و مجموعه تست، از متدهای `self.compile_file()` یا `self.test_compile_file()` که در بالا توضیح داده شدند استفاده کنید. اطمینان حاصل کنید که آرگومان `pkg_config_flags` شامل کتابخانه `check` باشد تا کامپایل به درستی انجام گیرد.

متد `self.run_check_suite()` فایل اجرایی حاوی مجموعه‌های تست Check را فراخوانی می‌کند، فایل‌های لاگ را تجزیه کرده و برای هر تست واحد که توسط مجموعه‌های Check اجرا می‌شود، یک تست در نمره‌دهنده خودکار ایجاد می‌کند. برای هر تست واحد درون هر مورد آزمون یک نتیجه تست ایجاد می‌شود، بنابراین می‌توانید به تعداد دلخواه مورد آزمون و تست واحد ایجاد کنید تا جزئیات بیشتری به دانشجویان ارائه دهید. نام تست معمولاً نام مورد آزمون Check و به دنبال آن شناسه تست واحد خواهد بود، هرچند می‌توان این مورد را با تنظیم آرگومان‌های زیر روی `True` یا `False` تغییر داد:

- `use_suite_title`: استفاده از عنوان مجموعه تست در نام تست (پیش‌فرض: `false`)؛
- `use_case_name`: استفاده از نام مورد آزمون در نام تست (پیش‌فرض: `true`)؛
- `use_unit_test_id`: استفاده از شناسه تست واحد در نام تست (پیش‌فرض: `true`)؛
- `use_iteration`: برای تست‌هایی که درون یک حلقه اجرا می‌شوند، درج شماره تکرار در نام تست (پیش‌فرض: `false`).

```python
self.run_check_suite("./main", use_suite_title=True, use_unit_test_id=False)
```

نسخه Check مورد استفاده در نمره‌دهنده خودکار اندکی تغییر یافته تا تدابیر امنیتی بیشتری در برابر کدهای مخرب دانشجویان در نظر گرفته شود. این تدابیر حفاظتی، دسترسی فرآیندهای در حال اجرای تست‌های واحد به گزارش‌های تست و سایر منابع را محدود می‌کنند. برای اطمینان از اینکه این تدابیر حفاظتی طبق انتظار عمل می‌کنند، برنامه تست شما:

- باید وضعیت پیش‌فرض fork در Check را فعال نگه دارد، یعنی حالت «No Fork Mode» را تنظیم نکنید.
- باید هرگونه فایل یا منبع شبیه به فایل را درون خودِ تست واحد یا در فیکسچرهای بررسی‌شده (Checked fixtures) باز کند. فایل‌ها را در فیکسچرهای بررسی‌نشده یا در برنامه اصلی باز نکنید.
- نباید برای هیچ‌یک از برنامه‌های دانشجو به متغیرهای محیطی اتکا کند. در صورت نیاز به متغیرهای محیطی، آن‌ها را به صورت دستی در خودِ تست واحد یا در فیکسچرهای بررسی‌شده تنظیم نمایید.

اگر برنامه شما به صراحت نیاز به حفظ هر یک از محیط‌های محدودشده بالا دارد، می‌توانید برخی از این تدابیر حفاظتی را در کد خود غیرفعال کنید. _توجه داشته باشید که غیرفعال کردن این تدابیر امنیتی احتمال دور زدن تست‌های واحد و نمره‌دهنده خودکار توسط دانشجو را افزایش می‌دهد_، بنابراین این کار را تنها در صورت ضرورت قطعی انجام دهید. می‌توانید این کار را با تنظیم دستورات پیش‌پردازنده زیر _در ابتدای کد تست خود_ (قبل از `#include <check.h>`) انجام دهید:

```c
// Use this directive to retain file descriptors opened by the test application or unchecked fixtures
#define PLCHECK_KEEP_FD

// Use this directive to run the unit test applications as root
#define PLCHECK_KEEP_UID

// Use this directive to retain environment variables
#define PLCHECK_KEEP_ENV

// Use this directive to have the unit test process remain a direct child of the test application
#define PLCHECK_NO_EXTRA_FORK
```

## شناسایی اشاره‌گرهای معلق، نشت حافظه و مسائل مشابه {#identifying-dangling-pointers-memory-leaks-and-similar-issues}

یکی از دغدغه‌های اصلی هنگام تست کد C/C++، شناسایی مواردی از اشاره‌گرهای معلق (Dangling pointers) و نشت حافظه (Memory leaks) است. کتابخانه [AddressSanitizer](https://github.com/google/sanitizers/wiki/AddressSanitizer) می‌تواند برای این منظور در این نمره‌دهنده خودکار مورد استفاده قرار گیرد. به ویژه، این ابزار قادر به تشخیص موارد زیر است: استفاده پس از آزادسازی (use-after-free) و استفاده پس از بازگشت تابع (use-after-return)؛ دسترسی خارج از محدوده (out-of-bounds) در حافظه هیپ، استک و آرایه‌های سراسری؛ و نشت حافظه.

برای افزودن این کتابخانه به کد، گزینه زیر را به تابع کامپایل (`compile_file`، `test_compile_file` یا `link_object_files`) اضافه کنید:

```python
self.compile_file(..., enable_asan=True)
```

به‌طور پیش‌فرض، گزینه‌های فوق کد را با فلگ‌هایی کامپایل می‌کنند که باعث می‌شود برنامه بلافاصله پس از شناسایی دسترسی نامعتبر به حافظه، یا پیش از خروج در صورت بروز نشت حافظه متوقف (Abort) شود. اگر از گردش کاری نمره‌دهنده خودکاری استفاده می‌کنید که خروجی استاندارد برنامه را بررسی می‌کند، این قابلیت باید اکثر موارد را به دام اندازد، هرچند ممکن است بخواهید چند رشته ردشده (Reject strings) را برای ثبت نشت‌های حافظه اضافه کنید. برای مثال:

```python
self.test_run(..., reject_output=["AddressSanitizer"])
```

اگر از گردش کاری مبتنی بر Check استفاده می‌کنید، توجه داشته باشید که اگرچه پیکربندی بالا باعث مردود شدن تست‌ها در این سناریوها می‌شود، اما ممکن است پیام مفیدی را به دانشجویان نمایش ندهد. برای ارائه بازخورد دقیق‌تر به دانشجویان در این حالت، اکیداً توصیه می‌شود که فراخوانی `pl_setup_asan_hooks()` را در ابتدای تابع اصلی (main) خود اضافه کنید، مانند زیر:

```c
int main(int argc, char *argv[]) {

  pl_setup_asan_hooks();
  Suite *s = suite_create(...);
  // ...
}
```

اگر به کنترل دقیق‌تری بر زمان و مکان وقوع این مشکلات دسترسی به حافظه نیاز دارید، می‌توانید از رابط ASAN برای کنترل بیشتر استفاده کنید. به عنوان مثال، اگر می‌خواهید وضعیت تک‌تک اشاره‌گرها را بررسی کنید تا مشخص شود که آیا به درستی تخصیص یافته‌اند یا خیر، می‌توانید از `__asan_address_is_poisoned` یا `__asan_region_is_poisoned` استفاده کنید:

```c
  ck_assert_msg(__asan_address_is_poisoned(deleted_node), "Deleted node has not been freed");
  ck_assert_msg(!__asan_address_is_poisoned(other_node), "Node other than the first element has been freed");
  ck_assert_msg(!__asan_region_is_poisoned(new_node, sizeof(struct node)), "Node was not allocated with appropriate size");
```

همچنین می‌توان با تنظیم متغیر محیطی `ASAN_OPTIONS` هنگام فراخوانی `run_check_suite`، [فلگ‌های خاصی را تنظیم کرد](https://github.com/google/sanitizers/wiki/AddressSanitizerFlags) تا رفتار AddressSanitizer تغییر یابد. برای مثال، برای غیرفعال کردن بررسی نشت حافظه، می‌توانید از کد زیر استفاده کنید:

```python
self.run_check_suite("./main", env={"ASAN_OPTIONS": "detect_leaks=0"})
```

## اجرای یک دستور بدون ایجاد تست {#running-a-command-without-creating-a-test}

همچنین امکان اجرای دستوری که مستقیماً به یک تست خاص مرتبط نیست نیز وجود دارد. این کار را می‌توان با متد `self.run_command()` انجام داد که در کمترین حالت یک دستور را به عنوان آرگومان دریافت می‌کند. این دستور می‌تواند یک رشته منفرد با یا بدون آرگومان‌ها، یا آرایه‌ای از رشته‌ها باشد که شامل نام فایل اجرایی به عنوان اولین عنصر و آرگومان‌ها پس از آن است. این متد رشته‌ای شامل خروجی استاندارد (و خطای استاندارد) تولیدشده توسط برنامه را برمی‌گرداند:

```python
files = self.run_command("ls -alR /grade")
files = self.run_command(["ls", "-alR", "/grade"])
```

دستور به‌طور پیش‌فرض به عنوان [کاربر سندباکس‌شده (محیط ایزوله)](#sandbox-execution) اجرا می‌شود. اگر نیاز دارید که دستور را با دسترسی `root` کانتینر (همان کاربری که خودِ اسکریپت تست را اجرا می‌کند) اجرا نمایید، می‌توانید آرگومان `sandboxed` را برابر با `False` قرار دهید (این کار به هیچ وجه برای برنامه‌های ارائه‌شده توسط دانشجو توصیه نمی‌شود):

```python
result = self.run_command("rm -rf testfile.txt", sandboxed=False)
```

برای ارائه رشته‌ای که به عنوان ورودی استاندارد برنامه استفاده شود، از آرگومان `input` استفاده کنید:

```python
result = self.run_command("./square", input="3\n")
```

برای اطمینان از اینکه برنامه تا ابد اجرا نمی‌شود، می‌توانید گزینه `timeout` را تنظیم کنید که محدودیت زمانی را بر حسب ثانیه تعیین می‌کند. اگر برنامه در این بازه زمانی به پایان نرسد، متد یک پیام خطای زمان استاندارد (Timeout) را برمی‌گرداند. اکیداً توصیه می‌شود که کدهای ارائه‌شده توسط دانشجو همواره با تنظیم محدودیت زمانی اجرا شوند:

```python
result = self.run_command("./square", timeout=1)
```

اگر برنامه به متغیرهای محیطی خاصی نیاز دارد، می‌توانید آرگومان `env` را تنظیم کنید. این آرگومان باید به صورت یک دیکشنری (`dict`) کلید-مقدار ارائه شود:

```python
result = self.run_command("./square", env={"TEMP_FILE": "/tmp/my_temp.dat"})
```

## افزودن دستی نتایج تست {#manually-adding-test-results}

متدهایی مانند `self.test_compile_file()` و `self.test_run()` یک نتیجه تست جدید ایجاد می‌کنند که به کاربر نمایش داده خواهد شد. همچنین می‌توان بر اساس محاسبات جداگانه، تست‌های سفارشی خود را با متد `self.add_test_result()` ایجاد کرد. ساده‌ترین حالت فراخوانی این متد تنها با نام تست است که یک تست قبول‌شده با ارزش یک نمره، بدون پیام، بدون خروجی و بدون توضیحات ایجاد خواهد کرد:

```python
self.add_test_result("Bonus point for submitting something!")
```

همچنین می‌توانید به صورت اختیاری توضیحات (Description)، پیام (Message) و خروجی (Output) را به تست اضافه کنید:

```python
self.add_test_result(
    "Bonus point for submitting something!",
    description="This is for all my students, thank you for submitting.",
    msg="Nothing to be expected.",
    output=submitted_answer,
)
```

برای تنظیم میزان نمره‌ای که تست به آن تعلق می‌گیرد و/یا حداکثر نمره آن، از آرگومان‌های `points` و `max_points` استفاده کنید. مقدار `max_points` باید یک عدد (صحیح یا اعشاری) باشد و در صورت عدم ارائه، پیش‌فرض آن برابر با `1` است. آرگومان `points` می‌تواند یک عدد باشد که بر مبنای حداکثر نمره محاسبه می‌شود؛ یا می‌توانید `points` را با یک عبارت بولی‌مانند (Boolean-like) مقداردهی کنید که در این صورت اگر عبارت `False` باشد مقدار `points` برابر با 0 و اگر `True` باشد برابر با `max_points` خواهد شد:

```python
self.add_test_result("I am lazy, everyone gets 70%", points=70, max_points=100)
```

این متد همچنین به شما امکان می‌دهد یک یا چند تصویر را به نتیجه اضافه کنید. تصاویر باید از فرمت شرح داده شده در مستندات [نمره‌دهی خارجی](../externalGrading.md) پیروی کنند:

```python
self.add_test_result("Generated image", points=matched_pixels,
                     max_points=total_pixels,
                     images=[{"label": "Your image", "url": dataURI},
                             {"label": "Expected image", "url": expectedURI})
```

## اجرای سندباکس (محیط ایزوله) {#sandbox-execution}

نمره‌دهنده خودکار به گونه‌ای پیکربندی شده است که امکان اجرای برنامه‌ها را به صورت کاربر root یا به عنوان یک کاربر غیرممتاز فراهم می‌کند. این ویژگی برای اطمینان از این موضوع در نظر گرفته شده که دانشجو نتواند محیط تست را دستکاری کرده یا نمره خود را به صورت دستی در کانتینر تغییر دهد.

به‌طور پیش‌فرض، کاربر سندباکس به هیچ فایلی درون پوشه `/grade` در کانتینر دسترسی نخواهد داشت. اگر انتظار می‌رود برنامه‌ای که در این محیط اجرا می‌شود به فایل خاصی دسترسی داشته باشد، باید این دسترسی صراحتاً به کاربر اعطا شود. این کار با استفاده از متد `change_mode()` انجام می‌شود که دو آرگومان دریافت می‌کند: نام/مسیر فایل و حالت دسترسی (Mode) که باید تنظیم شود:

```python
self.change_mode("/grade/student/myfile.txt", "744")
```

به هر برنامه‌ای که با `test_compile_file()` کامپایل شود، مجوزهای اجرایی (حالت `755`) اعطا خواهد شد؛ بنابراین نیازی نیست دسترسی این برنامه‌ها صراحتاً توسط تست‌های شما مجاز اعلام شود.

همان‌طور که در سیستم‌های شبه‌یونیکس متداول است، ایجاد فایل‌های جدید مستلزم داشتن مجوز نوشتن در دایرکتوری محل ایجاد فایل است. بنابراین، اگر انتظار می‌رود برنامه‌ای فایل‌های جدیدی در یک دایرکتوری خاص ایجاد کند، باید مجوز نوشتن به آن دایرکتوری نیز داده شود. باید از اعطای مجوز نوشتن به دایرکتوری‌های سیستمی مانند `/grade` یا `/grade/tests` خودداری کنید، چرا که در غیر این صورت دانشجویان ممکن است بتوانند محیط سندباکس را دور بزنند. در عوض، زیرپوشه‌های مشخصی برای فایل‌های دانشجو ایجاد کرده و فقط به همان دایرکتوری‌ها مجوز نوشتن بدهید. همچنین ممکن است بخواهید دایرکتوری کاری فعلی را به آن دایرکتوری تغییر دهید، که این کار با متد `os.chdir()` قابل انجام است:

```python
self.run_command("mkdir -p /tmp/sbdir", sandboxed=False)
self.change_mode("/tmp/sbdir", "777")
os.chdir("/tmp/sbdir")
```

توجه داشته باشید که تغییر دایرکتوری کاری روی نحوه فراخوانی برنامه‌های دانشجو نیز تأثیر می‌گذارد. این معمولاً به این معنی است که در هر بار اجرای برنامه دانشجو، باید پیشوند معمول `./` با دایرکتوری که فایل دانشجو در اصل در آن کامپایل شده است (که به‌طور پیش‌فرض `/grade/student/` است) جایگزین شود. به عنوان مثال، اگر فرآیند کامپایل قبل از دستورات فوق انجام شده باشد، برای اجرای برنامه دانشجویی به نام `myprog` باید از دستور زیر استفاده شود:

```python
self.test_run("/grade/student/myprog", ...)
```

همچنین استفاده از کتابخانه `tempfile` برای ایجاد فایل‌ها و دایرکتوری‌های موقتی که کد دانشجو ممکن است از آن‌ها استفاده کند، توصیه می‌شود. توجه داشته باشید که هر فایل یا دایرکتوری ایجادشده با این کتابخانه به‌طور پیش‌فرض برای کاربر سندباکس قابل دسترسی نخواهد بود، بنابراین باید همان‌طور که در بالا نشان داده شد، مجوز دسترسی آن را صراحتاً تغییر دهید.
