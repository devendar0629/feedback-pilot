"""Feedback status workflow state machine and transition rules."""
from datetime import datetime, timezone
from typing import Dict, List, Optional
import uuid
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.exceptions import InvalidStatusTransitionError
from app.models.feedback import Feedback, FeedbackStatus
from app.models.status_history import StatusHistory
from app.models.user import User

ALLOWED_TRANSITIONS: Dict[FeedbackStatus, List[FeedbackStatus]] = {
    FeedbackStatus.SUBMITTED: [
        FeedbackStatus.UNDER_REVIEW,
        FeedbackStatus.ASSIGNED,
        FeedbackStatus.CLOSED,
    ],
    FeedbackStatus.UNDER_REVIEW: [
        FeedbackStatus.ASSIGNED,
        FeedbackStatus.IN_PROGRESS,
        FeedbackStatus.AWAITING_INFORMATION,
        FeedbackStatus.RESOLVED,
        FeedbackStatus.CLOSED,
    ],
    FeedbackStatus.ASSIGNED: [
        FeedbackStatus.IN_PROGRESS,
        FeedbackStatus.UNDER_REVIEW,
        FeedbackStatus.AWAITING_INFORMATION,
        FeedbackStatus.RESOLVED,
        FeedbackStatus.CLOSED,
    ],
    FeedbackStatus.IN_PROGRESS: [
        FeedbackStatus.AWAITING_INFORMATION,
        FeedbackStatus.RESOLVED,
        FeedbackStatus.UNDER_REVIEW,
        FeedbackStatus.CLOSED,
    ],
    FeedbackStatus.AWAITING_INFORMATION: [
        FeedbackStatus.IN_PROGRESS,
        FeedbackStatus.UNDER_REVIEW,
        FeedbackStatus.RESOLVED,
        FeedbackStatus.CLOSED,
    ],
    FeedbackStatus.RESOLVED: [
        FeedbackStatus.CLOSED,
        FeedbackStatus.REOPENED,
    ],
    FeedbackStatus.CLOSED: [
        FeedbackStatus.REOPENED,
    ],
    FeedbackStatus.REOPENED: [
        FeedbackStatus.IN_PROGRESS,
        FeedbackStatus.ASSIGNED,
        FeedbackStatus.UNDER_REVIEW,
    ],
}


def is_valid_transition(current: FeedbackStatus, target: FeedbackStatus) -> bool:
    """Check if transitioning from current to target status is permitted."""
    if current == target:
        return True
    allowed = ALLOWED_TRANSITIONS.get(current, [])
    return target in allowed


def get_allowed_transitions(current: FeedbackStatus) -> List[FeedbackStatus]:
    """Return all permissible target statuses for the given current status."""
    return ALLOWED_TRANSITIONS.get(current, [])


async def transition_feedback_status(
    db: AsyncSession,
    feedback: Feedback,
    target_status: FeedbackStatus,
    changed_by: Optional[User] = None,
    reason: Optional[str] = None,
) -> Feedback:
    """Validate and execute a feedback status transition, creating a status history record."""
    current_status = feedback.status
    if current_status == target_status:
        return feedback

    if not is_valid_transition(current_status, target_status):
        raise InvalidStatusTransitionError(
            current_status=current_status.value,
            target_status=target_status.value,
            allowed_transitions=[s.value for s in get_allowed_transitions(current_status)],
        )

    now = datetime.now(timezone.utc)
    from_status_val = feedback.status.value
    feedback.status = target_status

    if target_status == FeedbackStatus.RESOLVED:
        if not feedback.resolved_at:
            feedback.resolved_at = now
    elif target_status == FeedbackStatus.CLOSED:
        if not feedback.closed_at:
            feedback.closed_at = now
    elif target_status == FeedbackStatus.REOPENED:
        feedback.resolved_at = None
        feedback.closed_at = None

    history = StatusHistory(
        feedback_id=feedback.id,
        from_status=from_status_val,
        to_status=target_status.value,
        changed_by_id=changed_by.id if changed_by else None,
        changed_by_name=changed_by.full_name if changed_by else "System",
        reason=reason,
        created_at=now,
    )
    db.add(history)
    return feedback
