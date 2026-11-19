# المان‌های `question.html`

[سوالات](../question/overview.md) PrairieLearn از تگ‌های `pl-*` در درون [`question.html`](../question/template.md) («المان‌ها») ساخته می‌شوند. این المان‌ها رفتار سوال را تعریف می‌کنند: آنچه دانشجو می‌بیند، آنچه وارد می‌کند و نحوه نمره‌دهی آن. این صفحه تمامی المان‌ها را بر اساس هدفی که دنبال می‌کنید دسته‌بندی کرده است. اگر المان یا رفتار مورد نظر خود را پیدا نکردید، استفاده از یک [تابع نمره‌دهی سفارشی](../question/server.md#step-5-grade) (توصیه‌شده) یا [ساخت یک المان سفارشی](../devElements.md) را مد نظر قرار دهید.

!!! tip "نکته"

    از قبل می‌دانید به چه المانی نیاز دارید؟ از منوی ناوبری کناری استفاده کنید، یا [مرجع الفبایی](#reference) زیر را بررسی نمایید.

المان‌هایی که انتخاب می‌کنید به نوع و پیچیدگی سوال شما بستگی دارند. یک سوال ساده ممکن است شامل صورت سوال در پانل سوال (با استفاده از [`pl-question-panel`](pl-question-panel.md)) و به دنبال آن یک [المان ارسال پاسخ](#submission-elements) منفرد باشد. برای صورت‌سوال‌های پیچیده‌تر، ممکن است نیاز به گنجاندن [المان‌های نمایش](#display-elements) مانند شکل‌ها، کد و بخش‌بندی داشته باشید. برای ارائه بازخورد بیشتر به دانشجویان و مصححان، [محتوای اضافی می‌تواند به صورت مشروط](#question-flow-and-feedback) در پانل‌ها و زمینه‌های مختلف نمایش داده شود.

## المان‌های ارسال پاسخ {: #submission-elements }

المان‌های ارسال پاسخ (Submission elements)، پاسخ دانشجو را جمع‌آوری می‌کنند. در هر زیربخش، المان‌ها تقریباً به ترتیبی فهرست شده‌اند که بهتر است ابتدا به سراغ آن‌ها بروید.

![نمودار جریان تصمیم‌گیری سطح بالا برای المان‌های ارسال پاسخ](./element-decision-master.d2){layout="elk" pad="0" scale="1"}

### انتخاب {: #selection }

هنگامی که دانشجویان مواردی را از یک مجموعه ثابت انتخاب کرده یا مرتب می‌کنند.

- [`pl-multiple-choice`](pl-multiple-choice.md): انتخاب یک گزینه از یک فهرست (یا یک منوی کشویی).
- [`pl-checkbox`](pl-checkbox.md): انتخاب چند گزینه از یک فهرست.
- [`pl-matching`](pl-matching.md): انتخاب گزینه متناظر برای هر مورد در یک گروه.
- [`pl-order-blocks`](pl-order-blocks.md): انتخاب و مرتب‌سازی بلوک‌های داده‌شده از کد یا متن.

??? note "نمودار جریان تصمیم‌گیری"

    ![نمودار جریان تصمیم‌گیری برای المان‌های ورودی از نوع انتخابی](./element-decision-selection.d2){layout="elk" pad="0" scale="1"}

### ورودی عددی {: #numeric-input }

هنگامی که پاسخ یک عدد است — عدد صحیح، اعشاری، مقدار همراه با یکا (واحد)، یا یک ماتریس.

- [`pl-number-input`](pl-number-input.md): وارد کردن یک مقدار عددی در محدوده تلورانس مشخص مانند 3.14، -1.921 و غیره.
- [`pl-integer-input`](pl-integer-input.md): وارد کردن یک مقدار عدد صحیح مانند -71، 0، 5، 21 و غیره.
- [`pl-units-input`](pl-units-input.md): وارد کردن یک عدد همراه با یکا مانند "1.5 m"، "14 ms"، "6.3 ft" و غیره.
- [`pl-matrix-component-input`](pl-matrix-component-input.md): وارد کردن یک ماتریس با استفاده از یک جدول مشبک با یک ورودی برای هر خانه.
- [`pl-matrix-input`](pl-matrix-input.md): ارائه یک ماتریس در قالب یکی از زبان‌های برنامه‌نویسی پشتیبانی‌شده.

??? note "نمودار جریان تصمیم‌گیری"

    ![نمودار جریان تصمیم‌گیری برای المان‌های ورودی عددی](./element-decision-number.d2){layout="elk" pad="0" scale="1"}

### ورودی متنی و نمادین {: #text-symbolic-input }

هنگامی که پاسخ یک رشته متنی، یک مقاله/پاسخ تشریحی یا یک عبارت ریاضی است.

- [`pl-string-input`](pl-string-input.md): وارد کردن یک مقدار رشته‌ای مانند `"Illinois"`، `"GATTACA"`، `"computer"` و غیره.
- [`pl-rich-text-editor`](pl-rich-text-editor.md): ارائه یک ویرایشگر متن با قابلیت قالب‌بندی درون مرورگر برای پاسخ‌های تشریحی و مقاله‌ها.
- [`pl-file-editor`](pl-file-editor.md): ارائه یک ویرایشگر درون مرورگر برای کدهای طولانی‌تر یا متن خام (همچنین در بخش [کد و فایل‌ها](#code-and-files) فهرست شده است).
- [`pl-symbolic-input`](pl-symbolic-input.md): وارد کردن یک عبارت نمادین ریاضی مانند `x^2`، `sin(z)`، `mc^2` و غیره.
- [`pl-big-o-input`](pl-big-o-input.md): وارد کردن یک مقدار نمادین که نشان‌دهنده پیچیدگی مجانبی (Asymptotic complexity) است.

??? note "نمودار جریان تصمیم‌گیری"

    ![نمودار جریان تصمیم‌گیری برای المان‌های ورودی متنی و نمادین](./element-decision-text.d2){layout="elk" pad="0" scale="1"}

### ترسیم‌ها و تصاویر {: #drawings-images }

هنگامی که پاسخ یک نقاشی، نمودار یا عکس از کار دست‌نویس است.

- [`pl-drawing`](../pl-drawing/index.md): ایجاد یک بوم (Canvas) با قابلیت نمره‌دهی خودکار از یک مجموعه اشیاء گرافیکی از پیش تعریف‌شده.
- [`pl-image-capture`](pl-image-capture.md): ثبت تصاویر از کارهای دست‌نویس از طریق دوربین محلی یا یک دستگاه خارجی مانند گوشی هوشمند یا تبلت.
- [`pl-excalidraw`](pl-excalidraw.md): رسم یک نمودار برداری با استفاده از [Excalidraw](https://github.com/excalidraw/excalidraw).
- [`pl-sketch`](pl-sketch.md): اسکچ‌ها و طرح‌های قابل نمره‌دهی خودکار از منحنی‌ها و سایر اشیاء ریاضی (مانند نقاط، خطوط مجانب، چندضلعی‌ها).
- [`pl-file-upload`](pl-file-upload.md): پذیرش تصویر یا سندی که با یک ابزار خارجی ایجاد شده است (همچنین در بخش [کد و فایل‌ها](#code-and-files) فهرست شده است).

??? note "نمودار جریان تصمیم‌گیری"

    ![نمودار جریان تصمیم‌گیری برای المان‌های ورودی ترسیمی](./element-decision-drawing.d2){layout="elk" pad="0" scale="1"}

### کد و فایل‌ها {: #code-and-files }

هنگامی که پاسخ کد یا فایل است؛ چه در مرورگر نوشته شود و چه از روی دیسک بارگذاری گردد.

- [`pl-file-upload`](pl-file-upload.md): فراهم کردن ناحیه ارسال برای دریافت فایلی با یک الگوی نام‌گذاری مشخص.
- [`pl-file-editor`](pl-file-editor.md): ارائه یک ویرایشگر کد درون مرورگر برای نوشتن و ارسال کد.

برای کدهایی که به یک محیط غنی‌تر نیاز دارند (چندین فایل، ترمینال، یک IDE، یا چرخه بیلد و اجرا)، از یک [محیط کاری (Workspace)](../workspaces/index.md) به همراه المان [`pl-workspace`](pl-workspace.md) برای تعبیه اجراکننده محیط کاری در سوال استفاده کنید.

??? note "نمودار جریان تصمیم‌گیری"

    ![نمودار جریان تصمیم‌گیری برای المان‌های ورودی کد و فایل](./element-decision-code.d2){layout="elk" pad="0" scale="1"}

## المان‌های نمایش {: #display-elements }

المان‌های نمایش، محتوا را به دانشجویان نشان می‌دهند — اشکال، کد، داده، فایل‌ها و پوسته‌های چیدمان — بدون اینکه پاسخی را ثبت کنند.

### چندرسانه‌ای و اشکال {: #media-figures }

برای نمایش تصاویر، نمودارها، گراف‌ها یا فایل‌های قابل دانلود در کنار سوال.

- [`pl-figure`](pl-figure.md): تعبیه یک فایل تصویری در سوال.
- [`pl-file-download`](pl-file-download.md): فعال‌سازی دانلود فایل برای سوالات داده‌محور.
- [`pl-graph`](pl-graph.md): نمایش گراف‌ها با استفاده از [نماد DOT در GraphViz](https://graphviz.org/doc/info/lang.html)، یک ماتریس مجاورت، یا یک گراف [`networkx`](https://networkx.org/).

### کد، داده و متغیرها {: #code-data-variables }

برای نمایش قطعه‌کدهای از پیش قالب‌بندی‌شده، دیتافریم‌ها، ماتریس‌ها یا مقادیر متغیرهای پایتون.

- [`pl-code`](pl-code.md): نمایش کد با رنگ‌آمیزی ساختار نحوی (Syntax highlighting) مناسب.
- [`pl-python-variable`](pl-python-variable.md): نمایش خروجی قالب‌بندی‌شده متغیرهای پایتون.
- [`pl-dataframe`](pl-dataframe.md): نمایش دیتافریم‌ها با گزینه‌های متنوع.
- [`pl-matrix-latex`](pl-matrix-latex.md): نمایش ماتریس‌ها با دستورات مناسب LaTeX جهت استفاده در عبارات ریاضی.
- [`pl-variable-output`](pl-variable-output.md): نمایش ماتریس‌ها در قالب کد برای زبان‌های برنامه‌نویسی پشتیبانی‌شده.
- [`pl-external-grader-variables`](pl-external-grader-variables.md): نمایش متغیرهای مورد انتظار و داده‌شده برای [سوالاتی که از مصحح پایتون استفاده می‌کنند](../python-grader/index.md).

### چیدمان و پوشش‌دهنده‌های محتوا {: #layout-content-wrappers }

برای پوشش دادن یا قالب‌بندی محتوا به جای نمایش یک نوع داده خاص.

- [`pl-card`](pl-card.md): نمایش محتوا درون یک کامپوننت با استایل کارت (Card).
- [`pl-template`](pl-template.md): نمایش محتوا از الگوهای mustache.
- [`pl-overlay`](pl-overlay.md): لایه‌بندی المان‌ها روی یکدیگر در موقعیت‌های مشخص — معمولاً برای قرار دادن فیلدهای ورودی روی [`pl-figure`](pl-figure.md) یا [`pl-drawing`](../pl-drawing/index.md) در سوالات دارای دیاگرام برچسب‌دار استفاده می‌شود.
- [`pl-hidden-hints`](pl-hidden-hints.md): آشکارسازی تدریجی راهنمایی‌ها در صورت سوال با افزایش دفعات ارسال پاسخ دانشجو در گونه فعلی.

## جریان سوال و بازخورد {: #question-flow-and-feedback }

این المان‌ها مشخص می‌کنند که دانشجویان در هر مرحله از چرخه حیات سوال چه چیزی را مشاهده می‌کنند — صورت سوال، پاسخ ارسالی و هرگونه بازخورد نمایش داده‌شده پس از نمره‌دهی.

### پانل‌های استاندارد سوال {: #standard-question-panels }

سه پانل محتوای اصلی که در طول چرخه حیات سوال به دانشجویان نمایش داده می‌شوند.

- [`pl-question-panel`](pl-question-panel.md): محتوایی که فقط در پانل سوال نمایش داده می‌شود. صورت سوال واقعی باید در اینجا قرار گیرد.
- [`pl-submission-panel`](pl-submission-panel.md): محتوایی که فقط در پانل پاسخ ارسالی نمایش داده می‌شود. بازخورد اضافی باید در اینجا قرار گیرد.
- [`pl-answer-panel`](pl-answer-panel.md): محتوایی که فقط در پانل پاسخ صحیح نمایش داده می‌شود. جزئیات بیشتر در مورد پاسخ صحیح باید در اینجا قرار گیرد.

??? note "شکل ظاهری پانل‌ها"

    ![پانل‌های سوال](../question/panels.png)

### نمایش مشروط {: #conditional-visibility }

برای نمایش محتوا تنها در برخی از پانل‌ها، یا صرفاً در جریان‌های کاری خاص نمره‌دهی.

- [`pl-hide-in-panel`](pl-hide-in-panel.md): پنهان کردن محتوا در یک یا چند پانل نمایش.
- [`pl-hide-in-manual-grading`](pl-hide-in-manual-grading.md): پنهان کردن محتوا در صفحه نمره‌دهی دستی.
- [`pl-manual-grading-only`](pl-manual-grading-only.md): نمایش محتوا فقط در هنگام نمره‌دهی دستی.

### بازخورد پاسخ ارسالی {: #submission-feedback }

برای نمایش آنچه دانشجو ارسال کرده و نتایج حاصل از نمره‌دهی.

- [`pl-file-preview`](pl-file-preview.md): نمایش پیش‌نمایش فایل‌های ارسال‌شده.
- [`pl-xss-safe`](pl-xss-safe.md): پاک‌سازی کدهای HTML ارائه‌شده توسط دانشجو قبل از نمایش مجدد آن به دانشجو یا مصحح.
- [`pl-external-grader-results`](pl-external-grader-results.md): نمایش نتایج حاصل از سوالاتی که به صورت خارجی نمره‌دهی می‌شوند.

## مرجع {: #reference }

| المان | نوع | هدف |
| --- | --- | --- |
| [`pl-answer-panel`](pl-answer-panel.md) | پانل | فقط در پانل پاسخ صحیح نمایش داده شود. |
| [`pl-big-o-input`](pl-big-o-input.md) | ارسال پاسخ | عبارت پیچیدگی مجانبی. |
| [`pl-card`](pl-card.md) | نمایش | پوشش‌دهنده محتوا با استایل کارت. |
| [`pl-checkbox`](pl-checkbox.md) | ارسال پاسخ | انتخاب چند گزینه از یک فهرست/کشویی. |
| [`pl-code`](pl-code.md) | نمایش | کد با رنگ‌آمیزی ساختار نحوی. |
| [`pl-dataframe`](pl-dataframe.md) | نمایش | رندر یک دیتافریم (DataFrame). |
| [`pl-drawing`](../pl-drawing/index.md) | ارسال پاسخ | بوم گرافیکی قابل نمره‌دهی خودکار. |
| [`pl-dropdown`](pl-dropdown.md) | **منسوخ‌شده** | بخش [مهاجرت](#deprecated-elements) را ببینید. |
| [`pl-excalidraw`](pl-excalidraw.md) | ارسال پاسخ | رسم نمودار فرم آزاد با Excalidraw. |
| [`pl-external-grader-results`](pl-external-grader-results.md) | پانل | خروجی مصحح خارجی. |
| [`pl-external-grader-variables`](pl-external-grader-variables.md) | نمایش | متغیرهای مورد انتظار/داده‌شده برای نمره‌دهی خارجی. |
| [`pl-figure`](pl-figure.md) | نمایش | نمایش یک تصویر. |
| [`pl-file-download`](pl-file-download.md) | نمایش | ارائه فایل‌های قابل دانلود. |
| [`pl-file-editor`](pl-file-editor.md) | ارسال پاسخ | ویرایشگر کد درون مرورگر. |
| [`pl-file-preview`](pl-file-preview.md) | نمایش | پیش‌نمایش فایل‌های ارسال‌شده. |
| [`pl-file-upload`](pl-file-upload.md) | ارسال پاسخ | بارگذاری فایل‌ها بر اساس نام. |
| [`pl-graph`](pl-graph.md) | نمایش | رندر یک گراف (DOT، networkx، مجاورت). |
| [`pl-hidden-hints`](pl-hidden-hints.md) | پانل | آشکارسازی تدریجی راهنمایی‌ها. |
| [`pl-hide-in-manual-grading`](pl-hide-in-manual-grading.md) | پانل | پنهان کردن محتوا در هنگام نمره‌دهی دستی. |
| [`pl-hide-in-panel`](pl-hide-in-panel.md) | پانل | پنهان کردن محتوا در پانل‌های انتخابی. |
| [`pl-image-capture`](pl-image-capture.md) | ارسال پاسخ | ثبت تصویر از دوربین یا دستگاه. |
| [`pl-integer-input`](pl-integer-input.md) | ارسال پاسخ | مقدار عدد صحیح. |
| [`pl-manual-grading-only`](pl-manual-grading-only.md) | پانل | نمایش فقط در هنگام نمره‌دهی دستی. |
| [`pl-matching`](pl-matching.md) | ارسال پاسخ | تطبیق هر مورد با یک گزینه. |
| [`pl-matrix-component-input`](pl-matrix-component-input.md) | ارسال پاسخ | ماتریس وارد شده به صورت خانه به خانه. |
| [`pl-matrix-input`](pl-matrix-input.md) | ارسال پاسخ | ماتریس با ساختار نحوی زبان‌های برنامه‌نویسی. |
| [`pl-matrix-latex`](pl-matrix-latex.md) | نمایش | ماتریس به صورت LaTeX. |
| [`pl-multiple-choice`](pl-multiple-choice.md) | ارسال پاسخ | انتخاب یک گزینه از یک فهرست. |
| [`pl-number-input`](pl-number-input.md) | ارسال پاسخ | مقدار عددی همراه با تلورانس. |
| [`pl-order-blocks`](pl-order-blocks.md) | ارسال پاسخ | مرتب‌سازی بلوک‌های کد یا متن. |
| [`pl-overlay`](pl-overlay.md) | نمایش | لایه‌بندی المان‌ها در موقعیت‌های مشخص. |
| [`pl-prairiedraw-figure`](pl-prairiedraw-figure.md) | **منسوخ‌شده** | بخش [مهاجرت](#deprecated-elements) را ببینید. |
| [`pl-python-variable`](pl-python-variable.md) | نمایش | قالب‌بندی متغیر پایتون. |
| [`pl-question-panel`](pl-question-panel.md) | پانل | نمایش فقط در پانل سوال. |
| [`pl-rich-text-editor`](pl-rich-text-editor.md) | ارسال پاسخ | ویرایشگر متن با قابلیت قالب‌بندی برای پاسخ‌های تشریحی. |
| [`pl-sketch`](pl-sketch.md) | ارسال پاسخ | اسکچ منحنی‌ها و اشیاء ریاضی. |
| [`pl-string-input`](pl-string-input.md) | ارسال پاسخ | مقدار رشته‌ای. |
| [`pl-submission-panel`](pl-submission-panel.md) | پانل | نمایش فقط در پانل پاسخ ارسالی. |
| [`pl-symbolic-input`](pl-symbolic-input.md) | ارسال پاسخ | عبارت ریاضی نمادین. |
| [`pl-template`](pl-template.md) | نمایش | رندر یک الگوی mustache. |
| [`pl-units-input`](pl-units-input.md) | ارسال پاسخ | عدد همراه با یکا (واحد). |
| [`pl-variable-output`](pl-variable-output.md) | نمایش | ماتریس به صورت کد در زبان‌های پشتیبانی‌شده. |
| [`pl-variable-score`](pl-variable-score.md) | **منسوخ‌شده** | بخش [مهاجرت](#deprecated-elements) را ببینید. |
| [`pl-workspace`](pl-workspace.md) | ارسال پاسخ | برای کدهایی که به محیطی غنی‌تر نیاز دارند. |
| [`pl-xss-safe`](pl-xss-safe.md) | نمایش | پاک‌سازی محتوای HTML. |

## المان‌های منسوخ‌شده {: #deprecated-elements }

!!! warning "هشدار"

    المان‌های زیر همچنان به جهت سازگاری با نسخه‌های پیشین پشتیبانی می‌شوند، اما نباید در سوالات جدید استفاده شوند.

| المان | استفاده از المان جایگزین |
| --- | --- |
| [`pl-dropdown`](pl-dropdown.md) | [`pl-multiple-choice`](pl-multiple-choice.md) با `display="dropdown"`، یا [`pl-matching`](pl-matching.md) برای چند منوی کشویی مرتبط که گزینه‌های مشترکی دارند |
| [`pl-prairiedraw-figure`](pl-prairiedraw-figure.md) | [`pl-drawing`](../pl-drawing/index.md) |
| [`pl-variable-score`](pl-variable-score.md) | نیازی نیست، تمامی المان‌های ارسال پاسخ شامل گزینه‌های نمایش نمره هستند. |

<!-- markdownlint-disable-next-line MD033 -->
<script>
(() => {
  const redirects = {
    'pl-answer-panel-element': 'pl-answer-panel/',
    'pl-big-o-input-element': 'pl-big-o-input/',
    'pl-card-element': 'pl-card/',
    'pl-checkbox-element': 'pl-checkbox/',
    'pl-code-element': 'pl-code/',
    'pl-dataframe-element': 'pl-dataframe/',
    'pl-drawing-element': '../pl-drawing/',
    'pl-dropdown-element': 'pl-dropdown/',
    'pl-excalidraw-element': 'pl-excalidraw/',
    'pl-external-grader-results-element': 'pl-external-grader-results/',
    'pl-external-grader-variables-element': 'pl-external-grader-variables/',
    'pl-figure-element': 'pl-figure/',
    'pl-file-download-element': 'pl-file-download/',
    'pl-file-editor-element': 'pl-file-editor/',
    'pl-file-preview-element': 'pl-file-preview/',
    'pl-file-upload-element': 'pl-file-upload/',
    'pl-graph-element': 'pl-graph/',
    'pl-hidden-hints-element': 'pl-hidden-hints/',
    'pl-hide-in-manual-grading-element': 'pl-hide-in-manual-grading/',
    'pl-hide-in-panel-element': 'pl-hide-in-panel/',
    'pl-image-capture-element': 'pl-image-capture/',
    'pl-integer-input-element': 'pl-integer-input/',
    'pl-manual-grading-only-element': 'pl-manual-grading-only/',
    'pl-matching-element': 'pl-matching/',
    'pl-matrix-component-input-element': 'pl-matrix-component-input/',
    'pl-matrix-input-element': 'pl-matrix-input/',
    'pl-matrix-latex-element': 'pl-matrix-latex/',
    'pl-multiple-choice-element': 'pl-multiple-choice/',
    'pl-number-input-element': 'pl-number-input/',
    'pl-order-blocks-element': 'pl-order-blocks/',
    'pl-overlay-element': 'pl-overlay/',
    'pl-prairiedraw-figure-element': 'pl-prairiedraw-figure/',
    'pl-python-variable-element': 'pl-python-variable/',
    'pl-question-panel-element': 'pl-question-panel/',
    'pl-rich-text-editor-element': 'pl-rich-text-editor/',
    'pl-string-input-element': 'pl-string-input/',
    'pl-submission-panel-element': 'pl-submission-panel/',
    'pl-symbolic-input-element': 'pl-symbolic-input/',
    'pl-template-element': 'pl-template/',
    'pl-units-input-element': 'pl-units-input/',
    'pl-variable-output-element': 'pl-variable-output/',
    'pl-variable-score-element': 'pl-variable-score/',
    'pl-workspace': 'pl-workspace/',
    'pl-xss-safe-element': 'pl-xss-safe/',
  };

  const loc = window.location;
  const hash = loc.hash.replace(/^#/, '').replace(/\/$/, '');
  const target = redirects[hash];

  console.log('hash', hash);
  console.log('target', target);

  if (!target) {
    return;
  }

  const url = new URL(target, loc.href);

  if (loc.search) {
    url.search = loc.search;
  }

  if (url.href === loc.href) {
    return;
  }

  window.location.replace(url.href);
})();
</script>
