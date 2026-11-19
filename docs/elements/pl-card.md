# المان `pl-card`

نمایش محتوای سوال درون کامپوننتی با استایل کارت (Card). به صورت اختیاری سربرگ (Header)، پاورقی (Footer) و/یا تصویر را از طریق ویژگی‌های تگ نمایش می‌دهد.

## المان نمونه

```html title="question.html"
<pl-card
  header="Header"
  title="Title"
  width="50%"
  img-bottom-src="https://via.placeholder.com/720x480"
>
  <pl-question-panel> این کارت دارای عرض ۵۰٪ و یک تصویر در پایین است. </pl-question-panel>
</pl-card>
```

## سفارشی‌سازی‌ها

| ویژگی | نوع | پیش‌فرض | توضیحات |
| --- | --- | --- | --- |
| `footer` | string | — | محتویات پاورقی کارت. |
| `header` | string | — | محتویات سربرگ کارت. |
| `img-bottom-alt` | string | — | متن جایگزین برای تصویر پایین. |
| `img-bottom-src` | string | — | نشانی اینترنتی (URL) منبع تصویر پایین. |
| `img-top-alt` | string | — | متن جایگزین برای تصویر بالا. |
| `img-top-src` | string | — | نشانی اینترنتی (URL) منبع تصویر بالا. |
| `subtitle` | string | — | محتویات زیرعنوان کارت. |
| `title` | string | — | محتویات عنوان کارت. |
| `width` | `"25%"`، `"50%"`، `"75%"`، یا `"auto"` | `"auto"` | عرض کارت. |

## جزئیات

ویژگی‌های `pl-card` منعکس‌کننده گزینه‌های [کارت‌های بوت‌استرپ (Bootstrap cards)](https://getbootstrap.com/docs/5.3/components/card/) هستند. ویژگی‌های تگ `header` و `footer` می‌توانند علاوه بر متن ساده، شامل تگ‌های HTML نیز باشند تا امکان استایل‌دهی به محتوای آن‌ها فراهم شود.

## پیاده‌سازی‌های نمونه

- [element/card]

---

[element/card]: https://github.com/PrairieLearn/PrairieLearn/tree/master/exampleCourse/questions/element/card
