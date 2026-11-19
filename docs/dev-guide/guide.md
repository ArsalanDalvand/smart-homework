# راهنمای توسعه‌دهندگان

این صفحه نکاتی پیرامون دیباگ و تست، بهترین روش‌ها و شیوه‌نامه کدنویسی، و همچنین جزئیاتی درباره جنبه‌های گوناگون PrairieLearn (رندر سوالات، اسکیماهای پایگاه داده و غیره) را تشریح می‌کند.

به طور کلی، ما سادگی را ترجیح می‌دهیم. ما از JavaScript/TypeScript (Node.js) و SQL (PostgreSQL) به عنوان زبان‌های پیاده‌سازی استاندارد استفاده می‌کنیم و تلاش داریم تعداد کتابخانه‌ها یا فریم‌ورک‌های پیچیده مورد استفاده را به حداقل برسانیم. این وب‌سایت شامل صفحاتی است که در سمت سرور رندر می‌شوند (server-side generated) و حداقل میزان جاوااسکریپت سمت کلاینت در آن به کار رفته است.

## دید کلی و معماری سطح بالا

![دید کلی معماری سطح بالا](./high-level.d2){pad="0" scale="1"}

- سوالات و ارزیابی‌های یک درس در یک مخزن Git ذخیره می‌شوند. این اطلاعات توسط مدرس درس با پایگاه داده همگام‌سازی (sync) می‌شود و داده‌های پایگاه داده برای نمایش درس به‌روزرسانی شده یا افزوده می‌شوند. سپس دانشجویان با حل سوالات با وب‌سایت درس تعامل دارند و نتایج در پایگاه داده ذخیره می‌شود. مدرس می‌تواند نتایج دانشجویان را در وب‌سایت مشاهده کرده و فایل‌های CSV حاوی داده‌ها را دانلود کند.

- بخش عمده محتوا و پیکربندی درس از طریق فایل‌های متنی ساده (plain text) در مخزن Git انجام می‌شود که منبع اصلی (master source) این داده‌ها است.

- تمام داده‌های دانشجویان در پایگاه داده ذخیره می‌شوند و در هیچ نقطه‌ای به مخزن Git یا دیسک بازگردانده (push) نمی‌شوند.

## تست‌های واحد و تست‌های یکپارچگی

- تست‌های یکپارچگی (Integration tests) در دایرکتوری `apps/prairielearn/src/tests/` نگهداری می‌شوند.
- تست‌های واحد (Unit tests) معمولاً در کنار همان فایل تحت تست قرار دارند و نام فایل آن‌ها با `.test.ts` پایان می‌یابد. به عنوان مثال، تست‌های فایل `foo.ts` در همان دایرکتوری و با نام `foo.test.ts` خواهند بود.

- برای اطلاعات درباره نحوه اجرای مجموعه تست‌ها، [راهنمای شروع سریع توسعه](quickstart.md#testing) را مشاهده کنید.

- تست‌ها توسط GitHub Actions با هر push به GitHub اجرا می‌شوند.

- تست‌ها عمدتاً تست‌های یکپارچگی هستند که با یک پایگاه داده خالی آغاز می‌شوند، سرور را برای مقداردهی اولیه پایگاه داده اجرا می‌کنند، `testCourse` را بارگذاری می‌نمایند و سپس یک مرورگر وب کلاینت را شبیه‌سازی می‌کنند که به سوالات در ارزیابی‌ها پاسخ می‌دهد. اگر تستی با شکست مواجه شود، اغلب ساده‌ترین راه برای دیباگ کردن این است که خطا را با حل شخصی سوالات روی یک سرور محلیِ در حال اجرا بازآفرینی کنید.

- اگر متغیر محیطی `PL_KEEP_TEST_DB` تنظیم شده باشد، پایگاه داده تست (که معمولاً `pltest_1`، `pltest_2` و غیره است) پس از پایان تست حذف نخواهد شد. این به شما امکان می‌دهد وضعیت پایگاه داده را پس از پایان تست بررسی کنید. این پایگاه داده با شروع یک اجرای جدید تست بازنویسی (overwrite) خواهد شد.

## دیباگ جاوااسکریپت سمت سرور

- از [پکیج debug](https://www.npmjs.com/package/debug) برای کمک به ردیابی جریان اجرا در جاوااسکریپت استفاده کنید. برای اجرای سرور با خروجی دیباگ فعال:

  ```sh
  DEBUG=* make dev
  ```

- برای مشاهده لاگ‌های دیباگ صرفاً از PrairieLearn می‌توانید از دستور زیر استفاده کنید:

  ```sh
  DEBUG=prairielearn:* make dev
  ```

- برای درج خروجی دیباگ بیشتر، `debug` را import کرده و به شکل زیر از آن استفاده نمایید:

  ```javascript
  import debugfn from 'debug';

  const debug = debugfn('prairielearn:my-file');

  // in some function later
  debug('func()', 'param:', param);
  ```

## دیباگ جاوااسکریپت سمت کلاینت

- مطمئن شوید که کنسول جاوااسکریپت (JavaScript Console) را در مرورگر خود باز کرده‌اید و صفحه را مجدداً بارگذاری (reload) کنید.

## دیباگ SQL و PL/pgSQL

- از رابط خط فرمان [`psql`](https://www.postgresql.org/docs/current/app-psql.html) برای تست جداگانه SQL استفاده کنید. یک نصب پیش‌فرض توسعه PrairieLearn از پایگاه داده `postgres` استفاده می‌کند، بنابراین باید دستور زیر را اجرا نمایید:

  ```sh
  psql postgres
  ```

- برای دیباگ خطاهای نحو (syntax) در یک رویه ذخیره‌شده (stored procedure)، آن را به صورت دستی با دستور `\i filename.sql` درون `psql` وارد (import) کنید.

- برای دنبال کردن جریان اجرا در PL/pgSQL از `RAISE NOTICE` استفاده کنید. این دستور هنگام اجرا از طریق `psql` در کنسول، و هنگام اجرا از داخل PrairieLearn در فایل لاگ سرور ثبت می‌شود. نحو آن به شکل زیر است:

  ```sql
  RAISE NOTICE 'This is logging: % and %',
  var1,
  var2;
  ```

- برای اجرای دستی یک تابع:

  ```sql
  SELECT
    the_sql_function (arg1, arg2);
  ```

## تولید صفحات HTML

- از [Express](http://expressjs.com) به عنوان فریم‌ورک وب استفاده می‌شود.

- تمام صفحات در سمت سرور رندر می‌شوند (server-side rendered) و تلاش ما بر این است که میزان جاوااسکریپت سمت کلاینت را به حداقل برسانیم. جاوااسکریپت سمت کلاینت باید در صورت امکان از JavaScript/TypeScript خالص (vanilla) استفاده کند، اما کتابخانه‌های شخص ثالث نیز در صورت لزوم می‌توانند به کار گرفته شوند.

- معمولاً تمام فایل‌های هر صفحه وب درون یک دایرکتوری مجزا قرار دارند، به طوری که نام دایرکتوری، فایل‌ها و URL همگی یکسان هستند. البته همه صفحات به تمامی این فایل‌ها نیاز ندارند. به عنوان یک نمونه واقعی، صفحه‌ای را در نظر بگیرید که کاربران می‌توانند شرایط و قوانین PrairieLearn را در آن بپذیرند و در مسیر [`apps/prairielearn/src/ee/pages/terms`](https://github.com/PrairieLearn/PrairieLearn/tree/master/apps/prairielearn/src/ee/pages/terms) واقع شده است. این دایرکتوری شامل فایل‌های زیر است:
  - [`terms.ts`](https://github.com/PrairieLearn/PrairieLearn/tree/master/apps/prairielearn/src/ee/pages/terms/terms.ts): نقطه ورود اصلی برای صفحه. این فایل کوئری‌های SQL را اجرا کرده و قالب را رندر می‌کند.
  - [`terms.sql`](https://github.com/PrairieLearn/PrairieLearn/tree/master/apps/prairielearn/src/ee/pages/terms/terms.sql): تمام کوئری‌های SQL مخصوص این صفحه.
  - [`terms.html.ts`](https://github.com/PrairieLearn/PrairieLearn/tree/master/apps/prairielearn/src/ee/pages/terms/terms.html.ts): قالب صفحه. تابعی را export می‌کند که یک سند HTML برمی‌گرداند.

- در صورت امکان، ترجیح داده می‌شود خصوصیات تایپ‌شده را به طور صریح به قالب‌ها ارسال کنید، به جای آنکه خصوصیات را به `res.locals` اضافه نمایید. با این حال، `res.locals` می‌تواند برای داده‌هایی که از میدلورها می‌آیند و در صفحات متعددی استفاده می‌شوند، به کار رود.

- از پکیج [`@prairielearn/html`](https://github.com/PrairieLearn/PrairieLearn/tree/master/packages/html) برای تولید صفحات HTML استفاده کنید. این پکیج از template literalهای برچسب‌دار HTML (tagged-template literals) برای تولید HTML استفاده می‌کند که به نوبه خود امکان بررسی کامل نوع (type-checking) را به سادگی فراهم می‌سازد.

- قالب‌های با استفاده مجدد (Reused templates) در دایرکتوری `apps/prairielearn/src/components/` ذخیره می‌شوند. این قالب‌ها معمولاً به جای دریافت کامل شیء `res.locals`، باید یک شیء حاوی مشخصات را دریافت کنند.

## استایل و سبک HTML

- از [Bootstrap](http://getbootstrap.com) به عنوان سبک و استایل استفاده کنید. از تاریخ 2025-01-01 ما از Bootstrap 5 استفاده می‌کنیم.

- قوانین CSS محلی در مسیر `public/stylesheets/local.css` قرار می‌گیرند. تلاش کنید استفاده از این فایل را به حداقل برسانید و تا جای ممکن از استایل‌دهی پیش‌فرض Bootstrap استفاده نمایید.

- دکمه‌ها در صورتی که عملیاتی انجام می‌دهند باید از المان `<button>` و هنگامی که صرفاً پیوندی به صفحات دیگر هستند از المان `<a>` استفاده کنند. ما نباید از `<a role="button">` برای جعل المان دکمه استفاده کنیم. دکمه‌هایی که فرمی را ارسال (submit) نمی‌کنند، همواره باید با `<button type="button" class="btn ...">` شروع شوند؛ که در آن `type="button"` مشخص می‌کند دکمه فرم را سابمیت نمی‌کند.

## دسترسی‌پذیری HTML

اگر در حال افزودن چیزی پیچیده‌تر از یک صفحه فرم پایه هستید، بررسی‌های خودکار دسترسی‌پذیری احتمالاً برای بررسی کافی نخواهند بود. برای تست صفحه باید از [VoiceOver (macOS)](https://support.apple.com/guide/voiceover/welcome/mac) یا [NVDA (Windows)](https://www.nvaccess.org/download/) استفاده کنید. تمامی صفحات ما باید با [استاندارد دستورالعمل‌های دسترسی‌پذیری محتوای وب (WCAG) 2.1 سطح AA](https://www.w3.org/TR/WCAG21/) مطابقت داشته باشند. چند مورد متداول برای بررسی:

- آیا المان‌ها به درستی اعلام (خوانده) می‌شوند؟
  - آیا المان‌ها دارای ویژگی‌های مناسب `aria-label` یا `alt` هستند؟
  - آیا توضیحات مختصر و دقیق هستند؟
  - آیا منوها، نوارهای ابزار و سایر المان‌های رابط کاربری نقش‌های مناسب [ARIA roles](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Reference/Roles) را دارند؟
- آیا کاربر می‌تواند تنها با استفاده از صفحه‌کلید در صفحه پیمایش کند؟
  - کلید Tab باید بین المان‌های با قابلیت فوکوس حرکت کند.
  - کلیدهای Space یا Enter باید دکمه‌ها و پیوندها را فعال کنند.
  - کلیدهای جهت‌نما (Arrow keys) باید درون کامپوننت‌هایی مانند منوهای کشویی (dropdowns) و جدول‌ها پیمایش کنند.
  - اقداماتی که نیازمند کشیدن با ماوس (drag) هستند باید جایگزین‌های صفحه‌کلیدی داشته باشند.
- آیا فوکوس به درستی مدیریت می‌شود؟
  - آیا فوکوس به درستی درون مودال‌ها و سایر کادرهای محاوره‌ای محصور (trap) می‌شود؟
  - آیا موقعیت فوکوس در هنگام رندرهای مجدد حفظ می‌شود؟
- آیا نشانگرهای فوکوس قابل مشاهده هستند؟
- آیا چیدمان صفحه منطقی و درک آن آسان است؟
- آیا کاربران دارای اختلالات بینایی قادر به استفاده از صفحه خواهند بود؟
  - آیا نسبت کنتراست بین متن و رنگ‌های پس‌زمینه حداقل 4.5:1 است؟
  - آیا نسبت کنتراست بین المان‌های رابط کاربری و رنگ‌های پس‌زمینه حداقل 3:1 است؟
  - آیا فاصله‌گذاری مناسبی بین المان‌ها وجود دارد؟

## نحوه استفاده از SQL

- از [PostgreSQL](https://www.postgresql.org) نسخه ۱۷ به عنوان پایگاه داده استفاده می‌شود.

- [راهنمای PostgreSQL](https://www.postgresql.org/docs/manuals/) مرجعی بسیار عالی است.

- به جای استفاده از [کتابخانه‌های ORM](https://en.wikipedia.org/wiki/Object-relational_mapping)، کدهای خام SQL بنویسید. این کار تعداد فریم‌ورک‌ها و زبان‌های مورد نیاز را کاهش می‌دهد.

- ترجیح دهید منطق‌های پیچیده را به جای درون کوئری‌ها، در کدهای TypeScript پیاده‌سازی کنید.

- از قرارداد نام‌گذاری [`snake_case`](https://en.wikipedia.org/wiki/Snake_case) در SQL برای نام‌ها استفاده کنید. همچنین برای نام‌هایی در جاوااسکریپت که مشابه نام‌های موجود در SQL هستند از همین قرارداد استفاده نمایید؛ بنابراین متغیر `question_id` در SQL، در کد جاوااسکریپت نیز `question_id` نامیده می‌شود.

- از حروف بزرگ برای کلمات کلیدی رزرو شده SQL مانند `SELECT`، `FROM`، `AS` و غیره استفاده کنید.

- کدهای SQL نباید به صورت درون‌خطی (inline) در فایل‌های جاوااسکریپت نوشته شوند. در عوض، باید در یک فایل مجزای `.sql` و مطابق با [مفهوم `Yesql`](https://github.com/krisajenkins/yesql) قرار گیرند. هر فایل `filename.js` معمولاً یک فایل متناظر `filename.sql` در همان دایرکتوری خواهد داشت. فایل `.sql` باید ساختاری شبیه به این داشته باشد:

  ```sql
  -- BLOCK select_question
  SELECT
    *
  FROM
    questions
  WHERE
    id = $question_id;

  -- BLOCK insert_user
  INSERT INTO
    users (uid)
  VALUES
    ($uid)
  RETURNING
    *;
  ```

سپس از طریق جاوااسکریپت می‌توانید به شکل زیر عمل کنید:

```javascript
import { loadSqlEquiv, queryRow } from '@prairielearn/postgres';

import { QuestionSchema } from './lib/db-types.js';

const sql = loadSqlEquiv(import.meta.url);

const question = await queryRow(sql.select_question, { question_id: 45 }, QuestionSchema);
```

- برای سازمان‌یافته نگه داشتن کدهای SQL، ایده بسیار خوبی است که از [عبارات CTE (کوئری‌های `WITH`)](https://www.postgresql.org/docs/current/static/queries-with.html) استفاده کنید. ساختار آن‌ها به این صورت است:

  ```sql
  WITH
    first_preliminary_table AS (
      SELECT
        -- first preliminary query
    ),
    second_preliminary_table AS (
      SELECT
        -- second preliminary query
    )
  SELECT
    -- main query here
  FROM
    first_preliminary_table AS fpt,
    second_preliminary_table AS spt;
  ```

## رویه‌های ذخیره‌شده پایگاه داده (sprocs)

!!! warning

    ما در حال مهاجرت و کنار گذاشتن استفاده از [sprocs](https://neon.com/postgresql/postgresql-plpgsql/postgresql-create-procedure) هستیم. ترجیحاً منطق برنامه را در TypeScript بنویسید.

- رویه‌های ذخیره‌شده توسط فایل‌های موجود در `sprocs/` ایجاد می‌شوند. برای فراخوانی یک رویه ذخیره‌شده از داخل جاوااسکریپت، از کدی مانند زیر استفاده کنید:

  ```js
  const workspace_id = 1342;
  const message = 'Startup successful';
  await sqldb.callAsync('workspaces_message_update', [workspace_id, message]);
  ```

- تمام رویه‌های ذخیره‌شده درون یک [اسکیمای مجزای پایگاه داده](https://www.postgresql.org/docs/current/ddl-schemas.html) با نامی مانند `server_2021-07-07T20:25:04.779Z_T75V6Y` قرار دارند. برای مشاهده فهرست اسکیماها از دستور `\dn` در `psql` استفاده کنید.

- برای اینکه بتوانید از رویه‌های ذخیره‌شده در خط فرمان `psql` استفاده کنید، لازم است با استفاده از `\dn` نام جدیدترین اسکیما را به دست آورده و `search_path` را طوری تنظیم کنید که از نام این اسکیمای _داخل گیومه (quoted)_ و اسکیمای `public` استفاده کند:

  <!-- prettier-ignore -->
  ```sql
  set search_path to "server_2021-07-07T20:25:04.779Z_T75V6Y", public;
  ```

- در هنگام راه‌اندازی، در ابتدا هیچ اسکیمای غیر عمومی (non-public) در حال استفاده نیست. ما ابتدا مایگریشن‌ها را برای به‌روزرسانی تمام جدول‌ها در اسکیمای `public` اجرا می‌کنیم، سپس تابع `sqldb.setRandomSearchSchemaAsync()` را فراخوانی می‌نماییم تا یک اسکیمای تصادفی به ازای هر اجرا فعال شود، و کد ایجاد sproc را برای تولید تمام رویه‌های ذخیره‌شده در این اسکیما اجرا می‌کنیم. این بدان معناست که هر نمونه در حال اجرای PrairieLearn، نسخه محلی خود از رویه‌های ذخیره‌شده را خواهد داشت که دقیقاً نسخه صحیح منطبق با کد آن است. این ویژگی به ما اجازه می‌دهد سرورهای PrairieLearn را یکی یکی ارتقا دهیم، در حالی که سرورهای قدیمی همچنان با کپی‌های sprocs خود به کار ادامه می‌دهند. هنگامی که PrairieLearn برای اولین بار شروع به کار می‌کند، دارای `search_path = public` است، اما بعداً مقدار آن به `search_path = "server_2021-07-07T20:25:04.779Z_T75V6Y",public` تغییر می‌یابد تا ابتدا اسکیمای تصادفی را جستجو کرده و سپس در صورت لزوم به `public` رجوع کند. قرارداد نام‌گذاری اسکیمای تصادفی از نام نمونه محلی، تاریخ و یک رشته تصادفی تشکیل می‌شود. توجه داشته باشید که نام‌های اسکیما باید در `psql` با استفاده از دابل کوتیشن (`"`) نقل‌قول شوند، زیرا حاوی کاراکترهایی مانند خط تیره هستند.

- برای جزئیات بیشتر به `sprocs/array_and_number.sql` و توضیحات درون `server.js` در نزدیکی فراخوانی `sqldb.setRandomSearchSchemaAsync()` مراجعه کنید.

## اسکیمای پایگاه داده (نمای کلی و ساده‌شده)

- مهم‌ترین جداول موجود در پایگاه داده در نمودار زیر نشان داده شده‌اند:

![نمودار ساده‌شده پایگاه داده](./simplified-models.d2)

- توضیحات دقیق قالب هر جدول در [فهرست جداول پایگاه داده](https://github.com/PrairieLearn/PrairieLearn/blob/master/database/tables/) آورده شده است.

- هر جدول دارای یک شماره `id` است که برای ارجاع متقابل (cross-referencing) استفاده می‌شود. به عنوان مثال، هر ردیف در جدول `questions` دارای یک `id` است و جداول دیگر با نام `question_id` به آن ارجاع می‌دهند. به دلایل قدیمی و تاریخی (legacy)، دو استثنا برای این قاعده وجود دارد:
  - جدول `users` به جای `id` دارای کلید اصلی `user_id` است.

- هر کاربر به صورت یک ردیف در جدول `users` ذخیره می‌شود.

- جدول `courses` برای هر درس (مانند `TAM 212`) یک ردیف دارد.

- جدول `course_instances` برای هر نیم‌سال ("دوره یا Instance") از هر درس یک ردیف دارد که `course_id` مشخص می‌کند به کدام درس تعلق دارد.

- هر سوال یک ردیف در جدول `questions` است و `course_id` نشان می‌دهد متعلق به کدام درس است. می‌توان همه سوالات یک درس را به عنوان "مخزن سوالات" (question pool) آن درس در نظر گرفت. همین مخزن برای تمام نیم‌سال‌ها (همه دوره‌های درس) استفاده می‌شود.

- ارزیابی‌ها در جدول `assessments` ذخیره می‌شوند و هر ردیف ارزیابی دارای یک `course_instance_id` است تا مشخص شود متعلق به کدام دوره درس (و در نتیجه کدام درس) است. یک ارزیابی مواردی مانند "تکلیف ۱" یا "آزمون ۳" است. برای تعیین این موضوع می‌توانیم از `assessment_set_id` و `number` در هر ردیف ارزیابی استفاده کنیم.

- هر ارزیابی دارای فهرستی از سوالات مرتبط با خود است. این فهرست در جدول `assessment_questions` ذخیره می‌شود که در آن هر ردیف دارای `assessment_id` و `question_id` است تا مشخص شود چه سوالاتی متعلق به کدام ارزیابی هستند. به عنوان مثال، ممکن است ۲۰ سوال مختلف در "آزمون ۱" وجود داشته باشد و قرار باشد برای هر دانشجو ۵ مورد از این سوالات به صورت تصادفی انتخاب شود.

- هر دانشجو نسخه اختصاصی خود از یک ارزیابی را خواهد داشت که در جدول `assessment_instances` ذخیره می‌شود و هر ردیف آن دارای `user_id` و `assessment_id` است. نمره دانشجو برای آن ارزیابی در همین‌جا ذخیره می‌گردد.

- گزینش سوالاتی که به هر دانشجو در هر ارزیابی اختصاص داده می‌شود در جدول `instance_questions` قرار دارد. در اینجا هر ردیف دارای یک `assessment_question_id` و یک `assessment_instance_id` است تا نشان دهد سوال مربوطه در نمونه ارزیابی قرار دارد. این ردیف همچنین نمره دانشجو در این سوال خاص را ذخیره می‌کند.

- سوالات می‌توانند پارامترهای خود را تصادفی‌سازی کنند، بنابراین حالت‌ها یا گونه‌های (variants) متعددی برای هر سوال امکان‌پذیر است. این موارد در جدول `variants` ذخیره می‌شوند و `instance_question_id` مشخص می‌کند که این گونه متعلق به کدام سوال نمونه است.

- برای هر گونه از یک سوال که دانشجو مشاهده می‌کند، او می‌تواند صفر یا چند پاسخ ارسالی (`submissions`) ثبت کرده باشد که با `variant_id` مشخص می‌شود متعلق به کدام است. ردیف submissions همچنین شامل اطلاعاتی پیرامون پاسخ ارسالی و صحیح بودن یا نبودن آن است.

- جدول `assessment_tools` پیکربندی ابزارها (مانند ماشین‌حساب) را برای ارزیابی‌ها ذخیره می‌کند. هر ردیف به یک `zone_id` یا یک `assessment_id` ارجاع دارد که امکان پیکربندی ابزارها در سطح ارزیابی یا بازنویسی (override) به ازای هر ناحیه (zone) را فراهم می‌سازد.

??? tip "کاوش در اسکیما و داده‌ها"

    افزونه [`ms-ossdata.vscode-pgsql` در VSCode](https://marketplace.visualstudio.com/items?itemName=ms-ossdata.vscode-pgsql) می‌تواند به شما در کاوش اسکیما و داده‌های پایگاه داده در ویرایشگرتان کمک کند.

    ![Setup Postgres VSCode](./postgres-vscode-setup.png)

    ![Using Postgres VSCode](./postgres-vscode-select-1000.png)

??? tip "پاک‌سازی اسکیماهای قدیمی"

    کوئری زیر تمام اسکیماها به جز `public` را حذف می‌کند. سپس می‌توانید سرور را مجدداً راه‌اندازی کنید تا sprocs دوباره ساخته شوند.

    ```sql
    DO $$
    DECLARE
      r RECORD;
    BEGIN
      FOR r IN
        SELECT nspname
        FROM pg_namespace
        WHERE nspname NOT IN ('public', 'information_schema', 'pg_catalog')
          AND nspname NOT LIKE 'pg_toast%'
          AND nspname NOT LIKE 'pg_temp_%'
      LOOP
        EXECUTE format('DROP SCHEMA IF EXISTS %I CASCADE;', r.nspname);
        COMMIT;  -- avoid shared memory exhaustion
      END LOOP;
    END $$;
    ```

## اسکیمای پایگاه داده (داده‌های کامل)

- به [فهرست جداول پایگاه داده](https://github.com/PrairieLearn/PrairieLearn/blob/master/database/tables/) و دیاگرام رابطه موجودیت (ER) در زیر مراجعه کنید:

![نمودار کامل پایگاه داده](./models.d2){layout="elk"}

## قراردادهای نام‌گذاری اسکیمای پایگاه داده

- جداول نام‌های جمع دارند (مانند `assessments`) و همیشه کلید اصلی به نام `id` دارند. کلیدهای خارجی (Foreign keys) که به این جدول اشاره می‌کنند به صورت مفرد هستند، مانند `assessment_id`. هنگام ارجاع به این جداول، از مخفف حروف اول هر کلمه استفاده کنید، مانند `ai` در این مورد. تنها استثناها عبارتند از `aset` برای `assessment_sets` (جهت جلوگیری از تداخل با کلمه کلیدی `AS` در SQL)، `top` برای `topics`، و `tag` برای `tags` (جهت جلوگیری از تداخل). این موضوع به کدهایی مشابه زیر منتهی می‌شود:

  ```sql
  -- select all active assessment_instances for a given assessment
  SELECT
    ai.*
  FROM
    assessments AS a
    JOIN assessment_instances AS ai ON (ai.assessment_id = a.id)
  WHERE
    a.id = 45
    AND ai.deleted_at IS NULL;
  ```

- ما (تقریباً) هرگز داده‌های دانشجویان را از پایگاه داده حذف نمی‌کنیم. برای جلوگیری از وجود ردیف‌هایی با کلیدهای خارجی شکسته یا مفقود، جداول پیکربندی درس (مانند `assessments`) در عمل حذف فیزیکی نمی‌شوند؛ بلکه با تنظیم ستون `deleted_at` روی مقداری غیر از NULL به صورت "نرم" حذف (soft-deleted) می‌شوند. این بدان معناست که هنگام استفاده از هر جدولی که از حذف نرم پشتیبانی می‌کند، باید شرط `WHERE deleted_at IS NULL` را قرار دهیم تا تنها ردیف‌های فعال دریافت شوند.

## اصلاح اسکیمای پایگاه داده

به [مستندات مایگریشن‌ها](./migrations/README.md) مراجعه کنید.

## دسترسی به پایگاه داده

- دسترسی به پایگاه داده از طریق پکیج `@prairielearn/postgres` انجام می‌شود که پوششی (wrapper) روی کتابخانه [node-postgres](https://github.com/brianc/node-postgres) است.

- برای کوئری‌های تکی، معمولاً از الگوی زیر استفاده می‌کنیم که به طور خودکار از ادغام اتصالات (connection pooling) کتابخانه node-postgres و درونیابی امن متغیرها با پارامترهای نام‌گذاری شده و [دستورات آماده (prepared statements)](https://github.com/brianc/node-postgres/wiki/Parameterized-queries-and-Prepared-Statements) بهره می‌برد:

  ```javascript
  const questions = await queryRows(
    sql.select_questions_by_course,
    { course_id: 45 },
    QuestionSchema,
  );
  ```

که در آن فایل متناظر `filename.sql` حاوی موارد زیر است:

```sql
-- BLOCK select_questions_by_course
SELECT
  *
FROM
  questions
WHERE
  course_id = $course_id;
```

- برای کوئری‌هایی که در آن‌ها عدم بازگشت دقیقاً یک ردیف نتیجه به عنوان خطا در نظر گرفته می‌شود:

  ```javascript
  const question = await queryRow(sql.block_name, QuestionSchema);
  ```

- هر زمان که داده‌های دانشجویی مربوط به یک ارزیابی را تغییر می‌دهید، از قفل‌گذاری صریح ردیف (explicit row locking) استفاده کنید. این کار حتماً باید درون یک تراکنش (transaction) انجام شود. قاعده کلی این است که ما یا گونه (variant) را قفل می‌کنیم (اگر نمونه ارزیابی متناظری وجود نداشته باشد) یا نمونه ارزیابی (assessment instance) را (اگر داشته باشیم). قفل‌گذاری مکرر یک ردیف در طول یک تراکنش بلامانع است؛ بنابراین تمام توابعی که در اصلاح المان‌های یک ارزیابی دخالت دارند (مانند افزودن پاسخ ارسالی، نمره‌دهی و غیره) باید در بدو شروع یک تابع قفل‌گذاری را فراخوانی کنند. قفل‌گذاری را می‌توان با کوئری مانند زیر انجام داد:

```sql
SELECT
  *
FROM
  assessment_instances
WHERE
  id = $assessment_instance_id
FOR NO KEY UPDATE;
```

- برای ارسال آرایه‌ای از پارامترها به کد SQL، از الگوی زیر استفاده کنید که امکان ارسال صفر یا چند المان در آرایه را فراهم می‌سازد. این کار `$points_list` را در SQL با `ARRAY[10, 5, 1]` جایگزین می‌کند. تعیین نوع آرایه برای حالتی که خالی باشد الزامی است:

  ```javascript
  await sqldb.execute(sql.insert_assessment_question, {
    points_list: [10, 5, 1],
  });
  ```

  ```sql
  -- BLOCK insert_assessment_question
  INSERT INTO
    assessment_questions (points_list)
  VALUES
    ($points_list::INTEGER[]);
  ```

- برای استفاده از یک آرایه جاوااسکریپت جهت تست عضویت در SQL، از `= ANY ($array)` (یا حالت منفی آن `!= ALL ($array)`) به صورت زیر استفاده کنید:

  ```javascript
  const questions = await sqldb.queryRows(
    sql.select_questions,
    { id_list: [7, 12, 45] },
    QuestionSchema,
  );
  ```

  ```sql
  -- BLOCK select_questions
  SELECT
    *
  FROM
    questions
  WHERE
    id = ANY ($id_list::BIGINT[]);
  ```

- برای ارسال حجم زیادی از داده به SQL، یک الگوی مفید ارسال آرایه‌ای از اشیاء JSON و باز کردن (unpack) آن در SQL به معادل یک جدول است. این الگویی است که توسط کدهای "همگام‌سازی" (sync) استفاده می‌شود، مانند [sprocs/sync_questions.sql](https://github.com/PrairieLearn/PrairieLearn/blob/master/apps/prairielearn/src/sprocs/sync_questions.sql). برای مثال:

  ```javascript
  let data = [
    { a: 5, b: 'foo' },
    { a: 9, b: 'bar' },
  ];
  await sqldb.execute(sql.insert_data, {
    data: JSON.stringify(data),
  });
  ```

  ```sql
  -- BLOCK insert_data
  INSERT INTO
    my_table (a, b)
  SELECT
    *
  FROM
    jsonb_to_recordset($data) AS (a INTEGER, b TEXT);
  ```

- برای استفاده از یک آرایه اشیاء JSON به شیوه بالا در حالتی که ترتیب ردیف‌ها اهمیت دارد، از `ROWS FROM () WITH ORDINALITY` برای تولید اندیس ردیف‌ها به شکل زیر استفاده کنید:

  ```sql
  -- BLOCK insert_data
  INSERT INTO
    my_table (a, b, order_by)
  SELECT
    *
  FROM
    ROWS
  FROM
    (jsonb_to_recordset($data) AS (a INTEGER, b TEXT)) WITH ORDINALITY AS data (a, b, order_by);
  ```

## جریان کنترل ناهمگام در جاوااسکریپت

- کدهای جدید در PrairieLearn تا جای ممکن باید از `async`/`await` استفاده کنند.

- از [کتابخانه async](http://caolan.github.io/async/) برای جریان‌های کنترل پیچیده یا در زمان ترکیب کدهای مبتنی بر Promise و مبتنی بر Callback استفاده کنید.

## استفاده از کنترل‌کننده‌های مسیر ناهمگام با ExpressJS

- فریم‌ورک Express نمی‌تواند به طور مستقیم از هندلرهای مسیر ناهمگام (async) استفاده کند. در عوض، ما از [express-async-handler](https://www.npmjs.com/package/express-async-handler) به شکل زیر استفاده می‌کنیم:

  ```javascript
  import asyncHandler from 'express-async-handler';
  router.get(
    '/',
    asyncHandler(async (req, res, next) => {
      // can use "await" here
    }),
  );
  ```

## مدل امنیتی

- ما بین [احراز هویت (Authentication) و اعطای مجوز (Authorization)](https://en.wikipedia.org/wiki/Authentication#Authorization) تمایز قائل می‌شویم. احراز هویت به عنوان اولین مرحله در پاسخ سرور انجام می‌شود و داده‌های کاربر احراز هویت شده به صورت `res.locals.authn_user` ذخیره می‌گردند.

- جریان احراز هویت به صورت زیر است:
  1. ابتدا به یک سرویس احراز هویت راه دور (مانند SAML SSO، Google، Microsoft) تغییر مسیر می‌دهیم (redirect).

  2. سرویس احراز هویت راه دور کاربر را به یک URL فراخوانی بازگشتی (callback URL)، مثلاً `/pl/oauth2callback` برای گوگل بازمی‌گرداند. این نقاط انتهایی (endpoints) احراز هویت را تأیید کرده، در صورت نیاز کاربر را در جدول `users` ایجاد می‌کنند، یک کوکی امضاشده `pl_authn` با شناسه احراز هویت شده `user_id` در مرورگر تنظیم می‌نمایند و سپس به صفحه اصلی PL ریدایرکت می‌کنند. این کوکی با ویژگی `HttpOnly` تنظیم می‌شود که مانع از خواندن آن توسط جاوااسکریپت سمت کلاینت می‌گردد.

  3. هر صفحه دیگری با استفاده از این کوکی امضاشده `pl_authn` در مرورگر احراز هویت می‌شود. این کوکی توسط [`middlewares/authn.ts`](https://github.com/PrairieLearn/PrairieLearn/blob/master/apps/prairielearn/src/middlewares/authn.ts) خوانده می‌شود که امضا را بررسی کرده و سپس داده‌های کاربر را با استفاده از `user_id` از دیتابیس بارگذاری می‌کند و آن را به عنوان `res.locals.authn_user` ذخیره می‌نماید.

- مشابه یونیکس، ما بین کاربر واقعی (real user) و کاربر مؤثر (effective user) تمایز قائل می‌شویم. کاربر واقعی در `res.locals.authn_user` ذخیره می‌شود و کاربری است که هویتش تأیید شده است. کاربر مؤثر در `res.locals.user` ذخیره می‌شود. تنها کاربرانی با نقش دستیار آموزشی (`role = TA`) یا بالاتر می‌توانند کاربر مؤثری متفاوت از کاربر واقعی خود تنظیم کنند. علاوه بر این، کاربران با `role = TA` یا بالاتر می‌توانند `role` و `mode` مؤثری متفاوت از مقادیر واقعی نیز مشخص نمایند.

- اعطای مجوز (Authorization) در سطوح متعددی رخ می‌دهد:
  - دوره درس (`course_instance`) مجوز را بر اساس `authn_user` بررسی می‌کند.

  - مجوز دوره درس (`course_instance`) در برابر `user` مؤثر بررسی می‌شود.

  - ارزیابی (`assessment`) مجوز را بر اساس `user`، `role`، `mode` و `date` مؤثر بررسی می‌کند.

- تمام درخواست‌هایی که وضعیت را تغییر می‌دهند (state-modifying) معمولاً باید از نوع POST باشند و همه داده‌های مرتبط باید درون بدنه (body) قرار گیرند. درخواست‌های GET ممکن است صرفاً برای گزینه‌های مشاهده (viewing options) از پارامترهای کوئری استفاده کنند.

## بررسی سطوح دسترسی

تقریباً تمامی صفحات با داده‌های پایگاه داده سر و کار دارند، بنابراین درک نحوه تعامل امن با پایگاه داده و انجام صحیح بررسی‌های سطح دسترسی بسیار حائز اهمیت است.

### سلسله‌مراتب نقش‌ها

چهار نوع نقش بدون هم‌پوشانی وجود دارد: "نقش‌های سیستمی" (System roles)، "نقش‌های دوره درس دانشجو" (Student course instance roles)، "نقش‌های دوره درس مدرس" (Instructor course instance roles)، و "نقش‌های درس" (Course roles). داشتن نقشی بالاتر در این سلسله‌مراتب به معنای دارا بودن تمام مجوزهای نقش‌های پایین‌تر از آن است — اما به معنی داشتن مجوزهای موجود در ستون‌های دیگر نیست.

![سلسله‌مراتب نقش‌ها](./role-hierarchy.png)

### تعامل امن با پایگاه داده

!!! note

    این الگو در حال حاضر به عنوان یک بازآفرینی (refactor) تدریجی کدهای موجود بر اساس مدل‌به‌مدل در حال اجرا است.

برای اکثر هندلرهای API/POST، ما می‌خواهیم داده‌ها را بر اساس پارامترهای کوئری یا فیلدهای بدنه درخواست که اعتبارسنجی نشده‌اند، جستجو یا ویرایش کنیم. فراموش کردن اعتبارسنجی این فیلدها با سطوح مجوز صحیح بسیار آسان رخ می‌دهد. بررسی‌های نقش اختصاصی مسیر معمولاً باید در میدلور یا در خود هندلر قرار داشته باشند؛ توابع مدل (model functions) باید بر بررسی مالکیت و تعلق رکورد تمرکز کنند. برای کمک به این امر، ما دو بررسی وضع کرده‌ایم:

1. توابع مدل باید اشیاء کامل و تایپ‌شده ردیف (full, typed row objects) را به عنوان پارامتر بپذیرند. در اختیار داشتن این شیء نشان می‌دهد که فراخواننده مجاز به خواندن رکورد است. به عنوان مثال، به‌روزرسانی وضعیت ثبت‌نام (enrollment status) باید فراخواننده را ملزم کند که شیء کامل ردیف ثبت‌نام را ارسال کند. ما می‌خواهیم به‌روزرسانی وضعیت ثبت‌نام صرفاً با استفاده از یک شناسه ثبت‌نام (مثلاً با ارسال یک درخواست POST به `/api/enrollments/<enrollment_id>/status` و انجام یک به‌روزرسانی اعتبارسنجی‌نشده با `req.params.enrollment_id`) دشوار باشد.

2. توابع مدلی که نسبت به مالکیت حساس هستند باید فراخواننده را ملزم کنند بافتار (context) لازم برای اثبات مالکیت یا تعلق رکورد را ارسال کند. در مثال زیر، تابع `selectEnrollment` از فراخواننده می‌خواهد پارامترهای `courseInstance` و `authzData` را ارسال نماید تا بتواند اطمینان حاصل کند که ثبت‌نام متعلق به کاربر است و در دوره درس صحیح قرار دارد.

```typescript
const enrollment = await selectEnrollment({
  id: enrollment_id,
  // This serves to require the caller to be aware of the role they want to authorize as.
  // We want to require the user to have at least the Student Data Viewer role.
  requiredRole: ['Student Data Viewer'],
  // Information to prove we are authorized to read the record.
  // E.g. we need to prove that we have access to the course instance it's in,
  // and that we have the correct permissions to read the enrollment record.
  courseInstance,
  authzData: res.locals.authz_data,
});
```

![نقش واحد](./single-role-example.png)

!!! note "نمونه تابع مدل"

    این یک نمونه تابع مدل است که الگوی مورد نظر را از مسیر `src/models/enrollment.ts` نشان می‌دهد.

    ```typescript
    export async function selectEnrollmentById({
      // The ID of the enrollment to look up. This ID is unvalidated and comes from the request body.
      id,
      // The course instance from res.locals
      courseInstance,
      requiredRole,
      // The authorization data from res.locals
      authzData,
    }: {
      id: string;
      courseInstance: CourseInstanceContext;
      // The type of `requiredRole` is used to restrict the set of roles that can call this function.
      requiredRole: ('Student' | 'Student Data Viewer' | 'Student Data Editor')[];
      authzData: AuthzData;
    }) {
      assertHasRole(authzData, requiredRole);
      const enrollment = await queryRow(sql.select_enrollment_by_id, { id }, EnrollmentSchema);
      assertEnrollmentInCourseInstance(enrollment, courseInstance);
      if (requiredRole === 'Student') {
        assertEnrollmentBelongsToUser(enrollment, authzData);
      }
      return enrollment;
    }
    ```

در مثال بالا، تابع `selectEnrollment` فراخواننده را ملزم می‌کند تا پارامترهای `courseInstance` و `authzData` را ارسال کند تا بتواند تأیید کند که ثبت‌نام متعلق به کاربر بوده و در دوره درس صحیح قرار دارد. اگر فراخواننده مجاز به دسترسی به ثبت‌نام نباشد، خطایی صادر خواهد شد (یا اگر تابع `selectOptionalEnrollment` باشد، مقدار null برمی‌گرداند). این موضوع همچنین فراخواننده را وادار می‌کند تا دسترسی خود به دوره درس را جهت خواندن رکورد ثبت‌نام اثبات نماید.

این رویکرد بسیار مناسب است، زیرا برای انجام یک به‌روزرسانی باید یک شیء ردیف کامل را ارسال کنید و بدنه درخواست اطلاعات کافی برای این منظور نخواهد داشت. توابع مدلی که ردیف‌ها را واکشی می‌کنند، فراخواننده را ملزم به ارائه اطلاعات لازم جهت انجام صحیح بررسی‌های مجوز می‌نمایند.

پس از اینکه شیء ردیف کامل را به دست آوردید، اثبات کرده‌اید که فراخواننده مجاز به _خواندن_ رکورد است. همچنین باید تأیید کنید که فراخواننده مجاز به _نوشتن_ روی رکورد نیز هست. در مثال زیر، ما `requiredRole` را روی `['Student']` تنظیم می‌کنیم، بنابراین فراخواننده برای به‌روزرسانی وضعیت ثبت‌نام حتماً باید دانشجو باشد.

```typescript
await updateEnrollmentStatus({
  enrollment: myEnrollment,
  status: 'joined',
  // What role are we requiring the user to have?
  requiredRole: ['Student'],
  // The user's authorization data, needed to prove we are authorized to write the record
  authzData: res.locals.authz_data,
});
```

در این مثال، مدرسان مجاز نیستند به جای دانشجو به یک دوره درس بپیوندند. تابع مدل متوجه می‌شود که پارامتر `requiredRole` برابر `['Student']` است، اما کاربر فعلی مدرس است، بنابراین یک خطا ایجاد خواهد کرد.

### دور زدن بررسی‌های مجوز

در برخی موارد، ممکن است به `authzData` دسترسی نداشته باشید؛ مثلاً اگر داده‌ها را از یک صف (queue) دریافت می‌کنید یا در عمق کدهای داخلی سیستم قرار دارید. در این حالت، می‌توانید از تابع `dangerousFullSystemAuthz` برای ساخت یک شیء صوری `authzData` استفاده کنید که به شما امکان می‌دهد عملیات را با دسترسی سیستم اجرا نمایید. از این تابع باید با احتیاط فراوان و به ندرت استفاده شود.

```typescript
await updateEnrollmentStatus({
  enrollment: myEnrollment,
  status: 'joined',
  // We are requiring the user to have the System role, any non-System role will throw an error.
  requiredRole: ['System'],
  authzData: dangerousFullSystemAuthz(),
});
```

### نقش‌های چندگانه

در برخی موارد، ممکن است بخواهید به کاربر اجازه دهید در صورت داشتن هر یک از نقش‌های مورد نیاز، عملیات را انجام دهد. به عنوان مثال، اگر در حال به‌روزرسانی وضعیت ثبت‌نام هستید، ممکن است بخواهید به کاربر اجازه دهید در صورت داشتن نقش `Viewer` عملیات را انجام دهد، اما همچنین بخواهید در صورت داشتن نقش `Student Data Viewer` نیز قادر به انجام آن باشد. این یک الگوی متداول است که هنگام انجام عملیاتی در بافتار یک دوره درس، بررسی می‌کنید آیا کاربر در درس نقش `Previewer` دارد یا در دوره درس نقش `Student Data Viewer`.

```typescript
await updateEnrollmentStatus({
  enrollment: myEnrollment,
  status: 'joined',
  requiredRole: ['Viewer', 'Student Data Viewer'],
});
```

![نقش‌های چندگانه](./multiple-role-example.png)

### استثناهای این الگو

توابع مدل برای دوره‌های درس و خود درس‌ها یک استثنای بارز در این الگو محسوب می‌شوند.

تنها راه برای به دست آوردن شیء ردیف کامل برای یک دوره درس یا درس معمولاً از طریق `res.locals.authz_data` است.

بنابراین، توابع `select*` احراز هویت شده نیستند. استفاده از این توابع در اکثر موارد یک هشدار جدی (red flag) تلقی می‌شود، زیرا شما باید بتوانید اطلاعات لازم را از `res.locals.authz_data` برای انجام عملیات بردارید.

از طرف دیگر، اگر می‌خواهید بررسی کنید که آیا _احتمالاً_ مجاز به انجام یک عمل هستید یا خیر، می‌توانید از `buildAuthzData` همراه با شناسه درس/دوره استفاده کنید تا شیء `authzData` را دریافت کرده و از آن برای عملیات تغییر داده بهره بگیرید.

## درخواست‌های POST تغییر‌دهنده وضعیت

??? note

    این بخش قدیمی شده است. اکنون ترجیح داده می‌شود موارد زیر انجام شوند:

    1. استفاده از یک اسکیمای Zod برای اعتبارسنجی بدنه درخواست.
    2. فراخوانی توابع مدل به جای اجرای مستقیم SQL (به موارد بالا مراجعه شود).

- از الگوی [Post/Redirect/Get](https://en.wikipedia.org/wiki/Post/Redirect/Get) برای تمامی تغییرات وضعیت استفاده کنید. این بدان معناست که درخواست اولیه GET باید صفحه را به همراه یک `<form>` بدون مقدار `action` رندر کند تا فرم دوباره به همان صفحه جاری سابمیت شود. این حالت باید توسط یک هندلر POST پردازش شود که تغییر وضعیت را اعمال کرده و سپس یک تغییر مسیر (redirect) به همان صفحه به صورت یک درخواست GET صادر می‌کند:

  ```javascript
  router.post(
    '/',
    asyncHandler(async (req, res) => {
      if (req.body.__action == 'enroll') {
        await execute(sql.enroll, {
          course_instance_id: req.body.course_instance_id,
          user_id: res.locals.authn_user.id,
        });
        res.redirect(req.originalUrl);
      } else {
        throw new error.HttpStatusError(400, `unknown __action: ${req.body.__action}`);
      }
    }),
  );
  ```

- برای خنثی‌سازی حملات [CSRF (جعل درخواست بین‌سایتی)](https://en.wikipedia.org/wiki/Cross-site_request_forgery) ما از [الگوی توکن رمزنگاری‌شده (Encrypted Token Pattern)](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html) استفاده می‌کنیم. این الگو یک [توکن احراز هویت‌شده با HMAC](https://en.wikipedia.org/wiki/Hash-based_message_authentication_code) را درون داده‌های POST ذخیره می‌کند.

- تمام درخواست‌های تغییر‌دهنده داده باید از المان‌های `form` مانند زیر ارسال شوند:

  ```html
  <form name="enroll-form" method="POST">
    <input type="hidden" name="__action" value="enroll" />
    <input type="hidden" name="__csrf_token" value="${__csrf_token}" />
    <input type="hidden" name="course_instance_id" value="56" />
    <button type="submit" class="btn btn-info">Enroll in course instance 56</button>
  </form>
  ```

- متغیر `res.locals.__csrf_token` توسط میدلورهای مراحل اولیه تنظیم و بررسی می‌شود، بنابراین هیچ اقدام صریحی در هر صفحه لازم نیست.

## ثبت لاگ خطاها

- ما از [Winston](https://github.com/winstonjs/winston) برای ثبت لاگ در کنسول و فایل‌ها استفاده می‌کنیم:

  ```javascript
  import { logger } from '@prairielearn/logger';

  logger.info('This is an info message');
  logger.error('This is an error message');

  // This will be logged to the log file, but not to the console:
  logger.verbose('This is a verbose message');
  ```

- تمامی توابع `logger` دارای یک آرگومان اول اجباری از نوع رشته (string) و یک آرگومان دوم اختیاری هستند که شیئی حاوی اطلاعات مفید است. مهم است که همیشه یک رشته به عنوان آرگومان اول ارائه شود.

## نسخه‌های TypeScript

فرایندهای ساخت (Builds) و بررسی نوع (type checks) از TypeScript 7 از طریق `pnpm tsc` استفاده می‌کنند. وابستگی `@typescript/native` یک نام مستعار npm (alias) برای بسته رسمی `typescript` است.

ابزار ESLint و سایر ابزارهایی که از کامپایلر API تایپ‌اسکریپت استفاده می‌کنند، همچنان به TypeScript 6 نیاز دارند. وابستگی `typescript` یک نام مستعار برای `@typescript/typescript6` است که دستور `import ... from 'typescript'` را حفظ کرده و دستور `pnpm tsc6` را برای جریان‌های کاری نیازمند به کامپایلر قدیمی‌تر فراهم می‌سازد. هنگام به‌روزرسانی TypeScript این نام مستعار را حفظ کنید؛ جایگزینی آن با TypeScript 7 سازگاری مصرف‌کنندگان API را می‌شکند. برای پیکربندی هم‌زمان (side-by-side) به [یادداشت‌های انتشار TypeScript 7](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/#running-side-by-side-with-typescript-6.0) مراجعه کنید.

## شیوه‌نامه کدنویسی

از [Oxlint](https://oxc.rs/docs/guide/usage/linter) و [ESLint](https://eslint.org/) (برای فایل‌های HTML و یک قاعده آگاه از نوع) جهت اعمال قراردادهای یکپارچه کد، و از [Oxfmt](https://oxc.rs/docs/guide/usage/formatter) و [Prettier](https://prettier.io/) (برای SQL و اسکریپت‌های شل) برای قالب‌بندی (formatting) استفاده می‌شود. برای مشاهده پیکربندی خاص ما، به فایل‌های `oxlint.config.mts`، `eslint.config.mjs`، `.oxfmtrc.json` و `.prettierrc.json` در ریشه مخزن PrairieLearn و قواعد مشترک در `packages/oxlint-config` مراجعه کنید. این مخزن حاوی یک فایل [`.editorconfig`](https://editorconfig.org/) است که بیشتر ویرایشگرها آن را شناسایی کرده و برای پیکربندی خودکار مواردی مانند تورفتگی (indentation) به کار می‌برند. اگر ویرایشگر شما به صورت پیش‌فرض از فایل EditorConfig پشتیبانی نمی‌کند، [پلاگین‌هایی](https://editorconfig.org/#download) برای اکثر ویرایشگرهای دیگر در دسترس هستند.

برای فایل‌های پایتون، از [ruff](https://docs.astral.sh/ruff/) جهت قالب‌بندی خودکار و اعمال قراردادهای کدنویسی، و از [Pyright](https://github.com/microsoft/pyright) برای بررسی ایستا نوع (static typechecking) استفاده می‌شود. برای مشاهده پیکربندی ما به `pyproject.toml` در ریشه مخزن PrairieLearn مراجعه کنید. ما توصیه می‌کنیم تمام کدهای جدید پایتون شامل راهنماهای نوع (type hints) باشند تا با بررسی‌کننده ایستای نوع استفاده شوند، زیرا این کار خواندن، بازبینی و راستی‌آزمایی مشارکت‌ها را آسان‌تر می‌کند.

برای لینت کردن کد، از دستور `make lint` استفاده کنید. این کار توسط تست‌های CI نیز اجرا می‌شود.

برای رفع خودکار خطاهای لینت و قالب‌بندی، دستور `make format` را اجرا نمایید.

برای قالب‌بندی تمام فایل‌های تغییر‌یافته (staged + unstaged + untracked) در مقایسه با HEAD، دستور `make format-changed` را اجرا کنید. این کار سریع‌تر از قالب‌بندی کل پایگاه کد است.

## جریان کنترل رندر سوال

- فایل‌های هسته‌ای درگیر در رندر سوال عبارتند از [lib/question-render.ts](https://github.com/PrairieLearn/PrairieLearn/blob/master/apps/prairielearn/src/lib/question-render.ts)، [lib/question-render.sql](https://github.com/PrairieLearn/PrairieLearn/blob/master/apps/prairielearn/src/lib/question-render.sql)، و [components/QuestionContainer.tsx](https://github.com/PrairieLearn/PrairieLearn/blob/master/apps/prairielearn/src/components/QuestionContainer.tsx).

- فایل‌های فوق همگی توسط هر یک از صفحات سطح بالا که نیاز به رندر سوال دارند (مانند `pages/instructorQuestionPreview`، `pages/studentInstanceQuestion` و غیره) فراخوانی/گنجانده می‌شوند. متأسفانه جریان کنترل پیچیده است زیرا ما باید `lib/question-render.ts` را در هنگام بارگذاری داده‌های صفحه فراخوانی کنیم، داده‌های تولیدشده را ذخیره نماییم و سپس بعداً قالب `components/QuestionContainer.html.ts` را برای رندر واقعی این داده‌ها اضافه کنیم.

- برای نمونه، جریان دقیق کنترل برای `pages/instructorQuestion` به این صورت است:
  1. کد صفحه سطح بالای `pages/instructorQuestion/instructorQuestion.js` تابع `lib/question-render.getAndRenderVariant()` را فراخوانی می‌کند.

  2. تابع `getAndRenderVariant()` داده‌ها را در `res.locals` برای استفاده‌های بعدی توسط `components/QuestionContainer.html.ts` قرار می‌دهد.

  3. کد صفحه سطح بالا قالب سطح بالای `pages/instructorQuestion/instructorQuestion.html.ts` را رندر می‌کند که سپس `components/QuestionContainer.html.ts` را در بر می‌گیرد.

  4. قالب `components/QuestionContainer.html.ts` داده‌هایی را که قبلاً توسط `lib/question-render.ts` تولید شده بودند رندر می‌کند.

## وضعیت باز بودن سوال

- وضعیت "باز بودن" (open) در سه سطح مطابق جدول زیر ردیابی می‌شود. اگر مقدار `open = false` برای هر شیئی باشد، مانع از ایجاد اشیاء جدید زیرمجموعه آن خواهد شد. به عنوان مثال، برای ایجاد یک پاسخ ارسالی (submission) جدید، گونه (variant)، سوال نمونه (instance_question) و نمونه ارزیابی (assessment_instance) متناظر همگی باید باز باشند.

  | متغیر | امکان ایجاد `instance_questions` جدید | امکان ایجاد `variants` جدید | امکان ایجاد `submissions` جدید |
  | -------------------------- | ------------------------------ | -------------------- | ----------------------- |
  | `assessment_instance.open` | ✓                              | ✓                    | ✓                       |
  | `instance_question.open`   |                                | ✓                    | ✓                       |
  | `variant.open`             |                                |                      | ✓                       |

## خطاها در مدیریت سوال

- ما بین دو نوع مختلف از خطاهای دانشجو تمایز قائل می‌شویم:
  1. پاسخ ممکن است قابل نمره‌دهی نباشد (`submission.gradable = false`). این حالت می‌تواند به دلیل پاسخ خالی، فرمت نامعتبر (مثلاً وارد کردن رشته در ورودی عددی) یا پاسخی باشد که یک بررسی پایه‌ای را پشت سر نمی‌گذارد (مثلاً ارسال کدی که کامپایل نمی‌شود). این موضوع می‌تواند در طول فاز تجزیه (parsing) یا فاز نمره‌دهی (grading) کشف شود. در چنین شرایطی شیء `submission.format_errors` باید اطلاعاتی را درباره ایراد کار ذخیره کند تا دانشجو بتواند پاسخ خود را تصحیح نماید. پاسخ ارسالی با `gradable = false` باعث هیچ‌گونه به‌روزرسانی نمره برای سوال نمی‌شود؛ به این معنا که مانند یک پاسخ ارسالی ذخیره‌شده-اما-نمره‌داده‌نشده عمل می‌کند، بدین صورت که ثبت شده اما اثری بر سوال ندارد. اگر `gradable = false` باشد، `score` و `feedback` به دانشجو نمایش داده نخواهند شد.

  2. پاسخ ممکن است قابل نمره‌دهی اما نادرست باشد. در این حالت `submission.gradable = true` اما `submission.score = 0` (یا کمتر از ۱ برای نمره جزئی) است. در صورت تمایل، شیء `submission.feedback` می‌تواند تنظیم شود تا اطلاعاتی را در مورد اشکال پاسخ به دانشجو ارائه دهد. با این حال، این امر ضروری نیست. اگر `submission.feedback` تنظیم شده باشد، به محض نمره‌دهی سوال به همراه `submission.score` به دانشجو نمایش داده خواهد شد.

- سه سطح خطا وجود دارد که ممکن است در طول فرآیند ایجاد، پاسخ‌گویی و نمره‌دهی یک سوال رخ دهد:

  | سطح خطا | علت | محل ذخیره | نحوه گزارش | اثر |
  | --------------- | ---------------------------------------------------------------- | ----------------------------------------------------------------------------------------- | ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | خطاهای سیستمی (System errors) | خطاهای داخلی PrairieLearn | لاگ‌های روی دیسک (On-disk logs) | صفحه خطا | عملیات مسدود می‌شود. داده‌ها در پایگاه داده ذخیره نمی‌شوند. |
  | خطاهای سوال (Question errors) | خطا در کد سوال | جدول `issues` | پنل‌های Issue در صفحه سوال | `variant.broken_at != null` یا `submission.broken == true`. عملیات به پایان می‌رسد، اما عملیات بعدی مسدود می‌شوند. |
  | خطاهای دانشجو (Student errors) | ارسال داده‌های نامعتبر توسط دانشجو (غیرقابل تجزیه یا غیرقابل نمره‌دهی) | `submission.gradable` روی `false` تنظیم شده و جزئیات در `submission.format_errors` ذخیره می‌شود | درون پنل رندرشده پاسخ ارسالی | به پاسخ ارسالی نمره‌ای اختصاص داده نمی‌شود و اقدام دیگری صورت نمی‌گیرد (مثلاً نمرات سوال نمونه تغییر نمی‌کند). دانشجو می‌تواند برای اصلاح خطا مجدداً ارسال کند. |

- متغیرهای مهم دخیل در ردیابی خطاهای سوال عبارتند از:

  | متغیر | سطح خطا | توضیحات |
  | -------------------------- | -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
  | `variant.broken_at` | خطای سوال | اگر در هنگام تولید گونه (variant) خطایی در کد سوال رخ داده باشد، روی `NOW()` تنظیم می‌شود. برای چنین گونه‌ای توابع `render()` فراخوانی نخواهند شد، بلکه پیام `This question is broken` نمایش داده می‌شود. |
  | `submission.broken` | خطای سوال | اگر در هنگام تجزیه (parsing) یا نمره‌دهی (grading) گونه خطایی در کد سوال رخ دهد، روی `true` تنظیم می‌شود. پس از `true` شدن `submission.broken`، هیچ اقدام دیگری در رابطه با این پاسخ ارسالی انجام نخواهد شد. |
  | جدول `issues` | خطای سوال | ردیف‌هایی اضافه می‌شوند تا جزئیات خطاهایی را که باعث شدند `variant.broken != null` یا `submission.broken == true` روی `true` تنظیم شوند، ثبت کنند. |
  | `submission.gradable` | خطای دانشجو | مشخص می‌کند که آیا می‌توان به این پاسخ ارسالی نمره‌ای اختصاص داد یا خیر. اگر خطاهای فرمت در `submitted_answer` در حین تجزیه یا نمره‌دهی مشاهده شود، روی `false` تنظیم می‌شود. |
  | `submission.format_errors` | خطای دانشجو | جزئیات هرگونه خطا در طول تجزیه یا نمره‌دهی. اگر `gradable = false` باشد، باید روی مقداری معنادار تنظیم شود تا توضیح دهد چه ایرادی در پاسخ ارسالی وجود داشته است. |
  | `submission.graded_at` | هیچ‌کدام | اگر هنوز نمره‌دهی انجام نشده باشد برابر NULL است، در غیر این صورت یک برچسب زمانی (timestamp) خواهد بود. |
  | `submission.score` | هیچ‌کدام | نمره نهایی برای پاسخ ارسالی. تنها در صورتی استفاده می‌شود که `gradable = true` بوده و `graded_at` برابر NULL نباشد. |
  | `submission.feedback` | هیچ‌کدام | بازخورد تولیدشده در طول نمره‌دهی. تنها در صورتی استفاده می‌شود که `gradable = true` بوده و `graded_at` برابر NULL نباشد. |

- توجه داشته باشید که `submission.format_errors` اطلاعات مربوط به خطاهای دانشجو را ذخیره می‌کند، در حالی که جدول `issues` اطلاعات خطاهای کد سوال را ثبت می‌نماید.

- چرخه حیات و جریان سوال در نمودار زیر نشان داده شده است:

![فلوچارت چرخه حیات سوال](./question-flow.d2)

## اعتبارسنجی‌ها و بررسی‌ها (Assertions)

بسته به بافتار و زمینه استفاده، ما از انواع مختلفی از اعتبارسنجی‌ها (assertions) استفاده می‌کنیم:

- در تست‌ها، از توابع کمکی خروجی‌گرفته‌شده از `vitest` مانند `assert.ok` یا `assert.isDefined` استفاده می‌کنیم.
- در کدهای سمت سرور، برای اعمال ناورداها (invariants - مواردی که هرگز نباید رخ دهند)، از `assert` مربوط به `node:assert` استفاده می‌کنیم.
- برای اعتبارسنجی نتایج در سمت کلاینت، یا در توابع کمکی (مانند `.querySelector`، `.pop` و غیره)، استفاده از عملگر `!` را در نظر بگیرید تا مشخص شود که یک مقدار `null` یا `undefined` نیست.

## عملگر برابری در جاوااسکریپت

شما تقریباً همیشه باید از عملگر `===` برای مقایسه‌ها استفاده کنید؛ این مورد توسط یک قانون oxlint الزامی شده است.

تنها موردی که عملگر `==` در آن مکرراً مفید واقع می‌شود، مقایسه شناسه‌های موجودیت‌ها (entity IDs) است که ممکن است از کلاینت/پایگاه داده و غیره آمده باشند. این مقادیر بسته به منبع یا نحوه واکشی ممکن است رشته یا عدد باشند. برای اینکه کاملاً مشخص و شفاف باشد شناسه‌ها در حال مقایسه هستند، باید از تابع کمکی `idsEqual` استفاده نمایید:

```js
import { idsEqual } from './lib/id';

console.log(idsEqual(12345, '12345'));
// > true
```

کوئری‌های "مدرن" که از اعتبارسنجی Zod استفاده می‌کنند، به طور خودکار تمام شناسه‌ها را به رشته تبدیل (coerce) می‌کنند. اگر مطمئن هستید که داده‌ها در هر دو طرف مقایسه از یک کوئری اعتبارسنجی‌شده با Zod می‌آیند، می‌توانید مستقیماً از عملگر `===` استفاده کنید.
