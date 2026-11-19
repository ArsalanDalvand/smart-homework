# المان `pl-prairiedraw-figure`

یک تصویر به کمک ابزار prairiedraw ایجاد کرده و نمایش می‌دهد.

!!! warning "هشدار"

    این المان **منسوخ شده است** (deprecated) و نباید در سوالات جدید استفاده شود.

## المان نمونه

```html title="question.html"
<pl-prairiedraw-figure
  script-name="drawFigure.js"
  param-names="r1,r2,isHorizontal"
  width="900"
  height="600"
></pl-prairiedraw-figure>
```

## سفارشی‌سازی‌ها

| ویژگی | نوع | پیش‌فرض | توضیحات |
| --- | --- | --- | --- |
| `height` | integer | 300 | ارتفاع المان رسم. |
| `param-names` | string | — | فهرستی از پارامترهای جداشده با ویرگول انگلیسی جهت ارسال به PrairieDraw. |
| `script-name` | string | — | نام اسکریپت PrairieDraw. |
| `width` | integer | 500 | عرض المان رسم. |

## جزئیات

مقدار ارائه‌شده در `script-name` متناظر با فایلی است که در پوشه همان سوال قرار دارد. نام‌های پارامترها کلیدهایی هستند که در `data["params"]` در `server.py` ذخیره شده‌اند (یعنی همان مقادیری که برای قالب‌سازی در `question.html` در دسترس هستند).

## نمونه‌های پیاده‌سازی

- [element/prairieDrawFigure]

## همچنین ببینید

- [مستندات گرافیکی PrairieDraw](../PrairieDraw.md)

---

[element/prairiedrawfigure]: https://github.com/PrairieLearn/PrairieLearn/tree/master/testCourse/questions/prairieDrawFigure
