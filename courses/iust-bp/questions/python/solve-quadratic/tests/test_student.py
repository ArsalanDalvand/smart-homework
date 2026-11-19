import math
import pytest
from pytest_prairielearn_grader import ConfigObject
from pytest_prairielearn_grader.fixture import StudentFixture

pytestmark = [
    pytest.mark.config(
        ConfigObject(
            output_level="friendly",
            syntax_errors_ungradable=True,
            sandbox_timeout=2.0,
        )
    )
]


@pytest.mark.grading_data(name="تست ۱: دو ریشه حقیقی متمایز (Delta > 0)", points=15)
def test_two_roots(sandbox: StudentFixture) -> None:
    solve_quadratic = sandbox.query("solve_quadratic")
    res = solve_quadratic(1, -5, 6)
    assert res is not None, "تابع مقداری برنگردانده است (None). حتماً از دستور return استفاده کنید."
    assert isinstance(res, tuple), f"خروجی تابع باید tuple باشد اما نوع {type(res).__name__} دریافت شد."
    assert len(res) == 2, f"انتظار دو ریشه داشتیم اما خروجی {res} بود."
    assert math.isclose(res[0], 2.0, rel_tol=1e-4), f"ریشه اول (کوچک‌تر) اشتباه است: خروجی {res[0]}"
    assert math.isclose(res[1], 3.0, rel_tol=1e-4), f"ریشه دوم (بزرگ‌تر) اشتباه است: خروجی {res[1]}"


@pytest.mark.grading_data(name="تست ۲: ریشه مضاعف (Delta = 0)", points=10)
def test_one_root(sandbox: StudentFixture) -> None:
    solve_quadratic = sandbox.query("solve_quadratic")
    res = solve_quadratic(1, -4, 4)
    assert isinstance(res, tuple), "خروجی باید tuple باشد."
    assert len(res) == 1, f"برای دلتای صفر باید تاپل تک‌عضوی مانند (x,) باشد اما خروجی {res} بود."
    assert math.isclose(res[0], 2.0, rel_tol=1e-4), f"ریشه مضاعف اشتباه است: {res[0]}"


@pytest.mark.grading_data(name="تست ۳: بدون ریشه حقیقی (Delta < 0)", points=15)
def test_no_real_roots(sandbox: StudentFixture) -> None:
    solve_quadratic = sandbox.query("solve_quadratic")
    res = solve_quadratic(1, 0, 1)
    assert isinstance(res, tuple), "خروجی باید tuple باشد."
    assert len(res) == 0, f"برای دلتای منفی باید تاپل خالی () بازگردانده شود اما خروجی {res} دریافت شد."
