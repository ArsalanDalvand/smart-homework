import math
import pytest
from pytest_prairielearn_grader.fixture import StudentFixture


@pytest.mark.grading_data(name="تست ۱: دو ریشه حقیقی متمایز (Delta > 0)", points=15)
def test_two_roots(sandbox: StudentFixture) -> None:
    solve_quadratic = sandbox.query("solve_quadratic")
    # x^2 - 5x + 6 = 0 -> roots: 2, 3
    res = solve_quadratic(1, -5, 6)
    assert isinstance(res, tuple), "خروجی تابع باید از نوع tuple باشد"
    assert len(res) == 2, f"انتظار دو ریشه داشتیم اما خروجی {res} بود"
    assert math.isclose(res[0], 2.0, rel_tol=1e-5), f"ریشه اول اشتباه است: انتظار ۲، خروجی {res[0]}"
    assert math.isclose(res[1], 3.0, rel_tol=1e-5), f"ریشه دوم اشتباه است: انتظار ۳، خروجی {res[1]}"


@pytest.mark.grading_data(name="تست ۲: ریشه مضاعف (Delta = 0)", points=10)
def test_one_root(sandbox: StudentFixture) -> None:
    solve_quadratic = sandbox.query("solve_quadratic")
    # x^2 - 4x + 4 = 0 -> root: 2
    res = solve_quadratic(1, -4, 4)
    assert isinstance(res, tuple), "خروجی باید tuple باشد"
    assert len(res) == 1, f"برای دلتای صفر باید تاپل تک‌عضوی برگردانده شود: {res}"
    assert math.isclose(res[0], 2.0, rel_tol=1e-5), f"ریشه مضاعف اشتباه است: {res[0]}"


@pytest.mark.grading_data(name="تست ۳: بدون ریشه حقیقی (Delta < 0)", points=15)
def test_no_real_roots(sandbox: StudentFixture) -> None:
    solve_quadratic = sandbox.query("solve_quadratic")
    # x^2 + 1 = 0 -> Delta < 0
    res = solve_quadratic(1, 0, 1)
    assert isinstance(res, tuple), "خروجی باید tuple باشد"
    assert len(res) == 0, f"برای دلتای منفی باید تاپل خالی () برگردانده شود اما خروجی {res} بود"
