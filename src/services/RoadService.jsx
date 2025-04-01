import apiClient from "../api/config";

const RoadService = {        
    async findAllGeoJson() {     
        return apiClient.get('/roads/all');
    },
    async findByIdGeoJson(id) {
        return await apiClient.get('/roads/' + id);
    },
    async findModernReferenceByRoadId(id) {
        return await apiClient.get('roads/modref/' + id);
    },
    async updateRoad(id, roadDTO) {
        return await apiClient.put(`/roads/${id}`, roadDTO);
    }
};

export default RoadService;