"""Public feedback submission and tracking API endpoints."""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Request, status
from pydantic import BaseModel, Field
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.deps import get_db, get_optional_user
from app.core.exceptions import TrackingVerificationError
from app.models.category import Category
from app.models.department import Department
from app.models.user import User
from app.schemas.category import CategoryRead
from app.schemas.department import DepartmentRead
from app.schemas.feedback import FeedbackSubmissionResponse, PublicFeedbackSubmit
from app.schemas.tracking import PublicTrackingResponse, TrackingLookupRequest
from app.services.comment_service import add_comment
from app.services.feedback_service import create_public_feedback, verify_and_track_feedback
from app.schemas.comment import CommentCreate, CommentRead

router = APIRouter(prefix="/public", tags=["Public Feedback & Tracking"])


class PublicCommentSubmit(BaseModel):
    reference_number: str
    tracking_secret: str
    content: str = Field(..., min_length=1, max_length=5000)
    author_name: Optional[str] = Field("Public User", max_length=255)


@router.post("/feedback", response_model=FeedbackSubmissionResponse, status_code=status.HTTP_201_CREATED)
async def submit_public_feedback(
    submit_in: PublicFeedbackSubmit,
    request: Request,
    current_user: Optional[User] = Depends(get_optional_user),
    db: AsyncSession = Depends(get_db),
):
    """Submit public feedback or complaint. Returns reference number and secure tracking credentials."""
    client_ip = request.client.host if request.client else None
    response = await create_public_feedback(
        db=db,
        submit_in=submit_in,
        current_user=current_user,
        ip_address=client_ip,
    )
    return response


@router.post("/track", response_model=PublicTrackingResponse)
async def track_feedback(
    payload: TrackingLookupRequest,
    db: AsyncSession = Depends(get_db),
):
    """Securely track feedback status, timeline, and public responses using reference number & secret key."""
    try:
        tracking_info = await verify_and_track_feedback(
            db=db,
            reference_number=payload.reference_number,
            tracking_secret=payload.tracking_secret,
        )
        return tracking_info
    except TrackingVerificationError as err:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(err),
        )


@router.post("/track/comment", response_model=CommentRead)
async def add_public_comment(
    payload: PublicCommentSubmit,
    db: AsyncSession = Depends(get_db),
):
    """Submit a public reply to a tracked ticket using verified reference number & secret key."""
    try:
        tracking_info = await verify_and_track_feedback(
            db=db,
            reference_number=payload.reference_number,
            tracking_secret=payload.tracking_secret,
        )
    except TrackingVerificationError as err:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(err),
        )

    comment = await add_comment(
        db=db,
        feedback_id=tracking_info.id,
        comment_in=CommentCreate(content=payload.content, is_internal=False),
        current_user=None,
        guest_author_name=payload.author_name or "Reporter",
    )
    await db.commit()
    return comment


@router.get("/categories", response_model=List[CategoryRead])
async def get_public_categories(db: AsyncSession = Depends(get_db)):
    """Retrieve active categories for public submission dropdown."""
    stmt = select(Category).where(Category.is_active == True).order_by(Category.name.asc())
    res = await db.execute(stmt)
    return res.scalars().all()


@router.get("/departments", response_model=List[DepartmentRead])
async def get_public_departments(db: AsyncSession = Depends(get_db)):
    """Retrieve active departments for public submission dropdown."""
    stmt = select(Department).where(Department.is_active == True).order_by(Department.name.asc())
    res = await db.execute(stmt)
    return res.scalars().all()
