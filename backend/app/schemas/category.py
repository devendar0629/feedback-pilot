"""Category schemas."""
import uuid
from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class CategoryCreate(BaseModel):
    name: str = Field(..., min_length=2, max_length=100)
    department_id: Optional[uuid.UUID] = None
    description: Optional[str] = None
    is_active: bool = True


class CategoryUpdate(BaseModel):
    name: Optional[str] = Field(None, min_length=2, max_length=100)
    department_id: Optional[uuid.UUID] = None
    description: Optional[str] = None
    is_active: Optional[bool] = None


class CategoryRead(BaseModel):
    id: uuid.UUID
    name: str
    department_id: Optional[uuid.UUID] = None
    department_name: Optional[str] = None
    description: Optional[str] = None
    is_active: bool
    created_at: datetime

    model_config = {"from_attributes": True}
