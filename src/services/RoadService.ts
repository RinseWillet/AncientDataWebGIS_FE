import apiClient from '../api/config';

const RoadService = {
  async findAllGeoJson() {
    return await apiClient.get('/roads/all');
  },
  async findByIdGeoJson(id: string | number) {
    return await apiClient.get('/roads/' + id);
  },
  async findModernReferenceByRoadId(id: string | number) {
    return await apiClient.get('roads/modref/' + id);
  },
  async updateRoad(id: string | number, roadDTO: unknown) {
    return await apiClient.put(`/roads/${id}`, roadDTO);
  },
};

export default RoadService;

