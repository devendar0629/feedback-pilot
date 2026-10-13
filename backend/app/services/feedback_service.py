"""Feedback management, tracking, assignment, and query service."""
import math
import uuid
from typing import Any, Dict, List, Optional, Tuple
from sqlalchemy import and_, desc, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from app.core.background import enqueue_ai_analysis
from app.core.exceptions import (
    EntityNotFoundError,
    TrackingVerificationError,
    UnauthorizedAccessError,
)
from app.core.security import (
    generate_reference_number,
    generate_tracking_secret,
    hash_tracking_secret,
    verify_tracking_secret,
)
from app.models.ai_analysis import AIAnalysis, AIAnalysisStatus
from app.models.category import Category
from app.models.comment import Comment
from app.models.department import Department
from app.models.feedback import Feedback, FeedbackPriority, FeedbackSentiment, FeedbackStatus
from app.models.status_history import StatusHistory
from app.models.tracking import TrackingCredential
from app.models.user import User, UserRole
from app.schemas.feedback import (
    ApplyAISuggestionsRequest,
    AssignmentRequest,
    FeedbackRead,
    FeedbackSubmissionResponse,
    FeedbackUpdate,
    PublicFeedbackSubmit,
    StatusTransitionRequest,
)
from app.schemas.tracking import PublicTrackingResponse
from app.services.audit_service import log_audit_event
from app.services.comment_service import get_feedback_comments
from app.services.notification_service import create_notification
from app.services.workflow_service import transition_feedback_status


async def create_public_feedback(
    db: AsyncSession,
    submit_in: PublicFeedbackSubmit,
    current_user: Optional[User] = None,
    ip_address: Optional[str] = None,
) -> FeedbackSubmissionResponse:
    """Submit feedback, generate unpredictable reference number and secret tracking credentials."""
    ref_number = generate_reference_number()
    tracking_secret = generate_tracking_secret()
    secret_hash = hash_tracking_secret(tracking_secret)

    reporter_id = current_user.id if current_user else None
    reporter_name = submit_in.reporter_name
    reporter_email = submit_in.reporter_email
    if current_user and not submit_in.is_anonymous:
        reporter_name = current_user.full_name
        reporter_email = current_user.email

    feedback = Feedback(
        reference_number=ref_number,
        title=submit_in.title,
        description=submit_in.description,
        reporter_id=reporter_id,
        reporter_name=reporter_name,
        reporter_email=reporter_email,
        reporter_phone=submit_in.reporter_phone,
        location=submit_in.location,
        is_anonymous=submit_in.is_anonymous,
        status=FeedbackStatus.SUBMITTED,
        priority=FeedbackPriority.MEDIUM,
        category_id=submit_in.category_id,
        department_id=submit_in.department_id,
    )
    db.add(feedback)
    await db.flush()

    cred = TrackingCredential(
        feedback_id=feedback.id,
        tracking_token_hash=secret_hash,
    )
    db.add(cred)

    ai_record = AIAnalysis(
        feedback_id=feedback.id,
        status=AIAnalysisStatus.PENDING,
    )
    db.add(ai_record)

    initial_history = StatusHistory(
        feedback_id=feedback.id,
        from_status=None,
        to_status=FeedbackStatus.SUBMITTED.value,
        changed_by_name=reporter_name or "Public Reporter",
        reason="Initial public submission",
    )
    db.add(initial_history)

    await log_audit_event(
        db=db,
        action="FEEDBACK_SUBMITTED",
        feedback_id=feedback.id,
        user=current_user,
        details={
            "reference_number": ref_number,
            "title": feedback.title,
            "is_anonymous": feedback.is_anonymous,
        },
        ip_address=ip_address,
    )
    await db.commit()

    await enqueue_ai_analysis(feedback.id)

    return FeedbackSubmissionResponse(
        id=feedback.id,
        reference_number=ref_number,
        tracking_secret=tracking_secret,
        title=feedback.title,
        status=feedback.status,
        priority=feedback.priority,
        created_at=feedback.created_at,
    )


async def verify_and_track_feedback(
    db: AsyncSession,
    reference_number: str,
    tracking_secret: str,
) -> PublicTrackingResponse:
    """Securely look up feedback by reference number and verify against stored tracking hash."""
    stmt = (
        select(Feedback)
        .options(
            selectinload(Feedback.tracking_credential),
            selectinload(Feedback.department),
            selectinload(Feedback.category),
            selectinload(Feedback.status_history),
        )
        .where(Feedback.reference_number == reference_number.strip().upper())
    )
    result = await db.execute(stmt)
    feedback = result.scalar_one_or_none()

    if not feedback or not feedback.tracking_credential:
        raise TrackingVerificationError("Invalid reference number or tracking secret.")

    if not verify_tracking_secret(tracking_secret.strip(), feedback.tracking_credential.tracking_token_hash):
        raise TrackingVerificationError("Invalid reference number or tracking secret.")

    public_comments = await get_feedback_comments(db, feedback.id, include_internal=False)

    return PublicTrackingResponse(
        id=feedback.id,
        reference_number=feedback.reference_number,
        title=feedback.title,
        description=feedback.description,
        status=feedback.status,
        priority=feedback.priority,
        department_name=feedback.department.name if feedback.department else None,
        category_name=feedback.category.name if feedback.category else None,
        location=feedback.location,
        created_at=feedback.created_at,
        updated_at=feedback.updated_at,
        resolved_at=feedback.resolved_at,
        closed_at=feedback.closed_at,
        timeline=feedback.status_history,
        public_comments=public_comments,
    )


async def get_feedback_by_id(
    db: AsyncSession,
    feedback_id: uuid.UUID,
    current_user: Optional[User] = None,
) -> Feedback:
    """Retrieve full feedback record with role-based access checks."""
    stmt = (
        select(Feedback)
        .options(
            selectinload(Feedback.department),
            selectinload(Feedback.category),
            selectinload(Feedback.assigned_to),
            selectinload(Feedback.ai_analysis),
            selectinload(Feedback.comments),
            selectinload(Feedback.status_history),
        )
        .where(Feedback.id == feedback_id)
    )
    result = await db.execute(stmt)
    feedback = result.scalar_one_or_none()

    if not feedback:
        raise EntityNotFoundError(f"Feedback with id {feedback_id} not found.")

    if current_user:
        if current_user.role == UserRole.REPORTER:
            if feedback.reporter_id != current_user.id:
                raise UnauthorizedAccessError("You are not authorized to view this feedback.")

    return feedback


async def list_feedbacks(
    db: AsyncSession,
    current_user: User,
    page: int = 1,
    size: int = 20,
    search: Optional[str] = None,
    status: Optional[FeedbackStatus] = None,
    priority: Optional[FeedbackPriority] = None,
    sentiment: Optional[FeedbackSentiment] = None,
    department_id: Optional[uuid.UUID] = None,
    category_id: Optional[uuid.UUID] = None,
    assigned_to_id: Optional[uuid.UUID] = None,
) -> Tuple[List[FeedbackRead], int, int]:
    """Search, filter, paginate, and enforce role-based access for feedbacks."""
    conditions = []

    if current_user.role == UserRole.REPORTER:
        conditions.append(Feedback.reporter_id == current_user.id)
    elif current_user.role == UserRole.AGENT:
        if current_user.department_id:
            conditions.append(
                or_(
                    Feedback.assigned_to_id == current_user.id,
                    Feedback.department_id == current_user.department_id,
                )
            )

    if status:
        conditions.append(Feedback.status == status)
    if priority:
        conditions.append(Feedback.priority == priority)
    if sentiment:
        conditions.append(Feedback.sentiment == sentiment)
    if department_id:
        conditions.append(Feedback.department_id == department_id)
    if category_id:
        conditions.append(Feedback.category_id == category_id)
    if assigned_to_id:
        conditions.append(Feedback.assigned_to_id == assigned_to_id)

    if search and search.strip():
        term = f"%{search.strip().lower()}%"
        conditions.append(
            or_(
                func.lower(Feedback.title).like(term),
                func.lower(Feedback.description).like(term),
                func.lower(Feedback.reference_number).like(term),
                func.lower(Feedback.reporter_email).like(term),
                func.lower(Feedback.reporter_name).like(term),
            )
        )

    count_stmt = select(func.count(Feedback.id))
    if conditions:
        count_stmt = count_stmt.where(and_(*conditions))
    count_res = await db.execute(count_stmt)
    total = count_res.scalar_one()

    pages = math.ceil(total / size) if total > 0 else 1
    offset = (page - 1) * size

    data_stmt = (
        select(Feedback)
        .options(
            selectinload(Feedback.department),
            selectinload(Feedback.category),
            selectinload(Feedback.assigned_to),
            selectinload(Feedback.ai_analysis),
            selectinload(Feedback.comments),
        )
        .order_by(desc(Feedback.created_at))
        .offset(offset)
        .limit(size)
    )
    if conditions:
        data_stmt = data_stmt.where(and_(*conditions))

    result = await db.execute(data_stmt)
    feedbacks = result.scalars().all()

    items = []
    for f in feedbacks:
        items.append(
            FeedbackRead(
                id=f.id,
                reference_number=f.reference_number,
                title=f.title,
                description=f.description,
                reporter_id=f.reporter_id,
                reporter_name=f.reporter_name,
                reporter_email=f.reporter_email,
                reporter_phone=f.reporter_phone,
                location=f.location,
                is_anonymous=f.is_anonymous,
                status=f.status,
                priority=f.priority,
                sentiment=f.sentiment,
                department_id=f.department_id,
                department_name=f.department.name if f.department else None,
                category_id=f.category_id,
                category_name=f.category.name if f.category else None,
                assigned_to_id=f.assigned_to_id,
                assigned_to_name=f.assigned_to.full_name if f.assigned_to else None,
                created_at=f.created_at,
                updated_at=f.updated_at,
                resolved_at=f.resolved_at,
                closed_at=f.closed_at,
                comment_count=len(f.comments) if hasattr(f, "comments") and f.comments else 0,
                ai_status=f.ai_analysis.status.value if f.ai_analysis else None,
            )
        )

    return items, total, pages


async def update_feedback(
    db: AsyncSession,
    feedback_id: uuid.UUID,
    update_in: FeedbackUpdate,
    current_user: User,
) -> Feedback:
    """Update general feedback attributes with role permission checks."""
    feedback = await get_feedback_by_id(db, feedback_id, current_user)

    if current_user.role == UserRole.REPORTER:
        raise UnauthorizedAccessError("Reporters cannot modify ticket classifications.")

    updates = update_in.model_dump(exclude_unset=True)
    for field, val in updates.items():
        setattr(feedback, field, val)

    await log_audit_event(
        db=db,
        action="FEEDBACK_UPDATED",
        feedback_id=feedback.id,
        user=current_user,
        details=updates,
    )
    await db.commit()
    return feedback


async def assign_feedback(
    db: AsyncSession,
    feedback_id: uuid.UUID,
    assign_in: AssignmentRequest,
    current_user: User,
) -> Feedback:
    """Assign feedback to a department and/or agent."""
    if current_user.role not in (UserRole.ADMINISTRATOR, UserRole.AGENT):
        raise UnauthorizedAccessError("Only staff can assign feedback.")

    feedback = await get_feedback_by_id(db, feedback_id, current_user)

    old_dept = feedback.department_id
    old_agent = feedback.assigned_to_id

    if assign_in.department_id is not None:
        feedback.department_id = assign_in.department_id
    if assign_in.assigned_to_id is not None:
        feedback.assigned_to_id = assign_in.assigned_to_id

    if feedback.status in (FeedbackStatus.SUBMITTED, FeedbackStatus.UNDER_REVIEW):
        if feedback.assigned_to_id or feedback.department_id:
            await transition_feedback_status(
                db=db,
                feedback=feedback,
                target_status=FeedbackStatus.ASSIGNED,
                changed_by=current_user,
                reason=assign_in.note or "Assigned to department/agent",
            )

    if feedback.assigned_to_id and feedback.assigned_to_id != old_agent:
        await create_notification(
            db=db,
            user_id=feedback.assigned_to_id,
            feedback_id=feedback.id,
            title="Ticket Assigned",
            message=f"You have been assigned ticket {feedback.reference_number}: {feedback.title}",
            notification_type="ASSIGNMENT",
        )

    await log_audit_event(
        db=db,
        action="FEEDBACK_ASSIGNED",
        feedback_id=feedback.id,
        user=current_user,
        details={
            "department_id": str(feedback.department_id) if feedback.department_id else None,
            "assigned_to_id": str(feedback.assigned_to_id) if feedback.assigned_to_id else None,
            "note": assign_in.note,
        },
    )
    await db.commit()
    return feedback


async def apply_ai_suggestions(
    db: AsyncSession,
    feedback_id: uuid.UUID,
    apply_in: ApplyAISuggestionsRequest,
    current_user: User,
) -> Feedback:
    """Approve and apply Gemini AI suggestions to the feedback record."""
    if current_user.role not in (UserRole.ADMINISTRATOR, UserRole.AGENT):
        raise UnauthorizedAccessError("Only staff can apply AI suggestions.")

    feedback = await get_feedback_by_id(db, feedback_id, current_user)
    if not feedback.ai_analysis:
        raise ValueError("No AI analysis found for this feedback.")

    ai = feedback.ai_analysis
    applied = {}

    if apply_in.apply_category and ai.suggested_category_id:
        feedback.category_id = ai.suggested_category_id
        applied["category_id"] = str(ai.suggested_category_id)

    if apply_in.apply_department and ai.suggested_department_id:
        feedback.department_id = ai.suggested_department_id
        applied["department_id"] = str(ai.suggested_department_id)

    if apply_in.apply_priority and ai.suggested_priority:
        try:
            feedback.priority = FeedbackPriority(ai.suggested_priority)
            applied["priority"] = ai.suggested_priority
        except ValueError:
            pass

    if apply_in.apply_sentiment and ai.suggested_sentiment:
        try:
            feedback.sentiment = FeedbackSentiment(ai.suggested_sentiment)
            applied["sentiment"] = ai.suggested_sentiment
        except ValueError:
            pass

    await log_audit_event(
        db=db,
        action="AI_SUGGESTIONS_APPLIED",
        feedback_id=feedback.id,
        user=current_user,
        details=applied,
    )
    await db.commit()
    return feedback
