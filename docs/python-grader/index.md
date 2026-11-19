# نمره‌دهنده خودکار Python

این سند به تشریح نمره‌دهنده خودکار پیش‌فرض Python موجود در ایمیج داکر `prairielearn/grader-python` می‌پردازد. برای اطلاعات کلی در مورد نحوه راه‌اندازی یک نمره‌دهنده خارجی، مستندات [نمره‌دهی خارجی](../externalGrading.md) را مشاهده کنید.

## راه‌اندازی {#setting-up}

### `info.json`

ابتدا باید سوال را برای فعال‌سازی [نمره‌دهی خارجی](../externalGrading.md) تنظیم کرد، به این صورت که `"gradingMethod": "External"` در تنظیمات `info.json` قرار گیرد. برای استفاده از نمره‌دهنده خودکار خاص Python که در این سند شرح داده شده است، مقدار `"image"` باید در دیکشنری `"externalGradingOptions"` برابر با `"prairielearn/grader-python"` تنظیم شود. نیازی به ارائه مشخصه `entrypoint` نیست.

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
    "image": "prairielearn/grader-python"
  }
}
```

### متغیرهای کاربر {#user-variables}

سوال باید متغیرهایی را که برای نمره‌دهی از کد دانشجو خوانده می‌شوند (`names_from_user`) مشخص کند. به صورت اختیاری، سوال همچنین می‌تواند متغیرهایی را که از طریق کد راه‌اندازی سوال در دسترس کد دانشجو قرار می‌گیرند (`names_for_user`) مشخص نماید. تنها متغیرها یا توابعی که در `names_for_user` فهرست شده‌اند از طریق کد راه‌اندازی برای کاربر در دسترس خواهند بود؛ و تنها نام‌های فهرست‌شده در `names_from_user` توسط موارد آزمون (Test cases) از کد کاربر قابل دسترسی خواهند بود.

هر متغیر باید دارای موارد زیر باشد:

- `name`: نام متغیر در کد دانشجو.
- `description`: توضیح خوانا برای انسان درباره متغیر.
- `type`: توصیف خوانا برای انسان از نوع متغیر. این مورد تنها برای اهداف نمایشی استفاده می‌شود و بر نمره‌دهی تأثیری ندارد.

دو روش برای تعیین این متغیرها وجود دارد:

=== "`question.html`"

    المان `<pl-external-grader-variables>` می‌تواند هم برای تعیین و هم برای نمایش جدولی از متغیرها استفاده شود.

    ```html title="question.html"
    <pl-external-grader-variables params-name="names_for_user">
      <pl-variable name="n" type="integer">
        Dimensionality of $\mathbf{A}$ and $\mathbf{b}$.
      </pl-variable>
      <pl-variable name="A" type="numpy array (shape $n \times n$)"> Matrix $\mathbf{A}$. </pl-variable>
      <pl-variable name="b" type="numpy array (length $n$)"> Vector $\mathbf{b}$. </pl-variable>
    </pl-external-grader-variables>

    <pl-external-grader-variables params-name="names_from_user">
      <pl-variable name="x" type="numpy array (length $n$)">
        Solution to $\mathbf{Ax}=\mathbf{b}$.
      </pl-variable>
    </pl-external-grader-variables>
    ```

=== "`server.py`"

    استفاده از `<pl-external-grader-variables>` در `question.html` روش توصیه‌شده برای مشخص کردن متغیرهای کاربر است. با این حال، اگر نیاز به تولید پویای فهرست متغیرها یا نیازهای پیشرفته‌تری دارید، می‌توانید این کار را مستقیماً در `server.py` با مقداردهی به `data["params"]["names_for_user"]` و `data["params"]["names_from_user"]` نیز انجام دهید. مثال زیر معادل مثال قبلی `question.html` است:

    ```python title="server.py"
    def generate(data):
        data["params"]["names_for_user"] = [
            {
                "name": "n",
                "description": r"Dimensionality of $\mathbf{A}$ and $\mathbf{b}$.",
                "type": "integer",
            },
            {"name": "A", "description": r"Matrix $\mathbf{A}$.", "type": "numpy array"},
            {"name": "b", "description": r"Vector $\mathbf{b}$.", "type": "numpy array"},
        ]
        data["params"]["names_from_user"] = [
            {
                "name": "x",
                "description": r"Solution to $\mathbf{Ax}=\mathbf{b}$.",
                "type": "numpy array",
            }
        ]
    ```

    شما همچنان می‌توانید از `<pl-external-grader-variables>` برای نمایش متغیرها به دانشجویان استفاده کنید؛ کافی است المان‌های تودرتوی `<pl-variable>` را حذف کنید:

    ```html title="question.html"
    <pl-external-grader-variables params-name="names_for_user"></pl-external-grader-variables>
    <pl-external-grader-variables params-name="names_from_user"></pl-external-grader-variables>
    ```

### `question.html`

سوال باید راهی برای ارسال فایل‌ها توسط دانشجویان داشته باشد، مانند `<pl-file-editor>`، `<pl-file-upload>`، یا یک محیط کاری (Workspace). سوال همچنین باید حاوی یک المان `<pl-external-grader-results>` باشد تا نتایج نمره‌دهی را نمایش دهد. این المان‌ها به ترتیب در پانل سوال و پانل پاسخ ارسالی قرار می‌گیرند. همچنین توصیه می‌شود که یک المان `<pl-file-preview>` در پانل پاسخ ارسالی قرار داده شود تا دانشجویان بتوانند کدهای ارسالی قبلی خود را مشاهده کنند. یک نمونه نشانه‌گذاری سوال در زیر آمده است:

```html title="question.html"
<pl-question-panel>
  <pl-file-editor file-name="user_code.py" ace-mode="ace/mode/python"></pl-file-editor>
</pl-question-panel>

<pl-submission-panel>
  <pl-external-grader-results></pl-external-grader-results>
  <pl-file-preview></pl-file-preview>
</pl-submission-panel>
```

به‌طور پیش‌فرض، نمره‌دهنده به دنبال یک فایل قابل نمره‌دهی با نام `user_code.py` می‌گردد، اما این نام در مجموعه تست قابل تغییر است.

متغیرهای ارائه‌شده و/یا مورد انتظار را می‌توان با المان `<pl-external-grader-variables>` نیز به کاربر نمایش داد. با تنظیم ویژگی `params-name` روی `names_for_user` یا `names_from_user`، هر کدام از این مجموعه‌های متغیر قابل نمایش خواهند بود.

### `tests/setup_code.py`

این فایل قبل از اجرای هرگونه کد مرجع یا کد دانشجو اجرا می‌شود. هر متغیری که در `names_for_user` تعریف شده باشد از اینجا در کد دانشجو قابل دسترسی است، در حالی که پاسخ مرجع می‌تواند آزادانه و بدون محدودیت به متغیرها دسترسی داشته باشد. کد موجود در این فایل در مجموع فقط _یک‌بار_ برای هر دو کد دانشجو و مرجع اجرا می‌شود. اگر نیاز دارید کدی را قبل از اجرای هر یک از کدهای دانشجو و مرجع اجرا کنید (برای مثال، جهت تنظیم seed تصادفی)، می‌توانید تابع `def repeated_setup()` را تعریف کنید که قبل از هر دوی آن‌ها اجرا خواهد شد. تابع `repeated_setup()` همیشه پس از اجرای خودِ کد راه‌اندازی (setup code) اجرا می‌شود.

پارامترهای سرور در `data` از طریق `data` در این فایل قابل دسترسی هستند.

### `tests/test.py`

موارد آزمون (Test cases) برای هر مسئله برنامه‌نویسی به عنوان متدهای یک کلاس `Test` درون فایل `test.py` تعریف می‌شوند. این کلاس بسته به اینکه آیا از دانشجو نمودار (Plot) می‌خواهید یا خیر، از `PLTestCase` یا `PLTestCaseWithPlot` ارث‌بری می‌کند:

```python title="tests/test.py"
from pl_unit_test import PLTestCase, PLTestCaseWithPlot


# No plot grading
class Test(PLTestCase):
    pass


# Plot grading enabled
class Test(PLTestCaseWithPlot):
    pass
```

این کلاس‌ها خود از `unittest.TestCase` ارث‌بری می‌کنند، بنابراین تمام قابلیت‌های آن نیز در دسترس است.

هر مورد آزمون یک متد مجزا در کلاس است؛ نام این توابع باید با پیشوند `test_` آغاز شود، اما هر نامی پس از آن اختیاری است. موارد آزمون با ترتیب مرتب‌شده توسط کتابخانه `unittest` اجرا می‌شوند، بنابراین یک قرارداد معمول این است که به تست‌ها نام‌های عددی اختصاص دهید تا از ترتیب اجرای آن‌ها اطمینان حاصل شود.

افزودن نام و ارزش نمره به مورد آزمون با استفاده از دکوراتورهای پایتون انجام می‌شود: `@points(val)` و `@name("name of the test case")`. این دکوراتورها نام مورد آزمون نمایش‌داده‌شده به دانشجویان و نمره اختصاص‌یافته را کنترل می‌کنند. نمونه‌ای از یک تعریف:

```python title="tests/test.py"
from pl_unit_test import PLTestCase
from pl_helpers import name, points


class Test(PLTestCase):
    @points(10)
    @name("Check basic math")
    def test_0(self):
        assert 1 == 1
```

در داخل پیاده‌سازی مورد آزمون، متغیرهای پاسخ دانشجو و متغیرهای پاسخ مرجع به ترتیب به عنوان زیرمجموعه‌های تاپل‌های `self.st` و `self.ref` قابل دسترسی هستند. توابع کمکی مختلفی برای بررسی درستی انواع مختلف متغیرها وجود دارند که در `code_feedback.py` تعریف شده‌اند. این توابع از نمره‌دهنده RELATE برگرفته شده‌اند، بنابراین ممکن است برای کسانی که تجربه قبلی کار با RELATE دارند آشنا باشند.

در پایان مورد آزمون، درستی پاسخ را با استفاده از `feedback.set_score()` تعیین کنید. این تابع یک عدد اعشاری بین ۰ و ۱ (شامل هر دو) می‌گیرد؛ به‌طوری‌که ۰ به معنای کاملاً *نادرست* و ۱ به معنای کاملاً درست است. به‌طور پیش‌فرض، اگر هیچ نمره‌ای داده نشود، مورد آزمون به عنوان نادرست علامت‌گذاری خواهد شد.

ساختار کلی یک مورد آزمون باید شبیه به این باشد:

```python title="tests/test.py"
from pl_unit_test import PLTestCase
from pl_helpers import name, points
from code_feedback import Feedback


class Test(PLTestCase):
    @points(10)
    @name("name of the test case")
    def test_0(self):
        if Feedback.check_scalar(
            "name of the variable", self.ref.variable_name, self.st.variable_names
        ):
            Feedback.set_score(1)
        else:
            Feedback.set_score(0)
```

توجه داشته باشید که `Feedback.set_score()` برای تعیین میزان درستی مورد آزمون بین `0` و `1` استفاده می‌شود، و سپس این ضریب در تعداد نمرات اختصاص‌یافته به مورد آزمون ضرب می‌شود. به عنوان مثال، اگر یک مورد آزمون دارای ۱۰ نمره باشد و `Feedback.set_score(0.5)` اجرا شود، به دانشجو ۵ نمره تعلق خواهد گرفت.

پارامترهای سرور در `data` از درون موارد آزمون با استفاده از `self.data` قابل دسترسی هستند.

برای مشاهده فهرستی از توابعی که می‌توانند به شما در بررسی درستی انواع مختلف متغیرها کمک کنند، به [مستندات بازخورد کد](#code-feedback) مراجعه کنید.

### کدهای مقدماتی و موخره (Leading and trailing code) {#leading-and-trailing-code}

اگر فایل‌های اختیاری `tests/leading_code.py` و/یا `tests/trailing_code.py` وجود داشته باشند، نمره‌دهنده خودکار پیش از نمره‌دهی، محتوای آن‌ها را به‌طور خودکار به ابتدا و انتهای پاسخ ارسالی کاربر اضافه (Prepend و Append) می‌کند. این قابلیت در صورتی که از روش‌های ورودی جایگزین استفاده شود (مثلاً برای سوالات مسائل پالسون جهت ارائه importهای پایتون یا کدهای دیگری که باید اجرا شوند) می‌تواند مفید باشد.

### استفاده از `__name__ == "__main__"` {#using-name-main}

به‌طور پیش‌فرض، کد دانشجو با مقدار `"__main__"` برای `__name__` اجرا نمی‌شود، برخلاف آنچه معمولاً در اسکریپت‌های پایتونی که مستقیماً به عنوان اسکریپت اجرا می‌شوند رخ می‌دهد. این امر به دانشجویان امکان می‌دهد از کدی شبیه به زیر برای تست و دیباگ کد خود در محیط محلی بدون تأثیر گذاشتن بر عملکرد نمره‌دهنده خودکار استفاده کنند:

```python title="Student handout they are editing"
if __name__ == "__main__":
    # Student's own debugging code
```

از سوی دیگر، اگر در سوالی انتظار می‌رود که دانشجو کدی بنویسد که مقدار `__name__` را بررسی کند، می‌توان این کار را با افزودن [فایل `tests/leading_code.py`](#leading-and-trailing-code) با محتوای زیر انجام داد:

```python title="tests/leading_code.py"
__name__ = "__main__"
```

### تکرارهای متعدد {#multiple-iterations}

با تنظیم متغیر کلاسی `total_iters`، مجموعه تست می‌تواند برای چندین تکرار اجرا شود. برای جلوگیری از اجرای چندباره یک مورد آزمون خاص، می‌توانید دکوراتور `@not_repeated` را به آن اضافه کنید.

### بازخورد کد {#code-feedback}

کتابخانه بازخورد کد (Code feedback) حاوی توابع درون‌ساختی برای بررسی درستی انواع داده‌های مختلف است. در اینجا فهرستی غیرجامع از آن‌ها آورده شده است؛ برای مرجع کامل‌تر به [مستندات مرجع خودکار](reference-docs.md) یا [فایل منبع در گیت‌هاب](https://github.com/PrairieLearn/PrairieLearn/blob/master/graders/python/python_autograder/code_feedback.py) مراجعه کنید. توجه داشته باشید که تمام توابع نوعی بررسی سلامت (Sanity check) روی ورودی کاربر انجام می‌دهند و در صورتی که به عنوان مثال دانشجو متغیر ورودی را تعریف نکرده باشد، با شکست مواجه نخواهند شد.

- `check_numpy_array_features(name, ref, data)`
  بررسی می‌کند که یک آرایه numpy شکل (Shape) و نوع داده (Datatype) یکسانی با پاسخ مرجع داشته باشد. مقادیر را با مرجع مقایسه _نمی‌کند_.
- `check_numpy_array_allclose(name, ref, data, rtol=1e-05, atol=1e-08)`
  بررسی می‌کند که یک آرایه numpy شکل و نوع داده یکسانی با پاسخ مرجع داشته باشد، و همچنین مقادیر را با استفاده از `rtol` و `atol` مشخص‌شده بررسی می‌کند تا نزدیک بودن آن‌ها را ارزیابی کند.
- `check_list(name, ref, data, entry_type=None)`
  بررسی می‌کند که طول یک لیست با طول پاسخ مرجع یکسان باشد. اگر `entry_type` برابر با `None` نباشد، می‌تواند به صورت اختیاری بررسی کند که آیا هر عنصر آن نوع را دارد یا خیر. مقادیر را با مرجع مقایسه _نمی‌کند_.
- `check_dict(name, ref, data, target_keys=None)`
  بررسی می‌کند که دیکشنری دانشجو تمام نگاشت‌های کلید-مقدار صحیح را نسبت به دیکشنری مرجع داشته باشد.
- `check_tuple(name, ref, data)`
  بررسی می‌کند که یک تاپل دارای طول و مقادیر یکسانی با پاسخ مرجع باشد.
- `check_scalar(name, ref, data, rtol=1e-5, atol=1e-8)`
  بررسی می‌کند که یک مقدار اسکالر با استفاده از `rtol` و `atol` مشخص‌شده به پاسخ مرجع نزدیک باشد.
- `call_user(f, *args, **kwargs)`
  یک تابع تعریف‌شده توسط کاربر را با `args` و `kwargs` مشخص فراخوانی می‌کند.
- `check_dataframe(name, ref, data, subset_columns=None)`
  بررسی می‌کند که یک DataFrame در کتابخانه Pandas دارای محتوای یکسانی با پاسخ مرجع باشد. با ارائه فهرستی از نام ستون‌ها به `subset_columns`، می‌توان به صورت اختیاری زیرمجموعه‌ای از ستون‌ها را بررسی کرد.

بیشتر این توابع دارای آرگومان‌های کلیدی `accuracy_critical` و `report_failure` هستند. اگر `accuracy_critical` برابر با `True` تنظیم شود (پیش‌فرض `False` است)، در صورت عدم موفقیت این بررسی، کار نمره‌دهی متوقف خواهد شد (مشابه یک assert). اگر `report_failure` برابر با `True` باشد (پیش‌فرض)، در صورت شکست این بررسی، بازخورد به دانشجو نمایش داده خواهد شد. آرگومان `name` هنگام نمایش بازخورد مورد استفاده قرار می‌گیرد.

## نکات عمومی و نکات مهم {#general-tips-and-gotchas}

توجه داشته باشید که اولین آرگومان توابع `Feedback.check_xx` نام متغیری است که در حال بررسی است؛ در صورتی که دانشجو به این مسئله پاسخ نادرست دهد، این نام در بازخورد نمره‌دهنده ظاهر خواهد شد.

دقت کنید که ترتیب آرگومان‌های دانشجو و مرجع را جابه‌جا نکنید. پاسخ دانشجو تحت بررسی نوع داده‌ای (Type checking) سخت‌گیرانه‌تری قرار می‌گیرد، و مواردی در گذشته وجود داشته است که در آن‌ها نمره‌دهنده به دلیل پاسخ‌های بدفرمت دانشجو دچار خطا شده است.

## غیرمجاز کردن توابع کتابخانه‌ای {#disallowing-library-functions}

**توجه داشته باشید که از آنجا که پایتون یک زبان بسیار پویا (Dynamic) است، روش زیر توسط دانشجویانی با دانش کافی از پایتون قابل دور زدن است. برای تضمین‌های قوی‌تر در مورد اینکه کدام توابع استفاده شده یا نشده‌اند، استفاده از تکنیک‌های پیشرفته‌تر تحلیل ایستا (Static analysis) را در نظر بگیرید که فراتر از حیطه امکانات این نمره‌دهنده خودکار است. همچنین می‌توانید با نمره‌دهی دستی راستی‌آزمایی را به صورت دستی انجام دهید.**

می‌توان در کد راه‌اندازی (Setup code) به توابع کتابخانه‌ای متصل شد (Hook کرد) تا دسترسی دانشجویان به توابع خاصی مسدود شود. این مثال از سوال [demo/autograder/python/numpy] برگرفته شده است.

می‌توان توابع کتابخانه‌ای را برابر با `Feedback.not_allowed` قرار داد:

```python
numpy.linalg.inv = Feedback.not_allowed
numpy.linalg.pinv = Feedback.not_allowed
```

اکنون، هر زمان که دانشجو تلاش کند از این توابع استفاده نماید، کد او یک استثنا (Exception) صادر خواهد کرد.

## نمای کلی معماری {#overview}

```d2
direction: right
setup: "setup_code.py"
student: "Student Answer"
reference: "Reference Answer\n(ans.py)"
test: "Test Cases\n(test.py)"

setup -> student {
  label: "names_for_user"
  style: {
    bold: true
  }
}
setup -> reference {
  label: "All Variables"
  style: {
    bold: true
  }
}
student -> test {
  label: "names_from_user\n(self.st)"
  style: {
    bold: true
  }
}
reference -> test {
  label: "All Variables\n(self.ref)"
  style: {
    bold: true
  }
}
```

## کتابخانه‌های خاص درس {#course-specific-libraries}

برخی از دروس ممکن است از کتابخانه‌هایی استفاده کنند که میان چندین سوال مشترک هستند. برای چنین سوالاتی، می‌توان این کتابخانه‌ها و کلاس‌ها را در دایرکتوری `serverFilesCourse` درس ذخیره کرد. هر فایلی در این دایرکتوری به‌طور خودکار به Python PATH اضافه می‌شود، بنابراین در صورت نیاز می‌توان آن‌ها را در هر یک از فایل‌های بالا import کرد. با این حال، در صورت استفاده از این گزینه، فایل `info.json` سوال باید مشخص کند که این فایل‌ها باید به کانتینر نمره‌دهی اضافه شوند، مانند زیر:

```json title="info.json"
{
  "externalGradingOptions": {
    "image": "prairielearn/grader-python",
    "serverFilesCourse": ["course_lib.py"]
  }
}
```

فرآیند بالا برای کتابخانه‌های کمکی کوچک که مختص یک درس خاص هستند مناسب است. برای کتابخانه‌های بزرگ‌تر، از جمله آن‌هایی که از [شاخص بسته‌های پایتون (PyPI)](https://pypi.org/) نصب می‌شوند (یعنی از طریق `pip install` یا معادل آن)، اکیداً توصیه می‌شود که [ایمیج نمره‌دهنده سفارشی خود را ایجاد کنید](../dockerImages.md#custom-variations-of-maintained-images)، چرا که این کار عملکرد بهتری ارائه داده و تجربه دانشجویان را بهبود می‌بخشد.

### نمونه استفاده از `serverFilesCourse` برای داده‌های ایستا {#example-usage-of-serverfilescourse-for-static-data}

نمره‌دهنده خودکار Python قادر به بازیابی اطلاعات از `serverFilesCourse` است. این ویژگی می‌تواند زمانی که فایل‌ها و داده‌های ایستای دیگری وجود دارند که میان چندین سوال به اشتراک گذاشته می‌شوند، مورد استفاده قرار گیرد. برای مثال، فرض کنید یک فایل داده به نام `chem.json` وجود دارد که در چندین سوال استفاده می‌شود. این فایل می‌تواند در دایرکتوری `serverFilesCourse` در دایرکتوری ریشه درس ذخیره شود، به عنوان مثال در `serverFilesCourse/compounds/chem.json`.

برای دسترسی به `serverFilesCourse` از نمره‌دهنده خودکار، فایل یا دایرکتوری حاوی آن را در `info.json` سوال مشخص کنید. برای مثال، جهت کپی کردن دایرکتوری `compounds` به نمره‌دهنده خودکار، از کد زیر استفاده کنید:

```json title="info.json" hl_lines="5"
{
  "externalGradingOptions": {
    "image": "prairielearn/grader-python",
    "serverFilesCourse": ["compounds"]
  }
}
```

سپس تست‌های موجود در `test.py` می‌توانند فایل `chem.json` را با کدی مانند زیر بارگذاری کنند:

```python
import json

with open("/grade/serverFilesCourse/compounds/chem.json", "r") as f:
    list_of_compounds = json.load(f)
```

## امنیت {#security}

در ابتدای یک کار نمره‌دهی، اسکریپت `run.sh` با دسترسی `root` اجرا می‌شود. این اسکریپت دایرکتوری‌ها را مقداردهی اولیه کرده و فایل‌های نمره‌دهی را در مکان مناسب کپی می‌کند، خود را حذف کرده و یک نام فایل محرمانه برای نتایج نمره‌دهی با استفاده از `uuidgen` تولید می‌کند که از طریق آرگومان خط فرمان به کد نمره‌دهی ارسال می‌شود. سپس اسکریپت اصلی نمره‌دهی (`pltest.py`) با کاربر `ag` اجرا خواهد شد.

اسکریپت‌های پایتون نمره‌دهی، تمام فایل‌های حساس را در حافظه بارگذاری کرده (کد راه‌اندازی، کد پاسخ، موارد آزمون) و پیش از اجرای هرگونه کد دانشجو، آن‌ها را از روی دیسک حذف می‌کنند. آرگومان‌های خط فرمان در argv نیز پاک می‌شوند. بنابراین کاربران به کدهای مختص سوال دسترسی ندارند، بلکه تنها به منطق کلی نمره‌دهنده که عمومی است دسترسی خواهند داشت.

پس از نمره‌دهی، نتایج در فایل با نام محرمانه تولیدشده در بالا نوشته می‌شوند. اگر این فایل وجود نداشته باشد یا نام فایل مطابقت نداشته باشد، کار نمره‌دهی شکست خواهد خورد و دانشجویان نمره‌ای دریافت نخواهند کرد. این امر در درجه اول یک سازوکار ایمنی در صورت کرش کردن کد نمره‌دهنده است، اما از نظر تئوری مانع از آن نیز می‌شود که دانشجویان زرنگ بتوانند فایل نتایج مخصوص به خود را بنویسند.

سپس کار نمره‌دهی در اسکریپت `run.sh` مجدداً به دسترسی `root` بازمی‌گردد و هرگونه خروجی را طبق انتظار چارچوب نمره‌دهی خارجی به مکان صحیح کپی می‌کند.

[demo/autograder/python/numpy]: https://github.com/PrairieLearn/PrairieLearn/tree/master/exampleCourse/questions/demo/autograder/python/numpy
