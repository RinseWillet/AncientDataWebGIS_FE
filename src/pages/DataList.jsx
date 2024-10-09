import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import RoadService from "../services/RoadService";
import SiteService from "../services/SiteService";

//style
import './DataList.css'

//datagrid
import { AgGridReact } from 'ag-grid-react'; // React Data Grid Component
import "ag-grid-community/styles/ag-grid.css"; // Mandatory CSS required by the Data Grid
import "ag-grid-community/styles/ag-theme-quartz.css"; // Optional Theme applied to the Data Grid

const DataList = () => {


    //hook for navigation to Info page
    const navigate = useNavigate();

    //state switch between road and site data
    const [dataSwitch, setDataSwitch] = useState(false)

    //data from API
    const [data, setData] = useState([]);

    // Column Definitions: Defines the columns to be displayed.
    const [colDefs, setColDefs] = useState([
        { field: "id" },
        { field: "name" },
        { field: "type" },
        { field: "date" },
    ]);

    // Row Data: The data to be displayed.
    const [rowData, setRowData] = useState([]);

    useEffect(() => {
        function findAllRoads() {
            RoadService
                .findAllGeoJson()
                .then((response) => {
                    setData(response.data);
                })
                .catch((error) => {
                    console.error(error);
                });
        }

        function findAllSites() {
            SiteService
                .findAllGeoJson()
                .then((response) => {
                    setData(response.data);
                })
                .catch((error) => {
                    console.error(error);
                })
        }

        //if switched to roads (boolean in dataSwitch has state false) -> findAllRoads
        if (!dataSwitch) {
            setColDefs([
                { field: "id" },
                { field: "name" },
                { field: "type" },
                { field: "date" },
            ])
            findAllRoads();
        } else {
            setColDefs([
                { field: "id" },
                { field: "name" },
                { field: "type" }
            ])
            findAllSites();
        }
    }, [dataSwitch]);

    //as soon as the state of data is set (=loaded from API completed - see above) the data is parsed to an array for the rows
    useEffect(() => {
        function rowFeatureLoader() {
            if (data.length < 1) {
                console.log("no data");
            } else {        
                let rowFeatures = [];

                if (!dataSwitch) {
                    for (let i = 0; i < data.features.length; i++) {
                        try {
                            let feature = {
                                id: data.features[i].properties.id,
                                name: data.features[i].properties.name,
                                type: data.features[i].properties.type,
                                date: data.features[i].properties.date
                            }
                            rowFeatures.push(feature);
                        } catch (error) {
                            console.error(error);
                            continue;
                        }

                    }
                } else {
                    for (let i = 0; i < data.features.length; i++) {
                        try {
                            let feature = {
                                id: data.features[i].properties.id,
                                name: data.features[i].properties.name,
                                type: data.features[i].properties.siteType,
                            }
                            rowFeatures.push(feature);
                        } catch (error) {
                            console.error(error);
                            continue;
                        }

                    }
                }
                setRowData(rowFeatures);
            }
        }
        rowFeatureLoader();
    }, [data]);

    const autoSizeStrategy = {
        type: 'fitGridWidth',
        defaultMinWidth: 50,
        columnLimits: [
            {
                colId: 'country',
                minWidth: 900
            }
        ]
    };

    const onRowClickHandler = (selected) => {
        if (!dataSwitch) {
            navigate("roadinfo/" + selected.data.id)
        } else {
            navigate("siteinfo/" + selected.data.id)
        }
    }

    return (
        <div className="pagebox">
            <div className="typeSwitch">
                <p className={`dataSwitch-label__roads ${dataSwitch ? "" : "switched"}`}>Roads</p>
                <button className={`dataSwitch-btn ${dataSwitch ? "switched" : ""}`}
                    onClick={() => setDataSwitch(!dataSwitch)}>
                    <div className="thumb" />
                </button>
                <p className={`dataSwitch-label__sites ${dataSwitch ? "switched" : ""}`}>Sites</p>
            </div>
            <div
                className="ag-theme-quartz" // applying the Data Grid theme
                style={{ height: '91%', width: '100%'}}  // the Data Grid will fill the size of the parent container
            >
                <AgGridReact
                    rowData={rowData}
                    columnDefs={colDefs}
                    pagination={true}
                    autoSizeStrategy={autoSizeStrategy}
                    onRowDoubleClicked={onRowClickHandler}
                />
            </div>
        </div>
    );
}

export default DataList;