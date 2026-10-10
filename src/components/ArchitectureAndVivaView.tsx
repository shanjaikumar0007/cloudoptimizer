import React, { useState } from 'react';
import { Copy, Check, ChevronDown, ChevronUp, Code2, BookOpen, Layers, Terminal } from 'lucide-react';

export const ArchitectureAndVivaView: React.FC = () => {
  const [activeCodeFile, setActiveCodeFile] = useState<string>('services.py');
  const [copiedFile, setCopiedFile] = useState<string | null>(null);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const vivaQuestions = [
    {
      q: 'Q1: Why use FastAPI over Flask or Django?',
      a: 'FastAPI is built on Starlette and Pydantic, making it asynchronous (ASGI-native), significantly faster than traditional WSGI frameworks like Flask, and automatically generates OpenAPI (Swagger) and Redoc documentation without any extra configuration. This automatic schema generation is essential for seamless frontend-backend collaboration and contract synchronization.',
      keyTakeaways: [
        'High performance through async/await support on Uvicorn',
        'Built-in data validation & type hinting with Pydantic',
        'Native auto-generated Swagger UI (/docs) and ReDoc (/redoc)',
        'Extremely lightweight compared to monolithic Django',
      ],
    },
    {
      q: 'Q2: How does the "Optimization" logic work?',
      a: 'It uses a deterministic, rule-based heuristic engine. It evaluates four foundational resource telemetry metrics: CPU Utilization, Memory (RAM) Utilization, Storage Disk Utilization, and Network I/O Utilization. The engine calculates the arithmetic mean: average = (cpu + mem + storage + net) / 4. If the average falls below 15%, it flags the resource as Idle and recommends a STOP_RESOURCE action. If between 15% and 40%, it marks it as Underutilized and recommends CONSIDER_RESIZE (~40% cost reduction). If 40%–80%, it is Active; if ≥80%, it flags High Utilization for scaling alerts.',
      keyTakeaways: [
        'Average threshold: <15% = Idle, <40% = Underutilized, <80% = Active, ≥80% = High Utilization',
        'Idle action: STOP_RESOURCE with 100% monthly cost savings (Hourly Rate × 730 hours)',
        'Underutilized action: CONSIDER_RESIZE with 40% estimated downsizing savings',
        'Real-time recalculation on any telemetry modification',
      ],
    },
    {
      q: 'Q3: Is the "Potential Savings" actual money saved?',
      a: 'No, it is a projected heuristic estimate. Actual cash savings in cloud environments depend on cloud billing cycles, billing minimums (e.g. 1-minute vs 1-hour minimum charge), Reserved Instance (RI) commitments, Savings Plans, and non-compute ancillary fees like allocated elastic IPs, attached EBS volumes, and data egress. The platform provides a clear disclaimer stating these are calculated estimates based on on-demand hourly rates multiplied by standard 730 billing hours per month.',
      keyTakeaways: [
        'Standard billing calculation: Monthly Cost = Hourly Cost × 730 hrs',
        'Real savings require accounting for attached disks & unattached IPs',
        'Estimates guide engineering priorities before executing decommissioning',
      ],
    },
    {
      q: 'Q4: How does the system handle a "Sudden Workload Increase"?',
      a: 'The system recalculates status immediately whenever new telemetry is received or updated. If a developer runs a heavy job and a resource jumps from 8% to 92% CPU, the optimization engine instantly transitions the status from "Idle" to "High Utilization", and dynamically changes the recommendation directive from "STOP_RESOURCE" to "KEEP_RESOURCE". This guards against false-positive decommissioning and alerts administrators that the instance is heavily loaded.',
      keyTakeaways: [
        'State recalculation occurs on every metric write/heartbeat',
        'Instant reversal of decommission flags when workloads spike',
        'High utilization trigger alerts engineering to consider horizontal scaling',
      ],
    },
    {
      q: 'Q5: What is the benefit of a decoupled architecture (FastAPI + React)?',
      a: 'Decoupling the frontend from the backend separates concerns cleanly: the backend focuses exclusively on data ingestion, persistence, and computational heuristics via standard JSON REST endpoints, while the React UI focuses on interactive rendering, state management, and real-time visualization. This enables independent scaling, separate deployment lifecycles, and future integration with external monitoring agents (Datadog, Prometheus, CloudWatch) without touching the UI.',
      keyTakeaways: [
        'Separation of concerns (computational engine vs user interface)',
        'Standardized JSON REST API contract allows multiple consumer clients',
        'Independent deployment pipelines and failure domains',
      ],
    },
  ];

  const codeFiles: Record<string, { path: string; language: string; content: string }> = {
    'services.py': {
      path: 'backend/app/services.py',
      language: 'python',
      content: `def classify_resource(cpu: float, mem: float, storage: float, net: float) -> str:
    """
    Classifies cloud resource status based on 4 telemetry dimensions:
    - Idle: avg < 15%
    - Underutilized: avg < 40%
    - Active: avg < 80%
    - High Utilization: avg >= 80%
    """
    avg = (cpu + mem + storage + net) / 4.0
    if avg < 15.0:
        return "Idle"
    if avg < 40.0:
        return "Underutilized"
    if avg < 80.0:
        return "Active"
    return "High Utilization"

def generate_recommendation(resource) -> dict:
    """
    Calculates cost optimization directives:
    - Idle -> STOP_RESOURCE (100% savings)
    - Underutilized -> CONSIDER_RESIZE (40% savings)
    - Active/High -> KEEP_RESOURCE (0 savings)
    Monthly hours standard: 730 hours / month.
    """
    cpu = getattr(resource, "cpu_utilization", 0.0)
    mem = getattr(resource, "memory_utilization", 0.0)
    storage = getattr(resource, "storage_utilization", 0.0)
    net = getattr(resource, "network_utilization", 0.0)
    hourly_cost = getattr(resource, "hourly_cost", 0.0)

    status = classify_resource(cpu, mem, storage, net)
    monthly_cost = round(hourly_cost * 730.0, 2)
    avg_util = round((cpu + mem + storage + net) / 4.0, 1)

    if status == "Idle":
        return {
            "action": "STOP_RESOURCE",
            "status": "Idle",
            "reason": f"Average utilization is critically low ({status}).",
            "savings": monthly_cost,
            "monthly_cost": monthly_cost
        }
    elif status == "Underutilized":
        savings = round(monthly_cost * 0.4, 2)
        return {
            "action": "CONSIDER_RESIZE",
            "status": "Underutilized",
            "reason": "Resource is consistently below 40% usage.",
            "savings": savings,
            "monthly_cost": monthly_cost
        }
    return {
        "action": "KEEP_RESOURCE",
        "status": status,
        "reason": "Resource performing within limits.",
        "savings": 0.0,
        "monthly_cost": monthly_cost
    }`,
    },
    'main.py': {
      path: 'backend/app/main.py',
      language: 'python',
      content: `from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from . import crud, models, schemas, services, database

models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(title="Cloud Optimizer API")

# Enable CORS so React can talk to FastAPI
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/dashboard")
def get_dashboard(db: Session = Depends(database.get_db)):
    resources = db.query(models.Resource).all()
    total_cost = sum(r.hourly_cost * 730 for r in resources)
    idle_count = len([
        r for r in resources
        if services.classify_resource(
            r.cpu_utilization, r.memory_utilization,
            r.storage_utilization, r.network_utilization
        ) == "Idle"
    ])
    
    return {
        "total_resources": len(resources),
        "idle_resources": idle_count,
        "estimated_monthly_cost": round(total_cost, 2),
        "potential_savings": sum(services.generate_recommendation(r)["savings"] for r in resources)
    }

@app.get("/api/resources")
def list_resources(db: Session = Depends(database.get_db)):
    return db.query(models.Resource).all()

@app.post("/api/resources")
def create_resource(res: schemas.ResourceCreate, db: Session = Depends(database.get_db)):
    db_res = models.Resource(**res.dict())
    db.add(db_res)
    db.commit()
    db.refresh(db_res)
    return db_res

@app.delete("/api/resources/{resource_id}")
def delete_resource(resource_id: str, db: Session = Depends(database.get_db)):
    deleted = crud.delete_resource(db, resource_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Resource not found")
    return {"message": "Resource deleted successfully", "resource_id": resource_id}`,
    },
    'models.py': {
      path: 'backend/app/models.py',
      language: 'python',
      content: `from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from .database import Base
import datetime

class Resource(Base):
    __tablename__ = "resources"
    id = Column(Integer, primary_key=True, index=True)
    resource_id = Column(String, unique=True, index=True)
    name = Column(String)
    type = Column(String) # e.g., Virtual Machine, Storage
    provider = Column(String) # e.g., AWS, Azure
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
    action = Column(String) # STOP, RESIZE, KEEP
    reason = Column(String)
    estimated_savings = Column(Float)`,
    },
    'database.py': {
      path: 'backend/app/database.py',
      language: 'python',
      content: `from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

SQLALCHEMY_DATABASE_URL = "sqlite:///./cloud_optimizer.db"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()`,
    },
    'test_optimizer.py': {
      path: 'backend/tests/test_optimizer.py',
      language: 'python',
      content: `import pytest
from app.services import classify_resource, generate_recommendation

def test_classify_idle():
    """Verify that classify_resource(5, 5, 5, 5) returns 'Idle'"""
    assert classify_resource(5, 5, 5, 5) == "Idle"

def test_recommendation_idle():
    class MockResource:
        cpu_utilization = 5.0
        memory_utilization = 5.0
        storage_utilization = 5.0
        network_utilization = 5.0
        hourly_cost = 0.10

    rec = generate_recommendation(MockResource())
    assert rec["action"] == "STOP_RESOURCE"
    assert rec["savings"] == pytest.approx(73.0, 0.01)

def test_sudden_workload_spike():
    class DynamicResource:
        hourly_cost = 0.12
        cpu_utilization = 8.0
        memory_utilization = 8.0
        storage_utilization = 8.0
        network_utilization = 8.0

    res = DynamicResource()
    assert generate_recommendation(res)["action"] == "STOP_RESOURCE"

    # Spike workload
    res.cpu_utilization = 92.0
    res.memory_utilization = 88.0
    res.storage_utilization = 80.0
    res.network_utilization = 80.0

    assert generate_recommendation(res)["action"] == "KEEP_RESOURCE"`,
    },
    'requirements.txt': {
      path: 'backend/requirements.txt',
      language: 'text',
      content: `fastapi
uvicorn
sqlalchemy
pydantic
pytest
httpx`,
    },
  };

  const handleCopy = (filename: string, code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedFile(filename);
    setTimeout(() => setCopiedFile(null), 2000);
  };

  return (
    <div className="space-y-8">
      {/* Decoupled Architecture Blueprint */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
        <div className="flex items-center gap-2">
          <Layers className="w-5 h-5 text-cyan-400" />
          <h2 className="text-lg font-bold text-white">System Architecture & Decoupled Design</h2>
        </div>
        <p className="text-xs text-slate-400 mt-1 max-w-3xl leading-relaxed">
          High-performance decoupled architecture connecting a React frontend with a FastAPI / SQLite backend via RESTful APIs and deterministic heuristic optimization algorithms.
        </p>

        {/* Visual Architecture Diagram */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4 text-xs font-mono">
          <div className="p-4 bg-slate-950 border border-cyan-500/30 rounded-lg">
            <span className="text-cyan-400 font-semibold block mb-1">1. Frontend Layer</span>
            <div className="text-white font-bold">React (SPA) + Tailwind</div>
            <p className="text-slate-400 text-[11px] mt-2 font-sans">
              Dynamic dashboard, metric sliders, deletion actions, and live workload simulation.
            </p>
          </div>

          <div className="p-4 bg-slate-950 border border-indigo-500/30 rounded-lg">
            <span className="text-indigo-400 font-semibold block mb-1">2. API Communication</span>
            <div className="text-white font-bold">REST / JSON / Axios</div>
            <p className="text-slate-400 text-[11px] mt-2 font-sans">
              Non-blocking asynchronous HTTP requests with CORS middleware integration.
            </p>
          </div>

          <div className="p-4 bg-slate-950 border border-emerald-500/30 rounded-lg">
            <span className="text-emerald-400 font-semibold block mb-1">3. Compute Engine</span>
            <div className="text-white font-bold">FastAPI + Heuristic Engine</div>
            <p className="text-slate-400 text-[11px] mt-2 font-sans">
              Services layer calculating utilization thresholds (&lt;15%, &lt;40%, &lt;80%) & savings.
            </p>
          </div>

          <div className="p-4 bg-slate-950 border border-amber-500/30 rounded-lg">
            <span className="text-amber-400 font-semibold block mb-1">4. Persistence Layer</span>
            <div className="text-white font-bold">SQLite + SQLAlchemy ORM</div>
            <p className="text-slate-400 text-[11px] mt-2 font-sans">
              Zero-configuration file-based relational storage tracking resources and metric telemetry.
            </p>
          </div>
        </div>
      </div>

      {/* Stage 7 Viva Questions & Answers */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-2">
          <BookOpen className="w-5 h-5 text-emerald-400" />
          <h2 className="text-lg font-bold text-white">Stage 7: Viva Questions & Model Answers</h2>
        </div>
        <p className="text-xs text-slate-400 mb-6 leading-relaxed">
          Comprehensive responses prepared for technical viva examinations, defense panels, and code walkthroughs.
        </p>

        <div className="space-y-3">
          {vivaQuestions.map((item, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                className="border border-slate-800 rounded-lg bg-slate-950/60 overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full p-4 text-left flex items-center justify-between gap-4 hover:bg-slate-800/40 transition-colors cursor-pointer"
                >
                  <span className="text-xs font-bold text-white">{item.q}</span>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-slate-400 shrink-0" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                  )}
                </button>

                {isOpen && (
                  <div className="p-4 pt-0 border-t border-slate-800/60 text-xs space-y-3">
                    <p className="text-slate-300 leading-relaxed mt-3">{item.a}</p>
                    <div className="p-3 bg-slate-900 rounded border border-slate-800">
                      <span className="text-[11px] font-semibold text-cyan-400 uppercase tracking-wider block mb-1.5">
                        Key Engineering Points:
                      </span>
                      <ul className="space-y-1 text-slate-400 text-[11px] list-disc list-inside">
                        {item.keyTakeaways.map((point, pIdx) => (
                          <li key={pIdx}>{point}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Python Source Code Artifact Explorer */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Code2 className="w-5 h-5 text-cyan-400" />
            <h3 className="text-sm font-bold text-white">
              Backend Source Code Explorer ({codeFiles[activeCodeFile].path})
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleCopy(activeCodeFile, codeFiles[activeCodeFile].content)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 rounded transition-colors cursor-pointer"
            >
              {copiedFile === activeCodeFile ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy File</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* File tabs */}
        <div className="flex overflow-x-auto p-1 bg-slate-950 border-b border-slate-800 gap-1 text-xs font-mono">
          {Object.keys(codeFiles).map((filename) => (
            <button
              key={filename}
              onClick={() => setActiveCodeFile(filename)}
              className={`px-3 py-1.5 rounded whitespace-nowrap transition-colors cursor-pointer ${
                activeCodeFile === filename
                  ? 'bg-slate-800 text-cyan-300 font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {filename}
            </button>
          ))}
        </div>

        {/* Code View */}
        <div className="p-4 bg-slate-950/90 overflow-x-auto max-h-[460px]">
          <pre className="font-mono text-xs text-slate-300 leading-relaxed">
            <code>{codeFiles[activeCodeFile].content}</code>
          </pre>
        </div>
      </div>
    </div>
  );
};
