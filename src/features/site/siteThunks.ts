import SiteService from '../../services/SiteService';
import {
  fetchSitesStart,
  fetchSitesSuccess,
  fetchSitesFailure,
  fetchSiteByIdStart,
  fetchSiteByIdSuccess,
  fetchSiteByIdFailure,
} from './siteSlice';
import type { AppDispatch } from '../../app/store';
import type { GeoJsonFeatureCollection } from '../../types/geoJson';
import { getErrorMessage } from '../../utils/apiErrors';

export const fetchSites = () => async (dispatch: AppDispatch) => {
  dispatch(fetchSitesStart());
  try {
    const response = await SiteService.findAllGeoJson();
    dispatch(fetchSitesSuccess(response.data as GeoJsonFeatureCollection));
  } catch (error) {
    dispatch(fetchSitesFailure(getErrorMessage(error, 'Failed to load sites.')));
  }
};

export const fetchSiteById = (id: string | number) => async (dispatch: AppDispatch) => {
  dispatch(fetchSiteByIdStart());
  try {
    const response = await SiteService.findByIdGeoJson(id);
    dispatch(fetchSiteByIdSuccess(response.data as GeoJsonFeatureCollection));
  } catch (error) {
    dispatch(fetchSiteByIdFailure(getErrorMessage(error, 'Failed to load site.')));
  }
};
