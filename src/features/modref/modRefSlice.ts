import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface ModRefState {
  referencesByRoadId: Record<string | number, unknown>;
  referencesBySiteId: Record<string | number, unknown>;
  loading: boolean;
  error: string | null;
}

const initialState: ModRefState = {
  referencesByRoadId: {},
  referencesBySiteId: {},
  loading: false,
  error: null,
};

const modRefSlice = createSlice({
  name: 'modRef',
  initialState,
  reducers: {
    fetchModRefsStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchModRefsSuccess: (
      state,
      action: PayloadAction<{ roadId: string | number; references: unknown }>
    ) => {
      const { roadId, references } = action.payload;
      state.loading = false;
      state.referencesByRoadId[roadId] = references;
    },
    fetchModRefsFailure: (state, action: PayloadAction<string>) => {
      state.loading = false;
      state.error = action.payload;
    },
    resetModRefs: (state) => {
      state.referencesByRoadId = {};
      state.referencesBySiteId = {};
      state.loading = false;
      state.error = null;
    },
    setReferencesBySiteId: (
      state,
      action: PayloadAction<{ siteId: string | number; references: unknown }>
    ) => {
      const { siteId, references } = action.payload;
      state.referencesBySiteId[siteId] = references;
    },
  },
});

export const {
  fetchModRefsStart,
  fetchModRefsSuccess,
  fetchModRefsFailure,
  resetModRefs,
  setReferencesBySiteId,
} = modRefSlice.actions;

export default modRefSlice.reducer;

