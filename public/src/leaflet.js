/**
 * Created by stephane on 08/02/16.
 */

/**
 * initialize the map
 * @param L
 */
function initMap ()
{
    L.Icon.Default.imagePath = '/leaflet/dist/images/';
    var positions = getPosition();
    var zoom = 13;

    // Create base Layer
    var baseLayer = L.tileLayer('http://{s}.tile.osm.org/{z}/{x}/{y}.png', {
        maxZoom: 18,
        attribution: '&copy; <a href="http://osm.org/copyright">OpenStreetMap</a> contributors'
    });

    // Map initialisation
    this._map = L.map('map', {
        scrollWheelZoom: true,
        layers: [baseLayer]
    }).setView([positions.lat, positions.lon], zoom);

}


/**
 * List of layers enreg in Kuzzle
 * @returns {{Where is my cat ?}}
 */
function addLayersFromKuzzle(objMock)
{
    /**
     var kuzzleLayers = {
        Layer 1" :  L.geoJson(jsonDatas1, { onEachFeature: onEachFeature }),
        Layer 2" :  L.geoJson(jsonDatas2, { onEachFeature: onEachFeature }),
    };
     */
    var kuzzleLayers = {};
    for (key in objMock)
    {
        kuzzleLayers[key] = L.geoJson(objMock[key]);
    }

    L.control.layers(kuzzleLayers, null, {position: 'bottomright', collapsed: true}).addTo(this._map);

    this._map.on('baselayerchange', function (eventLayer) {
        console.log("Type : " + objMock[eventLayer.name]);
    });

    //drawFeatures(editableLayers);
}

/**
 * Defaults Control Drawing panel
 */
function drawingPanelDefault()
{

    var drawnItems = new L.FeatureGroup();
    this._map.addLayer(drawnItems);

    // Initialise the FeatureGroup to store editable layers
    var optionsDraw = {
        position: 'bottomright',
        draw : {
            polygon: false /*{
                shapeOptions: {
                    color: 'steelblue'
                },
                showArea: true,
            }*/,
            polyline: false /*{
                metric: true,
                shapeOptions: {
                    color: 'steelblue'
                },
            } */,
            marker: false /*{

            }*/,
            rectangle: false,
            circle: false
        },
        edit: {
            featureGroup: drawnItems,
            edit: false
        }
    };


    this.drawControl = new L.Control.Draw(optionsDraw);
    this._map.addControl(this.drawControl);

    drawnItems.eachLayer(function(layer) {
       console.log(layer.name);
    });
}


function setDrawingTools(layerType) {
    this._map.removeControl(this.drawControl);
}

var getShapeType = function(layer) {

    if (layer instanceof L.Circle) {
        return 'circle';
    }

    if (layer instanceof L.Marker) {
        return 'marker';
    }

    if ((layer instanceof L.Polyline) && ! (layer instanceof L.Polygon)) {
        return 'polyline';
    }

    if ((layer instanceof L.Polygon) && ! (layer instanceof L.Rectangle)) {
        return 'polygon';
    }

    if (layer instanceof L.Rectangle) {
        return 'rectangle';
    }

};


/**
 * Gestion du click sur un item de la couche
 * @param feature
 * @param layer
 */
function onEachFeature(feature, layer) {
    layer.on({
    });
    // does this feature have a property named popupContent?
    //if (feature.properties && feature.properties.name) {
    //    layer.on({
    //        click: mouseclickfunction
    //    })
    //}
}

/**
 * Au click sur le chat de la map, affichage de ses informations
 * @param e
 */
function mouseclickfunction(e)
{
    var properties = e.target.feature.properties;
}

/**
 * Retourne la position
 */
function getPosition()
{
    if(navigator.geolocation) {
        // L'API est disponible
        //navigator.geolocation.getCurrentPosition(function(position) {
            //return {"lon": position.coords.latitude, "lat" : position.coords.longitude};
        //});
        return {"lat" : "43.6109200", "lon": "3.8772300"};
    } else {
        // Pas de support, proposer une alternative ?
        return {"lat" : "48.866667", "lon": "2.333333"};
    }
}

exports.initmap = initMap;
exports.drawingPanelDefault = drawingPanelDefault;
exports.addLayersFromKuzzle = addLayersFromKuzzle;