# Wildlife Tracker Frontend

This is the React frontend for the Wildlife Tracker system. It provides an interactive map, selection panel, and time-series charting for visualizing wildlife herds, families, and events.

---

## Features

- **Interactive Map**: Visualize wildlife locations, tracks, and events using Leaflet.
- **Selection Panel**: Filter by herd, family, time bucket, and metrics.
- **Family Metrics Chart**: View time-series data (size, health) for selected families.
- **Location Query**: Draw circles on the map to find families/events nearby.
- **Responsive UI**: Sidebar, map, and chart adapt to different screen sizes.
- **API Integration**: Fetches data from the FastAPI backend.

---

--

## Getting Started

### Prerequisites

- Node.js (v18+ recommended)
- npm

### Development

1. **Install dependencies:**
   ```sh
   npm install

2. **Run with Docker**
    docker-compose up --build
