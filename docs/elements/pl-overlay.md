# المان `pl-overlay`

المان لایه‌بندی (overlay) به المان‌های موجود در PrairieLearn و HTML اجازه می‌دهد تا روی یکدیگر در موقعیت‌های دلخواه چیده شوند. بیشترین کاربرد آن قرار دادن فیلدهای ورودی (مانند [`pl-number-input`](pl-number-input.md)) بر روی یک تصویر [`pl-figure`](pl-figure.md) یا رسم فنی [`pl-drawing`](../pl-drawing/index.md) است تا دانشجویان بتوانند برچسب‌ها را در موقعیت‌های خاصی از یک دیاگرام پر کنند.

## المان نمونه

![تصویر المان pl-overlay](pl-overlay.png)

```html title="question.html"
<pl-overlay width="400" height="400" clip="false">
  <pl-background>
    <pl-drawing width="398" height="398" hide-answer-panel="false">
      <pl-drawing-initial>
        <pl-triangle x1="50" y1="350" x2="350" y2="350" x3="350" y3="50"></pl-triangle>
      </pl-drawing-initial>
    </pl-drawing>
  </pl-background>
  <pl-location left="200" top="375"> $$3$$ </pl-location>
  <pl-location left="375" top="200"> $$3$$ </pl-location>
  <pl-location left="170" top="170">
    <pl-number-input
      answers-name="c"
      show-help-text="false"
      show-placeholder="false"
      size="1"
    ></pl-number-input>
  </pl-location>
</pl-overlay>
```

## سفارشی‌سازی‌های `pl-overlay`

| ویژگی | نوع | پیش‌فرض | توضیحات |
| --- | --- | --- | --- |
| `clip` | boolean | true | در صورت مقدار true، فرزندانی که از مرزهای لایه‌بندی تجاوز کنند بریده می‌شوند (cut off). |
| `height` | float | — | ارتفاع بوم (canvas) لایه‌بندی به پیکسل. الزامی است مگر اینکه `pl-background` تعیین شده باشد. |
| `width` | float | — | عرض بوم لایه‌بندی به پیکسل. الزامی است مگر اینکه `pl-background` تعیین شده باشد. |

## سفارشی‌سازی‌های `pl-location`

| ویژگی | نوع | پیش‌فرض | توضیحات |
| --- | --- | --- | --- |
| `bottom` | float | — | مختصات y المان فرزند (نسبت به لبه پایینی لایه‌بندی) |
| `halign` | string | `"center"` | تراز افقی محتویات را مشخص می‌کند. می‌تواند یکی از مقادیر `"left"`، `"center"`، `"middle"` (معادل `"center"`) یا `"right"` باشد. |
| `left` | float | — | مختصات x المان فرزند (نسبت به لبه سمت چپ لایه‌بندی) |
| `right` | float | — | مختصات x المان فرزند (نسبت به لبه سمت راست لایه‌بندی) |
| `top` | float | — | مختصات y المان فرزند (نسبت به لبه بالایی لایه‌بندی) |
| `valign` | string | `"middle"` | تراز عمودی محتویات را مشخص می‌کند. می‌تواند یکی از مقادیر `"top"`، `"middle"`، `"center"` (معادل `"middle"`) یا `"bottom"` باشد. |

## سفارشی‌سازی‌های `pl-background`

تگ فرزند `pl-background` هیچ ویژگی اضافی که نیاز به تنظیم داشته باشد ندارد. تمام اطلاعات مربوط به موقعیت و اندازه از محتویات درون این تگ به دست می‌آید.

## جزئیات

یک لایه‌بندی از پیش به عنوان یک "ناحیه لایه‌بندی" با اندازه ثابت تعریف می‌شود. به طور پیش‌فرض، المان‌هایی که از این مرزها فراتر روند، تا حدی یا کاملاً بریده می‌شوند.

یک پس‌زمینه را می‌توان با قرار دادن کدهای HTML در تگ `<pl-background>` مشخص کرد. اگر محتویات `<pl-background>` اندازه ثابتی ندارند (برای مثال با استفاده از `<pl-figure>` که از عرض واکنش‌گرا استفاده می‌کند)، باید حداقل ویژگی `width` را روی `<pl-overlay>` صراحتاً تعیین کنید تا مطمئن شوید که المان‌های فرزند صرف‌نظر از اندازه پنجره مرورگر در مکان مورد نظر نمایش داده می‌شوند. اما اگر محتویات `<pl-background>` اندازه مشخص و ثابتی دارند (مانند `<pl-drawing width="500">`)، تعیین دستی `width`/`height` بر روی `<pl-overlay>` لازم نیست.

المان‌های فرزند شناور درون یک تگ `<pl-location>` احاطه می‌شوند که موقعیت آن‌ها را نسبت به یک لبه مشخص از ناحیه لایه‌بندی با استفاده از ویژگی‌های `left`، `right`، `top` و `bottom` تعیین می‌کند. هر `<pl-location>` باید دقیقاً یکی از مقادیر `left` یا `right` و دقیقاً یکی از مقادیر `top` یا `bottom` را مشخص کند. هر چیزی که درون تگ موقعیت قرار گیرد در آن مکان نمایش داده خواهد شد. فرزندان به ترتیبی که در کد آمده‌اند لایه‌بندی می‌شوند و المان‌های فرزند بعدی بر روی المان‌های تعریف‌شده قبلی نمایش داده می‌شوند.

## نمونه‌های پیاده‌سازی

- [element/overlay]

---

[element/overlay]: https://github.com/PrairieLearn/PrairieLearn/tree/master/exampleCourse/questions/element/overlay
