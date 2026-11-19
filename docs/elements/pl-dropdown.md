# المان `pl-dropdown`

!!! warning "هشدار"

    به مدرسان اکیداً توصیه می‌شود که در سوالات جدید از `pl-dropdown` استفاده نکنند. برای سوالاتی با یک منوی کشویی، جایگزین بهتر استفاده از [`pl-multiple-choice`](pl-multiple-choice.md) با تنظیم ویژگی `display="dropdown"` است. استفاده از المان چندگزینه‌ای، پشتیبانی بهتری از متن گزینه‌های قالب‌بندی‌شده (شامل فرمول‌های ریاضی)، انتخاب تصادفی و ترتیب گزینه‌ها (هم گزینه‌های صحیح و هم گزینه‌های انحرافی) و نمرات جزئی برای گزینه‌های انحرافی ارائه می‌دهد. برای سوالاتی که از چندین منوی کشویی با مجموعه یکسانی از گزینه‌ها استفاده می‌کنند، المان [`pl-matching`](pl-matching.md) رابط و تجربه کاربری بهتری را فراهم می‌سازد.

انتخاب پاسخ صحیح از یک فهرست کشویی (**select**) از پاسخ‌های بالقوه. گزینه‌های ممکن درون HTML داخلی یک المان `<pl-answer></pl-answer>` قرار می‌گیرند (مانند `<pl-answer>پاسخ ممکن ۱</pl-answer>`).

## المان نمونه

![تصویر صفحه از المان pl-dropdown](pl-dropdown.png)

```html title="question.html"
<p>کلمه صحیح را در نقل‌قول‌های زیر انتخاب کنید:</p>
The
<pl-dropdown answers-name="aristotle" blank="true">
  {{#params.aristotle}}
  <pl-answer correct="{{tag}}">{{ans}}</pl-answer>
  {{/params.aristotle}}
</pl-dropdown>
is more than the sum of its parts.
<p></p>

A
<pl-dropdown sort="ascend" answers-name="hume">
  <pl-answer correct="true">wise</pl-answer>
  <pl-answer correct="false">clumsy</pl-answer>
  <pl-answer correct="false">reckless</pl-answer>
</pl-dropdown>
man proportions his belief to the evidence.
<p></p>
```

```python title="server.py"
def generate(data):

    QUESTION1 = "aristotle"

    data["params"][QUESTION1] = [
        {"tag": "true", "ans": "whole"},
        {"tag": "false", "ans": "part"},
        {"tag": "false", "ans": "inverse"},
    ]
```

## سفارشی‌سازی‌ها

| ویژگی | نوع | پیش‌فرض | توضیحات |
| --- | --- | --- | --- |
| `allow-blank` | boolean | false | مشخص می‌کند که آیا ارسال خالی مجاز است یا خیر. به طور پیش‌فرض، منوهای کشویی خالی نمره‌دهی نخواهند شد (قالب نامعتبر). وقتی `blank="false"` باشد نمی‌تواند روی `true` تنظیم شود. |
| `answers-name` | string | — | نام متغیر برای ذخیره داده‌ها. توجه داشته باشید که این ویژگی باید درون یک سوال یکتا باشد؛ یعنی هیچ مقداری برای این ویژگی نباید در یک سوال تکرار شود. |
| `aria-label` | string | — | برچسب دسترس‌پذیری برای ورودی. |
| `blank` | boolean | true | گزینه افزودن یک ورودی کشویی خالی به عنوان انتخاب پیش‌فرض در فهرست منوی کشویی. وقتی `allow-blank="true"` باشد نمی‌تواند روی `false` تنظیم شود. |
| `sort` | string | random | گزینه‌ها برای ترتیب پاسخ‌های کشویی عبارتند از 'random' (تصادفی)، 'ascend' (صعودی)، 'descend' (نزولی) و 'fixed' (ثابت). |
| `weight` | integer | 1 | ضریب وزنی مورد استفاده هنگام محاسبه میانگین وزنی نمره روی المان‌ها. |

## پیاده‌سازی‌های نمونه

- [demo/overlayDropdown]
- [element/dropdown]

---

[demo/overlaydropdown]: https://github.com/PrairieLearn/PrairieLearn/tree/master/exampleCourse/questions/demo/overlayDropdown
[element/dropdown]: https://github.com/PrairieLearn/PrairieLearn/tree/master/exampleCourse/questions/element/dropdown
