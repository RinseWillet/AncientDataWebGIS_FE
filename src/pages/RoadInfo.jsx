import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import RoadService from "../services/RoadService";
import MapComponent from "../components/MapComponent/MapComponent";
import { geoJSONtoWKT } from "../utils/geometryUtils";

//style
import './InfoPage.css';


const RoadInfo = (e) => {

    const { user } = useSelector((state) => state.auth);
    const [isEditing, setIsEditing] = useState(false);
    const isAdmin = Array.isArray(user?.roles) && user.roles.includes("ADMIN");

    const [editFormData, setEditFormData] = useState({
        name: "",
        type: "",
        typeDescription: "",
        location: "",
        description: "",
        date: "",
        geom: "",
        cat_nr: ""
    });

    const { id } = useParams();

    const [data, setData] = useState();
    const [modRef, setModRef] = useState();

    //hook for navigation and function to go back to DataList using back button
    const navigate = useNavigate();

    const backButtonHandler = () => {
        navigate("/datalist/")
    }


    useEffect(() => {
        async function LoadRoadInfo() {
            RoadService
                .findByIdGeoJson(id)
                .then((response) => {
                    setData(response.data);
                })
                .catch((error) => {
                    console.error(error);
                });
            RoadService
                .findModernReferenceByRoadId(id)
                .then((response) => {
                    setModRef(response.data);
                })
                .catch((error) => {
                    console.log(error);
                });
        }
        LoadRoadInfo();
    }, []);

    //query to feed to the mapcomponent
    let query = {
        type: "road",
        id: id
    }

    //logic to deal with loading data and ultimately loading the data and rendering the page
    if (typeof (data) == 'undefined') {
        return (
            <div className="roadinfo-card">
                <p>Loading data</p>
            </div>
        );
    } else if (typeof (modRef) === 'undefined') {
        return (
            <div className="roadinfo-card">
                <p>Loading data</p>
            </div>
        );
    } else {
        const feature = data.features?.[0];
        if (!feature) return <p>No feature found</p>;

        const { properties = {}, geometry = {} } = feature;
        let name = properties.name;
        let type = properties.type;
        let typeDescription = properties.typeDescription;
        let location = properties.location;
        let description = properties.description;
        let date = properties.date;
        let references = properties.references;
        let historicalReferences = properties.historicalReferences;

        const modernReferenceRenderer = (modRef) => {
            if (modRef.length > 0) {
                let modernReferences = [];
                modRef.forEach((element) => modernReferences.push(element));
                return modernReferences.map((modernReference) => modernReference.url === null ? <li key={modernReference.id} className="reference-listitem__nolink">{modernReference.fullRef}</li> :
                    <li key={modernReference.id}><a href={modernReference.url} className="reference-listitem__link">{modernReference.fullRef}</a></li>)
            } else {
                return (
                    <span>{references}</span>
                )
            }
        }

        const handleDelete = async () => {
            const confirm = window.confirm("Are you sure you want to delete this road?");
            if (!confirm) return;

            try {
                await RoadService.delete(id);
                alert("Road deleted successfully.");
                navigate("/datalist");
            } catch (error) {
                console.error("Error deleting road:", error);
                alert("Failed to delete the road.");
            }
        };

        const handleSave = async () => {
            try {
                const wktGeom = geoJSONtoWKT(editFormData.geom);

                const updatedRoadDTO = {
                    ...editFormData,
                    geom: wktGeom,
                };

                console.log("Sending RoadDTO:", updatedRoadDTO);

                const updated = await RoadService.updateRoad(id, updatedRoadDTO);
                alert("Road updated!");
                setData(updated.data);
                setIsEditing(false);
            } catch (error) {
                console.error("Update failed:", error);
                alert("Failed to update road.");
            }
        };

        return (
            <>
                <div className="pagebox">
                    <div className="infopage-box">
                        <div className="infopage-card">
                            <h4>Information</h4>

                            {isEditing ? (
                                <>
                                    <input
                                        className="info-input"
                                        type="text"
                                        value={editFormData.name}
                                        onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                                        placeholder="Name"
                                    />
                                    <input
                                        className="info-input"
                                        type="text"
                                        value={editFormData.type}
                                        onChange={(e) => setEditFormData({ ...editFormData, type: e.target.value })}
                                        placeholder="Type"
                                    />
                                    <input
                                        className="info-input"
                                        type="text"
                                        value={editFormData.typeDescription}
                                        onChange={(e) => setEditFormData({ ...editFormData, typeDescription: e.target.value })}
                                        placeholder="Type Description"
                                    />
                                    <input
                                        className="info-input"
                                        type="text"
                                        value={editFormData.location}
                                        onChange={(e) => setEditFormData({ ...editFormData, location: e.target.value })}
                                        placeholder="Location"
                                    />
                                    <textarea
                                        className="info-input"
                                        rows={3}
                                        value={editFormData.description}
                                        onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                                        placeholder="Description"
                                    />
                                    <input
                                        className="info-input"
                                        type="text"
                                        value={editFormData.date}
                                        onChange={(e) => setEditFormData({ ...editFormData, date: e.target.value })}
                                        placeholder="Date"
                                    />

                                    <div style={{ marginTop: "1rem" }}>
                                        <button className="info-btn" onClick={handleSave}>Save</button>
                                        <button className="info-btn delete" onClick={() => setIsEditing(false)}>Cancel</button>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <h2>{name}</h2>

                                    {isAdmin && (
                                        <button className="info-btn" onClick={() => {
                                            const feature = data.features?.[0];
                                            if (!feature) return;

                                            const { properties = {}, geometry = {} } = feature;
                                            setEditFormData({
                                                name: properties.name || "",
                                                type: properties.type || "",
                                                typeDescription: properties.typeDescription || "",
                                                location: properties.location || "",
                                                description: properties.description || "",
                                                date: properties.date || "",
                                                geom: geoJSONtoWKT(geometry),
                                                cat_nr: properties.cat_nr || ""
                                            });
                                            setIsEditing(true);
                                        }}>
                                            Edit
                                        </button>
                                    )}

                                    <h4>Identification:</h4>
                                    <span>{type} - {typeDescription}</span>

                                    {location && <>
                                        <h4>Location:</h4>
                                        <span>{location}</span>
                                    </>}

                                    {description && <>
                                        <h4>Description:</h4>
                                        <span>{description}</span>
                                    </>}

                                    {date && <>
                                        <h4>Date:</h4>
                                        <span>{date}</span>
                                    </>}

                                    {references && <>
                                        <h4>References:</h4>
                                        {modernReferenceRenderer(modRef)}
                                    </>}

                                    {historicalReferences && <>
                                        <h4>Historical references:</h4>
                                        <span>{historicalReferences}</span>
                                    </>}
                                </>
                            )}
                        </div>
                        <div className="infopage-illustrationbox">
                            <div className="infopage-map">
                                <MapComponent queryItem={query} adjustMapHeight={true} />
                            </div>
                            <div className="infopage-image">
                            </div>
                            <button className="back-btn" onClick={backButtonHandler}>BACK</button>
                        </div>
                    </div>
                </div>
            </>
        )
    }
}

export default RoadInfo;