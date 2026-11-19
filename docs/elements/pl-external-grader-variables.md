# المان `pl-external-grader-variables`

نمایش متغیرهایی که در اختیار دانشجو قرار می‌گیرند یا انتظار می‌رود دانشجو آن‌ها را در سوالات پایتون با نمره‌دهی خارجی تعریف کند.

**ما استفاده از این المان را برای هر سوالی که از ایمیج داکر `prairielearn/grader-python` استفاده نمی‌کند توصیه نمی‌کنیم**، زیرا نحوه ذخیره پارامترها در این المان منحصراً برای استفاده با آن مصحح خودکار طراحی شده است. اگر می‌خواهید جدولی از متغیرها را برای سوالی که از مصحح خودکار دیگری استفاده می‌کند نمایش دهید، استفاده از تگ استاندارد `<table>` در HTML را به عنوان جایگزین در نظر بگیرید.

فهرست متغیرها می‌تواند در `data["params"]` یا در خودِ فایل HTML سوال تعریف شود (اما نه در هر دو!). در صورت تعریف در HTML سوال، اطلاعات متغیر به `data["params"]` اضافه می‌شود تا توسط مصحح خارجی استفاده گردد. در صورتی که هیچ توضیحی ارائه نشده باشد، این ستون در جدول نمایش‌داده‌شده به دانشجو پنهان می‌شود.

در صورت ذخیره در `data["params"]`، فهرست متغیرها قالب زیر را دارد:

```python
data["params"]["names_for_user"] = [
    {"name": "var1", "description": "Human-readable description.", "type": "type"},
    {"name": "var2", "description": "...", "type": "..."},
]
data["params"]["names_from_user"] = [
    {"name": "result1", "description": "...", "type": "..."}
]
```

## المان نمونه

![تصویر صفحه از المان pl-external-grader-variables](pl-external-grader-variables.png)

```html title="question.html"
<p>The setup code gives the following variables:</p>
<pl-external-grader-variables params-name="names_for_user"></pl-external-grader-variables>

<p>Your code snippet should define the following variables:</p>
<pl-external-grader-variables params-name="names_from_user">
  <pl-variable name="x" type="numpy array (length $n$)">
    Solution to $\mathbf{Ax}=\mathbf{b}$.
  </pl-variable>
</pl-external-grader-variables>
```

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
```

## سفارشی‌سازی‌ها

| ویژگی | نوع | پیش‌فرض | توضیحات |
| --- | --- | --- | --- |
| `empty` | boolean | false | مشخص می‌کند که آیا ورودی برای `params-name` مشخص‌شده باید خالی تنظیم شود یا خیر. اگر متغیرها تعریف شده باشند و این مقدار روی true تنظیم گردد، خطا ایجاد خواهد شد. |
| `params-name` | string | — | نام مشخصات متغیر در `data["params"]` جهت نمایش، که قالب آن در بالا ارائه شده است. |

کد HTML درون تگ داخلی `pl-variable` به عنوان توضیحات استفاده می‌شود. اگر تگ خالی باشد، هیچ توضیحی برای متغیر مربوطه استفاده نخواهد شد. تگ داخلی `pl-variable` ویژگی‌های زیر را دارد:

| ویژگی | نوع | پیش‌فرض | توضیحات |
| --- | --- | --- | --- |
| `name` | string | — | نام متغیر مربوطه. برای تمام متغیرها الزامی است. |
| `type` | string | — | نوع متغیر مربوطه. برای تمام متغیرها الزامی است. |

## پیاده‌سازی‌های نمونه

- [demo/autograder/codeEditor]
- [demo/autograder/codeUpload]
- [demo/autograder/python/square]
- [demo/autograder/python/numpy]
- [demo/autograder/python/pandas]
- [demo/autograder/python/plots]
- [demo/autograder/python/random]

---

[demo/autograder/codeeditor]: https://github.com/PrairieLearn/PrairieLearn/tree/master/exampleCourse/questions/demo/autograder/codeEditor
[demo/autograder/codeupload]: https://github.com/PrairieLearn/PrairieLearn/tree/master/exampleCourse/questions/demo/autograder/codeUpload
[demo/autograder/python/numpy]: https://github.com/PrairieLearn/PrairieLearn/tree/master/exampleCourse/questions/demo/autograder/python/numpy
[demo/autograder/python/pandas]: https://github.com/PrairieLearn/PrairieLearn/tree/master/exampleCourse/questions/demo/autograder/python/pandas
[demo/autograder/python/plots]: https://github.com/PrairieLearn/PrairieLearn/tree/master/exampleCourse/questions/demo/autograder/python/plots
[demo/autograder/python/random]: https://github.com/PrairieLearn/PrairieLearn/tree/master/exampleCourse/questions/demo/autograder/python/random
[demo/autograder/python/square]: https://github.com/PrairieLearn/PrairieLearn/tree/master/exampleCourse/questions/demo/autograder/python/square
