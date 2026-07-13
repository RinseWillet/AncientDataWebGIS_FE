import { cleanup, render, screen, waitFor, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { MemoryRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import SiteInfo from './SiteInfo';
import siteReducer from '../features/site/siteSlice';
import modRefReducer from '../features/modref/modRefSlice';
import authReducer from '../features/authentication/authSlice';
import SiteService from '../services/SiteService';
import type { GeoJsonFeatureCollection } from '../types/geoJson';

vi.mock('../services/SiteService', () => ({
  default: {
    findByIdGeoJson: vi.fn(),
    findModernReferenceBySiteId: vi.fn(),
    updateSite: vi.fn(),
  },
}));

vi.mock('../components/MapComponent/MapComponent', () => ({
  default: () => <div data-testid="mock-map" />,
}));

vi.mock('../components/MediaGallery/MediaGallery', () => ({
  default: () => <div data-testid="mock-media-gallery" />,
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
};

const renderWithProviders = (id = '42') => {
  const store = configureStore({
    reducer: { sites: siteReducer, modRef: modRefReducer, auth: authReducer },
    preloadedState: {
      sites: {
        siteData: null,
        selectedSite: siteFeatureCollection,
        loading: false,
        error: null,
        loaded: true,
      },
      modRef: {
        referencesByRoadId: {},
        referencesBySiteId: { [id]: [] },
        loading: false,
        error: null,
      },
      auth: { user: null, loading: false, error: null },
    },
  });

  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[`/datalist/siteinfo/${id}`]}>
        <Routes>
          <Route path="/datalist/siteinfo/:id" element={<SiteInfo />} />
        </Routes>
      </MemoryRouter>
    </Provider>
  );
};

describe('SiteInfo', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useNavigate).mockReturnValue(mockNavigate);
    vi.mocked(SiteService.findByIdGeoJson).mockResolvedValue({ data: siteFeatureCollection } as never);
    vi.mocked(SiteService.findModernReferenceBySiteId).mockResolvedValue({ data: [] } as never);
  });

  afterEach(() => {
    cleanup();
  });

  it('renders BACK and View on Map buttons', async () => {
    renderWithProviders();
    await waitFor(() => {
      expect(screen.getByText('Test Fort')).toBeInTheDocument();
    });
    expect(screen.getByText('BACK')).toBeInTheDocument();
    expect(screen.getByText('View on Map')).toBeInTheDocument();
  });

  it('navigates to DataList when BACK is clicked', async () => {
    renderWithProviders();
    await waitFor(() => {
      expect(screen.getByText('Test Fort')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('BACK'));
    expect(mockNavigate).toHaveBeenCalledWith('/datalist/');
  });

  it('navigates to Atlas with the site query when View on Map is clicked', async () => {
    renderWithProviders();
    await waitFor(() => {
      expect(screen.getByText('Test Fort')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('View on Map'));
    expect(mockNavigate).toHaveBeenCalledWith('/atlas/site_42');
  });
});

