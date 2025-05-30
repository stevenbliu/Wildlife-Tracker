from fastapi import FastAPI, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import text
from datetime import datetime, timedelta

from database import SessionLocal, engine, Base
import models, schemas
from fastapi.middleware.cors import CORSMiddleware

from geoalchemy2.shape import from_shape
from shapely.geometry import Point
from typing import List

# Create tables (in prod, use Alembic migrations)
# Base.metadata.drop_all(bind=engine)  # Remove this in production
Base.metadata.create_all(bind=engine)

app = FastAPI(title="WildlifeTracker API")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # or ["*"] for all origins (less secure)
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Define valid metrics for the /overtime endpoint
VALID_METRICS = {
    "location": ["latitude", "longitude"],
    "size": ["size"],
    "health": ["health_rating"]
}

# Dependency for DB
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def enable_timescale_and_postgis():
    with SessionLocal() as session:
        session.execute(text("CREATE EXTENSION IF NOT EXISTS postgis"))
        session.execute(text("CREATE EXTENSION IF NOT EXISTS timescaledb"))
        session.commit()

        # Create hypertable for 'observations' on timestamp column 'ts'
        session.execute(text("SELECT create_hypertable('observations', 'ts', if_not_exists => TRUE)"))
        session.commit()

# Startup event
@app.on_event("startup")
def startup_event():
    enable_timescale_and_postgis()
    print("PostGIS and TimescaleDB extensions enabled.")

# Health Check Endpoint
@app.get("/api/test_db/", status_code=status.HTTP_200_OK)
def test_db_connection():
    try:
        with SessionLocal() as session:
            session.execute(text("SELECT 1"))
        return {"message": "Database connection successful!"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database connection failed: {e}",
        )

# Herd Endpoints
@app.post("/api/herds", response_model=schemas.Herd, status_code=status.HTTP_201_CREATED)
def create_herd(herd: schemas.HerdCreate, db: Session = Depends(get_db)):
    db_herd = models.Herd(**herd.dict())
    db.add(db_herd)
    db.commit()
    db.refresh(db_herd)
    return db_herd

@app.get("/api/herds/{herd_id}", response_model=schemas.Herd)
def get_herd(herd_id: int, db: Session = Depends(get_db)):
    herd = db.query(models.Herd).filter(models.Herd.id == herd_id).first()
    if not herd:
        raise HTTPException(status_code=404, detail="Herd not found")
    return herd

@app.get("/api/herds", response_model=List[schemas.Herd])
def get_all_herds(db: Session = Depends(get_db)):
    herds = db.query(models.Herd).all()
    return herds

# Family Endpoints
@app.post("/api/families", response_model=schemas.Family, status_code=status.HTTP_201_CREATED)
def create_family(family: schemas.FamilyCreate, db: Session = Depends(get_db)):
    if family.herd_id is None:
        raise HTTPException(status_code=422, detail="herd_id is required and must be an integer")
    herd = db.query(models.Herd).filter(models.Herd.id == family.herd_id).first()
    if not herd:
        raise HTTPException(status_code=404, detail="Herd not found")
    db_family = models.Family(**family.dict())
    db.add(db_family)
    db.commit()
    db.refresh(db_family)
    return db_family

@app.get("/api/families/{family_id}", response_model=schemas.Family)
def get_family(family_id: int, db: Session = Depends(get_db)):
    family = db.query(models.Family).filter(models.Family.id == family_id).first()
    if not family:
        raise HTTPException(status_code=404, detail="Family not found")
    return family

@app.get("/api/families", response_model=List[schemas.Family])
def get_all_families(db: Session = Depends(get_db)):
    families = db.query(models.Family).all()
    return families

@app.get("/api/families/by-herd/{herd_id}", response_model=List[schemas.Family])
def get_families_by_herd(herd_id: int, db: Session = Depends(get_db)):
    # Optional: check if herd exists first
    herd = db.query(models.Herd).filter(models.Herd.id == herd_id).first()
    if not herd:
        raise HTTPException(status_code=404, detail="Herd not found")

    families = db.query(models.Family).filter(models.Family.herd_id == herd_id).all()
    return families

# Observation Endpoints
@app.post("/api/families/{family_id}/observations", status_code=status.HTTP_201_CREATED)
def create_observation(
    family_id: int,
    observation: schemas.ObservationCreate,
    db: Session = Depends(get_db),
):
    family = db.query(models.Family).filter(models.Family.id == family_id).first()
    if not family:
        raise HTTPException(status_code=404, detail="Family not found")
    obs_data = observation.dict()
    obs_data["family_id"] = family_id
    if obs_data.get("ts") is None:
        obs_data["ts"] = datetime.utcnow()
    obs_data['location'] = from_shape(Point(obs_data["longitude"], obs_data["latitude"]), srid=4326)
    db_observation = models.Observation(**obs_data)
    db.add(db_observation)
    db.commit()
    return {"message": "Observation created"}

# Event Endpoints
@app.post("/api/families/{family_id}/events", status_code=status.HTTP_201_CREATED)
def create_event(family_id: int, event: schemas.EventCreate, db: Session = Depends(get_db)):
    family = db.query(models.Family).filter(models.Family.id == family_id).first()
    if not family:
        raise HTTPException(status_code=404, detail="Family not found")
    event_data = event.dict()
    event_data["family_id"] = family_id
    event_data['location'] = from_shape(Point(event_data["longitude"], event_data["latitude"]), srid=4326)

    if event_data.get("ts") is None:
        event_data["ts"] = datetime.utcnow()
    db_event = models.Event(**event_data)
    db.add(db_event)
    db.commit()
    return {"message": "Event created"}

# Queries for GUI

@app.get("/api/herds/{herd_id}/observations")
def get_herd_observations(herd_id: int, start: datetime = None, end: datetime = None, db: Session = Depends(get_db)):
    query = db.query(models.Observation).join(models.Family).filter(models.Family.herd_id == herd_id)
    if start:
        query = query.filter(models.Observation.ts >= start)
    if end:
        query = query.filter(models.Observation.ts <= end)
    return query.all()

@app.get("/api/families/{family_id}/observations")
def get_family_observations(family_id: int, start: datetime = None, end: datetime = None, db: Session = Depends(get_db)):
    query = db.query(models.Observation).filter(models.Observation.family_id == family_id)
    if start:
        query = query.filter(models.Observation.ts >= start)
    if end:
        query = query.filter(models.Observation.ts <= end)
    return query.all()

@app.get("/api/families/{family_id}/metrics")
def get_family_metrics(family_id: int, start: datetime = None, end: datetime = None, db: Session = Depends(get_db)):
    query = db.query(models.Observation.ts, models.Observation.size, models.Observation.health_rating)\
              .filter(models.Observation.family_id == family_id)
    if start:
        query = query.filter(models.Observation.ts >= start)
    if end:
        query = query.filter(models.Observation.ts <= end)
    return query.order_by(models.Observation.ts).all()

# Use PostGIS geography type and ST_DWithin for efficient radius search

@app.get("/api/observations/nearby")
def get_nearby_observations(
    lat: float,
    lng: float,
    radius_km: float = 5,
    start: datetime = None,
    end: datetime = None,
    db: Session = Depends(get_db)
):
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
        {"lng": lng, "lat": lat, "radius_meters": radius_meters, "start": start, "end": end}
    ).fetchall()
    
    print(results)
    return [dict(row._mapping) for row in results]

@app.get("/api/events/nearby")
def get_nearby_events(
    lat: float,
    lng: float,
    radius_km: float = 5,
    start: datetime = None,
    end: datetime = None,
    db: Session = Depends(get_db)
):
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
        {"lng": lng, "lat": lat, "radius_meters": radius_meters, "start": start, "end": end}
    ).fetchall()

    return [dict(row._mapping) for row in results]

# TimescaleDB Over time Query
@app.get("/api/overtime")
def get_overtime_data(
    entity_type: str = Query(..., pattern="^(herd|family)$"),
    entity_id: int = Query(...),
    metrics: str = Query(..., description="Comma separated metrics: location,size,health"),
    start: datetime = Query(None),
    end: datetime = Query(None),
    bucket: str = Query("1 day"),
    db: Session = Depends(get_db),
):
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

    # Build SQL based on entity type
    if entity_type == "herd":
        sql = f"""
        SELECT
          family_id,
          time_bucket(:bucket, ts) AS bucket,
          {select_clause}
        FROM observations
        JOIN families ON observations.family_id = families.id
        WHERE families.herd_id = :entity_id
          AND ts BETWEEN :start AND :end
        GROUP BY family_id, bucket
        ORDER BY family_id, bucket
        """
    else:
        sql = f"""
        SELECT
          time_bucket(:bucket, ts) AS bucket,
          {select_clause}
        FROM observations
        WHERE family_id = :entity_id
          AND ts BETWEEN :start AND :end
        GROUP BY bucket
        ORDER BY bucket
        """

    results = db.execute(
        text(sql),
        {"entity_id": entity_id, "start": start, "end": end, "bucket": bucket}
    ).mappings().all()  # <-- this makes row["bucket"] work

    # Build dynamic response
    response = []
    for row in results:
        entry = {"time_bucket": row["bucket"]}
        if entity_type == "herd":
            entry["family_id"] = row["family_id"]
        if "location" in requested_metrics:
            entry["avg_lat"] = row["avg_lat"]
            entry["avg_lng"] = row["avg_lng"]
        if "size" in requested_metrics:
            entry["avg_size"] = row["avg_size"]
        if "health" in requested_metrics:
            entry["avg_health"] = row["avg_health"]
        response.append(entry)

    return response