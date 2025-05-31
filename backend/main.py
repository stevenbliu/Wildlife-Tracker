"""
main.py
=======

This is the main entry point for the Wildlife Tracker FastAPI backend.

- Initializes the FastAPI app and includes all API routers.
- Sets up CORS middleware for frontend-backend communication.
- Handles database initialization and extension setup (PostGIS, TimescaleDB).
- Provides a health check endpoint for database connectivity.

Routers included:
    - Herds
    - Families
    - Observations
    - Events
    - Overtime (metrics)
    - Nearby (spatial queries)
"""

from fastapi import FastAPI, Depends, HTTPException, status, Query
from sqlalchemy import text

from database import SessionLocal, engine, Base
from fastapi.middleware.cors import CORSMiddleware

from api.herds import router as herds_router
from api.families import router as families_router
from api.observations import router as observations_router
from api.events import router as events_router
from api.overtime import router as overtime_router
from api.nearby import router as nearby_router

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

app.include_router(herds_router)
app.include_router(families_router)
app.include_router(observations_router)
app.include_router(events_router)
app.include_router(overtime_router)
app.include_router(nearby_router)


def get_db():
    """
    Dependency that provides a database session.
    Yields:
        db (Session): SQLAlchemy session.
    """
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def enable_timescale_and_postgis():
    """
    Enables PostGIS and TimescaleDB extensions if not already enabled.
    Also creates a hypertable for the 'observations' table on the 'ts' column.
    """
    with SessionLocal() as session:
        session.execute(text("CREATE EXTENSION IF NOT EXISTS postgis"))
        session.execute(text("CREATE EXTENSION IF NOT EXISTS timescaledb"))
        session.commit()

        # Create hypertable for 'observations' on timestamp column 'ts'
        session.execute(
            text(
                "SELECT create_hypertable('observations', 'ts', if_not_exists => TRUE)"
            )
        )
        session.commit()


@app.on_event("startup")
def startup_event():
    """
    FastAPI startup event.
    Ensures PostGIS and TimescaleDB extensions are enabled and hypertable is created.
    """
    enable_timescale_and_postgis()
    print("PostGIS and TimescaleDB extensions enabled.")


@app.get("/api/test_db/", status_code=status.HTTP_200_OK)
def test_db_connection():
    """
    Health check endpoint for database connectivity.

    Returns:
        dict: Success message if DB connection works.
    Raises:
        HTTPException: If the DB connection fails.
    """
    try:
        with SessionLocal() as session:
            session.execute(text("SELECT 1"))
        return {"message": "Database connection successful!"}
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database connection failed: {e}",
        )
