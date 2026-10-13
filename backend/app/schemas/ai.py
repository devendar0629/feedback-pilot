"""Gemini AI schemas and structured response models."""
import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field
from app.models.ai_analysis import AIAnalysisStatus
from app.models.feedback import FeedbackPriority, FeedbackSentiment


class GeminiFeedbackAnalysisResponse(BaseModel):
    """Structured response expected and validated from Google Gen AI Gemini model."""
    suggested_category: Optional[str] = Field(
        None, description="Recommended category name matching an existing category"
    )
    suggested_department: Optional[str] = Field(
        None, description="Recommended department name matching an existing department"
    )
    sentiment: FeedbackSentiment = Field(
        default=FeedbackSentiment.NEUTRAL,
        description="Analyzed sentiment: positive, neutral, negative, or mixed",
    )
    priority: FeedbackPriority = Field(
        default=FeedbackPriority.MEDIUM,
        description="Assessed priority: low, medium, high, or critical",
    )
    urgency_score: int = Field(
        default=50,
        ge=0,
        le=100,
        description="Urgency score from 0 (very low) to 100 (immediate action required)",
    )
    summary: str = Field(
        ...,
        max_length=500,
        description="Concise 1-2 sentence executive summary of the feedback",
    )
    suggested_next_action: str = Field(
        ...,
        max_length=500,
        description="Actionable next step recommended for the staff/agent",
    )
    confidence_estimate: float = Field(
        default=0.85,
        ge=0.0,
        le=1.0,
        description="Estimated confidence between 0.0 and 1.0",
    )


class AIAnalysisRead(BaseModel):
    id: uuid.UUID
    feedback_id: uuid.UUID
    status: AIAnalysisStatus
    model_name: Optional[str] = None
    suggested_category_id: Optional[uuid.UUID] = None
    suggested_category_name: Optional[str] = None
    suggested_department_id: Optional[uuid.UUID] = None
    suggested_department_name: Optional[str] = None
    suggested_priority: Optional[str] = None
    suggested_sentiment: Optional[str] = None
    urgency_score: Optional[int] = None
    summary: Optional[str] = None
    suggested_next_action: Optional[str] = None
    confidence_score: Optional[float] = None
    attempts: int
    error_message: Optional[str] = None
    duration_ms: Optional[int] = None
    created_at: datetime
    completed_at: Optional[datetime] = None

    model_config = {"from_attributes": True}


class AIStatsRead(BaseModel):
    total_analyzed: int
    completed_count: int
    failed_count: int
    skipped_count: int
    success_rate_percentage: float
    avg_duration_ms: float
    current_model: str
    ai_enabled: bool


class AISettingsUpdate(BaseModel):
    ai_enabled: bool
    model_name: Optional[str] = None
    api_key: Optional[str] = None
