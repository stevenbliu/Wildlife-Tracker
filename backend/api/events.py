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

router = APIRouter(prefix="/events", tags=["Events"])
