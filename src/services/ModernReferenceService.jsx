import apiClient from "../api/config";

const ModernReferenceService = {
    async findAll() {
        return await apiClient.get("/modernreferences/all");
    },

    async create(modernReferenceDto) {
        return await apiClient.post("/modernreferences", modernReferenceDto);
    },

    async update(id, modernReferenceDto) {
        return await apiClient.put(`/modernreferences/${id}`, modernReferenceDto);
    },

    async delete(id) {
        return await apiClient.delete(`/modernreferences/${id}`);
    },

    async findRoadsByRefId(id) {
        return await apiClient.get(`/modernreferences/road/${id}`);
    },

    async findSitesByRefId(id) {
        return await apiClient.get(`/modernreferences/site/${id}`);
    },

    async linkModernReferenceToSite(siteId, refId) {
        return await apiClient.post(`/sites/${siteId}/modern-references/${refId}`);
    },

    async unlinkModernReferenceFromSite(siteId, refId) {
        return await apiClient.delete(`/sites/${siteId}/modern-references/${refId}`)
    },

    async linkModernReferenceToRoad(roadId, refId) {
        return await apiClient.post(`/roads/${roadId}/modern-references/${refId}`);
    },

    async unlinkModernReferenceFromRoad(roadId, refId) {
        return await apiClient.delete(`/roads/${roadId}/modern-references/${refId}`)
    },

};

export default ModernReferenceService;