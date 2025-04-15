import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/authentication/authSlice';
import siteReducer from '../features/site/siteSlice';
import roadReducer from '../features/road/roadSlice';
import modRefReducer from '../features/modref/modRefSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    sites: siteReducer,
    roads: roadReducer,
    modRef: modRefReducer
  },
});