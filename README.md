# سامانه جامع یادگیری، آموزش و آزمون‌های هوشمند
### Smart Learning & Automated Assessment Platform

<div align="center" dir="rtl">

[![Status](https://img.shields.io/badge/status-active-success.svg)]()
[![Platform](https://img.shields.io/badge/platform-Docker%20%7C%20Node.js%20%7C%20Postgres-blue.svg)]()
[![License](https://img.shields.io/badge/license-AGPLv3-green.svg)]()
[![Developer](https://img.shields.io/badge/Developer-Arsalan%20Dalvand-orange.svg)](https://t.me/b_7vat4r)

**پلتفرم متن‌باز، پیشرفته و بومی‌سازی‌شده برای طراحی سوالات پارامتریک، سنجش مهارتی، آزمون‌های برخط و تصحیح خودکار کدهای برنامه‌نویسی بر پایه فلسفه یادگیری در حد تسلط (Mastery Learning)**

[معرفی و اهداف](#-درباره-پروژه) •
[امکانات و قابلیت‌ها](#-قابلیت‌های-کلیدی) •
[راه‌اندازی سریع](#-راهنمای-راه‌اندازی-سریع) •
[توسعه‌دهنده و ارتباط](#-توسعه‌دهنده-و-نگه‌دارنده) •
[English Summary](#english-overview)

</div>

---

## 📌 درباره پروژه

این سامانه، نسخه‌ای ارتقایافته، بومی‌سازی‌شده و کاملاً متناسب با ساختار دانشگاه‌ها و مراکز آموزشی کشور است که توسط **ارسلان دالوند** (دانشگاه علم و صنعت ایران) توسعه یافته و بهینه‌سازی شده است. هدف این سامانه جایگزینی روش‌های سنتی سنجش با رویکرد **یادگیری مستمر مبتنی بر مساله‌محوری** است.

### ارکان اصلی فلسفه آموزشی سامانه:
1. **تولید سوالات تصادفی و پارامتریک:** هر دانشجو و در هر تلاش، واریانت منحصربه‌فردی از سوال با داده‌ها و اعداد جدید دریافت می‌کند که امکان تقلب یا اتکای صرف به پاسخ‌های از پیش‌تعیین‌شده را به صفر می‌رساند.
2. **یادگیری در حد تسلط (Mastery Learning):** به فراگیران اجازه داده می‌شود تا با تمرین مکرر و دریافت بازخورد آنی، مفاهیم را تا رسیدن به تسلط ۱۰۰ درصدی تمرین کنند.
3. **محیط‌های کاری و تصحیح خودکار امن:** تصحیح خودکار تکالیف کدنویسی و آزمون‌های برنامه‌نویسی در کانتینرهای ایزوله و امن بدون بار اضافی بر سرور اصلی.

---

## 🚀 قابلیت‌های کلیدی

- **رابط کاربری راست‌چین (RTL) و تایپوگرافی فارسی:** طراحی مدرن، واکنش‌گرا و بهینه‌شده با فونت‌های استاندارد فارسی.
- **احراز هویت جامع و ثبت‌نام خودکار:** امکان عضویت و ثبت‌نام مستقیم فراگیران و ورود با رمز عبور یا ورود یکپارچه سازمانی (SSO).
- **سیستم تصحیح خودکار کدهای پایتون، C/C++ و جاوا:**
  - ارزیابی با Unit Testهای مخفی و عمومی.
  - سنجش زمان اجرا، مصرف حافظه و نشت حافظه با Valgrind و AddressSanitizer.
- **محیط‌های کاری ابری درون‌مرورگری (Workspaces):** دسترسی به VS Code و JupyterLab بدون نیاز به نصب هیچ ابزاری روی سیستم دانشجو.
- **ابزارهای پیشرفته تصحیح دستی (Rubrics):** تعریف معیارهای بارم‌بندی منعطف، تصحیح بدون نام دانشجو برای جلوگیری از سوگیری، و دستیار تصحیح هوش مصنوعی.
- **دفتر نمرات جامع (Gradebook):** تجمیع امتیازات، برون‌بری اکسل و CSV، محاسبه ضریب تمیز سوالات و تحلیل آماری یادگیری.
- **معماری بدون هاردکد (Zero Hardcoding):** قابلیت شخصی‌سازی کامل هویت سازمانی، نام، لوگو و درگاه‌های دانشگاهی بدون تغییر در هسته کد.

---

## 🛠 راهنمای راه‌اندازی سریع (با Docker)

ساده‌ترین روش راه‌اندازی سامانه استفاده از Docker Compose است:

```bash
# ۱. کلون کردن مخزن
git clone https://github.com/ArsalanDalvand/smart-homework.git
cd smart-homework

# ۲. اجرای کانتینر سامانه
docker run -it -p 3080:3000 \
  -v ./testCourse:/course \
  -e PL_BRAND_NAME="سامانه جامع ارزیابی و یادگیری هوشمند" \
  prairielearn/prairielearn:latest
```

سپس مرورگر خود را باز کرده و به آدرس زیر بروید:
`http://localhost:3080/pl`

---

## 👨‍💻 توسعه‌دهنده و نگه‌دارنده

این پروژه به صورت متن‌باز توسعه یافته و توسط **ارسلان دالوند** مدیریت و پشتیبانی می‌شود:

- **توسعه‌دهنده اصلی و سفارشی‌ساز:** ارسلان دالوند (Arsalan Dalvand)
- **وابستگی سازمانی:** دانشکده ریاضی، دانشگاه علم و صنعت ایران (IUST)
- **پست الکترونیکی:** [arsalan_dalvand@mathdep.iust.ac.ir](mailto:arsalan_dalvand@mathdep.iust.ac.ir)
- **تلگرام جهت ارتباط و بازخورد:** [@b_7vat4r](https://t.me/b_7vat4r)
- **مخزن رسمی گیتهاب:** [https://github.com/ArsalanDalvand/smart-homework](https://github.com/ArsalanDalvand/smart-homework)

---

## 🌐 English Overview

**Smart Homework & Automated Assessment Platform** is an advanced, fully localized, problem-driven education and online examination engine based on the Mastery Learning philosophy.

### Key Highlights:
- **Parametric Problem Generation:** Server-side Python logic generates dynamic mathematical and computational problem variants per attempt.
- **Isolated Code Autograding:** Secure Docker sandboxing for Python, C/C++, and Java with strict resource limits and memory analysis.
- **In-browser Cloud Workspaces:** Full VS Code and JupyterLab environments running directly in the browser.
- **Local Password Authentication & Fast Self-Registration:** Zero-barrier onboarding for students and instructors.
- **Complete Persian Localization & RTL Optimization:** Modern UX adhering to web typography and academic workflow standards.

### Maintainer & Author:
- **Lead Developer & Customizer:** Arsalan Dalvand
- **Institution:** Department of Mathematics, Iran University of Science and Technology (IUST)
- **Email:** `arsalan_dalvand@mathdep.iust.ac.ir`
- **Telegram:** [@b_7vat4r](https://t.me/b_7vat4r)
- **Repository:** [https://github.com/ArsalanDalvand/smart-homework](https://github.com/ArsalanDalvand/smart-homework)

---

## 📄 مجوز و حقوق کپی‌رایت (License & Attribution)

این پروژه، نسخه‌ای سفارشی‌سازی‌شده، بومی‌سازی‌شده (فارسی و تقویم شمسی) و توسعه‌یافته بر پایه نرم‌افزار آزاد **PrairieLearn** است.

- **پروژه پایه (Upstream):** پلتفرم متن‌باز PrairieLearn
- **حقوق کپی‌رایت پایه:**
  - Copyright &copy; 2021-present PrairieLearn, Inc.
  - Portions copyright &copy; 2013-2021 University of Illinois Board of Trustees.
- **تغییرات و بومی‌سازی (Modifications):**
  - Copyright &copy; 2026 Arsalan Dalvand (Iran University of Science and Technology - IUST)
- **پروانه نرم‌افزار:** این سامانه به طور کامل تحت مجوز نرم‌افزار آزاد **GNU Affero General Public License v3.0 (AGPLv3)** منتشر شده و سورس‌کد کامل آن در دسترس عموم قرار دارد.
- **محدودیت ماژول‌های EE:** ماژول‌های موجود در دایرکتوری `src/ee` متعلق به بخش تجاری PrairieLearn بوده و استفاده از آنها در محیط‌های عملیاتی تجاری (Production) نیازمند رعایت لایسنس اختصاصی شرکت سازنده است. سامانه در حالت پیش‌فرض بر پایه نسخه آزاد جامعه متن‌باز (Community Edition) اجرا می‌شود.
