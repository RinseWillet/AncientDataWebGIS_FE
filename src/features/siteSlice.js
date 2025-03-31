import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  siteData: [],
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
    },
    fetchSitesFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
  },
});

export const {
  fetchSitesStart,
  fetchSitesSuccess,
  fetchSitesFailure,
} = siteSlice.actions;
export default siteSlice.reducer;