"""Initial database schema for FeedbackPilot

Revision ID: 001_initial_schema
Revises: 
Create Date: 2026-10-10 14:00:00.000000

"""
from typing import Sequence, Union
from alembic import op
import sqlalchemy as sa
from app.models.base import GUID

revision: str = "001_initial_schema"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "departments",
        sa.Column("id", GUID(), nullable=False),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("code", sa.String(length=20), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("code"),
        sa.UniqueConstraint("name"),
    )
    op.create_index("ix_departments_code", "departments", ["code"])
    op.create_index("ix_departments_name", "departments", ["name"])

    op.create_table(
        "categories",
        sa.Column("id", GUID(), nullable=False),
        sa.Column("department_id", GUID(), nullable=True),
        sa.Column("name", sa.String(length=100), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["department_id"], ["departments.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("name"),
    )
    op.create_index("ix_categories_department_id", "categories", ["department_id"])
    op.create_index("ix_categories_name", "categories", ["name"])

    op.create_table(
        "users",
        sa.Column("id", GUID(), nullable=False),
        sa.Column("email", sa.String(length=255), nullable=False),
        sa.Column("hashed_password", sa.String(length=255), nullable=False),
        sa.Column("full_name", sa.String(length=255), nullable=False),
        sa.Column("role", sa.String(length=50), nullable=False, server_default="reporter"),
        sa.Column("department_id", GUID(), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["department_id"], ["departments.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("email"),
    )
    op.create_index("ix_users_email", "users", ["email"])
    op.create_index("ix_users_role", "users", ["role"])
    op.create_index("ix_users_department_id", "users", ["department_id"])

    op.create_table(
        "feedbacks",
        sa.Column("id", GUID(), nullable=False),
        sa.Column("reference_number", sa.String(length=32), nullable=False),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("description", sa.Text(), nullable=False),
        sa.Column("reporter_id", GUID(), nullable=True),
        sa.Column("reporter_name", sa.String(length=255), nullable=True),
        sa.Column("reporter_email", sa.String(length=255), nullable=True),
        sa.Column("reporter_phone", sa.String(length=50), nullable=True),
        sa.Column("location", sa.String(length=255), nullable=True),
        sa.Column("is_anonymous", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("status", sa.String(length=50), nullable=False, server_default="submitted"),
        sa.Column("priority", sa.String(length=20), nullable=False, server_default="medium"),
        sa.Column("sentiment", sa.String(length=20), nullable=True),
        sa.Column("department_id", GUID(), nullable=True),
        sa.Column("category_id", GUID(), nullable=True),
        sa.Column("assigned_to_id", GUID(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("resolved_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("closed_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["assigned_to_id"], ["users.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["category_id"], ["categories.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["department_id"], ["departments.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["reporter_id"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("reference_number"),
    )
    op.create_index("ix_feedbacks_reference_number", "feedbacks", ["reference_number"])
    op.create_index("ix_feedbacks_reporter_email", "feedbacks", ["reporter_email"])
    op.create_index("ix_feedbacks_reporter_id", "feedbacks", ["reporter_id"])
    op.create_index("ix_feedbacks_status", "feedbacks", ["status"])
    op.create_index("ix_feedbacks_priority", "feedbacks", ["priority"])
    op.create_index("ix_feedbacks_sentiment", "feedbacks", ["sentiment"])
    op.create_index("ix_feedbacks_department_id", "feedbacks", ["department_id"])
    op.create_index("ix_feedbacks_category_id", "feedbacks", ["category_id"])
    op.create_index("ix_feedbacks_assigned_to_id", "feedbacks", ["assigned_to_id"])
    op.create_index("ix_feedbacks_created_at", "feedbacks", ["created_at"])

    op.create_table(
        "tracking_credentials",
        sa.Column("id", GUID(), nullable=False),
        sa.Column("feedback_id", GUID(), nullable=False),
        sa.Column("tracking_token_hash", sa.String(length=255), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["feedback_id"], ["feedbacks.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("feedback_id"),
    )
    op.create_index("ix_tracking_credentials_feedback_id", "tracking_credentials", ["feedback_id"])

    op.create_table(
        "ai_analyses",
        sa.Column("id", GUID(), nullable=False),
        sa.Column("feedback_id", GUID(), nullable=False),
        sa.Column("status", sa.String(length=50), nullable=False, server_default="pending"),
        sa.Column("model_name", sa.String(length=100), nullable=True),
        sa.Column("suggested_category_id", GUID(), nullable=True),
        sa.Column("suggested_category_name", sa.String(length=100), nullable=True),
        sa.Column("suggested_department_id", GUID(), nullable=True),
        sa.Column("suggested_department_name", sa.String(length=100), nullable=True),
        sa.Column("suggested_priority", sa.String(length=20), nullable=True),
        sa.Column("suggested_sentiment", sa.String(length=20), nullable=True),
        sa.Column("urgency_score", sa.Integer(), nullable=True),
        sa.Column("summary", sa.Text(), nullable=True),
        sa.Column("suggested_next_action", sa.Text(), nullable=True),
        sa.Column("confidence_score", sa.Float(), nullable=True),
        sa.Column("raw_response", sa.Text(), nullable=True),
        sa.Column("attempts", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("error_message", sa.Text(), nullable=True),
        sa.Column("duration_ms", sa.Integer(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("completed_at", sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(["feedback_id"], ["feedbacks.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["suggested_category_id"], ["categories.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["suggested_department_id"], ["departments.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("feedback_id"),
    )
    op.create_index("ix_ai_analyses_feedback_id", "ai_analyses", ["feedback_id"])
    op.create_index("ix_ai_analyses_status", "ai_analyses", ["status"])

    op.create_table(
        "comments",
        sa.Column("id", GUID(), nullable=False),
        sa.Column("feedback_id", GUID(), nullable=False),
        sa.Column("author_id", GUID(), nullable=True),
        sa.Column("author_name", sa.String(length=255), nullable=False),
        sa.Column("is_internal", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["author_id"], ["users.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["feedback_id"], ["feedbacks.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_comments_feedback_id", "comments", ["feedback_id"])
    op.create_index("ix_comments_is_internal", "comments", ["is_internal"])

    op.create_table(
        "status_histories",
        sa.Column("id", GUID(), nullable=False),
        sa.Column("feedback_id", GUID(), nullable=False),
        sa.Column("from_status", sa.String(length=50), nullable=True),
        sa.Column("to_status", sa.String(length=50), nullable=False),
        sa.Column("changed_by_id", GUID(), nullable=True),
        sa.Column("changed_by_name", sa.String(length=255), nullable=True),
        sa.Column("reason", sa.Text(), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["changed_by_id"], ["users.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["feedback_id"], ["feedbacks.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_status_histories_feedback_id", "status_histories", ["feedback_id"])

    op.create_table(
        "audit_logs",
        sa.Column("id", GUID(), nullable=False),
        sa.Column("feedback_id", GUID(), nullable=True),
        sa.Column("user_id", GUID(), nullable=True),
        sa.Column("user_email", sa.String(length=255), nullable=True),
        sa.Column("action", sa.String(length=100), nullable=False),
        sa.Column("details", sa.Text(), nullable=True),
        sa.Column("ip_address", sa.String(length=45), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["feedback_id"], ["feedbacks.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="SET NULL"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_audit_logs_action", "audit_logs", ["action"])
    op.create_index("ix_audit_logs_created_at", "audit_logs", ["created_at"])
    op.create_index("ix_audit_logs_feedback_id", "audit_logs", ["feedback_id"])

    op.create_table(
        "notifications",
        sa.Column("id", GUID(), nullable=False),
        sa.Column("user_id", GUID(), nullable=False),
        sa.Column("feedback_id", GUID(), nullable=True),
        sa.Column("title", sa.String(length=255), nullable=False),
        sa.Column("message", sa.Text(), nullable=False),
        sa.Column("notification_type", sa.String(length=50), nullable=False),
        sa.Column("is_read", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.ForeignKeyConstraint(["feedback_id"], ["feedbacks.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_notifications_is_read", "notifications", ["is_read"])
    op.create_index("ix_notifications_user_id", "notifications", ["user_id"])

    op.create_table(
        "system_settings",
        sa.Column("key", sa.String(length=100), nullable=False),
        sa.Column("value", sa.String(length=255), nullable=False),
        sa.Column("description", sa.String(length=255), nullable=True),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.PrimaryKeyConstraint("key"),
    )


def downgrade() -> None:
    op.drop_table("system_settings")
    op.drop_table("notifications")
    op.drop_table("audit_logs")
    op.drop_table("status_histories")
    op.drop_table("comments")
    op.drop_table("ai_analyses")
    op.drop_table("tracking_credentials")
    op.drop_table("feedbacks")
    op.drop_table("users")
    op.drop_table("categories")
    op.drop_table("departments")
