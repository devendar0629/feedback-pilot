"""User management API for administrators."""
import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from app.api.deps import get_db, require_roles
from app.core.security import hash_password
from app.models.user import User, UserRole
from app.schemas.auth import UserCreate, UserRead, UserUpdate
from app.services.auth_service import create_user

router = APIRouter(prefix="/users", tags=["User Administration"])


@router.get("", response_model=List[UserRead])
async def list_users(
    role: Optional[UserRole] = Query(None),
    department_id: Optional[uuid.UUID] = Query(None),
    current_user: User = Depends(require_roles([UserRole.ADMINISTRATOR])),
    db: AsyncSession = Depends(get_db),
):
    """List all registered users (Administrator only)."""
    stmt = select(User).options(selectinload(User.department)).order_by(User.full_name.asc())
    if role:
        stmt = stmt.where(User.role == role)
    if department_id:
        stmt = stmt.where(User.department_id == department_id)

    result = await db.execute(stmt)
    users = result.scalars().all()
    return [
        UserRead(
            id=u.id,
            email=u.email,
            full_name=u.full_name,
            role=u.role,
            department_id=u.department_id,
            department_name=u.department.name if u.department else None,
            is_active=u.is_active,
            created_at=u.created_at,
            updated_at=u.updated_at,
        )
        for u in users
    ]


@router.post("", response_model=UserRead, status_code=status.HTTP_201_CREATED)
async def create_new_user(
    user_in: UserCreate,
    current_user: User = Depends(require_roles([UserRole.ADMINISTRATOR])),
    db: AsyncSession = Depends(get_db),
):
    """Create a new user account (Administrator only)."""
    try:
        new_user = await create_user(db, user_in)
        await db.commit()
        await db.refresh(new_user)
        return new_user
    except ValueError as err:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(err))


@router.patch("/{user_id}", response_model=UserRead)
async def update_user_details(
    user_id: uuid.UUID,
    user_in: UserUpdate,
    current_user: User = Depends(require_roles([UserRole.ADMINISTRATOR])),
    db: AsyncSession = Depends(get_db),
):
    """Update a user's role, status, or details (Administrator only)."""
    stmt = select(User).where(User.id == user_id)
    res = await db.execute(stmt)
    user = res.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    updates = user_in.model_dump(exclude_unset=True)
    if "password" in updates and updates["password"]:
        user.hashed_password = hash_password(updates.pop("password"))

    for k, v in updates.items():
        setattr(user, k, v)

    await db.commit()
    await db.refresh(user)
    return user
