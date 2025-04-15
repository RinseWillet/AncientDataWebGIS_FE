// import { createSlice } from '@reduxjs/toolkit';

// const initialState = {
//   roadData: null, //all roads
//   selectedRoad: null, //single selected road (e.g. for RoadInfo)
//   loading: false,
//   error: null,
// };

// const roadSlice = createSlice({
//   name: 'roads',
//   initialState,
//   reducers: {
//     fetchRoadsStart: (state) => {
//       state.loading = true;
//       state.error = null;
//     },
//     fetchRoadsSuccess: (state, action) => {
//       state.loading = false;
//       state.roadData = action.payload;
//       state.loaded = true;
//     },
//     fetchRoadsFailure: (state, action) => {
//       state.loading = false;
//       state.error = action.payload;
//     },

//     fetchRoadByIdStart: (state) => {
//       state.loading = true;
//       state.error = null;
//     },
//     fetchRoadByIdSuccess: (state, action) => {
//       state.loading = false;
//       state.selectedRoad = action.payload;
//     },
//     fetchRoadByIdFailure: (state, action) => {
//       state.loading = false;
//       state.error = action.payload;
//     },
//   },
// });

// export const {
//   fetchRoadsStart,
//   fetchRoadsSuccess,
//   fetchRoadsFailure,
//   fetchRoadByIdStart,
//   fetchRoadByIdSuccess,
//   fetchRoadByIdFailure,
// } = roadSlice.actions;
// export default roadSlice.reducer;

import { createSlice } from '@reduxjs/toolkit';
import { fetchRoadById } from './roadThunks';

const initialState = {
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
        state.error = action.payload;
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