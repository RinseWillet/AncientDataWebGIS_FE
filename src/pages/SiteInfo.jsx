import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import SiteService from "../services/SiteService";

//style
import './SiteInfo.css'

const SiteInfo = (e) => {

    const { id } = useParams();

    const [data, setData] = useState();

    //hook for navigation to go back to DataList or go to Atlas page
    const navigate = useNavigate();

    useEffect(() => {
        async function LoadSiteInfo() {
            SiteService
                .findByIdGeoJson(id)
                .then((response) => {
                    setData(response.data);
                })
                .catch((error) => {
                    console.error(error);
                });
        }
        LoadSiteInfo();
    }, []);

    console.log(data);

    const backButtonHandler = () => {
        navigate("/datalist/")
    }

    const atlasButtonHandler = () => {
        navigate("/atlas/site_" + data.features.properties.id);
    }

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

    if (typeof (data) == 'undefined') {
        return (
            <div className="pagebox">
                <div className="roadinfo-card">
                    <p>Loading data</p>
                </div>
            </div>

        );
    } else {        
        let name = data.features.properties.name;
        let type = siteTypeConverter(data.features.properties.siteType);
        let description = data.features.properties.comment;
        let status = data.features.properties.status;
        let statusReferences = data.features.properties.statusref;
        let province = data.features.properties.province;
        let pleiadesLink = data.features.properties.pleiadesid;

        return (
            <div className="pagebox">
                <div className="siteinfo-card"></div>
                <h3>Information</h3>
                <h4>{name}</h4>
                <h4>Identification : </h4>
                <span>{type}</span>
                <h4>Description : </h4>
                <span>{description}</span>
                <h4>Status : </h4>
                <span>{status}</span>
                <h4>Status references : </h4>
                <span>{statusReferences}</span>
                <h4>Province : </h4>
                <span>{province}</span>
                <h4>Pleiades</h4>
                <span>{pleiadesLink}</span>
                <br></br>
                <button className="back-btn" onClick={backButtonHandler}>BACK</button>
                <button className="location-btn" onClick={atlasButtonHandler}>TO MAP</button>
            </div>
        )
    }
}

export default SiteInfo;