import apiClient from "../api/config";

const RoadService = {        
    findAllGeoJson() {
        return apiClient.get('/roads/geojson');
    },
    findAllByIdGeoJson(data) {
        return apiClient.get('/roads/' + data.id);
    },    
};

export default RoadService;