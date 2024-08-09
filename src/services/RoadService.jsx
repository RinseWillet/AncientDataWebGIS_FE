import apiClient from "../api/config";

const RoadService = {        
    async findAllGeoJson() {
        return apiClient.get('/roads/geojson');
    },
    async findAllByIdGeoJson(data) {
        return await apiClient.get('/roads/' + data.id);
    },    
};

export default RoadService;