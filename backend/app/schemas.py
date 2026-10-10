from pydantic import BaseModel, Field
from typing import Optional, List
import datetime

class ResourceBase(BaseModel):
    resource_id: str
    name: str
    type: str = "Virtual Machine"
    provider: str = "AWS"
    region: str = "us-east-1"
    cpu_utilization: float = Field(ge=0, le=100)
    memory_utilization: float = Field(ge=0, le=100)
    storage_utilization: float = Field(ge=0, le=100)
    network_utilization: float = Field(ge=0, le=100)
    hourly_cost: float = Field(ge=0)

class ResourceCreate(ResourceBase):
    pass

class ResourceUpdate(BaseModel):
    name: Optional[str] = None
    type: Optional[str] = None
    provider: Optional[str] = None
    region: Optional[str] = None
    cpu_utilization: Optional[float] = None
    memory_utilization: Optional[float] = None
    storage_utilization: Optional[float] = None
    network_utilization: Optional[float] = None
    hourly_cost: Optional[float] = None

class RecommendationOut(BaseModel):
    action: str
    reason: str
    savings: float
    monthly_cost: float
    status: str

class ResourceOut(ResourceBase):
    id: int
    updated_at: Optional[datetime.datetime] = None
    recommendation: Optional[RecommendationOut] = None

    class Config:
        from_attributes = True

class DashboardStats(BaseModel):
    total_resources: int
    idle_resources: int
    underutilized_resources: int
    active_resources: int
    high_utilization_resources: int
    estimated_monthly_cost: float
    potential_savings: float
