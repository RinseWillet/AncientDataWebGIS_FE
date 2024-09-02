import { useParams } from "react-router-dom";
import MapComponent from "../components/MapComponent/MapComponent";

const Atlas = () => {

    // the Atlas page can be called with or without params. The params 
    // denote a specific query for a road or site from the RoadInfo or SiteInfo pages
    const { id } = useParams()

    if (typeof (id) == 'undefined') {
        return (
            <>
                <MapComponent queryItem="" />
            </>
        )
    } else {
        let queryData = id;

        if (!(queryData.includes("road_") || queryData.includes("site_"))) {
            return (
                <>
                    <MapComponent queryItem="" />
                </>
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
            </div>
        )
    };
};

export default Atlas;
