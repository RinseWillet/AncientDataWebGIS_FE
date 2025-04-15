import {
    fetchModRefsStart,
    fetchModRefsSuccess,
    fetchModRefsFailure,
    setReferencesBySiteId,
  } from './modRefSlice';
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

  export const fetchModernReferencesBySiteId = (siteId) => async (dispatch) => {
    try {
      const response = await SiteService.findModernReferenceBySiteId(siteId); // ✅ correct call
      dispatch(setReferencesBySiteId({ siteId, references: response.data }));
    } catch (error) {
      console.error("Failed to fetch references for site:", error);
    }
  };