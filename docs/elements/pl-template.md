# المان `pl-template`

کدهای قالبی HTML تکراری (boilerplate) را از طریق قالب‌های mustache به روشی با قابلیت استفاده مجدد نمایش می‌دهد.

## نمونه المان

```html title="question.html"
<pl-template file-name="templates/outer_template.mustache">
  <pl-variable name="show">True</pl-variable>
  <pl-variable name="section_header">This is the section header.</pl-variable>
  <pl-variable name="section_body">This is the section body.</pl-variable>
</pl-template>
```

همراه با نمونه استفاده از این المان، یک فایل قالب نمونه نیز ارائه شده است. این فایل `templates/outer_template.mustache` است که در پوشه `serverFilesCourse` درس ذخیره شده است:

```html title="templates/outer_template.mustache"
<div class="card mb-1 mt-1">
  <div class="card-header" style="cursor: pointer">
    <div
      class="card-title d-flex justify-content-between"
      data-bs-toggle="collapse"
      data-bs-target="#collapse-{{uuid}}"
    >
      <div>{{section_header}}</div>
      <div class="fa fa-angle-down"></div>
    </div>
  </div>

  <div class="collapse{{#show}} show{{/show}}" id="collapse-{{uuid}}">
    <div class="card-body">
      <div class="card-text">{{{section_body}}}</div>
    </div>
  </div>
</div>
```

!!! note "یادداشت"

    المان نمونه متغیر `uuid` را تعریف نکرده است، زیرا هر المان `pl-template` دارای یک شناسه یکتا است که به صورت داخلی تعریف می‌شود.

## سفارشی‌سازی‌ها

| ویژگی | نوع | پیش‌فرض | توضیحات |
| --- | --- | --- | --- |
| `directory` | `"question"`, `"clientFilesQuestion"`, `"clientFilesCourse"`, `"serverFilesCourse"`, `"courseExtensions"` | `"serverFilesCourse"` | پوشه والد برای یافتن `file-name`. |
| `file-name` | string | — | نام فایل قالب بیرونی مورد استفاده. |
| `log-tag-warnings` | boolean | true | مشخص می‌کند که آیا در صورت وجود المان‌هایی در قالب رندرشده که عملکرد صحیح آن‌ها تضمین نمی‌شود، هشدارها لاگ شوند یا خیر. |
| `log-variable-warnings` | boolean | false | مشخص می‌کند که آیا هنگام رندر قالب‌ها با متغیرهای تعریف‌نشده هشدارها لاگ شوند یا خیر. برای اشکال‌زدایی مفید است. |

درون المان `pl-template`، متغیرهای مورد استفاده در رندر قالب را می‌توان با تگ `pl-variable` مشخص کرد. هر تگ `pl-variable` می‌تواند برای تعریف یک متغیر با داده‌های برگرفته از یک فایل یا با محتوای خود تگ استفاده شود (اما نه هر دو به طور همزمان). توجه داشته باشید که جایگزینی برای فایل‌های خارجی استفاده‌شده در `pl-variable` اعمال **نمی‌شود** (فایل‌ها همان‌طور که هستند استفاده می‌شوند). تگ `pl-variable` از ویژگی‌های زیر پشتیبانی می‌کند:

| ویژگی | نوع | پیش‌فرض | توضیحات |
| --- | --- | --- | --- |
| `directory` | `"question"`, `"clientFilesQuestion"`, `"clientFilesCourse"`, `"serverFilesCourse"`, `"courseExtensions"` | `"serverFilesCourse"` | پوشه والد برای یافتن `file-name`. |
| `file-name` | string | — | نام فایل مورد استفاده در صورتی که داده‌های متغیر از یک فایل گرفته شوند. |
| `name` | string | — | نام متغیر برای انتساب داده‌های تعریف‌شده توسط این تگ. |
| `trim-whitespace` | boolean | true | مشخص می‌کند که آیا فاصله‌های خالی داده‌های مشخص‌شده توسط این تگ حذف (trim) شوند یا خیر. |

## جزئیات

به دلیل نحوه رندر المان‌ها در پریری‌لرن، قالب‌ها فقط باید شامل المان‌های تزیینی و نمایشی دیگر باشند. به طور خاص، **المان‌هایی که ورودی دانشجو را می‌پذیرند و/یا نمره‌دهی می‌کنند، در صورت استفاده درون این المان به درستی کار نخواهند کرد.** هنگام رندر یک قالب، تمام ورودی‌های `data["params"]` و `data["preferences"]` به عنوان متغیرهای موجود گنجانده شده و می‌توانند هنگام رندر قالب با استفاده از سینتکس `{{params.variable_name}}` یا `{{preferences.variable_name}}` استفاده شوند. هر نمونه از المان `pl-template` همچنین دارای یک متغیر یکتای `uuid` در دسترس برای رندر است. قالب‌ها همچنین می‌توانند درون قالب‌های دیگر استفاده شوند.

!!! note "یادداشت"

    سلکتور `#` برای id در CSS برای شناسه‌هایی که با عدد شروع می‌شوند کار _نمی‌کند_، بنابراین uuidها باید دارای پیشوند باشند (زیرا ممکن است با یک عدد شروع شوند).

## پیاده‌سازی‌های نمونه

- [element/template]

---

[element/template]: https://github.com/PrairieLearn/PrairieLearn/tree/master/exampleCourse/questions/element/template
