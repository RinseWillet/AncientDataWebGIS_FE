import {
  fetchModRefsStart,
  fetchModRefsSuccess,
  fetchModRefsFailure,
  setReferencesBySiteId,
} from './modRefSlice';
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import RoadService from '../../services/RoadService';
import SiteService from "../../services/SiteService";
import ModernReferenceService from '../../services/ModernReferenceService';

export const fetchModernReferencesByRoadId = (roadId) => async (dispatch) => {
  dispatch(fetchModRefsStart());
  try {
    const response = await RoadService.findModernReferenceByRoadId(roadId);
    dispatch(fetchModRefsSuccess({ roadId, references: response.data }));
  } catch (error) {
    dispatch(fetchModRefsFailure(
      error.response?.data?.message || error.message || 'Failed to load modern references.'
    ));
  }
};

export const linkModernReferenceToRoad = createAsyncThunk(
  "modRefs/linkToRoad",
  async ({ roadId, refId }, thunkAPI) => {
    const updatedRoad = await ModernReferenceService.linkModernReferenceToRoad(roadId, refId);
    return { roadId, data: updatedRoad.modernReferenceList };
  }
);

export const unlinkModernReferenceFromRoad = createAsyncThunk(
  "modRefs/unlinkFromRoad",
  async ({ roadId, refId }, thunkAPI) => {
    const updatedRoad = await ModernReferenceService.unlinkModernReferenceFromRoad(roadId, refId);
    return { roadId, data: updatedRoad.modernReferenceList };
  }
);

export const fetchModernReferencesBySiteId = createAsyncThunk(
  "modRefs/fetchBySiteId",
  async (siteId, thunkAPI) => {
    const response = await ModernReferenceService.getBySiteId(siteId);
    return { siteId, data: response };
  }
);

export const linkModernReferenceToSite = createAsyncThunk(
  "modRefs/linkToSite",
  async ({ siteId, refId }, thunkAPI) => {
    const updatedSite = await ModernReferenceService.linkModernReferenceToSite(siteId, refId);
    return { siteId, data: updatedSite.modernReferenceList };
  }
);

export const unlinkModernReferenceFromSite = createAsyncThunk(
  "modRefs/unlinkFromSite",
  async ({ siteId, refId }, thunkAPI) => {
    const updatedSite = await ModernReferenceService.unlinkModernReferenceFromSite(siteId, refId);
    return { siteId, data: updatedSite.modernReferenceList };
  }
);  