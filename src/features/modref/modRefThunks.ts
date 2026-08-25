import RoadService from '../../services/RoadService';
import SiteService from '../../services/SiteService';
import {
  fetchModRefsStart,
  fetchModRefsSuccess,
  fetchModRefsFailure,
  setReferencesBySiteId,
} from './modRefSlice';
import type { AppDispatch } from '../../app/store';
import type { ModernReference } from '../../types/geoJson';
import { getErrorMessage } from '../../utils/apiErrors';

export const fetchModernReferencesByRoadId =
  (roadId: string | number) => async (dispatch: AppDispatch) => {
    dispatch(fetchModRefsStart());
    try {
      const response = await RoadService.findModernReferenceByRoadId(roadId);
      dispatch(fetchModRefsSuccess({ roadId, references: response.data as ModernReference[] }));
    } catch (error) {
      dispatch(fetchModRefsFailure(getErrorMessage(error, 'Failed to load modern references.')));
    }
  };

export const fetchModernReferencesBySiteId =
  (siteId: string | number) => async (dispatch: AppDispatch) => {
    try {
      const response = await SiteService.findModernReferenceBySiteId(siteId);
      dispatch(setReferencesBySiteId({ siteId, references: response.data as ModernReference[] }));
    } catch (error) {
      console.error('Failed to fetch references for site:', error);
    }
  };
