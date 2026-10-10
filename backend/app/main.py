from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Dict, Any
from . import crud, models, schemas, services, database

# Create tables in SQLite
models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(
    title="Cloud Optimizer API",
    description="Intelligent Cloud Resource Cost Optimization & Underutilization Analysis REST API",
    version="1.0.0"
)

# Enable CORS so frontend can communicate with FastAPI
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {
        "service": "Cloud Optimizer API",
        "status": "online",
        "docs_url": "/docs",
        "openapi_url": "/openapi.json"
    }

@app.get("/api/dashboard", response_model=schemas.DashboardStats)
def get_dashboard(db: Session = Depends(database.get_db)):
    resources = db.query(models.Resource).all()
    total_cost = sum(r.hourly_cost * 730.0 for r in resources)
    
    statuses = [
        services.classify_resource(
            r.cpu_utilization,
            r.memory_utilization,
            r.storage_utilization,
            r.network_utilization
        ) for r in resources
    ]
    
    idle_count = statuses.count("Idle")
    underutilized_count = statuses.count("Underutilized")
    active_count = statuses.count("Active")
    high_count = statuses.count("High Utilization")

    potential_savings = sum(
        services.generate_recommendation(r)["savings"]
        for r in resources
    )

    return {
        "total_resources": len(resources),
        "idle_resources": idle_count,
        "underutilized_resources": underutilized_count,
        "active_resources": active_count,
        "high_utilization_resources": high_count,
        "estimated_monthly_cost": round(total_cost, 2),
        "potential_savings": round(potential_savings, 2)
    }

@app.get("/api/resources")
def list_resources(db: Session = Depends(database.get_db)):
    resources = crud.get_resources(db)
    result = []
    for r in resources:
        rec = services.generate_recommendation(r)
        res_dict = {
            "id": r.id,
            "resource_id": r.resource_id,
            "name": r.name,
            "type": r.type,
            "provider": r.provider,
            "region": r.region,
            "cpu_utilization": r.cpu_utilization,
            "memory_utilization": r.memory_utilization,
            "storage_utilization": r.storage_utilization,
            "network_utilization": r.network_utilization,
            "hourly_cost": r.hourly_cost,
            "updated_at": r.updated_at.isoformat() if r.updated_at else None,
            "recommendation": rec
        }
        result.append(res_dict)
    return result

@app.get("/api/resources/{resource_id}")
def get_resource(resource_id: str, db: Session = Depends(database.get_db)):
    r = crud.get_resource_by_id(db, resource_id)
    if not r:
        raise HTTPException(status_code=404, detail="Resource not found")
    rec = services.generate_recommendation(r)
    return {
        "id": r.id,
        "resource_id": r.resource_id,
        "name": r.name,
        "type": r.type,
        "provider": r.provider,
        "region": r.region,
        "cpu_utilization": r.cpu_utilization,
        "memory_utilization": r.memory_utilization,
        "storage_utilization": r.storage_utilization,
        "network_utilization": r.network_utilization,
        "hourly_cost": r.hourly_cost,
        "updated_at": r.updated_at.isoformat() if r.updated_at else None,
        "recommendation": rec
    }

@app.post("/api/resources", status_code=status.HTTP_201_CREATED)
def create_resource(res: schemas.ResourceCreate, db: Session = Depends(database.get_db)):
    existing = crud.get_resource_by_id(db, res.resource_id)
    if existing:
        raise HTTPException(status_code=400, detail=f"Resource ID '{res.resource_id}' already exists")
    db_res = crud.create_resource(db, res)
    rec = services.generate_recommendation(db_res)
    return {
        "id": db_res.id,
        "resource_id": db_res.resource_id,
        "name": db_res.name,
        "type": db_res.type,
        "provider": db_res.provider,
        "region": db_res.region,
        "cpu_utilization": db_res.cpu_utilization,
        "memory_utilization": db_res.memory_utilization,
        "storage_utilization": db_res.storage_utilization,
        "network_utilization": db_res.network_utilization,
        "hourly_cost": db_res.hourly_cost,
        "updated_at": db_res.updated_at.isoformat() if db_res.updated_at else None,
        "recommendation": rec
    }

@app.put("/api/resources/{resource_id}")
def update_resource(resource_id: str, updates: schemas.ResourceUpdate, db: Session = Depends(database.get_db)):
    updated = crud.update_resource(db, resource_id, updates)
    if not updated:
        raise HTTPException(status_code=404, detail="Resource not found")
    rec = services.generate_recommendation(updated)
    return {
        "id": updated.id,
        "resource_id": updated.resource_id,
        "name": updated.name,
        "type": updated.type,
        "provider": updated.provider,
        "region": updated.region,
        "cpu_utilization": updated.cpu_utilization,
        "memory_utilization": updated.memory_utilization,
        "storage_utilization": updated.storage_utilization,
        "network_utilization": updated.network_utilization,
        "hourly_cost": updated.hourly_cost,
        "updated_at": updated.updated_at.isoformat() if updated.updated_at else None,
        "recommendation": rec
    }

@app.delete("/api/resources/{resource_id}")
def delete_resource(resource_id: str, db: Session = Depends(database.get_db)):
    deleted = crud.delete_resource(db, resource_id)
    if not deleted:
        raise HTTPException(status_code=404, detail=f"Resource '{resource_id}' not found")
    return {"message": f"Resource '{resource_id}' deleted successfully", "resource_id": resource_id}

@app.post("/api/resources/{resource_id}/simulate")
def simulate_resource(
    resource_id: str,
    body: Dict[str, Any],
    db: Session = Depends(database.get_db)
):
    resource = crud.get_resource_by_id(db, resource_id)

    if not resource:
        raise HTTPException(
            status_code=404,
            detail=f"Resource '{resource_id}' not found"
        )

    target_state = body.get("targetState", "nominal")

    if target_state == "spike":
        cpu, mem, storage, net = 92.0, 88.0, 82.0, 85.0
    elif target_state == "idle":
        cpu, mem, storage, net = 7.0, 10.0, 9.0, 5.0
    elif target_state == "underutilized":
        cpu, mem, storage, net = 25.0, 30.0, 20.0, 25.0
    else:
        cpu, mem, storage, net = 60.0, 55.0, 50.0, 52.0

    updates = schemas.ResourceUpdate(
        cpu_utilization=cpu,
        memory_utilization=mem,
        storage_utilization=storage,
        network_utilization=net
    )

    updated = crud.update_resource(db, resource_id, updates)

    if not updated:
        raise HTTPException(
            status_code=404,
            detail="Resource not found"
        )

    return {
        "resource_id": updated.resource_id,
        "name": updated.name,
        "cpu_utilization": updated.cpu_utilization,
        "memory_utilization": updated.memory_utilization,
        "storage_utilization": updated.storage_utilization,
        "network_utilization": updated.network_utilization,
        "recommendation": services.generate_recommendation(updated)
    }

@app.get("/api/recommendations")
def get_recommendations(db: Session = Depends(database.get_db)):
    resources = crud.get_resources(db)
    recs = []
    for r in resources:
        rec = services.generate_recommendation(r)
        if rec["action"] != "KEEP_RESOURCE":
            recs.append({
                "resource_id": r.resource_id,
                "name": r.name,
                "provider": r.provider,
                "hourly_cost": r.hourly_cost,
                **rec
            })
    return recs
