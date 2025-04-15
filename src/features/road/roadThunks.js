import {
    fetchRoadsStart,
    fetchRoadsSuccess,
    fetchRoadsFailure,
} from './roadSlice';
import { createAsyncThunk } from '@reduxjs/toolkit';
import RoadService from '../../services/RoadService';

export const fetchRoads = () => async (dispatch) => {
    dispatch(fetchRoadsStart());
    try {
        const response = await RoadService.findAllGeoJson();
        dispatch(fetchRoadsSuccess(response.data));
    } catch (error) {
        dispatch(fetchRoadsFailure(
            error.response?.data?.message || error.message || 'Failed to load roads.'
        ));
    }
};

export const fetchRoadById = createAsyncThunk(
    'roads/fetchById',
    async (id, { rejectWithValue }) => {
        try {
            const response = await RoadService.findByIdGeoJson(id);
            return response.data;
        } catch (error) {
            return rejectWithValue(
                error.response?.data?.message || error.message || 'Failed to load road.'
            );
        }
    }
);