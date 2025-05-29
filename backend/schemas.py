from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime


class HerdBase(BaseModel):
    species_name: str
    description: Optional[str] = None


class HerdCreate(HerdBase):
    pass


class Herd(HerdBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True


class FamilyBase(BaseModel):
    friendly_name: str
    herd_id: int = Field(..., description="Must be a valid herd ID (integer)")


class FamilyCreate(FamilyBase):
    pass


class Family(FamilyBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        orm_mode = True


class EventCreate(BaseModel):
    description: str
    latitude: float
    longitude: float
    ts: Optional[datetime] = None
    metadata: Optional[str] = None


class Event(EventCreate):
    id: int
    family_id: int
    ts: datetime

    class Config:
        orm_mode = True


class ObservationCreate(BaseModel):
    latitude: float
    longitude: float
    size: int
    health_rating: int
    ts: Optional[datetime] = None


class Observation(ObservationCreate):
    family_id: int
    ts: datetime

    class Config:
        orm_mode = True
