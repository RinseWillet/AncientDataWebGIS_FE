import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import RoadService from "../services/RoadService";

//style
import './RoadInfo.css'

const RoadInfo = (e) => {

    const { id } = useParams();

    const [data, setData] = useState();

    //hook for navigation to go back to DataList or go to Atlas page
    const navigate = useNavigate();

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
        }
        LoadRoadInfo();
    }, []);

    console.log(data);

    const backButtonHandler = () => {
        navigate("/datalist/")
    }

    const atlasButtonHandler = () => {
        navigate("/atlas/road_" + data.features.properties.id);
    }

    if (typeof (data) == 'undefined') {
        return (
            <div className="roadinfo-card">
                <p>Loading data</p>
            </div>
        );
    } else {
        let name = data.features.properties.name;
        let type = data.features.properties.type;
        let typeDescription = data.features.properties.typeDescription;
        let location = data.features.properties.location;
        let description = data.features.properties.description;
        let date = data.features.properties.date;
        let references = data.features.properties.references;
        let historicalReferences = data.features.properties.historicalReferences;
        return (
            <>
                <div className="pagebox">
                    <div className="roadinfo-card">
                        <h3>Information</h3>
                        <h4>{name}</h4>
                        <h4>Identification : </h4>
                        <span> {type} - {typeDescription}</span>
                        <h4>Location : </h4>
                        <span>{location}</span>
                        <h4>Description : </h4>
                        <span>{description}</span>
                        <h4>Date : </h4>
                        <span>{date}</span>
                        <h4>References : </h4>
                        <span>{references}</span>
                        <h4>Historical references : </h4>
                        <span>{historicalReferences}</span>
                        <br></br>
                        <button className="back-btn" onClick={backButtonHandler}>BACK</button>
                        <button className="location-btn" onClick={atlasButtonHandler}>TO MAP</button>
                    </div>
                </div>
            </>
        )
    }
}

export default RoadInfo;