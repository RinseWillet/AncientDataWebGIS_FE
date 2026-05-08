import apiClient from '../api/config';

const ModernReferenceService = {
  async findAll() {
    return await apiClient.get('/modernreferences/all');
  },

  async create(modernReferenceDto: unknown) {
    return await apiClient.post('/modernreferences', modernReferenceDto);
  },

  async update(id: string | number, modernReferenceDto: unknown) {
    return await apiClient.put(`/modernreferences/${id}`, modernReferenceDto);
  },

  async delete(id: string | number) {
    return await apiClient.delete(`/modernreferences/${id}`);
  },

  async findRoadsByRefId(id: string | number) {
    return await apiClient.get(`/modernreferences/road/${id}`);
  },

  async findSitesByRefId(id: string | number) {
    return await apiClient.get(`/modernreferences/site/${id}`);
  },
};

export default ModernReferenceService;

