# احراز هویت

در حال حاضر PrairieLearn از [Google OAuth 2](#google-oauth-2) به عنوان تنها روش پشتیبانی‌شده برای احراز هویت کاربران در نمونه‌های سلف‌هاستد (Self-hosted) PrairieLearn استفاده می‌کند. اگرچه [LTI 1.1](../courseInstance/index.md#lti-support) نیز در دسترس است، اما منسوخ (Deprecated) شده و باید در استقرارهای جدید از آن اجتناب شود. پروتکل [LTI 1.3](../lti13.md) برای تعامل‌پذیری با سامانه‌های مدیریت یادگیری (LMS) پشتیبانی می‌شود، اما نه به عنوان یک روش احراز هویت.

!!! note "احراز هویت با SAML و Azure"

    احراز هویت با استفاده از SAML یا Azure تنها به عنوان ویژگی‌های سازمانی (Enterprise) در دسترس است و در نمونه‌های سلف‌هاستد PrairieLearn پشتیبانی نمی‌شود. در صورت تمایل به استفاده از این قابلیت‌ها، لطفاً جهت کسب اطلاعات درباره میزبانی پولی و پشتیبانی سازمانی از <https://www.prairielearn.com> دیدن فرمایید.

## پروتکل Google OAuth 2

برای شروع، یک [حساب Google Cloud](https://cloud.google.com/) ایجاد کرده و سپس:

- روی [کنسول (Console)](https://console.cloud.google.com/) کلیک کنید تا وارد کنسول خود شوید.
- یک پروژه بسازید و سپس به بخش [APIs & Services](https://console.cloud.google.com/apis/dashboard) بروید.
  - به بخش `OAuth consent screen` رفته و فرم رضایت را تکمیل کنید.
  - به بخش `Credentials` بروید و یک `OAuth client ID` جدید ایجاد نمایید.
  - گزینه `Web application` را انتخاب کنید.
  - در بخش Authorized JavaScript origins، روی `ADD URI` کلیک کرده و دامنه خود را اضافه کنید.
  - در بخش Authorized redirect URIs، روی `ADD URI` کلیک کرده و آدرس `https://yourdomain.com/pl/oauth2callback` را که مسیر بازخورد (Callback) برای Google OAuth است وارد کنید.
  - روی `Create` کلیک کنید که به شما یک `Client ID` و یک `Client Secret` ارائه می‌دهد. **این مقادیر را مخفی نگه دارید.**

اکنون کلیدها را به فایل `config.json` اضافه کنید:

```json title="config.json"
{
  "googleClientId": "Your Client ID key",
  "googleClientSecret": "Your Client Secret key",
  "googleRedirectUrl": "https://yourdomain.com/pl/oauth2callback",
  "hasOauth": true
}
```

اکنون باید بتوانید با استفاده از گوگل وارد نمونه PrairieLearn خود شوید.
