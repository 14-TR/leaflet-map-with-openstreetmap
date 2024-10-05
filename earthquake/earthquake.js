var map = L.map('earthquakemap').setView([38, -95], 4);

var basemapUrl = 'https://tiles.stadiamaps.com/tiles/alidade_smooth_dark/{z}/{x}/{y}{r}.{ext}';
var basemap = L.tileLayer(basemapUrl, {
    minZoom: 0,
    maxZoom: 20,
    attribution: '&copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a> &copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    ext: 'png'
}).addTo(map); 


function getColor(magnitude) {
    return magnitude > 6 ? 'magenta' :
           magnitude > 5 ? 'red' :
           magnitude > 4 ? 'orange' :
           magnitude > 3 ? 'yellow' :
           magnitude > 2 ? 'green' :
           magnitude > 1 ? 'teal' :
                           'lightblue'; 
}


function getRadius(magnitude) {
    return magnitude * 3;
}


var earthquakeUrl = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson';
$.getJSON(earthquakeUrl, function(data) {
    L.geoJSON(data, {
        pointToLayer: function(feature, latlng) {
            return L.circleMarker(latlng, {
                radius: getRadius(feature.properties.mag),
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
    }).addTo(map);
});

var legend = L.control({ position: 'bottomright' });
legend.onAdd = function(map) {
    var div = L.DomUtil.create('div', 'legend'),
        magnitudes = [0, 2, 3, 4, 5, 6],
        labels = [];
    div.innerHTML += '<strong>Magnitude</strong><br>';
    for (var i = 0; i < magnitudes.length; i++) {
        div.innerHTML +=
            '<i style="background:' + getColor(magnitudes[i] + 1) + '"></i> ' +
            magnitudes[i] + (magnitudes[i + 1] ? '&ndash;' + magnitudes[i + 1] + '<br>' : '+');
    }
    return div;
};
legend.addTo(map);
