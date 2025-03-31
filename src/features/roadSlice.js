import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  roadData: [],
  loading: false,
  error: null,
};

const roadSlice = createSlice({
  name: 'roads',
  initialState,
  reducers: {
    fetchRoadsStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchRoadsSuccess: (state, action) => {
      state.loading = false;
      state.roadData = action.payload;
    },
    fetchRoadsFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
  },
});

export const {
  fetchRoadsStart,
  fetchRoadsSuccess,
  fetchRoadsFailure,
} = roadSlice.actions;
export default roadSlice.reducer;