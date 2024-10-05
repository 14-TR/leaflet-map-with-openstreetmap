var map = L.map('combomap').setView([38, -95], 4);

// Add CartoDB DarkMatter basemap
var CartoDB_DarkMatter = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    subdomains: 'abcd',
    maxZoom: 20
}).addTo(map);

// Create layer groups
var weatherAlertsLayer = L.layerGroup();
var earthquakeLayer = L.layerGroup();
var radarLayer = L.layerGroup();

// Fetch and add weather alerts data
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

// Add radar layer
var radarUrl = 'https://mesonet.agron.iastate.edu/cgi-bin/wms/nexrad/n0r.cgi';
var radarDisplayOptions = {
    layers: 'nexrad-n0r-900913',
    format: 'image/png',
    transparent: true
};
var radar = L.tileLayer.wms(radarUrl, radarDisplayOptions).addTo(radarLayer); // Add to radarLayer

// Fetch and add earthquake data
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

// Function to determine marker color based on magnitude
function getColor(magnitude) {
    return magnitude > 6 ? 'magenta' :
           magnitude > 5 ? 'red' :
           magnitude > 4 ? 'orange' :
           magnitude > 3 ? 'yellow' :
           magnitude > 2 ? 'green' :
           magnitude > 1 ? 'teal' :
                           'lightblue';
}

// Toggle control
var overlayMaps = {
    "Weather Alerts": weatherAlertsLayer,
    "Earthquakes": earthquakeLayer,
    "Radar": radarLayer // Added radarLayer to the toggle
};

L.control.layers(null, overlayMaps, {collapsed: false}).addTo(map);
