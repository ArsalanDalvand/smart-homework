# رابط برنامه‌نویسی کاربردی (API)

سامانه PrairieLearn شامل یک API محدود برای استفاده مدرسان است که امکان دسترسی برنامه‌نویسی‌شده به ارزیابی‌ها، نمونه‌های ارزیابی (Assessment Instances) و پاسخ‌های ارسالی (Submissions) را فراهم می‌کند.

## احراز هویت در API

سامانه PrairieLearn از توکن‌های دسترسی شخصی (Personal Access Tokens) برای API استفاده می‌کند. برای ایجاد یک توکن دسترسی شخصی، روی نام خود در نوار ناوبری کلیک کرده و گزینه "Settings" (تنظیمات) را انتخاب کنید. در بخش "Personal Access Tokens"، می‌توانید برای خود توکن ایجاد کنید. این توکن‌ها تمامی دسترسی‌ها و مجوزهای حساب کاربری عادی شما را به همراه دارند.

توکن خود را از طریق هدر `Private-Token` ارسال کنید:

```sh
curl -H "Private-Token: TOKEN" https://us.prairielearn.com/pl/api/v1/<REST_OF_PATH>
```

## متدهای HTTP نقاط پایانی (Endpoints)

نقاط پایانی API نیازمند یک [درخواست `GET`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Methods/GET) یا یک [درخواست `POST`](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Methods/POST) هستند. یک درخواست `GET` اطلاعاتی مانند داده‌های دفتر نمرات را از PrairieLearn بازیابی می‌کند. یک درخواست `POST` از PrairieLearn می‌خواهد که عملیاتی مانند همگام‌سازی مخزن GitHub درس را انجام دهد. برای درخواست‌های `GET` می‌توانید از قالبی مشابه با مثال بالا پیروی کنید.

در اینجا یک مثال از استفاده از `curl` برای یک درخواست `POST` آورده شده است:

```sh
curl -H "Private-Token: TOKEN" -X POST https://us.prairielearn.com/pl/api/v1/<REST_OF_PATH>
```

## نمونه اسکریپت دسترسی

یک نمونه اسکریپت که تمام داده‌های API را برای یک دوره (Course Instance) دانلود می‌کند در فایل [`api_download.py`](https://github.com/PrairieLearn/PrairieLearn/blob/master/contrib/api_download.py) قرار دارد. می‌توانید آن را به این صورت اجرا کنید:

```sh
python api_download.py --token 9a6932a1-e356-4ddc-ad82-4cf30ad896ac --course-instance-id 29832 --output-dir tam212fa18
```

مقدار `token` توکن دسترسی شخصی شما است که در بالا توضیح داده شد. مقدار `course-instance-id` را می‌توانید با رفتن به دوره خود در رابط کاربری وب PrairieLearn و استخراج شناسه عددی آن از URL به دست آورید.

## نقاط پایانی (Endpoints)

تمامی نقاط پایانی API در مسیر `/pl/api/v1/` قرار دارند. اگر از نسخه عملیاتی (Production) PrairieLearn استفاده می‌کنید، این بدان معناست که API در آدرس <https://us.prairielearn.com/pl/api/v1> در دسترس است. اگر آن را به صورت محلی روی پورت ۳۰۰۰ اجرا می‌کنید، API از طریق <http://localhost:3000/pl/api/v1/> در دسترس خواهد بود.

در فهرست نقاط پایانی زیر، بخش‌هایی از مسیر که با دونقطه شروع می‌شوند مانند `:course_instance_id` باید با شناسه‌های عددی صحیح (Integer IDs) جایگزین شوند.

### دوره‌های درسی (Course instances)

#### دریافت یک دوره درسی مشخص

```text
GET /pl/api/v1/course_instances/:course_instance_id
```

#### دریافت دفتر نمرات برای یک دوره درسی

```text
GET /pl/api/v1/course_instances/:course_instance_id/gradebook
```

#### دریافت قوانین دسترسی برای یک دوره درسی

```text
GET /pl/api/v1/course_instances/:course_instance_id/course_instance_access_rules
```

#### فهرست کردن ارزیابی‌های یک دوره درسی

```text
GET /pl/api/v1/course_instances/:course_instance_id/assessments
```

### ارزیابی‌ها (Assessments)

#### دریافت یک ارزیابی مشخص

```text
GET /pl/api/v1/course_instances/:course_instance_id/assessments/:assessment_id
```

#### فهرست کردن قوانین دسترسی برای یک ارزیابی

```text
GET /pl/api/v1/course_instances/:course_instance_id/assessments/:assessment_id/assessment_access_rules
```

#### فهرست کردن نمونه‌های ارزیابی برای یک ارزیابی

```text
GET /pl/api/v1/course_instances/:course_instance_id/assessments/:assessment_id/assessment_instances
```

### نمونه‌های ارزیابی (Assessment instances)

#### دریافت یک نمونه ارزیابی مشخص

```text
GET /pl/api/v1/course_instances/:course_instance_id/assessment_instances/:assessment_instance_id
```

#### فهرست کردن سوالات نمونه برای یک نمونه ارزیابی

```text
GET /pl/api/v1/course_instances/:course_instance_id/assessment_instances/:assessment_instance_id/instance_questions
```

#### فهرست کردن پاسخ‌های ارسالی برای یک نمونه ارزیابی

```text
GET /pl/api/v1/course_instances/:course_instance_id/assessment_instances/:assessment_instance_id/submissions
```

#### دریافت وقایع‌نگاری (Event log) برای یک نمونه ارزیابی

```text
GET /pl/api/v1/course_instances/:course_instance_id/assessment_instances/:assessment_instance_id/log
```

### پاسخ‌های ارسالی (Submissions)

#### دریافت یک پاسخ ارسالی مشخص

```text
GET /pl/api/v1/course_instances/:course_instance_id/submissions/:submission_id
```

### همگام‌سازی درس (Course sync)

#### شروع همگام‌سازی درس

```text
POST /pl/api/v1/course/:course_id/sync
```

یک `job_sequence_id` برمی‌گرداند که می‌توان از آن برای بررسی وضعیت فرایند همگام‌سازی استفاده کرد.

#### بررسی وضعیت همگام‌سازی درس

```text
GET /pl/api/v1/course/:course_id/sync/:job_sequence_id
```

وضعیت و خروجی لاگ فرایند همگام‌سازی را برمی‌گرداند.
