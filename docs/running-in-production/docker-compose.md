# استفاده از Docker Compose

این صفحه مراحل اولیه استفاده از Docker Compose را برای اجرای PrairieLearn مستند می‌کند. این مستندات شامل اطلاعات حیاتی برای استفاده در محیط عملیاتی (Production) از قبیل پشتیبان‌گیری از پایگاه داده یا دسترسی‌پذیری بالا (High Availability) نمی‌شود.

## شروع کار

مراحل [نصب PrairieLearn با استفاده از کد منبع محلی](../dev-guide/installingLocal.md) را دنبال کنید. سپس این دستور را در پوشه ریشه (Root) اجرا نمایید:

```sh
docker compose -f docker-compose-production.yml up
```

سپس از طریق پورت `3000` به PrairieLearn دسترسی پیدا کنید.

## پیکربندی

پیکربندی PrairieLearn می‌تواند از طریق یک فایل `config.json` در ریشه مخزن انجام شود.

- ابتدا فایل `config.json` را در ریشه مخزن خود بسازید.
- خط زیر را به فایل `docker-compose-production.yml` در زیر بخش `services.pl.volumes` اضافه کنید:

  ```sh
  - ./config.json:/PrairieLearn/config.json
  ```

فایل `config.json` باید شامل مقادیر جایگزین مناسب (Overrides) برای کلیدهای موجود در [`lib/config.ts`](https://github.com/PrairieLearn/PrairieLearn/blob/master/apps/prairielearn/src/lib/config.ts) باشد.

## پراکسی معکوس (Reverse Proxy)

اطلاعات بیشتر درباره پیاده‌سازی پراکسی معکوس را در [مستندات راه‌اندازی عمومی](./setup.md#reverse-proxy) مطالعه کنید.

## احراز هویت

اطلاعات بیشتر را در [مستندات احراز هویت](./authentication.md) مطالعه کنید.

## کاربر مدیر (Admin User)

- نام کانتینر در حال اجرای PrairieLearn خود را با اجرای دستور زیر پیدا کنید:

  ```sh
  docker ps
  ```

  این دستور چندین ستون از اطلاعات مربوط به کانتینر(های) در حال اجرای شما را خروجی می‌دهد. ایمیج `prairielearn/prairielearn` را پیدا کرده و نام متناظر با آن را کپی کنید. به عنوان مثال، نام کانتینر PrairieLearn در این خروجی `docker ps` برابر با `upbeat_roentgen` است:

  ```output
  CONTAINER ID  IMAGE                      COMMAND              CREATED      STATUS      PORTS                   NAMES
  e0f522f41ea4  prairielearn/prairielearn  "/bin/sh -c /Prai…"  2 hours ago  Up 2 hours  0.0.0.0:3000->3000/tcp  upbeat_roentgen
  ```

- با اجرای دستور زیر یک شل (Shell) در کانتینر PrairieLearn خود باز کنید:

  ```sh
  docker exec -it CONTAINER_NAME /bin/bash
  ```

سپس مراحل موجود در [کاربر مدیر](./admin-user.md) را دنبال کنید تا PrairieLearn را راه‌اندازی نمایید.

## افزودن کلیدهای SSH

برای دریافت درس‌ها از طریق GitHub، باید کلیدهای SSH را درون کانتینر پیکربندی کنیم. هر بار که کانتینر حذف می‌شود، کلیدها از دست می‌روند؛ بنابراین باید کلیدها را با سیستم میزبان (Host) یکسان کنیم.

دستور زیر را در سیستم میزبان اجرا کنید:

```sh
ssh-keygen
```

این دستور یک کلید جدید تولید می‌کند. آن را در محلی ذخیره کنید که به خاطر بسپارید. در مرحله بعد باید این کلیدها را به کانتینر داکر متصل (Bind mount) کنید. در فایل `docker-compose-production.yml` و در زیر بخش `volumes` این مورد را اضافه کنید:

```sh
- /host/path/to/.ssh:/root/.ssh
```

برای مشاهده کلید عمومی دستور زیر را اجرا کنید:

```sh
cat ~/.ssh/id_rsa.pub
```

سپس برای افزودن کلید SSH در GitHub، به بخش [SSH keys](https://github.com/settings/ssh/new) در `profile settings` بروید. یک عنوان (Title) اضافه کرده و سپس کلید عمومی را در فیلد `Key` کپی نمایید.

## افزودن درس‌ها

افزودن درس‌ها از طریق مخزن GitHub انجام می‌شود. توصیه می‌شود یک سازمان (Organization) ذیل یک حساب کاربری ایجاد کنید تا بتوانید تمام درس‌ها را به آن اضافه نمایید.

برای اطمینان از اینکه در صورت خاموش شدن کانتینر داکر درس‌ها باقی می‌مانند، باید پوشه‌ای را که درس‌ها در آن ذخیره می‌شوند به سیستم میزبان Bind mount کنیم. در فایل `docker-compose-production.yml` در زیر بخش `volumes` خط زیر را اضافه کنید:

```sh
- host/place/to/store/courses/:/container_courses_dir/
```

هنگامی که یک درس ایجاد کردید، در PrairieLearn به بخش `Admin` رفته و سپس به سمت پایین تا بخش `Courses` اسکرول کنید. در اینجا روی `Add Course` کلیک کنید. اطلاعات مربوطه را وارد نمایید، و توجه ویژه داشته باشید که در بخش `Path` از مسیر متصل‌شده (Bind mount) استفاده کنید.

برای مثال:

`Path: /container_courses_dir/mycourse`

برای کلون کردن درس در PrairieLearn:

- به مخزن گیت‌هاب درسی که می‌خواهید روی PrairieLearn قرار دهید بروید، روی `code` و سپس `SSH` کلیک کنید.
- نشانی SSH URL را کپی کرده و در بخش `Repository` جای‌گذاری نمایید. به صفحه اصلی بازگردید، اکنون باید درس را در آنجا مشاهده کنید.
- روی درس کلیک کنید، سپس دکمه `Sync` را بزنید.
- روی `Pull from remote git repository` کلیک کنید که تمام فایل‌ها را در پوشه مشخص‌شده کلون خواهد کرد.

## پشتیبانی

برای [اطلاعات تکمیلی](./setup.md#support) اینجا را ببینید.
