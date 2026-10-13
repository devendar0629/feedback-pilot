"""Dashboard analytics and statistics schemas."""
import uuid
from typing import Dict, List, Optional
from pydantic import BaseModel


class DashboardSummary(BaseModel):
    total_submissions: int
    unresolved_count: int
    new_count: int
    in_progress_count: int
    resolved_count: int
    closed_count: int
    overdue_count: int
    avg_resolution_time_hours: float


class TrendItem(BaseModel):
    date: str
    total_submissions: int
    resolved_submissions: int


class DistributionItem(BaseModel):
    name: str
    count: int
    percentage: float


class DepartmentWorkloadItem(BaseModel):
    department_id: Optional[uuid.UUID] = None
    department_name: str
    active_count: int
    total_count: int
    resolved_count: int


class DashboardAnalyticsResponse(BaseModel):
    summary: DashboardSummary
    trends: List[TrendItem]
    category_distribution: List[DistributionItem]
    priority_distribution: List[DistributionItem]
    sentiment_distribution: List[DistributionItem]
    department_workload: List[DepartmentWorkloadItem]
