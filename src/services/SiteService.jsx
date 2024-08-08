import apiClient from "../api/config";

const SiteService = {        
    findAllGeoJson() {
        return apiClient.get('/sites/geojson');
    },
    findAllByIdGeoJson(data) {
        return apiClient.get('/sites/' + data.id);
    },    
};

export default SiteService;