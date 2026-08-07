import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import MapComponent from '../components/MapComponent/MapComponent';
import { dashboardService } from '../services/DashboardService';
import { DashboardSummary } from '../types/dashboard';
import './Home.css';

const formatNumber = (value: number): string => new Intl.NumberFormat().format(value);

const formatKm = (value: number): string =>
  `${new Intl.NumberFormat(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)} km`;

const Home = () => {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = useCallback(async () => dashboardService.getSummary(), []);

  useEffect(() => {
    let isMounted = true;

    const loadStats = async () => {
      try {
        const summary = await fetchSummary();
        if (isMounted) {
          setData(summary);
          setError(null);
        }
      } catch (err) {
        console.error('Failed to fetch homepage stats:', err);
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Failed to load stats.');
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    void loadStats();

    return () => {
      isMounted = false;
    };
  }, [fetchSummary]);

  return (
    <div className="pagebox home-pagebox">
      <main className="home-container">
        <section className="home-hero">
          <h1>AncientData</h1>
          <p>
            A research workbench and interactive atlas for the study of Roman and prehistoric roads
            and settlements in Gelderland (Netherlands) and the west of Nordrhein-Westfalen
            (Germany). Explore a searchable dataset of sites and roads, an interactive map, and a
            growing collection of written research chapters.
          </p>
        </section>

        <section className="home-stats" aria-label="Dataset statistics">
          {loading && (
            <div className="home-stats-grid" aria-hidden="true">
              <div className="home-stat-card skeleton-block"></div>
              <div className="home-stat-card skeleton-block"></div>
              <div className="home-stat-card skeleton-block"></div>
            </div>
          )}

          {!loading && error && (
            <p className="home-stats-error">Dataset statistics are temporarily unavailable.</p>
          )}

          {!loading && !error && data && (
            <div className="home-stats-grid">
              <Link to="/dashboard" className="home-stat-card home-stat-card--sites">
                <h3>Sites</h3>
                <p className="home-stat-value">{formatNumber(data.sites.total)}</p>
              </Link>
              <Link to="/dashboard" className="home-stat-card home-stat-card--roads">
                <h3>Roads</h3>
                <p className="home-stat-value">{formatNumber(data.roads.total)}</p>
              </Link>
              <Link to="/dashboard" className="home-stat-card home-stat-card--length">
                <h3>Road Network</h3>
                <p className="home-stat-value">{formatKm(data.roads.lengthKmTotal)}</p>
              </Link>
            </div>
          )}

          <p className="home-stats-link">
            <Link to="/dashboard">View the full dashboard &rarr;</Link>
          </p>
        </section>

        <section className="home-map-preview" aria-label="Map preview">
          <div className="home-map-preview-frame">
            <MapComponent adjustMapHeight />
            <Link to="/atlas" className="home-map-preview-cta">
              Open full Atlas &rarr;
            </Link>
          </div>
        </section>

        <section className="home-links">
          <Link to="/datalist" className="home-link-card">
            <h3>Browse the Data</h3>
            <p>Search and filter every recorded site and road.</p>
          </Link>
          <Link to="/book/01-introduction" className="home-link-card">
            <h3>Read the Research</h3>
            <p>The written narrative behind the dataset and its methodology.</p>
          </Link>
          <Link to="/news" className="home-link-card">
            <h3>Latest News</h3>
            <p>Updates on the project&apos;s development and deployment.</p>
          </Link>
        </section>
      </main>
    </div>
  );
};

export default Home;
