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
        //this.kuzzleGroup = new ol.layer.Group({
        //    title: 'Kuzzle layers',
        //    layers: this.addLayersFromKuzzle()
        //});

        // Definition de la map
        this.map = new ol.Map({
            layers: [this.osm]/*, this.kuzzleGroup*/,
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
        this.addLayersFromKuzzle();

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
        ol.control.LayerSwitcher.forEachRecursive(this.map.getLayerGroup(), function(l, idx, a) {
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

            if (feature && this_.buttonsDrawControls.getFlagDraw() == false) {
                var fProperties = feature.getProperties();
                var extFeature = feature.getGeometry().getExtent();
                var centerFeature = ol.extent.getCenter(extFeature);

                this_.addPropertiesTab(fProperties);
                this_.addGeometriesTab(feature.getGeometry());
                document.getElementById("mainProperties").style.display="block";

                this_.overlay.setPosition(centerFeature);
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
        var this_ = this;

        this.kuzzle.listCollections(this.k.kuzzleManager.defaultIndex, { type: "stored" }, function (err, collections) {
            if(!err) {

                var olCollection = this_.olCollection = [];
                collections.stored.forEach(function(i, layer) {

                    // Retrieve data from each layer
                    this_.kuzzle.dataCollectionFactory(this_.k.kuzzleManager.defaultIndex, i).fetchAllDocuments(function (error, result) {
                            // result is an object containing the total number of documents
                            // and an array of KuzzleDocument objects
                        if (!err && result.total > 0) {
                            console.log("Nb features : " + result.total);
                            var kGeoJSON =  new ol.format.GeoJSON().readFeatures(result.documents, { featureProjection: this_.projectionFrom });

                            var kSource = new ol.source.Vector({ features: kGeoJSON, wrapX: false });

                            var kuzzleLayerVector = new ol.layer.Vector({
                                source: kSource,
                                title: i,
                                type: 'base',
                                visible: true,
                                style: function(feature, resolution) {
                                    return tabStyles[feature.getGeometry().getType()];
                                }
                            });
                            this_.olCollection.push(kuzzleLayerVector);
                        } else {
                            console.log(err.message);
                        }
                    });
                });

                var grpKuzzleLayers = new ol.layer.Group({ layers: this_.olCollection });
                this_.map.setLayerGroup([this_.map.getLayers(), grpKuzzleLayers]);
            } else {
                console.log(err.message);
            }
        });

        //var tabKuzzleLayers = this.tabKuzzleLayers = [];
        //for (key in this.mockDatas)
        //{
        //    var kuzzleGeoJSON = new ol.format.GeoJSON().readFeatures(this.mockDatas[key], {
        //        featureProjection: this.projectionFrom
        //    });
        //
        //    // Recuperation du geoJSON
        //    var kuzzleSourceVector = new ol.source.Vector({
        //        features: kuzzleGeoJSON,
        //        wrapX: false
        //    });
        //
        //    // Creation du layer
        //    var kuzzleLayerVector = new ol.layer.Vector({
        //        source: kuzzleSourceVector,
        //        title: key,
        //        type: 'base',
        //        visible: false,
        //        style: function(feature, resolution){
        //            return tabStyles[feature.getGeometry().getType()];
        //        }
        //    });
        //
        //    this.tabKuzzleLayers.push(kuzzleLayerVector);
        //}
        //return this.tabKuzzleLayers;
    },

    /**
     * Set datas from proporties in the popup
     * @param properties
     * @returns {Element}
     */
    addPropertiesTab: function(properties)
    {
        var tabP = document.getElementById('tabFProperties');
        if (tabP.childElementCount > 0) {
            while (tabP.firstChild) tabP.removeChild(tabP.firstChild);
        }

        // Delete geometry if exist
        if (properties.geometry) {
            delete properties.geometry;
        }

        var tbody = document.createElement('tbody');

        for (var key in properties) {
            if (typeof properties[key] != 'object' || properties[key] != undefined) {

                var tr = document.createElement('tr');

                var tdKey = document.createElement('td');
                tdKey.innerHTML = (typeof key == "string") ? key.capitalizeFirstLetter() : key;

                var tdValue = document.createElement('td');
                tdValue.innerHTML = (typeof properties[key] == "string") ? properties[key].capitalizeFirstLetter() : properties[key];

                tr.appendChild(tdKey);
                tr.appendChild(tdValue);
                tbody.appendChild(tr);
            }
        }
        tabP.appendChild(tbody);
        return tabP;
    },

    /**
     *
     * @param fGeometry
     */
    addGeometriesTab: function(fGeometry)
    {
        var tabG = document.getElementById('tabFGeometry');
        var tbody = document.createElement('tbody');

        if (tabG.childElementCount > 0) {
            while (tabG.firstChild) tabG.removeChild(tabG.firstChild);
        }

        switch (fGeometry.getType()) {
            case 'Point' :

                var coordinates = ol.proj.transform(fGeometry.getCoordinates(), 'EPSG:3857', 'EPSG:4326');

                var trLon = document.createElement('tr');
                var tdLonLabel = document.createElement('td'); tdLonLabel.innerHTML = 'Longitude';
                var tdLonValue = document.createElement('td'); tdLonValue.innerHTML = coordinates[0];

                trLon.appendChild(tdLonLabel);
                trLon.appendChild(tdLonValue);

                var trLat = document.createElement('tr');
                var tdLatLabel = document.createElement('td'); tdLatLabel.innerHTML = 'Lattitude';
                var tdLatValue = document.createElement('td'); tdLatValue.innerHTML = coordinates[1];

                trLat.appendChild(tdLatLabel);
                trLat.appendChild(tdLatValue);

                tbody.appendChild(trLon);
                tbody.appendChild(trLat);
                break;

            case 'LineString':
                var trLong = document.createElement('tr');
                var tdLongLabelM = document.createElement('td'); tdLongLabelM.innerHTML = 'Length';
                var tdLongValueM = document.createElement('td'); tdLongValueM.innerHTML = this.formatLength(fGeometry, true);

                trLong.appendChild(tdLongLabelM);
                trLong.appendChild(tdLongValueM);

                tbody.appendChild(trLong);
                break;

            case 'Polygon':
                var trSq = document.createElement('tr');
                var tdSqLabel = document.createElement('td'); tdSqLabel.innerHTML = 'Area';
                var tdSqValue = document.createElement('td'); tdSqValue.innerHTML = this.formatArea(fGeometry, false);

                trSq.appendChild(tdSqLabel);
                trSq.appendChild(tdSqValue);

                tbody.appendChild(trSq);
                break;
        }

        tabG.appendChild(tbody);
        return tabG;
    },

    /**
     * Calcul the lenth of LineString
     * Source : http://openlayers.org/en/v3.4.0/examples/measure.js
     * @param line
     * @param geodesic
     * @returns {*}
     */
    formatLength : function(line, geodesic) {
        var length;
        if (geodesic) {
            var coordinates = line.getCoordinates();
            length = 0;
            for (var i = 0, ii = coordinates.length - 1; i < ii; ++i) {
                var c1 = ol.proj.transform(coordinates[i], this.projectionFrom, this.projectionTo);
                var c2 = ol.proj.transform(coordinates[i + 1], this.projectionFrom, this.projectionTo);
                length += wgs84Sphere.haversineDistance(c1, c2);
            }
        } else {
            length = Math.round(line.getLength() * 100) / 100;
        }
        var output;
        if (length > 100) {
            output = (Math.round(length / 1000 * 100) / 100) +
                ' ' + 'km';
        } else {
            output = (Math.round(length * 100) / 100) +
                ' ' + 'm';
        }
        return output;
    },

    formatArea: function(polygon, geodesic) {
        var area;
        if (geodesic) {
            var geom = /** @type {ol.geom.Polygon} */(polygon.clone().transform(
                this.projectionFrom, this.projectionTo));
            var coordinates = geom.getLinearRing(0).getCoordinates();
            area = Math.abs(wgs84Sphere.geodesicArea(coordinates));
        } else {
            area = polygon.getArea();
        }
        var output;
        if (area > 10000) {
            output = (Math.round(area / 1000000 * 100) / 100) +
                ' ' + 'km<sup>2</sup>';
        } else {
            output = (Math.round(area * 100) / 100) +
                ' ' + 'm<sup>2</sup>';
        }
        return output;
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