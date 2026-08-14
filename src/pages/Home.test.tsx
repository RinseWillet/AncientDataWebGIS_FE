import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import { describe, it, expect, vi, afterEach } from 'vitest';
import Home from './Home';
import * as dashboardService from '../services/DashboardService';
import { DashboardSummary } from '../types/dashboard';

vi.mock('../components/MapComponent/MapComponent', () => ({
  default: (props: { adjustMapHeight?: boolean; selectable?: boolean; showLayerChrome?: boolean }) => (
    <div
      data-testid="mock-map"
      data-adjust-map-height={String(props.adjustMapHeight)}
      data-selectable={String(props.selectable)}
      data-show-layer-chrome={String(props.showLayerChrome)}
    />
  ),
}));

vi.mock('../services/DashboardService', () => ({
  dashboardService: {
    getSummary: vi.fn(),
  },
}));

const renderHome = () =>
  render(
    <MemoryRouter>
      <Home />
    </MemoryRouter>
  );

describe('Home', () => {
  const mockData: DashboardSummary = {
    schemaVersion: 1,
    generatedAt: '2026-05-16T10:00:00Z',
    sites: { total: 10, byType: [{ type: 'city', count: 10 }] },
    roads: {
      total: 5,
      byType: [{ type: 'roman road', count: 5 }],
      lengthKmTotal: 1234.56,
      lengthKmByType: [{ type: 'roman road', lengthKm: 1234.56 }],
    },
  };

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  it('renders hero copy and a map preview linking to the Atlas', () => {
    vi.mocked(dashboardService.dashboardService.getSummary).mockImplementation(
      () => new Promise(() => {})
    );

    renderHome();

    expect(screen.getByRole('heading', { name: 'AncientData', level: 1 })).toBeInTheDocument();
    const map = screen.getByTestId('mock-map');
    expect(map).toHaveAttribute('data-adjust-map-height', 'true');
    expect(map).toHaveAttribute('data-selectable', 'false');
    expect(map).toHaveAttribute('data-show-layer-chrome', 'false');
    expect(screen.getByRole('link', { name: /open full atlas/i })).toHaveAttribute(
      'href',
      '/atlas'
    );
  });

  it('renders dataset stats once loaded', async () => {
    vi.mocked(dashboardService.dashboardService.getSummary).mockResolvedValue(mockData);

    renderHome();

    await waitFor(() => {
      expect(screen.getByText('10')).toBeInTheDocument();
    });

    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('1,235 km')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /view the full dashboard/i })).toHaveAttribute(
      'href',
      '/dashboard'
    );
  });

  it('shows a fallback message when stats fail to load', async () => {
    vi.mocked(dashboardService.dashboardService.getSummary).mockRejectedValue(
      new Error('Network error')
    );

    renderHome();

    await waitFor(() => {
      expect(screen.getByText(/temporarily unavailable/i)).toBeInTheDocument();
    });
  });

  it('renders link cards to DataList, Research, and News', () => {
    vi.mocked(dashboardService.dashboardService.getSummary).mockImplementation(
      () => new Promise(() => {})
    );

    renderHome();

    expect(screen.getByRole('link', { name: /browse the data/i })).toHaveAttribute(
      'href',
      '/datalist'
    );
    expect(screen.getByRole('link', { name: /read the research/i })).toHaveAttribute(
      'href',
      '/book/01-introduction'
    );
    expect(screen.getByRole('link', { name: /latest news/i })).toHaveAttribute('href', '/news');
  });
});

