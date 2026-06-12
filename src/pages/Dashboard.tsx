import { useCallback, useEffect, useState } from 'react';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { DashboardSummary } from '../types/dashboard';
import { dashboardService } from '../services/DashboardService';
import './Dashboard.css';

// Color palette for charts
const COLORS = [
  '#8884d8',
  '#82ca9d',
  '#ffc658',
  '#ff7c7c',
  '#8dd1e1',
  '#d084d0',
  '#82d982',
  '#ffb347',
];

// Label mapping for abbreviations to full names
const LABEL_MAPPING: Record<string, string> = {
  pvilla: 'Possible Villa',
  ptum: 'Possible Tumulus',
  cem: 'Cemetery',
  hist_rec: 'Historical Reconstruction',
  sett: 'Settlement',
};

const formatNumber = (value: number): string => new Intl.NumberFormat().format(value);

const formatKm = (value: number): string =>
  `${new Intl.NumberFormat(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)} km`;

const toTitleCase = (value: string): string =>
  value
    .toLowerCase()
    .split(' ')
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

const formatTypeLabel = (value: string): string => {
  const normalized = value.trim().toLowerCase();

  if (!normalized || normalized === 'unknown') {
    return 'Unknown Type';
  }

  // Check if it matches a known abbreviation
  if (LABEL_MAPPING[normalized]) {
    return LABEL_MAPPING[normalized];
  }

  // Fall back to title case for unmapped labels
  return toTitleCase(normalized);
};

const Dashboard = () => {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSummary = useCallback(async () => dashboardService.getSummary(), []);

  const handleRetry = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const summary = await fetchSummary();
      setData(summary);
    } catch (err) {
      console.error('Failed to fetch dashboard summary:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to load dashboard data. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }, [fetchSummary]);

  useEffect(() => {
    let isMounted = true;

    const loadInitialDashboard = async () => {
      try {
        const summary = await fetchSummary();
        if (isMounted) {
          setData(summary);
          setError(null);
        }
      } catch (err) {
        console.error('Failed to fetch dashboard summary:', err);
        if (isMounted) {
          setError(
            err instanceof Error ? err.message : 'Failed to load dashboard data. Please try again.'
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void loadInitialDashboard();

    return () => {
      isMounted = false;
    };
  }, [fetchSummary]);

  if (loading) {
    return (
      <div className="pagebox dashboard-pagebox">
        <main className="dashboard-container" aria-busy="true">
          <h1>Research Dashboard</h1>

          <div className="dashboard-header-panel" aria-hidden="true">
            <section className="dashboard-intro dashboard-intro-skeleton">
              <div className="skeleton-line"></div>
              <div className="skeleton-line short"></div>
            </section>

            <section className="dashboard-section dashboard-section--kpi">
              <div className="section-kpis">
                <div className="kpi-card skeleton-block"></div>
                <div className="kpi-card skeleton-block"></div>
                <div className="kpi-card skeleton-block"></div>
              </div>
            </section>
          </div>

          <div className="dashboard-sections" aria-hidden="true">
            <section className="dashboard-section dashboard-section--sites">
              <div className="chart-card skeleton-block chart-skeleton"></div>
            </section>

            <section className="dashboard-section dashboard-section--roads">
              <div className="chart-card skeleton-block chart-skeleton"></div>
              <div className="chart-card skeleton-block chart-skeleton"></div>
            </section>
          </div>

          <div className="dashboard-loading-text">Loading dashboard...</div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pagebox dashboard-pagebox">
        <main className="dashboard-container">
          <h1>Research Dashboard</h1>
          <div className="dashboard-error">
            <h2>⚠️ Error Loading Dashboard</h2>
            <p>{error}</p>
            <button onClick={() => void handleRetry()} aria-label="Retry loading dashboard data">
              Retry
            </button>
          </div>
        </main>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="pagebox dashboard-pagebox">
        <main className="dashboard-container">
          <div className="dashboard-empty">
            <h2>No Data Available</h2>
            <p>There is currently no data to display on the dashboard.</p>
          </div>
        </main>
      </div>
    );
  }

  const { sites, roads } = data;
  const lastUpdated = new Date(data.generatedAt).toLocaleString();

  const sortedSiteData = [...sites.byType]
    .map((item) => ({
      name: formatTypeLabel(item.type),
      value: item.count,
    }))
    .sort((a, b) => b.value - a.value);

  const topSiteTypes = sortedSiteData.slice(0, 5);
  const otherSiteTypes = sortedSiteData.slice(5);
  const otherSiteTotal = otherSiteTypes.reduce((sum, item) => sum + item.value, 0);

  const siteCountData = otherSiteTotal
    ? [...topSiteTypes, { name: 'Other', value: otherSiteTotal }]
    : topSiteTypes;

  const roadCountData = roads.byType.map((item) => ({
    name: formatTypeLabel(item.type),
    value: item.count,
  }));

  const roadLengthData = roads.lengthKmByType.map((item) => ({
    name: formatTypeLabel(item.type),
    lengthKm: item.lengthKm,
  }));

  if (
    sites.total === 0 &&
    roads.total === 0 &&
    siteCountData.length === 0 &&
    roadCountData.length === 0 &&
    roadLengthData.length === 0
  ) {
    return (
      <div className="pagebox dashboard-pagebox">
        <main className="dashboard-container">
          <h1>Data Dashboard</h1>

          <section className="dashboard-intro">
            <p>
              The dashboard summarizes the data in the in simple graphs in one place, so one can
              quickly see the state of the research-data in this project and do basic comparison in
              settlement and infrastructure patterns.
            </p>
            <p className="dashboard-intro-meta">Data last updated: {lastUpdated}</p>
          </section>

          <section className="dashboard-empty">
            <h2>No Data Available Yet</h2>
            <p>
              No data has been loaded into the database yet. Add sites and roads to see KPI totals
              and chart breakdowns.
            </p>
          </section>

          <div className="dashboard-footer">
            <p>Last updated: {lastUpdated}</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="pagebox dashboard-pagebox">
      <main className="dashboard-container">
        <h1>Research Dashboard</h1>

        <div className="dashboard-header-panel">
          <section className="dashboard-intro">
            <p>
              AncientData summarizes archaeological sites and road-network coverage in one place so
              you can quickly compare settlement and infrastructure patterns.
            </p>
            <p className="dashboard-intro-meta">Data last updated: {lastUpdated}</p>
          </section>

          <section
            className="dashboard-section dashboard-section--kpi"
            aria-label="Key Metrics"
          >

            <div className="section-kpis">
              <div className="kpi-card kpi-card--sites">
                <h3>Total Sites</h3>
                <p className="kpi-value" aria-label={`Total sites: ${formatNumber(sites.total)}`}>
                  {formatNumber(sites.total)}
                </p>
              </div>
              <div className="kpi-card kpi-card--roads">
                <h3>Total Roads</h3>
                <p className="kpi-value" aria-label={`Total roads: ${formatNumber(roads.total)}`}>
                  {formatNumber(roads.total)}
                </p>
              </div>
              <div className="kpi-card kpi-card--length">
                <h3>Road Network Length</h3>
                <p
                  className="kpi-value"
                  aria-label={`Road network length: ${formatKm(roads.lengthKmTotal)}`}
                >
                  {formatKm(roads.lengthKmTotal)}
                </p>
              </div>
            </div>
          </section>
        </div>

        <div className="dashboard-sections">
          <section
            className="dashboard-section dashboard-section--sites"
            aria-labelledby="sites-section-heading"
          >
            <h2 id="sites-section-heading">Sites</h2>

            <div className="chart-card">
              <h3>Sites by Type</h3>
              {siteCountData.length > 0 ? (
                <div className="chart-frame">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={siteCountData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${formatNumber(Number(value))}`}
                        outerRadius={84}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {siteCountData.map((entry, index) => (
                          <Cell
                            key={`cell-${entry.name}-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value, _name, entry) => {
                          const label = formatTypeLabel(String(entry?.payload?.name ?? ''));
                          return [`${formatNumber(Number(value))} sites`, label];
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: '0.85rem', paddingTop: '1rem' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <p className="no-data-message">No site data available</p>
              )}
            </div>

            {otherSiteTypes.length > 0 && (
              <div className="chart-card">
                <h3>Sites by Type – Other</h3>
                <div className="chart-frame">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={otherSiteTypes}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${formatNumber(Number(value))}`}
                        outerRadius={84}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {otherSiteTypes.map((entry, index) => (
                          <Cell
                            key={`cell-other-${entry.name}-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value, _name, entry) => {
                          const label = formatTypeLabel(String(entry?.payload?.name ?? ''));
                          return [`${formatNumber(Number(value))} sites`, label];
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: '0.85rem', paddingTop: '1rem' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}
          </section>

          <section
            className="dashboard-section dashboard-section--roads"
            aria-labelledby="roads-section-heading"
          >
            <h2 id="roads-section-heading">Roads</h2>

            <div className="roads-charts">
              <div className="chart-card">
                <h3>Roads by Type</h3>
                {roadCountData.length > 0 ? (
                  <div className="chart-frame">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={roadCountData}
                        layout="vertical"
                        margin={{ top: 5, right: 10, bottom: 5, left: 100 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" allowDecimals={false} tick={{ fontSize: 12 }} />
                        <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 12 }} />
                        <Tooltip
                          formatter={(value, _name, entry) => {
                            const label = formatTypeLabel(String(entry?.payload?.name ?? ''));
                            return [`${formatNumber(Number(value))} roads`, label];
                          }}
                        />
                        <Legend wrapperStyle={{ fontSize: '0.85rem', paddingTop: '0.5rem' }} />
                        <Bar dataKey="value" fill="#82ca9d" name="Road Count" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="no-data-message">No road data available</p>
                )}
              </div>

              <div className="chart-card">
                <h3>Road Length by Type (km)</h3>
                {roadLengthData.length > 0 ? (
                  <div className="chart-frame">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart
                        data={roadLengthData}
                        layout="vertical"
                        margin={{ top: 5, right: 10, bottom: 5, left: 100 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis type="number" tick={{ fontSize: 12 }} />
                        <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 12 }} />
                        <Tooltip
                          formatter={(value, _name, entry) => {
                            const label = formatTypeLabel(String(entry?.payload?.name ?? ''));
                            return [formatKm(Number(value)), label];
                          }}
                        />
                        <Legend wrapperStyle={{ fontSize: '0.85rem', paddingTop: '0.5rem' }} />
                        <Bar dataKey="lengthKm" fill="#ffc658" name="Length (km)" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <p className="no-data-message">No road length data available</p>
                )}
              </div>
            </div>

            <div className="roads-explanation">
              <h3>About the Road Network</h3>
              <p>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor
                incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud
                exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.
              </p>
              <p>
                Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu
                fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in
                culpa qui officia deserunt mollit anim id est laborum.
              </p>
            </div>
          </section>
        </div>

        <div className="dashboard-footer">
          <p>Last updated: {lastUpdated}</p>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
