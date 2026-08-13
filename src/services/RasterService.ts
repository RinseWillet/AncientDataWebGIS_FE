import apiClient from '../api/config';
import { RasterLayer } from '../types/raster';

export const rasterService = {
  async getCatalog(): Promise<RasterLayer[]> {
    const response = await apiClient.get<RasterLayer[]>('/raster/catalog');
    return response.data;
  },
};
