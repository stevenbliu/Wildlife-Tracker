"""
Families API endpoints.

This module provides endpoints for managing wildlife families, their metrics,
events, and observations.

Endpoints:
    - GET /api/families/{family_id}/metrics
    - POST /api/families
    - GET /api/families/{family_id}
    - GET /api/families
    - GET /api/families/by-herd/{herd_id}
    - POST /api/families/{family_id}/events
    - POST /api/families/{family_id}/observations
    - GET /api/families/{family_id}/observations
"""

from fastapi import FastAPI, Depends, HTTPException, status, Query, APIRouter
from sqlalchemy.orm import Session
from sqlalchemy import text
from datetime import datetime, timedelta

from database import SessionLocal, engine, Base
import models, schemas
from fastapi.middleware.cors import CORSMiddleware

from geoalchemy2.shape import from_shape
from shapely.geometry import Point
from typing import List, Optional
from database import get_db

# from backend.kafka.producer import produce_event  # import your Kafka producer helper
# from tasks.events import (
#     retry_produce_event,
# )  # import your Celery retry logic for Kafka events

from utils.kafka_helpers import safe_kafka_produce

router = APIRouter(prefix="/api/families", tags=["Families"])


@router.get("/{family_id}/metrics")
def get_family_metrics(
    family_id: int,
    start: datetime = None,
    end: datetime = None,
    db: Session = Depends(get_db),
):
    """
    Get time-series metrics (size, health) for a family.

    :param family_id: ID of the family.
    :param start: (Optional) Start datetime for filtering.
    :param end: (Optional) End datetime for filtering.
    :param db: Database session.
    :return: List of (timestamp, size, health_rating) tuples.
    """
    query = db.query(
        models.Observation.ts, models.Observation.size, models.Observation.health_rating
    ).filter(models.Observation.family_id == family_id)
    if start:
        query = query.filter(models.Observation.ts >= start)
    if end:
        query = query.filter(models.Observation.ts <= end)
    return query.order_by(models.Observation.ts).all()


# Family Endpoints


@router.post("", response_model=schemas.Family, status_code=status.HTTP_201_CREATED)
def create_family(family: schemas.FamilyCreate, db: Session = Depends(get_db)):
    """
    Create a new family. If a family with the same friendly_name already exists, do not add it.

    :param family: Family creation data.
    :param db: Database session.
    :return: The created Family object.
    :raises HTTPException: If herd_id is missing, herd does not exist, or family name already exists.
    """
    if family.herd_id is None:
        raise HTTPException(
            status_code=422, detail="herd_id is required and must be an integer"
        )
    herd = db.query(models.Herd).filter(models.Herd.id == family.herd_id).first()
    if not herd:
        raise HTTPException(status_code=404, detail="Herd not found")
    existing_family = (
        db.query(models.Family)
        .filter(models.Family.friendly_name == family.friendly_name)
        .first()
    )
    if existing_family:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Family with friendly_name '{family.friendly_name}' already exists.",
        )
    db_family = models.Family(**family.dict())
    db.add(db_family)
    db.commit()
    db.refresh(db_family)
    return db_family


@router.get("/{family_id}", response_model=schemas.Family)
def get_family(family_id: int, db: Session = Depends(get_db)):
    """
    Retrieve a family by its ID.

    :param family_id: The ID of the family to retrieve.
    :param db: Database session.
    :return: The Family object if found.
    :raises HTTPException: If the family is not found.
    """
    family = db.query(models.Family).filter(models.Family.id == family_id).first()
    if not family:
        raise HTTPException(status_code=404, detail="Family not found")
    return family


@router.get("", response_model=List[schemas.Family])
def get_all_families(db: Session = Depends(get_db)):
    """
    Retrieve all families.

    :param db: Database session.
    :return: List of all Family objects.
    """
    families = db.query(models.Family).all()
    return families


@router.get("/by-herd/{herd_id}", response_model=List[schemas.Family])
def get_families_by_herd(herd_id: int, db: Session = Depends(get_db)):
    """
    Retrieve all families belonging to a specific herd.

    :param herd_id: The ID of the herd.
    :param db: Database session.
    :return: List of Family objects in the herd.
    :raises HTTPException: If the herd is not found.
    """
    herd = db.query(models.Herd).filter(models.Herd.id == herd_id).first()
    if not herd:
        raise HTTPException(status_code=404, detail="Herd not found")

    families = db.query(models.Family).filter(models.Family.herd_id == herd_id).all()
    return families


# Event Endpoints


def create_event(
    family_id: int, event: schemas.EventCreate, db: Session = Depends(get_db)
):
    family = db.query(models.Family).filter(models.Family.id == family_id).first()
    if not family:
        raise HTTPException(status_code=404, detail="Family not found")

    event_data = event.dict()
    event_data["family_id"] = family_id
    event_data["location"] = from_shape(
        Point(event_data["longitude"], event_data["latitude"]), srid=4326
    )
    if not event_data.get("ts"):
        event_data["ts"] = datetime.utcnow()

    db_event = models.Event(**event_data)
    db.add(db_event)
    db.commit()
    db.refresh(db_event)

    # Send to Kafka (with fallback to Celery)
    safe_kafka_produce(
        {
            "id": db_event.id,
            "family_id": db_event.family_id,
            "description": db_event.description,
            "lat": event_data["latitude"],
            "lng": event_data["longitude"],
            "ts": db_event.ts.isoformat(),
            "metadata": db_event.metadata,
        }
    )

    return {"message": "Event created"}


# Observation Endpoints


@router.post("/{family_id}/observations", status_code=status.HTTP_201_CREATED)
def create_observation(
    family_id: int,
    observation: schemas.ObservationCreate,
    db: Session = Depends(get_db),
):
    """
    Create a new observation for a family.

    :param family_id: The ID of the family.
    :param observation: Observation creation data.
    :param db: Database session.
    :return: Success message.
    :raises HTTPException: If the family is not found.
    """
    family = db.query(models.Family).filter(models.Family.id == family_id).first()
    if not family:
        raise HTTPException(status_code=404, detail="Family not found")
    obs_data = observation.dict()
    obs_data["family_id"] = family_id
    if obs_data.get("ts") is None:
        obs_data["ts"] = datetime.utcnow()
    obs_data["location"] = from_shape(
        Point(obs_data["longitude"], obs_data["latitude"]), srid=4326
    )
    db_observation = models.Observation(**obs_data)
    db.add(db_observation)
    db.commit()
    return {"message": "Observation created"}


@router.get("/{family_id}/observations", response_model=List[schemas.Observation])
def get_family_observations(
    family_id: int,
    start: datetime = None,
    end: datetime = None,
    db: Session = Depends(get_db),
):
    """
    Retrieve all observations for a family, optionally filtered by time range.

    :param family_id: The ID of the family.
    :param start: (Optional) Start datetime for filtering.
    :param end: (Optional) End datetime for filtering.
    :param db: Database session.
    :return: List of Observation objects.
    """
    query = db.query(models.Observation).filter(
        models.Observation.family_id == family_id
    )
    if start:
        query = query.filter(models.Observation.ts >= start)
    if end:
        query = query.filter(models.Observation.ts <= end)
    return query.all()
