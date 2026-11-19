# `server.py`

فایل `server.py` برای هر سوال، با تولید پارامترهای تصادفی و پاسخ‌های صحیح متناظر، انواع (واریانت‌های) تصادفی سوال را ایجاد می‌کند.

بخش‌های زیر یک مثال ساده از سوالی می‌سازند که از دانشجو می‌خواهد یک عدد را دو برابر کند. این سوال به این صورت خواهد بود:

<!-- prettier-ignore -->
```html title="question.html"
<pl-question-panel>
  If $x = {{params.x}}$, what is $y$ if $y$ is double $x$?
</pl-question-panel>
<pl-integer-input answers-name="y" label="$y =$"></pl-integer-input>
<pl-submission-panel>
  {{feedback.y}}
</pl-submission-panel>
```

!!! tip "نکته"

    پرش به [مثال کامل `question.html` و `server.py`](#complete-example).

جزئیات بیشتر درباره سینتکس Mustache برای `{{params.x}}` و `{{feedback.y}}` را می‌توانید در [مستندات الگوی سوال](./template.md#mustache-templates) بیابید.

## گام ۱: `generate`

ابتدا تابع `generate` برای تولید واریانت سوال فراخوانی می‌شود. این تابع باید `data["params"]` را با پارامترهای لازم برای سوال، و `data["correct_answers"]` را با پاسخ‌های صحیح به‌روزرسانی کند.

```python title="server.py"
import random


def generate(data):
    # Generate random parameters for the question and store them in the data["params"] dict:
    data["params"]["x"] = random.randint(5, 10)

    # Also compute the correct answer (if there is one) and store in the data["correct_answers"] dict:
    data["correct_answers"]["y"] = 2 * data["params"]["x"]
```

این مقادیر را می‌توان با استفاده از سینتکس Mustache در فایل `question.html` به کار برد. برای نمونه، می‌توانید از `data["params"]["x"]` به صورت `{{params.x}}` استفاده کنید.

قطعه‌کد زیر از المان [`<pl-question-panel>`](../elements/pl-question-panel.md) استفاده می‌کند تا تنها در چارچوب [پنل سوال](./template.md#question-panel) نمایش داده شود.

<!-- prettier-ignore -->
```html title="question.html"
<pl-question-panel>
  If $x = {{params.x}}$, what is $y$ if $y$ is double $x$?
</pl-question-panel>
```

### تصادفی‌سازی (Randomization) {: #randomization }

واریانت‌های سوال بر اساس مقدار بذر واریانت (`data["variant_seed"]`) تصادفی‌سازی می‌شوند و تمام تولیدکننده‌های اعداد تصادفی (`random`، `np.random` و غیره) با این مقدار بذردهی (seed) می‌شوند.

??? tip "تولید داده‌های ساختگی (Generating fake data)"

    اگر نیاز به تولید داده‌های ساختگی دارید، می‌توانید از کتابخانه [`faker`](https://faker.readthedocs.io/en/master/) استفاده کنید. این کتابخانه برای تولید نام‌ها، آدرس‌ها و سایر داده‌های تصادفی که واقعی به نظر می‌رسند ولی واقعی نیستند، کاربرد دارد.

    ```python title="server.py"
    from faker import Faker

    fake = Faker()

    fake.name()
    # 'Lucy Cechtelar'
    ```

### تولید پارامتر

برای پاسخ‌های ممیز شناور (floating point) تولیدشده، استفاده از گردکردن (rounding) یکدست و سازگار هنگام نمایش اعداد به دانشجویان _و_ هنگام محاسبه پاسخ صحیح بسیار مهم است. نمایش اعداد گردشده به دانشجویان اما استفاده از نسخه گردنشده برای نمره‌دهی می‌تواند به نتایج غیرمنتظره‌ای منجر شود.

=== "مناسب (Good)"

    ```python title="server.py"
    def generate(data):
        # Rounds numbers at the beginning
        a = np.round(33.33337, 2)
        b = np.round(33.33333, 2)
        data["params"]["a_for_student"] = f"{a:.2f}"
        data["params"]["b_for_student"] = f"{b:.2f}"
        data["correct_answers"]["c"] = a - b
    ```

=== "نامناسب (Bad)"

    ```python { title="server.py" .no-copy }
    def generate(data):
        a = 33.33337
        b = 33.33333
        data["params"]["a_for_student"] = f"{a:.2f}"
        data["params"]["b_for_student"] = f"{a:.2f}"
        # Correct answer is computed with full precision,
        # but the parameters displayed to students are rounded.
        data["correct_answers"]["c"] = a - b
    ```

## گام ۲: `prepare`

سپس، تابع `prepare` پس از اینکه همه المان‌ها (مانند `<pl-integer-input>`) متد `prepare()` خود را اجرا کردند، فراخوانی می‌شود. این کار ممکن است برای انجام هرگونه پس‌پردازش نهایی انجام گیرد، اما معمولاً چندان به کار نمی‌رود.

## گام ۳: `render`

در مرحله بعد، تابع `render(data, html)` برای رندر کردن سوال فراخوانی می‌شود. می‌توانید از این تابع برای بازنویسی (override) نحوه رندر سوال استفاده کنید. تابع render دو پارامتر `data` و `html` دریافت می‌کند و باید یک رشته HTML بازگرداند. مقدار HTML پس از رندر شدن الگوی Mustache از طریق پارامتر `html` در دسترس است. این تابع به ندرت و فقط برای سوالات بسیار پیشرفته استفاده می‌شود و ما در این مثال به آن نیازی نداریم.

## گام ۴: `parse`

هنگامی که دانشجو پاسخ خود را ارسال می‌کند، تابع `parse` پس از تجزیه (parse) پاسخ‌ها توسط المان‌های منفرد، برای پارس کردن پاسخ‌های ارسالی فراخوانی می‌شود. این تابع می‌تواند برای نمایش خطاهای فرمت خاص‌تر نسبت به المان‌های ورودی، یا برای پارس کردن متفاوت ورودی به کار رود. وقتی تابع parse ما اجرا می‌شود، المان `<pl-integer-input>` قبلاً مقدار ارسالی را به عنوان یک عدد صحیح پارس کرده است و در صورت نامعتبر بودن، خطایی به دانشجو نمایش می‌دهد. برای این مثال، ما به دانشجو اجازه می‌دهیم فقط اعداد صحیح مثبت ارسال کند؛ بنابراین این مورد را بررسی کرده و در صورت منفی بودن، یک خطای فرمت با استفاده از `data["format_errors"]` تنظیم می‌کنیم.

مقادیری که معمولاً توسط تابع `parse` خوانده یا تغییر داده می‌شوند عبارتند از:

- `data["raw_submitted_answers"][NAME]` — پاسخ خام و دقیقی که توسط دانشجو ارسال شده است.
- `data["submitted_answers"][NAME]` — پاسخی که توسط المان‌ها پارس شده است (مانند رشته‌هایی که به عدد تبدیل شده‌اند).
- `data["format_errors"][NAME]` — پیام خطای فرمت برای یک پاسخ نام‌گذاری‌شده.

اگر خطای فرمت وجود داشته باشد، پاسخ ارسالی «نامعتبر» (invalid) تلقی شده و نمره‌دهی نمی‌شود. برای ارائه بازخورد اما نگه‌داشتن پاسخ ارسالی در وضعیت «معتبر» (valid)، می‌توان به جای آن از `data["feedback"][NAME]` استفاده کرد.

```python title="server.py"
def parse(data):
    # Reject negative numbers for "y" if we don't already have a format error
    if "y" not in data["format_errors"] and int(data["submitted_answers"]["y"]) < 0:
        data["format_errors"]["y"] = "Negative numbers are not allowed"
```

همچنین می‌توانستیم در صورت نیاز به پردازش بیشتر ورودی‌ها، مستقیماً پاسخ‌های ارسالی را تغییر دهیم. برای نمونه، اگر می‌خواستیم پاسخ‌های منفی را معادل قدرمطلق آن‌ها بپذیریم، می‌توانستیم به این صورت عمل کنیم:

```python title="server.py"
def parse(data):
    # Ensure that "y" is positive
    data["submitted_answers"]["y"] = abs(int(data["submitted_answers"]["y"]))
```

!!! info "اطلاعات"

    به‌طور کلی، هر تابع در فرآیند تولید سوال *پس از* تمامی المان‌های موجود در سوال اجرا می‌شود. برای مثال، تابع `parse()` در `server.py` پس از آنکه تمامی المان‌ها توابع `parse()` خود را اجرا کردند، اجرا می‌شود. هنگام استفاده از دیکشنری `data` به یاد داشتن این نکته مهم است، زیرا شامل نتایج *پس از* اتمام پردازش المان‌ها خواهد بود.

اگرچه سوالات با نمره‌دهی سفارشی ممکن است به قابلیت‌های کامل نمره‌دهی المان‌های منفرد وابسته نباشند، اما _اکیداً_ توصیه می‌شود برای ورودی دانشجو از المان‌های داخلی (built-in) استفاده شود؛ چرا که این المان‌ها به طور پیش‌فرض شامل پارس و بازخورد بسیار مفیدی هستند. پاسخ‌های پارس‌شده دانشجو در دیکشنری `data["submitted_answers"]` موجود هستند.

!!! note "یادداشت"

    داده‌های ذخیره‌شده تحت کلید `"submitted_answers"` در دیکشنری داده‌ها ممکن است انواع متفاوتی داشته باشند. به طور خاص، المان `pl-integer-input` گاهی اوقات اعداد صحیح بسیار بزرگ را به جای نوع `int` پایتون که در اغلب موارد استفاده می‌شود، به صورت رشته ذخیره می‌کند. بهترین روش برای کدهای نمره‌دهی سفارشی (custom grader) در این حالت این است که همیشه داده را به نوع مورد نظر تبدیل (cast) کنید؛ برای نمونه `int(data["submitted_answers"][name])`. برای بحث‌های دقیق‌تر مرتبط با المان‌های خاص، به [مستندات المان‌های PrairieLearn](../elements/index.md) مراجعه کنید.

تابع `parse()` همچنین می‌تواند برای ایجاد فایل‌های سفارشی جهت ارسال به یک نمره‌دهنده خارجی (external grader) استفاده شود. این کار با تابع `pl.add_submitted_file()`، مطابق مثال زیر امکان‌پذیر است:

```python title="server.py"
import prairielearn as pl


def parse(data):
    code = f"x = {data['submitted_answers']['expression']}"
    pl.add_submitted_file(data, "user_code.py", raw_contents=code)
```

## گام ۵: `grade`

در نهایت، تابع `grade(data)` برای نمره‌دهی سوال فراخوانی می‌شود. تابع grade مسئول موارد زیر است:

- تنظیم نمره و بازخورد برای هر پاسخ نام‌گذاری‌شده در `data["partial_scores"]`.
- تنظیم نمره کل برای سوال در `data["score"]`.
- تنظیم بازخورد کلی برای سوال در `data["feedback"]`.

این تابع تنها در صورتی اجرا می‌شود که `parse()` خطای فرمتی تولید نکرده باشد، بنابراین می‌توان فرض کرد تمام داده‌ها معتبر هستند. تمامی المان‌ها قبل از این مرحله پاسخ‌های خود را (در صورت وجود) نمره‌دهی کرده‌اند.

مقادیری که معمولاً توسط یک تابع `grade` خوانده یا تغییر داده می‌شوند عبارتند از:

- `data["partial_scores"][NAME]["score"]` — نمرات فردی برای پاسخ‌های نام‌گذاری‌شده (۰ تا ۱).
- `data["partial_scores"][NAME]["feedback"]` — بازخورد برای هر پاسخ نام‌گذاری‌شده از سوی المانی که آن را نمره‌دهی کرده است.
- `data["score"]` — نمره کل برای سوال (۰ تا ۱).
- `data["feedback"][NAME]` — بازخورد کلی سوال برای هر پاسخ نام‌گذاری‌شده.

توصیه می‌شود هم‌زمان با پیشرفت دانشجو به سمت پاسخ، به او بازخورد بیشتر ارائه دهید و به این پیشرفت نمره بخشی (partial credit) اختصاص دهید.

اگر این تابع تعریف نشود، سوال به‌طور خودکار بر اساس پاسخ‌های صحیح تعیین‌شده در `data["correct_answers"]` نمره‌دهی می‌شود. همچنین به هر پاسخی که دانشجو ارائه می‌دهد، بازخوردی از سوی المانی که آن را نمره‌دهی کرده اختصاص داده خواهد شد. اگر تابع `grade` تعریف _شده باشد_، داده‌هایی که دریافت می‌کنید قبلاً توسط المان‌ها نمره‌دهی شده‌اند. باید اطمینان حاصل کنید که تنها در صورت نادرست بودن پاسخ، نمره بخشی اعطا می‌کنید؛ در غیر این صورت ممکن است به پاسخی که کاملاً درست است نمره بخشی تعلق گیرد. در قطعه‌کد زیر، ما `data["score"]` را با استفاده از ابزار کمکی [`set_weighted_score_data`][prairielearn.question_utils.set_weighted_score_data] به‌روزرسانی می‌کنیم.

می‌توانید `data["format_errors"][NAME]` را تنظیم کنید تا پاسخ ارسالی به عنوان نامعتبر علامت‌گذاری شود. این کار باعث می‌شود در ارزیابی‌ها یکی از فرصت‌های تلاش (attempts) دانشجو مصرف نشود. با این حال، توصیه می‌شود تا جای ممکن بررسی داده‌های نامعتبر را به جای `grade` در تابع `parse` انجام دهید؛ چرا که تابع `parse` هنگامی که دانشجو روی «فقط ذخیره» (Save only) کلیک می‌کند، در سوالات با نمره‌دهی دستی یا خارجی، و در ارزیابی‌های بدون نمره‌دهی بلادرنگ نیز فراخوانی می‌شود.

```python title="server.py"
import math
import prairielearn as pl


def grade(data):
    # Give half points for incorrect answers larger than "x", only if not already correct.
    # Use math.isclose to avoid possible floating point errors.
    y_is_correct = math.isclose(data["partial_scores"]["y"]["score"], 1.0)
    if not y_is_correct and int(data["submitted_answers"]["y"]) > data["params"]["x"]:
        data["partial_scores"]["y"]["score"] = 0.5
        pl.set_weighted_score_data(data)
        data["feedback"]["y"] = "Your value for $y$ is larger than $x$, but incorrect."
```

### نمره‌دهی بدون پاسخ صحیح ثابت

یک تابع سفارشی `grade` محدود به مقایسه پاسخ ارسالی با `data["correct_answers"]` نیست:

- برای سوالاتی با پاسخ‌های صحیح متعدد (مانند «مثالی از یک ماتریس با یک ویژگی خاص ارائه دهید»)، تابع نمره‌دهی می‌تواند بررسی کند که آیا پاسخ ارسالی ویژگی مورد نیاز را برآورده می‌کند یا خیر. در این حالت، `data["correct_answers"]` می‌تواند یک نمونه از پاسخ معتبر را برای نمایش به دانشجویان نگه دارد. برای مشاهده یک نمونه، به [این سوال نمایشی](https://github.com/PrairieLearn/PrairieLearn/tree/master/exampleCourse/questions/demo/custom/gradeAnyValidAnswer) مراجعه کنید.
- برای سوالاتی که در آن‌ها دانشجویان داده‌های خود را جمع‌آوری می‌کنند (مانند اندازه‌گیری‌های حاصل از آزمایشگاه)، تابع نمره‌دهی می‌تواند پاسخ مورد انتظار را از مقادیر ارسالی خود دانشجو محاسبه کند، به طوری که هر پاسخی که با داده‌های آن‌ها سازگار باشد پذیرفته شود. برای مشاهده یک نمونه، به [این سوال نمایشی](https://github.com/PrairieLearn/PrairieLearn/tree/master/exampleCourse/questions/demo/custom/gradeFromStudentData) مراجعه کنید.

### ارائه بازخورد {: #providing-feedback }

برای تنظیم بازخورد سفارشی، تابع نمره‌دهی باید مدخل متناظر در دیکشنری `data["feedback"]` را تنظیم کند. این مدخل‌های بازخورد هنگام رندر شدن `question.html` منتقل می‌شوند که با استفاده از پیشوند Mustache به صورت `{{feedback.}}` قابل دسترسی هستند. برای نمونه‌هایی از این مورد، به [مثال بالا](#complete-example) یا [این سوال نمایشی](https://github.com/PrairieLearn/PrairieLearn/tree/master/exampleCourse/questions/demo/custom/gradeFunction) مراجعه کنید.

برخی از المان‌ها بازخورد را از طریق `data["partial_scores"][NAME]["feedback"]` ارائه می‌دهند که می‌توانید آن را در تابع نمره‌دهی بازنویسی کنید. این فیلد اغلب یک رشته است، اگرچه برخی المان‌ها مانند `<pl-drawing>` و `<pl-checkbox>` از انواع متفاوتی استفاده می‌کنند. بازخورد ارائه‌شده در اینجا به پاسخ دانشجو برای آن المان متصل می‌شود که می‌تواند درک بازخورد دریافت‌شده در سوالات طولانی‌تر را برای دانشجویان آسان‌تر کند. از آنجا که همه المان‌ها بازخورد را به این شیوه ارائه نمی‌دهند و برخی از ساختارهای داده‌ای متفاوتی برای نمایش بازخورد استفاده می‌کنند، توصیه می‌کنیم در عوض از `data["feedback"][NAME]` برای ارائه بازخورد ویژه سوال استفاده کنید.

!!! tip "بازخورد ویژه یک پاسخ (Answer-specific feedback)"

    اگر می‌خواهید روی یک پاسخ خاص که از `data["partial_scores"][NAME]["feedback"]` استفاده/پشتیبانی نمی‌کند بازخورد ارائه دهید،
    می‌توانید بازخورد را مستقیماً بعد از المان در `question.html` رندر کنید:

    <!-- prettier-ignore -->
    ```html title="question.html"
    <pl-string-input ...></pl-string-input>
    {{#feedback.value1}}<div>Feedback: {{.}}</div>{{/feedback.value1}}
    ```

بازخورد کلی سوال در `data["feedback"][NAME]` باید به صراحت در الگوی `question.html` با استفاده از `{{feedback.NAME}}` رندر شود. بازخورد ارائه‌شده در `data["partial_scores"][NAME]["feedback"]`، در صورت پشتیبانی توسط المان، به شرط قابل رویت بودن المان به صورت خودکار توسط آن المان رندر خواهد شد.

### نمره‌دهی به پاسخ‌های ممیز شناور

برای توابع نمره‌دهی که شامل اعداد ممیز شناور هستند، **از مقایسه‌های دقیق با `==` خودداری کنید**. مقایسه ممیز شناور با `==` ممکن است به طور غیرمنتظره‌ای با شکست مواجه شود، زیرا محاسبات در پایتون می‌توانند خطای ممیز شناور ایجاد کنند. در عوض، از تابع [`math.isclose`](https://docs.python.org/3/library/math.html#math.isclose) استفاده کنید؛ زیرا مقایسه‌ها را درون یک خطای مجاز (tolerance) معین انجام می‌دهد. کتابخانه پایتون `prairielearn` نیز چندین تابع برای انجام مقایسه‌های تخصصی‌تر ارائه می‌دهد:

- [`is_correct_scalar_ra`][prairielearn.grading_utils.is_correct_scalar_ra] اعداد اعشاری را با استفاده از تلورانس نسبی و مطلق مقایسه می‌کند.
- [`is_correct_scalar_sf`][prairielearn.grading_utils.is_correct_scalar_sf] اعداد اعشاری را تا تعداد مشخصی ارقام با معنی (significant figures) مقایسه می‌کند.
- [`is_correct_scalar_dd`][prairielearn.grading_utils.is_correct_scalar_dd] اعداد اعشاری را تا تعداد مشخصی رقم اعشار مقایسه می‌کند.

### محاسبه مجدد نمرات

هر تابع نمره‌دهی سفارشی برای کل سوال باید `data["score"]` را به صورت مقداری بین 0.0 و 1.0 تنظیم کند که نمره نهایی برای سوال داده‌شده خواهد بود. اگر یک تابع نمره‌دهی سفارشی فقط بخش خاصی از یک سوال را نمره‌دهی می‌کند، تابع نمره‌دهی باید مدخل دیکشنری متناظر در `data["partial_scores"]` را تنظیم کرده و سپس مقدار نهایی `data["score"]` را برای کل سوال مجدداً محاسبه کند. کتابخانه پایتون `prairielearn` توابع باز‌محاسبه نمره زیر را ارائه می‌دهد:

- [`set_weighted_score_data`][prairielearn.question_utils.set_weighted_score_data] مقدار `data["score"]` را برابر با میانگین وزنی مدخل‌های موجود در `data["partial_scores"]` قرار می‌دهد.
- [`set_all_or_nothing_score_data`][prairielearn.question_utils.set_all_or_nothing_score_data] در صورتی که همه مدخل‌های موجود در `data["partial_scores"]` برابر 1.0 باشند، `data["score"]` را برابر 1.0 و در غیر این صورت برابر 0.0 قرار می‌دهد.

!!! note "تنظیمات نمره بخشی (Partial credit)"

    تنظیم `data["score"]` بر روی مقداری غیر از ۰ یا ۱، به پاسخ ارسالی نمره بخشی اختصاص می‌دهد، حتی اگر سوال به گونه‌ای پیکربندی شده باشد که نمره بخشی مجاز نباشد. اگر می‌خواهید نمره بخشی را غیرفعال کنید، باید اطمینان حاصل کنید که `data["score"]` یا ۰ یا ۱ است، یا از ابزار کمکی [`set_all_or_nothing_score_data`][prairielearn.question_utils.set_all_or_nothing_score_data] برای محاسبه نمره استفاده کنید.

این قابلیت را می‌توان به این صورت استفاده کرد:

```python title="server.py"
import prairielearn as pl


def grade(data):
    # update partial_scores as necessary
    data["partial_scores"]["y"]["score"] = 0.5

    # compute total question score
    pl.set_weighted_score_data(data)
```

اطلاعات دقیق‌تر را می‌توانید در [مستندات ابزارهای کمکی نمره‌دهی](../python-reference/prairielearn/grading_utils.md) بیابید.

اگر ترجیح می‌دهید نشان‌های نمره (score badges) برای بخش‌های منفرد نمایش داده نشوند، می‌توانید پس از محاسبه `data["score"]`، مدخل‌های دیکشنری در `data["partial_scores"]` را پاک (unset) کنید.

??? example "نمونه کد (Code snippet)"

    ```python title="server.py"
    import prairielearn as pl


    def grade(data):
        # update partial_scores as necessary
        data["partial_scores"]["y"]["score"] = 0.5

        # compute total question score
        pl.set_weighted_score_data(data)

        # unset partial scores
        data["partial_scores"]["y"]["score"] = None
    ```

## چرخه حیات سوال (Question lifecycle)

نمودار زیر چرخه حیات یک سوال، شامل توابع سرور فراخوانی‌شده، پنل‌های مختلفی که رندر می‌شوند، و نقاط تعامل با دانشجو را نشان می‌دهد.

![Diagram showing the lifecycle of a question](./lifecycle.d2){layout="dagre" scale="0.6" pad="0" }

## مثال کامل {: #complete-example }

مثال نهایی و کامل فایل‌های `question.html` و `server.py` به این صورت است:

<!-- prettier-ignore -->
```html title="question.html"
<pl-question-panel>
  If $x = {{params.x}}$, what is $y$ if $y$ is double $x$?
</pl-question-panel>
<pl-integer-input answers-name="y" label="$y =$"></pl-integer-input>
<pl-submission-panel>
  {{feedback.y}}
</pl-submission-panel>
```

```python title="server.py"
import random
import math
import prairielearn as pl


def generate(data):
    # Generate random parameters for the question and store them in the data["params"] dict:
    data["params"]["x"] = random.randint(5, 10)

    # Also compute the correct answer (if there is one) and store in the data["correct_answers"] dict:
    data["correct_answers"]["y"] = 2 * data["params"]["x"]


def parse(data):
    # Reject negative numbers for "y" if we don't already have a format error
    if "y" not in data["format_errors"] and int(data["submitted_answers"]["y"]) < 0:
        data["format_errors"]["y"] = "Negative numbers are not allowed"


def grade(data):
    # Give half points for incorrect answers larger than "x", only if not already correct.
    # Use math.isclose to avoid possible floating point errors.
    y_is_correct = math.isclose(data["partial_scores"]["y"]["score"], 1.0)
    if not y_is_correct and int(data["submitted_answers"]["y"]) > data["params"]["x"]:
        data["partial_scores"]["y"]["score"] = 0.5
        pl.set_weighted_score_data(data)
        data["feedback"]["y"] = "Your value for $y$ is larger than $x$, but incorrect."
```

## توابع `server.py`

توابعی که می‌توانند در `server.py` تعریف شوند دارای امضاهای (signatures) زیر هستند. حاشیه‌نویسی نوع (type annotations) اختیاری است. برای مشاهده فیلدهای موجود، به [دیکشنری `data`](#data-dictionary) و برای مشاهده فیلدهایی که هر تابع می‌تواند تغییر دهد، به جدول توابع زیر مراجعه کنید.

```python
import io
from collections.abc import Buffer


def generate(data: dict) -> None: ...
def prepare(data: dict) -> None: ...
def render(data: dict, html: str) -> str: ...
def parse(data: dict) -> None: ...
def grade(data: dict) -> None: ...
def file(data: dict) -> str | Buffer | io.IOBase | None: ...
def test(data: dict) -> None: ...
```

برای تابع `file()`، شناسه `Buffer` اشیاء شبیه بایت مانند `bytes`، `bytearray` و `memoryview` را پوشش می‌دهد؛ و `io.IOBase` اشیاء شبیه فایل مانند `io.StringIO` و `io.BytesIO` را شامل می‌شود. تابع `file()` خود را با نوع مشخصی که بازمی‌گرداند حاشیه‌نویسی نوع کنید.

جدول زیر عملکرد هر تابع را خلاصه می‌کند:

| تابع | آیا `data` را به‌روزرسانی می‌کند؟ | کلیدهای قابل تغییر در `data` | توضیحات |
| --- | --- | --- | --- |
| `generate()` | :white_check_mark: | `correct_answers`، `params` | تولید پارامترها و پاسخ‌های واقعی برای یک واریانت تصادفی جدید از سوال. مقداردهی `data["params"][name]` و `data["correct_answers"][name]` برای هر متغیر در صورت نیاز. دیکشنری `data` را درجا (in-place) تغییر می‌دهد. |
| `prepare()` | :white_check_mark: | `answers_names`، `correct_answers`، `params` | آماده‌سازی نهایی سوال پس از اجرای کدهای المان‌ها. می‌تواند داده‌ها را بر حسب نیاز تغییر دهد. دیکشنری `data` را درجا تغییر می‌دهد. |
| `render()` | :x: | نامربوط (N/A). مقدار `html` را به عنوان رشته برمی‌گرداند | رندر کردن HTML برای یک پنل و بازگرداندن آن به صورت رشته. |
| `parse()` | :white_check_mark: | `correct_answers`، `feedback`، `format_errors`، `params`، `submitted_answers` | پارس کردن داده‌های واردشده توسط دانشجو در `data["submitted_answers"][var]` و تغییر این متغیر. دیکشنری `data` را درجا تغییر می‌دهد. |
| `grade()` | :white_check_mark: | `correct_answers`، `feedback`، `format_errors`، `params`، `partial_scores`، `score`، `submitted_answers` | نمره‌دهی `data["submitted_answers"][var]` جهت تعیین نمره. ذخیره نمره و هرگونه بازخورد در `data["partial_scores"][var]["score"]` و `data["partial_scores"][var]["feedback"]`. دیکشنری `data` را درجا تغییر می‌دهد. |
| `file()` | :x: | نامربوط (N/A). یک `object` (رشته، شیء شبه‌بایت یا شبه‌فایل) برمی‌گرداند | تولید پویای شیء فایل به جای فایل فیزیکی. تحریک از طریق `type="dynamic"` در المان سوال (مانند `pl-figure`، `pl-file-download`). دسترسی به نام فایل درخواستی از طریق `data['filename']`. اگر `file()` چیزی برنگرداند، از یک رشته خالی استفاده خواهد شد. |
| `test()` | :white_check_mark: | `feedback`، `format_errors`، `gradable`، `partial_scores`، `raw_submitted_answers`، `score` | تولید موارد آزمون (test cases) برای اطمینان از اینکه سوال می‌تواند ورودی‌های گوناگون دانشجویان را نمره‌دهی کند. |

تمامی توابع به جز `render()` یک آرگومان منفرد به نام `data` (یک دیکشنری) دریافت می‌کنند. تابع `render()` دو آرگومان می‌پذیرد: دیکشنری `data` و محتوای `html` محاسبه‌شده از الگو و المان‌ها (به همین ترتیب). توابعی با نوع بازگشتی `None` دیکشنری `data` را درجا تغییر می‌دهند و نیازی به دستور `return` ندارند. توابع `render()` و `file()` به جای تغییر `data`، محتوا برمی‌گردانند.

### دیکشنری `data` {: #data-dictionary }

| مشخصه | نوع | توضیحات |
| --- | --- | --- |
| `params` | `dict` | پارامترهای واریانت سوال. این مقادیر در تابع `generate()` تنظیم می‌شوند و می‌توانند در فایل `question.html` استفاده شوند. |
| `correct_answers` | `dict` | پاسخ‌های صحیح برای واریانت سوال. هر مورد از یک پاسخ نام‌گذاری‌شده به یک مقدار نگاشت می‌شود. |
| `submitted_answers` | `dict` | پاسخ‌های ارسالی دانشجو برای سوال پس از پارس شدن. |
| `raw_submitted_answers` | `dict` | پاسخ‌های ارسالی خام دانشجو برای سوال. |
| `format_errors` | `dict` | دیکشنری خطاهای فرمت برای هر پاسخ. هر مورد از یک پاسخ نام‌گذاری‌شده به یک پیام خطا نگاشت می‌شود. |
| `partial_scores` | `dict` | دیکشنری نمرات بخشی برای هر پاسخ. هر مدخل، دیکشنری با کلیدهای `score` (اعشاری) و `weight` (صحیح، اختیاری) است. |
| `score` | `float` | نمره کل برای واریانت سوال. |
| `feedback` | `dict` | دیکشنری [بازخوردها](#providing-feedback) برای هر پاسخ. هر مورد از یک پاسخ نام‌گذاری‌شده به یک پیام بازخورد نگاشت می‌شود. |
| `variant_seed` | `int` | [بذر تصادفی](#randomization) برای این واریانت سوال. |
| `preferences` | `dict` | [ترجیحات فقط‌خواندنی سوال](preferences.md) که هنگام ایجاد هر واریانت ذخیره می‌شوند. مقادیر از مقادیر پیش‌فرض سوال ادغام‌شده با هرگونه لغو یا بازنویسی در ارزیابی به دست می‌آیند. |
| `options` | `dict` | گزینه‌های ارائه‌شده توسط سیستم مانند مسیرهای فایل و URLها (به [دسترسی به فایل‌ها](#accessing-files-on-disk) مراجعه کنید). |
| `filename` | `str` | نام [فایل پویای درخواستی](#generating-dynamic-files-with-file) در تابع `file()`. |
| `test_type` | `str` | نوع تستی که در [تابع `test()`](#testing-questions-with-test) اجرا می‌شود. |
| `answers_names` | `dict` | دیکشنری که کلیدهای آن اسامی پاسخ‌های موجود در سوال را فهرست می‌کند. |
| `panel` | `str` | کدام پنل در حال رندر شدن است (`question`، `submission` یا `answer`). |
| `correct_answer_shown` | `bool` | آیا پنل پاسخ در حال رندر شدن است یا خیر (جهت استفاده هنگام رندر سایر پنل‌ها). |
| `editable` | `bool` | آیا سوال در حال حاضر در وضعیت قابل ویرایش است یا خیر. |
| `num_valid_submissions` | `int` | تعداد ارسال‌های معتبر (بدون خطای فرمت) توسط دانشجو برای واریانت فعلی. |
| `manual_grading` | `bool` | آیا محتوای نمره‌دهی دستی باید نمایش داده شود یا خیر. این مقدار در نمای نمره‌دهی دستی و همچنین برای پنل‌های سوال و پاسخ هنگامی که برای نمره‌دهی با هوش مصنوعی رندر می‌شوند، برابر با `true` است. |
| `ai_grading` | `bool` | آیا سوال برای نمره‌دهی با هوش مصنوعی رندر می‌شود یا خیر. |
| `gradable` | `bool` | آیا پاسخ ارسالی قابل نمره‌دهی است یا خیر. در صورت وجود خطاهای فرمت، به طور خودکار برابر با `false` تنظیم می‌شود. |

تمام فیلدها در هر تابع در دسترس نیستند — برخی فقط در فازهای خاصی حضور دارند. برای جزئیات، جدول [محدوده فیلدهای داده (scopes)](#data-field-scopes) را در زیر مشاهده کنید. همچنین می‌توانید فهرست کاملی از همه فیلدها را در [مرجع `QuestionData`](../python-reference/prairielearn/question_utils.md#prairielearn.question_utils.QuestionData) مشاهده کنید.

### محدوده‌های فیلدهای داده (Data field scopes) {: #data-field-scopes }

هر فیلد در دیکشنری `data` یا **به‌ازای هر واریانت (per-variant)** (به اشتراک گذاشته‌شده میان تمامی پاسخ‌های ارسالی) ذخیره می‌شود یا **به‌ازای هر پاسخ ارسالی (per-submission)** (منحصر‌به‌فرد برای هر پاسخ ارسالی دانشجو). برخی فیلدها تنها در توابع خاصی در دسترس هستند.

| فیلد | محدوده (Scope) | یادداشت‌ها |
| --- | --- | --- |
| `params` | هر دو | هم روی واریانت و هم روی هر پاسخ ارسالی ذخیره می‌شود. |
| `correct_answers` | هر دو | هم روی واریانت و هم روی هر پاسخ ارسالی ذخیره می‌شود. |
| `submitted_answers` | پاسخ ارسالی (Submission) | — |
| `raw_submitted_answers` | پاسخ ارسالی (Submission) | — |
| `format_errors` | پاسخ ارسالی (Submission) | — |
| `partial_scores` | پاسخ ارسالی (Submission) | — |
| `score` | پاسخ ارسالی (Submission) | — |
| `feedback` | پاسخ ارسالی (Submission) | — |
| `preferences` | واریانت (Variant) | هنگام ایجاد واریانت ذخیره می‌شود. |
| `variant_seed` | واریانت (Variant) | — |
| `options` | واریانت (Variant) | — |
| `filename` | هیچ‌کدام (ذخیره نمی‌شود) | تنها در `file()`. |
| `test_type` | هیچ‌کدام (ذخیره نمی‌شود) | تنها در `test()`. |
| `answers_names` | هیچ‌کدام (ذخیره نمی‌شود) | تنها در `prepare()`. |
| `panel` | هیچ‌کدام (ذخیره نمی‌شود) | تنها در `render()`. |
| `correct_answer_shown` | هیچ‌کدام (ذخیره نمی‌شود) | تنها در `render()`. |
| `editable` | هیچ‌کدام (ذخیره نمی‌شود) | تنها در `render()`. |
| `num_valid_submissions` | هیچ‌کدام (ذخیره نمی‌شود) | تنها در `render()`. |
| `manual_grading` | هیچ‌کدام (ذخیره نمی‌شود) | تنها در `render()`. |
| `ai_grading` | هیچ‌کدام (ذخیره نمی‌شود) | تنها در `render()`. |
| `gradable` | پاسخ ارسالی (Submission) | تنها در `parse()`، `grade()` و `test()`. |

!!! note "یادداشت"

    مقادیر `params` و `correct_answers` به صورت به‌ازای هر واریانت در `generate()` تنظیم شده و هم روی واریانت و هم روی هر پاسخ ارسالی ذخیره می‌شوند. نسخه‌های ذخیره‌شده در پاسخ ارسالی، اسنپ‌شات‌هایی در همان لحظه هستند. اگر `parse()` یا `grade()` این مقادیر را تغییر دهند، مقادیر به‌روزرسانی‌شده در هر دو بخش واریانت و پاسخ ارسالی ذخیره می‌شوند.

## ذخیره‌سازی داده‌های سوال

تمامی داده‌های پایدار (persistent) مربوط به یک واریانت سوال، تحت مدخل‌های گوناگون در دیکشنری `data` ذخیره می‌شوند. این دیکشنری توسط PrairieLearn با فرمت JSON ذخیره می‌شود و در نتیجه، **هر چیزی در `data` باید قابل سریال‌سازی با JSON (JSON serializable) باشد**. برخی از انواع داده در پایتون به طور ذاتی قابل سریال‌سازی با JSON هستند، مانند رشته‌ها، لیست‌ها و دیکشنری‌ها، در حالی که برخی دیگر چنین نیستند، مانند اعداد مختلط (complex numbers)، آرایه‌های ndarray در numpy و DataFrames در pandas.

کتابخانه پایتون `prairielearn` توابع کمکی [`to_json`][prairielearn.conversion_utils.to_json] و [`from_json`][prairielearn.conversion_utils.from_json] (بخشی از [`conversion_utils.py`](https://github.com/PrairieLearn/PrairieLearn/blob/master/apps/prairielearn/python/prairielearn/conversion_utils.py)) را فراهم می‌کند که می‌توانند اشیاء گوناگون را برای ذخیره‌سازی به عنوان بخشی از داده‌های سوال، سریال‌سازی و دی‌سریال‌سازی کنند. لطفاً برای اطلاعات بیشتر به مستندات آن توابع مراجعه نمایید. در اینجا یک مثال ساده از نحوه استفاده از آن‌ها برای ذخیره و بازیابی یک آرایه numpy آورده شده است:

```python title="server.py"
import numpy as np
import prairielearn as pl


def generate(data):
    data["params"]["numpy_array"] = pl.to_json(np.array([1.2, 3.5, 5.1]))


def grade(data):
    pl.from_json(data["params"]["numpy_array"])
```

تابع [`pl.to_json`][prairielearn.conversion_utils.to_json] از گزینه‌های فقط-کلیدواژه‌ای (keyword-only) برای انواع مختلف رمزگذاری‌ها پشتیبانی می‌کند (مانند `pl.to_json(var, df_encoding_version=2)`). این گزینه‌ها افزوده شده‌اند تا ضمن حفظ سازگاری عقروعلی با کاربردهای پیشین، امکان استفاده از رفتارهای رمزگذاری جدید را فراهم آورند.

- گزینه `df_encoding_version` رمزگذاری DataFrameهای کتابخانه Pandas را کنترل می‌کند. رمزگذاری یک دیتافریم `df` با تنظیم `pl.to_json(df, df_encoding_version=2)` امکان ذخیره مقادیر گم‌شده (missing) و تاریخ/زمان را فراهم می‌کند، در حالی که `pl.to_json(df, df_encoding_version=1)` (پیش‌فرض) این قابلیت را ندارد. با این حال، `df_encoding_version=1` از اعداد مختلط پشتیبانی می‌کند، در حالی که `df_encoding_version=2` این پشتیبانی را ندارد.

- گزینه `np_encoding_version` رمزگذاری مقادیر Numpy را کنترل می‌کند. هنگام استفاده از `np_encoding_version=1`، فقط `np.float64` و `np.complex128` می‌توانند توسط `pl.to_json` سریال‌سازی شوند و نوع آن‌ها پس از دی‌سریال‌سازی حذف خواهد شد (به ترتیب به `float` و `complex` بومی پایتون تبدیل می‌شوند). توصیه می‌شود `np_encoding_version=2` را تنظیم کنید که از سریال‌سازی تمام اسکالرهای numpy پشتیبانی می‌کند و منجر به حذف نوع در هنگام دی‌سریال‌سازی نمی‌شود.

## دسترسی به فایل‌ها روی دیسک {: #accessing-files-on-disk }

توابع موجود در `server.py` همچنین می‌توانند محتوای پوشه‌های مختلف مرتبط با سوال، از جمله `serverFilesCourse/` و `clientFilesQuestion/` را از طریق دیکشنری `data["options"]` بازیابی کنند. برای جزئیات بیشتر، به [مستندات فایل‌های کلاینت و سرور](../clientServerFiles.md#accessing-files-from-serverpy-question-code) مراجعه کنید.

### دسترسی به هویت کاربر و گروه

درس‌ها می‌توانند این امکان را فعال (opt-in) کنند که `server.py` هویت کاربر و گروه را دریافت کند. مالک درس می‌تواند این گزینه را در صفحه تنظیمات درس فعال سازد. در صورت فعال‌سازی، `data["options"]` شامل دو کلید اضافی خواهد بود: `data["options"]["user"]` و `data["options"]["group"]`.

```python
def generate(data):
    user = data["options"]["user"]  # Variant owner; None on group assessments
    # { "uid": "student@example.com", "uin": "123456", "name": "John Doe" }
    group = data["options"]["group"]  # None on individual assessments
    # { "name": "Group 1", "members": [ { "uid": "student@example.com", "uin": "123456", "name": "John Doe" } ] }

    if user is not None:
        data["params"]["greeting"] = f"Hello, {user['name']}!"

    if group is not None:
        # group["members"] entries have the same shape as `user`.
        data["params"]["group_member_uids"] = [m["uid"] for m in group["members"]]
```

دیکشنری `user` دارای کلیدهای `uid` (همیشه موجود)، `uin` و `name` است (دو مورد آخر ممکن است `None` باشند). این دیکشنری در ارزیابی‌های گروهی برابر با `None` است.
دیکشنری `group` شامل `name` و `members` (یک لیست با ساختاری مشابه `user`) است. در صورتی که ارزیابی کار فردی باشد، این مقدار `None` خواهد بود.

??? info "هویت چه کسی ارائه می‌شود؟ (Whose identity is provided)"

    هنگامی که یکی از کادر آموزشی واریانت یک دانشجو را باز می‌کند (مثلاً در نمره‌دهی دستی یا باز کردن نمای دانشجو)، `user` متناظر با دانشجوی صاحب آن واریانت است، نه عضو کادر آموزشی یا بیننده فعلی. ارزیابی‌های گروهی مقدار `None` دریافت می‌کنند زیرا واریانت اشتراکی یک مالک واحد ندارد.

    اعضای یک گروه می‌توانند در طول زمان تغییر کنند: اعضا در زمان تولید سوال ممکن است با اعضا در زمان نمره‌دهی سوال متفاوت باشند. به همین ترتیب، نام، UID و UIN کاربر نیز ممکن است در طول زمان تغییر کند. مقادیر `options["user"]` و `options["group"]` همیشه منعکس‌کننده جدیدترین اطلاعات خواهند بود.

داده‌های کاربر و گروه تنها زمانی به `server.py` ارائه می‌شوند که **همه** شرایط زیر برقرار باشند:

1. درس گزینه دریافت داده‌های کاربر توسط `server.py` را فعال کرده باشد. در محیط پروداکشن، مالک درس این مورد را در صفحه تنظیمات درس فعال می‌کند؛ برای توسعه محلی، می‌توان به جای آن `"questionsReceiveUserData": true` را زیر `"options"` در فایل `infoCourse.json` تنظیم کرد که این گزینه تنها در حالت توسعه معتبر است.
2. سوال به اشتراک گذاشته نشده باشد. به محض اینکه یک سوال یا سورس‌کد آن به صورت عمومی به اشتراک گذاشته شود، `server.py` هرگز داده‌های کاربر را دریافت نخواهد کرد، از جمله در درس خود سوال و در پیش‌نمایش‌های عمومی.
3. سوال در درس اصلی خود رندر شود. برای سوالاتی که از یک درس دیگر از طریق مجموعه اشتراک‌گذاری (sharing set) وارد شده‌اند، فارغ از تنظیمات هر یک از درس‌ها، `server.py` هرگز داده‌های کاربر را دریافت نمی‌کند.

هنگامی که داده‌های کاربر به `server.py` ارائه نمی‌شوند، مقادیر `data["options"]["user"]` و `data["options"]["group"]` هر دو برابر `None` هستند. این کلیدها همیشه وجود دارند.

## تولید فایل‌های پویا با `file()` {: #generating-dynamic-files-with-file }

می‌توانید اشیاء فایل را به صورت پویا در `server.py` تولید کنید. این فایل‌ها هرگز به صورت فیزیکی روی دیسک قرار نمی‌گیرند. آن‌ها در `file()` تولید شده و به صورت رشته، اشیاء شبیه بایت (bytes-like) یا اشیاء شبیه فایل (file-like) برگردانده می‌شوند. تابع `file()` به همان شیء `data` که توسط تابع `generate()` ایجاد شده است، از جمله `data["params"]` و `data["correct_answers"]` دسترسی دارد. یک مثال کامل از `question.html` و `server.py` که از یک فایل پویای `fig.png` استفاده می‌کند، به این صورت است:

```html title="question.html"
<p>Here is a dynamically-rendered figure showing a line of slope $a = {{params.a}}$:</p>
<pl-figure file-name="fig.png" type="dynamic"></pl-figure>
```

```python title="server.py"
import random
import io
import matplotlib.pyplot as plt


def generate(data):
    data["params"]["a"] = random.choice([0.25, 0.5, 1, 2, 4])


def file(data):
    # check for the appropriate filename
    if data["filename"] == "fig.png":
        # plot a line with slope "a"
        plt.plot([0, data["params"]["a"]], [0, 1])
        # make a bytes object (a buffer)
        buf = io.BytesIO()
        # save the figure data into the buffer
        plt.savefig(buf, format="png")
        return buf
```

درخواست‌ها برای فایل‌ها به این URL به تابع `file()` در `server.py` هدایت می‌شوند زیرا ویژگی `type` المان `pl-figure` برابر با `"dynamic"` تنظیم شده است. نام فایل درخواستی در `data["filename"]` ذخیره می‌شود و محتوای فایل باید از تابع `file()` برگردانده شود.

توصیه می‌کنیم برای نمایش یا دانلود فایل‌ها از المان‌های [`pl-figure`](../elements/pl-figure.md) و [`pl-file-download`](../elements/pl-file-download.md) استفاده کنید. به طور خاص، باید از `pl-file-download` برای فایل‌هایی که باید دانلود شوند یا در تب جداگانه‌ای نمایش یابند (مانند PDFها، کدهای منبع و غیره) و از `pl-figure` برای تصاویری که باید درون صفحه نمایش داده شوند، استفاده کنید.

??? info "استفاده پیشرفته از فایل‌های پویا (Advanced dynamic file usage)"

    نشانی URL برای فایل‌های تولیدشده به صورت پویا در HTML بر روی `{{options.client_files_question_dynamic_url}}` تنظیم شده است که یک URL ویژه است که PrairieLearn از آن برای هدایت درخواست‌ها به تابع `file()` استفاده می‌کند. در عوض می‌توانید `question.html` را به این صورت بنویسید:

    ```html title="question.html"
    <p>Here is a dynamically-rendered figure showing a line of slope $a = {{params.a}}$:</p>
    <img src="{{options.client_files_question_dynamic_url}}/fig.png" />
    ```

### فایل‌های پویا که به داده‌های پاسخ ارسالی وابسته‌اند

هنگامی که یک فایل پویا در پنل پاسخ ارسالی (submission panel) گنجانده می‌شود، به اطلاعات پاسخ ارسالی نیز دسترسی خواهد داشت؛ از جمله `data["submitted_answers"]`، `data["score"]`، `data["partial_scores"]` و [سایر داده‌های مرتبط با پاسخ ارسالی که در بالا ذکر شدند](#data-field-scopes).

اگر فایل پویای شما به داده‌های پاسخ ارسالی وابسته است (مثلاً `data["submitted_answers"]`)، باید اطمینان حاصل کنید که المان `pl-figure` یا `pl-file-download` تنها در پنل پاسخ ارسالی قابل مشاهده باشد. این کار را می‌توان با قرار دادن المان در داخل تگ `<pl-submission-panel>` مطابق شکل زیر انجام داد. این تضمین می‌کند که فایل تنها پس از ارسال پاسخ توسط دانشجو تولید شود.

```html title="question.html"
<pl-submission-panel>
  <p>Here is a dynamically-rendered figure showing your submitted answer:</p>
  <pl-figure file-name="submitted.png" type="dynamic"></pl-figure>
</pl-submission-panel>
```

توجه داشته باشید که پنل پاسخ ارسالی فایل را برای هر نوع ارسالی فراخوانی می‌کند، از جمله:

- ارسال‌های معتبر (درست یا نادرست).
- ارسال‌های نامعتبر (مانند ارسال‌های دارای خطای فرمت).
- ارسال‌های «فقط ذخیره» (مانند زمانی که دانشجو روی "Save only" کلیک می‌کند یا در آزمونی بدون نمره‌دهی بلادرنگ).

باید اطمینان حاصل کنید که کد تولید فایل شما توانایی مدیریت تمامی این حالت‌ها را دارد. برای نمونه، اگر فایل به یک پاسخ ارسالی معتبر وابسته است، باید قبل از استفاده، وجود و معتبر بودن پاسخ در `data["submitted_answers"]` را بررسی کنید. اگر پاسخ وجود ندارد، می‌توانید یک فایل پیش‌فرض یا یک تصویر خالی تولید کنید.

```python title="server.py"
def file(data):
    if data["filename"] == "submitted.png":
        if data["submitted_answers"].get("y") is None:
            # generate a default image
        else:
            # generate the file using data["submitted_answers"]["y"]
```

به عنوان روش جایگزین، می‌توانید با استفاده از شرط mustache روی `data["format_errors"]`، تصویر را در HTML تنها زمانی بگنجانید که پاسخ موجود و معتبر باشد:

```html title="question.html"
<pl-submission-panel>
  {{^format_errors.y}}
  <p>Here is a dynamically-rendered figure showing your submitted answer:</p>
  <pl-figure file-name="submitted.png" type="dynamic"></pl-figure>
  {{/format_errors.y}}
</pl-submission-panel>
```

به ویژه توجه داشته باشید که در ارسال‌های «فقط ذخیره» (Save only)، نمرات مقداردهی نمی‌شوند. اگر فایل پویای شما از اطلاعات نمره استفاده می‌کند، باید قبل از استفاده بررسی کنید که `data["score"]` یا مقادیر موجود در `data["partial_scores"]` برابر با `None` نباشند.

## تست کردن سوالات با `test()` {: #testing-questions-with-test }

قابلیت تست سوال زیر تب «تنظیمات» (Settings) برای هر سوال در دسترس است.

![دکمه‌های تست](test-buttons.png)

تابع `test()` برای آزمایش سوال فراخوانی می‌شود. این تابع می‌تواند برای اطمینان از عملکرد صحیح سوال شما به کار رود. مقدار `raw_submitted_answers` تولیدشده توسط تابع `test()` به جای پاسخ ارسالی دانشجو استفاده خواهد شد و سایر فیلدها با نتیجه پارس و نمره‌دهی مقایسه می‌شوند. اگر کد شما دچار خطا (crash) شود یا هر یک از فیلدها متفاوت باشند، آزمون یک مشکل گزارش می‌دهد.

!!! warning "مهم"

    اکثر سوالات نیازی به پیاده‌سازی تابع `test()` در `server.py` ندارند. شما تنها در موارد زیر نیاز به پیاده‌سازی آن دارید:

    1. در مرحله `generate` یا `prepare` سوال خود، مقدار `correct_answers` را تنظیم نکنید. در این سناریو، المان‌هایی که استفاده می‌کنید نحوه تولید مجموعه ورودی‌های صحیح را نمی‌دانند و این مسئولیت به تابع `test()` در `server.py` منتقل می‌شود.
    2. از المان‌هایی استفاده کنید که تابع `test()` را پیاده‌سازی نکرده‌اند. تمامی المان‌های رسمی خود پلتفرم این تابع را پیاده‌سازی کرده‌اند، بنابراین این موضوع تنها در صورت استفاده از یک المان سفارشی در درس مطرح می‌شود.
    3. از یک تابع سفارشی `grade` استفاده کنید که رفتار نمره‌دهی سوال را تغییر می‌دهد. در این حالت، باید اطمینان حاصل کنید که تابع `test()` ورودی‌های مناسبی را برای آزمودن منطق نمره‌دهی سفارشی شما تولید می‌کند.

تابع `test()` خروجی تابع `prepare()` را همراه با پارامتر `test_type` دریافت می‌کند. مقدار `test_type` یکی از مقادیر `correct`، `incorrect` یا `invalid` است. تابع شما باید `raw_submitted_answers` را بر اساس ورودی‌ها (مانند `data["correct_answers"]`) و `test_type` تولید کند. همچنین باید `score` و `feedback` را نیز به‌روزرسانی کند.

![چرخه تست](./test-cycle.d2){ pad="0" scale="1"}
