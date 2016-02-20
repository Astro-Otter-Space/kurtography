//http://makerlog.org/posts/leaflet-basics/
/**
 * Appel des modules
 * @type {*|exports|module.exports}
 */


// Jquery + Bootstrap
var $ = require('jquery');
global.jQuery = $;
require('bootstrap');

var ol = require('openlayers');
global.ol = ol;
require('./node_modules/ol3-layerswitcher/src/ol3-layerswitcher');

require('geojson');

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
var mockGeoJSONVelos = {
    "type": "FeatureCollection",
    "features": [
        {
            "type": "Feature",
            "properties": {
                "guid": (new Date()).getTime() * Math.floor(1 + Math.random()*10000),
                "name": "Ballade à San Francisco"
            },
            "geometry": {
                "type": "LineString",
                "coordinates": [
                    [-122.48369693756104, 37.83381888486939],
                    [-122.48348236083984, 37.83317489144141],
                    [-122.48339653015138, 37.83270036637107],
                    [-122.48356819152832, 37.832056363179625],
                    [-122.48404026031496, 37.83114119107971],
                    [-122.48404026031496, 37.83049717427869],
                    [-122.48348236083984, 37.829920943955045],
                    [-122.48356819152832, 37.82954808664175],
                    [-122.48507022857666, 37.82944639795659],
                    [-122.48610019683838, 37.82880236636284],
                    [-122.48695850372314, 37.82931081282506],
                    [-122.48700141906738, 37.83080223556934],
                    [-122.48751640319824, 37.83168351665737],
                    [-122.48803138732912, 37.832158048267786],
                    [-122.48888969421387, 37.83297152392784],
                    [-122.48987674713133, 37.83263257682617],
                    [-122.49043464660643, 37.832937629287755],
                    [-122.49125003814696, 37.832429207817725],
                    [-122.49163627624512, 37.832564787218985],
                    [-122.49223709106445, 37.83337825839438],
                    [-122.49378204345702, 37.83368330777276]
                ]
            }
        },
        {
            "type": "Feature",
            "properties": {
                "guid": (new Date()).getTime() * Math.floor(1 + Math.random()*10000),
                "name": "Ballade Agropolis"
            },
            "geometry": {
                "type": "LineString",
                "coordinates": [
                    [3.8766369223594666, 43.610814638046364]
                ]
            }
        },
    ]
};
var mockWhereIsArnaud = {
    "type": "FeatureCollection",
    "features": [
        {
            "type": "Feature",
            "properties": {
                "guid": (new Date()).getTime() * Math.floor(1 + Math.random()*10000),
                "name": "Arnaud 1"
            },
            "geometry": {
                "type": "Point",
                "coordinates": [436256968, 39108042]
            }
        },
        {
            "type": "Feature",
            "properties": {
                "guid": (new Date()).getTime() * Math.floor(1 + Math.random()*10000),
                "name": "Arnaud 2"
            },
            "geometry": {
                "type": "Point",
                "coordinates": [436256944, 39108172]
            }
        },
        {
            "type": "Feature",
            "properties": {
                "guid": (new Date()).getTime() * Math.floor(1 + Math.random()*10000),
                "name": "Arnaud 3"
            },
            "geometry": {
                "type": "Point",
                "coordinates": [

                ]
            }
        },
        {
            "type": "Feature",
            "properties": {
                "guid": (new Date()).getTime() * Math.floor(1 + Math.random()*10000),
                "name": "Arnaud 4"
            },
            "geometry": {
                "type": "Point",
                "coordinates": [436256796, 39107696]
            }
        },
        {
            "type": "Feature",
            "properties": {
                "guid": (new Date()).getTime() * Math.floor(1 + Math.random()*10000),
                "name": "Arnaud 5"
            },
            "geometry": {
                "type": "Point",
                "coordinates": [436256721, 39107700]
            }
        },
        {
            "type": "Feature",
            "properties": {
                "guid": (new Date()).getTime() * Math.floor(1 + Math.random()*10000),
                "name": "Arnaud 6"
            },
            "geometry": {
                "type": "Point",
                "coordinates": [436256853, 39108035]
            }
        },{
            "type": "Feature",
            "properties": {
                "guid": (new Date()).getTime() * Math.floor(1 + Math.random()*10000),
                "name": "Arnaud 7"
            },
            "geometry": {
                "type": "Point",
                "coordinates": [436256931, 39107571]
            }
        }
    ]
};

var objMock = {"Where is my cat ?" : mockGeoJSONCat, "Mes balades à vélos" :  mockGeoJSONVelos/*, "Ou a été Arnaud ?" : mockWhereIsArnaud*/};

// Initalisation de la map Openlayers
var mapOl = require('./public/src/openlayers');

mapOl.initmap(objMock);
//mapOl.addLayersFromKuzzle(objMock);