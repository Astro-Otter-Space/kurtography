//http://makerlog.org/posts/leaflet-basics/
/**
 * Appel des modules
 * @type {*|exports|module.exports}
 */
// Jquery + Bootstrap
var $ = require('jquery');
global.jQuery = $;
require('bootstrap');

// Leaflet
require('geojson');
var L = require('leaflet');
var LD = require('leaflet-draw');
require('leaflet-easybutton');

/**
 * Construction
 * @type {exports|module.exports}
 */

var mockGeoJSONCat = {
    "type": "FeatureCollection",
    "features": [
        {
            "type": "Feature",
            "properties": {
                "guid": (new Date()).getTime() * Math.floor(1 + Math.random()*10000),
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
                "guid": (new Date()).getTime() * Math.floor(1 + Math.random()*10000),
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
                "guid": (new Date()).getTime() * Math.floor(1 + Math.random()*10000),
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
                "guid": (new Date()).getTime() * Math.floor(1 + Math.random()*10000),
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
                "guid": (new Date()).getTime() * Math.floor(1 + Math.random()*10000),
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
                "guid": (new Date()).getTime() * Math.floor(1 + Math.random()*10000),
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

var objMock = {"Where is my cat ?" : mockGeoJSONCat };

// Initialisation de la map
var mapLf = require("./public/src/leaflet");
mapLf.initmap();
// Ajout des données
mapLf.addLayersFromKuzzle(objMock);
mapLf.drawFeatures();

