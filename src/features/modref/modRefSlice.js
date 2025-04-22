import { createSlice } from '@reduxjs/toolkit';
import {
  fetchModernReferencesBySiteId,
  linkModernReferenceToSite,
  unlinkModernReferenceFromSite,
  linkModernReferenceToRoad,
  unlinkModernReferenceFromRoad,
} from './modRefThunks';

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

  extraReducers: (builder) => {
    builder
      .addCase(fetchModernReferencesBySiteId.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchModernReferencesBySiteId.fulfilled, (state, action) => {
        const { siteId, data } = action.payload;
        state.loading = false;
        state.referencesBySiteId[siteId] = data;
      })
      .addCase(fetchModernReferencesBySiteId.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })

      .addCase(linkModernReferenceToSite.fulfilled, (state, action) => {
        const { siteId, data } = action.payload;
        state.referencesBySiteId[siteId] = data;
      })

      .addCase(unlinkModernReferenceFromSite.fulfilled, (state, action) => {
        const { siteId, data } = action.payload;
        state.referencesBySiteId[siteId] = data;
      })

      .addCase(linkModernReferenceToRoad.fulfilled, (state, action) => {
        const { roadId, data } = action.payload;
        state.referencesByRoadId[roadId] = data;
      })

      .addCase(unlinkModernReferenceFromRoad.fulfilled, (state, action) => {
        const { roadId, data } = action.payload;
        state.referencesByRoadId[roadId] = data;
      })
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