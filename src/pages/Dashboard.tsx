import { useEffect, useState } from 'react';
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
  LineChart,
  Line,
} from 'recharts';
import type { TypeCount, TypeLength } from '../types/dashboard';
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

type DateFilter = 'all' | 'last7' | 'last30';

const TYPE_ALL = 'all';

const formatInteger = (value: number) => new Intl.NumberFormat().format(value);

const formatKm = (value: number) => `${new Intl.NumberFormat().format(Number(value.toFixed(2)))} km`;

const titleCase = (value: string) =>
  value
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');

const withinDateFilter = (generatedAt: string, dateFilter: DateFilter) => {
  if (dateFilter === 'all') {
    return true;
  }

  const now = Date.now();
  const generated = new Date(generatedAt).getTime();
  const days = dateFilter === 'last7' ? 7 : 30;
  return now - generated <= days * 24 * 60 * 60 * 1000;
};

const escapeCsv = (value: string | number) => {
  const text = String(value);
  if (text.includes(',') || text.includes('"') || text.includes('\n')) {
    return `"${text.replaceAll('"', '""')}"`;
  }
  return text;
};

const Dashboard = () => {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [siteTypeFilter, setSiteTypeFilter] = useState(TYPE_ALL);
  const [roadTypeFilter, setRoadTypeFilter] = useState(TYPE_ALL);
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        setError(null);
        const summary = await dashboardService.getSummary();
        setData(summary);
      } catch (err) {
        console.error('Failed to fetch dashboard summary:', err);
        setError(
          err instanceof Error
            ? err.message
            : 'Failed to load dashboard data. Please try again.'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, []);

  if (loading) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-loading">
          <p>Loading dashboard...</p>
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-error">
          <h2>⚠️ Error Loading Dashboard</h2>
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="dashboard-container">
        <div className="dashboard-empty">
          <h2>No Data Available</h2>
          <p>There is currently no data to display on the dashboard.</p>
        </div>
      </div>
    );
  }

  const { sites, roads } = data;

  const availableSiteTypes = sites.byType.map((item) => item.type);
  const availableRoadTypes = roads.byType.map((item) => item.type);

  const filteredSiteByType =
    siteTypeFilter === TYPE_ALL
      ? sites.byType
      : sites.byType.filter((item) => item.type === siteTypeFilter);
  const filteredRoadByType =
    roadTypeFilter === TYPE_ALL
      ? roads.byType
      : roads.byType.filter((item) => item.type === roadTypeFilter);
  const filteredRoadLengthByType =
    roadTypeFilter === TYPE_ALL
      ? roads.lengthKmByType
      : roads.lengthKmByType.filter((item) => item.type === roadTypeFilter);

  const dashboardVisibleForDate = withinDateFilter(data.generatedAt, dateFilter);

  const totalSites = filteredSiteByType.reduce((sum, item) => sum + item.count, 0);
  const totalRoads = filteredRoadByType.reduce((sum, item) => sum + item.count, 0);
  const totalRoadLengthKm = filteredRoadLengthByType.reduce((sum, item) => sum + item.lengthKm, 0);

  // Prepare data for charts
  const siteCountData = filteredSiteByType.map((item) => ({
    name: item.type,
    value: item.count,
  }));

  const roadCountData = filteredRoadByType.map((item) => ({
    name: item.type,
    value: item.count,
  }));

  const roadLengthData = filteredRoadLengthByType.map((item) => ({
    name: item.type,
    lengthKm: parseFloat(item.lengthKm.toFixed(2)),
  }));

  const exportCsv = () => {
    const header = ['section', 'label', 'value'];
    const rows: Array<[string, string, string | number]> = [
      ['filters', 'siteType', siteTypeFilter],
      ['filters', 'roadType', roadTypeFilter],
      ['filters', 'dateWindow', dateFilter],
      ['summary', 'generatedAt', data.generatedAt],
      ['summary', 'totalSites', totalSites],
      ['summary', 'totalRoads', totalRoads],
      ['summary', 'roadNetworkLengthKm', Number(totalRoadLengthKm.toFixed(2))],
    ];

    const appendRows = (section: string, list: TypeCount[]) => {
      list.forEach((item) => rows.push([section, item.type, item.count]));
    };

    const appendLengthRows = (section: string, list: TypeLength[]) => {
      list.forEach((item) => rows.push([section, item.type, Number(item.lengthKm.toFixed(2))]));
    };

    appendRows('sitesByType', filteredSiteByType);
    appendRows('roadsByType', filteredRoadByType);
    appendLengthRows('roadLengthKmByType', filteredRoadLengthByType);

    const csv = [header, ...rows]
      .map((row) => row.map((value) => escapeCsv(value)).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = objectUrl;
    anchor.download = `dashboard-summary-${new Date(data.generatedAt).toISOString()}.csv`;
    anchor.click();
    URL.revokeObjectURL(objectUrl);
  };

  return (
    <div className="dashboard-container">
      <h1>Research Dashboard</h1>

      <div className="dashboard-controls" aria-label="dashboard filters">
        <div className="filter-group">
          <label htmlFor="siteTypeFilter">Site Type</label>
          <select
            id="siteTypeFilter"
            value={siteTypeFilter}
            onChange={(event) => setSiteTypeFilter(event.target.value)}
          >
            <option value={TYPE_ALL}>All</option>
            {availableSiteTypes.map((type) => (
              <option key={type} value={type}>
                {titleCase(type)}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="roadTypeFilter">Road Type</label>
          <select
            id="roadTypeFilter"
            value={roadTypeFilter}
            onChange={(event) => setRoadTypeFilter(event.target.value)}
          >
            <option value={TYPE_ALL}>All</option>
            {availableRoadTypes.map((type) => (
              <option key={type} value={type}>
                {titleCase(type)}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label htmlFor="dateFilter">Date Window</label>
          <select
            id="dateFilter"
            value={dateFilter}
            onChange={(event) => setDateFilter(event.target.value as DateFilter)}
          >
            <option value="all">All Snapshots</option>
            <option value="last7">Last 7 days</option>
            <option value="last30">Last 30 days</option>
          </select>
        </div>

        <button className="export-btn" onClick={exportCsv}>
          Export CSV
        </button>
      </div>

      {!dashboardVisibleForDate && (
        <div className="dashboard-empty">
          <h2>No Data Available for Selected Date Window</h2>
          <p>Adjust the date filter to include the current dashboard snapshot.</p>
        </div>
      )}

      {dashboardVisibleForDate && (
        <>

      {/* KPI Summary Cards */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <h3>Total Sites</h3>
          <p className="kpi-value">{formatInteger(totalSites)}</p>
        </div>
        <div className="kpi-card">
          <h3>Total Roads</h3>
          <p className="kpi-value">{formatInteger(totalRoads)}</p>
        </div>
        <div className="kpi-card">
          <h3>Road Network Length</h3>
          <p className="kpi-value">{formatKm(totalRoadLengthKm)}</p>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="charts-grid">
        {/* Sites by Type - Pie Chart */}
        <div className="chart-card">
          <h2>Sites by Type</h2>
          {siteCountData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={siteCountData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${titleCase(String(name))}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {siteCountData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => `${formatInteger(value as number)}`}
                  labelFormatter={(label) => titleCase(String(label))}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="no-data-message">No site data available</p>
          )}
        </div>

        {/* Roads by Type - Bar Chart */}
        <div className="chart-card">
          <h2>Roads by Type</h2>
          {roadCountData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={roadCountData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="name"
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis />
                <Tooltip
                  formatter={(value) => `${formatInteger(value as number)}`}
                  labelFormatter={(label) => titleCase(String(label))}
                />
                <Legend />
                <Bar dataKey="value" fill="#82ca9d" name="Count" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="no-data-message">No road data available</p>
          )}
        </div>

        {/* Road Length by Type - Bar Chart */}
        <div className="chart-card full-width">
          <h2>Road Length by Type (km)</h2>
          {roadLengthData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={roadLengthData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="name"
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis label={{ value: 'Length (km)', angle: -90, position: 'insideLeft' }} />
                <Tooltip
                  formatter={(value) => formatKm(value as number)}
                  labelFormatter={(label) => `Type: ${titleCase(String(label))}`}
                />
                <Legend />
                <Bar dataKey="lengthKm" fill="#ffc658" name="Length (km)" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="no-data-message">No road length data available</p>
          )}
        </div>

        {/* Cumulative Road Length - Line Chart */}
        {roadLengthData.length > 0 && (
          <div className="chart-card full-width">
            <h2>Cumulative Road Length Trend</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={roadLengthData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                <YAxis label={{ value: 'Length (km)', angle: -90, position: 'insideLeft' }} />
                <Tooltip
                  formatter={(value) => formatKm(value as number)}
                  labelFormatter={(label) => `Type: ${titleCase(String(label))}`}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="lengthKm"
                  stroke="#8884d8"
                  name="Length (km)"
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

        </>
      )}

      {/* Footer with timestamp */}
      <div className="dashboard-footer">
        <p>
          Last updated: {new Date(data.generatedAt).toLocaleString()}
        </p>
      </div>
    </div>
  );
};

export default Dashboard;

