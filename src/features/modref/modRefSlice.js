import { createSlice } from '@reduxjs/toolkit';

const initialState = {
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
    fetchModRefsSuccess: (state, action) => {
      const { roadId, references } = action.payload;
      state.loading = false;
      state.referencesByRoadId[roadId] = references;
    },
    fetchModRefsFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    resetModRefs: (state) => {
      state.referencesByRoadId = {};
      state.referencesBySiteId = {};
      state.loading = false;
      state.error = null;
    },
    setReferencesBySiteId: (state, action) => {
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