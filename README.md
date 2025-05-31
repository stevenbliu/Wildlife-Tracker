# Wildlife Tracker

A full-stack system for tracking wildlife herds and families, visualizing their movements, and recording events and observations. The project is designed for rangers and researchers to monitor animal populations using geospatial and time-series data.

---

## Features

- **Backend API**: Python, FastAPI, SQLAlchemy, TimescaleDB, PostGIS
  - Register herds and families
  - Record observations and events with geospatial data
  - Efficient time-series and spatial queries (e.g., families/events near a location, metrics over time)
- **Frontend**: React (Vite), TypeScript, Leaflet.js
  - Interactive map with family/herd tracks and event markers
  - Selection panel for filtering by herd, family, time bucket, and metrics
  - Chart visualizations of family metrics over time
- **DevOps**: Docker, Docker Compose
  - Containerized local development for backend, frontend, database, and load testing
- **Testing**: Locust for load testing API endpoints

---

## Repository Structure

```
.
├── backend/         # FastAPI backend (Python)
│   ├── main.py
│   ├── models.py
│   ├── schemas.py
│   ├── database.py
│   ├── requirements.txt
│   └── ...
├── frontend/        # React frontend (TypeScript, Vite)
│   ├── src/
│   │   ├── App.tsx
│   │   ├── components/
│   │   ├── api/
│   │   ├── utils/
│   │   └── ...
│   ├── public/
│   ├── package.json
│   ├── Dockerfile
│   └── ...
├── locust/          # Load testing scripts (Python)
│   ├── locustfile.py
│   └── Dockerfile
├── init-scripts/    # DB initialization scripts
│   └── init.sql
├── docker-compose.yaml
└── README.md
```

---

## Getting Started

### Prerequisites

- [Docker](https://www.docker.com/)
- [Docker Compose](https://docs.docker.com/compose/)

### Quick Start

1. **Clone the repository:**
   ```sh
   git clone <repo-url>
   cd Gridware-Take-Home-Exercise-Wildlife
   ```

2. **Start all services:**
   ```sh
   docker-compose up --build
   ```
   This will start:
   - PostgreSQL with TimescaleDB and PostGIS
   - FastAPI backend (http://localhost:8000)
   - React frontend (http://localhost:3000)
   - Locust load testing (http://localhost:8089)
   - PgAdmin (http://localhost:8080, user: admin@wildlife.com / admin)

3. **Access the application:**
   - Frontend: [http://localhost:3000](http://localhost:3000)
   - Backend API docs: [http://localhost:8000/docs](http://localhost:8000/docs)
   - PgAdmin: [http://localhost:8080](http://localhost:8080)
   - Locust: [http://localhost:8089](http://localhost:8089)

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

See [backend/main.py](backend/main.py) for full details.

---

## Development

- **Frontend**: See [frontend/README.md](frontend/README.md) for dev scripts.
  - Start dev server: `npm run dev` (inside `frontend/`)
- **Backend**: See [backend/README.md](backend/README.md) for API and DB notes.
  - Start dev server: `uvicorn main:app --reload` (inside `backend/`)
- **Testing**: Use Locust at [http://localhost:8089](http://localhost:8089)


---

## Scalability & Architecture Notes

- Uses TimescaleDB for efficient time-series queries (e.g., time_bucket)
- Uses PostGIS for fast geospatial queries (e.g., ST_DWithin)
- Indexing and partitioning strategies are described in [backend/README.md](backend/README.md)
- Designed for future integration with Kafka, ElasticSearch, and CI/CD

---

## License

N/A

---

## Credits

- Built with FastAPI, React, Leaflet, TimescaleDB, and PostGIS.