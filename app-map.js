import dataLayers from './public/src/dataLayers';
dataLayers.listCollections();

import {jQuery as $} from 'jquery'

//import Bootstrap from 'bootstrap';
//Bootstrap.$ = $;
//Bootstrap.jQuery = jQuery;
//require('./public/src/init-bootstrap');

// Initalisation de la map Openlayers
//import olMap from './public/src/openlayers'
//olMap.initMap(13);
//olMap.initControls();

String.prototype.capitalizeFirstLetter = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
};

