"""In-app notification creation and management service."""
import uuid
from typing import Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.notification import Notification


async def create_notification(
    db: AsyncSession,
    user_id: uuid.UUID,
    title: str,
    message: str,
    notification_type: str,
    feedback_id: Optional[uuid.UUID] = None,
) -> Notification:
    """Create an in-app notification for a user."""
    notification = Notification(
        user_id=user_id,
        feedback_id=feedback_id,
        title=title,
        message=message,
        notification_type=notification_type,
        is_read=False,
    )
    db.add(notification)
    return notification
