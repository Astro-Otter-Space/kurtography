/**
 * Initialisation de la map
 * @returns {ol.Map|*}
 */
var olMap = {

    map: null,
    projectionFrom: 'EPSG:3857',
    projectionTo: 'EPSG:4326',
    osm: null,
    view: null,
    zoom: null,
    buttonsDrawControls: null,
    layerSwitcher: null,
    k:null,
    kuzzle:null,
    mockDatas: null,
    selectedLayer: null,
    overlay: null,
    elPopup: null,

    initMap: function(mockDatas, zoom)
    {
        var this_ = this;

        // Kuzzle
        this.k = require('./kuzzle');
        this.kuzzle = this.k.kuzzleManager.initKuzzle("kurtography");

        // Variables
        this.mockDatas = mockDatas;
        this.zoom = zoom;
        this.projectionFrom = olMap.projectionFrom;
        this.projectionTo = olMap.projectionTo;

        // Recuperation du fond de carte OpenStreetMap
        this.osm = new ol.layer.Tile({
                title : 'Open Street Map',
                visible : true,
                type: 'overlays',
                source: new ol.source.OSM()
            }
        );

        // Definition de la vue
        this.view = new ol.View({
            zoom: this.zoom
        });

        // Layers from kuzzle
        this.kuzzleGroup = new ol.layer.Group({
            title: 'Kuzzle layers',
            layers: this.addLayersFromKuzzle()
        });

        // Definition de l overlay Popup
        this.overlay = new ol.Overlay(/** @type {olx.OverlayOptions} */ {
            element: document.getElementById('popup')
        });

        // Definition de la map
        this.map = new ol.Map({
            layers: [this.osm, this.kuzzleGroup],
            overlays: [this.overlay],
            target: 'map',
            controls: ol.control.defaults({
                attributionOptions: ({
                    collapsible: false
                })
            }).extend([
                new ol.control.Rotate(),
                new ol.control.ScaleLine(),
                new ol.control.MousePosition({
                    coordinateFormat:  function(coordinate) {
                        return ol.coordinate.format(coordinate, 'LonLat : {y}, {x}', 4);
                    },
                    projection: this.projectionTo,
                })
            ]),
            view: this.view
        });

        // Centrage sur la carte en recuperant la position
        this.geolocation = new ol.Geolocation({
            projection: ol.proj.get(this.projectionTo),
            tracking: true
        });

        this.geolocation.on('change', function() {
            var lon = this_.geolocation.getPosition()[0];
            var lat =  this_.geolocation.getPosition()[1];
            var pointCenter = new ol.geom.Point([lon, lat]).transform('EPSG:4326', 'EPSG:3857').getCoordinates();
            this_.view.setCenter(pointCenter);
        });

        // Adding LayerSwitcher
        this.layerSwitcher = new ol.control.LayerSwitcher({
            tipLabel: 'Légende' // Optional label for button
        });

        this.map.addControl(this.layerSwitcher);

        // Adding draw controls
        var optionsControlDraw = {
            "popup_form" : true,
            "style_buttons" : "default", // (undefined !== typeof style_buttons)? "glyphicon" : "default",
            "draw": {
                "Point": true,
                "LineString": true,
                "Square": true,
                "Circle": true,
                "Polygon": true
            }
        };
        this.buttonsDrawControls = new ol.control.DrawButtons(this.getSelectedLayer(), optionsControlDraw);

        // Detection of selected layer
        ol.control.LayerSwitcher.forEachRecursive(this.kuzzleGroup, function(l, idx, a) {
            l.on("change:visible", function(e) {
                var lyr = e.target;
                if (lyr.getVisible() == true) {
                    // Not sure if correct but it's working :|
                    this_.setSelectedLayer(lyr);
                    this_.buttonsDrawControls.setSelectedLayer(lyr);
                }
            });
        });
        this.map.addControl(this.buttonsDrawControls);

        // Add popup + listener
        this.map.on('click', function(evt) {
            var feature = this_.map.forEachFeatureAtPixel(evt.pixel,
                function(feature, layer) {
                    return feature;
                }
            );

            //var element = this_.overlay.getElement();
            //jQuery(element).popover('destroy');
            if (feature && this_.buttonsDrawControls.getFlagDraw() == false) {

                console.log("Click feature " + fProperties.get('name'));

                var fProperties = feature.getProperties();
                var extFeature = feature.getGeometry().getExtent();
                var centerFeature = ol.extent.getCenter(extFeature);

                //jQuery(element).popover('destroy');
                this_.overlay.setPosition(centerFeature);

                //jQuery(element).popover({
                //    'placement': 'top',
                //    'animation': false,
                //    'html': true,
                //    'content': this_.addPropertiesToPopup(fProperties)
                //});
                //jQuery(element).popover('show');

                this_.view.setCenter(centerFeature);
            }
        });
    },

    /**
     * Add layers from kuzzle
     */
    addLayersFromKuzzle: function()
    {
        var tabStyles = this.getStylesFeatures();
        var tabKuzzleLayers = this.tabKuzzleLayers = [];
        //var this_ = this;

        //this.kuzzle.listCollections(this.k.kuzzleManager.defaultIndex, { type: "stored" }, function (err, collections) {
        //    if(!err) {
        //        collections.stored.forEach(function(i, layer) {
        //
        //            var kuzzleLayerVector = new ol.layer.Vector({
        //                source: new ol.source.Vector(),
        //                title: i,
        //                type: 'base',
        //                visible: false
        //            });
        //            this_.tabKuzzleLayers.push(kuzzleLayerVector);
        //        });
        //
        //    } else {
        //        console.log(err.message);
        //    }
        //});
        //console.log(kuzzleCollections);

        for (key in this.mockDatas)
        {
            var kuzzleGeoJSON = new ol.format.GeoJSON().readFeatures(this.mockDatas[key], {
                featureProjection: this.projectionFrom
            });

            // Recuperation du geoJSON
            var kuzzleSourceVector = new ol.source.Vector({
                features: kuzzleGeoJSON,
                wrapX: false
            });

            // Creation du layer
            var kuzzleLayerVector = new ol.layer.Vector({
                source: kuzzleSourceVector,
                title: key,
                type: 'base',
                visible: false,
                style: function(feature, resolution){
                    return tabStyles[feature.getGeometry().getType()];
                }
            });

            this.tabKuzzleLayers.push(kuzzleLayerVector);
        }
        return this.tabKuzzleLayers;
    },

    /**
     * Set datas from proporties in the popup
     * @param properties
     * @returns {Element}
     */
    addPropertiesToPopup: function(properties)
    {

        var tab = document.createElement('table');
        tab.className = 'table table-striped';

        // Delete geometry if exist
        if (properties.geometry) {
            delete properties.geometry;
        }

        for (var key in properties) {
            if (typeof properties[key] != 'object' || properties[key] != undefined) {

                var tr = document.createElement('tr');

                var tdKey = document.createElement('td');
                tdKey.innerHTML = (typeof key == "string") ? key.capitalizeFirstLetter() : key;

                var tdValue = document.createElement('td');
                tdValue.innerHTML = (typeof properties[key] == "string") ? properties[key].capitalizeFirstLetter() : properties[key];

                tr.appendChild(tdKey);
                tr.appendChild(tdValue);
                tab.appendChild(tr);
            }
        }
        return tab;
    },

    /**
     * Set le style des objets geographiques
     */
    getStylesFeatures: function()
    {
        var styles = {

            'Point': [new ol.style.Style({
                image: new ol.style.Circle({
                    fill: new ol.style.Fill({ color: [254,170,1,1] }), // interieur
                    stroke: new ol.style.Stroke({ color: [255,102,0,1] }), // bordure
                    radius: 5
                })
            })],

            'LineString': [new ol.style.Style({
                stroke: new ol.style.Stroke({
                    color: [254,170,1,1],
                    width: 4
                })
            })],

            'Polygon': [new ol.style.Style({
                fill: new ol.style.Fill({
                    color : [254,170,1,0.4]
                }),
                stroke: new ol.style.Stroke({
                    color: [255,102,0,1],
                    width: 2
                })
            })],

            'Circle': [new ol.style.Style({
                fill: new ol.style.Fill({
                    color: [254,170,1,0.4]
                }),
                stroke: new ol.style.Stroke({
                    color: [255,102,0, 1],
                    width: 3
                })
            })]
        };

        return styles;
    },

    // Retourne la couche selectionnée
    getSelectedLayer: function ()
    {
        return this.selectedLayer;
    },

    // Set la couche selectionnée
    setSelectedLayer: function (layer)
    {
        this.selectedLayer = layer;
    }
};
//
exports.olMap = olMap;
//exports.selectedLayer = kMap.olMap.getSelectedLayer;


/**
 * Created by stephane on 21/02/16.
 * http://cgit.drupalcode.org/openlayers/tree/modules/openlayers_geofield/src/Plugin/Component/GeofieldWidget/js/GeofieldWidget.js
 * http://cgit.drupalcode.org/openlayers/tree/modules/openlayers_geofield/src/Plugin/Control/Geofield/js/geofieldControl.js
 */