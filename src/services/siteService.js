import apiClient from "../api/config";

const siteService = {
    overviewMapping() {
        return apiClient.get('/settlements/overviewmap')
    },
    findAll() {
        return apiClient.get('/settlements');
    },
    findAllGeoJson() {
        return apiClient.get('/settlements/geojson');
    },
    findAllByProvince(data) {
        return apiClient.get('/settlements/province', {params: {name: data}, responseType: 'json'});
    },
    findAllByProvinceGeoJson(data) {
        return apiClient.get('/settlements/province', {params: {name: data}, responseType: 'json'});
    }
};

export default siteService;