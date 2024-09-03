import { useParams, useNavigate } from "react-router-dom";
import MapComponent from "../components/MapComponent/MapComponent";

const Atlas = () => {

    // the Atlas page can be called with or without params. The params 
    // denote a specific query for a road or site from the RoadInfo or SiteInfo pages
    const { id } = useParams()

    //hook for navigation to go back to DataList or go to Atlas page
    const navigate = useNavigate();

    //back button when map is queried from DataList and SiteInfo/RoadInfo pages
    const backButtonHandler = () => {
        if (id.includes("road")) {
            navigate("/datalist/roadinfo/" + id.split("_").pop());
        } else if (id.includes("site")) {
            navigate("/datalist/siteinfo/" + id.split("_").pop());
        }
    }

    if (typeof (id) == 'undefined') {
        return (
            <div className="pagebox">
                <MapComponent queryItem="" />
            </div>
        )
    } else {
        let queryData = id;

        //this catches incompatible params
        if (!(queryData.includes("road_") || queryData.includes("site_"))) {
            return (
                <div className="pagebox">
                    <MapComponent queryItem="" />
                </div>
            )
        }

        let query = {
            type: "",
            id: ""
        }

        let queryId = queryData.split("_").pop();

        if (queryData.includes("road_")) {
            query = {
                type: "road",
                id: queryId
            }
        } else if (queryData.includes("site_")) {
            query = {
                type: "site",
                id: queryId
            }
        }
        return (
            <div className="pagebox">
                <MapComponent queryItem={query} />
                <button className="back-btn" onClick={backButtonHandler}>BACK</button>
            </div>
        )
    };
};

export default Atlas;
