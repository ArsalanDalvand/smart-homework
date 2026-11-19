# المان `pl-variable-output`

فهرستی از متغیرها را نمایش می‌دهد که برای وارد کردن (import) به زبان‌ها و کتابخانه‌های برنامه‌نویسی پشتیبانی‌شده (مانند MATLAB، Mathematica، NumPy، R یا SymPy) قالب‌بندی شده‌اند.

## نمونه المان

![تصویر اسکرین‌شات از المان pl-variable-output](pl-variable-output.png)

```html title="question.html"
<pl-variable-output digits="3">
  <!-- Example comment inside of this element. -->
  <pl-variable params-name="matrixC">C</pl-variable>
  <pl-variable params-name="matrixD">D</pl-variable>
</pl-variable-output>
```

```python title="server.py"
import numpy as np
import prairielearn as pl


def generate(data):

    # Create fixed matrix
    matrixC = np.matrix("5 6; 7 8")
    matrixD = np.matrix("-1 4; 3 2")
    # Random matrices can be generated with:
    # mat = np.random.random((2, 2))

    # Export each matrix as a JSON object for the question view.
    data["params"]["matrixC"] = pl.to_json(matrixC)
    data["params"]["matrixD"] = pl.to_json(matrixD)
```

## سفارشی‌سازی‌ها

ویژگی‌های تگ `<pl-variable-output>`:

| ویژگی | نوع | پیش‌فرض | توضیحات |
| --- | --- | --- | --- |
| `default-tab` | `"matlab"`, `"mathematica"`, `"numpy"`, `"r"`, `"sympy"` | `"matlab"` | تب فعال را انتخاب می‌کند. |
| `digits` | integer | 2 | تعداد ارقام قابل نمایش بعد از ممیز اعشار. |
| `show-mathematica` | boolean | true | نمایش یا عدم نمایش تب Mathematica را تغییر می‌دهد. |
| `show-matlab` | boolean | true | نمایش یا عدم نمایش تب Matlab را تغییر می‌دهد (همچنین با Octave سازگار است). |
| `show-numpy` | boolean | true | نمایش یا عدم نمایش تب NumPy را تغییر می‌دهد. |
| `show-r` | boolean | true | نمایش یا عدم نمایش تب R را تغییر می‌دهد. |
| `show-sympy` | boolean | true | نمایش یا عدم نمایش تب SymPy را تغییر می‌دهد. |

ویژگی‌های تگ `<pl-variable>` (یکی از این تگ‌ها برای هر متغیری که قرار است نمایش داده شود):

| ویژگی | نوع | پیش‌فرض | توضیحات |
| --- | --- | --- | --- |
| `comment` | string | — | کامنتی که بعد از متغیر نمایش داده شده اضافه می‌شود. |
| `digits` | integer | 2 | تعداد ارقام قابل نمایش بعد از اعشار برای متغیر. به طور پیش‌فرض روی مقدار `digits` تنظیم‌شده در المان دربرگیرنده `<pl-variable-output>` قرار می‌گیرد. |
| `params-name` | string | — | نام متغیر در `data["params"]` برای نمایش. الزامی است. |

### مهاجرت از ویژگی‌های منسوخ‌شده

ویژگی‌ها و مقادیر منسوخ‌شده زیر همچنان برای سازگاری با نسخه‌های قبلی پشتیبانی می‌شوند:

| سینتکس قدیمی | سینتکس جدید |
| --- | --- |
| `default-tab="python"` | `default-tab="numpy"` |
| `show-python="false"` | `show-numpy="false"` |
| `show-python="true"` | `show-numpy="true"` |

تگ `pl-matrix-output` یک نام مستعار منسوخ‌شده برای `pl-variable-output` است. این تگ فقط از تب‌های Matlab و NumPy پشتیبانی می‌کند و همیشه به طور پیش‌فرض تب Matlab را فعال می‌کند. به جای آن از `pl-variable-output` استفاده کنید.

تگ فرزند قدیمی `<variable>` همچنان به عنوان یک نام مستعار منسوخ‌شده برای `<pl-variable>` پذیرفته می‌شود. به جای آن از `<pl-variable>` استفاده کنید.

## جزئیات

این المان فهرستی از متغیرها را درون تگ‌های `<pl-code>` نمایش می‌دهد که برای وارد کردن به MATLAB، Mathematica، NumPy، R یا SymPy قالب‌بندی شده‌اند (کاربر می‌تواند بین آن‌ها جابجا شود). هر متغیر باید یک عدد اسکالر یا یک آرایه دوبعدی numpy (بیان‌شده به صورت لیست) باشد. هر متغیر با متنی که بین تگ‌های `<pl-variable>` و `</pl-variable>` قرار دارد شروع شده و پس از آن علامت `=` می‌آید. در زیر نمونه‌هایی از فرمت نمایش‌داده‌شده در تب هر زبان آورده شده است.

**فرمت MATLAB:**

```m
A = [1.23; 4.56]; % matrix
```

**فرمت Mathematica:**

```mathematica
A = [1.23; 4.56]; (* matrix *)
```

**فرمت NumPy:**

```python
import numpy as np

A = np.array([[1.23], [4.56]])  # matrix
```

**فرمت R:**

```r
A = c(1.23, 4.56) # vector
A = matrix(c(1.23, 4.56, 8.90, 1.23), nrow = 2, ncol = 2, byrow = TRUE) # matrix
```

**فرمت SymPy:**

```python
from sympy import *

A = Matrix([[1.23], [4.56]])  # matrix
```

اگر متغیر `v` یک شیء پیچیده است، باید از `import prairielearn as pl` و `data["params"][params-name] = pl.to_json(v)` استفاده کنید.

## پیاده‌سازی‌های نمونه

- [element/variableOutput]
- [element/matrixComponentInput]
- [demo/matrixComplexAlgebra]

## همچنین ببینید

- [`pl-matrix-latex` برای نمایش ماتریس با استفاده از دستورات LaTeX.](pl-matrix-latex.md)
- [`pl-matrix-component-input` برای جعبه‌های ورودی مجزا برای هر درایه در ماتریس](pl-matrix-component-input.md)
- [`pl-matrix-input` برای مقادیر ورودی قالب‌بندی‌شده در یک زبان برنامه‌نویسی پشتیبانی‌شده.](pl-matrix-input.md)
- [`pl-code` برای نمایش بلوک‌های کد همراه با برجسته‌سازی نحوی (Syntax Highlighting)](pl-code.md)

---

[demo/matrixcomplexalgebra]: https://github.com/PrairieLearn/PrairieLearn/tree/master/exampleCourse/questions/demo/matrixComplexAlgebra
[element/matrixcomponentinput]: https://github.com/PrairieLearn/PrairieLearn/tree/master/exampleCourse/questions/element/matrixComponentInput
[element/variableoutput]: https://github.com/PrairieLearn/PrairieLearn/tree/master/exampleCourse/questions/element/variableOutput
