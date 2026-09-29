<?xml version="1.0" encoding="UTF-8"?>
<!-- AncientData DEM ramp · night. Same 8 stops as before; lightness rises with height.
     In GeoServer: Styles → Add new style → name "dem-elevation-ramp-night" → paste. For day, update the
     existing dem-elevation-ramp style in place. Keep in sync with dem/demColorRamp.ts. -->
<StyledLayerDescriptor version="1.0.0"
  xmlns="http://www.opengis.net/sld" xmlns:ogc="http://www.opengis.net/ogc"
  xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://www.opengis.net/sld http://schemas.opengis.net/sld/1.0.0/StyledLayerDescriptor.xsd">
  <NamedLayer>
    <Name>dem-elevation-ramp-night</Name>
    <UserStyle>
      <Title>AncientData DEM elevation ramp (night)</Title>
      <FeatureTypeStyle>
        <Rule>
          <RasterSymbolizer>
            <Opacity>1.0</Opacity>
            <ColorMap type="ramp">
              <ColorMapEntry color="#0B1016" quantity="-25" label="-25 m"/>
              <ColorMapEntry color="#1C2A38" quantity="0" label="0 m"/>
              <ColorMapEntry color="#2E4250" quantity="25" label="25 m"/>
              <ColorMapEntry color="#465A55" quantity="50" label="50 m"/>
              <ColorMapEntry color="#66704F" quantity="75" label="75 m"/>
              <ColorMapEntry color="#8C7D4E" quantity="100" label="100 m"/>
              <ColorMapEntry color="#B39B66" quantity="125" label="125 m"/>
              <ColorMapEntry color="#D8C79C" quantity="155" label="155 m"/>
            </ColorMap>
          </RasterSymbolizer>
        </Rule>
      </FeatureTypeStyle>
    </UserStyle>
  </NamedLayer>
</StyledLayerDescriptor>
