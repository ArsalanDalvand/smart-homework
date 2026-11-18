import math
import pytest
from pytest_prairielearn_grader.fixture import StudentFixture


@pytest.mark.grading_data(name="تست ۱: مساحت شعاع‌های ساده (r=1, r=2)", points=5)
def test_simple_radius(sandbox: StudentFixture) -> None:
    circle_area = sandbox.query("circle_area")
    assert math.isclose(circle_area(1), math.pi, rel_tol=1e-5), "مساحت دایره با شعاع ۱ اشتباه است"
    assert math.isclose(circle_area(2), 4 * math.pi, rel_tol=1e-5), "مساحت دایره با شعاع ۲ اشتباه است"


@pytest.mark.grading_data(name="تست ۲: مساحت شعاع اعشاری (r=2.5)", points=5)
def test_float_radius(sandbox: StudentFixture) -> None:
    circle_area = sandbox.query("circle_area")
    assert math.isclose(circle_area(2.5), 6.25 * math.pi, rel_tol=1e-5), "مساحت با شعاع ۲.۵ اشتباه است"


@pytest.mark.grading_data(name="تست ۳: شعاع صفر (حالت مرزی r=0)", points=5)
def test_zero_radius(sandbox: StudentFixture) -> None:
    circle_area = sandbox.query("circle_area")
    assert math.isclose(circle_area(0), 0.0, abs_tol=1e-7), "مساحت دایره با شعاع صفر باید صفر باشد"


@pytest.mark.grading_data(name="تست ۴: شعاع منفی (حالت مرزی r < 0)", points=5)
def test_negative_radius(sandbox: StudentFixture) -> None:
    circle_area = sandbox.query("circle_area")
    assert circle_area(-5) == 0, "برای شعاع منفی باید عدد ۰ برگردانده شود"
    assert circle_area(-0.1) == 0, "برای شعاع منفی اعشاری باید عدد ۰ برگردانده شود"
