import apiClient from "../api/config";

const SiteService = {        
    async findAllGeoJson() {
        return await apiClient.get('/sites/all');
    },
    async findByIdGeoJson(id) {
        return await apiClient.get('/sites/' + id);
    },
    async findModernReferenceBySiteId(id) {
        return await apiClient.get('sites/modref/' + id);
    } 
};

export default SiteService;