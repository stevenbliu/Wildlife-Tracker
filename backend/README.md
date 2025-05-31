# Wildlife Tracker Backend

This backend powers the Wildlife Tracker application, providing RESTful APIs for registering herds and families, recording observations and events, and serving geospatial and time-series queries. It is built with **FastAPI**, uses **PostgreSQL** with **TimescaleDB** and **PostGIS** for scalable time-series and spatial data, and is designed for high performance and extensibility.

---

## Design Choices

### 1. **Database: PostgreSQL + TimescaleDB + PostGIS**
- **PostGIS** enables fast geospatial queries (e.g., "find all families within X km of a point") using spatial indexes and functions like `ST_DWithin`.
- **TimescaleDB** provides efficient time-series storage and querying, crucial for handling millions of observations and events over time.
- **Partitioning**: Large tables (e.g., `observations`, `events`) are partitioned by time (monthly) to keep queries fast as data grows.

### 2. **Indexing Strategy**
- **Spatial Indexes**:  
  ```sql
  CREATE INDEX idx_obs_geo ON observations USING GIST (geography(ST_MakePoint(longitude, latitude)));
  CREATE INDEX idx_event_geo ON events USING GIST (geography(ST_MakePoint(longitude, latitude)));
  ```
- **Time and Foreign Key Indexes**:  
  ```sql
  CREATE INDEX idx_obs_family_ts ON observations(family_id, ts);
  CREATE INDEX idx_obs_ts ON observations(ts);
  CREATE INDEX idx_event_ts ON events(ts);
  ```
- These indexes ensure fast filtering by family, time, and location.

### 3. **Efficient Query Patterns**
- **Batching**: Join and batch queries to minimize N+1 problems (e.g., batch by `family_id`).
- **DTOs**: Return lightweight Data Transfer Objects for frontend map rendering.
- **Pagination**: All endpoints support pagination (`LIMIT`/`OFFSET`) to avoid overloading the client or server.
- **Time Filtering**: Default queries filter to recent data (e.g., last 7 days).

### 4. **Async and Caching**
- **Async DB Access**: Use async drivers (e.g., `asyncpg`) for high concurrency.
- **Caching**: Use Redis to cache frequently accessed data, such as:
  - Herd → Family mappings
  - Recent observation clusters
  - Top event hotspots

---

## Scalability & Architecture Notes

- **Volume Handling**: Designed to handle 100K+ families, millions of observations, and events.
- **Partitioning**: Once tables exceed ~10M rows, partition by month:
  ```sql
  CREATE TABLE observations (
    ...
    ts timestamp NOT NULL
  ) PARTITION BY RANGE (ts);

  CREATE TABLE observations_2025_05 PARTITION OF observations
    FOR VALUES FROM ('2025-05-01') TO ('2025-06-01');
  ```
- **Spatial Queries**: Use `ST_DWithin` for fast "nearby" queries.
- **Future-Proofing**: Architecture allows for easy integration with Kafka, ElasticSearch, and other analytics tools.

---

## API Endpoints

- `POST /api/herds` - Register a new herd
- `POST /api/families` - Register a new family
- `POST /api/families/{family_id}/observations` - Submit an observation
- `POST /api/families/{family_id}/events` - Submit an event
- `GET /api/herds` - List all herds
- `GET /api/families` - List all families
- `GET /api/nearby/families` - Find families near a location
- `GET /api/events/nearby` - Find events near a location
- `GET /api/overtime` - Get time-bucketed metrics for families/herds

See [`main.py`](main.py) for full details.

---

## Potential Improvements

- **Async Endpoints**: Refactor all endpoints to use async DB access for better scalability.
- **Advanced Caching**: Add Redis caching for hot queries and frequently accessed data.
- **Background Jobs**: Use Celery or FastAPI background tasks for heavy analytics or periodic data aggregation.
- **Rate Limiting & Auth**: Add authentication and rate limiting for production use.
- **Monitoring**: Integrate with Prometheus/Grafana for metrics and alerting.
- **ElasticSearch**: For advanced event search and analytics.
- **Streaming**: Integrate with Kafka for real-time data ingestion and processing.
- **Testing**: Expand unit and integration test coverage.

---

## References

- [TimescaleDB Docs](https://docs.timescale.com/)
- [PostGIS Docs](https://postgis.net/documentation/)
- [FastAPI Docs](https://fastapi.tiangolo.com/)

---

## Database Schema

The backend uses PostgreSQL with TimescaleDB and PostGIS extensions. The main tables are:

### Herds

```sql
CREATE TABLE herds (
  id SERIAL PRIMARY KEY,
  species_name TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT now()
);
```

### Families

```sql
CREATE TABLE families (
  id SERIAL PRIMARY KEY,
  herd_id INTEGER REFERENCES herds(id),
  friendly_name TEXT,
  created_at TIMESTAMP DEFAULT now()
);
```

### Observations (Partitioned by Month)

```sql
CREATE TABLE observations (
  id SERIAL PRIMARY KEY,
  family_id INTEGER REFERENCES families(id),
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  size INTEGER,
  health INTEGER,
  ts TIMESTAMP NOT NULL
) PARTITION BY RANGE (ts);

-- Example partition:
CREATE TABLE observations_2025_05 PARTITION OF observations
  FOR VALUES FROM ('2025-05-01') TO ('2025-06-01');
```

### Events

```sql
CREATE TABLE events (
  id SERIAL PRIMARY KEY,
  family_id INTEGER REFERENCES families(id),
  description TEXT,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  ts TIMESTAMP NOT NULL,
  event_metadata JSONB
);
```

---

## Data Models

The main Pydantic models (see `schemas.py`) are:

```python
class Herd(BaseModel):
    id: int
    species_name: str
    created_at: datetime

class Family(BaseModel):
    id: int
    herd_id: int
    friendly_name: str
    created_at: datetime

class Observation(BaseModel):
    id: int
    family_id: int
    latitude: float
    longitude: float
    size: Optional[int]
    health: Optional[int]
    ts: datetime

class Event(BaseModel):
    id: int
    family_id: int
    description: str
    latitude: float
    longitude: float
    ts: datetime
    event_metadata: Optional[dict]
```

---