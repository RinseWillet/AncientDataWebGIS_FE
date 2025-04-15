import {
    fetchSitesStart,
    fetchSitesSuccess,
    fetchSitesFailure,
    fetchSiteByIdStart,
    fetchSiteByIdSuccess,
    fetchSiteByIdFailure,
  } from './siteSlice';
  import SiteService from '../../services/SiteService';
  
  export const fetchSites = () => async (dispatch) => {
    dispatch(fetchSitesStart());
    try {
      const response = await SiteService.findAllGeoJson();
      dispatch(fetchSitesSuccess(response.data));
    } catch (error) {
      dispatch(fetchSitesFailure(
        error.response?.data?.message || error.message || 'Failed to load sites.'
      ));
    }
  };
  
  export const fetchSiteById = (id) => async (dispatch) => {
    dispatch(fetchSiteByIdStart());
    try {
      const response = await SiteService.findByIdGeoJson(id);
      dispatch(fetchSiteByIdSuccess(response.data));
    } catch (error) {
      dispatch(fetchSiteByIdFailure(
        error.response?.data?.message || error.message || 'Failed to load site.'
      ));
    }
  };