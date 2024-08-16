import React, { useRef, useState, useEffect } from 'react';
import SiteService from '../../services/SiteService';

const infoText =
    "Lorem ipsum dolor sit amet consectetur adipisicing elit. Obcaecati a deserunt distinctio vitae! Dolores officiis animi ab ut officia consequuntur fuga, possimus et eligendi, facilis libero nulla repellat modi magnam!";


const MapInfoCard = ({ searchId }) => {

    const infoRef = useRef(0);
    const [siteInfo, setSiteInfo] = useState([]);
 
    //loading site and road data from
    useEffect(() => {
        async function LoadSiteData() {

            SiteService
                .findByIdGeoJson(searchId)
                .then((response) => {
                    setSiteInfo(response.data);
                })
                .catch((error) => {
                    console.error(error);
                })
        }
        LoadSiteData();
    }, []);

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

    //renders card only if the data is filled after apicall
    if (siteInfo.length < 1) {
        console.log("loading biatch");
        return (
            <div className="infoCard" ref={infoRef}>
            <p>Loading Data</p>
        </div>
        )
    } else {
        console.log("tadaaaaa");
        let comment = siteInfo.features.properties.comment;
        let siteType = siteTypeConverter(siteInfo.features.properties.siteType)
        return (            
            <div className="infoCard" ref={infoRef}>                
                <b>
                    Identification: 
                </b><br/>{siteType} <br/>
                <span>
                    <b>Comment :</b><br/>{comment}
                </span>        
            </div>
        );
    }    
}

export default MapInfoCard;