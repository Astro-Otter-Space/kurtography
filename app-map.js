// Jquery + Bootstrap
//http://geojson.io/#map=13/43.6330/3.8585
var $ = require('jquery');
global.jQuery = $;
require('bootstrap');
require('./public/src/init-bootstrap');

//require('./node_modules/ol3-layerswitcher/src/ol3-layerswitcher');

require('./public/src/layerSwitcher');
require('./node_modules/ol3-drawButtons/src/js/ol3-controldrawbuttons');

// Initalisation de la map Openlayers
var olMap = require('./public/src/openlayers');
olMap.olMap.initMap(13);
olMap.olMap.initControls();

String.prototype.capitalizeFirstLetter = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
};

