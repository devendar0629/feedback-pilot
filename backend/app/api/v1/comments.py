"""Comments and internal notes API endpoints."""
import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.deps import get_current_user, get_db
from app.core.exceptions import EntityNotFoundError, UnauthorizedAccessError
from app.models.user import User, UserRole
from app.schemas.comment import CommentCreate, CommentRead
from app.services.comment_service import add_comment, get_feedback_comments

router = APIRouter(prefix="/feedbacks/{feedback_id}/comments", tags=["Comments"])


@router.post("", response_model=CommentRead, status_code=status.HTTP_201_CREATED)
async def post_comment(
    feedback_id: uuid.UUID,
    comment_in: CommentCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Add a public response or private internal note. Internal notes require staff role."""
    try:
        comment = await add_comment(
            db=db,
            feedback_id=feedback_id,
            comment_in=comment_in,
            current_user=current_user,
        )
        await db.commit()
        return comment
    except EntityNotFoundError as err:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(err))
    except UnauthorizedAccessError as err:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(err))


@router.get("", response_model=List[CommentRead])
async def list_comments(
    feedback_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """List comments. Internal staff notes are omitted for reporters."""
    include_internal = current_user.role in (UserRole.ADMINISTRATOR, UserRole.AGENT)
    comments = await get_feedback_comments(
        db=db,
        feedback_id=feedback_id,
        include_internal=include_internal,
    )
    return comments
