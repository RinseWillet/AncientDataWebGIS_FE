import React, { useRef, useState, useEffect } from 'react';
// import { useNavigate } from "react-router-dom";
import SiteService from '../../services/SiteService';
import RoadService from '../../services/RoadService';

const MapInfoCard = ({ searchItem }) => {

    const infoRef = useRef(0);
    const [siteInfo, setSiteInfo] = useState([]);
    const [roadInfo, setRoadInfo] = useState([]);

    // //hook for navigation to go back to DataList or go to Atlas page
    // const navigate = useNavigate();


    //loading site and road data from
    useEffect(() => {        
        async function LoadSiteData() {

            if (searchItem.type === "site") {
                SiteService
                    .findByIdGeoJson(searchItem.id)
                    .then((response) => {
                        setSiteInfo(response.data);
                    })
                    .catch((error) => {
                        console.error(error);
                    })
            } else if (searchItem.type === "road") {
                RoadService
                    .findByIdGeoJson(searchItem.id)
                    .then((response) => {
                        setRoadInfo(response.data);
                    })
                    .catch((error) => {
                        console.error(error);
                    })
            }
        }
        LoadSiteData();
    }, [searchItem]);

    const siteTypeConverter = (siteType) => {
        if (siteType === 'castellum') {
            return siteType;
        } else if (siteType === 'pos_castellum') {
            return "possible castellum";
        } else if (siteType === 'legfort') {
            return "legionary fortress / castra";
        } else if (siteType === 'watchtower') {
            return siteType;
        } else if (siteType === 'city') {
            return "autonomous city";
        } else if (siteType === 'cem') {
            return "(Roman) cemetery";
        } else if (siteType === 'ptum') {
            return "possible barrow";
        } else if (siteType === 'tum') {
            return "(Prehistoric?) barrow";
        } else if (siteType === 'villa') {
            return siteType;
        } else if (siteType === 'pvilla') {
            return "possible villa";
        } else if (siteType === 'sett') {
            return "settlement";
        } else if (siteType === 'settS') {
            return "settlement with stone buildings";
        } else if (siteType === 'sanctuary') {
            return siteType;
        } else if (siteType === 'ship') {
            return "shipwreck";
        } else if (siteType === 'pship') {
            return "possible shipwreck";
        } else if (siteType === 'site') {
            return "generic site";
        } else {
            return "unknown"
        }
    }

    // const MoreRoadInfoButtonHandler = () => {
    //     console.log("joepie");
    //     navigate("/datalist/roadinfo/" + roadInfo.features.properties.id);
    // }

    //renders card only if the data is filled after apicall
    if (searchItem.type === "site") {
        if (siteInfo.length < 1) {
            return (
                <div className="infoCard" ref={infoRef}>
                    <p>Loading Data</p>
                </div>
            )
        } else {
            let comment = siteInfo.features.properties.comment;
            let siteType = siteTypeConverter(siteInfo.features.properties.siteType)
            console.log(siteInfo);
            return (
                <div className="infoCard" ref={infoRef}>
                    <b>
                        Identification:
                    </b><br />{siteType} <br />
                    <span>
                        <b>Comment :</b><br />{comment}
                    </span>
                </div>
            );
        }
    } else if (searchItem.type === "road") {      
        if (roadInfo.length < 1) {
            return (
                <div className="infoCard" ref={infoRef}>
                    <p>Loading Data</p>
                </div>
            )
        } else {
            console.log(roadInfo);
            let name = roadInfo.features.properties.name;
            let type = roadInfo.features.properties.type;
            let typeDescription = roadInfo.features.properties.typeDescription;         
            let description = roadInfo.features.properties.description;
            let date = roadInfo.features.properties.date;          

            return (
                <div className="infoCard" ref={infoRef}>
                    <h2>{name}</h2><br />
                    <b>Identification : </b><br />
                    {type} - {(typeDescription === undefined) ? null : <span>{typeDescription}</span>} <br />                    
                    <b>Description :</b><br />
                    <span>{description}</span><br />
                    {(date === undefined) ? null : <h4>Date : </h4>}
                    {(date === undefined) ? null : <span>{date}</span>}                  
                    {/* <button className="location-btn" onClick={MoreRoadInfoButtonHandler}>More Info?</button>                     */}
                </div>
            );
        }
    } else {
        return (
            <div className="infoCard" ref={infoRef}>
                <p>Not Found</p>
            </div>
        )
    }
}

export default MapInfoCard;