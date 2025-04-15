import {
    fetchRoadsStart,
    fetchRoadsSuccess,
    fetchRoadsFailure,
    fetchRoadByIdStart,
    fetchRoadByIdSuccess,
    fetchRoadByIdFailure,
} from './roadSlice';
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

export const fetchRoadById = (id) => async (dispatch) => {
    dispatch(fetchRoadByIdStart());
    try {
        const response = await RoadService.findByIdGeoJson(id);
        dispatch(fetchRoadByIdSuccess(response.data));
    } catch (error) {
        dispatch(fetchRoadByIdFailure(
            error.response?.data?.message || error.message || 'Failed to load road.'
        ));
    }
};