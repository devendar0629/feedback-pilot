"""Authentication business logic service."""
import uuid
from typing import Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.exceptions import EntityNotFoundError, UnauthorizedAccessError
from app.core.security import create_access_token, hash_password, verify_password
from app.models.user import User, UserRole
from app.schemas.auth import LoginRequest, Token, UserCreate, UserRead


async def authenticate_user(db: AsyncSession, credentials: LoginRequest) -> Token:
    """Validate user credentials and generate a signed access token."""
    stmt = select(User).where(User.email == credentials.email.lower())
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if not user or not verify_password(credentials.password, user.hashed_password):
        raise UnauthorizedAccessError("Invalid email or password.")

    if not user.is_active:
        raise UnauthorizedAccessError("Account is inactive. Please contact your administrator.")

    claims = {
        "role": user.role.value,
        "email": user.email,
        "name": user.full_name,
    }
    access_token = create_access_token(subject=str(user.id), claims=claims)

    user_read = UserRead.model_validate(user)
    return Token(
        access_token=access_token,
        token_type="bearer",
        expires_in=60 * 24 * 60,
        user=user_read,
    )


async def create_user(db: AsyncSession, user_in: UserCreate) -> User:
    """Create a new user account."""
    stmt = select(User).where(User.email == user_in.email.lower())
    result = await db.execute(stmt)
    existing = result.scalar_one_or_none()
    if existing:
        raise ValueError(f"User with email '{user_in.email}' already exists.")

    new_user = User(
        email=user_in.email.lower(),
        hashed_password=hash_password(user_in.password),
        full_name=user_in.full_name,
        role=user_in.role,
        department_id=user_in.department_id,
        is_active=user_in.is_active,
    )
    db.add(new_user)
    await db.flush()
    return new_user


async def get_user_by_id(db: AsyncSession, user_id: uuid.UUID) -> Optional[User]:
    """Retrieve user by UUID."""
    stmt = select(User).where(User.id == user_id)
    result = await db.execute(stmt)
    return result.scalar_one_or_none()
