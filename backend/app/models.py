from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from .database import Base
import datetime

class Resource(Base):
    __tablename__ = "resources"
    id = Column(Integer, primary_key=True, index=True)
    resource_id = Column(String, unique=True, index=True)
    name = Column(String)
    type = Column(String)  # e.g., Virtual Machine, Storage, Database
    provider = Column(String)  # e.g., AWS, Azure, GCP
    region = Column(String)
    cpu_utilization = Column(Float)
    memory_utilization = Column(Float)
    storage_utilization = Column(Float)
    network_utilization = Column(Float)
    hourly_cost = Column(Float)
    updated_at = Column(DateTime, default=datetime.datetime.utcnow, onupdate=datetime.datetime.utcnow)

class MetricHistory(Base):
    __tablename__ = "resource_metrics"
    id = Column(Integer, primary_key=True, index=True)
    resource_id = Column(String, ForeignKey("resources.resource_id"))
    cpu_utilization = Column(Float)
    memory_utilization = Column(Float)
    recorded_at = Column(DateTime, default=datetime.datetime.utcnow)

class Recommendation(Base):
    __tablename__ = "recommendations"
    id = Column(Integer, primary_key=True, index=True)
    resource_id = Column(String)
    action = Column(String)  # STOP_RESOURCE, CONSIDER_RESIZE, KEEP_RESOURCE
    reason = Column(String)
    estimated_savings = Column(Float)
