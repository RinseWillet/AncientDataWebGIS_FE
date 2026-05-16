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

const Dashboard = () => {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  // Prepare data for charts
  const siteCountData = sites.byType.map((item) => ({
    name: item.type,
    value: item.count,
  }));

  const roadCountData = roads.byType.map((item) => ({
    name: item.type,
    value: item.count,
  }));

  const roadLengthData = roads.lengthKmByType.map((item) => ({
    name: item.type,
    lengthKm: parseFloat(item.lengthKm.toFixed(2)),
  }));

  return (
    <div className="dashboard-container">
      <h1>Research Dashboard</h1>

      {/* KPI Summary Cards */}
      <div className="kpi-grid">
        <div className="kpi-card">
          <h3>Total Sites</h3>
          <p className="kpi-value">{sites.total}</p>
        </div>
        <div className="kpi-card">
          <h3>Total Roads</h3>
          <p className="kpi-value">{roads.total}</p>
        </div>
        <div className="kpi-card">
          <h3>Road Network Length</h3>
          <p className="kpi-value">{roads.lengthKmTotal.toFixed(2)} km</p>
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
                  label={({ name, value }) => `${name}: ${value}`}
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
                <Tooltip formatter={(value) => `${value}`} />
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
                <Tooltip />
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
                  formatter={(value) => `${(value as number).toFixed(2)} km`}
                  labelFormatter={(label) => `Type: ${label}`}
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
                  formatter={(value) => `${(value as number).toFixed(2)} km`}
                  labelFormatter={(label) => `Type: ${label}`}
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

