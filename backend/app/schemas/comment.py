"""Comment schemas distinguishing public responses from internal notes."""
import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class CommentCreate(BaseModel):
    content: str = Field(..., min_length=1, max_length=5000)
    is_internal: bool = Field(
        default=False,
        description="True for private staff-only notes, False for public responses visible to reporter",
    )


class CommentRead(BaseModel):
    id: uuid.UUID
    feedback_id: uuid.UUID
    author_id: Optional[uuid.UUID] = None
    author_name: str
    is_internal: bool
    content: str
    created_at: datetime

    model_config = {"from_attributes": True}
