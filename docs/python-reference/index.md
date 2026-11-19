# مرجع پایتون (Python Reference)

![Codecov](https://codecov.io/github/prairielearn/prairielearn/graph/badge.svg?token=50XtugkgLU&flag=python)

این توابع و ابزارهای کمکی (Helpers) در محیط پایتون هنگام اجرای یک سوال یا المان در پریری‌لرن (PrairieLearn) در دسترس هستند. آن‌ها بر اساس دسته‌بندی مرتب شده‌اند. پرکاربردترین ابزارهای کمکی، ابزارهای [نمره‌دهی](./prairielearn/grading_utils.md)، [تبدیل](./prairielearn/conversion_utils.md) و [سوال](./prairielearn/question_utils.md) هستند.

در ادامه روش‌های توصیه‌شده برای وارد کردن (Import) این ابزارهای کمکی آورده شده است:

```python
import prairielearn as pl
from prairielearn.colors import Y
from prairielearn.to_precision import Z
import prairielearn.sympy_utils as psu
```

??? info "اطلاعات بیشتر"

    شما می‌توانید از ایمپورت زیر برای دسترسی به اکثر ابزارهای کمکی استفاده کنید:

    ```python
    from prairielearn import ...
    ```

    این ماژول‌ها باید مستقیماً وارد شوند:

    ```python
    from prairielearn.colors import Y
    from prairielearn.to_precision import Z
    from prairielearn.sympy_utils import Z
    ```

    شما **نباید** سایر ماژول‌های نقطه‌دار (مانند `prairielearn.conversion_utils`) را مستقیماً وارد کنید، زیرا رابط کاربری پایدار (Stable interface) ندارند.

!!! warning "هشدار"

    روش‌های ایمپورت زیر اکنون منسوخ شده‌اند (Deprecated) و در نسخه‌های آتی حذف خواهند شد. لطفاً کد خود را به‌روزرسانی کنید تا از ایمپورت‌های جدید استفاده کند:

    === "قدیمی"

        ```python { .no-copy }
        import colors
        import to_precision
        import python_helper_sympy
        ```

    === "جدید"

        ```python
        import prairielearn.colors
        import prairielearn.to_precision
        import prairielearn.sympy_utils
        ```

<!-- prettier-ignore -->
::: prairielearn
    options:
        members:
            - misc_utils
            - sympy_utils
            - extension_utils
            - question_utils
            - grading_utils
            - conversion_utils
            - html_utils
            - colors
