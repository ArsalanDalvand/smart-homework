# راهنمای راه‌اندازی PrairieLearn برای درس مبانی برنامه‌نویسی پایتون - دانشگاه علم و صنعت ایران (IUST)

این ریپازیتوری برای درس **مبانی برنامه‌نویسی پایتون** در دانشکده مهندسی کامپیوتر دانشگاه علم و صنعت ایران پیکربندی شده است.

---

## ۱. ساختار محتوا و پوشه‌ها

* **پوشه درس علم و صنعت:** `courses/iust-bp/`
  * `infoCourse.json`: اطلاعات کلی درس (نام، عنوان به فارسی، تگ‌ها و حوزه‌های موضوعی، تایم‌زون تهران).
  * `courseInstances/Fall2026/`: ترم نیم‌سال اول (تنظیمات انتشار و دسترسی دانشجویان).
  * `courseInstances/Fall2026/assessments/HW01/`: تکلیف اول با بارم‌بندی و سوالات.
  * `questions/python/`:
    * `circle-area/`: مسئله ۱ (محاسبه مساحت دایره با تست‌های شعاع منفی، صفر و اعشاری)
    * `solve-quadratic/`: مسئله ۲ (حل معادله درجه دوم با تست‌های دلتای مثبت، صفر و منفی)
    * `is-prime/`: مسئله ۳ (تشخیص عدد اول با تست‌های مرزی و کارایی)
* **پیکربندی داکر:** `docker-compose.iust.yml`

---

## ۲. اجرای محلی (روی سیستم خودتان)

سرویس در حال حاضر فعال است و روی پورت **۳۰۸۰** (جهت جلوگیری از تداخل با پورت ۳۰۰۰) گوش می‌دهد:

```bash
cd ~/projects/arsalandalvand/PrairieLearn
docker compose -f docker-compose.iust.yml up -d
```

### لینک‌های دسترسی سریع در مرورگر:
* **صفحه اصلی سامانه:** [http://localhost:3080/pl](http://localhost:3080/pl)
* **پنل مدیریت درس علم و صنعت:** [http://localhost:3080/pl/course/1](http://localhost:3080/pl/course/1)
* **تکلیف اول (HW01):** [http://localhost:3080/pl/course_instance/1/assessment/1](http://localhost:3080/pl/course_instance/1/assessment/1)
* **پیش‌نمایش و تست سوال مساحت دایره:** [http://localhost:3080/pl/course/1/question/1/preview](http://localhost:3080/pl/course/1/question/1/preview)
* **پیش‌نمایش سوال عدد اول:** [http://localhost:3080/pl/course/1/question/2/preview](http://localhost:3080/pl/course/1/question/2/preview)
* **پیش‌نمایش سوال معادله درجه دو:** [http://localhost:3080/pl/course/1/question/3/preview](http://localhost:3080/pl/course/1/question/3/preview)

> **نکته:** هر زمان فایل‌های JSON سوالات یا تکالیف را روی سیستم ویرایش کردید، از بالای منوی PrairieLearn روی دکمه سبز رنگ **"Load from disk"** کلیک کنید تا تغییرات فوراً بدون نیاز به ریستارت کانتینر اعمال شوند.

---

## ۳. نحوه انتقال و استقرار روی سرور اصلی دانشگاه

برای بردن این پروژه روی سرور لینوکسی دانشگاه:

1. **کلون کردن ریپازیتوری روی سرور:**
   ```bash
   git clone git@github.com:ArsalanDalvand/PrairieLearn.git
   cd PrairieLearn
   ```
2. **پوشه کارهای تصحیح داکر:**
   ```bash
   mkdir -p ~/pl_ag_jobs
   ```
3. **تنظیم پورت و اجرای کانتینر:**
   در فایل `docker-compose.iust.yml` می‌توانید پورت را به پورت دلخواه (مثلاً ۸۰ یا ۳۰۰۰) تغییر دهید یا از متغیر محیطی استفاده کنید:
   ```bash
   PL_PORT=80 docker compose -f docker-compose.iust.yml up -d
   ```
4. **تنظیم Nginx Reverse Proxy (پیشنهادی برای دامنه دانشگاه):**
   ```nginx
   server {
       listen 80;
       server_name bp.iust.ac.ir;

       location / {
           proxy_pass http://127.0.0.1:3080;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }
   ```
