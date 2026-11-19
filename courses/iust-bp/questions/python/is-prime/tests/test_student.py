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


@pytest.mark.grading_data(name="تست ۱: حالت‌های مرزی (اعداد منفی، صفر و یک)", points=10)
def test_edge_cases(sandbox: StudentFixture) -> None:
    is_prime = sandbox.query("is_prime")
    for edge in [-10, -2, -1, 0, 1]:
        res = is_prime(edge)
        assert res is not None, "تابع مقداری برنگردانده است (None). از return استفاده کنید."
        assert res is False, f"عدد {edge} اول نیست؛ خروجی باید False باشد اما {res} دریافت شد."


@pytest.mark.grading_data(name="تست ۲: اعداد اول کوچک و عدد ۲", points=10)
def test_small_primes(sandbox: StudentFixture) -> None:
    is_prime = sandbox.query("is_prime")
    for p in [2, 3, 5, 7, 13, 17, 19]:
        res = is_prime(p)
        assert res is True, f"عدد {p} اول است اما تابع False بازگرداند."


@pytest.mark.grading_data(name="تست ۳: اعداد مرکب و زوج‌های بزرگتر از دو", points=10)
def test_small_composites(sandbox: StudentFixture) -> None:
    is_prime = sandbox.query("is_prime")
    for c in [4, 6, 8, 9, 12, 14, 15, 21, 25]:
        res = is_prime(c)
        assert res is False, f"عدد {c} مرکب است اما تابع True بازگرداند."


@pytest.mark.grading_data(name="تست ۴: اعداد بزرگ‌تر و کارایی الگوریتم", points=10)
def test_larger_numbers(sandbox: StudentFixture) -> None:
    is_prime = sandbox.query("is_prime")
    # عدد اول بزرگ
    assert is_prime(104729) is True, "عدد 104729 اول است اما تابع False بازگرداند یا زمان اجرای کد بیش از ۲ ثانیه طول کشید."
    # اعداد مرکب بزرگ
    assert is_prime(1000000) is False, "عدد 1000000 مرکب است."
    assert is_prime(104733) is False, "عدد 104733 مرکب است."
