"""Analytics and Dashboard API."""
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.api.deps import get_db, require_roles
from app.models.user import User, UserRole
from app.schemas.analytics import DashboardAnalyticsResponse
from app.services.analytics_service import get_dashboard_analytics

router = APIRouter(prefix="/analytics", tags=["Analytics & Dashboard"])


@router.get("/dashboard", response_model=DashboardAnalyticsResponse)
async def get_dashboard_metrics(
    current_user: User = Depends(require_roles([UserRole.ADMINISTRATOR, UserRole.AGENT])),
    db: AsyncSession = Depends(get_db),
):
    """Retrieve live dashboard summary metrics, trends, and distributions."""
    return await get_dashboard_analytics(db)
