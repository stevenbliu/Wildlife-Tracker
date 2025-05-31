"""
Overtime API endpoints.

This module provides endpoints for time-bucketed metrics for families and herds.

Endpoints:
    - GET /api/overtime
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

router = APIRouter(prefix="/api/overtime", tags=["Overtime"])


# Define valid metrics for the /overtime endpoint
VALID_METRICS = {
    "location": ["latitude", "longitude"],
    "size": ["size"],
    "health": ["health_rating"],
}


@router.get("")
def get_overtime_data(
    entity_type: str = Query(..., pattern="^(herd|family)$"),
    entity_id: str = Query(..., description="Comma separated entity IDs"),
    metrics: str = Query(
        ..., description="Comma separated metrics: location,size,health"
    ),
    start: datetime = Query(None),
    end: datetime = Query(None),
    bucket: str = Query("1 day"),
    db: Session = Depends(get_db),
):
    """
    Get time-bucketed metrics for families or herds.

    :param entity_type: "herd" or "family".
    :param entity_id: Comma separated entity IDs.
    :param metrics: Comma separated metrics: location,size,health.
    :param start: (Optional) Start datetime for filtering.
    :param end: (Optional) End datetime for filtering.
    :param bucket: Time bucket size (e.g., "1 day").
    :param db: Database session.
    :return: List of time-bucketed metric records.
    """
    # Set default time window to last 30 days
    now = datetime.utcnow()
    if not end:
        end = now
    if not start:
        start = now - timedelta(days=30)

    # Parse requested metrics
    requested_metrics = set(metrics.split(","))
    invalid = requested_metrics - VALID_METRICS.keys()
    if invalid:
        raise HTTPException(status_code=400, detail=f"Invalid metrics: {invalid}")

    # Parse entity_id list
    try:
        entity_ids = [int(eid.strip()) for eid in entity_id.split(",") if eid.strip()]
        if not entity_ids:
            raise ValueError("No valid entity IDs provided")
    except ValueError:
        raise HTTPException(
            status_code=400, detail="Invalid entity_id parameter format"
        )

    # Build SELECT fields based on metrics
    select_fields = []
    if "location" in requested_metrics:
        select_fields.append("AVG(latitude) AS avg_lat")
        select_fields.append("AVG(longitude) AS avg_lng")
    if "size" in requested_metrics:
        select_fields.append("AVG(size) AS avg_size")
    if "health" in requested_metrics:
        select_fields.append("AVG(health_rating) AS avg_health")

    if not select_fields:
        raise HTTPException(status_code=400, detail="No valid metrics requested")

    select_clause = ", ".join(select_fields)

    # Use parameterized list for entity IDs in SQL
    # Note: SQLAlchemy text() does not natively support passing list parameters for IN clauses.
    # We need to build a dynamic parameter list and bind them individually.

    # Prepare entity_id parameters for SQL query
    entity_id_params = {}
    entity_id_placeholders = []
    for i, eid in enumerate(entity_ids):
        key = f"entity_id_{i}"
        entity_id_placeholders.append(f":{key}")
        entity_id_params[key] = eid

    entity_id_in_clause = ", ".join(entity_id_placeholders)

    if entity_type == "herd":
        sql = f"""
            SELECT
                o.family_id,
                f.friendly_name AS friendly_name,
                f.herd_id,
                h.species_name,
                time_bucket(:bucket, o.ts) AS bucket,
                {select_clause}
            FROM observations o
            JOIN families f ON o.family_id = f.id
            JOIN herds h ON f.herd_id = h.id
            WHERE f.herd_id IN ({entity_id_in_clause})
              AND o.ts BETWEEN :start AND :end
            GROUP BY o.family_id, f.friendly_name, f.herd_id, h.species_name, bucket
            ORDER BY o.family_id, bucket
        """
    else:
        sql = f"""
            SELECT
                o.family_id,
                f.friendly_name AS friendly_name,
                f.herd_id,
                h.species_name,
                time_bucket(:bucket, o.ts) AS bucket,
                {select_clause}
            FROM observations o
            JOIN families f ON o.family_id = f.id
            JOIN herds h ON f.herd_id = h.id
            WHERE o.family_id IN ({entity_id_in_clause})
              AND o.ts BETWEEN :start AND :end
            GROUP BY o.family_id, f.friendly_name, f.herd_id, h.species_name, bucket
            ORDER BY bucket
        """

    # Combine all parameters
    query_params = {
        "start": start,
        "end": end,
        "bucket": bucket,
        **entity_id_params,
    }

    results = (
        db.execute(
            text(sql),
            query_params,
        )
        .mappings()
        .all()
    )

    # Build dynamic response
    response = []
    for row in results:
        entry = {
            "time_bucket": row["bucket"],
            "family_id": row["family_id"],
            "friendly_name": row["friendly_name"],
            "herd_id": row["herd_id"],
            "species_name": row["species_name"],
        }

        if "location" in requested_metrics:
            entry["avg_lat"] = row["avg_lat"]
            entry["avg_lng"] = row["avg_lng"]
        if "size" in requested_metrics:
            entry["avg_size"] = row["avg_size"]
        if "health" in requested_metrics:
            entry["avg_health"] = row["avg_health"]
        response.append(entry)

    return response
