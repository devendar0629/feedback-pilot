"""Public feedback tracking schemas."""
import uuid
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field
from app.models.feedback import FeedbackPriority, FeedbackStatus
from app.schemas.comment import CommentRead
from app.schemas.status_history import StatusHistoryRead


class TrackingLookupRequest(BaseModel):
    reference_number: str = Field(..., min_length=5, max_length=50)
    tracking_secret: str = Field(..., min_length=10, max_length=100)


class PublicTrackingResponse(BaseModel):
    id: uuid.UUID
    reference_number: str
    title: str
    description: str
    status: FeedbackStatus
    priority: FeedbackPriority
    department_name: Optional[str] = None
    category_name: Optional[str] = None
    location: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    resolved_at: Optional[datetime] = None
    closed_at: Optional[datetime] = None
    timeline: List[StatusHistoryRead] = []
    public_comments: List[CommentRead] = []

    model_config = {"from_attributes": True}
