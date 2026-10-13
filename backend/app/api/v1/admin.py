"""Administration, AI settings, and Audit Logs API."""
import uuid
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import desc, select
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.deps import get_db, require_roles
from app.models.audit_log import AuditLog
from app.models.system_setting import SystemSetting
from app.models.user import User, UserRole
from app.schemas.ai import AISettingsUpdate, AIStatsRead
from app.schemas.audit import AuditLogRead
from app.services.ai_service import analyze_feedback
from app.services.analytics_service import get_ai_statistics

router = APIRouter(prefix="/admin", tags=["Administration"])


@router.get("/ai-stats", response_model=AIStatsRead)
async def get_ai_stats(
    current_user: User = Depends(require_roles([UserRole.ADMINISTRATOR])),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve Gemini AI processing statistics, success rate, and average latency."""
    return await get_ai_statistics(db)


@router.post("/ai-settings", response_model=AIStatsRead)
async def update_ai_settings(
    settings_in: AISettingsUpdate,
    current_user: User = Depends(require_roles([UserRole.ADMINISTRATOR])),
    db: AsyncSession = Depends(get_db),
):
    """Enable or disable Gemini AI analysis dynamically."""
    from app.core.config import settings

    stmt = select(SystemSetting).where(SystemSetting.key == "AI_ENABLED")
    res = await db.execute(stmt)
    setting = res.scalar_one_or_none()

    val_str = "true" if settings_in.ai_enabled else "false"
    if setting:
        setting.value = val_str
    else:
        setting = SystemSetting(
            key="AI_ENABLED",
            value=val_str,
            description="Controls whether Gemini automated analysis is enabled",
        )
        db.add(setting)

    if settings_in.model_name:
        settings.GEMINI_MODEL = settings_in.model_name
        stmt_m = select(SystemSetting).where(SystemSetting.key == "GEMINI_MODEL")
        res_m = await db.execute(stmt_m)
        setting_m = res_m.scalar_one_or_none()
        if setting_m:
            setting_m.value = settings_in.model_name
        else:
            db.add(SystemSetting(key="GEMINI_MODEL", value=settings_in.model_name, description="Gemini model name"))

    if settings_in.api_key:
        settings.GEMINI_API_KEY = settings_in.api_key.strip()
        stmt_k = select(SystemSetting).where(SystemSetting.key == "GEMINI_API_KEY")
        res_k = await db.execute(stmt_k)
        setting_k = res_k.scalar_one_or_none()
        if setting_k:
            setting_k.value = settings_in.api_key.strip()
        else:
            db.add(SystemSetting(key="GEMINI_API_KEY", value=settings_in.api_key.strip(), description="Gemini API Key"))

    await db.commit()
    return await get_ai_statistics(db)


@router.post("/ai-retry/{feedback_id}")
async def retry_ai_analysis(
    feedback_id: uuid.UUID,
    current_user: User = Depends(require_roles([UserRole.ADMINISTRATOR, UserRole.AGENT])),
    db: AsyncSession = Depends(get_db),
):
    """Manually re-run Gemini AI analysis on a feedback item."""
    try:
        ai_res = await analyze_feedback(db, feedback_id, force_retry=True)
        return {
            "message": "AI analysis triggered.",
            "status": ai_res.status.value,
            "error_message": ai_res.error_message,
        }
    except Exception as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to retry AI analysis: {exc}",
        )


@router.get("/audit-logs", response_model=List[AuditLogRead])
async def list_audit_logs(
    action: Optional[str] = Query(None),
    feedback_id: Optional[uuid.UUID] = Query(None),
    limit: int = Query(100, ge=1, le=500),
    current_user: User = Depends(require_roles([UserRole.ADMINISTRATOR])),
    db: AsyncSession = Depends(get_db),
):
    """Review audit events, actions, actors, and IP logs (Administrator only)."""
    stmt = select(AuditLog).order_by(desc(AuditLog.created_at)).limit(limit)
    if action:
        stmt = stmt.where(AuditLog.action == action)
    if feedback_id:
        stmt = stmt.where(AuditLog.feedback_id == feedback_id)

    res = await db.execute(stmt)
    return res.scalars().all()
