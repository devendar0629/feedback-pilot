"""Feedback model representing complaints, reports, and suggestions."""
import enum
import uuid
from datetime import datetime
from typing import List, TYPE_CHECKING
from sqlalchemy import Boolean, DateTime, Enum, ForeignKey, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base, GUID, TimestampMixin

if TYPE_CHECKING:
    from app.models.user import User
    from app.models.department import Department
    from app.models.category import Category
    from app.models.tracking import TrackingCredential
    from app.models.ai_analysis import AIAnalysis
    from app.models.comment import Comment
    from app.models.status_history import StatusHistory
    from app.models.audit_log import AuditLog


class FeedbackStatus(str, enum.Enum):
    SUBMITTED = "submitted"
    UNDER_REVIEW = "under_review"
    ASSIGNED = "assigned"
    IN_PROGRESS = "in_progress"
    AWAITING_INFORMATION = "awaiting_information"
    RESOLVED = "resolved"
    CLOSED = "closed"
    REOPENED = "reopened"


class FeedbackPriority(str, enum.Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class FeedbackSentiment(str, enum.Enum):
    POSITIVE = "positive"
    NEUTRAL = "neutral"
    NEGATIVE = "negative"
    MIXED = "mixed"


class Feedback(Base, TimestampMixin):
    __tablename__ = "feedbacks"

    id: Mapped[uuid.UUID] = mapped_column(
        GUID,
        primary_key=True,
        default=uuid.uuid4,
    )
    reference_number: Mapped[str] = mapped_column(
        String(32), unique=True, index=True, nullable=False
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)

    reporter_id: Mapped[uuid.UUID | None] = mapped_column(
        GUID,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    reporter_name: Mapped[str | None] = mapped_column(String(255), nullable=True)
    reporter_email: Mapped[str | None] = mapped_column(String(255), nullable=True, index=True)
    reporter_phone: Mapped[str | None] = mapped_column(String(50), nullable=True)
    location: Mapped[str | None] = mapped_column(String(255), nullable=True)
    is_anonymous: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)

    status: Mapped[FeedbackStatus] = mapped_column(
        Enum(FeedbackStatus, native_enum=False, values_callable=lambda x: [e.value for e in x]),
        default=FeedbackStatus.SUBMITTED,
        index=True,
        nullable=False,
    )
    priority: Mapped[FeedbackPriority] = mapped_column(
        Enum(FeedbackPriority, native_enum=False, values_callable=lambda x: [e.value for e in x]),
        default=FeedbackPriority.MEDIUM,
        index=True,
        nullable=False,
    )
    sentiment: Mapped[FeedbackSentiment | None] = mapped_column(
        Enum(FeedbackSentiment, native_enum=False, values_callable=lambda x: [e.value for e in x]),
        nullable=True,
        index=True,
    )

    department_id: Mapped[uuid.UUID | None] = mapped_column(
        GUID,
        ForeignKey("departments.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    category_id: Mapped[uuid.UUID | None] = mapped_column(
        GUID,
        ForeignKey("categories.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    assigned_to_id: Mapped[uuid.UUID | None] = mapped_column(
        GUID,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )

    resolved_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    closed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

    reporter: Mapped["User | None"] = relationship(
        "User",
        foreign_keys=[reporter_id],
        back_populates="reported_feedbacks",
    )
    assigned_to: Mapped["User | None"] = relationship(
        "User",
        foreign_keys=[assigned_to_id],
        back_populates="assigned_feedbacks",
    )
    department: Mapped["Department | None"] = relationship("Department", back_populates="feedbacks")
    category: Mapped["Category | None"] = relationship("Category", back_populates="feedbacks")
    tracking_credential: Mapped["TrackingCredential | None"] = relationship(
        "TrackingCredential",
        back_populates="feedback",
        uselist=False,
        cascade="all, delete-orphan",
    )
    ai_analysis: Mapped["AIAnalysis | None"] = relationship(
        "AIAnalysis",
        back_populates="feedback",
        uselist=False,
        cascade="all, delete-orphan",
    )
    comments: Mapped[List["Comment"]] = relationship(
        "Comment",
        back_populates="feedback",
        cascade="all, delete-orphan",
        order_by="Comment.created_at.asc()",
    )
    status_history: Mapped[List["StatusHistory"]] = relationship(
        "StatusHistory",
        back_populates="feedback",
        cascade="all, delete-orphan",
        order_by="StatusHistory.created_at.asc()",
    )
    audit_logs: Mapped[List["AuditLog"]] = relationship(
        "AuditLog",
        back_populates="feedback",
    )
