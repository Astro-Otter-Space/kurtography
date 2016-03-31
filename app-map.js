// Jquery + Bootstrap
//http://geojson.io/#map=13/43.6330/3.8585
var $ = require('jquery');
global.jQuery = $;
require('bootstrap');
require('./public/src/init-bootstrap');

// Kuzzle-Sdk
require('kuzzle-sdk');

// Openlayers
var ol = require('openlayers');
global.ol = ol;
//require('./node_modules/ol3-layerswitcher/src/ol3-layerswitcher');

require('./public/src/layerSwitcher');
require('./node_modules/ol3-drawButtons/src/js/ol3-controldrawbuttons');

var mockGeoJSONCat = {
    "type": "FeatureCollection",
    "features": [
        {
            "type": "Feature",
            "properties": {
                "name": "Lazerboom",
                "age" : "4",
                "genre": "male",
                "tattoo": "Non",
                "puce" : "Non",
                "race": "Chat de goutiere",
                "colors": "Gris",
                "weight": "8.5kg",
                "other" : "Un peu bête"
            },
            "geometry": {
                "type": "Point",
                "coordinates": [3.8766369223594666, 43.610814638046364]
            }
        },
        {
            "type": "Feature",
            "properties": {
                "name": "Bazookat",
                "age" : "4",
                "genre": "male",
                "tattoo": "",
                "puce" : "",
                "race": "",
                "colors": "roux et blanc",
                "weight": "6",
                "other" : "Très peureux"
            },
            "geometry": {
                "type": "Point",
                "coordinates": [3.8927556574344635, 43.60116585356501]
            }
        },
        {
            "type": "Feature",
            "properties": {
                "name": "Globule",
                "age" : "",
                "genre": "female",
                "tattoo": "",
                "puce" : "",
                "race": "",
                "colors": "Grise et blanche",
                "weight": "4.2",
                "other" : "Yeux bleu"
            },
            "geometry": {
                "type": "Point",
                "coordinates": [3.8272064924240112, 43.63473958501086]
            }
        },
        {
            "type": "Feature",
            "properties": {
                "name": "Isidore",
                "age" : "",
                "genre": "male",
                "tattoo": "",
                "puce" : "",
                "race": "",
                "colors": "noir et blanc",
                "weight": "",
                "other" : "Il mord"
            },
            "geometry": {
                "type": "Point",
                "coordinates": [3.9002135396003723, 43.63078647624538]
            }
        },
        {
            "type": "Feature",
            "properties": {
                "name": "Kiwi",
                "age" : "",
                "genre": "male",
                "tattoo": "",
                "puce" : "",
                "race": "",
                "colors": "noir",
                "weight": "",
                "other" : "Lunatique"
            },
            "geometry": {
                "type": "Point",
                "coordinates": [3.8289445638656616, 43.61617052139826]
            }
        },
        {
            "type": "Feature",
            "properties": {
                "name": "Kafi",
                "age" : "",
                "genre": "femelle",
                "tattoo": "",
                "puce" : "",
                "race": "",
                "colors": "",
                "weight": "",
                "other" : ""
            },
            "geometry": {
                "type": "Point",
                "coordinates": [3.8291913270950317, 43.615595728630446]
            }
        }
    ]
};
var objMock = {"Where is my cat ?" : mockGeoJSONCat};

// Initalisation de la map Openlayers
var olMap = require('./public/src/openlayers');
olMap.olMap.initMap(objMock, 13);


/**
 * Kuzzle
 * @type {exports|module.exports}
 */
var k = require('./public/src/kuzzle');
k.kuzzleManager.initKuzzle("kurtography");

// TEST
console.log("Ajout données kuzzle");
var vectorTest = new ol.layer.Vector({
    source: new ol.source.Vector(),
    type: 'base',
    title: 'Test Kuzzle mock',
    visible: false
});

var groupLayerTest = new ol.layer.Group({
    title: 'Kuzzle layers',
    layers: vectorTest
});
olMap.olMap.map.addLayer(vectorTest);
olMap.olMap.layerSwitcher.renderPanel();


String.prototype.capitalizeFirstLetter = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
};

