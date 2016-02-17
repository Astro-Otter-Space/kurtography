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
require('geojson');
var L = require('leaflet');
var LD = require('leaflet-draw');
require('leaflet-easybutton');

/**
 * Construction
 * @type {exports|module.exports}
 */

// Initialisation de la map
var mapLf = require("./public/src/leaflet");
mapLf.initmap();

// Ajout des données
mapLf.addLayersFromKuzzle();