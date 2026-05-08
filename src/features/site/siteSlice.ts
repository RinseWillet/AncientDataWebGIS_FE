import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

interface SiteState {
  siteData: unknown | null;
  selectedSite: unknown | null;
  loading: boolean;
  error: string | null;
  loaded?: boolean;
}

const initialState: SiteState = {
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
    fetchSitesSuccess: (state, action: PayloadAction<unknown>) => {
      state.loading = false;
      state.siteData = action.payload;
      state.loaded = true;
    },
    fetchSitesFailure: (state, action: PayloadAction<string>) => {
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
    fetchSiteByIdSuccess: (state, action: PayloadAction<unknown>) => {
      state.loading = false;
      state.selectedSite = action.payload;
    },
    fetchSiteByIdFailure: (state, action: PayloadAction<string>) => {
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

