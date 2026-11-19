# المان `pl-matrix-latex`

یک اسکالر یا یک آرایه دوبعدی numpy از اعداد را در LaTeX با استفاده از MathJax نمایش می‌دهد.

## المان نمونه

![تصویر المان pl-matrix-latex](pl-matrix-latex.png)

```html title="question.html"
$$C = <pl-matrix-latex params-name="matrixC"></pl-matrix-latex>$$
```

```python title="server.py"
import prairielearn as pl
import numpy as np


def generate(data):

    # Construct a matrix
    mat = np.matrix("1 2; 3 4")

    # Export matrix to be displayed in question.html
    data["params"]["matrixC"] = pl.to_json(mat)
```

## سفارشی‌سازی‌ها

| ویژگی | نوع | پیش‌فرض | توضیحات |
| --- | --- | --- | --- |
| `digits` | integer | 2 | تعداد ارقام جهت نمایش با توجه به انتخاب `presentation-type` |
| `params-name` | string | — | نام متغیر در `data["params"]` جهت نمایش. |
| `presentation-type` | string | `"f"` | قالب نمایش اعداد. اگر `presentation-type` برابر با `"sigfig"` باشد، هر عدد با استفاده از ماژول `to_precision` تا تعداد `digits` رقم با معنی قالب‌بندی می‌شود. در غیر این صورت، هر عدد به شکل `'{:.{digits}{presentation-type}}'` قالب‌بندی می‌شود. |

## جزئیات

بسته به اینکه `data["params"]` شامل یک اسکالر باشد یا یک آرایه دوبعدی numpy از اعداد، یکی از موارد زیر بازگردانده می‌شود:

- **اسکالر (scalar)**
  - رشته‌ای حاوی مقدار اسکالر بدون قرار گرفتن درون براکت.
- **آرایه ۲ بعدی numpy**
  - رشته‌ای قالب‌بندی‌شده با استایل `bmatrix` در LaTeX.

نمونه قالب‌بندی LaTeX:

```latex
\begin{bmatrix} ... & ... \\ ... & ... \end{bmatrix}
```

به عنوان مثال، نیاز به نمایش عملیات ماتریسی زیر را در نظر بگیرید:

```text
x = [A][b] + [c]
```

در این صورت، می‌نویسیم:

```html title="question.html"
${\bf x} = <pl-matrix-latex params-name="A" digits="1"></pl-matrix-latex>
<pl-matrix-latex params-name="b" digits="1"></pl-matrix-latex>
+ <pl-matrix-latex params-name="c" digits="1"></pl-matrix-latex>$
```

## نمونه‌های پیاده‌سازی

- [element/matrixLatex]
- [demo/randomCheckbox]

## همچنین ببینید

- [`pl-variable-output` برای نمایش ماتریس در یک زبان برنامه‌نویسی پشتیبانی‌شده.](pl-variable-output.md)
- [`pl-matrix-component-input` برای کادرهای ورودی مجزا به ازای هر درایه در ماتریس](pl-matrix-component-input.md)
- [`pl-matrix-input` برای مقادیر ورودی با قالب یک زبان برنامه‌نویسی پشتیبانی‌شده.](pl-matrix-input.md)

---

[demo/randomcheckbox]: https://github.com/PrairieLearn/PrairieLearn/tree/master/exampleCourse/questions/demo/randomCheckbox
[element/matrixlatex]: https://github.com/PrairieLearn/PrairieLearn/tree/master/exampleCourse/questions/element/matrixLatex
