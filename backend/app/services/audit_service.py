"""Audit logging service for security, lifecycle, and administrative events."""
import json
import uuid
from typing import Any, Dict, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.audit_log import AuditLog
from app.models.user import User


async def log_audit_event(
    db: AsyncSession,
    action: str,
    feedback_id: Optional[uuid.UUID] = None,
    user: Optional[User] = None,
    details: Optional[Dict[str, Any]] = None,
    ip_address: Optional[str] = None,
) -> AuditLog:
    """Record an audit trail event."""
    log_entry = AuditLog(
        feedback_id=feedback_id,
        user_id=user.id if user else None,
        user_email=user.email if user else None,
        action=action,
        details=json.dumps(details) if details else None,
        ip_address=ip_address,
    )
    db.add(log_entry)
    return log_entry
