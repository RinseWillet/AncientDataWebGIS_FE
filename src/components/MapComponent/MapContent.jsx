import {GeoJSON, LayersControl, ScaleControl, TileLayer, useMap, WMSTileLayer} from 'react-leaflet';
import PropTypes from 'prop-types';
import {
	castellumIcon,
	cemeteryIcon,
	cityIcon,
	highlightedSiteIcon,
	histRec,
	hypotheticalRoute,
	legionaryFortIcon,
	mileStoneIcon,
	notShowRoad,
	possibleCastellumIcon,
	possibleRoad,
	possibleShipIcon,
	possibleVillaIcon,
	road,
	sanctuaryIcon,
	settlementIcon,
	settlementStoneIcon,
	shipIcon,
	siteIcon,
	tumulusIcon,
	villaIcon,
	watchtowerIcon
} from './Styles/markerStyles';
import './MapContent.css';
import 'leaflet-draw';
import 'leaflet-draw/dist/leaflet.draw.css';
import GeometryEditor from '../GeometryEditor/GeometryEditor';
import {useEffect} from 'react';

const MapContent = ({
	                    siteData,
	                    roadData,
	                    setShowInfoCard,
	                    setSearchItem,
	                    queryItem,
	                    searchItem,
	                    isEditing,
	                    geometry,
	                    onGeometryChange,
	                    siteMarkersRef
                    }) => {
	const map = useMap();

	let selectedRoadId = null;
	if (searchItem?.type === 'road') {
		selectedRoadId = searchItem.id;
	} else if (queryItem?.type === 'road') {
		selectedRoadId = queryItem.id;
	}

	// Highlight site marker via ref after selection
	useEffect(() => {
		if (!map) return;

		Object.entries(siteMarkersRef.current).forEach(([id, marker]) => {
			if (searchItem?.type === 'site' && String(searchItem.id) === String(id)) {
				marker.setIcon(highlightedSiteIcon);
			} else {
				const icon = marker.feature?.properties?.siteType
					? getSiteIcon(marker.feature.properties.siteType)
					: siteIcon;
				marker.setIcon(icon);
			}
		});
	}, [searchItem, map]);

	const getSiteIcon = (type) => {
		const iconMap = {
			'castellum': castellumIcon,
			'pos_castellum': possibleCastellumIcon,
			'legfort': legionaryFortIcon,
			'watchtower': watchtowerIcon,
			'city': cityIcon,
			'cem': cemeteryIcon,
			'ptum': tumulusIcon,
			'tum': tumulusIcon,
			'villa': villaIcon,
			'pvilla': possibleVillaIcon,
			'sett': settlementIcon,
			'settS': settlementStoneIcon,
			'sanctuary': sanctuaryIcon,
			'ship': shipIcon,
			'pship': possibleShipIcon,
			'site': siteIcon,
			'milestone': mileStoneIcon
		};
		return iconMap[type] || siteIcon;
	};

	// sonarjs-issue S6774: This is not a React component, props validation is not required. NOSONAR
	const roadStyleDifferentiator = (props) => {
		switch (props.type) {
			case 'possible road':
				return possibleRoad;
			case 'hypothetical route':
				return hypotheticalRoute;
			case 'road':
				return road;
			case 'hist_rec':
				return histRec;
			default:
				return notShowRoad;
		}
	};

	const clickZoomSite = (e) => {
		const {lat, lng} = e.target.getLatLng();
		const x = map.getPixelBounds().getSize().x;
		let offset;
		if (x > 800) {
			offset = 0.01;
		} else if (x > 600) {
			offset = 0.005;
		} else if (x > 400) {
			offset = 0.00025;
		} else {
			offset = 0;
		}
		map.setView([lat, lng + offset], 14);
	};

	const clickZoomRoad = (layer) => {
		const bounds = layer.getBounds();
		const x = map.getPixelBounds().getSize().x;
		let pad;
		if (x > 800) {
			pad = {bottomRight: [400, 10], topLeft: [0, 10]};
		} else if (x > 600) {
			pad = {bottomRight: [150, 5], topLeft: [0, 5]};
		} else if (x > 400) {
			pad = {bottomRight: [100, 3], topLeft: [0, 3]};
		} else {
			pad = {bottomRight: [10, 20], topLeft: [10, 10]};
		}
		map.fitBounds(bounds, {paddingBottomRight: pad.bottomRight, paddingTopLeft: pad.topLeft});
	};

	const clickSite = (e) => {
		const id = e.sourceTarget.feature.properties.id;
		setSearchItem({type: 'site', id});
		clickZoomSite(e);
		setTimeout(() => setShowInfoCard(true), 100);
	};

	const clickRoad = (e) => {
		const id = e.target.feature.properties.id;
		setSearchItem({type: 'road', id});
		clickZoomRoad(e.target);
		setShowInfoCard(true);
	};

	return (
		<>
			<LayersControl position="topleft" collapsed={true}>
				<LayersControl.BaseLayer checked name="Positron Modern Topographical">
					<TileLayer
						attribution="© OpenStreetMap contributors, © CartoDB"
						url="http://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png"
					/>
				</LayersControl.BaseLayer>
				<LayersControl.BaseLayer name="Open Street Map Topographical">
					<TileLayer
						attribution="© OpenStreetMap"
						url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
					/>
				</LayersControl.BaseLayer>
				<LayersControl.BaseLayer name="Satellite">
					<TileLayer
						attribution="Tiles © Esri"
						url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
					/>
				</LayersControl.BaseLayer>
				<LayersControl.BaseLayer name="1801–1828: Kartenaufnahme der Rheinlande">
					<WMSTileLayer
						url="http://www.wms.nrw.de/geobasis/wms_nw_tranchot?"
						layers="nw_tranchot"
					/>
				</LayersControl.BaseLayer>
				<LayersControl.BaseLayer name="1836–1850: Preußische Kartenaufnahme">
					<WMSTileLayer
						url="http://www.wms.nrw.de/geobasis/wms_nw_uraufnahme?"
						layers="nw_uraufnahme_rw"
					/>
				</LayersControl.BaseLayer>
				<LayersControl.BaseLayer name="1891–1912: Preußische Kartenaufnahme">
					<WMSTileLayer
						url="http://www.wms.nrw.de/geobasis/wms_nw_neuaufnahme?"
						layers="nw_neuaufnahme"
					/>
				</LayersControl.BaseLayer>

				<LayersControl.Overlay checked name="Archaeological Sites">
					<GeoJSON
						data={siteData}
						pointToLayer={(feature, latlng) => {
							const id = feature.properties.id;
							const icon = getSiteIcon(feature.properties.siteType);
							const marker = new L.Marker(latlng, {icon, alt: feature.properties.name});
							marker.feature = feature; // attach feature for later
							siteMarkersRef.current[id] = marker;
							return marker;
						}}
						onEachFeature={(feature, layer) => {
							layer.on({click: clickSite});
						}}
					/>
				</LayersControl.Overlay>

				<LayersControl.Overlay checked name="Roads and Routes">
					<GeoJSON
						data={roadData}
						style={(feature) => {
							const isSelected = String(feature.properties.id) === String(selectedRoadId);
							return isSelected
								? {weight: 3, color: 'yellow', zIndex: 20}
								: roadStyleDifferentiator(feature.properties);
						}}
						onEachFeature={(feature, layer) => {
							layer.on({click: clickRoad});
						}}
					/>
				</LayersControl.Overlay>
			</LayersControl>

			{isEditing && (
				<GeometryEditor
					geometry={geometry}
					onGeometryChange={onGeometryChange}
					isEditing={isEditing}
				/>
			)}
			<ScaleControl position="bottomleft" />
		</>
	);
};

MapContent.propTypes = {
	siteData: PropTypes.object.isRequired,
	roadData: PropTypes.object.isRequired,
	setShowInfoCard: PropTypes.func.isRequired,
	setSearchItem: PropTypes.func.isRequired,
	queryItem: PropTypes.object,
	searchItem: PropTypes.object,
	isEditing: PropTypes.bool,
	geometry: PropTypes.object,
	onGeometryChange: PropTypes.func,
	siteMarkersRef: PropTypes.object.isRequired
};

export default MapContent;
