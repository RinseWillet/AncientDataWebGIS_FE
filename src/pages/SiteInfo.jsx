import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import SiteService from "../services/SiteService";
import MapComponent from "../components/MapComponent/MapComponent";

//style
import './InfoPage.css';

const SiteInfo = (e) => {

    const { id } = useParams();

    const [siteData, setSiteData] = useState();
    const [modRef, setModRef] = useState();

    //hook for navigation and function to go back to DataList using back button
    const navigate = useNavigate();

    const backButtonHandler = () => {
        navigate("/datalist/")
    }

    useEffect(() => {
        async function LoadSiteInfo() {
            SiteService
                .findByIdGeoJson(id)
                .then((response) => {
                    setSiteData(response.data);
                })
                .catch((error) => {
                    console.error(error);
                });
            SiteService
                .findModernReferenceBySiteId(id)
                .then((response) => {
                    setModRef(response.data);
                })
                .catch((error) => {
                    console.log(error);
                });
        }

        LoadSiteInfo();
    }, []);

    //query to feed to the mapcomponent
    let query = {
        type: "site",
        id: id
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

    //logic to deal with loading data and ultimately loading the data and rendering the page
    if (typeof (siteData) == 'undefined') {
        return (
            <div className="pagebox">
                <div className="roadinfo-card">
                    <p>Loading data</p>
                </div>
            </div>

        );

    } else if (typeof (modRef) === 'undefined') {
        return (
            <div className="roadinfo-card">
                <p>Loading data</p>
            </div>
        );
    } else {
        let name = siteData.features.properties.name;
        let type = siteTypeConverter(siteData.features.properties.siteType);
        let description = siteData.features.properties.description;
        let status = siteData.features.properties.status;
        let references = siteData.features.properties.references;
        let province = siteData.features.properties.province;
        let pleiadesLink = siteData.features.properties.pleiadesid;

        const modernReferenceRenderer = (modRef) => {

            if (modRef.length > 0) {
                let modernReferences = [];
                modRef.forEach((element) => modernReferences.push(element));

                return modernReferences.map((modernReference) => modernReference.url === null ? <li className="reference-listitem__nolink">{modernReference.fullRef}</li> :
                    <li><a href={modernReference.url} className="reference-listitem__link">{modernReference.fullRef}</a></li>
                )
            } else {
                return (
                    <span>{references}</span>
                )
            }
        }

        return (
            <div className="pagebox">
                <div className="infopage-box">
                    <div className="infopage-card">
                        <h4>Information</h4>
                        <h2>{name}</h2>
                        <h4>Identification : </h4>
                        <span>{type}</span>
                        <h4>Description : </h4>
                        <span>{description}</span>
                        {(status === undefined) ? null : <h4>Status : </h4>}
                        {(status === undefined) ? null : <span>{status}</span>}
                        {(references === undefined) ? null : <h4>References : </h4>}
                        {(references === undefined) ? null : modernReferenceRenderer(modRef)}
                        {(province === undefined) ? null : <h4>Province :</h4>}
                        {(province === undefined) ? null : <span>{province}</span>}
                        {(pleiadesLink === undefined) ? null : <h4>Pleiades</h4>}
                        {(pleiadesLink === undefined) ? null : <span>{pleiadesLink}</span>}
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
        )
    }
}

export default SiteInfo;