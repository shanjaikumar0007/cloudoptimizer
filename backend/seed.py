from app.database import SessionLocal, engine, Base
from app import models

# Ensure schema exists
Base.metadata.create_all(bind=engine)

db = SessionLocal()

# Clear existing seed data if needed
db.query(models.Resource).delete()

demo_resources = [
    {
        "resource_id": "vm-001",
        "name": "Prod-Web-Server",
        "type": "VM",
        "provider": "AWS",
        "region": "us-east-1",
        "cpu_utilization": 72.0,
        "memory_utilization": 68.0,
        "storage_utilization": 55.0,
        "network_utilization": 64.0,
        "hourly_cost": 0.12
    },
    {
        "resource_id": "vm-002",
        "name": "Dev-Test-DB",
        "type": "VM",
        "provider": "Azure",
        "region": "west-us",
        "cpu_utilization": 8.0,
        "memory_utilization": 12.0,
        "storage_utilization": 10.0,
        "network_utilization": 5.0,
        "hourly_cost": 0.08
    },
    {
        "resource_id": "vm-003",
        "name": "Staging-API-Worker",
        "type": "VM",
        "provider": "AWS",
        "region": "us-west-2",
        "cpu_utilization": 28.0,
        "memory_utilization": 34.0,
        "storage_utilization": 22.0,
        "network_utilization": 18.0,
        "hourly_cost": 0.24
    },
    {
        "resource_id": "vm-004",
        "name": "BigData-Node",
        "type": "VM",
        "provider": "GCP",
        "region": "europe-west1",
        "cpu_utilization": 86.0,
        "memory_utilization": 82.0,
        "storage_utilization": 70.0,
        "network_utilization": 78.0,
        "hourly_cost": 0.45
    },
    {
        "resource_id": "vm-005",
        "name": "Analytics-Batch-Runner",
        "type": "VM",
        "provider": "GCP",
        "region": "us-central1",
        "cpu_utilization": 6.0,
        "memory_utilization": 14.0,
        "storage_utilization": 8.0,
        "network_utilization": 4.0,
        "hourly_cost": 0.32
    },
    {
        "resource_id": "vm-006",
        "name": "Cache-Redis-Cluster",
        "type": "Cache",
        "provider": "AWS",
        "region": "eu-central-1",
        "cpu_utilization": 32.0,
        "memory_utilization": 38.0,
        "storage_utilization": 15.0,
        "network_utilization": 25.0,
        "hourly_cost": 0.18
    }
]

for r in demo_resources:
    db_res = models.Resource(**r)
    db.add(db_res)

db.commit()
print(f"Database seeded with {len(demo_resources)} cloud resources!")
db.close()
