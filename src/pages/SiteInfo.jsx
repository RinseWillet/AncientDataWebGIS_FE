import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchSiteById } from "../features/site/siteThunks";
import { fetchModernReferencesBySiteId } from "../features/modref/modRefThunks";
import SiteService from "../services/SiteService";
import MapComponent from "../components/MapComponent/MapComponent";
import { geoJSONtoWKT } from "../utils/geometryUtils";
import ModernReferencePicker from "../components/ModernReferencePicker/ModernReferencePicker";


import "./InfoPage.css";

const SiteInfo = () => {
    const { user } = useSelector((state) => state.auth);
    const isAdmin = Array.isArray(user?.roles) && user.roles.includes("ADMIN");

    const { id } = useParams();
    const navigate = useNavigate();

    const dispatch = useDispatch();
    const { selectedSite, loading, error } = useSelector((state) => state.sites);
    const [selectedReferences, setSelectedReferences] = useState([]);
    const { referencesBySiteId } = useSelector((state) => state.modRef);
    const modRef = referencesBySiteId[id];
    const [isEditing, setIsEditing] = useState(false);
    const [editFormData, setEditFormData] = useState({
        name: "",
        siteType: "",
        status: "",
        description: "",
        references: "",
        province: "",
        pleiadesid: "",
        geom: ""
    });

    const backButtonHandler = () => navigate("/datalist/");

    useEffect(() => {
        dispatch(fetchSiteById(id));
        dispatch(fetchModernReferencesBySiteId(id));
    }, [dispatch, id]);

    const siteTypeConverter = (siteType) => {
        const lookup = {
            castellum: "castellum",
            pos_castellum: "possible castellum",
            legfort: "legionary fortress / castra",
            watchtower: "watchtower",
            city: "autonomous city",
            cem: "(Roman) cemetery",
            ptum: "possible barrow",
            tum: "(Prehistoric?) barrow",
            villa: "villa",
            pvilla: "possible villa",
            sett: "settlement",
            settS: "settlement with stone buildings",
            sanctuary: "sanctuary",
            ship: "shipwreck",
            pship: "possible shipwreck",
            site: "generic site"
        };
        return lookup[siteType] || "unknown";
    };

    if (loading || !selectedSite || !modRef) {
        return (
            <div className="pagebox">
                <div className="roadinfo-card">
                    <p>Loading data...</p>
                </div>
            </div>
        );
    }

    const feature = selectedSite?.features?.[0];
    if (!feature) return <p>No feature found</p>;

    const { properties = {}, geometry = {} } = feature;

    const modernReferenceRenderer = (modRef) => {
        if (modRef.length > 0) {
            return modRef.map((ref) =>
                ref.url ? (
                    <li key={ref.id}><a className="reference-listitem__link" href={ref.url}>{ref.fullRef}</a></li>
                ) : (
                    <li key={ref.id} className="reference-listitem__nolink">{ref.fullRef}</li>
                )
            );
        }
        return <span>{properties.references}</span>;
    };

    const handleSave = async () => {
        try {
            const updatedDTO = {
                ...editFormData,
                referenceIds: selectedReferences.map(ref => ref.id)
            };
            await SiteService.updateSite(id, updatedDTO);
            alert("Site updated!");

            await dispatch(fetchSiteById(id));

            const refreshed = await SiteService.findByIdGeoJson(id);
            const refreshedFeature = refreshed.data?.features?.[0];

            if (refreshedFeature?.geometry) {
                setEditFormData((prev) => ({
                    ...prev,
                    geom: geoJSONtoWKT(refreshedFeature.geometry),
                }));
            }

            await dispatch(fetchSiteById(id));

            setIsEditing(false);
        } catch (error) {
            console.error("Update failed:", error);
            alert("Failed to update site.");
        }
    };

    return (
        <div className="pagebox">
            <div className="infopage-box">
                <div className="infopage-card">
                    <h4>Information</h4>

                    {isEditing ? (
                        <>
                            <label className="info-label" htmlFor="site-name">Name</label>
                            <input
                                id="site-name"
                                className="info-input"
                                type="text"
                                value={editFormData.name}
                                onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                            />
                            <label className="info-label" htmlFor="site-type">Type</label>
                            <input
                                id="site-type"
                                className="info-input"
                                type="text"
                                value={editFormData.siteType}
                                onChange={(e) => setEditFormData({ ...editFormData, siteType: e.target.value })}
                            />
                            <label className="info-label" htmlFor="site-status">Status</label>
                            <input
                                id="site-status"
                                className="info-input"
                                type="text"
                                value={editFormData.status}
                                onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                            />
                            <label className="info-label" htmlFor="site-description">Description</label>
                            <textarea
                                id="site-description"
                                className="info-input"
                                rows={3}
                                value={editFormData.description}
                                onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                            />
                            <label className="info-label" htmlFor="site-province">Province</label>
                            <input
                                id="site-province"
                                className="info-input"
                                type="text"
                                value={editFormData.province}
                                onChange={(e) => setEditFormData({ ...editFormData, province: e.target.value })}
                            />
                            <label className="info-label" htmlFor="site-pleiadesid">Pleiades</label>
                            <input
                                id="site-pleiadesid"
                                className="info-input"
                                type="text"
                                value={editFormData.pleiadesid}
                                onChange={(e) => setEditFormData({ ...editFormData, pleiadesid: e.target.value })}
                            />

                            <ModernReferencePicker
                                selectedReferences={selectedReferences}
                                onChange={setSelectedReferences}
                            />

                            <div style={{ marginTop: "1rem" }}>
                                <button className="info-btn" onClick={handleSave}>Save</button>
                                <button className="info-btn delete" onClick={() => setIsEditing(false)}>Cancel</button>
                            </div>
                        </>
                    ) : (
                        <>
                            <h2>{properties.name}</h2>

                            {isAdmin && (
                                <button className="info-btn" onClick={() => {
                                    setEditFormData({
                                        name: properties.name || "",
                                        siteType: properties.siteType || "",
                                        status: properties.status || "",
                                        description: properties.description || "",
                                        references: properties.references || "",
                                        province: properties.province || "",
                                        pleiadesid: properties.pleiadesid || "",
                                        geom: geoJSONtoWKT(geometry)
                                    });
                                    setSelectedReferences(modRef || []);
                                    setIsEditing(true);
                                }}>
                                    Edit
                                </button>
                            )}

                            <h4>Identification:</h4>
                            <span>{siteTypeConverter(properties.siteType)}</span>

                            {properties.description && <>
                                <h4>Description:</h4>
                                <span>{properties.description}</span>
                            </>}

                            {properties.status && <>
                                <h4>Status:</h4>
                                <span>{properties.status}</span>
                            </>}

                            {properties.references && <>
                                <h4>References:</h4>
                                {modernReferenceRenderer(modRef)}
                            </>}

                            {properties.province && <>
                                <h4>Province:</h4>
                                <span>{properties.province}</span>
                            </>}

                            {properties.pleiadesid && <>
                                <h4>Pleiades:</h4>
                                <span>{properties.pleiadesid}</span>
                            </>}
                        </>
                    )}
                </div>
                <div className="infopage-illustrationbox">
                    <div className="infopage-map">
                        <MapComponent
                            key={isEditing ? "editing" : `site-${id}-${editFormData.geom}`}
                            queryItem={{ type: "site", id }}
                            adjustMapHeight={true}
                            isEditing={isEditing}
                            geometry={editFormData.geom}
                            onGeometryChange={(newWkt) => {
                                setEditFormData(prev => ({ ...prev, geom: newWkt }));
                            }} />
                    </div>
                    <div className="infopage-image" />
                    <button className="back-btn" onClick={backButtonHandler}>BACK</button>
                </div>
            </div>
        </div>
    );
};

export default SiteInfo;