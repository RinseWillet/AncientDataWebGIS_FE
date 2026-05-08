import apiClient from '../api/config';

const SiteService = {
  async findAllGeoJson() {
    return await apiClient.get('/sites/all');
  },
  async findByIdGeoJson(id: string | number) {
    return await apiClient.get('/sites/' + id);
  },
  async findModernReferenceBySiteId(id: string | number) {
    return await apiClient.get('sites/modref/' + id);
  },
  async updateSite(id: string | number, siteDTO: unknown) {
    return await apiClient.put(`/sites/${id}`, siteDTO);
  },
};

export default SiteService;

