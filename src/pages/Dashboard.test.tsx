import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import Dashboard from '../pages/Dashboard';
import * as dashboardService from '../services/DashboardService';
import { DashboardSummary } from '../types/dashboard';

// Mock ResizeObserver for Recharts compatibility with jsdom
class MockResizeObserver {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}

const resizeObserverMock: typeof ResizeObserver =
  MockResizeObserver as unknown as typeof ResizeObserver;
global.ResizeObserver = resizeObserverMock;

// Mock the dashboard service
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
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('renders loading state initially', () => {
    vi.mocked(dashboardService.dashboardService.getSummary).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    render(<Dashboard />);

    expect(screen.getByText(/loading dashboard/i)).toBeInTheDocument();
  });

  it('renders dashboard title and KPI cards on success', async () => {
    vi.mocked(dashboardService.dashboardService.getSummary).mockResolvedValue(
      mockData
    );

    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('Research Dashboard')).toBeInTheDocument();
    });

    // Check KPI cards and values
    expect(screen.getByText('Total Sites')).toBeInTheDocument();
    expect(screen.getByText('Total Roads')).toBeInTheDocument();
    expect(screen.getByText('Road Network Length')).toBeInTheDocument();
  });

  it('renders chart titles on success', async () => {
    vi.mocked(dashboardService.dashboardService.getSummary).mockResolvedValue(
      mockData
    );

    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText('Sites by Type')).toBeInTheDocument();
    });

    expect(screen.getAllByText('Roads by Type').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Road Length by Type (km)').length).toBeGreaterThan(0);
  });

  it('renders error state on fetch failure', async () => {
    const errorMessage = 'Network error occurred';
    vi.mocked(dashboardService.dashboardService.getSummary).mockRejectedValue(
      new Error(errorMessage)
    );

    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText(/error loading dashboard/i)).toBeInTheDocument();
    });

    expect(screen.getByText(/network error occurred/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });

  it('renders empty state messaging', async () => {
    const emptyData: DashboardSummary = {
      schemaVersion: 1,
      generatedAt: '2026-05-16T10:00:00Z',
      sites: { total: 0, byType: [] },
      roads: { total: 0, byType: [], lengthKmTotal: 0, lengthKmByType: [] },
    };

    vi.mocked(dashboardService.dashboardService.getSummary).mockResolvedValue(
      emptyData
    );

    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getByText(/no site data available/i)).toBeInTheDocument();
    });
  });

  it('displays footer with last updated message', async () => {
    vi.mocked(dashboardService.dashboardService.getSummary).mockResolvedValue(
      mockData
    );

    render(<Dashboard />);

    await waitFor(() => {
      expect(screen.getAllByText(/last updated/i).length).toBeGreaterThan(0);
    });
  });

  it('fetches data on component mount', async () => {
    vi.mocked(dashboardService.dashboardService.getSummary).mockResolvedValue(
      mockData
    );

    render(<Dashboard />);

    await waitFor(() => {
      expect(
        dashboardService.dashboardService.getSummary
      ).toHaveBeenCalledTimes(1);
    });
  });

  it('displays retry button on error state', async () => {
    vi.mocked(dashboardService.dashboardService.getSummary).mockRejectedValue(
      new Error('API Error')
    );

    render(<Dashboard />);

    await waitFor(() => {
      const retryButton = screen.getByRole('button', { name: /retry/i });
      expect(retryButton).toBeInTheDocument();
    });
  });
});
