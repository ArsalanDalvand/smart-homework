# المان `pl-order-blocks`

المان مخصوص مرتب‌سازی بلوک‌های کد یا متنی که در ابتدا در *ناحیه مبدأ* (source area) نمایش داده می‌شوند. این بلوک‌ها را می‌توان به *ناحیه پاسخ* (solution area) منتقل کرد تا راه‌حل مسئله ساخته شود. در مثال زیر، ناحیه مبدأ با عنوان "Drag from here" و ناحیه پاسخ با عنوان "Construct your solution here" مشخص شده‌اند.

## المان نمونه

![تصویر المان pl-order-blocks](pl-order-blocks.png)

```html title="question.html"
<p>List all the even numbers in order:</p>
<pl-order-blocks answers-name="order-numbers">
  <pl-answer correct="false">1</pl-answer>
  <pl-answer correct="true">2</pl-answer>
  <pl-answer correct="false">3</pl-answer>
  <pl-answer correct="true">4</pl-answer>
</pl-order-blocks>
```

## سفارشی‌سازی‌ها

| ویژگی | نوع | پیش‌فرض | توضیحات |
| --- | --- | --- | --- |
| `allow-blank` | boolean | false | مشخص می‌کند که آیا خالی بودن ناحیه پاسخ مجاز است یا خیر. به طور پیش‌فرض، یک ناحیه پاسخ خالی بدون هیچ بلوکی نمره‌دهی نخواهد شد (فرمت نامعتبر). |
| `answers-name` | string | — | نام متغیر برای ذخیره داده‌ها. توجه داشته باشید که این ویژگی باید در یک سوال یکتا باشد؛ یعنی هیچ مقداری برای این ویژگی نباید در یک سوال تکرار شود. |
| `code-language` | string | — | زبان برنامه‌نویسی برای برجسته‌سازی نحو (syntax highlighting). تنها در صورت استفاده از `format="code"` در دسترس است. |
| `display-blocks` | `vertical` یا `inline-wrap` یا `inline-nowrap` | `vertical` | مقدار `vertical` بلوک‌ها را به صورت عمودی روی هم می‌چیند؛ مقادیر `inline-wrap` و `inline-nowrap` بلوک‌ها را در یک ردیف قرار می‌دهند، به طوری که `inline-wrap` در صورت نیاز بلوک‌ها را به چند خط می‌شکند، و `inline-nowrap` همه بلوک‌ها را در یک خط با اسکرول افقی قرار می‌دهد. |
| `distractor-order` | `"random"` یا `"inherit"` | `"inherit"` | کنترل می‌کند که آیا گزینه‌های انحرافی با بلوک صحیح مرتبط خود بر هم زده (shuffle) شوند یا خیر. مقدار `"random"` هر بلوک صحیح را همراه با گزینه‌های انحرافی‌اش (بلوک‌های دارای `distractor-for` منطبق) بر هم می‌زند. مقدار `"inherit"` گزینه‌های انحرافی را در ترتیبی که توسط `source-blocks-order` تعیین شده نگه می‌دارد. همراه با `source-blocks-order="random"` قابل استفاده نیست. هنگام استفاده از `"random"` با `source-blocks-order="alphabetized"`، فهرست کلی دقیقاً الفبایی نخواهد بود. |
| `feedback` | `"none"`, `"first-wrong"` یا `"first-wrong-verbose"` | `"none"` | سطح بازخوردی که دانشجو در صورت ارائه پاسخ نادرست دریافت می‌کند. در حالت نمره‌دهی `"dag"` یا `"ranking"` در دسترس است. مقدار `"none"` بازخوردی ارائه نمی‌دهد. مقدار `"first-wrong"` به دانشجو می‌گوید که کدام بلوک در پاسخ او اولین مورد نادرست بوده است. در صورت تنظیم روی `"first-wrong-verbose"`، اگر اولین بلوک نادرست یک گزینه انحرافی باشد، هرگونه بازخورد مرتبط با آن گزینه انحرافی نیز نمایش داده خواهد شد (به "distractor-feedback" در `<pl-answer>` مراجعه کنید). |
| `file-name` | string | `"user_code.py"` | نام فایلی که اطلاعات بلوک‌ها در آن ذخیره می‌شود تا توسط مصحح خارجی استفاده شود. |
| `format` | `"code"` یا `"default"` | `"default"` | اگر این ویژگی روی `"code"` تنظیم شود، محتوای هر یک از بلوک‌ها درون یک المان `<pl-code>` قرار می‌گیرد. |
| `grading-method` | `"ordered"`, `"unordered"`, `"ranking"`, `"dag"`, `"external"` | `"ordered"` | روش نمره‌دهی مورد استفاده، مطابق با توضیحات زیر. |
| `indentation` | boolean | false | فعال‌سازی امکان ایجاد تورفتگی در ناحیه پاسخ و همچنین نمره‌دهی تورفتگی مورد انتظار (تعیین‌شده توسط `indent` در `pl-answer`، همان‌طور که در زیر شرح داده شده است). |
| `max-incorrect` | integer | توضیحات را ببینید | حداکثر تعداد پاسخ‌های نادرست برای نمایش در ناحیه مبدأ. پاسخ‌های نادرست با `<pl-answer correct="false">` تعیین می‌شوند. پیش‌فرض نمایش تمام پاسخ‌های نادرست است. |
| `max-indent` | integer | 4 | حداکثر عمق تورفتگی ممکن برای بلوک‌ها در ناحیه پاسخ. تنها در صورت فعال بودن `indentation` اعمال می‌شود. |
| `min-incorrect` | integer | توضیحات را ببینید | حداقل تعداد پاسخ‌های نادرست برای نمایش در ناحیه مبدأ. پاسخ‌های نادرست با `<pl-answer correct="false">` تعیین می‌شوند. پیش‌فرض نمایش تمام پاسخ‌های نادرست است. |
| `partial-credit` | `"none"` یا `"lcs"` | `"none"` | برای روش‌های نمره‌دهی `"dag"`، `"ordered"` و `"ranking"`، می‌توانید `"none"` را برای عدم اعطای نمره بخشی یا `"lcs"` را برای نمره بخشی بر اساس فاصله ویرایشی بزرگ‌ترین زیردنباله مشترک (LCS) از پاسخ دانشجو تا یک پاسخ صحیح تعیین کنید. مقدار پیش‌فرض `partial-credit` برای روش‌های نمره‌دهی `"dag"`، `"ordered"` و `"ranking"` برابر با `"none"` است. روش نمره‌دهی `"unordered"` همواره نمره بخشی اعطا می‌کند. |
| `solution-header` | string | `"Construct your solution here:"` | متنی که در ابتدای ناحیه پاسخ نمایش داده می‌شود. |
| `solution-placement` | `"right"` یا `"bottom"` | `"right"` | مقدار `"right"` نواحی مبدأ و پاسخ را در کنار هم نمایش می‌دهد. مقدار `"bottom"` ناحیه پاسخ را در زیر ناحیه مبدأ نمایش می‌دهد. |
| `source-blocks-order` | `"random"`, `"ordered"`, `"alphabetized"` یا `"random-sections"` | `"alphabetized"` | ترتیب بلوک‌ها در ناحیه مبدأ. جزئیات بیشتر را در زیر ببینید. |
| `source-header` | string | `"Drag from here:"` | متنی که در ابتدای ناحیه مبدأ نمایش داده می‌شود. |
| `weight` | integer | 1 | ضریب وزنی مورد استفاده هنگام محاسبه میانگین نمره وزن‌دار روی تمام المان‌های یک سوال. |

در داخل المان `pl-order-blocks`، هر المان باید یا یک `pl-answer` یا یک `pl-block-group` باشد (برای اطلاعات بیشتر درباره `pl-block-group` به جزئیات زیر مراجعه کنید). هر المان درون یک `pl-block-group` باید یک `pl-answer` باشد. المان‌های `pl-answer` محتوای هر یک از بلوک‌ها را مشخص می‌کنند و می‌توانند ویژگی‌های زیر را داشته باشند. ویژگی‌های علامت‌گذاری شده با \* می‌توانند به `pl-block-group` نیز اعمال شوند.

| ویژگی | نوع | پیش‌فرض | توضیحات |
| --- | --- | --- | --- |
| `correct` | boolean | true | مشخص می‌کند که آیا بلوک پاسخ یک پاسخ صحیح به سوال است (و باید به ناحیه پاسخ منتقل شود) یا خیر. |
| `depends`\* | string | — | ویژگی اختیاری در زمان استفاده از `grading-method="dag"`. برای تعیین رابطه گراف جهت‌دار بدون دور بین بلوک‌ها استفاده می‌شود که در آن بلوک‌ها با `tag` خود ارجاع داده می‌شوند. برای مثال، اگر برای یک بلوک خاص `depends="1,3"` باشد، باید در راه‌حل بعد از بلوک با `tag="1"` و بلوک با `tag="3"` قرار گیرد. اگر <code>depends="1&vert;3"</code> باشد، بلوک باید در راه‌حل بعد از بلوک با `tag="1"` یا بلوک با `tag="3"` قرار گیرد. |
| `distractor-feedback` | string | — | ویژگی اختیاری مورد استفاده زمانی که `correct=false` است و نشان می‌دهد چرا یک بلوک معین نادرست است یا نباید در پاسخ گنجانده شود. پس از اتمام تمام تلاش‌های مجاز برای سوال، یا در صورتی که `feedback="first-wrong"` باشد و اولین خط نادرست در پاسخ ارسالی دارای `distractor-feedback` باشد، به دانشجو نمایش داده می‌شود. |
| `distractor-for` | string | — | ویژگی اختیاری در بلوک‌هایی با `correct=false`. برای گروه‌بندی بصری یک بلوک انحرافی با یک بلوک صحیح مشابه استفاده می‌شود و باید با ویژگی `tag` بلوکی که باید با آن جفت شود مطابقت داشته باشد. |
| `final` | boolean | — | هنگامی که `grading-method="dag"` باشد و از <code>&vert;</code> برای نشان دادن بلوک‌های اختیاری استفاده شود، باید روی یک یا چند تگ `pl-answer` برابر با `true` باشد. |
| `indent` | عدد صحیح در [-1, 4] | -1 | سطح تورفتگی صحیح بلوک را مشخص می‌کند. برای مثال، `2` یعنی بلوک باید دو بار تورفتگی داشته باشد، در حالی که `-1` به این معنی است که تورفتگی برای آن بلوک نادیده گرفته می‌شود. هنگام استفاده از `indentation="true"`، مقدار `indent` را روی هر بلوکی که تورفتگی آن باید نمره‌دهی شود تنظیم کنید. حذف `indent` معادل با `-1` است. این ویژگی تنها زمانی قابل استفاده است که `indentation="true"` باشد. |
| `ordering-feedback` | string | — | ویژگی اختیاری مورد استفاده زمانی که `grading-method="dag"` یا `grading-method="ranking"` و `correct=true` باشد. برای ارائه بازخورد اختصاصی هنگامی که بلوک در موقعیت اشتباهی نسبت به سایر بلوک‌ها قرار گرفته است به کار می‌رود. این بازخورد پس از ارسال پاسخ به دانشجو نشان داده می‌شود تا خطاهای ترتیب را مشخص کند. |
| `initially-placed` | boolean | false | ویژگی اختیاری که تنها در بلوک‌های صحیح بدون گزینه انحرافی مجاز است. هنگام استفاده، بلوک از ابتدا در ناحیه پاسخ (dropzone) قرار خواهد داشت. |
| `ranking` | عدد صحیح مثبت | — | این ویژگی زمانی استفاده می‌شود که `grading-method="ranking"` باشد و رتبه صحیح بلوک پاسخ را مشخص می‌کند. به عنوان مثال، بلوکی با رتبه `2` باید زیر بلوکی با رتبه `1` قرار گیرد. هنگامی که ترتیب برخی بلوک‌ها مهم نباشد، می‌توان از رتبه یکسان استفاده کرد. بلوک‌هایی که می‌توانند در هر موقعیتی قرار گیرند نباید ویژگی `ranking` داشته باشند. |
| `tag`\* | string | — | ویژگی اختیاری. برای شناسایی بلوک هنگام تعریف اینکه کدام بلوک‌های دیگر به آن وابسته‌اند یا گزینه انحرافی آن هستند به کار می‌رود. |

### مهاجرت از ویژگی‌های منسوخ‌شده

ویژگی منسوخ‌شده زیر همچنان برای سازگاری با نسخه‌های گذشته پشتیبانی می‌شود:

| نحو قدیمی | نحو جدید |
| --- | --- |
| `inline="true"` | `display-blocks="inline-nowrap"` |
| `inline="false"` | `display-blocks="vertical"` |

## جزئیات

گزینه‌های مختلف نمره‌دهی از طریق ویژگی `grading-method` تعریف می‌شوند:

- `ordered`: در این روش، ترتیب صحیح بلوک‌ها بر اساس ترتیبی که پاسخ‌های صحیح (تعریف‌شده در `pl-answer`) در فایل HTML ظاهر می‌شوند تعیین می‌گردد.
- `unordered`: در این روش، اگر `n` تعداد کل بلوک‌های صحیح باشد، به ازای هر بلوک صحیح منتقل شده به ناحیه پاسخ `1/n` امتیاز داده می‌شود و به ازای هر بلوک نادرست منتقل شده به ناحیه پاسخ `1/n` امتیاز کسر می‌گردد. نمره نهایی حداقل ۰ خواهد بود (دانشجو نمی‌تواند تنها با انتقال پاسخ‌های نادرست نمره منفی بگیرد). توجه داشته باشید که ترتیب بلوک‌ها اهمیتی ندارد؛ یعنی هر جایگشتی از پاسخ‌ها در ناحیه پاسخ پذیرفته می‌شود.
- `ranking`: در این روش، ویژگی `ranking` در گزینه‌های `pl-answer` برای بررسی ترتیب پاسخ استفاده می‌شود. هر بلوک پاسخ _X_ باید یک عدد صحیح `ranking` داشته باشد که کوچکتر یا مساوی با بلوک پاسخ بلافاصله زیر _X_ باشد. یعنی دنباله اعداد صحیح `ranking` تمام بلوک‌های پاسخ باید یک دنباله *غیرنزولی* تشکیل دهد. اگر `n` تعداد کل پاسخ‌ها باشد، هر پاسخ با ترتیب صحیح به اندازه `1/n` ارزش دارد، تا جایی که به اولین پاسخ با ترتیب نادرست برسد.
- `dag`: در این روش، ویژگی `depends` در گزینه‌های `pl-answer` برای تعریف رابطه گراف جهت‌دار بدون دور (DAG) بین بلوک‌ها استفاده می‌شود و پاسخ صحیح هر مرتب‌سازی توپولوژیکی از آن گراف جهت‌دار بدون دور است. اگر از المان‌های `pl-block-group` برای تقسیم برخی بلوک‌ها به گروه‌ها استفاده شود، آنگاه پاسخ صحیح یک مرتب‌سازی توپولوژیکی از خطوط اثبات با این شرط اضافی است که خطوط هر گروه باید به صورت پیوسته (پشت سر هم) فهرست شوند (به عنوان مثال، این حالت برای بیان [اثبات با تفکیک حالات][demo/proofblocks] زمانی که مصحح `dag` برای اثبات‌های ریاضی استفاده می‌شود مفید است). بلوک‌های داخل یک المان `pl-block-group` تنها می‌توانند به بلوک‌های داخل همان `pl-block-group` وابسته باشند یا بلوک‌های داخل همان گروه به آن‌ها وابسته باشند، و المان‌های `pl-block-group` می‌توانند ویژگی‌های `tag` و `depends` خاص خود را داشته باشند تا یک بلوک بتواند به یک گروه کامل وابسته باشد، یا یک گروه بتواند به یک بلوک یا گروه دیگر وابسته گردد.
- `external`: در این روش، بلوک‌های منتقل شده به ناحیه پاسخ در فایلی که توسط ویژگی `file-name` مشخص شده (پیش‌فرض `user_code.py`) ذخیره می‌شوند، و صحت کد با استفاده از مصحح خارجی ارزیابی می‌گردد. بسته به منطق کد نمره‌دهی در مصحح خارجی، ممکن است فعال یا غیرفعال کردن نمره بخشی امکان‌پذیر باشد. ویژگی `correct` برای `pl-answer` همچنان می‌تواند در ترکیب با `min-incorrect` و `max-incorrect` صرفاً برای اهداف نمایشی استفاده شود، اما در نمره‌دهی دخالتی ندارد. فقط ویژگی‌های `correct` و `initially-placed` در این روش نمره‌دهی روی `pl-answer` مجاز هستند.

ترتیب‌های مختلف بلوک‌ها در ناحیه مبدأ از طریق ویژگی `source-blocks-order` تعریف می‌شوند:

- `random`: بلوک‌ها بر هم زده می‌شوند.
- `ordered`: بلوک‌ها به همان ترتیبی که در فایل HTML هستند در ناحیه مبدأ ظاهر می‌شوند.
- `alphabetized`: بلوک‌ها بر اساس محتوای HTML خود به ترتیب حروف الفبا مرتب می‌شوند. هنگام گنجاندن کدهای HTML در بلوک‌ها دقت فرمایید؛ به عنوان مثال `<b>cat</b>` قبل از `<i>bat</i>` ظاهر خواهد شد.
- `random-sections`: بلوک‌ها بر هم زده می‌شوند، اما گروه‌های انحرافی همیشه پس از تمام بلوک‌های منفرد ظاهر خواهند شد.

## بلوک‌های اختیاری

این قابلیت به طراحان امکان می‌دهد سوالات `pl-order-blocks` را با استفاده از روش نمره‌دهی `dag` با چندین ترتیب صحیح بنویسند. این ویژگی می‌تواند سوالات موجود با روش نمره‌دهی `dag` را گسترش دهد تا بلوک‌هایی را شامل شوند که می‌توانند در راه‌حل نهایی وجود داشته یا حذف شوند در حالی که همچنان صحیح باشند. شما می‌توانید رابطه "یا" (or) را بین وابستگی‌ها در ویژگی `depends` با استفاده از عملگر `|` مشخص کنید؛ به عنوان مثال `depends="A|B"`.

!!! note "یادداشت"

    هنگام استفاده از بلوک‌های اختیاری، هر ترتیب صحیح باید با یک بلوک با برچسب نهایی (final) به پایان برسد. تگ‌های `pl-answer` که این بلوک‌ها را اعلام می‌کنند باید ویژگی `final` را روی `true` تنظیم کرده باشند.
    یک سوال نمی‌تواند شامل گروه‌های بلوک به همراه بلوک‌های اختیاری باشد.

## نمونه بلوک‌های اختیاری

![تصویر المان pl-order-blocks با خطوط اختیاری](pl-order-blocks-optional.png)

```html title="question.html"
<p>Construct a python function that computes the sum of two numbers.</p>
<pl-order-blocks
  answers-name="python-plus-equals"
  grading-method="dag"
  indentation="true"
  format="code"
  code-language="python"
>
  <pl-answer correct="true" tag="1" depends="" indent="0">def my_sum(first, second):</pl-answer>
  <pl-answer correct="true" tag="2" depends="1" indent="1">sum = 0</pl-answer>
  <pl-answer correct="true" tag="3" depends="2" indent="1">sum += first</pl-answer>
  <pl-answer correct="true" tag="4" depends="2" indent="1">sum += second</pl-answer>
  <pl-answer correct="true" tag="5" depends="2" indent="1">sum += first + second</pl-answer>
  <pl-answer correct="true" tag="6" depends="3,4 | 5" indent="1" final="true">return sum</pl-answer>
</pl-order-blocks>
```

## نمونه‌های پیاده‌سازی

- [element/orderBlocks]
- [element/orderBlocksOrdered]
- [element/orderBlocksCode]
- [element/orderBlocksDag]
- [element/orderBlocksAlphabetized]
- [element/orderBlocksInline]
- [element/orderBlocksOptional]
- [demo/proofBlocks]
- [demo/autograder/python/orderBlocksRandomParams]
- [demo/autograder/python/orderBlocksAddNumpy]

---

[demo/autograder/python/orderblocksaddnumpy]: https://github.com/PrairieLearn/PrairieLearn/tree/master/exampleCourse/questions/demo/autograder/python/orderBlocksAddNumpy
[demo/autograder/python/orderblocksrandomparams]: https://github.com/PrairieLearn/PrairieLearn/tree/master/exampleCourse/questions/demo/autograder/python/orderBlocksRandomParams
[demo/proofblocks]: https://github.com/PrairieLearn/PrairieLearn/tree/master/exampleCourse/questions/demo/proofBlocks
[element/orderblocks]: https://github.com/PrairieLearn/PrairieLearn/tree/master/exampleCourse/questions/element/orderBlocks
[element/orderblocksalphabetized]: https://github.com/PrairieLearn/PrairieLearn/tree/master/exampleCourse/questions/element/orderBlocksAlphabetized
[element/orderblockscode]: https://github.com/PrairieLearn/PrairieLearn/tree/master/exampleCourse/questions/element/orderBlocksCode
[element/orderblocksdag]: https://github.com/PrairieLearn/PrairieLearn/tree/master/exampleCourse/questions/element/orderBlocksDag
[element/orderblocksinline]: https://github.com/PrairieLearn/PrairieLearn/tree/master/exampleCourse/questions/element/orderBlocksInline
[element/orderblocksoptional]: https://github.com/PrairieLearn/PrairieLearn/tree/master/exampleCourse/questions/element/orderBlocksOptional
[element/orderblocksordered]: https://github.com/PrairieLearn/PrairieLearn/tree/master/exampleCourse/questions/element/orderBlocksOrdered
