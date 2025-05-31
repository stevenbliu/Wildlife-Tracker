"""
Events API endpoints.

This module provides endpoints for querying wildlife events, including spatial queries.

Endpoints:
    - GET /api/events/nearby
"""

from fastapi import APIRouter, Depends, Query, HTTPException, status
import models, schemas
from sqlalchemy.orm import Session
from database import get_db
from typing import List
from datetime import datetime
from geoalchemy2.shape import from_shape
from sqlalchemy import text

router = APIRouter(prefix="/api/events", tags=["Events"])


@router.get("/nearby")
def get_nearby_events(
    lat: float,
    lng: float,
    radius_km: float = 5,
    start: datetime = None,
    end: datetime = None,
    db: Session = Depends(get_db),
):
    """
    Get events near a geographic point.

    :param lat: Latitude of the center point.
    :param lng: Longitude of the center point.
    :param radius_km: Search radius in kilometers.
    :param start: (Optional) Start timestamp for filtering.
    :param end: (Optional) End timestamp for filtering.
    :param db: Database session.
    :return: List of event records as dicts.
    """
    radius_meters = radius_km * 1000
    query = """
        SELECT * FROM events
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
