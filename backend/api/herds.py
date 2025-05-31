"""
Herds API endpoints.

This module provides endpoints for managing wildlife herds and their observations.

Endpoints:
    - POST /api/herds
    - GET /api/herds/{herd_id}
    - GET /api/herds
    - GET /api/herds/{herd_id}/observations
"""

from fastapi import APIRouter, Depends, Query, HTTPException, status
import models, schemas
from sqlalchemy.orm import Session
from database import get_db
from typing import List
from datetime import datetime

router = APIRouter(prefix="/api/herds", tags=["Herds"])


@router.post("", response_model=schemas.Herd, status_code=status.HTTP_201_CREATED)
def create_herd(herd: schemas.HerdCreate, db: Session = Depends(get_db)):
    """
    Create a new herd. If a herd with the same species_name already exists, do not add it.

    :param herd: Herd creation data.
    :param db: Database session.
    :return: The created Herd object.
    :raises HTTPException: If a herd with the same species_name already exists.
    """
    existing_herd = (
        db.query(models.Herd)
        .filter(models.Herd.species_name == herd.species_name)
        .first()
    )
    if existing_herd:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Herd with species_name '{herd.species_name}' already exists.",
        )
    db_herd = models.Herd(**herd.dict())
    db.add(db_herd)
    db.commit()
    db.refresh(db_herd)
    return db_herd


@router.get("", response_model=List[schemas.Herd])
def get_all_herds(db: Session = Depends(get_db)):
    """
    Retrieve all herds.

    :param db: Database session.
    :return: List of all Herd objects.
    """
    herds = db.query(models.Herd).all()
    return herds


@router.get("/{herd_id}/observations", response_model=List[schemas.Observation])
def get_herd_observations(
    herd_id: int,
    start: datetime = None,
    end: datetime = None,
    db: Session = Depends(get_db),
):
    """
    Retrieve all observations for a herd, optionally filtered by time range.

    :param herd_id: The ID of the herd.
    :param start: (Optional) Start datetime for filtering.
    :param end: (Optional) End datetime for filtering.
    :param db: Database session.
    :return: List of Observation objects.
    """
    query = (
        db.query(models.Observation)
        .join(models.Family)
        .filter(models.Family.herd_id == herd_id)
    )
    if start:
        query = query.filter(models.Observation.ts >= start)
    if end:
        query = query.filter(models.Observation.ts <= end)
    return query.all()
