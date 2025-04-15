import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  siteData: null,
  selectedSite: null,
  loading: false,
  error: null,
};

const siteSlice = createSlice({
  name: 'sites',
  initialState,
  reducers: {
    fetchSitesStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchSitesSuccess: (state, action) => {
      state.loading = false;
      state.siteData = action.payload;
      state.loaded = true;
    },
    fetchSitesFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    resetSites: (state) => {
      state.siteData = [];
      state.selectedSite = null;
      state.loading = false;
      state.error = null;
      state.loaded = false;
    },
    fetchSiteByIdStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchSiteByIdSuccess: (state, action) => {
      state.loading = false;
      state.selectedSite = action.payload;
    },
    fetchSiteByIdFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
  },
});

export const {
  fetchSitesStart,
  fetchSitesSuccess,
  fetchSitesFailure,
  resetSites,
  fetchSiteByIdStart,
  fetchSiteByIdSuccess,
  fetchSiteByIdFailure, 
} = siteSlice.actions;
export default siteSlice.reducer;