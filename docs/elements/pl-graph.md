# المان `pl-graph`

با استفاده از کتابخانه [PyGraphviz](https://pygraphviz.github.io/)، مصورسازی‌های Graphviz DOT را ایجاد کنید.

## نمونه المان‌ها

![تصویر المان pl-graph با استفاده از نحو graphviz](pl-graph1.png)

```html title="question.html"
<pl-graph> digraph G { A -> B } </pl-graph>
```

---

![تصویر المان pl-graph با استفاده از یک ماتریس](pl-graph2.png)

```html title="question.html"
<pl-graph params-name="matrix" params-name-labels="labels"></pl-graph>
```

```python title="server.py"
import prairielearn as pl
import numpy as np


def generate(data):
    mat = np.random.random((3, 3))
    mat = mat / np.linalg.norm(mat, 1, axis=0)
    data["params"]["labels"] = pl.to_json(["A", "B", "C"])
    data["params"]["matrix"] = pl.to_json(mat)
```

---

```html title="question.html"
<pl-graph params-type="networkx" params-name="random-graph"></pl-graph>
```

```python title="server.py"
import random
import string

import prairielearn as pl
import networkx as nx


def generate(data):
    random_graph = nx.gnm_random_graph(5, 6)

    for in_node, out_node, edge_data in random_graph.edges(data=True):
        edge_data["label"] = random.choice(string.ascii_lowercase)

    data["params"]["random-graph"] = pl.to_json(random_graph)
```

## سفارشی‌سازی‌ها

| ویژگی | نوع | پیش‌فرض | توضیحات |
| --------------------------- | ------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `aria-label`                | string  | —                    | یک متن جایگزین کوتاه برای توصیف گراف که توسط صفحه‌خوان‌ها خوانده می‌شود. به [بخش دسترس‌پذیری](#دسترس‌پذیری) مراجعه کنید.                                                                                                                                                               |
| `aria-description`          | string  | —                    | یک توصیف متنی طولانی‌تر و دقیق‌تر از گراف که توسط صفحه‌خوان‌ها خوانده می‌شود. نیازمند `aria-label` است. به [بخش دسترس‌پذیری](#دسترس‌پذیری) مراجعه کنید.                                                                                                                                |
| `directed`                  | boolean | true                 | مشخص می‌کند که آیا یال‌ها در یک ماتریس مجاورت به صورت جهت‌دار در نظر گرفته شوند یا بدون جهت. در صورت تنظیم روی false، یال‌ها بدون جهت رندر می‌شوند. _اگر این مقدار روی false تنظیم شود، ماتریس مجاورت ورودی باید متقارن باشد._                                                                          |
| `directory`                 | string  | `"."`                | پوشه‌ای که فایل منبع در آن قرار دارد. می‌تواند `"."` (پوشه سوال)، `"clientFilesCourse"` یا `"serverFilesCourse"` باشد.                                                                                                                                                       |
| `engine`                    | string  | dot                  | موتور رندری که استفاده می‌شود؛ از `"circo"`، `"dot"`، `"fdp"`، `"neato"`، `"osage"` و `"twopi"` پشتیبانی می‌کند.                                                                                                                                                                               |
| `log-warnings`              | boolean | true                 | مشخص می‌کند که آیا هشدارهایی که در حین رندر Graphviz رخ می‌دهند لاگ شوند یا خیر. برای متوقف کردن هشدارهای غیرمهلک روی `false` تنظیم کنید؛ خطاهای رندر همچنان گزارش می‌شوند.                                                                                                                                      |
| `negative-weights`          | boolean | false                | مشخص می‌کند که آیا وزن‌های منفی در یک ماتریس مجاورت شناخته شوند یا خیر. در صورت تنظیم روی false، تمام وزن‌های حداکثر ۰ نادیده گرفته می‌شوند (به عنوان یک یال شمرده نمی‌شوند). در صورت تنظیم روی true، تمام وزن‌هایی که `None` نیستند شناخته می‌شوند.                                                                  |
| `params-name`               | string  | —                    | نام پارامتر حاوی داده‌هایی که به عنوان ورودی استفاده می‌شوند. نوع داده مورد استفاده به ویژگی `params-type` بستگی دارد.                                                                                                                                                                     |
| `params-name-labels`        | string  | —                    | هنگام استفاده از یک ماتریس مجاورت، پارامتری که شامل برچسب‌های هر گره است.                                                                                                                                                                                                 |
| `params-type`               | string  | `"adjacency-matrix"` | کدام بک‌اند برای رندر کردن گراف از روی داده‌ها استفاده شود. به طور پیش‌فرض فقط `adjacency-matrix` و `networkx` وجود دارند، اما انواع سفارشی می‌توانند از طریق افزونه‌ها اضافه شوند.                                                                                                                     |
| `source-file-name`          | string  | —                    | نام فایلی که محتوای گراف از آن بارگذاری می‌شود. در صورت ارائه، محتوای فایل به جای HTML درونی المان استفاده خواهد شد. برای گراف‌های پیچیده با کاراکترهای خاص مانند علامت‌های زاویه‌دار (علامت‌های بزرگ‌تر/کوچک‌تر) در گره‌های مبتنی بر رکورد مفید است.                                                             |
| `weights`                   | boolean | —                    | هنگام استفاده از ماتریس مجاورت، مشخص می‌کند که آیا وزن یال‌ها نمایش داده شود یا خیر. به طور پیش‌فرض، وزن‌ها را به صورت خودکار برای ماتریس‌های احتمالاتی/تصادفی (stochastic) نمایش می‌دهد (زمانی که باینری `0`/`1` نیستند).                                                                                                             |
| `weights-digits`            | integer | 2                    | هنگام استفاده از یک ماتریس مجاورت، تعداد ارقامی که برای وزن‌ها نمایش داده می‌شود.                                                                                                                                                                                                              |
| `weights-presentation-type` | string  | `"f"`                | قالب نمایش عدد برای وزن‌ها هنگام استفاده از یک ماتریس مجاورت. اگر `weights-presentation-type` برابر `"sigfig"` باشد، هر عدد با استفاده از ماژول `to_precision` تا تعداد ارقام باارزش مشخص‌شده قالب‌بندی می‌شود. در غیر این صورت، هر عدد به صورت `{:.{digits}{presentation-type}}` قالب‌بندی می‌شود. |

### مهاجرت از ویژگی‌های منسوخ‌شده

ویژگی منسوخ‌شده زیر همچنان برای سازگاری با نسخه‌های پیشین پشتیبانی می‌شود:

| نحو قدیمی | نحو جدید |
| ----------------------------- | ---------------------- |
| `params-name-matrix="<name>"` | `params-name="<name>"` |

## جزئیات

توجه داشته باشید که هنگام استفاده از networkx برای رندر، ویژگی‌های گراف ورودی networkx در هنگام ایجاد مصورسازی Graphviz DOT حفظ می‌شوند. در نتیجه، می‌توان ویژگی‌های گره و یال مانند رنگ، ضخامت خط را به عنوان بخشی از گراف ورودی تنظیم کرد و این موارد در رندر منعکس خواهند شد. این خصوصیات شامل ویژگی‌های سراسری گراف، مانند `rankdir` مورد استفاده در رندر نیز می‌شوند. برای اطلاعات بیشتر درباره ویژگی‌های پشتیبانی‌شده به [مستندات Graphviz در مورد ویژگی‌ها](https://graphviz.org/doc/info/attrs.html) مراجعه کنید. نسخه Graphviz که در حال حاضر استفاده می‌شود 2.44.0 است.

ویژگی `source-file-name` به‌ویژه زمانی مفید است که با گراف‌های ایستا که حاوی کاراکترهای خاص مانند علامت‌های زاویه‌دار (`<>`) هستند کار می‌کنید؛ این کاراکترها در [گره‌های مبتنی بر رکورد](https://graphviz.org/doc/info/shapes.html#record) استفاده می‌شوند اما می‌توانند در پردازش و پارس HTML تداخل ایجاد کنند. با قرار دادن محتوای گراف در یک فایل خارجی، می‌توانید از نیاز به اسکیپ کردن این کاراکترها جلوگیری کنید.

## دسترس‌پذیری

یک המان `pl-graph` به صورت SVG رندر می‌شود. گراف‌ویز به هر گره و یال یک `<title>` اضافه می‌کند، اما این موارد تولتیپ‌های شناور هنگام هاور هستند، نه توصیفی از کل گراف؛ بنابراین یک کاربر صفحه‌خوان به طور پیش‌فرض اطلاعات معناداری دریافت نمی‌کند. نحوه ارائه یک معادل دسترس‌پذیر به نحوه استفاده از گراف بستگی دارد.

### گراف‌های اطلاعاتی

اگر گراف حامل اطلاعات است (به جای اینکه موضوعی باشد که دانشجو برای پاسخ دادن باید آن را تحلیل و تفسیر کند)، با ویژگی `aria-label` به آن یک متن جایگزین بدهید. وقتی `aria-label` تنظیم شده باشد، گراف به عنوان یک تصویر منفردِ برچسب‌دار به فناوری‌های کمکی معرفی می‌شود که این امر همچنین عناوین تک‌تک گره‌های Graphviz را پنهان می‌کند. در صورت نیاز از `aria-description` برای جزئیات بیشتر استفاده کنید، هرچند ویژگی `aria-description` پشتیبانی یکنواختی در نرم‌افزارهای صفحه‌خوان ندارد و مستلزم آن است که `aria-label` نیز تنظیم شده باشد.

برای یک گراف **ایستا (static)**، آن را مستقیماً توصیف کنید:

```html title="question.html"
<pl-graph aria-label="Directed graph with an edge from A to B and from B to C">
  digraph G { A -> B -> C }
</pl-graph>
```

برای یک گراف **به صورت تصادفی تولیدشده (randomly generated)**، یک رشته ثابت مانند "a random graph" هیچ اطلاعاتی درباره آنچه واقعاً ترسیم شده است به کاربر صفحه‌خوان نمی‌دهد. توصیف را از همان داده‌ها تولید کنید تا همیشه دقیقاً با گراف مطابقت داشته باشد:

```python title="server.py"
import prairielearn as pl
import networkx as nx


def generate(data):
    graph = nx.gnm_random_graph(5, 6)
    data["params"]["graph"] = pl.to_json(graph)

    edges = ", ".join(f"{u} to {v}" for u, v in graph.edges())
    data["params"]["graph_alt"] = (
        f"Undirected graph with {graph.number_of_nodes()} nodes "
        f"and {graph.number_of_edges()} edges: {edges}."
    )
```

```html title="question.html"
<pl-graph params-type="networkx" params-name="graph" aria-label="{{ params.graph_alt }}"></pl-graph>
```

### ارائه همان اطلاعات در یک قالب دسترس‌پذیر

گنجاندن یک گراف بزرگ در یک رشته تکی `aria-label` باعث ایجاد یک متن طولانی و بدون ساختار می‌شود که پیمایش آن دشوار است. اغلب گزینه بهتر این است که داده‌ها را در یک قالب ذاتاً دسترس‌پذیر نیز ارائه دهید که همه دانشجویان از آن بهره‌مند شوند — به عنوان مثال یک ماتریس مجاورت رندرشده با [`pl-matrix-latex`](pl-matrix-latex.md)، یا یک جدول یال‌ها:

```html title="question.html"
<pl-graph
  params-type="networkx"
  params-name="graph"
  aria-label="Undirected graph; its edges are listed in the table below"
></pl-graph>

<table>
  <caption>
    Edges of the graph above
  </caption>
  <thead>
    <tr>
      <th scope="col">From</th>
      <th scope="col">To</th>
    </tr>
  </thead>
  <tbody>
    {{#params.edge_rows}}
    <tr>
      <td>{{from}}</td>
      <td>{{to}}</td>
    </tr>
    {{/params.edge_rows}}
  </tbody>
</table>
```

### گراف‌هایی که خودِ سوال هستند

اگر دانشجو باید گراف را بخواند و تحلیل کند تا به سوال پاسخ دهد (برای مثال، «ماتریس مجاورت گراف زیر را بنویسید»)، یک `aria-label` توصیفی به هیچ وجه مناسب **نیست**. این متن در سورس صفحه ظاهر می‌شود، بنابراین پاسخ را لو می‌دهد، و هیچ متن جایگزینی نمی‌تواند گراف را در قالبی ارائه دهد که از دانشجو انتظار می‌رود درباره آن استدلال کند. چنین سوالی به این صورت برای کاربران صفحه‌خوان دسترس‌پذیر نیست؛ در عوض یک [نسخه جایگزین از سوال](../question/accessibility.md) ارائه دهید.

## پیاده‌سازی‌های نمونه

- [element/graph]

## رابط برنامه‌نویسی افزونه (Extension API)

مقادیر سفارشی برای `params-type` را می‌توان با [افزونه‌های المان](../elementExtensions.md) اضافه کرد. هر نوع سفارشی به عنوان تابعی تعریف می‌شود که مقادیر `element` و `data` را به عنوان ورودی دریافت کرده و نحو DOT پردازش‌شده را به عنوان خروجی بازمی‌گرداند.

یک تابع نوع کمینه می‌تواند شبیه به این باشد:

```python
def custom_type(element, data):
    return "graph { a -- b; }"
```

به منظور ثبت این انواع سفارشی، افزونه شما باید دیکشنری سراسری `backends` را تعریف کند. این دیکشنری یک مقدار از `params-type` را به تابع شما در بالا نگاشت می‌کند:

```python
backends = {"my-custom-type": custom_type}
```

این تنظیمات به طور خودکار هنگام ایمپورت شدن افزونه اعمال خواهند شد. اگر افزونه شما به ویژگی‌های اضافی نیاز دارد که باید تعریف شوند، می‌توانید به صورت اختیاری آرایه سراسری `optional_attribs` را تعریف کنید که شامل فهرستی از ویژگی‌هایی است که המان ممکن است استفاده کند.

برای مشاهده یک پیاده‌سازی کامل، افزونه `edge-inc-matrix` را در exampleCourse بررسی کنید.

## همچنین ببینید

- [مرجع خارجی: مستندات راهنمای زبان DOT](https://graphviz.org/doc/info/lang.html)
- [`pl-figure` برای نمایش گرافیک‌های ایستا یا تولیدشده به صورت پویا.](pl-figure.md)
- [`pl-file-download` برای امکان دانلود فایل‌های ایستا یا تولیدشده به صورت پویا.](pl-file-download.md)

---

[element/graph]: https://github.com/PrairieLearn/PrairieLearn/tree/master/exampleCourse/questions/element/graph
