import apiClient from "../api/config";

const SiteService = {        
    async findAllGeoJson() {
        return await apiClient.get('/sites/geojson');
    },
    async findByIdGeoJson(id) {
        return await apiClient.get('/sites/' + id);
    },    

    async testEndpoint() {
        return await apiClient.get('/sites/test');
    }
};

export default SiteService;