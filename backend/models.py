from sqlalchemy import Column, Integer, String, ForeignKey, Float, DateTime, PrimaryKeyConstraint, Text
from sqlalchemy.orm import relationship
from database import Base
from datetime import datetime
from geoalchemy2 import Geography
from sqlalchemy.dialects.postgresql import TIMESTAMP


class Herd(Base):
    __tablename__ = "herds"
    id = Column(Integer, primary_key=True, index=True)
    species_name = Column(String, nullable=False)
    description = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    families = relationship("Family", back_populates="herd")


class Family(Base):
    __tablename__ = "families"
    id = Column(Integer, primary_key=True, index=True)
    herd_id = Column(Integer, ForeignKey("herds.id"), nullable=False)
    friendly_name = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    herd = relationship("Herd", back_populates="families")
    # size = Column(Integer, nullable=False, default=0)
    # health_rating = Column(Integer, nullable=False, default=5)  # 1-10 scale


class Event(Base):
    __tablename__ = "events"
    id = Column(Integer, primary_key=True, index=True)
    family_id = Column(Integer, ForeignKey("families.id"), nullable=False)
    description = Column(String, nullable=False)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    location = Column(Geography(geometry_type='POINT', srid=4326), nullable=False, index=True)
    ts = Column(TIMESTAMP(timezone=True), nullable=False, default=datetime.utcnow)
    event_metadata = Column(String, nullable=True)  # JSON string or nullable
    family = relationship("Family")

class Observation(Base):
    __tablename__ = "observations"
    id = Column(Integer, autoincrement=True)
    family_id = Column(Integer, ForeignKey("families.id"), nullable=False)
    ts = Column(TIMESTAMP(timezone=True), nullable=False, default=datetime.utcnow)
    latitude = Column(Float, nullable=False)
    longitude = Column(Float, nullable=False)
    location = Column(Geography(geometry_type='POINT', srid=4326), nullable=False, index=True)
    size = Column(Integer, nullable=False, default=0)
    health_rating = Column(Integer, nullable=False, default=5)
    observation_metadata = Column(Text, nullable=True)
    family = relationship("Family")

    __table_args__ = (
        PrimaryKeyConstraint('id', 'ts'),
    )