"""Analytics service computing live dashboard metrics from PostgreSQL."""
from datetime import datetime, timedelta, timezone
from typing import List
from sqlalchemy import and_, case, desc, func, not_, select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.ai_analysis import AIAnalysis, AIAnalysisStatus
from app.models.category import Category
from app.models.department import Department
from app.models.feedback import Feedback, FeedbackPriority, FeedbackSentiment, FeedbackStatus
from app.schemas.ai import AIStatsRead
from app.schemas.analytics import (
    DashboardAnalyticsResponse,
    DashboardSummary,
    DepartmentWorkloadItem,
    DistributionItem,
    TrendItem,
)


async def get_dashboard_analytics(db: AsyncSession) -> DashboardAnalyticsResponse:
    """Calculate live dashboard KPIs and distributions using SQL aggregations."""
    now = datetime.now(timezone.utc)
    overdue_threshold = now - timedelta(days=7)

    summary_stmt = select(
        func.count(Feedback.id).label("total"),
        func.count(
            case((Feedback.status.notin_([FeedbackStatus.RESOLVED, FeedbackStatus.CLOSED]), 1))
        ).label("unresolved"),
        func.count(case((Feedback.status == FeedbackStatus.SUBMITTED, 1))).label("new_cnt"),
        func.count(case((Feedback.status == FeedbackStatus.IN_PROGRESS, 1))).label("in_progress"),
        func.count(case((Feedback.status == FeedbackStatus.RESOLVED, 1))).label("resolved"),
        func.count(case((Feedback.status == FeedbackStatus.CLOSED, 1))).label("closed"),
        func.count(
            case(
                (
                    and_(
                        Feedback.status.notin_([FeedbackStatus.RESOLVED, FeedbackStatus.CLOSED]),
                        Feedback.created_at < overdue_threshold,
                    ),
                    1,
                )
            )
        ).label("overdue"),
    )
    res = await db.execute(summary_stmt)
    total, unresolved, new_cnt, in_prog, resolved_cnt, closed_cnt, overdue_cnt = res.one()

    avg_res_stmt = (
        select(
            func.avg(
                func.extract("epoch", Feedback.resolved_at) - func.extract("epoch", Feedback.created_at)
            )
        )
        .where(
            and_(
                Feedback.status.in_([FeedbackStatus.RESOLVED, FeedbackStatus.CLOSED]),
                Feedback.resolved_at.isnot(None),
            )
        )
    )
    avg_res_val = await db.scalar(avg_res_stmt)
    avg_hours = round(float(avg_res_val) / 3600.0, 1) if avg_res_val is not None else 0.0

    summary = DashboardSummary(
        total_submissions=total or 0,
        unresolved_count=unresolved or 0,
        new_count=new_cnt or 0,
        in_progress_count=in_prog or 0,
        resolved_count=resolved_cnt or 0,
        closed_count=closed_cnt or 0,
        overdue_count=overdue_cnt or 0,
        avg_resolution_time_hours=avg_hours,
    )

    fourteen_days_ago = now - timedelta(days=14)
    trend_stmt = (
        select(
            func.date(Feedback.created_at).label("day"),
            func.count(Feedback.id).label("total"),
            func.count(case((Feedback.status == FeedbackStatus.RESOLVED, 1))).label("resolved"),
        )
        .where(Feedback.created_at >= fourteen_days_ago)
        .group_by(func.date(Feedback.created_at))
        .order_by(func.date(Feedback.created_at))
    )
    trend_res = await db.execute(trend_stmt)
    trend_rows = trend_res.all()
    trends = [
        TrendItem(
            date=str(row.day),
            total_submissions=row.total,
            resolved_submissions=row.resolved,
        )
        for row in trend_rows
    ]

    cat_stmt = (
        select(
            Category.name,
            func.count(Feedback.id).label("count"),
        )
        .join(Feedback, Feedback.category_id == Category.id)
        .group_by(Category.name)
        .order_by(desc("count"))
    )
    cat_res = await db.execute(cat_stmt)
    cat_rows = cat_res.all()
    category_dist = [
        DistributionItem(
            name=row.name,
            count=row.count,
            percentage=round((row.count / total) * 100.0, 1) if total > 0 else 0.0,
        )
        for row in cat_rows
    ]

    prio_stmt = (
        select(
            Feedback.priority,
            func.count(Feedback.id).label("count"),
        )
        .group_by(Feedback.priority)
    )
    prio_res = await db.execute(prio_stmt)
    prio_rows = prio_res.all()
    priority_dist = [
        DistributionItem(
            name=row.priority.value if hasattr(row.priority, "value") else str(row.priority),
            count=row.count,
            percentage=round((row.count / total) * 100.0, 1) if total > 0 else 0.0,
        )
        for row in prio_rows
    ]

    sent_stmt = (
        select(
            Feedback.sentiment,
            func.count(Feedback.id).label("count"),
        )
        .where(Feedback.sentiment.isnot(None))
        .group_by(Feedback.sentiment)
    )
    sent_res = await db.execute(sent_stmt)
    sent_rows = sent_res.all()
    sentiment_dist = [
        DistributionItem(
            name=row.sentiment.value if hasattr(row.sentiment, "value") else str(row.sentiment),
            count=row.count,
            percentage=round((row.count / total) * 100.0, 1) if total > 0 else 0.0,
        )
        for row in sent_rows
    ]

    dept_stmt = (
        select(
            Department.id,
            Department.name,
            func.count(
                case((Feedback.status.notin_([FeedbackStatus.RESOLVED, FeedbackStatus.CLOSED]), 1))
            ).label("active"),
            func.count(Feedback.id).label("total"),
            func.count(case((Feedback.status == FeedbackStatus.RESOLVED, 1))).label("resolved"),
        )
        .outerjoin(Feedback, Feedback.department_id == Department.id)
        .group_by(Department.id, Department.name)
        .order_by(desc("active"))
    )
    dept_res = await db.execute(dept_stmt)
    dept_rows = dept_res.all()
    department_workload = [
        DepartmentWorkloadItem(
            department_id=row.id,
            department_name=row.name,
            active_count=row.active or 0,
            total_count=row.total or 0,
            resolved_count=row.resolved or 0,
        )
        for row in dept_rows
    ]

    return DashboardAnalyticsResponse(
        summary=summary,
        trends=trends,
        category_distribution=category_dist,
        priority_distribution=priority_dist,
        sentiment_distribution=sentiment_dist,
        department_workload=department_workload,
    )


async def get_ai_statistics(db: AsyncSession) -> AIStatsRead:
    """Calculate AI processing statistics and performance metrics."""
    from app.core.config import settings
    from app.models.system_setting import SystemSetting

    total_stmt = select(func.count(AIAnalysis.id))
    total = await db.scalar(total_stmt) or 0

    comp_stmt = select(func.count(AIAnalysis.id)).where(AIAnalysis.status == AIAnalysisStatus.COMPLETED)
    completed = await db.scalar(comp_stmt) or 0

    fail_stmt = select(func.count(AIAnalysis.id)).where(AIAnalysis.status == AIAnalysisStatus.FAILED)
    failed = await db.scalar(fail_stmt) or 0

    skip_stmt = select(func.count(AIAnalysis.id)).where(AIAnalysis.status == AIAnalysisStatus.SKIPPED)
    skipped = await db.scalar(skip_stmt) or 0

    avg_dur_stmt = select(func.avg(AIAnalysis.duration_ms)).where(
        AIAnalysis.status == AIAnalysisStatus.COMPLETED
    )
    avg_dur = await db.scalar(avg_dur_stmt) or 0.0

    success_rate = round((completed / total) * 100.0, 1) if total > 0 else 100.0

    current_model = settings.GEMINI_MODEL
    stmt_m = select(SystemSetting).where(SystemSetting.key == "GEMINI_MODEL")
    res_m = await db.execute(stmt_m)
    setting_m = res_m.scalar_one_or_none()
    if setting_m and setting_m.value:
        current_model = setting_m.value

    ai_enabled = settings.AI_ENABLED
    stmt_e = select(SystemSetting).where(SystemSetting.key == "AI_ENABLED")
    res_e = await db.execute(stmt_e)
    setting_e = res_e.scalar_one_or_none()
    if setting_e and setting_e.value:
        ai_enabled = setting_e.value.lower() in ("true", "1", "yes")

    return AIStatsRead(
        total_analyzed=total,
        completed_count=completed,
        failed_count=failed,
        skipped_count=skipped,
        success_rate_percentage=success_rate,
        avg_duration_ms=round(float(avg_dur), 1),
        current_model=current_model,
        ai_enabled=ai_enabled,
    )
