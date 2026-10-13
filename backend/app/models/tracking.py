"""Tracking credentials model for secure anonymous and public verification."""
import uuid
from datetime import datetime, timezone
from typing import TYPE_CHECKING
from sqlalchemy import DateTime, ForeignKey, String, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base, GUID

if TYPE_CHECKING:
    from app.models.feedback import Feedback


class TrackingCredential(Base):
    __tablename__ = "tracking_credentials"

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
    tracking_token_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        server_default=func.now(),
        nullable=False,
    )

    feedback: Mapped["Feedback"] = relationship("Feedback", back_populates="tracking_credential")
