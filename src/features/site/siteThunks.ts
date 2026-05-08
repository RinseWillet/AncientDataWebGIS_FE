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

interface ApiErrorWithMessage {
  response?: { data?: { message?: string } };
  message?: string;
}

const getErrorMessage = (error: unknown, fallback: string): string => {
  const e = error as ApiErrorWithMessage;
  return e?.response?.data?.message || e?.message || fallback;
};

export const fetchSites = () => async (dispatch: AppDispatch) => {
  dispatch(fetchSitesStart());
  try {
    const response = await SiteService.findAllGeoJson();
    dispatch(fetchSitesSuccess(response.data));
  } catch (error) {
    dispatch(fetchSitesFailure(getErrorMessage(error, 'Failed to load sites.')));
  }
};

export const fetchSiteById = (id: string | number) => async (dispatch: AppDispatch) => {
  dispatch(fetchSiteByIdStart());
  try {
    const response = await SiteService.findByIdGeoJson(id);
    dispatch(fetchSiteByIdSuccess(response.data));
  } catch (error) {
    dispatch(fetchSiteByIdFailure(getErrorMessage(error, 'Failed to load site.')));
  }
};

