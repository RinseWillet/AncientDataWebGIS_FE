import { cleanup, render, screen, waitFor, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useNavigate } from 'react-router-dom';
import MapInfoCard from './MapInfoCard';
import siteReducer from '../../features/site/siteSlice';
import roadReducer from '../../features/road/roadSlice';
import SiteService from '../../services/SiteService';
import RoadService from '../../services/RoadService';
import type { GeoJsonFeatureCollection } from '../../types/geoJson';

vi.mock('../../services/SiteService', () => ({
  default: {
    findByIdGeoJson: vi.fn(),
  },
}));

vi.mock('../../services/RoadService', () => ({
  default: {
    findByIdGeoJson: vi.fn(),
  },
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: vi.fn(),
  };
});

const siteFeatureCollection: GeoJsonFeatureCollection = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [5, 51] },
      properties: {
        id: 42,
        name: 'Test Fort',
        siteType: 'castellum',
        description: 'A Roman fort.',
      },
    },
  ],
} as unknown as GeoJsonFeatureCollection;

const roadFeatureCollection: GeoJsonFeatureCollection = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      geometry: { type: 'LineString', coordinates: [[5, 51], [5.1, 51.1]] },
      properties: {
        id: 7,
        name: 'Test Road',
        type: 'road',
        description: 'A Roman road.',
      },
    },
  ],
} as unknown as GeoJsonFeatureCollection;

const renderWithProviders = (searchItem: { type: string; id: string | number }) => {
  const store = configureStore({
    reducer: { sites: siteReducer, roads: roadReducer },
  });

  return render(
    <Provider store={store}>
      <MemoryRouter>
        <MapInfoCard searchItem={searchItem} clearSelection={vi.fn()} />
      </MemoryRouter>
    </Provider>
  );
};

describe('MapInfoCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useNavigate).mockReturnValue(mockNavigate);
  });

  afterEach(() => {
    cleanup();
  });

  it('shows a "View full details" button for a site and navigates to the site info page', async () => {
    vi.mocked(SiteService.findByIdGeoJson).mockResolvedValue({ data: siteFeatureCollection } as never);

    renderWithProviders({ type: 'site', id: 42 });

    await waitFor(() => {
      expect(screen.getByText('Test Fort')).toBeInTheDocument();
    });

    const button = screen.getByText('View full details');
    expect(button).toBeInTheDocument();

    fireEvent.click(button);
    expect(mockNavigate).toHaveBeenCalledWith('/datalist/siteinfo/42');
  });

  it('shows a "View full details" button for a road and navigates to the road info page', async () => {
    vi.mocked(RoadService.findByIdGeoJson).mockResolvedValue({ data: roadFeatureCollection } as never);

    renderWithProviders({ type: 'road', id: 7 });

    await waitFor(() => {
      expect(screen.getByText('Test Road')).toBeInTheDocument();
    });

    const button = screen.getByText('View full details');
    expect(button).toBeInTheDocument();

    fireEvent.click(button);
    expect(mockNavigate).toHaveBeenCalledWith('/datalist/roadinfo/7');
  });

  it('does not show the details button while data is loading', () => {
    vi.mocked(SiteService.findByIdGeoJson).mockReturnValue(new Promise(() => {}));

    renderWithProviders({ type: 'site', id: 42 });

    expect(screen.getByText('Loading Data...')).toBeInTheDocument();
    expect(screen.queryByText('View full details')).not.toBeInTheDocument();
  });
});



