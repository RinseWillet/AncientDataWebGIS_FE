import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import RoadService from "../services/RoadService";
import ModernReferenceService from "../services/ModernReferenceService";
import MapComponent from "../components/MapComponent/MapComponent";
import ModernReferencePicker from "../components/ModernReferencePicker/ModernReferencePicker";
import { geoJSONtoWKT } from "../utils/geometryUtils";
import './InfoPage.css';

const RoadInfo = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [user, setUser] = useState(JSON.parse(localStorage.getItem("user")));
  const isAdmin = Array.isArray(user?.roles) && user.roles.includes("ADMIN");

  const [roadData, setRoadData] = useState(null);
  const [modRefs, setModRefs] = useState([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editFormData, setEditFormData] = useState({
    name: "", type: "", typeDescription: "", location: "",
    description: "", date: "", geom: "", cat_nr: ""
  });
  const [selectedReferences, setSelectedReferences] = useState([]);
  const [mapKey, setMapKey] = useState(`road-${id}`);

  // Fetch on mount
  useEffect(() => {
    fetchData();
  }, [id]);

  useEffect(() => {
    console.log("📦 Geometry passed to MapComponent:", editFormData.geom);
  }, [editFormData.geom]);

  const fetchData = async () => {
    try {
      const responseRoad = await RoadService.findByIdGeoJson(id);
      const road = responseRoad.data;
      const responseRefs = await RoadService.findModernReferenceByRoadId(id);
      const refs = responseRefs.data;
      setRoadData(road);
      setModRefs(refs);

      const feature = road?.features?.[0];
      const updatedGeom = feature?.geometry;

      if (updatedGeom) {
        const wkt = geoJSONtoWKT(updatedGeom);
        console.log("🔵 Initial geometry from backend:", wkt);
        setEditFormData(prev => ({
          ...prev,
          geom: wkt
        }));
        setMapKey(`road-${id}-${Date.now()}`);
      }
    } catch (err) {
      console.error("Failed to fetch road info:", err);
    }
  };

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this road?")) {
      try {
        await RoadService.delete(id);
        alert("Road deleted successfully.");
        navigate("/datalist");
      } catch (err) {
        console.error("Error deleting road:", err);
        alert("Failed to delete the road.");
      }
    }
  };

  const handleSave = async () => {
    try {
      const updatedDTO = {
        ...editFormData,
        referenceIds: selectedReferences.map(ref => ref.id),
      };

      const updated = await RoadService.updateRoad(id, updatedDTO);
      const updatedGeoJson = await RoadService.findByIdGeoJson(id);
      setRoadData(updatedGeoJson);
      alert("Road updated!");

      await fetchData(); // Pull fresh data again
      setMapKey(`road-${id}-${Date.now()}`); // 👈 Force map re-render AFTER fetch

      console.log("🟠 Geometry just before exiting edit mode:", editFormData.geom);
      setIsEditing(false);
    } catch (err) {
      console.error("Update failed:", err);
      alert("Failed to update road.");
    }
  };

  if (!roadData) return <p>Loading...</p>;
  const feature = roadData.features?.[0];
  if (!feature) return <p>No feature found</p>;

  const { properties = {}, geometry = {} } = feature;
  const {
    name, type, typeDescription, location,
    description, date, references, historicalReferences
  } = properties;

  const modernReferenceRenderer = (refs) =>
    refs.length > 0
      ? refs.map((ref) =>
        ref.url
          ? <li key={ref.id}><a href={ref.url} className="reference-listitem__link">{ref.fullRef}</a></li>
          : <li key={ref.id} className="reference-listitem__nolink">{ref.fullRef}</li>
      )
      : <span>{references}</span>;

  return (
    <div className="pagebox">
      <div className="infopage-box">
        <div className="infopage-card">
          <h4>Information</h4>

          {isEditing ? (
            <>
              {["name", "type", "typeDescription", "location", "description", "date"].map((field) => (
                <div key={field}>
                  <label className="info-label">{field.charAt(0).toUpperCase() + field.slice(1)}</label>
                  {field === "description"
                    ? <textarea className="info-input" rows={3} value={editFormData[field]}
                      onChange={(e) => setEditFormData({ ...editFormData, [field]: e.target.value })} />
                    : <input className="info-input" type="text" value={editFormData[field]}
                      onChange={(e) => setEditFormData({ ...editFormData, [field]: e.target.value })} />}
                </div>
              ))}

              <ModernReferencePicker
                selectedReferences={selectedReferences}
                onSelect={(ref) => {
                  if (!selectedReferences.some(r => r.id === ref.id)) {
                    setSelectedReferences([...selectedReferences, ref]);
                  }
                }}
                onRemove={(ref) =>
                  setSelectedReferences(selectedReferences.filter(r => r.id !== ref.id))
                }
                isEditing={isEditing}
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
                  setSelectedReferences(modRefs);
                  console.log("🟢 Geometry on entering edit mode:", geoJSONtoWKT(geometry));
                  setIsEditing(true);
                }}>Edit</button>
              )}

              <h4>Identification:</h4>
              <span>{type} - {typeDescription}</span>

              {location && <><h4>Location:</h4><span>{location}</span></>}
              {description && <><h4>Description:</h4><span>{description}</span></>}
              {date && <><h4>Date:</h4><span>{date}</span></>}
              {references && <><h4>References:</h4>{modernReferenceRenderer(modRefs)}</>}
              {historicalReferences && <><h4>Historical references:</h4><span>{historicalReferences}</span></>}
            </>
          )}
        </div>

        <div className="infopage-illustrationbox">
          <div className="infopage-map">
            <MapComponent
              key={mapKey}
              queryItem={{ type: "road", id }}
              adjustMapHeight={true}
              isEditing={isEditing}
              geometry={editFormData.geom}
              onGeometryChange={(newWkt) =>
                setEditFormData((prev) => ({ ...prev, geom: newWkt }))
              }
            />
          </div>
          <div className="infopage-image"></div>
          <button className="back-btn" onClick={() => navigate("/datalist")}>BACK</button>
        </div>
      </div>
    </div>
  );
};

export default RoadInfo;