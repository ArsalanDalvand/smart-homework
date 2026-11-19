# پیکربندی سرور

ویژگی‌های گوناگون سرور پِری‌لرن (PrairieLearn) را می‌توان با یک فایل `config.json` پیکربندی کرد. تنظیمات از چند مسیر بارگذاری و با یکدیگر ادغام می‌شوند، به‌طوری که مقادیر فایل‌های بعدی بر مقادیر فایل‌های قبلی اولویت دارند:

1. `~/.config/prairielearn/config.json` (دایرکتوری خانگی کاربر - هنگام اجرا در Docker کاربرد ندارد)
2. `./config.json` (دایرکتوری ریشه مخزن)
3. `./apps/*/config.json` (دایرکتوری‌های ریشه برنامه‌ها)

برای مثال، اگر در `./config.json` مقدار `"courseDirs"` تنظیم شده باشد و در `./apps/prairielearn/config.json` مقدار `"isEnterprise"`، پیکربندی نهایی شامل هر دو مقدار خواهد بود. اگر هر دو فایل ویژگی یکسانی را تنظیم کرده باشند، مقدار موجود در `./apps/prairielearn/config.json` استفاده خواهد شد.

این فایل به‌صورت یک دیکشنری JSON با ساختار زیر تعریف می‌شود:

```json title="config.json"
{
  "property1": "...",
  "property2": "...",
  "property3": "..."
}
```

فهرست کامل ویژگی‌ها را می‌توانید در [`lib/config.ts`](https://github.com/PrairieLearn/PrairieLearn/blob/master/apps/prairielearn/src/lib/config.ts) بیابید.

کلیدهای محرمانه (Secrets) که از چرخش مدیریت‌شده توسط برنامه (application-managed rotation) پشتیبانی می‌کنند، می‌توانند به‌صورت یک آرایه مرتب و غیرخالی پیکربندی شوند و همزمان سازگاری اسکالر را نیز حفظ کنند. برای مشاهده ویژگی‌های پشتیبانی‌شده و توالی الزامی استقرار، به [چرخش کلیدهای مدیریت‌شده توسط برنامه](keyRotation.md) مراجعه کنید.

## لینک‌های پشتیبانی مدرسان

کادر گفتگوی **دریافت راهنمایی (Get help)**، مستندات و پشتیبانی ایمیلی را برای کادر آموزشی درس فراهم می‌کند. برای افزودن این گزینه‌ها، `supportSlackUrl` را برابر با نشانی URL دعوت اسلک (Slack) و `supportOfficeHoursUrl` را برابر با نشانی URL ساعات اداری زوم (Zoom) تنظیم کنید. هر دو مورد نیاز به پروتکل HTTPS دارند و پیش‌فرض آن‌ها `null` است که باعث پنهان شدن گزینه مربوطه می‌شود. نشانی‌های دعوت و جلسات را به جای فایل‌های سورس عمومی، در پیکربندی محیط استقرار (Deployment) نگهداری کنید.

پیش از حذف لینک‌های موجود از سایت پشتیبانی عمومی خود، این لینک‌ها را پیکربندی و مستقر نمایید.

## تنظیم دایرکتوری‌های درس

دایرکتوری‌های پیش‌فرض درس که توسط پِری‌لرن بارگذاری می‌شوند را می‌توان با تنظیم `"courseDirs"` بازنویسی (Override) کرد. این تنظیم فهرستی از مسیرها برای بارگذاری را دریافت می‌کند که _درون کانتینر Docker_ قرار دارند.

```json title="config.json"
{
  "courseDirs": ["exampleCourse", "testCourse", "/myCourse"]
}
```

!!! note "نکته"

    این دایرکتوری‌ها مسیرهایی درون کانتینر هستند، نه روی کامپیوتر محلی شما.

برای مونت (Mount) کردن یک دایرکتوری از کامپیوتر خود به نحوی که درون کانتینر در دسترس باشد، می‌توانید آرگومان زیر را به دستور اجرای Docker اضافه کنید:

```sh
-v /path/to/myCourse:/myCourse
```

سپس، این مسیر در `/myCourse` قابل دسترسی خواهد بود (به اسلش ابتدایی دقت کنید).

## راه‌اندازی محلی ثبت تصویر خارجی

المان [`pl-image-capture`](../elements/pl-image-capture.md) به کاربران اجازه می‌دهد تصاویری از کارهای ارسال‌شده را از طریق یک دستگاه خارجی، مانند گوشی همراه، تبلت یا دوربین محلی، ثبت کنند.

برای استفاده از قابلیت ثبت خارجی به‌صورت محلی، باید `serverCanonicalHost` را در فایل `config.json` برابر با آدرس IPv4 محلی خود تنظیم نمایید.

برای به دست آوردن آدرس IPv4 محلی خود:

- در macOS: در ترمینال، دستور زیر را اجرا کنید:
  `ifconfig | grep "inet " | grep -Fv 127.0.0.1 | awk '{print $2}'`

- در Linux: در ترمینال خود، دستور زیر را اجرا کنید:
  `ip -o route get to 8.8.8.8 | sed -n 's/.*src \([0-9.]\+\).*/\1/p'`

- در Windows: در Command Prompt، دستور زیر را اجرا کنید:
  `ipconfig | findstr /C:"IPv4"`

اولین آدرسی که مشاهده می‌کنید را کپی کرده و آن را در ویژگی `serverCanonicalHost` در فایل `config.json` خود قرار دهید.

برای مثال، اگر IPv4 شما `192.168.1.60` باشد و PL روی پورت `3000` اجرا شود، فایل شما باید به این صورت باشد:

```json title="config.json"
{
  "serverCanonicalHost": "http://192.168.1.60:3000"
}
```

## محیط‌های کاری و نمره‌دهنده‌های خارجی

### اجرای مستقیم پِری‌لرن (Native)

!!! note "نکته"

    این بخش مربوط به [نصب‌های مستقیم (Native)](installingNative.md) است، جایی که پِری‌لرن مستقیماً روی کامپیوتر شما اجرا می‌شود. اگر پِری‌لرن را با `docker run` اجرا می‌کنید، به‌جای این بخش، [دستورالعمل‌های Docker برای محیط‌های کاری و نمره‌دهنده‌های خارجی](../installing.md#support-for-external-graders-and-workspaces) را دنبال کنید و تنظیمات دایرکتوری، hostname و مالکیت (ownership) زیر را روی مقادیر پیش‌فرض آن‌ها رها نمایید.

دایرکتوری‌های مورد استفاده برای ذخیره فایل‌های محیط کاری را در `config.json` خود تنظیم کنید:

```json title="config.json"
{
  "workspaceHostHomeDirRoot": "/tmp/workspace",
  "workspaceHomeDirRoot": "/tmp/workspace"
}
```

#### اجرای مستقیم روی macOS

در macOS، ممکن است نیاز باشد مقدار `"workspaceDevContainerHostname"` را نیز به `"localhost"` تغییر دهید.

```json title="config.json"
{
  "workspaceDevContainerHostname": "localhost"
}
```

برخی ایمیج‌ها بررسی می‌کنند که آیا برنامه با دسترسی root اجرا می‌شود یا خیر و تلاش می‌کنند قبل از تغییر به کاربر 1001، مالکیت (chown) فایل‌های محیط کاری را به کاربر 1001 تغییر دهند (`pl-gosu-helper.sh`). در macOS، این عملیات با شکست مواجه می‌شود زیرا فایل‌سیستم‌های bind mount قابل chown شدن نیستند (فایل‌سیستم‌های مبتنی بر FUSE). برای رفع این مشکل، می‌توانید مقادیر `"workspaceJobsDirectoryOwnerUid"` و `"workspaceJobsDirectoryOwnerGid"` را در `config.json` خود برابر با 1001 تنظیم کنید.

```json title="config.json"
{
  "workspaceJobsDirectoryOwnerUid": 1001,
  "workspaceJobsDirectoryOwnerGid": 1001
}
```

بسیاری از کانتینرها فقط با UID 1001 یا 0 قابل اجرا هستند. مطمئن شوید که به‌صورت محلی برنامه را با دسترسی root اجرا می‌کنید!

```sh
sudo make dev-workspace-host
sudo make dev
```

اگر هر دوی این دستورات را اجرا نکنید، با خطاهایی مانند خطاهای زیر مواجه خواهید شد:

```text
chown: changing ownership of '/home/coder/workspace': Permission denied
chown: changing ownership of '/home/coder/workspace/fibonacci.py': Permission denied
```

### تست ایمیج‌های محلی Docker

هم در روش Docker و هم در نصب مستقیم (Native)، می‌توانید با غیرفعال کردن دریافت خودکار ایمیج‌ها (image pull) در `config.json`، از [ایمیج‌های Docker](../dockerImages.md) که به‌صورت محلی ساخته شده‌اند استفاده کنید:

```json title="config.json"
{
  "workspacePullImagesFromDockerHub": false,
  "externalGradingPullImagesFromDockerHub": false
}
```

این گزینه‌ها مستقل از یکدیگر هستند و مقدار پیش‌فرض هر دو `true` است.

## نسخه سازمانی (Enterprise)

برخی از ویژگی‌های پِری‌لرن فقط در نسخه تجاری/سازمانی (Enterprise Edition) در دسترس هستند. توجه داشته باشید که هنگام فعال‌سازی این گزینه، باید به [مجوز پِری‌لرن (PrairieLearn License)](https://github.com/PrairieLearn/PrairieLearn/blob/master/LICENSE) پایبند باشید.

```json title="config.json"
{
  "isEnterprise": true
}
```
