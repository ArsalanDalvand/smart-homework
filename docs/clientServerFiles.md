# فایل‌های کلاینت (`clientFiles`) و سرور (`serverFiles`)

در هر درس مکان‌های متعددی وجود دارد که در آن‌ها می‌توان فایل‌ها را برای دسترسی از سوی کلاینت (کاربر) یا سرور ذخیره کرد. از این فایل‌ها می‌توان برای کتابخانه‌های کدی مورد استفاده در سوالات، تصاویر تعبیه‌شده در سوالات، برگه‌های فرمول در دسترس در طول امتحانات، یا کتاب‌های درسی آنلاین جهت ارجاع در حین آزمون استفاده نمود.

دایرکتوری‌های `clientFiles` حاوی فایل‌هایی هستند که از مرورگر وب کلاینت قابل دسترسی می‌باشند. این دایرکتوری‌ها برای فایل‌هایی مناسب هستند که دانشجو باید به آن‌ها دسترسی داشته باشد، مانند تصاویر ایستا، صفحات وب مرجع یا برگه‌های فرمول، یا برای کتابخانه‌های کدی که در سمت کلاینت اجرا می‌شوند.

دایرکتوری‌های `serverFiles` تنها از کدهای در حال اجرا بر روی سرور قابل دسترسی هستند، بنابراین برای کتابخانه‌هایی مفیدند که می‌توانند سوالات را حل کنند یا نمونه‌های تصادفی سوال را تولید نمایند. فایل‌های موجود در دایرکتوری `serverFiles` مستقیماً توسط مرورگر وب دانشجو قابل دسترسی نیستند.

یک [نمونه از نحوه استفاده از `serverFilesCourse`](python-grader/index.md#example-usage-of-serverfilescourse-for-static-data) در یک نمره‌دهنده خودکار پایتون را مشاهده کنید.

## ساختار دایرکتوری‌ها

یک زیردایرکتوری `clientFiles*` می‌تواند به درس، یک سوال، یک دوره (Course Instance) یا یک ارزیابی (آزمون) اختصاص یابد، همان‌طور که در زیر نشان داده شده است. زیردایرکتوری `serverFilesCourse` به کل درس به عنوان یک کل اختصاص دارد.

```bash
exampleCourse
+-- clientFilesCourse                     # فایل‌های کلاینت برای کل درس
|   +-- library.js
+-- serverFilesCourse                     # فایل‌های سرور برای کل درس
|   `-- secret1.js
+-- questions
|   `-- fossilFuels
|       +-- clientFilesQuestion           # فایل‌های کلاینت برای سوال fossilFuels
|       |   `-- power-station.jpg
`-- courseInstances
    `-- Fa16
       +-- clientFilesCourseInstance      # فایل‌های کلاینت برای دوره پاییز ۲۰۱۶ (Fa16)
       |   `-- Fa16_rules.pdf
       `-- assessments
           `-- hw01
               `-- clientFilesAssessment  # فایل‌های کلاینت برای ارزیابی تکلیف ۱ (hw01)
                   `-- formulaSheet.pdf
```

## کنترل دسترسی (Access Control)

هر دایرکتوری مختلف از `clientFiles*` تحت همان [قوانین کنترل دسترسی](assessment/accessControl.md) مربوط به دوره‌ها و آزمون‌ها قابل دسترسی است. به این معنا که `clientFilesCourse` برای هر دانشجویی که به دوره‌ای از درس دسترسی دارد در دسترس است، در حالی که `clientFilesQuestion`، `clientFilesCourseInstance` و `clientFilesAssessment` تنها برای دانشجویانی در دسترس هستند که به سوال، دوره یا آزمون متناظر دسترسی دارند.

## اعطای دسترسی به فایل‌های کلاینت به دانشجویان

برای اینکه به دانشجویان امکان دسترسی به یک فایل را بدهید، فایل را در دایرکتوری `clientFiles*` مناسب قرار دهید. برای مثال، جهت گنجاندن یک تصویر در یک سوال، تصویر را در دایرکتوری `clientFilesQuestion` مربوط به آن سوال قرار دهید. اگر تصویر در چندین سوال استفاده می‌شود، می‌توان آن را در دایرکتوری `clientFilesCourse` درس قرار داد. برای در دسترس قرار دادن برگه فرمول در طول امتحان، برگه فرمول را در دایرکتوری `clientFilesAssessment` مربوط به آن آزمون بگذارید.

برای اینکه به دانشجویان اجازه دهید محتویات یک فایل را از طریق یک سوال مشاهده کنند، می‌توانید با استفاده از یکی از روش‌های زیر به فایل ارجاع دهید:

1. المان `pl-figure` می‌تواند برای نمایش یک تصویر از `clientFilesQuestion` یا `clientFilesCourse` در یک سوال استفاده شود. به عنوان مثال، اگر نام تصویر `power-station.jpg` است، می‌توانید آن را در `clientFilesQuestion` ذخیره کرده و سپس در فایل `question.html` خود درج کنید:

   ```html
   <pl-figure file-name="power-station.jpg" alt="Power Station"></pl-figure>
   ```

   برای جزئیات بیشتر به [مستندات `pl-figure`](./elements/pl-figure.md) مراجعه کنید.

2. المان `pl-file-download` می‌تواند برای ارائه پیوندی به دانشجویان جهت دانلود فایلی از `clientFilesQuestion` یا `clientFilesCourse` به کار رود. به عنوان مثال، جهت اعطای دسترسی به دانشجویان به یک فایل کد اولیه (starting code)، می‌توانید آن را در `clientFilesQuestion` ذخیره کرده و سپس در فایل `question.html` خود درج کنید:

   ```html
   <pl-file-download file-name="starting-code.py"></pl-file-download>
   ```

   این المان همچنین می‌تواند برای ارائه پیوند دانلود فایل‌های ایستا PDF یا صفحات وب استفاده شود. برای جزئیات به [مستندات `pl-file-download`](./elements/pl-file-download.md) مراجعه کنید.

3. برای گنجاندن شیوه‌نامه‌ها (CSS) و اسکریپت‌ها از `clientFilesCourse` یا `clientFilesQuestion` در سوال خود، می‌توانید آن‌ها را به عنوان وابستگی‌ها در فایل پیکربندی سوال اضافه کنید. به عنوان مثال، برای گنجاندن یک شیوه‌نامه با نام `styles.css` از `clientFilesCourse`، می‌توانید قطعه زیر را به فایل `info.json` خود اضافه کنید:

   ```json
   {
     "dependencies": { "clientFilesCourseStyles": ["styles.css"] }
   }
   ```

   برای جزئیات بیشتر درباره نحوه گنجاندن فایل‌های کلاینت به عنوان وابستگی، به [مستندات وابستگی‌های سوال](./question/overview.md#question-dependencies) مراجعه فرمایید.

4. برخی المان‌ها پشتیبانی ویژه‌ای از فایل‌های موجود در این دایرکتوری‌ها دارند. به عنوان مثال، المان `pl-file-editor` اجازه می‌دهد حالت سفارشی ویرایشگر (custom mode) در `clientFilesCourse` یا `clientFilesQuestion` ذخیره شده و با ویژگی `ace-mode` مشخص شود. برای جزئیات به [مستندات `pl-file-editor`](./elements/pl-file-editor.md#editor-modes) مراجعه کنید.

5. برای ارائه این فایل‌ها در بسترهای پیشرفته‌تر مانند ارجاعات درون CSS، ترک‌های صوتی/تصویری یا اشیای تعبیه‌شده (embedded objects)، می‌توانید از الگوهای `{{ options.client_files_course_url }}/filename.ext` و `{{ options.client_files_question_url }}/filename.ext` برای دریافت URL فایلی در `clientFilesCourse` یا `clientFilesQuestion` استفاده کنید. برای مثال، برای قرار دادن تصویری از `clientFilesQuestion` به عنوان تصویر پس‌زمینه یک بلوک، می‌توانید قطعه زیر را در فایل `question.html` سوال خود درج کنید:

   ```html
   <div style="background-image: url('{{ options.client_files_question_url }}/power-station.jpg')">
     <!-- content here -->
   </div>
   ```

!!! warning "هشدار"

    یک الگوی رایج در گذشته استفاده از پیوند نسبی مانند `clientFilesQuestion/filename.ext` برای دسترسی به فایل‌ها در `clientFilesQuestion` بود. این الگو رسماً پشتیبانی نمی‌شود و ممکن است در تمام بسترها کار نکند، بنابراین اکیداً توصیه می‌شود که آن را با الگوی `{{ options.client_files_question_url }}/filename.ext` جایگزین نمایید.

فایل‌های موجود در `clientFilesCourseInstance` و `clientFilesAssessment` (و همچنین `clientFilesCourse`) را می‌توان با استفاده از متن آزمون (assessment text) که در صفحه مرور آزمون دانشجو رندر می‌شود، در اختیار دانشجویان قرار داد. این فایل‌ها با استفاده از الگوهای `{{ client_files_course_instance }}/filename.ext`، `{{ client_files_assessment }}/filename.ext` و `{{ client_files_course }}/filename.ext` رندر می‌شوند که آدرس‌های URL مربوط به فایل‌ها در دایرکتوری متناظر `clientFiles*` را تولید می‌کنند. جزئیات بیشتر را می‌توان در [مستندات متن آزمون](assessment/configuration.md#adding-text-and-links-to-assessments) مطالعه کرد.

## دسترسی به فایل‌ها از کد سوال `server.py`

از درون کد سوال در `server.py`، می‌توانید با استفاده از مقادیر ویژه زیر به فایل‌های این دایرکتوری‌های خاص دسترسی داشته باشید:

| دایرکتوری | متغیر |
| ------------------------- | ----------------------------------------------- |
| خود دایرکتوری سوال | `data["options"]["question_path"]` |
| `clientFilesQuestion` | `data["options"]["client_files_question_path"]` |
| `clientFilesCourse` | `data["options"]["client_files_course_path"]` |
| `serverFilesCourse` | `data["options"]["server_files_course_path"]` |

گزینه‌های مربوط به `clientFilesCourse` و `serverFilesCourse` در صورتی که در حال توسعه المان‌های سفارشی باشید نیز در دسترس هستند.

بنابراین، برای مثال، اگر کد تولید سوال شما به یک فایل داده با نام `data.csv` نیاز دارد که در دایرکتوری `serverFilesCourse` ذخیره شده است، می‌توانید با استفاده از کد زیر به آن دسترسی پیدا کنید:

```python
import os


def generate(data):
    data_file_path = os.path.join(
        data["options"]["server_files_course_path"], "data.csv"
    )
    # اکنون می‌توانید از data_file_path برای دسترسی به محتویات data.csv بخوانید
```

??? note "استفاده از مسیرهای نسبی"

    اگرچه `data["options"]["question_path"]` یک مسیر مطلق به دایرکتوری سوال فراهم می‌کند، اما کد با دایرکتوری سوال به عنوان دایرکتوری کاری جاری (current working directory) اجرا می‌شود، بنابراین می‌توانید با استفاده از مسیرهای نسبی نیز به فایل‌های درون دایرکتوری سوال دسترسی پیدا کنید. به طور مشابه، می‌توانید با استفاده از مسیرهای نسبی به فایل‌های درون `clientFilesQuestion` دسترسی داشته باشید، زیرا این دایرکتوری تضمین شده است که زیردایرکتوری‌ای از دایرکتوری سوال باشد. با این حال، `clientFilesCourse` و `serverFilesCourse` زیردایرکتوری‌های دایرکتوری سوال نیستند و تضمینی وجود ندارد که در مکان خاصی نسبت به دایرکتوری سوال قرار گرفته باشند، بنابراین برای دسترسی به فایل‌های موجود در آن دایرکتوری‌ها باید حتماً از مسیرهای مطلقی که در `data["options"]` ارائه شده‌اند استفاده کنید.

اگر فایل موجود در `serverFilesCourse` شما حاوی کدهای پایتون باشد، کد `server.py` شما می‌تواند آن کد را بدون نیاز به به‌روزرسانی مسیر پایتون (Python path) به عنوان یک ماژول ایمپورت کند. دایرکتوری `serverFilesCourse` هنگام اجرای کد `server.py` به طور خودکار به مسیر پایتون اضافه می‌شود، بنابراین می‌توانید به سادگی ماژول را همانند این که در همان دایرکتوری قرار دارد ایمپورت کنید. برای مثال، اگر فایلی به نام `course_utils.py` در `serverFilesCourse` دارید، می‌توانید آن را در `server.py` با دستور زیر ایمپورت کنید:

```python
import course_utils
```

اگر در حال رندر محتوای HTML در یک تابع `render()` در `server.py` (یا یک المان سفارشی) هستید، می‌توانید از پیشوندهای زیر نیز برای به دست آوردن آدرس‌های URL فایل‌ها در `clientFilesCourse` و `clientFilesQuestion` استفاده نمایید:

| دایرکتوری | پیشوند |
| ------------------------------------------------------------------------ | ------------------------------------------------------ |
| `clientFilesQuestion` | `data["options"]["client_files_question_url"]` |
| `clientFilesCourse` | `data["options"]["client_files_course_url"]` |
| [فایل‌های پویا](./question/server.md#generating-dynamic-files-with-file) | `data["options"]["client_files_question_dynamic_url"]` |

## دسترسی به فایل‌ها از نمره‌دهنده‌های خارجی

سوالاتی که از نمره‌دهی خارجی استفاده می‌کنند نیز می‌توانند به محتوای `serverFilesCourse` دسترسی داشته باشند. برای دسترسی به این فایل‌ها، پیکربندی سوال باید صراحتاً این فایل‌ها یا دایرکتوری‌ها را در پیکربندی نمره‌دهی خارجی در `info.json` بگنجاند. برای مثال، به منظور اعطای دسترسی به نمره‌دهنده خارجی به فایلی به نام `data.csv` در `serverFilesCourse`، می‌توانید قطعه زیر را به فایل `info.json` خود اضافه کنید:

```json
{
  "externalGradingOptions": {
    "serverFilesCourse": ["data.csv"]
  }
}
```

جزئیات بیشتر را می‌توان در [مستندات نمره‌دهی خارجی](externalGrading.md#configuring-and-enabling-external-grader-support) مشاهده کرد.

## دسترسی به فایل‌ها از محیط‌های کاری (Workspaces)

سوالاتی که از محیط‌های کاری استفاده می‌کنند نیز می‌توانند به گونه‌ای پیکربندی شوند که شامل فایل‌هایی از دایرکتوری‌های سوال یا `serverFilesCourse` باشند. برای دسترسی به این فایل‌ها، باید آن‌ها را به فیلد `data["params"]["_workspace_files"]` در `server.py` اضافه نمایید. به عنوان مثال، برای اعطای دسترسی به یک محیط کاری به فایلی به نام `data.csv` در `serverFilesCourse` و فایلی به نام `config.json` در `clientFilesQuestion`، می‌توانید کد زیر را به `server.py` خود اضافه کنید:

```python
def generate(data):
    data["params"]["_workspace_files"] = [
        {"name": "config.json", "questionFile": "clientFilesQuestion/config.json"},
        {"name": "data.csv", "serverFilesCourseFile": "data.csv"},
    ]
```

برای جزئیات بیشتر، به [مستندات محیط‌های کاری](./workspaces/index.md#creating-files-in-the-workspace-home-directory) مراجعه نمایید.
