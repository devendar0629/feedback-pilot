"""Unit tests for status transition rules and state machine."""
import pytest
from app.core.exceptions import InvalidStatusTransitionError
from app.models.feedback import Feedback, FeedbackPriority, FeedbackStatus
from app.services.workflow_service import (
    ALLOWED_TRANSITIONS,
    get_allowed_transitions,
    is_valid_transition,
    transition_feedback_status,
)


def test_allowed_transitions_defined():
    """Verify that every status has defined transition rules."""
    for status in FeedbackStatus:
        allowed = get_allowed_transitions(status)
        assert isinstance(allowed, list)


@pytest.mark.parametrize(
    "current,target,expected",
    [
        (FeedbackStatus.SUBMITTED, FeedbackStatus.UNDER_REVIEW, True),
        (FeedbackStatus.SUBMITTED, FeedbackStatus.ASSIGNED, True),
        (FeedbackStatus.SUBMITTED, FeedbackStatus.CLOSED, True),
        (FeedbackStatus.SUBMITTED, FeedbackStatus.RESOLVED, False),  # Cannot resolve immediately
        (FeedbackStatus.UNDER_REVIEW, FeedbackStatus.IN_PROGRESS, True),
        (FeedbackStatus.IN_PROGRESS, FeedbackStatus.RESOLVED, True),
        (FeedbackStatus.RESOLVED, FeedbackStatus.CLOSED, True),
        (FeedbackStatus.RESOLVED, FeedbackStatus.REOPENED, True),
        (FeedbackStatus.RESOLVED, FeedbackStatus.SUBMITTED, False),  # Cannot reset to submitted
        (FeedbackStatus.CLOSED, FeedbackStatus.REOPENED, True),
        (FeedbackStatus.CLOSED, FeedbackStatus.IN_PROGRESS, False),  # Must reopen first
    ],
)
def test_status_transitions_validity(current, target, expected):
    """Test validity check against the finite state machine."""
    assert is_valid_transition(current, target) == expected


@pytest.mark.asyncio
async def test_transition_feedback_status_valid(db_session):
    """Test valid transition updates status and sets timestamp."""
    feedback = Feedback(
        reference_number="FP-2026-TEST01",
        title="Valid Transition Test",
        description="Testing valid transition",
        status=FeedbackStatus.IN_PROGRESS,
        priority=FeedbackPriority.HIGH,
    )
    db_session.add(feedback)
    await db_session.flush()

    assert feedback.resolved_at is None
    await transition_feedback_status(
        db=db_session,
        feedback=feedback,
        target_status=FeedbackStatus.RESOLVED,
        reason="Bug fixed in patch 1.2",
    )

    assert feedback.status == FeedbackStatus.RESOLVED
    assert feedback.resolved_at is not None


@pytest.mark.asyncio
async def test_transition_feedback_status_invalid(db_session):
    """Test invalid transition raises InvalidStatusTransitionError."""
    feedback = Feedback(
        reference_number="FP-2026-TEST02",
        title="Invalid Transition Test",
        description="Testing invalid transition",
        status=FeedbackStatus.SUBMITTED,
        priority=FeedbackPriority.LOW,
    )
    db_session.add(feedback)
    await db_session.flush()

    with pytest.raises(InvalidStatusTransitionError) as exc_info:
        await transition_feedback_status(
            db=db_session,
            feedback=feedback,
            target_status=FeedbackStatus.RESOLVED,  # Invalid directly from SUBMITTED
        )

    assert "Invalid status transition from 'submitted' to 'resolved'" in str(exc_info.value)
