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

// Initalisation de la map Openlayers
var olMap = require('./public/src/openlayers');
var k = require('./public/src/kuzzle');


olMap.olMap.initMap(13, k.kuzzleManager);
olMap.olMap.initControls();
/**
 * Kuzzle
 * @type {exports|module.exports}
 */

//k.kuzzleManager.initKuzzle("kurtography", olMap.olMap);
//k.kuzzleManager.listCollections();

String.prototype.capitalizeFirstLetter = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
};

