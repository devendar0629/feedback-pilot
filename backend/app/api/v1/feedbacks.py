"""Feedback management, triage, assignment, and status transitions API."""
import uuid
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.deps import get_current_user, get_db, require_roles
from app.core.exceptions import (
    EntityNotFoundError,
    InvalidStatusTransitionError,
    UnauthorizedAccessError,
)
from app.models.feedback import FeedbackPriority, FeedbackSentiment, FeedbackStatus
from app.models.user import User, UserRole
from app.schemas.common import PaginatedResponse
from app.schemas.feedback import (
    ApplyAISuggestionsRequest,
    AssignmentRequest,
    FeedbackDetailRead,
    FeedbackRead,
    FeedbackUpdate,
    StatusTransitionRequest,
)
from app.services.feedback_service import (
    apply_ai_suggestions,
    assign_feedback,
    get_feedback_by_id,
    list_feedbacks,
    update_feedback,
)
from app.services.workflow_service import transition_feedback_status

router = APIRouter(prefix="/feedbacks", tags=["Feedback Management"])


@router.get("", response_model=PaginatedResponse[FeedbackRead])
async def list_feedback_items(
    page: int = Query(1, ge=1),
    size: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None),
    status: Optional[FeedbackStatus] = Query(None),
    priority: Optional[FeedbackPriority] = Query(None),
    sentiment: Optional[FeedbackSentiment] = Query(None),
    department_id: Optional[uuid.UUID] = Query(None),
    category_id: Optional[uuid.UUID] = Query(None),
    assigned_to_id: Optional[uuid.UUID] = Query(None),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve paginated feedbacks with filters, searching, and role-based permissions."""
    items, total, pages = await list_feedbacks(
        db=db,
        current_user=current_user,
        page=page,
        size=size,
        search=search,
        status=status,
        priority=priority,
        sentiment=sentiment,
        department_id=department_id,
        category_id=category_id,
        assigned_to_id=assigned_to_id,
    )
    return PaginatedResponse(
        items=items,
        total=total,
        page=page,
        size=size,
        pages=pages,
    )


@router.get("/{feedback_id}", response_model=FeedbackDetailRead)
async def get_feedback_detail(
    feedback_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Get full feedback details, AI suggestions, comments, and status history."""
    try:
        feedback = await get_feedback_by_id(db, feedback_id, current_user)
    except EntityNotFoundError as err:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(err))
    except UnauthorizedAccessError as err:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(err))

    visible_comments = []
    for c in feedback.comments:
        if current_user.role == UserRole.REPORTER and c.is_internal:
            continue
        visible_comments.append(c)

    return FeedbackDetailRead(
        id=feedback.id,
        reference_number=feedback.reference_number,
        title=feedback.title,
        description=feedback.description,
        reporter_id=feedback.reporter_id,
        reporter_name=feedback.reporter_name,
        reporter_email=feedback.reporter_email,
        reporter_phone=feedback.reporter_phone,
        location=feedback.location,
        is_anonymous=feedback.is_anonymous,
        status=feedback.status,
        priority=feedback.priority,
        sentiment=feedback.sentiment,
        department_id=feedback.department_id,
        department_name=feedback.department.name if feedback.department else None,
        category_id=feedback.category_id,
        category_name=feedback.category.name if feedback.category else None,
        assigned_to_id=feedback.assigned_to_id,
        assigned_to_name=feedback.assigned_to.full_name if feedback.assigned_to else None,
        created_at=feedback.created_at,
        updated_at=feedback.updated_at,
        resolved_at=feedback.resolved_at,
        closed_at=feedback.closed_at,
        comment_count=len(visible_comments),
        ai_status=feedback.ai_analysis.status.value if feedback.ai_analysis else None,
        ai_analysis=feedback.ai_analysis if current_user.role in (UserRole.ADMINISTRATOR, UserRole.AGENT) else None,
        comments=visible_comments,
        status_history=feedback.status_history,
    )


@router.patch("/{feedback_id}", response_model=FeedbackRead)
async def update_feedback_details(
    feedback_id: uuid.UUID,
    update_in: FeedbackUpdate,
    current_user: User = Depends(require_roles([UserRole.ADMINISTRATOR, UserRole.AGENT])),
    db: AsyncSession = Depends(get_db),
):
    """Update feedback properties (priority, category, department, etc.)."""
    try:
        feedback = await update_feedback(db, feedback_id, update_in, current_user)
        return feedback
    except EntityNotFoundError as err:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(err))
    except UnauthorizedAccessError as err:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(err))


@router.post("/{feedback_id}/transition", response_model=FeedbackRead)
async def transition_status(
    feedback_id: uuid.UUID,
    payload: StatusTransitionRequest,
    current_user: User = Depends(require_roles([UserRole.ADMINISTRATOR, UserRole.AGENT])),
    db: AsyncSession = Depends(get_db),
):
    """Validate and execute a status transition according to the workflow finite state machine."""
    try:
        feedback = await get_feedback_by_id(db, feedback_id, current_user)
        await transition_feedback_status(
            db=db,
            feedback=feedback,
            target_status=payload.target_status,
            changed_by=current_user,
            reason=payload.reason,
        )
        await db.commit()
        return feedback
    except EntityNotFoundError as err:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(err))
    except InvalidStatusTransitionError as err:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(err),
        )


@router.post("/{feedback_id}/assign", response_model=FeedbackRead)
async def assign_ticket(
    feedback_id: uuid.UUID,
    payload: AssignmentRequest,
    current_user: User = Depends(require_roles([UserRole.ADMINISTRATOR, UserRole.AGENT])),
    db: AsyncSession = Depends(get_db),
):
    """Assign feedback to a department and/or agent."""
    try:
        feedback = await assign_feedback(db, feedback_id, payload, current_user)
        return feedback
    except EntityNotFoundError as err:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(err))
    except UnauthorizedAccessError as err:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(err))


@router.post("/{feedback_id}/apply-ai", response_model=FeedbackRead)
async def apply_ai_recommendations(
    feedback_id: uuid.UUID,
    payload: ApplyAISuggestionsRequest,
    current_user: User = Depends(require_roles([UserRole.ADMINISTRATOR, UserRole.AGENT])),
    db: AsyncSession = Depends(get_db),
):
    """Apply Gemini AI suggested department, category, priority, and sentiment."""
    try:
        feedback = await apply_ai_suggestions(db, feedback_id, payload, current_user)
        return feedback
    except EntityNotFoundError as err:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(err))
    except (ValueError, UnauthorizedAccessError) as err:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(err))
