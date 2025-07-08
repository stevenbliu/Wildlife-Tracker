# Use TimescaleDB with PostGIS as the base image
FROM timescale/timescaledb-ha:pg15.13-ts2.20.1

# Set environment variables (can be overridden by cloud env or .env)
ENV POSTGRES_USER=user \
    POSTGRES_PASSWORD=password \
    POSTGRES_DB=wildlife

# Copy any custom initialization scripts (SQL, sh, etc.)
COPY init-scripts/ /docker-entrypoint-initdb.d/

# Expose PostgreSQL port
EXPOSE 5432

# Healthcheck (optional if your cloud provider supports it another way)
HEALTHCHECK --interval=10s --timeout=5s --retries=5 CMD pg_isready -U user
