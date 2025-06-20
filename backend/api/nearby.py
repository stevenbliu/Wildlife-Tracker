"""
Nearby API endpoints.

This module provides endpoints for spatial queries to find families near a location.

Endpoints:
    - GET /api/nearby/families
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

router = APIRouter(prefix="/api/nearby", tags=["Nearby"])


@router.get("/families", response_model=List[schemas.Family])
def get_nearby_families(
    lat: float = Query(..., description="Latitude of the center point"),
    lng: float = Query(..., description="Longitude of the center point"),
    radius_km: float = Query(5, description="Search radius in kilometers"),
    start: Optional[datetime] = Query(
        None, description="Start timestamp filter (optional)"
    ),
    end: Optional[datetime] = Query(
        None, description="End timestamp filter (optional)"
    ),
    db: Session = Depends(get_db),
):
    """
    Get families near a geographic point.

    :param lat: Latitude of the center point.
    :param lng: Longitude of the center point.
    :param radius_km: Search radius in kilometers.
    :param start: (Optional) Start timestamp for filtering.
    :param end: (Optional) End timestamp for filtering.
    :param db: Database session.
    :return: List of Family objects within the specified area and time range.
    """
    radius_meters = radius_km * 1000

    sql = """
        SELECT DISTINCT 
            f.id, 
            f.friendly_name, 
            f.herd_id,
            f.created_at,
            f.updated_at
        FROM families f
        JOIN observations o ON o.family_id = f.id
        WHERE ST_DWithin(
            geography(ST_MakePoint(o.longitude, o.latitude)),
            geography(ST_MakePoint(:lng, :lat)),
            :radius_meters
        )
    """

    if start:
        sql += " AND o.ts >= :start"
    if end:
        sql += " AND o.ts <= :end"

    params = {"lng": lng, "lat": lat, "radius_meters": radius_meters}
    if start:
        params["start"] = start
    if end:
        params["end"] = end

    result = db.execute(text(sql), params).mappings().all()

    families = [
        schemas.Family(
            id=row["id"],
            friendly_name=row["friendly_name"],
            herd_id=row["herd_id"],
            created_at=row["created_at"],
            updated_at=row["updated_at"],
        )
        for row in result
    ]

    return families


@router.get("/events")
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
