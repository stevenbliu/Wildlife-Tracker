Core Entities (Postgres)

Tables
------
Herd:
id (PK), species_name, description, created_at, updated_at

Family:
id (PK), herd_id (FK), friendly_name, created_at, updated_at

Event:
id (PK), family_id (FK), description, latitude, longitude, ts, metadata