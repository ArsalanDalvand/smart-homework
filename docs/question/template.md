# فایل `question.html`

## فایل قالب (Template)

تمام فایل‌های `question.html` با [موتور قالب Mustache](https://mustache.github.io/mustache.5.html) پردازش می‌شوند، که امکان رندر پویای پایه‌ای HTML را فراهم می‌کند. علاوه بر این، از موارد زیر پشتیبانی می‌کند:

- [**رندر پنل‌ها**](#rendering-panels-from-questionhtml): این پنل‌ها تعیین می‌کنند چه چیزی هنگام مشاهده سوال، مشاهده پاسخ ارسالی یا مشاهده پاسخ صحیح توسط دانشجو نشان داده شود.

- [**مارک‌داون (Markdown)**](#markdown-in-questions): کد HTML و المان‌های سفارشی برای انعطاف‌پذیری و قدرت بیان عالی هستند. با این حال، کار با حجم زیادی از متن، قالب‌بندی متن و مواردی از این دست در آن‌ها چندان ساده نیست. [Markdown](https://github.com/adam-p/markdown-here/wiki/Markdown-Cheatsheet) یک سینتکس نشانه‌گذاری متنی سبک است که برای نگارش متون ساده اما غنی ایده‌آل است.

- [**LaTeX**](#using-latex-in-questions-math-mode): سامانه PrairieLearn از معادلات LaTeX در سوالات پشتیبانی می‌کند.

## رندر پنل‌ها از `question.html`

هنگامی که یک سوال به دانشجو نمایش داده می‌شود، سه «پنل» وجود دارد که در مراحل مختلف نمایش داده می‌شوند: پنل `"question"` (سوال)، پنل `"submission"` (پاسخ ارسالی)، و پنل `"answer"` (پاسخ صحیح). این‌ها به ترتیب صورت سوال، راه‌حل ارائه‌شده توسط دانشجو و پاسخ صحیح را نمایش می‌دهند.

![پنل‌های سوال](./panels.png)

پنل `"question"` هنگامی که سوال برای اولین بار به دانشجو نشان داده می‌شود نمایش می‌یابد. پنل `"submission"` هر بار که دانشجو پاسخی را ذخیره می‌کند نمایش داده می‌شود؛ اگر دانشجو چندین پاسخ را به همان گونه ارسال کند، ممکن است چندین پنل پاسخ ارسالی وجود داشته باشد. پنل `"answer"` بر اساس پیکربندی سوال/ارزیابی نمایش داده می‌شود؛ به‌طور پیش‌فرض، زمانی نشان داده می‌شود که دانشجو پاسخ صحیح را ارسال کند یا فرصت‌های تلاش او تمام شود. برای جزئیات بیشتر در مورد نحوه نمایش این پنل‌ها، می‌توانید [نمودار چرخه حیات](server.md#question-lifecycle) را مشاهده کنید.

هر سه پنل بر اساس یک قالب یکسان `question.html` نمایش داده می‌شوند، اما المان‌ها در هر پنل به صورت متفاوتی رندر می‌شوند. برای مثال، المان `<pl-number-input>` در پنل "question" یک کادر ورودی، در پنل "submissions" پاسخ ارسالی، و در پنل "answer" پاسخ صحیح را نمایش می‌دهد.

### پنل `"question"`

متن موجود در `question.html` را می‌توان با قرار دادن در داخل [المان `<pl-question-panel>`](../elements/pl-question-panel.md) طوری تنظیم کرد که فقط در پنل "question" نمایش داده شود. این کار برای صورت سوال مفید است که نیازی به تکرار آن در پنل‌های "submission" و "answer" نیست. برای مثال:

=== "خوب (Good)"

    ```html
    <pl-question-panel>
      <p>What is y, if y is 1 + 3?</p>
    </pl-question-panel>
    <pl-number-input answers-name="y" label="$y =$"></pl-number-input>
    ```

=== "بد (Bad)"

    ```html { .no-copy }
    <p>What is y, if y is 1 + 3?</p>
    <pl-number-input answers-name="y" label="$y =$"></pl-number-input>
    ```

    سوال در پنل‌های "submission" و "answer" تکرار خواهد شد که غیرضروری است و می‌تواند برای دانشجویان گیج‌کننده باشد.

### پنل `"submission"`

به‌طور پیش‌فرض، بازخوردی که توسط المان‌ها داده می‌شود (`data["partial_scores"][NAME]["feedback"]`) هنگامی که یک المان در پنل "submission" رندر می‌شود، به نمایش درمی‌آید. شما می‌توانید از [`pl-submission-panel`](../elements/pl-submission-panel.md) برای نشان دادن متن اضافی فقط در پنل "submission" استفاده کنید. برای مثال:

=== "خوب (Good)"

    ```html
    <pl-submission-panel>
      <p>
        Feedback: {{feedback.y}}
      </p>
    </pl-submission-panel>
    ```

=== "بد (Bad)"

    ```html { .no-copy }
    <p>Feedback: {{feedback.y}}</p>
    ```

    این کار بازخورد را در پنل‌های "question" و "answer" نیز نشان می‌دهد که غیرضروری است و می‌تواند برای دانشجویان گیج‌کننده باشد. از آنجا که `feedback.y` تا زمانی که دانشجو پاسخی ارسال نکند تعریف نخواهد شد، در پنل "question" به صورت یک رشته خالی ظاهر می‌شود و صرفاً `"Feedback: "` را نشان می‌دهد.

جزئیات بیشتر درباره ارائه بازخورد را می‌توانید در [صفحه `server.py`](server.md#providing-feedback) بیابید.

### پنل `"answer"`

به‌طور پیش‌فرض، پاسخ‌های صحیح در پنل "answer" نشان داده می‌شوند. این قابلیت را می‌توان با تنظیم `showCorrectAnswer: false` در فایل `info.json` سوال غیرفعال کرد. مورد سوالات متداول ["چگونه می‌توانم پاسخ صحیح را هنگامی که دانشجویان نتایج نمره‌دهی خود را می‌بینند پنهان کنم؟"](../faq.md#how-can-i-hide-the-correct-answer-when-students-see-their-grading-results) تکنیک‌های دیگری را برای پنهان کردن پاسخ صحیح شرح می‌دهد.

اگر سوالی را با استفاده از یک [تابع نمره‌دهی سفارشی](./server.md#step-5-grade)، یک [نمره‌دهنده خارجی](../externalGrading.md) یا با استفاده از [نمره‌دهی دستی](../manualGrading/index.md) نمره‌دهی می‌کنید، توصیه می‌شود یک پاسخ صحیح را نمایش دهید تا دانشجویان بتوانند آن را در پنل پاسخ ببینند. اگر چندین پاسخ صحیح وجود دارد، باید یادداشتی را درون المان [`pl-answer-panel`](../elements/pl-answer-panel.md) اضافه کنید مبنی بر اینکه هر پاسخ صحیحی پذیرفته می‌شود و پاسخ نمایش‌داده‌شده صرفاً یک نمونه است. همچنین می‌توانید متن اضافی نیز در پنل پاسخ نشان دهید، مانند توضیحات تکمیلی برای پاسخ‌های صحیح.

## قالب‌های Mustache

هر متنی در آکولادهای دوتایی (مانند `{{params.m}}`) با مقادیر متغیرها با استفاده از [Mustache](https://mustache.github.io/mustache.5.html) جایگزین می‌شود. این پارامترها معمولاً توسط [`server.py` یک سوال](server.md) تعریف می‌شوند. برای مثال، اگر `params["m"]` در `server.py` تعریف شده باشد، می‌توانید از آن در `question.html` به صورت زیر استفاده کنید:

```html title="question.html"
<p>If m is {{params.m}}, what is {{params.m}} * 3?</p>
```

این به صورت زیر رندر خواهد شد:

```html
<p>If m is 5, what is 5 * 3?</p>
```

### داده‌های در دسترس قالب‌های Mustache

هنگامی که دانشجو برای اولین بار یک گونه سوال را مشاهده می‌کند، توابع `parse` و `grade` هنوز اجرا نشده‌اند، بنابراین مقادیر تنظیم‌شده در `data` توسط آن توابع برای قالب در دسترس نخواهند بود. هر تابع `server.py` محدودیت‌هایی در نحوه اصلاح شیء `data` دارد که در [جدول توابع `server.py`](./server.md#serverpy-functions) مستند شده است. برای مثال، در فاز `generate`، فقط می‌توانید `data["params"]` و `data["correct_answers"]` را تغییر دهید.

برای اطلاعات دقیق درباره زمان فراخوانی توابع `server.py`، [نمودار چرخه حیات سوال](./server.md#question-lifecycle) را ببینید. توجه داشته باشید که هرگونه تغییر در شیء `data` در فازهای بعدی مانند `parse` یا `grade` ماندگار خواهد شد و برای رندرهای بعدی سوال استفاده می‌شود. به عنوان مثال، اگر تابع `grade` مقدار `data["params"]` را پس از ارسال دانشجو تغییر دهد، مقدار به‌روزشده `data["params"]` زمانی که سوال دوباره رندر می‌شود استفاده خواهد شد.

### رندر پیشرفته

می‌توانید از سینتکس زیر برای رندر شرطی یک قطعه HTML استفاده کنید:

```html title="question.html"
{{#params.show}}
<p>This will only show up if params.show is true</p>
{{/params.show}}
```

می‌توانید از این سینتکس برای پیمایش روی آرایه‌ای از رشته‌ها استفاده کنید (علامت `.` نشان‌دهنده آیتم جاری در آرایه است):

```html title="question.html"
{{#params.items}}
<p>{{.}}</p>
{{/params.items}}
```

!!! info "رندر HTML"

    به‌طور پیش‌فرض، Mustache هنگام استفاده از آکولاد دوتایی (`{{params.x}}`) کاراکترهای ویژه را اسکیپ (Escape) می‌کند. این تضمین می‌کند هر محتوایی که ممکن است حاوی کاراکترهای مورد استفاده در HTML باشد (مانند نقل‌قول‌ها یا کاراکترهای `<`) در زمینه اصلی خود نمایش داده شده یا تفسیر شود.

    می‌توانید از آکولادهای سه‌تایی (مثلاً `{{{params.html}}}`) برای جایگزینی مستقیم HTML خام بدون اسکیپ کردن استفاده کنید. این کار فقط باید برای محتوایی استفاده شود که توسط مدرس تعریف شده است. اگر می‌خواهید HTML ارائه‌شده توسط دانشجو را رندر کنید، می‌توانید از [المان `<pl-xss-safe>`](../elements/pl-xss-safe.md) استفاده کنید.

### پنهان کردن یادداشت‌های کادر آموزشی در `question.html`

کامنت‌های HTML یا JavaScript در سورس `question.html` شما در سورس صفحه رندرشده برای دانشجویان قابل مشاهده هستند. برای گذاشتن یادداشت‌های نگهداری کوچک برای کادر آموزشی در سورس `question.html`، باید از [کامنت‌های Mustache](https://mustache.github.io/mustache.5.html#Comments) (`{{! ... }}`) استفاده کنید که در طول فرآیند رندر حذف خواهند شد. هرگز اطلاعات حساس، مانند راه‌حل‌ها را در یک کامنت HTML/JS قرار ندهید.

مثال:

```html
<!-- This HTML comment will not be visible to students in the web page, 
 but *will be included* in the rendered page source, so students may be able to
 see it by reading the HTML source. -->
{{! This Mustache comment will NOT be included in the rendered page source. }}
```

## نگارش Markdown در سوالات

می‌توانید از تگ ویژه `<markdown>` برای تبدیل خودکار محتوای آن به HTML استفاده کنید. در اینجا نمونه‌ای از `question.html` آمده است که از این المان استفاده می‌کند:

<!-- prettier-ignore -->
```html title="question.html"
<markdown>
# Hello, world!

This is some **Markdown** text.
</markdown>
```

آن سوال به این صورت رندر می‌شود:

```html
<h1>Hello, world!</h1>
<p>This is some <strong>Markdown</strong> text.</p>
```

!!! warning

    مارک‌داون دندانه‌گذاری (Indentation) را به عنوان بلوک کد شناسایی می‌کند، بنابراین متن داخل این تگ‌ها نباید با محتوای HTML متناظر دندانه‌گذاری شود.

    === "خوب (Good)"

        ```html
        <div>
          <markdown>
        # Hello, world!
          </markdown>
        </div>
        ```
    === "بد (Bad)"

        ```html { .no-copy }
        <div>
          <markdown>
            # Hello, world!
          </markdown>
        </div>
        ```

### بلوک‌های کد Markdown

بلوک‌های کد حصاردار (Fenced code blocks - آن‌هایی که از بک‌تیک سه‌تایی ` ``` ` استفاده می‌کنند) به عنوان [المان‌های `<pl-code>`](../elements/pl-code.md) رندر می‌شوند که سپس طبق معمول توسط PrairieLearn رندر خواهند شد. این بلوک‌ها از مشخص کردن زبان و خطوط برجسته‌شده (Highlight) پشتیبانی می‌کنند که سپس به المان حاصله `<pl-code>` منتقل می‌شوند. مارک‌داون زیر را در نظر بگیرید:

<!-- prettier-ignore -->
````html title="question.html"
<markdown>
```cpp{1-2,4}
int i = 1;
int j = 2;
int k = 3;
int m = 4;
```
</markdown>
````

این به المان `<pl-code>` زیر رندر می‌شود (که خودش در نهایت به HTML استاندارد رندر خواهد شد):

<!-- prettier-ignore -->
```html
<pl-code language="cpp" highlight-lines="1-2,4">
int i = 1;
int j = 2;
int k = 3;
int m = 4;
</pl-code>
```

??? note "گریز از تگ‌های لغوی `<markdown>`"

    سامانه PrairieLearn یک سینتکس ویژه گریز (Escape) تعریف می‌کند تا امکان استفاده از تگ لغوی `<markdown>` یا `</markdown>` در سوال شما فراهم شود. اگر `<markdown#>` یا `</markdown#>` را در یک بلوک Markdown داشته باشید، به ترتیب به صورت `<markdown>` و `</markdown>` رندر می‌شوند (اما برای یافتن بخش‌هایی از متن جهت پردازش به عنوان Markdown استفاده نخواهند شد).

## استفاده از LaTeX در سوالات (حالت ریاضی)

سامانه PrairieLearn از معادلات LaTeX در سوالات پشتیبانی می‌کند. می‌توانید لیست کاملی از [دستورات پشتیبانی‌شده MathJax](https://docs.mathjax.org/en/latest/input/tex/macros/index.html) را مشاهده کنید.

معادلات درون‌خطی (Inline) را می‌توان با استفاده از `$x^2$` یا `\(x^2\)` نوشت، و معادلات نمایشی (Display) را می‌توان با استفاده از `$$x^2$$` یا `\[x^2\]` نوشت. برای مثال:

<!-- prettier-ignore -->
```html title="question.html"
<p>Here is some inline math: $x^2$. Here is some display math: $$x^2$$</p>
<p>What is the total force $F$ currently acting on the particle?</p>

<markdown>
# LaTeX works in Markdown too!

$$\phi = \frac{1+\sqrt{5}}{2}$$
</markdown>
```

### استفاده از علامت دلار ($) بدون فعال‌سازی حالت ریاضی

علامت‌های دلار به‌طور پیش‌فرض نشان‌دهنده محیط‌های **درون‌خطی** (`$ x $`) یا **حالت نمایشی** (`$$ x $$`) هستند.

برای گریز از هر یک از این محیط‌های ریاضی، استفاده از تگ `<markdown>` در PrairieLearn و سینتکس کد درون‌خطی را مد نظر قرار دهید.

<!-- prettier-ignore -->
```html
<markdown>
What happens if we use a `$` to reference the spreadsheet cell location `$A$1`?
</markdown>
```

در مواردی که استفاده از محیط کد منطقی نیست، در نظر داشته باشید که ریاضیات را به طور کامل با اضافه کردن کلاس `mathjax_ignore` به یک المان HTML غیرفعال کنید.

```html
<div class="mathjax_ignore">
  Mary has $5 to spend. If each apple costs $2 dollars and a banana costs $1 dollar, then how many
  pieces of fruit can Mary get?
</div>

<div>$x = 1$ and I have <span class="mathjax_ignore">$</span>5 dollars.</div>
```

### استفاده از مقادیر Mustache درون آکولادهای LaTeX

زبان LaTeX از آکولادها برای گروه‌بندی استفاده می‌کند (مثلاً `\frac{a}{b}`)، که می‌تواند با [سینتکس `{{ }}` در Mustache](#mustache-templates) تداخل داشته باشد. هنگامی که یک تگ Mustache مستقیماً درون یک آکولاد LaTeX قرار می‌گیرد، دنباله `{{{` به عنوان یک [تگ Mustache سه‌آکولادی (اسکیپ‌نشده)](#advanced-rendering) تفسیر می‌شود و رندر سوال با شکست مواجه شده یا خروجی غیرمنتظره‌ای تولید می‌کند.

```html { title="question.html" .no-copy }
<!-- Bad: `{{{` is parsed as a triple-brace Mustache tag. -->
<p>$\frac{{{params.a}}}{{{params.b}}}$</p>
```

سه روش برای جلوگیری از این وضعیت وجود دارد:

1. **اضافه کردن یک فاصله قبل از تگ Mustache.** در جاهایی که LaTeX فاصله‌های خالی را نادیده می‌گیرد (که در بیشتر جاهای حالت ریاضی چنین است)، یک فاصله بین آکولاد LaTeX و تگ Mustache اضافه کنید تا آکولادها دیگر در کنار هم نباشند:

   ```html title="question.html"
   <p>$\frac{ {{params.a}} }{ {{params.b}} }$</p>
   ```

   این روش در جاهایی که فاصله سفید اهمیت دارد، مانند داخل `\text{...}` مناسب نیست.

2. **تغییر جداکننده‌های (Delimiters) موتور Mustache.** موستاش به شما اجازه می‌دهد [جداکننده‌ها را تغییر دهید](https://mustache.github.io/mustache.5.html#Set-Delimiter) با استفاده از یک تگ تنظیم جداکننده، مثلاً `{{=<% %>=}}`. پس از آن، تگ‌های Mustache به صورت `<% params.a %>` نوشته می‌شوند و با `{{` و `}}` مانند کاراکترهای معمولی رفتار می‌شود. می‌توانید با `<%={{ }}=%>` دوباره به جداکننده‌های پیش‌فرض برگردید.

   ```html title="question.html"
   {{=<% %>=}}
   <p>$\frac{<% params.a %>}{<% params.b %>}$</p>
   <%={{ }}=%>
   ```

   هر تگ Mustache پس از تغییر تگ جداکننده باید از جداکننده‌های جدید استفاده کند. توصیه می‌شود (هرچند الزامی نیست) پس از عبارت LaTeX به جداکننده‌های پیش‌فرض بازگردید، زیرا این کار قالب‌بندی را برای سایر نویسندگان سوال خواناتر و آشناتر می‌کند.

3. **ساخت فرمول در `server.py`.** رشته کامل LaTeX را در پایتون بسازید و آن را در `data["params"]` ذخیره کنید، به طوری که `question.html` تنها به یک تگ Mustache واحد نیاز داشته باشد:

   ```python title="server.py"
   def generate(data):
       a = 3
       b = 4
       data["params"]["formula"] = rf"\frac{{{a}}}{{{b}}}"
   ```

   ```html title="question.html"
   <p>${{params.formula}}$</p>
   ```

   توجه داشته باشید که اگر از f-stringها استفاده می‌کنید، باید آکولادها را در رشته دوبل کنید تا اسکیپ شوند، همان‌طور که در مثال بالا نشان داده شده است. همچنین می‌توانید از رشته خام (پیشوند `r`) استفاده کنید تا از اسکیپ کردن بک‌اسلش‌ها در دستورات LaTeX بی‌نیاز شوید.
