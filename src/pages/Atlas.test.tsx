import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { describe, it, expect, vi, afterEach } from 'vitest';
import Atlas from './Atlas';

vi.mock('../components/MapComponent/MapComponent', () => ({
  default: (props: { queryItem: unknown; adjustMapHeight: boolean }) => (
    <div
      data-testid="mock-map"
      data-adjust-map-height={String(props.adjustMapHeight)}
      data-query-item={JSON.stringify(props.queryItem)}
    />
  ),
}));

const renderAtlas = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/atlas" element={<Atlas />} />
        <Route path="/atlas/:id" element={<Atlas />} />
      </Routes>
    </MemoryRouter>
  );

describe('Atlas', () => {
  afterEach(() => {
    cleanup();
  });

  it('renders a full-height map with no query when visited without an id', () => {
    renderAtlas('/atlas');
    const map = screen.getByTestId('mock-map');
    expect(map).toHaveAttribute('data-adjust-map-height', 'false');
    expect(screen.queryByText('BACK')).not.toBeInTheDocument();
  });

  it('renders a full-height map with the road selected when visited via road_<id>', () => {
    renderAtlas('/atlas/road_5');
    const map = screen.getByTestId('mock-map');
    expect(map).toHaveAttribute('data-adjust-map-height', 'false');
    expect(map).toHaveAttribute('data-query-item', JSON.stringify({ type: 'road', id: '5' }));
    expect(screen.getByText('BACK')).toBeInTheDocument();
  });

  it('renders a full-height map with the site selected when visited via site_<id>', () => {
    renderAtlas('/atlas/site_42');
    const map = screen.getByTestId('mock-map');
    expect(map).toHaveAttribute('data-adjust-map-height', 'false');
    expect(map).toHaveAttribute('data-query-item', JSON.stringify({ type: 'site', id: '42' }));
    expect(screen.getByText('BACK')).toBeInTheDocument();
  });

  it('falls back to a full-height, unqueried map for unrecognized id formats', () => {
    renderAtlas('/atlas/nonsense');
    const map = screen.getByTestId('mock-map');
    expect(map).toHaveAttribute('data-adjust-map-height', 'false');
    expect(screen.queryByText('BACK')).not.toBeInTheDocument();
  });
});

