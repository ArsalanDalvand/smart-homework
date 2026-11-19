# PrairieDraw

!!! warning "هشدار"

    این صفحه کتابخانه قدیمی PrairieDraw را توضیح می‌دهد. از این کتابخانه تا مدت نامحدودی پشتیبانی خواهد شد، اما قویاً توصیه می‌شود که تمام سوالات جدید از المان [`pl-drawing`](./pl-drawing/index.md) استفاده کنند.

---

کتابخانه پریری‌دراو (`PrairieDraw.js`) یک کتابخانه رسم شکل است که امکان رندر شکل‌های پویا را از طریق [المان `pl-prairiedraw-figure`](elements/pl-prairiedraw-figure.md) فراهم می‌سازد.

هر پارامتری که از گزینه `params-names` در المان `pl-prairiedraw-figure` به اسکریپت ارسال شود، با `this.params.get([parameter])` قابل دسترسی است.

## کتابخانه `Sylvester.js` و متدهای منتخب

پریری‌دراو از کلاس `Sylvester.Vector` برای مشخص کردن موقعیت‌ها و جهت‌ها در رسم استفاده می‌کند؛ هر آرگومانی از نوع Vector که در ادامه ذکر شده از این نوع است.

در ادامه گزیده‌ای از عملیات‌های مفید روی Vector آمده است؛ مستندات کامل را می‌توان در [مستندات کتابخانه Sylvester](http://sylvester.jcoglan.com/docs.html) یافت.

`Sylvester.Vector.create(elements)`
یک بردار جدید از آرایه `elements` ایجاد کرده و برمی‌گرداند. معمولاً مفید است که برای این دستور در اسکریپت خود نام مستعاری به صورت `var $V = Sylvester.Vector.create` تعریف کنید تا بتوانید بعداً `$V([x,y])` را بنویسید.

`add(vector)`
بردار جدیدی برمی‌گرداند که حاصل جمع گیرنده (receiver) و آرگومان ورودی است.

`subtract(vector)`
بردار جدیدی برمی‌گرداند که تفاضل گیرنده و آرگومان است؛ یعنی `a.subtract(b)` تفاضل برداری `a-b` را برمی‌گرداند.

`multiply(scalar)` یا `x(scalar)`
بردار جدیدی برمی‌گرداند که حاصل مقیاس‌بندی گیرنده در آرگومان اسکالر است. دو دستور `a.multiply(k)` و `a.x(k)` معادل یکدیگرند.

`dot(vector)`
حاصل‌ضرب اسکالر (داخلی) گیرنده و آرگومان را برمی‌گرداند.

`cross(vector)`
بردار جدیدی برمی‌گرداند که حاصل‌ضرب خارجی به ترتیب چپ‌به‌راست است؛ یعنی `A.cross(B)` مقدار `A x B` را بازمی‌گرداند.

`modulus()`
نُرم ۲ (یا طول) بردار را برمی‌گرداند.

`toUnitVector()`
بردار جدیدی برمی‌گرداند که حاصل مقیاس‌بندی گیرنده برای داشتن طول یک (بردار یکه) است.

`rotate(angle, axis)`
بردار جدیدی را برمی‌گرداند که حاصل دوران گیرنده در جهت پادساعت‌گرد به اندازه زاویه `angle` (بر حسب رادیان) با استفاده از بردار `axis` به عنوان نقطه مرکز است. به عنوان مثال:

```javascript
a = $V([10, 5]);
b = $V([5, 5]);
c = a.rotate(Math.PI / 2, b); // c = [5, 10]
```

## کتابخانه `PrairieDraw.js`

اسکریپت ارائه‌شده توسط `script_name` می‌تواند از طریق `this.pd` به شکل پریری‌دراو دسترسی داشته باشد. عملیات‌های زیر امکان تغییر جهت یا مقیاس شکل و همچنین افزودن المان‌های رسم به آن را فراهم می‌کنند.

به طور کلی، اشیای رسم کدر (opaque) هستند، بنابراین ترتیبی که موارد اضافه می‌شوند بر ظاهر نهایی شکل تأثیر می‌گذارد.

در ادامه فهرست ناقصی از عملیات‌های موجود در PrairieDraw ارائه شده است؛ کد منبع کتابخانه را می‌توان در [مخزن PrairieLearn](https://github.com/PrairieLearn/PrairieLearn/blob/master/apps/prairielearn/public/javascripts/PrairieDraw.js) مشاهده کرد.

## ثوابت ارائه‌شده توسط PrairieDraw

`goldenRatio`
نسبت طلایی را برمی‌گرداند؛ برای ایجاد شکل‌هایی با تناسب دلپذیر در آرگومان‌های `setUnits` مفید است.

`milesPerKilometer`
ضریب تبدیل ۰٫۶۲۱۳۷۱ را برمی‌گرداند.

## تنظیم و تغییر دستگاه مختصات

`setUnits(xSize, ySize [, canvasWidth, preserveCanvasSize])`
اندازه بوم (canvas) را بر حسب واحدهای رسم تنظیم می‌کند، به طوری که مبدا در مرکز تصویر قرار می‌گیرد. آرگومان اختیاری `canvasWidth` عرض شکل را (بر حسب پیکسل) مشخص می‌کند، در حالی که `preserveCanvasSize` از تغییر ابعاد بوم برای هماهنگی با نسبت مختصات جلوگیری می‌کند.

`scale(factor)`
مختصات رسم را با ضریب داده‌شده مقیاس‌بندی می‌کند (یعنی رابطه بین مختصات و پیکسل‌ها).

`translate(offset)`
مبدا دستگاه مختصات را به اندازه بردار `offset` جابجا می‌کند.

`rotate(angle)`
دستگاه مختصات را در جهت پادساعت‌گرد به اندازه زاویه `angle` (بر حسب رادیان) دوران می‌دهد.

`transformByPoints(old1, old2, new1, new2)`
ترکیبی از عملیات‌های `scale`، `translate` و `rotate` را به گونه‌ای اجرا می‌کند که نقاط برداری `old1` و `old2` به `new1` و `new2` نگاشت شوند.

## گزینه‌های اشیای رسم

برخی از اشیای رسم در ادامه دارای آرگومان اختیاری `type` برای تعیین معنای فیزیکی خط/پیکان هستند. در صورت مشخص شدن، رنگ متناظری بر اساس [راهنمای سبک TAM 2XX](http://dynref.engr.illinois.edu/rvn.html#rvn-sc) برای شیء انتخاب می‌شود.

| نوع (Type)     | رنگ (Color)        |
| -------------- | ------------------ |
| `grid`         | `rgb(200,200,200)` |
| `position`     | `rgb(0,0,255)`     |
| `angle`        | `rgb(0,100,180)`   |
| `velocity`     | `rgb(0,200,0)`     |
| `angVel`       | `rgb(100,180,0)`   |
| `acceleration` | `rgb(255,0,255)`   |
| `rotation`     | `rgb(150,0,150)`   |
| `angAcc`       | `rgb(100,0,180)`   |
| `angMom`       | `rgb(255,0,0)`     |
| `force`        | `rgb(210,105,30)`  |
| `moment`       | `rbg(255,102,80)`  |

آرگومان اختیاری `filled` (پیش‌فرض false است) مقداری بولی برای تعیین سایه‌دار بودن/توپُر بودن شکل است.

## رسم نقاط و خطوط

`point(vector)`
یک نقطه در مختصات مشخص‌شده توسط `vector` رسم می‌کند.

`line(start, end [, type])`
یک پاره‌خط از موقعیت برداری `start` تا `stop` رسم می‌کند.

`polyline(points [, closed, filled])`
مجموعه‌ای از پاره‌خط‌ها را برای اتصال آرایه `points` رسم می‌کند. آرگومان‌های اختیاری (با مقدار پیش‌فرض false) تعیین می‌کنند که آیا چندخطی (polyline) با خطی که اولین و آخرین المان `points` را به هم وصل می‌کند بسته شود یا خیر.

`arc(center, radius, startAngle, endAngle [, filled, aspect])`
کمانی از یک دایره به مرکزیت `center`، با شعاع `radius`، از زاویه `startAngle` تا `endAngle` (بر حسب رادیان) رسم می‌کند. هنگامی که `aspect` ارائه شود، کمان برای بیضی با نیم‌قطر بزرگ `radius` و نیم‌قطر کوچک `radius / aspect` رسم می‌شود (یعنی `aspect` نسبت بزرگ به کوچک است).

`circle(center, radius [, filled])`
دایره‌ای به مرکزیت `center` با شعاع `radius` رسم می‌کند.

`rectangle(width, height [, center, angle, filled])`
یک مستطیل (هم‌راستا با محورها) با عرض و ارتفاع داده‌شده رسم می‌کند. در صورت عدم تعیین، فرض می‌شود `center` همان مبدا مختصات است. یک زاویه (`angle`) برای دوران نیز می‌تواند تعیین شود.

`rectangleGeneric(bottomLeft, bottomRight, height)`
یک مستطیل با یک ضلع که `bottomLeft` و `bottomRight` را متصل می‌کند با ارتفاع مشخص‌شده `height` رسم می‌کند. این مستطیل به طور عمود (در جهت پادساعت‌گرد) نسبت به این خط امتداد می‌یابد.

## رسم پیکان‌های برداری

`arrow(start, end [, type])`
یک پیکان از `start` به `stop` رسم می‌کند (با نوک پیکان در `stop`).

`arrowFrom(start, offset [, type])`
یک پیکان از `start` به `start.add(offset)` رسم می‌کند.

`arrowTo(end, offset [, type])`
یک پیکان از `end.subtract(offset)` به `end` رسم می‌کند.

`arrowOutOfPage(vector [, type])`
یک پیکان به سمت خارج از صفحه (دایره با نقطه در مرکز) در موقعیت `vector` رسم می‌کند.

`arrowIntoPage(vector [, type])`
یک پیکان به سمت داخل صفحه (دایره با ضربدر در مرکز) در موقعیت `vector` رسم می‌کند.

`circleArrow(center, radius, startAngle, endAngle [, type, fixedRad, idealSegmentSize])`
کمانی پیکان‌دار به مرکزیت `center`، با شعاع `radius`، از زاویه `startAngle` تا `endAngle` (بر حسب رادیان) رسم می‌کند. گزینه `fixedRad` (پیش‌فرض false) مشخص می‌کند که آیا از یک شعاع ثابت استفاده شود (بر خلاف حالت پیچش تدریجی در ابتدا/انتها).

`circleArrowCentered(center, radius, centerAngle, extentAngle [, type, fixedRad])`
کمانی پیکان‌دار به مرکزیت `center`، با شعاع `radius`، به مرکزیت زاویه‌ای در `centerAngle` و با گستره زاویه‌ای `extentAngle` (بر حسب رادیان) رسم می‌کند.

`triangularDistributedLoad(start, end, startSize, endSize, startLabel, endLabel, arrowToLine, arrowDown)`
این تابع یک بار گسترده (ذوزنقه‌ای) ایجاد می‌کند که روی خط بین `start` و `end` عمل می‌کند، با ارتفاع `startSize` در یک سمت و `endSize` در سمت دیگر و برچسب‌های متناظر `startLabel` و `endLabel`. مقدار `arrowToLine` در صورتی که نوک پیکان‌ها به سمت خط بین `start` و `end` اشاره کند برابر true و در غیر این صورت false است. مقدار `arrowDown` در صورتی که نوک پیکان‌ها به سمت پایین (جهت منفی y) اشاره کنند برابر true و در غیر این صورت false است. این دو گزینه آخر تعیین می‌کنند که آیا پیکان‌ها در بالا یا پایین خط ظاهر شوند.

این تابع فرض می‌کند که خط از `start` تا `end` افقی است، و در صورتی که افقی نباشد رفتارهای غیرمنتظره‌ای بروز می‌دهد.

## رسم اشکال مکانیکی

`rod(start, end, width)`
یک میله با پین‌های انتهایی در `start` و `end` رسم می‌کند. سرهای گرد میله اندکی فراتر از این نقاط امتداد خواهند یافت.

`LshapeRod(start, middle, end, width)`
یک میله L-شکل با نقاط انتهایی `start` و `end` و گوشه در `middle` رسم می‌کند.

`TshapeRod(start, center, end, centerEnd, width)`
یک میله T-شکل با لولا در چهار نقطه ذکرشده رسم می‌کند. برای رسم میله‌ای خوش‌فرم با سه بازو، فرض کنید `center` محل تقاطع بازوها باشد و ترتیب `start`، `end` و `centerEnd` نشان‌دهنده ترتیب ساعت‌گرد سه نقطه انتهایی باشد.

`pivot(baseCenter, center, width)`
یک پایه تکیه‌گاه (لولایی) با نقطه لولا در `center` و سر دیگر در `baseCenter` ایجاد می‌کند. هنگامی که با المان `ground` در زیر ترکیب شود، `baseCenter` معمولاً نقطه میانی المان زمین است.

`ground(baseCenter, normal, width)`
یک المان زمین (هاشور خورده) به مرکزیت `baseCenter` و عرض `width` رسم می‌کند. جهت `normal` عمود بر زمین و رو به بیرون از آن است.

`arcGround(center, radius, startAngle, endAngle, outside)`
یک المان زمین منحنی با آرگومان‌هایی مشابه دستور `arc` بالا رسم می‌کند. مقدار `outside` در صورتی که هاشور در قسمت خارجی منحنی باشد برابر `true` و در غیر این صورت `false` است.

## رسم متن و/یا برچسب‌های LaTeX

برای دستورالعمل‌های نحوه قالب‌بندی آرگومان `text` در این دستورات، [پایین‌تر](PrairieDraw.md#generating-latex-labels-on-figures) را مشاهده کنید.

`text(position, anchor, text [, boxed, angle])`
متن را در موقعیت داده‌شده `position` رسم می‌کند. `anchor` یک بردار با مؤلفه‌هایی از (-1,0,1) است که تراز متن را مشخص می‌کند؛ یعنی `$V([-1,-1])` متناظر با تراز «چپ» و «پایین» برای متن است؛ `$V([1,1])` متناظر با «راست» و «بالا» است. گزینه اختیاری `boxed` دور متن کادر می‌کشد، و `angle` آن را در جای خود می‌چرخاند.

`labelLine(start, end, pos, text [, anchor])`
متن را در امتداد خط بین `start` و `end` قرار می‌دهد. `pos` مقادیری در مختصات محلی از (-1,1) می‌گیرد که موقعیت در امتداد و بالا/پایین خط را مشخص می‌کند. آرگومان اختیاری `anchor` از همان الگوی بالا استفاده می‌کند.

`labelCircleLine(center, radius, startAngle, endAngle, pos, text)`
متن را در امتداد کمان مشخص‌شده توسط `center`، `radius`، `startAngle` و `endAngle` قرار می‌دهد. `pos` مقادیری در مختصات محلی از (-1,1) در امتداد و بالا/پایین منحنی می‌گیرد.

## تولید برچسب‌های LaTeX روی شکل‌ها

هنگام استفاده از `PrairieDraw.js` برای رسم شکل‌ها در سوالات، برچسب‌های شکل را می‌توان با استفاده از متن ساده مانند `pd.text(..., "label")`، یا با LaTeX مانند `pd.text(..., "TEX:$x$")` درج کرد. اگر از برچسب‌های LaTeX استفاده می‌کنید، قبل از اینکه بتوانند نمایش داده شوند باید در قالب فایل‌های تصویری رندر شوند. این کار با اجرای دستور زیر انجام می‌شود:

```sh
docker run -it --rm -v PATH_TO_MY_COURSE:/course prairielearn/prairielearn /PrairieLearn/contrib/generate_text.py
```

عبارت `PATH_TO_MY_COURSE` در بالا را با مسیر دایرکتوری درس محلی خود، مانند `/Users/mwest/git/pl-tam212` یا `C:/GitHub/pl-tam212` جایگزین کنید.

جستجو برای برچسب‌های LaTeX با یافتن رشته‌هایی به شکل `"TEX:..."` یا `'TEX:...'` انجام می‌شود (به تفاوت انواع علامت نقل‌قول دقت کنید). اگر می‌خواهید در خود رشته کاراکتر `'` داشته باشید از قالب `""` استفاده کنید و بالعکس.

پس از افزودن یا تغییر هرگونه برچسب LaTeX در سوالات، دستور بالا باید مجدداً اجرا شود.

تصاویر برچسب‌های LaTeX فایل‌هایی با نام‌هایی شبیه به زیر خواهند بود:

```text
pl-tam212/questions/QID/text/186b41e2a92b8b22694dda1305699937df032555.png
pl-tam212/questions/QID/text/186b41e2a92b8b22694dda1305699937df032555_hi.png
pl-tam212/questions/QID/text/d68de4af4e4de5858554f8a90c5a519d9d435589.png
pl-tam212/questions/QID/text/d68de4af4e4de5858554f8a90c5a519d9d435589_hi.png
```

این فایل‌ها باید به مخزن `git` کامیت شده و به سرور فعال (live server) پوش (push) شوند تا به همراه سوال در دسترس قرار گیرند.

## پیشرفته: اجرا بدون داکر (Docker)

اگر می‌خواهید تصاویر برچسب‌های LaTeX را بدون داکر تولید کنید، باید [پایتون (Python)](https://www.python.org)، [ImageMagick](https://imagemagick.org/) و [LaTeX](https://tug.org/texlive/) را نصب کنید و سپس دستور زیر را در ریشه مخزن PrairieLearn اجرا نمایید:

```sh
python contrib/generate_text.py --subdir /path/to/course
```
