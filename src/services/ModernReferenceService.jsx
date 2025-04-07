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
};

export default ModernReferenceService;