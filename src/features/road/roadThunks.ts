import { createAsyncThunk } from '@reduxjs/toolkit';
import RoadService from '../../services/RoadService';
import { fetchRoadsStart, fetchRoadsSuccess, fetchRoadsFailure } from './roadSlice';
import type { AppDispatch } from '../../app/store';
import type { GeoJsonFeatureCollection } from '../../types/geoJson';
import { getErrorMessage } from '../../utils/apiErrors';

export const fetchRoads = () => async (dispatch: AppDispatch) => {
  dispatch(fetchRoadsStart());
  try {
    const response = await RoadService.findAllGeoJson();
    dispatch(fetchRoadsSuccess(response.data));
  } catch (error) {
    dispatch(fetchRoadsFailure(getErrorMessage(error, 'Failed to load roads.')));
  }
};

export const fetchRoadById = createAsyncThunk<
  GeoJsonFeatureCollection,
  string | number,
  { rejectValue: string }
>('roads/fetchById', async (id, { rejectWithValue }) => {
  try {
    const response = await RoadService.findByIdGeoJson(id);
    return response.data as GeoJsonFeatureCollection;
  } catch (error) {
    return rejectWithValue(getErrorMessage(error, 'Failed to load road.'));
  }
});
