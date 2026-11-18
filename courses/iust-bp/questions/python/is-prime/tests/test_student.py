import pytest
from pytest_prairielearn_grader.fixture import StudentFixture


@pytest.mark.grading_data(name="تست ۱: اعداد اول کوچک (2, 3, 5, 7, 13)", points=10)
def test_small_primes(sandbox: StudentFixture) -> None:
    is_prime = sandbox.query("is_prime")
    for p in [2, 3, 5, 7, 13, 17, 19]:
        assert is_prime(p) is True, f"عدد {p} اول است اما تابع False برگرداند"


@pytest.mark.grading_data(name="تست ۲: اعداد مرکب کوچک (4, 6, 8, 9, 12, 15)", points=10)
def test_small_composites(sandbox: StudentFixture) -> None:
    is_prime = sandbox.query("is_prime")
    for c in [4, 6, 8, 9, 12, 14, 15, 21]:
        assert is_prime(c) is False, f"عدد {c} مرکب است اما تابع True برگرداند"


@pytest.mark.grading_data(name="تست ۳: حالات مرزی منفی، صفر و یک (<= 1)", points=10)
def test_edge_cases(sandbox: StudentFixture) -> None:
    is_prime = sandbox.query("is_prime")
    for edge in [-10, -2, -1, 0, 1]:
        assert is_prime(edge) is False, f"عدد {edge} نباید اول باشد اما تابع True برگرداند"


@pytest.mark.grading_data(name="تست ۴: اعداد بزرگ‌تر و کارایی الگوریتم", points=10)
def test_larger_numbers(sandbox: StudentFixture) -> None:
    is_prime = sandbox.query("is_prime")
    assert is_prime(104729) is True, "عدد 104729 اول است"
    assert is_prime(1000000) is False, "عدد 1000000 مرکب است"
    assert is_prime(1000003) is False, "عدد 1000003 (مضرب) مرکب است"
