# Gridware-Take-Home-Exercise-Wildlife

System Design:

    Backend API - Python, FastAPI, SQLAlchemy
        Ingest data, store observations, search events
    Frontend - React/Vite + Leaflet.js	(Avoided Mapbox because Leaflet is free and open-source)
        GUI for rangers with map visualizations
    Data Storage - PostgreSQL (TimescaleDB + PostGIS)	
        Fast time-series tracking of observations
        Fast geospatial queries for nearby events and observations
    DevOps - Docker + Docker Compose	
        Containerized local development
    Testing - Locust
        Load testing to simulate data

    TODO:
        Kafka
            - to mange data ingestion to prevent PostgreSQL from overloading
        ElasticSearch 
            - optimize event/desription searching
        Cassandra
            - if writes are too much, then we might need to switch DBs
        CI/CD - GitHub Actions
            - automate unit/integration tests
            - e2e tests on staging environments
            - automatic deployments
        


API Endpoints:

    POST /families/                  # Register a new Family
    POST /observations/              # Submit movement/health observation
    POST /events/                    # Submit a notable event
    GET  /herds/{herd_id}/paths      # Track all families over time
    GET  /families/{family_id}/track # Family's path, size, health over time
    GET  /location/families          # Get families near a location
    GET  /location/events            # Get events near a location

Data Models:

    Herd:
    id (PK), species_name, description, created_at, updated_at

    Family:
    id (PK), herd_id (FK), friendly_name, created_at, updated_at

    Event:
    id (PK), family_id (FK), description, latitude, longitude, ts, metadata



## FUTURE ##
Data Migrations:
    - 