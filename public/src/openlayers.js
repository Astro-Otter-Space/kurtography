import Projection from '../services/projections'
import dataLayers from './dataLayers';
import ol from 'openlayers';
import LayerSwitcher from './layerSwitcher'
import ControlDrawButtons from './ol3-controldrawbuttons'

/**
 * Initialisation de la map
 * @returns {ol.Map|*}
 */
export default {

    state: {
        map: null,
        tabLayersKuzzle: [],
        projectionFrom: Projection.projectionFrom,
        projectionTo: Projection.projectionTo,
        osm: null,
        zoneSubscriptionLayer: null,
        view: null,
        zoom: null,
        buttonsDrawControls: null,
        layerSwitcher: null,
        groupKuzzleLayers:null,
        selectedLayer: null,
        tabStyles: null
    },

    /**
     *
     * @param zoom
     */
    initMap(zoom)
    {
        var this_ = this;
        this.state.zoom = zoom;
        this.state.tabStyles = this.getStylesFeatures();

        // Recuperation du fond de carte OpenStreetMap
        this.state.osm = new ol.layer.Tile({
                title : 'Open Street Map',
                visible : true,
                type: 'overlays',
                source: new ol.source.OSM()
            }
        );

        // Definition de la vue
        this.state.view = new ol.View({
            zoom: this.state.zoom
        });

        // Put layers in ol.layer.Group
        if (dataLayers.state.collections.length > 0) {
            this.state.tabLayersKuzzle = dataLayers.state.collections.map(layer => {

                return new ol.layer.Vector({
                    title: layer,
                    type: 'base',
                    visible: false,
                    style: function (feature, resolution) {
                        return this_.state.tabStyles[feature.getGeometry().getType()];
                    }
                });
            });

            // Create a group layer for Kuzzle layers
            this.state.groupKuzzleLayers = new ol.layer.Group({
                title: "Kuzzle group",
                layers: this.state.tabLayersKuzzle
            });
        }


        // Definition de la map
        this.state.map = new ol.Map({
            layers: [this.state.osm, this.state.groupKuzzleLayers],
            target: 'map',
            controls: ol.control.defaults({
                attributionOptions: ({
                    collapsible: false
                })
            }).extend([
                new ol.control.ScaleLine(), // Scale
                new ol.control.Zoom(), // Zoom
                //new ol.control.ZoomSlider(), // Zoom slide
                //new ol.control.OverviewMap(), // Overviewmap
                // get coordinates of mouse position
                new ol.control.MousePosition({
                    coordinateFormat:  function(coordinate) {
                        return ol.coordinate.format(coordinate, 'Lat : {y} / Long : {x}', 4);
                    },
                    projection: this.state.projectionTo
                })
            ]),
            view: this.state.view
        });


        // Centrage sur la carte en recuperant la position
        this.geolocation = new ol.Geolocation({
            projection: ol.proj.get(this.state.projectionTo),
            tracking: true
        });

        // Get change on geolocation (mobile use only)
        this.geolocation.on('change', function() {
            var lon = this_.geolocation.getPosition()[0];
            var lat =  this_.geolocation.getPosition()[1];
            var pointCenter = new ol.geom.Point([lon, lat]).transform(this_.state.projectionTo, this_.state.projectionFrom).getCoordinates();
            this_.state.view.setCenter(pointCenter);
        });


        // Show feature data + listener
        this.state.map.on('click', function(evt) {
            var feature = this_.state.map.forEachFeatureAtPixel(evt.pixel,
                function(feature, layer) {
                    return feature;
                }
            );

            if (feature && this_.state.buttonsDrawControls.getFlagDraw() == false) {

                console.log(feature);

                var fProperties = feature.getProperties();
                var extFeature = feature.getGeometry().getExtent();
                var centerFeature = ol.extent.getCenter(extFeature);

                this_.addPropertiesTab(fProperties);
                this_.addGeometriesTab(feature.getGeometry());
                document.getElementById("mainProperties").style.display="block";

                this_.state.view.setCenter(centerFeature);
            }
        });

        this.initControls();
    },


    /**
     * Add controls to map
     */
    initControls()
    {
        var this_ = this;

        // Adding Layer switcher
        this.state.layerSwitcher = new ol.control.LayerSwitcher();
        this.state.map.addControl(this.state.layerSwitcher);

        // Adding draw controls
        var optionsControlDraw = {
            "style_buttons" : null,
            "draw": {
                "Point": true,
                "LineString": true,
                "Square": true,
                "Circle": false,
                "Polygon": true
            }
        };
        this.state.buttonsDrawControls = new ol.control.ControlDrawButtons(this.getSelectedLayer(), optionsControlDraw);

        // Detection of selected layer
        ol.control.LayerSwitcher.forEachRecursive(this.state.map.getLayerGroup(), function(l, idx, a) {
            l.on("change:visible", function(e) {
                var lyr = e.target;
                if (lyr.getVisible() == true) {
                    this_.setSelectedLayer(lyr);

                    // Subscribe and Retrieve datas
                    if (undefined != this_.state.zoneSubscriptionLayer || null != this_.state.zoneSubscriptionLayer) {
                        this_.state.map.removeLayer(this_.state.zoneSubscriptionLayer);
                    }
                    dataLayers.subscribeCollection(lyr, this_.geolocation.getPosition(), 5, 'km');
                    dataLayers.loadDatasFromCollection(lyr.get('title'));

                    // Mapping
                    dataLayers.getPropertiesMapping(lyr.get('title'));

                    // Not sure if correct but it's working :|
                    this_.state.buttonsDrawControls.setSelectedLayer(lyr);
                }
            });
        });
        this.state.map.addControl(this.state.buttonsDrawControls);
    },


    /**
     * Create a zone where kuzzle subscription is active
     * @param distance
     */
    createZoneSubscription(distance)
    {
        var coordonatesWGS84 = this.geolocation.getPosition()

        var features = [];
        var coordinatesTr = ol.proj.transform([coordonatesWGS84[0], coordonatesWGS84[1]], this.state.projectionTo, this.state.projectionFrom);
        var circle = new ol.geom.Circle([coordinatesTr[0], coordinatesTr[1]], distance);

        features.push(new ol.Feature({
            geometry: circle
        }));
        var vectorSource = new ol.source.Vector({
            features: features
        });

        var color = '#' + '0123456789abcdef'.split('').map(function(v,i,a){
            return i>5 ? null : a[Math.floor(Math.random()*16)] }).join('');
        this.state.zoneSubscriptionLayer = new ol.layer.Vector({
            source: vectorSource,
            title: "Subscribe zone",
            visible: true,
            style: [
                new ol.style.Style({
                    stroke: new ol.style.Stroke({
                        color: color,
                        width: 2
                    })
                })]
        });
        this.state.zoneSubscriptionLayer.setZIndex(10);
        this.state.map.addLayer(this.state.zoneSubscriptionLayer);
    },

    /**
     * Set datas from proporties in the popup
     * @param properties
     * @returns {Element}
     */
    addPropertiesTab(properties)
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
    addGeometriesTab(fGeometry)
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
    formatLength(line, geodesic) {
        var length;
        var wgs84Sphere = new ol.Sphere(6378137);
        if (geodesic) {
            var coordinates = line.getCoordinates();
            length = 0;
            for (var i = 0, ii = coordinates.length - 1; i < ii; ++i) {
                var c1 = ol.proj.transform(coordinates[i], this.state.projectionFrom, this.state.projectionTo);
                var c2 = ol.proj.transform(coordinates[i + 1], this.state.projectionFrom, this.state.projectionTo);
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

    formatArea(polygon, geodesic) {
        var area;
        if (geodesic) {
            var geom = /** @type {ol.geom.Polygon} */(polygon.clone().transform(
                this.state.projectionFrom, this.state.projectionTo));
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
    getStylesFeatures()
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
    getSelectedLayer()
    {
        return this.state.selectedLayer;
    },

    // Set la couche selectionnée
    setSelectedLayer(layer)
    {
        this.state.selectedLayer = layer;
    }
};