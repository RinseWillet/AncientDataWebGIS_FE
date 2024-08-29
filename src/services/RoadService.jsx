import apiClient from "../api/config";

const RoadService = {        
    async findAllGeoJson() {     
        return apiClient.get('/roads/geojson');
    },
    async findByIdGeoJson(id) {
        return await apiClient.get('/roads/' + id);
    },    
    async findAll(){
        return apiClient.get('/roads/all');
    }
};

export default RoadService;