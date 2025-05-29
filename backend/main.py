from fastapi import FastAPI, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from datetime import datetime

from database import SessionLocal, engine, Base
import models, schemas

# Create tables (in prod, use Alembic migrations)
Base.metadata.drop_all(
    bind=engine
)  # Don't use drop_all() in production — it deletes all data.
Base.metadata.create_all(bind=engine)

app = FastAPI(title="WildlifeTracker API")


# Startup event: test DB connection
@app.on_event("startup")
@app.get("/api/test_db/", status_code=status.HTTP_200_OK)
def test_db_connection():
    try:
        with SessionLocal() as session:
            session.execute(text("SELECT 1"))
        print("Database connection successful!")
        return {"message": "Database connection successful!"}
    except Exception as e:
        print(f"Database connection failed: {e}")
        return HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Database connection failed",
        )


# app = FastAPI(title="WildlifeTracker API", lifespan=lifespan)


# Dependency for DB
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# Herd endpoints
@app.post(
    "/api/herds", response_model=schemas.Herd, status_code=status.HTTP_201_CREATED
)
def create_herd(herd: schemas.HerdCreate, db: Session = Depends(get_db)):
    db_herd = models.Herd(**herd.dict())
    db.add(db_herd)
    db.commit()
    db.refresh(db_herd)
    # print("Returnig herd:", db_herd)
    return db_herd


@app.get("/api/herds/{herd_id}", response_model=schemas.Herd)
def get_herd(herd_id: int, db: Session = Depends(get_db)):
    herd = db.query(models.Herd).filter(models.Herd.id == herd_id).first()
    if not herd:
        raise HTTPException(status_code=404, detail="Herd not found")
    return herd


# Family endpoints
@app.post(
    "/api/families", response_model=schemas.Family, status_code=status.HTTP_201_CREATED
)
def create_family(family: schemas.FamilyCreate, db: Session = Depends(get_db)):
    if family.herd_id is None:
        raise HTTPException(
            status_code=422, detail="herd_id is required and must be an integer"
        )

    herd = db.query(models.Herd).filter(models.Herd.id == family.herd_id).first()
    if not herd:
        print("Herd not found for family creation")
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


# Observation endpoint
@app.post("/api/families/{family_id}/observations", status_code=status.HTTP_201_CREATED)
def create_observation(
    family_id: int,
    observation: schemas.ObservationCreate,
    db: Session = Depends(get_db),
):

    if not family_id:
        raise HTTPException(
            status_code=422, detail="family_id is null and must be an integer"
        )
        return

    family = db.query(models.Family).filter(models.Family.id == family_id).first()
    if not family:
        raise HTTPException(status_code=404, detail="Family not found")
    obs_data = observation.dict()
    obs_data["family_id"] = family_id
    if obs_data.get("ts") is None:
        obs_data["ts"] = datetime.utcnow()
    db_observation = models.Observation(**obs_data)
    db.add(db_observation)
    db.commit()
    # TODO: Publish to Kafka, Index to ES here
    return {"message": "Observation created"}


# Event endpoint
@app.post("/api/families/{family_id}/events", status_code=status.HTTP_201_CREATED)
def create_event(
    family_id: int, event: schemas.EventCreate, db: Session = Depends(get_db)
):
    family = db.query(models.Family).filter(models.Family.id == family_id).first()
    if not family:
        raise HTTPException(status_code=404, detail="Family not found")
    event_data = event.dict()
    event_data["family_id"] = family_id
    if event_data.get("ts") is None:
        event_data["ts"] = datetime.utcnow()
    db_event = models.Event(**event_data)
    db.add(db_event)
    db.commit()
    # TODO: Publish to Kafka, Index to ES here
    return {"message": "Event created"}
