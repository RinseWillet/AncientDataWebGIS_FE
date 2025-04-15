import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  roadData: null, //all roads
  selectedRoad: null, //single selected road (e.g. for RoadInfo)
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
      state.loaded = true;
    },
    fetchRoadsFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    resetRoads: (state) => {
      state.roadData = [];
      state.selectedRoad = null;
      state.loading = false;
      state.error = null;
      state.loaded = false;
    },

    fetchRoadByIdStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchRoadByIdSuccess: (state, action) => {
      state.loading = false;
      state.selectedRoad = action.payload;
    },
    fetchRoadByIdFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
  },
});

export const {
  fetchRoadsStart,
  fetchRoadsSuccess,
  fetchRoadsFailure,
  resetRoads,
  fetchRoadByIdStart,
  fetchRoadByIdSuccess,
  fetchRoadByIdFailure,
} = roadSlice.actions;
export default roadSlice.reducer;