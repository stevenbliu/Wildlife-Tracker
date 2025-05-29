from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

DATABASE_URL = "postgresql://user:password@postgres:5432/wildlife"

engine = create_engine(DATABASE_URL, pool_pre_ping=True)
# Exta parameters to consider:
# engine = create_engine(
#     DATABASE_URL,
#     pool_pre_ping=True,  # makes sure connections are still alive before using them, which helps prevent errors with stale connections.
#     pool_size=10,        # max persistent connections in pool
#     max_overflow=20,     # extra connections allowed beyond pool_size
#     pool_timeout=30      # seconds to wait when no connections available
# )

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


# TODO: Scaling for DB

# DB Indexes	Add indexes on ts, latitude, longitude, family_id, and herd_id
# Async Routes	Use FastAPI's async def and asyncpg with PostgreSQL
# Partitioning - Partition by time (e.g., monthly) or by herd_id (speciies name) or location (country/region)


# 🔹 TimescaleDB:
# Use time_bucket for grouping time-series data (e.g., hourly/daily averages).

# Use continuous aggregates for performant dashboards.

# Apply compression and retention policies automatically.

# 🔹 PostGIS:
# Use ST_DWithin, ST_Intersects, etc., to filter by geographic distance or region.

# Use spatial indexes (GIST) to speed up these queries.