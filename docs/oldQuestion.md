# فرمت قدیمی سوالات v1/v2

!!! warning "منسوخ شده (Deprecated)"

    این صفحه فرمت قدیمی سوالات پریری‌لرن را که در نسخه‌های v1 و v2 به کار می‌رفت شرح می‌دهد. این فرمت سوال تا مدت نامحدودی پشتیبانی خواهد شد، اما اکیداً توصیه می‌شود که تمام سوالات جدید در [فرمت v3](question/overview.md) نوشته شوند.

## نمره بخشی (Partial credit)

به طور پیش‌فرض، تمامی سوالات v1/v2 نمره بخشی اعطا نمی‌کنند. یعنی دانشجو برای سوال یا صفر امتیاز دریافت می‌کند یا نمره کامل. تابع نمره‌دهی سوال (در ادامه را ببینید) می‌تواند نمره‌ای کسری در بازه 0 تا 1 تولید کند، اما این نمره سپس به 0 یا 1 گرد می‌شود تا هیچ امتیازی یا نمره کامل داده شود. نمرات زیر 0.5 به سمت پایین (0) گرد می‌شوند، در حالی که نمرات برابر یا بیشتر از 0.5 به سمت بالا (1) گرد می‌شوند. برای مثال، اگر تابع نمره‌دهی سوال برای یک سوال ۱۰ امتیازی مقدار 0.3 را برگرداند، این نتیجه منجر به صفر امتیاز خواهد شد، در حالی که نمره 0.7 برای همان سوال ۱۰ امتیاز خواهد داد.

برای اعطای نمره بخشی واقعی در یک سوال، مقدار `"partialCredit": true` را در فایل `info.json` سوال تنظیم کنید. با این کار، برای نمونه نمره 0.3 در یک سوال ۱۰ امتیازی، ۳ امتیاز اعطا خواهد شد.

## انواع سوال برای فرمت v1/v2

سوالات در نسخه‌های v1/v2 پریری‌لرن می‌توانند دارای انواع زیر باشند:

| نوع سوال | توضیحات |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `MultipleChoice` | یک سوال چندگزینه‌ای (دکمه‌های رادیویی). یک پاسخ صحیح و چند پاسخ نادرست از فهرست‌های پاسخ‌های درست و نادرست انتخاب می‌شوند و ترتیب آن‌ها تصادفی است. |
| `MultipleTrueFalse` | یک سوال چندگزینه‌ای (دکمه‌های رادیویی). یک پاسخ صحیح و چند پاسخ نادرست از فهرست‌های پاسخ‌های درست و نادرست انتخاب می‌شوند و ترتیب آن‌ها تصادفی است. |
| `Checkbox` | یک سوال چندگزینه‌ای (چک‌باکس). چندین پاسخ درست و نادرست از فهرست‌های پاسخ‌های درست و نادرست انتخاب می‌شوند و ترتیب آن‌ها تصادفی است. |
| `File` | فایلی برای دانلود در اختیار دانشجو قرار می‌گیرد و او باید یک فایل ویرایش‌شده را برای نمره‌دهی آپلود کند. |
| `Calculation` | یک نوع سوال بسیار جامع که به کدهای سمت سرور و سمت کلاینت اجازه می‌دهد سوالات را تولید و نمره‌دهی کنند. |

برای اطلاعات تفصیلی درباره هر نوع سوال، به ادامه مطلب مراجعه کنید.

## نوع سوال `MultipleChoice`

- نمونه: [`fossilFuelsRadio`](https://github.com/PrairieLearn/PrairieLearn/tree/21be1db08978b6f8a8ca76c1e53681fe2ebe2fce/exampleCourse/questions/fossilFuelsRadio)
- فایل‌های مورد نیاز: `info.json`
- مستندات شمای گزینه‌ها: [گزینه‌های `MultipleChoice`](schemas/questionOptionsMultipleChoice.md)

یک سوال `MultipleChoice` دارای یک فایل `info.json` است که متن سوال، یک یا چند پاسخ صحیح و یک یا چند پاسخ نادرست را مشخص می‌کند. یک پاسخ صحیح به صورت تصادفی انتخاب می‌شود، و به تعداد کافی پاسخ نادرست انتخاب می‌گردد تا در کل `numberAnswers` پاسخ حاصل شود، که سپس با ترتیبی تصادفی به دانشجو نمایش داده می‌شوند. برای مثال:

```json title="info.json"
{
  "title": "Advantages of fossil fuels (radio)",
  "topic": "Energy",
  "tags": ["comparative advantages", "fossil fuels", "renewables"],
  "type": "MultipleChoice",
  "options": {
    "text": "Which of the following is an advantage of fossil fuels relative to renewable energy sources?",
    "correctAnswers": ["Cheap", "High energy density", "Provide energy on demand"],
    "incorrectAnswers": [
      "Non-polluting",
      "Low energy density",
      "Low production of carbon dioxide",
      "High production of carbon dioxide",
      "Secure",
      "Sustainable",
      "Low energy return"
    ],
    "numberAnswers": 5
  }
}
```

## نوع سوال `MultipleTrueFalse`

- نمونه: [`fossilFuelsTrueFalse`](https://github.com/PrairieLearn/PrairieLearn/tree/21be1db08978b6f8a8ca76c1e53681fe2ebe2fce/exampleCourse/questions/fossilFuelsTrueFalse)
- فایل‌های مورد نیاز: `info.json`
- مستندات شمای گزینه‌ها: [گزینه‌های `MultipleTrueFalse`](schemas/questionOptionsMultipleTrueFalse.md)

یک سوال `MultipleTrueFalse` دارای یک فایل `info.json` است که متن سوال، صفر یا چند گزاره درست و صفر یا چند گزاره نادرست را فراهم می‌کند. تمامی گزاره‌های داده‌شده استفاده می‌شوند و با ترتیبی تصادفی به دانشجویان نمایش داده خواهند شد. برای مثال:

```json title="info.json"
{
  "title": "Advantages of fossil fuels (MTF)",
  "topic": "Energy",
  "tags": ["comparative advantages", "fossil fuels", "renewables"],
  "type": "MultipleTrueFalse",
  "options": {
    "text": "For each of the following statements, select whether it is true or false.",
    "trueStatements": [
      "Cheapness is an advantage of fossil fuels relative to renewable energy sources."
    ],
    "falseStatements": [
      "This is a false statement",
      "This is another false statement",
      "Frugalness is an advantage of fossil fuels relative to renewable energy sources for its frugality and other various conditions that are consequences of frugality."
    ],
    "correctScore": 1,
    "incorrectScore": 0,
    "guessingPenalty": -1
  }
}
```

## نوع سوال `Checkbox`

- نمونه: [`fossilFuelsCheckbox`](https://github.com/PrairieLearn/PrairieLearn/tree/21be1db08978b6f8a8ca76c1e53681fe2ebe2fce/exampleCourse/questions/fossilFuelsCheckbox)
- فایل‌های مورد نیاز: `info.json`
- مستندات شمای گزینه‌ها: [گزینه‌های `Checkbox`](schemas/questionOptionsCheckbox.md)

یک سوال `Checkbox` دارای یک فایل `info.json` است که متن سوال، یک یا چند پاسخ صحیح و یک یا چند پاسخ نادرست را فراهم می‌کند. چندین پاسخ صحیح به طور تصادفی انتخاب می‌شوند (بین `minCorrectAnswers` و `maxCorrectAnswers`، شامل هر دو)، و به تعداد کافی پاسخ نادرست انتخاب می‌گردد تا در مجموع `numberAnswers` پاسخ فراهم شود، که سپس با ترتیبی تصادفی به دانشجو نمایش داده می‌شوند. بسته به مقادیر `minCorrectAnswers` و `maxCorrectAnswers`، این احتمال وجود دارد که تمام گزینه‌ها یا هیچ‌یک از آن‌ها صحیح نباشند. برای مثال:

```json title="info.json"
{
  "title": "Advantages of fossil fuels (checkbox)",
  "topic": "Energy",
  "tags": ["comparative advantages", "fossil fuels", "renewables"],
  "type": "Checkbox",
  "options": {
    "text": "Which of the following are advantages of fossil fuels relative to renewable energy sources? Select all that apply.",
    "correctAnswers": ["Cheap", "High energy density", "Provide energy on demand"],
    "incorrectAnswers": [
      "Non-polluting",
      "Low energy density",
      "Low production of carbon dioxide",
      "High production of carbon dioxide",
      "Secure",
      "Sustainable",
      "Low energy return"
    ],
    "numberAnswers": 5,
    "minCorrectAnswers": 1,
    "maxCorrectAnswers": 3
  }
}
```

## نوع سوال `File`

- نمونه: [`fibonacciExternal`](https://github.com/PrairieLearn/PrairieLearn/tree/bb3fa6c4bc477172cc1e449161aa0e7981628ed8/exampleCourse/questions/fibonacciExternal)
- فایل‌های مورد نیاز: `info.json`، `question.html`، `answer.html`
- مستندات شمای گزینه‌ها: [گزینه‌های `File`](schemas/questionOptionsFile.md)

یک سوال `File` فایلی را برای دانلود به دانشجو می‌دهد، و سپس برای پاسخ نیازمند یک فایل آپلودشده است. فایل دانلودی در `info.json` به صورت زیر مشخص می‌شود:

```json title="info.json"
{
  "title": "Write a Fibonacci function",
  "topic": "Functions",
  "tags": ["recursion"],
  "clientFiles": ["client.js", "question.html", "answer.html", "fib.py"],
  "type": "File",
  "options": {
    "fileName": "fib.py"
  }
}
```

توجه داشته باشید که یک سوال فایلی می‌تواند از نمره‌دهی خارجی نیز استفاده کند! به [مستندات نمره‌دهی خارجی](externalGrading.md) مراجعه فرمایید.

## نوع سوال `Calculation`

- نمونه: [`addVectors`](https://github.com/PrairieLearn/PrairieLearn/blob/master/testCourse/questions/addVectors)
- فایل‌های مورد نیاز: `info.json`، `client.js`، `server.js`
- مستندات شمای گزینه‌ها: [گزینه‌های `Calculation`](schemas/questionOptionsCalculation.md)

یک سوال `Calculation` عمومی‌ترین نوع سوال است که اجازه می‌دهد کدهای دلخواه، نمونه سوال را روی سرور تولید و نمره‌دهی کنند، و کدهای دلخواه کلاینت با دانشجو تعامل داشته باشند (به عنوان مثال، برای رسم تعاملی).

### سوال `Calculation`: فایل `server.js`

فایل `server.js` کدی است که روی سرور اجرا می‌شود (و هرگز مستقیماً توسط کلاینت مشاهده نمی‌شود) که سوال را تولید کرده و به پاسخ نمره می‌دهد.

این کد می‌تواند متغیرهای سوال را به صورت تصادفی (یا قاعده‌مند) ایجاد کند. این متغیرها در یک المان JSON که توسط `server.getData()` بازگردانده می‌شود ذخیره می‌گردند.

تعریف پاسخ صحیح هنگام ایجاد متغیرهای سوال در تابع `server.getData()` یک شیوه مرسوم است، اما الزامی نیست.

تابعی به نام `server.gradeAnswer()` می‌تواند پارامترها و همچنین `submittedAnswer` را دریافت کرده و نمره و بازخورد را برگرداند.

```javascript
define(['PrairieRandom'], function (PrairieRandom) {
  var server = {};

  server.getData = function (vid) {
    var rand = new PrairieRandom.RandomGenerator(vid);
    var a = rand.randInt(5, 10);
    var b = rand.randInt(5, 10);
    var c = a + b;
    var params = {
      a: a,
      b: b,
    };
    var trueAnswer = {
      c: c,
    };
    var questionData = {
      params: params,
      trueAnswer: trueAnswer,
    };
    return questionData;
  };

  server.gradeAnswer = function (vid, params, trueAnswer, submittedAnswer, options) {
    var score = 0;
    if (PrairieGeom.checkEqual(trueAnswer, submittedAnswer, 1e-2, 1e-8)) score = 1;
    return { score: score };
  };

  return server;
});
```

سه شیء اصلی مرتبط با هر سوال عبارتند از:

| شیء (Object) | توضیحات |
| ----------------- | ------------------------------------------------------------------------------------ |
| `params` | پارامترهایی که یک نمونه سوال خاص را مشخص می‌کنند. |
| `submittedAnswer` | هر آنچه که دانشجو برای پاسخ به یک سوال ارسال کرده است. |
| `trueAnswer` | پاسخ صحیح سوال، که پس از نمره‌دهی به دانشجو نمایش داده می‌شود. |

همه این‌ها اشیای جاوااسکریپت هستند که به صورت JSON برای انتقال میان کلاینت و سرور کدگذاری می‌شوند.

### سوال `Calculation`: فایل `client.js`

کدهای جاوااسکریپتی که برای نمایش سوال به کلاینت تحویل داده می‌شوند. در صورت استفاده از رابط‌های کاربری تخصصی می‌توانند overload یا گسترش یابند.

انواع مختلف سوال نیازهای جاوااسکریپتی متفاوتی در سمت کلاینت دارند، بنابراین کافی است آن را از قالب پیش‌فرض برای سوال خود کپی نمایید.

### سوال `Calculation`: فایل `question.html`

فایل `question.html` حاوی داده‌های HTML نمایش‌داده‌شده به دانشجو است. این موارد شامل محتویات داخل کادر سوال، از جمله صورت مسئله و هرگونه فرم ورودی برای پاسخ به آن است. به دکمه ارسال (یا سایر تنظیمات فرم) نیازی نیست.

کدهای استاندارد HTML در اینجا پذیرفته می‌شوند، و همچنین فرمول‌های ریاضی LaTeX محصور در علامت‌های دلار، مانند `$e^{i\pi} + 1 = 0$`.

پارامترهای تولیدشده توسط سرور سوال می‌توانند با `{{params.a}}` و غیره درج شوند.

بهترین شیوه برای نوشتن یک سوال، تقسیم آن به سه بخش است:

1. اطلاعات مربوط به مسئله، تعریف تمامی متغیرها و غیره.
2. یک پرسش کوتاه و واضح که پاسخی کاملاً مشخص را درخواست می‌کند.
3. فیلدهای ورود داده.

برای مثال:

```html
<p>The length $c$ is defined by $c = {{params.a}}{\rm\ m} + {{params.b}}{\rm\ m}$.</p>
<p>What is $c$?</p>
<p>$c = $ <input data-instavalue="submittedAnswer.c" />$\rm\ m$</p>
```

### سوال `Calculation`: فایل `answer.html`

بخشی در کادر سوال که پس از نمره‌دهی شدن به دانشجو نمایش داده می‌شود.

```html
<p>$c = {{trueAnswer.c}}\rm\ m$.</p>
```

## دسترسی به فایل‌ها از کد از طریق RequireJS

این فایل‌های کتابخانه‌ای به کتابخانه‌های _کلاینت_ و _سرور_ تقسیم می‌شوند. کتابخانه‌های کلاینت هم از `client.js` و هم از `server.js` در هر سوال قابل دسترسی هستند، در حالی که کتابخانه‌های سرور فقط از `server.js` در دسترس می‌باشند. این به این معنی است که هر کد محرمانه‌ای که دانشجویان نباید بتوانند به آن دسترسی داشته باشند را می‌توان در یک کتابخانه سرور قرار داد، در حالی که سایر کدهای غیرحساس می‌توانند در کتابخانه‌های کلاینت قرار گیرند. هرگز نیازی به قرار دادن یک فایل کتابخانه در هر دو دایرکتوری کلاینت و سرور وجود ندارد، زیرا می‌تواند فقط در دایرکتوری کلاینت قرار گیرد و مستقیماً از آنجا توسط هر دو فایل `client.js` و `server.js` در دسترس باشد.

شکل پایه‌ای یک فایل `library.js` به صورت زیر است:

```javascript
define([<DEPENDENT-LIBRARIES-PATHS>], function(<DEPENDENT-LIBRARY-VARS>) {

    var library = {};

    library.add = function(arg1, arg2) {
        return arg1 + arg2;
    };

    // سایر توابع کتابخانه در اینجا قرار می‌گیرند

    return library;
});
```

برای استفاده از این فایل `library.js` در داخل فایل `client.js` یا `server.js` یک سوال:

```javascript
define([<OTHER-LIBRARY-PATHS>, 'clientCode/library'], function(<OTHER-LIBRARY-VARS>, library) {

    var sum = library.add(3, 5); // مقدار sum را برابر 8 قرار می‌دهد

});
```

## حالت‌های دسترسی منسوخ‌شده

جهت پشتیبانی از کدهای قدیمی، دایرکتوری `clientFilesCourse` همچنین با نام‌های `clientFiles` و `clientCode` در دسترس است، در حالی که `serverFilesCourse` با نام `serverCode` قابل دسترسی است.

## کد کتابخانه و سایر فایل‌ها

برای کسب اطلاعات درباره نحوه دسترسی به دایرکتوری‌های `clientFiles` و `serverFiles` از درون کد سوال، به [clientFiles و serverFiles](clientServerFiles.md) مراجعه فرمایید.
