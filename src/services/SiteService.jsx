import apiClient from "../api/config";

const SiteService = {        
    async findAllGeoJson() {
        return await apiClient.get('/sites/geojson');
    },
    async findAllByIdGeoJson(data) {
        return await apiClient.get('/sites/' + data.id);
    },    

    async testEndpoint() {
        return await apiClient.get('/sites/test');
    }
};

export default SiteService;