"""
models.py

SQLAlchemy ORM models for the Wildlife Tracker backend.

Defines database tables for herds, families, events, and observations,
including relationships and geospatial fields.
"""

from sqlalchemy import (
    Column,
    Integer,
    String,
    ForeignKey,
    Float,
    DateTime,
    PrimaryKeyConstraint,
    Text,
)
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime
from geoalchemy2 import Geography
from sqlalchemy.dialects.postgresql import TIMESTAMP


class Herd(Base):
    """
    SQLAlchemy model for a wildlife herd.

    :param id: Primary key.
    :param species_name: Name of the species.
    :param description: Optional description.
    :param created_at: Timestamp when the herd was created.
    :param updated_at: Timestamp when the herd was last updated.
    :param families: Relationship to Family objects.
    """

    __tablename__ = "herds"
    id = Column(Integer, primary_key=True, index=True)
    species_name = Column(String, nullable=False, unique=True)
    description = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    families = relationship("Family", back_populates="herd")


class Family(Base):
    """
    SQLAlchemy model for a wildlife family.

    :param id: Primary key.
    :param herd_id: Foreign key to the herd.
    :param friendly_name: Human-friendly name for the family.
    :param created_at: Timestamp when the family was created.
    :param updated_at: Timestamp when the family was last updated.
    :param herd: Relationship to Herd object.
    """

    __tablename__ = "families"
    id = Column(Integer, primary_key=True, index=True)
    herd_id = Column(Integer, ForeignKey("herds.id"), nullable=False)
    friendly_name = Column(String, nullable=False, unique=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    herd = relationship("Herd", back_populates="families")
    # size = Column(Integer, nullable=False, default=0)
    # health_rating = Column(Integer, nullable=False, default=5)  # 1-10 scale


class Event(Base):
    """
    SQLAlchemy model for an event related to a family.

    :param id: Primary key.
    :param family_id: Foreign key to the family.
    :param description: Description of the event.
    :param latitude: Latitude of the event.
    :param longitude: Longitude of the event.
    :param location: Geospatial point (PostGIS).
    :param ts: Timestamp of the event.
    :param event_metadata: Optional metadata (JSON string).
    :param family: Relationship to Family object.
    """

    __tablename__ = "events"
    id = Column(Integer, primary_key=True, index=True)
    family_id = Column(Integer, ForeignKey("families.id"), nullable=False)
    description = Column(String, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    location = Column(
        Geography(geometry_type="POINT", srid=4326), nullable=False, index=True
    )
    ts = Column(TIMESTAMP(timezone=True), nullable=False, default=datetime.utcnow)
    event_metadata = Column(String, nullable=True)  # JSON string or nullable
    family = relationship("Family")


class Observation(Base):
    """
    SQLAlchemy model for an observation of a family.

    :param id: Primary key.
    :param family_id: Foreign key to the family.
    :param ts: Timestamp of the observation.
    :param latitude: Latitude of the observation.
    :param longitude: Longitude of the observation.
    :param location: Geospatial point (PostGIS).
    :param size: Size of the family observed.
    :param health_rating: Health rating (1-10 scale).
    :param observation_metadata: Optional metadata.
    :param family: Relationship to Family object.
    """

    __tablename__ = "observations"
    id = Column(Integer, autoincrement=True)
    family_id = Column(Integer, ForeignKey("families.id"), nullable=False)
    ts = Column(TIMESTAMP(timezone=True), nullable=False, default=datetime.utcnow)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    location = Column(
        Geography(geometry_type="POINT", srid=4326), nullable=False, index=True
    )
    size = Column(Integer, nullable=False, default=0)
    health_rating = Column(Integer, nullable=False, default=5)
    observation_metadata = Column(Text, nullable=True)
    family = relationship("Family")

    __table_args__ = (PrimaryKeyConstraint("id", "ts"),)
