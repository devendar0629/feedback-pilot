"""AI Analysis model for storing structured Gemini recommendations and execution stats."""
import enum
import uuid
from datetime import datetime, timezone
from typing import TYPE_CHECKING
from sqlalchemy import DateTime, Enum, Float, ForeignKey, Integer, String, Text, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base, GUID

if TYPE_CHECKING:
    from app.models.feedback import Feedback


class AIAnalysisStatus(str, enum.Enum):
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    SKIPPED = "skipped"


class AIAnalysis(Base):
    __tablename__ = "ai_analyses"

    id: Mapped[uuid.UUID] = mapped_column(
        GUID,
        primary_key=True,
        default=uuid.uuid4,
    )
    feedback_id: Mapped[uuid.UUID] = mapped_column(
        GUID,
        ForeignKey("feedbacks.id", ondelete="CASCADE"),
        unique=True,
        index=True,
        nullable=False,
    )

    status: Mapped[AIAnalysisStatus] = mapped_column(
        Enum(AIAnalysisStatus, native_enum=False, values_callable=lambda x: [e.value for e in x]),
        default=AIAnalysisStatus.PENDING,
        index=True,
        nullable=False,
    )
    model_name: Mapped[str | None] = mapped_column(String(100), nullable=True)

    suggested_category_id: Mapped[uuid.UUID | None] = mapped_column(
        GUID,
        ForeignKey("categories.id", ondelete="SET NULL"),
        nullable=True,
    )
    suggested_category_name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    suggested_department_id: Mapped[uuid.UUID | None] = mapped_column(
        GUID,
        ForeignKey("departments.id", ondelete="SET NULL"),
        nullable=True,
    )
    suggested_department_name: Mapped[str | None] = mapped_column(String(100), nullable=True)
    suggested_priority: Mapped[str | None] = mapped_column(String(20), nullable=True)
    suggested_sentiment: Mapped[str | None] = mapped_column(String(20), nullable=True)
    urgency_score: Mapped[int | None] = mapped_column(Integer, nullable=True)  # 0 to 100
    summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    suggested_next_action: Mapped[str | None] = mapped_column(Text, nullable=True)
    confidence_score: Mapped[float | None] = mapped_column(Float, nullable=True)  # 0.0 to 1.0

    raw_response: Mapped[str | None] = mapped_column(Text, nullable=True)
    attempts: Mapped[int] = mapped_column(Integer, default=0, nullable=False)
    error_message: Mapped[str | None] = mapped_column(Text, nullable=True)
    duration_ms: Mapped[int | None] = mapped_column(Integer, nullable=True)

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        server_default=func.now(),
        nullable=False,
    )
    completed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    feedback: Mapped["Feedback"] = relationship("Feedback", back_populates="ai_analysis")
