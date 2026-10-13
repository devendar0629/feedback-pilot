"""Comment service enforcing public vs internal staff note separation."""
import uuid
from typing import List, Optional
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.exceptions import EntityNotFoundError, UnauthorizedAccessError
from app.models.comment import Comment
from app.models.feedback import Feedback
from app.models.user import User, UserRole
from app.schemas.comment import CommentCreate


async def add_comment(
    db: AsyncSession,
    feedback_id: uuid.UUID,
    comment_in: CommentCreate,
    current_user: Optional[User] = None,
    guest_author_name: Optional[str] = None,
) -> Comment:
    """Add a public response or private internal note to a feedback item."""
    stmt = select(Feedback).where(Feedback.id == feedback_id)
    result = await db.execute(stmt)
    feedback = result.scalar_one_or_none()
    if not feedback:
        raise EntityNotFoundError(f"Feedback with id {feedback_id} not found.")

    if comment_in.is_internal:
        if not current_user or current_user.role not in (UserRole.ADMINISTRATOR, UserRole.AGENT):
            raise UnauthorizedAccessError("Only staff members can create private internal notes.")

    author_name = "Public User"
    author_id = None
    if current_user:
        author_name = current_user.full_name
        author_id = current_user.id
    elif guest_author_name:
        author_name = guest_author_name

    comment = Comment(
        feedback_id=feedback_id,
        author_id=author_id,
        author_name=author_name,
        is_internal=comment_in.is_internal,
        content=comment_in.content,
    )
    db.add(comment)
    await db.flush()
    return comment


async def get_feedback_comments(
    db: AsyncSession,
    feedback_id: uuid.UUID,
    include_internal: bool = False,
) -> List[Comment]:
    """Retrieve comments for a feedback item.
    
    If include_internal is False (for reporters or public tracking), internal staff notes are strictly excluded.
    """
    stmt = select(Comment).where(Comment.feedback_id == feedback_id)
    if not include_internal:
        stmt = stmt.where(Comment.is_internal == False)
    stmt = stmt.order_by(Comment.created_at.asc())

    result = await db.execute(stmt)
    return list(result.scalars().all())
