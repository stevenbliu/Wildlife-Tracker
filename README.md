# Gridware-Take-Home-Exercise-Wildlife

System Design:

    Backend API - Python, FastAPI, PostgreSQL (TimescaleDB), Kafka, Elasticsearch	
        Ingest data, store observations, search events
    Frontend - React + Leaflet.js	(Avoided Mapbox because Leaflet is free and open-source)
        GUI for rangers with map visualizations
    Data Storage - PostgreSQL (TimescaleDB)	
        Time-series tracking of observations
    Search Index - Elasticsearch	
        Fast geospatial/event queries
    Messaging - Kafka	
        Decoupled ingestion pipeline for scalability
    DevOps - Docker + Docker Compose	
        Containerized local development


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

