import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import RoadService from "../services/RoadService";
import MapComponent from "../components/MapComponent/MapComponent";

//style
import './InfoPage.css';


const RoadInfo = (e) => {

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
        let name = data.features.properties.name;
        let type = data.features.properties.type;
        let typeDescription = data.features.properties.typeDescription;
        let location = data.features.properties.location;
        let description = data.features.properties.description;
        let date = data.features.properties.date;
        let references = data.features.properties.references;
        let historicalReferences = data.features.properties.historicalReferences;

        const modernReferenceRenderer = (modRef) => {
            if (modRef.length > 0) {
                let modernReferences = [];
                modRef.forEach((element) => modernReferences.push(element));
                return modernReferences.map((modernReference) => modernReference.url === null ? <li className="reference-listitem__nolink">{modernReference.fullRef}</li> :
                    <li><a href={modernReference.url} className="reference-listitem__link">{modernReference.fullRef}</a></li>)
            } else {
                return (
                    <span>{references}</span>
                )
            }
        }

        return (
            <>
                <div className="pagebox">
                    <div className="infopage-box">
                        <div className="infopage-card">
                            <h4>Information</h4>
                            <h2>{name}</h2>
                            <h4>Identification : </h4>
                            <span> {type} - {typeDescription}</span>
                            {(location === undefined) ? null : <h4>Location : </h4>}
                            {(location === undefined) ? null : <span>{location}</span>}
                            {(description === undefined) ? null : <h4>Description : </h4>}
                            {(description === undefined) ? null : <span>{description}</span>}
                            {(date === undefined) ? null : <h4>Date : </h4>}
                            {(date === undefined) ? null : <span>{date}</span>}
                            {(references === undefined) ? null : <h4>References : </h4>}
                            {(references === undefined) ? null : modernReferenceRenderer(modRef)}
                            {(historicalReferences === undefined) ? null : <h4>Historical references : </h4>}
                            {(historicalReferences === undefined) ? null : <span>{historicalReferences}</span>}
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