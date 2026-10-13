"""Status history schemas."""
import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class StatusHistoryRead(BaseModel):
    id: uuid.UUID
    feedback_id: uuid.UUID
    from_status: Optional[str] = None
    to_status: str
    changed_by_id: Optional[uuid.UUID] = None
    changed_by_name: Optional[str] = None
    reason: Optional[str] = None
    created_at: datetime

    model_config = {"from_attributes": True}
