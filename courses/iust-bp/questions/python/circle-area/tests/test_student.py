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


@pytest.mark.grading_data(name="تست ۱: مساحت شعاع‌های ساده (r=1, r=2)", points=5)
def test_simple_radius(sandbox: StudentFixture) -> None:
    val1 = sandbox.query_function("circle_area", 1)
    if val1 is None:
        raise AssertionError("تابع شما مقداری برنگردانده است (None). دقت فرمایید که باید از return استفاده کنید نه print.")
    assert math.isclose(val1, math.pi, rel_tol=1e-4), f"مساحت دایره با شعاع ۱ اشتباه است: خروجی {val1}"
    val2 = sandbox.query_function("circle_area", 2)
    assert math.isclose(val2, 4 * math.pi, rel_tol=1e-4), f"مساحت دایره با شعاع ۲ اشتباه است: خروجی {val2}"


@pytest.mark.grading_data(name="تست ۲: مساحت شعاع اعشاری (r=2.5)", points=5)
def test_float_radius(sandbox: StudentFixture) -> None:
    val = sandbox.query_function("circle_area", 2.5)
    assert val is not None, "تابع مقداری برنگردانده است (از return استفاده کنید)"
    assert math.isclose(val, 6.25 * math.pi, rel_tol=1e-4), f"مساحت برای شعاع ۲.۵ اشتباه است: خروجی {val}"


@pytest.mark.grading_data(name="تست ۳: شعاع صفر (حالت مرزی r=0)", points=5)
def test_zero_radius(sandbox: StudentFixture) -> None:
    val = sandbox.query_function("circle_area", 0)
    assert val is not None, "تابع مقداری برنگردانده است"
    assert math.isclose(val, 0.0, abs_tol=1e-6), "مساحت دایره با شعاع صفر باید ۰ باشد"


@pytest.mark.grading_data(name="تست ۴: شعاع منفی (حالت مرزی r < 0)", points=5)
def test_negative_radius(sandbox: StudentFixture) -> None:
    val = sandbox.query_function("circle_area", -5)
    assert val == 0, f"برای شعاع منفی باید عدد ۰ بازگردانده شود، اما مقدار {val} دریافت شد"
