import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/authSlice';
import siteReducer from '../features/siteSlice';
import roadReducer from '../features/roadSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    sites: siteReducer,
    roads: roadReducer
  },
});