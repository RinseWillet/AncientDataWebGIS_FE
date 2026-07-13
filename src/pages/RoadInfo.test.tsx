import { cleanup, render, screen, waitFor, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { MemoryRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import RoadInfo from './RoadInfo';
import roadReducer from '../features/road/roadSlice';
import modRefReducer from '../features/modref/modRefSlice';
import authReducer from '../features/authentication/authSlice';
import RoadService from '../services/RoadService';
import type { GeoJsonFeatureCollection } from '../types/geoJson';

vi.mock('../services/RoadService', () => ({
  default: {
    findByIdGeoJson: vi.fn(),
    findModernReferenceByRoadId: vi.fn(),
    updateRoad: vi.fn(),
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

const roadFeatureCollection: GeoJsonFeatureCollection = {
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      geometry: { type: 'MultiLineString', coordinates: [[[5, 51], [5.2, 51.2]]] },
      properties: {
        id: 5,
        name: 'Test Road',
        type: 'road',
        typeDescription: 'paved',
        description: 'A Roman road.',
      },
    },
  ],
};

const renderWithProviders = (id = '5') => {
  const store = configureStore({
    reducer: { roads: roadReducer, modRef: modRefReducer, auth: authReducer },
    preloadedState: {
      roads: {
        roadData: null,
        selectedRoad: roadFeatureCollection,
        loading: false,
        error: null,
        loaded: true,
      },
      modRef: {
        referencesByRoadId: { [id]: [] },
        referencesBySiteId: {},
        loading: false,
        error: null,
      },
      auth: { user: null, loading: false, error: null },
    },
  });

  return render(
    <Provider store={store}>
      <MemoryRouter initialEntries={[`/datalist/roadinfo/${id}`]}>
        <Routes>
          <Route path="/datalist/roadinfo/:id" element={<RoadInfo />} />
        </Routes>
      </MemoryRouter>
    </Provider>
  );
};

describe('RoadInfo', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useNavigate).mockReturnValue(mockNavigate);
    vi.mocked(RoadService.findByIdGeoJson).mockResolvedValue({ data: roadFeatureCollection } as never);
    vi.mocked(RoadService.findModernReferenceByRoadId).mockResolvedValue({ data: [] } as never);
  });

  afterEach(() => {
    cleanup();
  });

  it('renders BACK and View on Map buttons', async () => {
    renderWithProviders();
    await waitFor(() => {
      expect(screen.getByText('Test Road')).toBeInTheDocument();
    });
    expect(screen.getByText('BACK')).toBeInTheDocument();
    expect(screen.getByText('View on Map')).toBeInTheDocument();
  });

  it('navigates to DataList when BACK is clicked', async () => {
    renderWithProviders();
    await waitFor(() => {
      expect(screen.getByText('Test Road')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('BACK'));
    expect(mockNavigate).toHaveBeenCalledWith('/datalist/');
  });

  it('navigates to Atlas with the road query when View on Map is clicked', async () => {
    renderWithProviders();
    await waitFor(() => {
      expect(screen.getByText('Test Road')).toBeInTheDocument();
    });
    fireEvent.click(screen.getByText('View on Map'));
    expect(mockNavigate).toHaveBeenCalledWith('/atlas/road_5');
  });
});

