import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { fetchRoadById } from './roadThunks';
import type { GeoJsonFeatureCollection } from '../../types/geoJson';

interface RoadState {
  roadData: GeoJsonFeatureCollection | null;
  selectedRoad: GeoJsonFeatureCollection | null;
  loading: boolean;
  error: string | null;
  loaded: boolean;
}

const initialState: RoadState = {
  roadData: null,
  selectedRoad: null,
  loading: false,
  error: null,
  loaded: false,
};

const roadSlice = createSlice({
  name: 'roads',
  initialState,
  reducers: {
    fetchRoadsStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchRoadsSuccess: (state, action: PayloadAction<GeoJsonFeatureCollection>) => {
      state.loading = false;
      state.roadData = action.payload;
      state.loaded = true;
    },
    fetchRoadsFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    resetRoads: (state) => {
      state.roadData = null;
      state.selectedRoad = null;
      state.loading = false;
      state.error = null;
      state.loaded = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchRoadById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRoadById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedRoad = action.payload;
      })
      .addCase(fetchRoadById.rejected, (state, action) => {
        state.loading = false;
        state.error = typeof action.payload === 'string' ? action.payload : null;
      });
  },
});

export const {
  fetchRoadsStart,
  fetchRoadsSuccess,
  fetchRoadsFailure,
  resetRoads,
} = roadSlice.actions;

export default roadSlice.reducer;

