"""
Observations API endpoints.

This module provides endpoints for querying wildlife observations, including spatial queries.

Endpoints:
    - GET /api/observations/nearby
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

router = APIRouter(prefix="/observations", tags=["Observations"])


@router.get("/nearby")
def get_nearby_observations(
    lat: float,
    lng: float,
    radius_km: float = 5,
    start: datetime = None,
    end: datetime = None,
    db: Session = Depends(get_db),
):
    """
    Get observations near a geographic point.

    :param lat: Latitude of the center point.
    :param lng: Longitude of the center point.
    :param radius_km: Search radius in kilometers.
    :param start: (Optional) Start timestamp for filtering.
    :param end: (Optional) End timestamp for filtering.
    :param db: Database session.
    :return: List of observation records as dicts.
    """
    radius_meters = radius_km * 1000
    query = """
        SELECT * FROM observations
        WHERE ST_DWithin(
            geography(ST_MakePoint(longitude, latitude)),
            geography(ST_MakePoint(:lng, :lat)),
            :radius_meters
        )
    """
    if start:
        query += " AND ts >= :start"
    if end:
        query += " AND ts <= :end"

    results = db.execute(
        text(query),
        {
            "lng": lng,
            "lat": lat,
            "radius_meters": radius_meters,
            "start": start,
            "end": end,
        },
    ).fetchall()

    return [dict(row._mapping) for row in results]
