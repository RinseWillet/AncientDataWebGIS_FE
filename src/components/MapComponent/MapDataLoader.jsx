import React, { useState, useEffect } from 'react';
import MapBuilder from './MapBuilder';
import SiteService from '../../services/SiteService';
import RoadService from '../../services/RoadService';

const MapDataLoader = () => {

     //to set the state of the data from apicall to backend
     const [data, setData] = useState([]);
     const [data1, setData1] = useState([]);


 
 
     useEffect(() => {
         function LoadAllData() {
             SiteService
                 .findAllGeoJson()
                 .then((response) => {
                     setData(response.data);
                 })
                 .catch((error) => {
                     console.log(error);
                 })
 
             RoadService
             .findAllGeoJson()
             .then((response) => {
                 setData1(response.data)                
             })
             .catch((error) => {
                 console.log(error)
             })    
 
 
         }
         LoadAllData();
     }, []);
     
     return (
        <>        
            <MapBuilder
                sites={data}
                roads={data1} /> 
        </>
     );
}

export default MapDataLoader
