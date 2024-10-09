// Create the Leaflet map instance
var map = L.map('combomap').setView([38, -95], 4);

// Add the base layer (DarkMatter from CartoDB)
var CartoDB_DarkMatter = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 20
}).addTo(map);

// Layer groups for weather, earthquakes, radar, and hurricanes
var weatherAlertsLayer = L.layerGroup().addTo(map);
var earthquakeLayer = L.layerGroup().addTo(map);
var radarLayer = L.layerGroup().addTo(map);
var hurricaneLayer = L.layerGroup().addTo(map);

// Fetch weather alerts data and add to weatherAlertsLayer
var weatherAlertsUrl = 'https://api.weather.gov/alerts/active?region_type=land';
$.getJSON(weatherAlertsUrl, function(data) {
    L.geoJSON(data, {
        style: function(feature) {
            var alertColor = 'orange';
            if (feature.properties.severity === 'Severe') alertColor = 'red';
            else if (feature.properties.severity === 'Minor') alertColor = 'yellow';
            else if (feature.properties.severity === 'Extreme') alertColor = 'magenta';
            return { color: alertColor };
        },
        onEachFeature: function(feature, layer) {
            layer.bindPopup(`<strong>${feature.properties.headline}</strong>`);
        }
    }).addTo(weatherAlertsLayer);
});

// Fetch earthquake data and add to earthquakeLayer
var earthquakeUrl = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson';
$.getJSON(earthquakeUrl, function(data) {
    L.geoJSON(data, {
        pointToLayer: function(feature, latlng) {
            return L.circleMarker(latlng, {
                radius: feature.properties.mag * 3,
                fillColor: getColor(feature.properties.mag),
                color: '#000',
                weight: 1,
                opacity: 1,
                fillOpacity: 0.8
            });
        },
        onEachFeature: function(feature, layer) {
            var popupContent = `
                <strong>Location:</strong> ${feature.properties.place}<br>
                <strong>Magnitude:</strong> ${feature.properties.mag}<br>
                <strong>Time:</strong> ${new Date(feature.properties.time).toLocaleString()}
            `;
            layer.bindPopup(popupContent);
        }
    }).addTo(earthquakeLayer);
});

// Radar Layer
var radarUrl = 'https://mesonet.agron.iastate.edu/cgi-bin/wms/nexrad/n0r.cgi';
var radarDisplayOptions = {
    layers: 'nexrad-n0r-900913',
    format: 'image/png',
    transparent: true
};
var radar = L.tileLayer.wms(radarUrl, radarDisplayOptions).addTo(radarLayer);

// Function to get color based on earthquake magnitude
function getColor(magnitude) {
    return magnitude > 6 ? 'magenta' :
            magnitude > 5 ? 'red' :
            magnitude > 4 ? 'orange' :
            magnitude > 3 ? 'yellow' :
            magnitude > 2 ? 'green' :
            magnitude > 1 ? 'teal' :
                            'lightblue';
}

// Add Leaflet-ESRI Feature Layers for Active Hurricanes
var forecastPosition = L.esri.featureLayer({
    url: "https://services9.arcgis.com/RHVPKKiFTONKtxq3/arcgis/rest/services/Active_Hurricanes_v1/FeatureServer/0",
    style: function () {
        return { color: 'blue', weight: 2 };
    },
    onEachFeature: function (feature, layer) {
        layer.bindPopup(`<strong>Forecast Position</strong><br>Storm Name: ${feature.properties.STORMNAME}`);
    }
}).addTo(hurricaneLayer);

var observedPosition = L.esri.featureLayer({
    url: "https://services9.arcgis.com/RHVPKKiFTONKtxq3/arcgis/rest/services/Active_Hurricanes_v1/FeatureServer/1",
    style: function () {
        return { color: 'green', weight: 2 };
    },
    onEachFeature: function (feature, layer) {
        layer.bindPopup(`<strong>Observed Position</strong><br>Storm Name: ${feature.properties.STORMNAME}`);
    }
}).addTo(hurricaneLayer);

var forecastTrack = L.esri.featureLayer({
    url: "https://services9.arcgis.com/RHVPKKiFTONKtxq3/arcgis/rest/services/Active_Hurricanes_v1/FeatureServer/2",
    style: function () {
        return { color: 'yellow', weight: 2 };
    },
    onEachFeature: function (feature, layer) {
        layer.bindPopup(`<strong>Forecast Track</strong><br>Storm Name: ${feature.properties.STORMNAME}`);
    }
}).addTo(hurricaneLayer);

var observedTrack = L.esri.featureLayer({
    url: "https://services9.arcgis.com/RHVPKKiFTONKtxq3/arcgis/rest/services/Active_Hurricanes_v1/FeatureServer/3",
    style: function () {
        return { color: 'orange', weight: 2 };
    },
    onEachFeature: function (feature, layer) {
        layer.bindPopup(`<strong>Observed Track</strong><br>Storm Name: ${feature.properties.STORMNAME}`);
    }
}).addTo(hurricaneLayer);

// Add forecast error cone layer with custom styling
var forecastErrorCone = L.esri.featureLayer({
    url: 'https://services9.arcgis.com/RHVPKKiFTONKtxq3/arcgis/rest/services/Active_Hurricanes_v1/FeatureServer/5',
    simplifyFactor: 0.5,
    precision: 5,
    style: function (feature) {
        return {
            color: 'red',          // Line color for the forecast cone
            fillColor: 'orange',   // Fill color
            weight: 2,             // Line weight
            fillOpacity: 0.5       // Transparency of the polygon fill
        };
    },
    onEachFeature: function (feature, layer) {
        layer.bindPopup(`
            <strong>Storm Name:</strong> ${feature.properties.STORMNAME}<br>
            <strong>Maximum Wind Speed:</strong> ${feature.properties.MAX_WIND} mph<br>
            <strong>Forecast Period:</strong> ${feature.properties.FCSTPRD} hours
        `);
    }
}).addTo(hurricaneLayer);



// Add overlay controls to toggle layers
var overlayMaps = {
    "Weather Alerts": weatherAlertsLayer,
    "Earthquakes": earthquakeLayer,
    "Radar": radarLayer,
    "Forecast Position": forecastPosition,
    "Observed Position": observedPosition,
    "Forecast Track": forecastTrack,
    "Observed Track": observedTrack,
    "Forecast Error Cone": forecastErrorCone
};

L.control.layers(null, overlayMaps, {collapsed: false}).addTo(map);
