//http://makerlog.org/posts/leaflet-basics/
/**
 * Appel des modules
 * @type {*|exports|module.exports}
 */
// Jquery + Bootstrap
var $ = require('jquery');
global.jQuery = $;
require('bootstrap');

// Kuzzle-sdk
var K = require('kuzzle-sdk');

// Leaflet
global.GeoJSON = require('geojson');
var L = require('leaflet');
var LD = require('leaflet-draw');

/**
 * Construction
 * @type {exports|module.exports}
 */
// Initialisation de Kuzzle
var kuzzle = require("./public/src/kuzzle");

// Initialisation de la map
var mapLf = require("./public/src/leaflet");
var map = mapLf.initmap();

// Ajout des données
mapLf.addDatas(map);