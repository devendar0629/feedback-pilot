"""Security utilities: password hashing, JWT tokens, and cryptographic keys."""
import hashlib
import hmac
import secrets
import string
from datetime import datetime, timedelta, timezone
from typing import Any, Dict, Optional
import bcrypt
import jwt
from app.core.config import settings

REF_CHARS = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ"


def hash_password(password: str) -> str:
    """Hash a plaintext password using bcrypt with a generated salt."""
    salt = bcrypt.gensalt(rounds=12)
    hashed = bcrypt.hashpw(password.encode("utf-8"), salt)
    return hashed.decode("utf-8")


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a plaintext password against a stored bcrypt hash."""
    try:
        return bcrypt.checkpw(
            plain_password.encode("utf-8"),
            hashed_password.encode("utf-8"),
        )
    except Exception:
        return False


def create_access_token(
    subject: str,
    claims: Optional[Dict[str, Any]] = None,
    expires_delta: Optional[timedelta] = None,
) -> str:
    """Create a signed JWT access token."""
    now = datetime.now(timezone.utc)
    if expires_delta:
        expire = now + expires_delta
    else:
        expire = now + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    payload = {
        "sub": str(subject),
        "iat": now,
        "exp": expire,
    }
    if claims:
        payload.update(claims)

    encoded_jwt = jwt.encode(
        payload,
        settings.JWT_SECRET_KEY,
        algorithm=settings.JWT_ALGORITHM,
    )
    return encoded_jwt


def decode_access_token(token: str) -> Optional[Dict[str, Any]]:
    """Decode and validate a JWT access token."""
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM],
        )
        return payload
    except (jwt.PyJWTError, Exception):
        return None


def generate_reference_number() -> str:
    """Generate an unpredictable, unique reference number (e.g., FP-2026-X8K9M2)."""
    year = datetime.now(timezone.utc).year
    code = "".join(secrets.choice(REF_CHARS) for _ in range(6))
    return f"FP-{year}-{code}"


def generate_tracking_secret() -> str:
    """Generate a high-entropy secret key for anonymous tracking verification."""
    return f"tr_{secrets.token_urlsafe(24)}"


def hash_tracking_secret(secret: str) -> str:
    """Hash the tracking secret using HMAC-SHA256 with the app JWT secret as key."""
    return hmac.new(
        settings.JWT_SECRET_KEY.encode("utf-8"),
        secret.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()


def verify_tracking_secret(provided_secret: str, stored_hash: str) -> bool:
    """Constant-time comparison of a provided tracking secret against the stored hash."""
    calculated = hash_tracking_secret(provided_secret)
    return hmac.compare_digest(calculated, stored_hash)
