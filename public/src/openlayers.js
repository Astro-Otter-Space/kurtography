/**
 * Initialisation de la map
 * @returns {ol.Map|*}
 */
var kMap = kMap || {};

kMap.olMap = {

    map: null,
    projectionFrom: 'EPSG:3857',
    projectionTo: 'EPSG:4326',
    osm: null,
    view: null,
    zoom: null,
    buttonsDrawControls: null,
    layerSwitcher: null,
    mockDatas: null,
    layer_test: null,
    elPopup: null,

    initMap: function(mockDatas, zoom)
    {
        var this_ = this;

        // Variables
        this.mockDatas = mockDatas;
        this.zoom = zoom;
        this.projectionFrom = kMap.olMap.projectionFrom;
        this.projectionTo = kMap.olMap.projectionTo;
        this.layer_test = kMap.olMap.layer_test;
        this.elPopup = document.getElementById('popup');

        // Recuperation du fond de carte OpenStreetMap
        this.osm = new ol.layer.Tile({
                title : 'OSM',
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

        // Definition de la map
        this.map = new ol.Map({
            layers: [this.osm, this.kuzzleGroup],
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

        // Ajout des boutons de dessins
        var optionsControlDraw = {
            "selectedLayer": this.getSelectedLayer(),
            "draw": {
                "Point": true,
                "LineString": true,
                "Square": true,
                "Circle": true,
                "Polygon": true
            }
        };
        this.buttonsDrawControls = new ol.control.DrawButtons(optionsControlDraw);
        this.map.addControl(this.buttonsDrawControls);

        // Ajout du LayerSwitcher
        this.layerSwitcher = new ol.control.LayerSwitcher({
            tipLabel: 'Légende' // Optional label for button
        });
        this.map.addControl(this.layerSwitcher);

        //var layers = document.getElementsByName('base');
        //for(var i = 0; i < layers.length; i++) {
        //    layers[i].addEventListener('change', function(input) {
        //        console.log("Selectionne : " + input.name);
        //    }, false);
        //}
        //
        //ol.control.LayerSwitcher.forEachRecursive(this.kuzzleGroup, function(l, idx, a) {
        //    //console.log("Name : " + l.getName());
        //    console.log("Visible : " + l.get('visible'));
        //});

        // Ajout popup + listener
        this.map.addOverlay(this.addPopup());
        this.map.on('click', function(evt) {
            var feature = this_.map.forEachFeatureAtPixel(evt.pixel,
                function(feature, layer) {
                    return feature;
                }
            );

            if (feature) {
                var geometry = feature.getGeometry();
                var coord = geometry.getCoordinates();

                console.log(coord);
                //this_.addPopup().setPosition(coord);
                //this_.elPopup.popover({
                //    'placement': 'top',
                //    'html': true,
                //    'content': feature.get('properties.name')
                //});
                //this_.elPopup.popover('show');
            } else {
                //this_.elPopup.popover('destroy');
            }
        });

    },

    /**
     * Ajout des layers from Kuzzle
     */
    addLayersFromKuzzle: function() {
        var tabStyles = this.getStylesFeatures();
        var tabKuzzleLayers = [];

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
            // TEST
            if (key == "Where is my cat ?") {
                this.layer_test = kuzzleLayerVector;
            }
            // Fin test
            tabKuzzleLayers.push(kuzzleLayerVector);
        }
        return tabKuzzleLayers;
    },


    addPopup: function()
    {
        var popup = new ol.Overlay({
            element: this.elPopup,
            positioning: 'bottom-center',
            stopEvent: false
        });
        return popup;
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
                    color: new ol.style.Fill({ color: [254,170,1,1] }),
                    width: 3
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

    getSelectedLayer: function ()
    {
        return this.layer_test;
    }
};



/**
 * Ajout des données
 * @param mockDatas
 * http://cgit.drupalcode.org/openlayers/tree/modules/openlayers_geofield/src/Plugin/Component/GeofieldWidget/js/GeofieldWidget.js
 */
exports.map = kMap.olMap;
exports.selectedLayer = kMap.olMap.getSelectedLayer;