"""Unit tests for security, password hashing, JWT, and tracking verification."""
import re
from datetime import timedelta
from app.core.security import (
    create_access_token,
    decode_access_token,
    generate_reference_number,
    generate_tracking_secret,
    hash_password,
    hash_tracking_secret,
    verify_password,
    verify_tracking_secret,
)


def test_password_hashing():
    """Verify bcrypt password hashing and verification."""
    password = "SuperSecurePassword123!"
    hashed = hash_password(password)
    assert hashed != password
    assert verify_password(password, hashed) is True
    assert verify_password("WrongPassword!", hashed) is False


def test_jwt_lifecycle():
    """Verify JWT creation, claim encoding, and decoding."""
    subject = "user-12345"
    claims = {"role": "administrator", "email": "admin@test.io"}
    token = create_access_token(subject=subject, claims=claims)

    decoded = decode_access_token(token)
    assert decoded is not None
    assert decoded["sub"] == subject
    assert decoded["role"] == "administrator"
    assert decoded["email"] == "admin@test.io"


def test_expired_jwt():
    """Verify expired token returns None on decoding."""
    token = create_access_token(
        subject="user-123",
        expires_delta=timedelta(seconds=-10),  # Already expired
    )
    decoded = decode_access_token(token)
    assert decoded is None


def test_reference_number_format_and_uniqueness():
    """Verify generated reference numbers conform to pattern and are unpredictable."""
    pattern = re.compile(r"^FP-\d{4}-[2-9A-HJ-NP-Z]{6}$")
    refs = set()
    for _ in range(100):
        ref = generate_reference_number()
        assert pattern.match(ref) is not None
        refs.add(ref)
    # Ensure all 100 generated references are unique
    assert len(refs) == 100


def test_tracking_secret_verification():
    """Verify high-entropy tracking secret hashing and constant-time verification."""
    secret = generate_tracking_secret()
    assert secret.startswith("tr_")
    assert len(secret) > 20

    secret_hash = hash_tracking_secret(secret)
    assert verify_tracking_secret(secret, secret_hash) is True
    assert verify_tracking_secret("tr_invalid_attempt", secret_hash) is False
