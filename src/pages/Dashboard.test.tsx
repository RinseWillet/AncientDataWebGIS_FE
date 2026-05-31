import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ReactNode } from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Dashboard from '../pages/Dashboard';
import * as dashboardService from '../services/DashboardService';
import { DashboardSummary } from '../types/dashboard';

vi.mock('recharts', () => ({
  ResponsiveContainer: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  PieChart: ({ children }: { children: ReactNode }) => <div>{children}</div>,
  Pie: ({ data }: { data: Array<{ name: string; value: number }> }) => (
    <div data-testid="pie-data">{JSON.stringify(data)}</div>
  ),
  Cell: () => null,
  BarChart: ({
    layout,
    data,
    children,
  }: {
    layout?: string;
    data: Array<Record<string, unknown>>;
    children: ReactNode;
  }) => (
    <div data-testid="bar-chart" data-layout={layout} data-chart-data={JSON.stringify(data)}>
      {children}
    </div>
  ),
  Bar: () => null,
  XAxis: ({ type }: { type?: string }) => <div data-testid="x-axis" data-type={type}></div>,
  YAxis: ({ type }: { type?: string }) => <div data-testid="y-axis" data-type={type}></div>,
  CartesianGrid: () => null,
  Tooltip: () => null,
  Legend: () => null,
}));

vi.mock('../services/DashboardService', () => ({
  dashboardService: {
    getSummary: vi.fn(),
  },
}));

describe('Dashboard Component', () => {
  const mockData: DashboardSummary = {
    schemaVersion: 1,
    generatedAt: '2026-05-16T10:00:00Z',
    sites: {
      total: 10,
      byType: [
        { type: 'city', count: 5 },
        { type: 'fort', count: 5 },
      ],
    },
    roads: {
      total: 5,
      byType: [
        { type: 'roman road', count: 3 },
        { type: 'ancient path', count: 2 },
      ],
      lengthKmTotal: 1234.56,
      lengthKmByType: [
        { type: 'roman road', lengthKm: 800.0 },
        { type: 'ancient path', lengthKm: 434.56 },
      ],
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(URL, 'createObjectURL', {
      writable: true,
      value: vi.fn(() => 'blob:test-url'),
    });
    Object.defineProperty(URL, 'revokeObjectURL', {
      writable: true,
      value: vi.fn(),
    });
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('renders loading state with skeleton placeholders initially', () => {
    vi.mocked(dashboardService.dashboardService.getSummary).mockImplementation(
      () => new Promise(() => {})
    );

    const { container } = render(<Dashboard />);

    expect(screen.getByText(/loading dashboard/i)).toBeInTheDocument();
    expect(container.querySelectorAll('.skeleton-block').length).toBeGreaterThan(0);
  });

  it('renders intro text and domain section headings on success', async () => {
    vi.mocked(dashboardService.dashboardService.getSummary).mockResolvedValue(mockData);

    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('Research Dashboard')).toBeInTheDocument();
    });

    expect(
      screen.getByText(/AncientData summarizes archaeological sites and road-network coverage/i)
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Sites', level: 2 })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Roads', level: 2 })).toBeInTheDocument();
  });

  it('renders updated chart titles and removes the line chart', async () => {
    vi.mocked(dashboardService.dashboardService.getSummary).mockResolvedValue(mockData);

    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('Sites by Type')).toBeInTheDocument();
    });

    expect(screen.getByText('Roads by Type')).toBeInTheDocument();
    expect(screen.getByText('Road Length by Type (km)')).toBeInTheDocument();
    expect(screen.queryByText('Cumulative Road Length Trend')).not.toBeInTheDocument();
  });

  it('renders error state and a keyboard-accessible retry button', async () => {
    vi.mocked(dashboardService.dashboardService.getSummary).mockRejectedValue(
      new Error('Network error occurred')
    );

    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText(/error loading dashboard/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/network error occurred/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });

  it('retries by re-fetching dashboard data', async () => {
    vi.mocked(dashboardService.dashboardService.getSummary)
      .mockRejectedValueOnce(new Error('Temporary API Error'))
      .mockResolvedValueOnce(mockData);

    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: /retry/i }));

    await waitFor(() => {
      expect(screen.getByText('Research Dashboard')).toBeInTheDocument();
      expect(dashboardService.dashboardService.getSummary).toHaveBeenCalledTimes(2);
    });
  });

  it('renders improved empty state messaging', async () => {
    const emptyData: DashboardSummary = {
      schemaVersion: 1,
      generatedAt: '2026-05-16T10:00:00Z',
      sites: { total: 0, byType: [] },
      roads: { total: 0, byType: [], lengthKmTotal: 0, lengthKmByType: [] },
    };

    vi.mocked(dashboardService.dashboardService.getSummary).mockResolvedValue(emptyData);

    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('No Data Available Yet')).toBeInTheDocument();
    });

    expect(screen.getByText(/No data has been loaded into the database yet/i)).toBeInTheDocument();
  });

  it('formats KPI values with separators and units and applies aria labels', async () => {
    vi.mocked(dashboardService.dashboardService.getSummary).mockResolvedValue(mockData);

    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('1,234.56 km')).toBeInTheDocument();
    });

    expect(screen.getByLabelText('Total sites: 10')).toBeInTheDocument();
    expect(screen.getByLabelText('Total roads: 5')).toBeInTheDocument();
    expect(screen.getByLabelText('Road network length: 1,234.56 km')).toBeInTheDocument();
  });

  it('uses horizontal bar chart configuration for roads charts', async () => {
    vi.mocked(dashboardService.dashboardService.getSummary).mockResolvedValue(mockData);

    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getAllByTestId('bar-chart').length).toBe(2);
    });

    screen.getAllByTestId('bar-chart').forEach((chart) => {
      expect(chart).toHaveAttribute('data-layout', 'vertical');
    });

    expect(screen.getAllByTestId('x-axis')[0]).toHaveAttribute('data-type', 'number');
    expect(screen.getAllByTestId('y-axis')[0]).toHaveAttribute('data-type', 'category');
  });

  it('adds an Other bucket when sites contain more than five types', async () => {
    const moreSiteTypes: DashboardSummary = {
      ...mockData,
      sites: {
        total: 21,
        byType: [
          { type: 'city', count: 7 },
          { type: 'fort', count: 5 },
          { type: 'sanctuary', count: 3 },
          { type: 'villa', count: 2 },
          { type: 'cemetery', count: 2 },
          { type: 'watchtower', count: 1 },
          { type: 'shipwreck', count: 1 },
        ],
      },
    };

    vi.mocked(dashboardService.dashboardService.getSummary).mockResolvedValue(moreSiteTypes);

    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByTestId('pie-data')).toBeInTheDocument();
    });

    const pieData = JSON.parse(screen.getByTestId('pie-data').textContent ?? '[]') as Array<{
      name: string;
      value: number;
    }>;

    expect(pieData).toHaveLength(6);
    expect(pieData.some((entry) => entry.name === 'Other')).toBe(true);
  });
});
