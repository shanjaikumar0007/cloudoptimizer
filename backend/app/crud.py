from sqlalchemy.orm import Session
from . import models, schemas, services
import datetime

def get_resources(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Resource).offset(skip).limit(limit).all()

def get_resource_by_id(db: Session, resource_id: str):
    return db.query(models.Resource).filter(models.Resource.resource_id == resource_id).first()

def create_resource(db: Session, res: schemas.ResourceCreate):
    db_res = models.Resource(**res.dict())
    db.add(db_res)
    db.commit()
    db.refresh(db_res)
    return db_res

def update_resource(db: Session, resource_id: str, updates: schemas.ResourceUpdate):
    db_res = get_resource_by_id(db, resource_id)
    if not db_res:
        return None
    for field, value in updates.dict(exclude_unset=True).items():
        setattr(db_res, field, value)
    db_res.updated_at = datetime.datetime.utcnow()
    db.commit()
    db.refresh(db_res)
    return db_res

def delete_resource(db: Session, resource_id: str):
    db_res = get_resource_by_id(db, resource_id)
    if not db_res:
        return None
    db.delete(db_res)
    db.commit()
    return db_res
