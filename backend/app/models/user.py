"""User model supporting administrator, agent, and reporter roles."""
import enum
import uuid
from typing import List, TYPE_CHECKING
from sqlalchemy import Boolean, Enum, ForeignKey, String
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base, GUID, TimestampMixin

if TYPE_CHECKING:
    from app.models.department import Department
    from app.models.feedback import Feedback
    from app.models.comment import Comment
    from app.models.notification import Notification


class UserRole(str, enum.Enum):
    ADMINISTRATOR = "administrator"
    AGENT = "agent"
    REPORTER = "reporter"


class User(Base, TimestampMixin):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        GUID,
        primary_key=True,
        default=uuid.uuid4,
    )
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(
        Enum(UserRole, native_enum=False, values_callable=lambda x: [e.value for e in x]),
        default=UserRole.REPORTER,
        index=True,
        nullable=False,
    )
    department_id: Mapped[uuid.UUID | None] = mapped_column(
        GUID,
        ForeignKey("departments.id", ondelete="SET NULL"),
        nullable=True,
        index=True,
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)

    department: Mapped["Department | None"] = relationship("Department", back_populates="users")
    reported_feedbacks: Mapped[List["Feedback"]] = relationship(
        "Feedback",
        foreign_keys="Feedback.reporter_id",
        back_populates="reporter",
    )
    assigned_feedbacks: Mapped[List["Feedback"]] = relationship(
        "Feedback",
        foreign_keys="Feedback.assigned_to_id",
        back_populates="assigned_to",
    )
    comments: Mapped[List["Comment"]] = relationship("Comment", back_populates="author")
    notifications: Mapped[List["Notification"]] = relationship("Notification", back_populates="user")
