"""Feedback schemas for submission, management, transitions, and reads."""
import uuid
from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, EmailStr, Field
from app.models.feedback import FeedbackPriority, FeedbackSentiment, FeedbackStatus
from app.schemas.ai import AIAnalysisRead
from app.schemas.comment import CommentRead
from app.schemas.status_history import StatusHistoryRead


class PublicFeedbackSubmit(BaseModel):
    title: str = Field(..., min_length=3, max_length=255)
    description: str = Field(..., min_length=10, max_length=10000)
    reporter_name: Optional[str] = Field(None, max_length=255)
    reporter_email: Optional[EmailStr] = None
    reporter_phone: Optional[str] = Field(None, max_length=50)
    location: Optional[str] = Field(None, max_length=255)
    is_anonymous: bool = False
    category_id: Optional[uuid.UUID] = None
    department_id: Optional[uuid.UUID] = None


class FeedbackSubmissionResponse(BaseModel):
    id: uuid.UUID
    reference_number: str
    tracking_secret: str
    title: str
    status: FeedbackStatus
    priority: FeedbackPriority
    created_at: datetime
    message: str = (
        "Feedback submitted successfully. Please save your reference number and tracking secret "
        "to securely check updates in the future."
    )


class FeedbackRead(BaseModel):
    id: uuid.UUID
    reference_number: str
    title: str
    description: str
    reporter_id: Optional[uuid.UUID] = None
    reporter_name: Optional[str] = None
    reporter_email: Optional[str] = None
    reporter_phone: Optional[str] = None
    location: Optional[str] = None
    is_anonymous: bool
    status: FeedbackStatus
    priority: FeedbackPriority
    sentiment: Optional[FeedbackSentiment] = None
    department_id: Optional[uuid.UUID] = None
    department_name: Optional[str] = None
    category_id: Optional[uuid.UUID] = None
    category_name: Optional[str] = None
    assigned_to_id: Optional[uuid.UUID] = None
    assigned_to_name: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    resolved_at: Optional[datetime] = None
    closed_at: Optional[datetime] = None
    comment_count: int = 0
    ai_status: Optional[str] = None

    model_config = {"from_attributes": True}


class FeedbackDetailRead(FeedbackRead):
    ai_analysis: Optional[AIAnalysisRead] = None
    comments: List[CommentRead] = []
    status_history: List[StatusHistoryRead] = []


class FeedbackUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=3, max_length=255)
    description: Optional[str] = Field(None, min_length=10, max_length=10000)
    priority: Optional[FeedbackPriority] = None
    sentiment: Optional[FeedbackSentiment] = None
    department_id: Optional[uuid.UUID] = None
    category_id: Optional[uuid.UUID] = None
    assigned_to_id: Optional[uuid.UUID] = None
    location: Optional[str] = Field(None, max_length=255)


class StatusTransitionRequest(BaseModel):
    target_status: FeedbackStatus
    reason: Optional[str] = Field(None, max_length=1000)


class AssignmentRequest(BaseModel):
    department_id: Optional[uuid.UUID] = None
    assigned_to_id: Optional[uuid.UUID] = None
    note: Optional[str] = Field(None, max_length=500)


class ApplyAISuggestionsRequest(BaseModel):
    apply_category: bool = True
    apply_department: bool = True
    apply_priority: bool = True
    apply_sentiment: bool = True
