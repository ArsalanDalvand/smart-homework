# اجرای مستقیم (Native)

این صفحه روش نصب و اجرای پِری‌لرن (PrairieLearn) را به‌صورت کاملاً مستقیم (Native) و بدون استفاده از Docker شرح می‌دهد. برخی از ویژگی‌ها، مانند نمره‌دهنده‌های خارجی و محیط‌های کاری، همچنان به Docker نیاز دارند. پِری‌لرن از اجرای مستقیم در macOS، Linux و Windows درون [WSL 2](https://learn.microsoft.com/en-us/windows/wsl/install) پشتیبانی می‌کند.

## نصب

- پیش‌نیازها را نصب کنید:
  - [Git](https://git-scm.com)
  - [Node.js 24](https://nodejs.org)
  - [نسخه 12.17 یا جدیدتر از سری 12.x از pnpm](https://pnpm.io)
  - [uv](https://docs.astral.sh/uv/) (مدیر نسخه و ابزار نصب پکیج‌های پایتون)
  - [PostgreSQL 17](https://www.postgresql.org)
  - [Redis 7](https://redis.io) یا [Valkey](https://valkey.io)
  - [Graphviz](https://graphviz.org)
  - [d2](https://d2lang.com)
  - [pgvector](https://github.com/pgvector/pgvector)

اکثر این پیش‌نیازها را می‌توان با استفاده از پکیج‌منیجر (Package Manager) سیستم‌عامل خود نصب کرد:

=== "Ubuntu (شامل WSL2)"

    در اوبونتو، از `apt` برای پیش‌نیازهای اصلی استفاده کنید:

    ```sh
    sudo apt update
    sudo apt install git gcc g++ make libc6-dev graphviz libgraphviz-dev redis postgresql-common
    # پیکربندی مخزن Postgres
    sudo /usr/share/postgresql-common/pgdg/apt.postgresql.org.sh
    sudo apt install postgresql-17 postgresql-17-pgvector
    # اختیاری؛ تنها برای برخی از سوالات نمونه که از LaTeX استفاده می‌کنند لازم است
    sudo apt install texlive texlive-latex-extra texlive-fonts-extra dvipng
    ```

    مطمئن شوید که Postgres را اجرا کرده‌اید:

    ```sh
    sudo systemctl start postgresql.service
    ```

    > اگر دستور بالا خطایی مانند `System has not been booted with systemd as init system` یا `Failed to connect to bus` نشان داد، می‌توان دستور بالا را با دستور زیر جایگزین کرد:
    >
    > ```sh
    > sudo service postgresql start
    > ```

    ابزار `uv` را با استفاده از نصاب مستقل نصب کنید:

    ```sh
    curl -LsSf https://astral.sh/uv/install.sh | sh
    source $HOME/.local/bin/env  # افزودن uv به متغیر PATH برای شل فعلی
    ```

    نسخه Node.js 24 در مخازن پیش‌فرض اوبونتو موجود نیست؛ می‌توانید آن را از طریق [nvm](https://github.com/nvm-sh/nvm) نصب کنید:

    ```sh
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
    source ~/.bashrc # یا معادل آن در شل مورد استفاده شما
    nvm install 24
    ```

    نصب pnpm:

    ```sh
    npm install -g 'pnpm@^12.17.0'
    ```

    ابزار d2 را می‌توان از طریق اسکریپت نصب، نصب کرد:

    ```sh
    curl -fsSL https://d2lang.com/install.sh | sh -s --
    ```

    اکستنشن pgvector برای Postgres را می‌توان با اسکریپت زیر فعال کرد:

    ```sh
    sudo -u postgres psql postgres -c "CREATE EXTENSION IF NOT EXISTS vector;"
    ```

=== "macOS"

    در macOS، اطمینان حاصل کنید که ابزارهای خط فرمان Xcode را نصب کرده‌اید:

    ```sh
    xcode-select --install
    ```

    پیش‌نیازهای اصلی را می‌توان با [Homebrew](http://brew.sh/) نصب کرد:

    ```sh
    brew install git graphviz postgresql@17 redis uv d2 node pgvector

    # اختیاری؛ تنها برای برخی از سوالات نمونه که از LaTeX استفاده می‌کنند لازم است
    brew install texlive
    ```

    ممکن است بخواهید سرور `postgresql` در زمان بوت سیستم اجرا شود و باینری‌ها به path شما اضافه گردند:

    ```sh
    brew services start postgresql@17
    brew link postgresql@17
    ```

    نصب pnpm:

    ```sh
    npm install -g 'pnpm@^12.17.0'
    ```

- کلون کردن آخرین نسخه کد:

  ```sh
  git clone https://github.com/PrairieLearn/PrairieLearn.git
  cd PrairieLearn
  ```

- نصب وابستگی‌های پایتون (در صورت نیاز، این دستور به‌طور خودکار یک محیط مجازی در `.venv` ایجاد می‌کند):

  ```sh
  make python-deps
  ```

  ??? note "خطا در نصب pygraphviz برای نسخه‌های جدیدتر gcc"

      در برخی از نسخه‌های جدیدتر gcc، ممکن است نصب پکیج `pygraphviz` با شکست مواجه شود. در صورت بروز این خطا، می‌توانید این دستور را امتحان کنید:

      ```sh
      CFLAGS="-Wno-error=incompatible-pointer-types" make python-deps
      ```

      این خطا تنها باید در اولین باری که pygraphviz را نصب می‌کنید رخ دهد. برای دفعات بعدی اجرای `make python-deps`، نیازی به تنظیم متغیر محیطی `CFLAGS` نخواهد بود.

- نصب تمام وابستگی‌ها و ترنسپایل کردن پکیج‌های محلی:

  ```sh
  make deps
  make e2e-deps
  ```

  دستور بالا همه چیز را نصب می‌کند. در غیر این صورت، می‌توانید هر مرحله را به‌صورت جداگانه اجرا نمایید:

  ```sh
  pnpm install
  make build
  make python-deps
  make e2e-deps
  ```

- مطمئن شوید که کاربر پایگاه داده `postgres` وجود دارد و دسترسی superuser دارد (اگر کاربر از قبل وجود داشته باشد، ممکن است این دستورات خطا دهند که مشکلی نیست):

  ```sh
  sudo -u postgres createdb postgres
  sudo -u postgres psql postgres -c "CREATE USER postgres;"
  sudo -u postgres psql postgres -c "ALTER USER postgres WITH SUPERUSER;"
  ```

- اطمینان حاصل کنید که نصب محلی `postgres` شما امکان دور زدن احراز هویت با رمز عبور را برای اتصال‌های محلی فراهم می‌کند. ابتدا با دستور زیر فایل پیکربندی احراز هویت را پیدا کنید:

  ```sh
  sudo -u postgres psql postgres -c "SHOW hba_file;"
  ```

  دستور بالا مسیر فایلی به نام `pg_hba.conf` یا معادل آن را لیست می‌کند. با کاربر root یا کاربر `postgres`، فایل نمایش‌داده‌شده توسط دستور فوق را ویرایش کنید، به نحوی که خطوط مربوط به اتصالات localhost با روش `trust` تنظیم شده باشند (سایر خطوط را تغییر ندهید). اگر دو خط آخر از قبل حاوی "trust" هستند، نیازی به اعمال تغییرات نیست. این بخش معمولاً به این صورت نمایش داده می‌شود:

  ```text
  # TYPE  DATABASE        USER            ADDRESS                 METHOD
  ...
  # IPv4 local connections:
  host    all             all             127.0.0.1/32            trust
  # IPv6 local connections:
  host    all             all             ::1/128                 trust
  ```

  پس از تغییر فایل بالا، ممکن است لازم باشد سرور PostgreSQL را ری‌استارت کنید.

- پیکربندی PostgreSQL برای استفاده از منطقه زمانی UTC:

  ```sh
  sudo -u postgres psql postgres -c "ALTER SYSTEM SET timezone = 'UTC';"
  sudo -u postgres psql postgres -c "SELECT pg_reload_conf();"
  sudo -u postgres psql postgres -c "SHOW timezone;"
  ```

  دستور آخر باید مقدار `UTC` را برگرداند.

## پیکربندی

اگر [مخزن درس پِری‌لرن](../requestCourse/index.md) اختصاصی خود را دارید، باید فایل `PrairieLearn/config.json` را با مسیر مخزن درس محلی خود بسازید. اگر به پشتیبانی از ویرایشگر فایل درون مرورگر یا آپلود فایل نیاز دارید، باید `filesRoot` را تنظیم کنید. اگر به پشتیبانی از محیط‌های کاری نیاز دارید، باید مسیری را به یک دایرکتوری که فایل‌های موقت در آن ذخیره می‌شوند ارائه دهید. در اینجا یک نمونه پیکربندی آورده شده است:

```json title="config.json"
{
  "courseDirs": ["/Users/mwest/git/pl-tam212", "exampleCourse"],
  "filesRoot": "../filesRoot",
  "workspaceHostHomeDirRoot": "/tmp/workspace",
  "workspaceHomeDirRoot": "/tmp/workspace"
}
```

اطلاعات بیشتر درباره `config.json` را می‌توانید در مستندات [پیکربندی سرور](./configJson.md) بیابید.

## توسعه

اطلاعات بیشتر درباره جریان کاری توسعه را می‌توانید در مستندات [شروع سریع توسعه](./quickstart.md) پیدا کنید.
