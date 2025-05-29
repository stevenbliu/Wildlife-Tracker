import React, { useState } from 'react';
import HerdTrackerPage from './pages/HerdTrackerPage';
import FamilyTrackerPage from './pages/FamilyTrackerPage';
import FamilyMetricsPage from './pages/FamilyMetricsPage';
import LocationQueryPage from './pages/LocationQueryPage';

type Page = 'herd' | 'family' | 'metrics' | 'location';

export default function App() {
  const [page, setPage] = useState<Page>('herd');

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: 20 }}>
      <header style={{ marginBottom: 20 }}>
        <h1>Wildlife Tracking Dashboard</h1>
        <nav>
          <button onClick={() => setPage('herd')} disabled={page === 'herd'}>
            Herd Tracker
          </button>{' '}
          <button onClick={() => setPage('family')} disabled={page === 'family'}>
            Family Tracker
          </button>{' '}
          <button onClick={() => setPage('metrics')} disabled={page === 'metrics'}>
            Family Metrics
          </button>{' '}
          <button onClick={() => setPage('location')} disabled={page === 'location'}>
            Location Query
          </button>
        </nav>
      </header>

      <main>
        {page === 'herd' && <HerdTrackerPage />}
        {page === 'family' && <FamilyTrackerPage />}
        {page === 'metrics' && <FamilyMetricsPage />}
        {page === 'location' && <LocationQueryPage />}
      </main>
    </div>
  );
}
