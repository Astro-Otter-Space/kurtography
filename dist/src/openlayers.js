import Projection from '../services/geo-parameters'
import notification from '../services/notification';
import dataLayers from './dataLayers';
import ol from 'openlayers';
// Openlayers controls
import LayerSwitcher from './layerSwitcher'
import ControlDrawButtons from './ol3-controldrawbuttons'
import ZoomControl from './ol3-zoomuibuttons';
import SetPosition from './ol3-resetposition';
import RedrawSubscribeZone from './ol3-editsubscribezone';
import RealTimeTracking from './ol3-realTimeTracking';
// Openlayers 3 add-ons
import turfInside from 'turf-inside';
import turfCentroid from 'turf-centroid';

/**
 * Initialisation de la map
 * @returns {ol.Map|*}
 */
export default {

    state: {
        map: null,
        osm: null,
        view: null,
        zoom: null,
        tabLayersKuzzle: [],
        groupKuzzleLayers:null,
        projectionFrom: Projection.projectionFrom,
        projectionTo: Projection.projectionTo,
        coordinates: [],
        selectedLayer: null,
        distance: 5000,
        zoneSubscriptionLayer: null,
        buttonsDrawControls: null,
        realTimeTracking: null,
        layerSwitcher: null,
        markerSource: null,
        tabStyles: null,
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
                new ol.control.ZoomUiButtons(), // Zoom
                new ol.control.MousePosition({
                    coordinateFormat:  function(coordinate) {
                        return ol.coordinate.format(coordinate, 'Lat : {y} / Long : {x}', 4);
                    },
                    projection: this.state.projectionTo
                })
            ]),
            view: this.state.view
        });


        // If user block geolocation, set to default location
        var lonDef = Projection.longDefault;
        var latDef = Projection.latDefault;

        // Retrieve geolocation with default values
        this.geolocation = new ol.Geolocation({
            projection: ol.proj.get(this.state.projectionTo),
            tracking: true
        });

        this.geolocation.set('position', [Projection.longDefault, Projection.latDefault]);
        this.state.coordinates = [lonDef, latDef];
        this.initPosition(lonDef, latDef);

        // If user blocking geolocalisation, set on default point and set default point as geolocation
        this.geolocation.on('error', function(error){
            this_.state.acceptGeoloc = false;
            notification.init({
                type: 'warning',
                message : 'Will you accept geolocation :) ?'
            });
        });

        // Get change on geolocation (mobile use only)
        // TODO : verify if on mobile, changing position is detected
        document.addEventListener("DOMContentLoaded", function(event) {
            if(false != this_.state.acceptGeoloc) {
                this.geolocation.on('change', function() {
                    console.log("detection changement");

                    var lon = this_.geolocation.getPosition()[0];
                    var lat =  this_.geolocation.getPosition()[1];
                    this_.initPosition(lon, lat);

                    if (undefined != this_.getSelectedLayer) {
                        this_.createZoneSubscription(this_.state.distance);
                    }
                });
            }
        });

        // Get change on geolocation (mobile use only)
        this.geolocation.on('change:position', function() {
            console.log("detection changement position");
            var lon = this.getPosition()[0];
            var lat =  this.getPosition()[1];
            // Set of current coordonates
            this_.state.coordinates = [lon, lat];
            this_.initPosition(lon, lat);

            if (undefined != this.getSelectedLayer) {
                this_.createZoneSubscription(this_.state.distance);
            }
        });


        // Show feature data + listener
        this.state.map.on('click', function(evt) {
            var feature = this_.state.map.forEachFeatureAtPixel(evt.pixel,
                function(feature, layer) {
                    return feature;
                }
            );
            if (undefined != feature && undefined != feature.getId() && this_.state.buttonsDrawControls.getFlagDraw() == false) {
                this_.showFeaturesInformations(feature, true);
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

        /**
         * @type {initControls.handleChangeUnity}
         */
        var handleChangeScale = this.handleChangeScale = function(e) {

            var min = parseInt(this.dataset.min);
            var max = parseInt(this.dataset.max);
            var factorScale = parseInt(this.value);
            var zoom = parseInt(this.dataset.zoom);

            if (undefined != this_.state.zoneSubscriptionLayer) {

                var inputZoneRadius = document.getElementById('zoneRadius');
                var distanceUpdate = max/2; // we set to the middle

                inputZoneRadius.setAttribute("min", min);
                inputZoneRadius.setAttribute("max", max);
                inputZoneRadius.value = distanceUpdate;

            //    var newDistance = ('km' == this_.state.unity) ? distance * 1000 : distance;
                var lblDistance = (10000 > distanceUpdate)? distanceUpdate + ' m' : (distanceUpdate/1000) + ' km';
                this_.state.distance = parseInt(distanceUpdate);

                this_.state.map.removeLayer(this_.state.zoneSubscriptionLayer);
                this_.createZoneSubscription(this_.state.distance);

                this_.state.map.getView().setZoom(zoom);

                document.getElementById('valueDistance').innerHTML = lblDistance;
            }
        };
        /**
         *
         * @type {initControls.handleChangeDistance}
         */
        var handleChangeDistance = this.handleChangeDistance = function(e) {
            e.preventDefault();

            // If chane, remove and rebuild the subscribe zone
            if (undefined != this_.state.zoneSubscriptionLayer) {
                var distance = e.target.value;

            //    var newDistance = ('km' == this_.state.unity) ? distance * 1000 : distance;
            //    var lblDistance = distance + ' ' + this_.state.unity;
            //
                this_.state.distance = parseInt(distance);
                var lblDistance = (10000 > distance)? distance + ' m' : (distance/1000) + ' km';
                this_.state.map.removeLayer(this_.state.zoneSubscriptionLayer);
                this_.createZoneSubscription(this_.state.distance);

                document.getElementById('valueDistance').innerHTML = lblDistance;
            }
        };

        var scaleList = document.getElementsByName('scale');
        Array.filter(scaleList, radio => {
            radio.addEventListener('change', this.handleChangeScale, false);
        });
        document.getElementById('zoneRadius').addEventListener('change', this.handleChangeDistance, false);

        // Adding draw controls
        var optionsControlDraw = {
            "style_buttons" : "mdlIcons",
            "draw": {
                "Point": true,
                "LineString": true,
                "Square": true,
                "Circle": false,
                "Polygon": true
            }
        };
        this.state.buttonsDrawControls = new ol.control.ControlDrawButtons(this.getSelectedLayer(), optionsControlDraw);

        // RealTime Tracking
        if(false != this.state.acceptGeoloc) {
            var realTimeTracking = this.state.realTimeTracking = new ol.control.RealTimeTracking(this.getSelectedLayer());
            this.state.map.addControl(realTimeTracking);
        }
        // Detection of selected layer
        ol.control.LayerSwitcher.forEachRecursive(this.state.map.getLayerGroup(), function(l, idx, a) {
            l.on("change:visible", function(e) {
                var lyr = e.target;

                if (lyr.getVisible() == true) {
                    this_.setSelectedLayer(lyr);

                    document.getElementById("redraw_zone").removeAttribute('disabled');

                    // Subscribe and Retrieve datas
                    if (undefined != this_.state.zoneSubscriptionLayer || null != this_.state.zoneSubscriptionLayer) {
                        this_.state.map.removeLayer(this_.state.zoneSubscriptionLayer);
                    }
                    // Creation couche zone subscribe
                    this_.createZoneSubscription(this_.state.distance);
                    Array.filter(scaleList, radio => {
                        radio.disabled = false;
                    });
                    document.getElementById('zoneRadius').disabled = false;

                    // Load datas and Mapping
                    dataLayers.loadDatasFromCollection(lyr.get('title'));
                    dataLayers.getPropertiesMapping(lyr.get('title'));

                    // Not sure if correct but it's working :|
                    this_.state.buttonsDrawControls.setSelectedLayer(lyr);
                    if(false != this_.state.acceptGeoloc) {
                        this_.state.realTimeTracking.setSelectedLayer(lyr);
                    }

                    // Enabled control draw buttons
                    document.getElementById("Point").disabled = false;
                    document.getElementById("LineString").disabled = false;
                    document.getElementById("Square").disabled = false;
                    document.getElementById("Polygon").disabled = false;
                    document.getElementById("Ending").disabled = false;
                    document.getElementById("Edit").disabled = false;
                    document.getElementById("Delete").disabled = false;
                    document.getElementById("EndingControl").disabled = false;

                    document.getElementById("trackingButton").disabled = false;
                    document.getElementById("stopTrackingButton").disabled = false;

                    // Set the export links
                    this_.editExportLinks();
                }
            });
        });
        this.state.map.addControl(this.state.buttonsDrawControls);

        // Reset to the position
        var resetPosition = new ol.control.ResetPosition();
        this.state.map.addControl(resetPosition);

        // Redraw the subscribe zone
        var RedrawSubscribeZone = new ol.control.EditSubscribeRoom();
        this.state.map.addControl(RedrawSubscribeZone);

    },


    /**
     * In progress...
     */
    initPosition(lon, lat)
    {
        if (undefined != this.markerPositionLayer) {
            this.state.map.removeLayer(this.markerPositionLayer);
        }

        var pointCenter = new ol.geom.Point([lon, lat]).transform(this.state.projectionTo, this.state.projectionFrom).getCoordinates();
        this.state.view.setCenter(pointCenter);

        // Adding position marker
        var iconFeature = new ol.Feature({
            geometry: new ol.geom.Point([lon, lat]).transform(this.state.projectionTo, this.state.projectionFrom)
        });

        var markerSource = new ol.source.Vector({});
        markerSource.addFeature(iconFeature);

        this.markerPositionLayer = new ol.layer.Vector({
            source: markerSource,
            title: "Marker position",
            visible: true,
            type: 'hidden',
            style: new ol.style.Style({
                image: new ol.style.Icon({
                    anchor: [0.5, 18.5],
                    anchorXUnits: 'fraction',
                    anchorYUnits: 'pixels',
                    opacity: 0.75,
                    src: 'images/marker_position.png'
                })
            })
        });

        this.state.map.addLayer(this.markerPositionLayer);
    },

    /**
     * Create a zone where kuzzle subscription is active
     * @param distance
     */
    createZoneSubscription(distance)
    {
        var coordonatesWGS84 = this.state.coordinates; // = this.geolocation.getPosition();

        var features = [];
        // Transformation coordinates in Mercator projection
        var coordinatesTr = ol.proj.transform([coordonatesWGS84[0], coordonatesWGS84[1]], this.state.projectionTo, this.state.projectionFrom);

        // Creation of circle
        var circle = new ol.geom.Circle([coordinatesTr[0], coordinatesTr[1]], distance);

        // Create feature : we transform the circle into polygon for having a geJSON of this feature
        features.push(new ol.Feature({
            geometry: new ol.geom.Polygon.fromCircle(circle, 128)
        }));

        // Create Vector Source
        var vectorSource = new ol.source.Vector({
            features: features
        });

        // Random color #RRGGBB
        var color = '#' + '0123456789abcdef'.split('').map(function(v,i,a){
                return i>5 ? null : a[Math.floor(Math.random()*16)] }).join('');

        // Create vector layer
        this.state.zoneSubscriptionLayer = new ol.layer.Vector({
            source: vectorSource,
            title: "Subscribe zone",
            visible: true,
            type: 'hidden',
            style: [
                new ol.style.Style({
                    stroke: new ol.style.Stroke({
                        color: '#8BC34A',
                        width: 2
                    }),
                    fill: null
                })
            ]
        });
        this.state.zoneSubscriptionLayer.setZIndex(10);
        // Ajout de la couche
        this.state.map.addLayer(this.state.zoneSubscriptionLayer);

        // Rebuild the subscribe zone
        dataLayers.subscribeCollection(this.getSelectedLayer(), this.state.coordinates);
    },

    /**
     * Show feature information by feature
     * @param feature
     */
    showFeaturesInformations(feature, centerTofeature = true)
    {
        var parser = new ol.format.GeoJSON();

        var fProperties = feature.getProperties();
        var fGeoJson = parser.writeFeatureObject(feature, {dataProjection: Projection.projectionTo, featureProjection: Projection.projectionFrom});

        // Show datas
        document.getElementById("nameKdoc").innerHTML = fProperties.name;
        document.getElementById("dateKdoc").innerHTML = fProperties.date_publish;

        document.getElementById("descriptionKdoc").innerHTML = fProperties.description;
        if ("" != fProperties.url_image) {
            document.getElementById("imgKdoc").classList.remove("hidden");
            document.getElementById("imgKdoc").setAttribute("src", fProperties.url_image);
            document.getElementById("imgKdoc").setAttribute("alt", fProperties.name);
            document.getElementById("imgKdoc").setAttribute("title", fProperties.name);
        } else {
            document.getElementById("imgKdoc").classList.add("hidden");
        }
        this.addGeometriesTab(feature.getGeometry());

        if (true == centerTofeature) {
            document.getElementById("infoKdoc").classList.toggle("hidden");
            this.setCenterFeature(feature.getId());
        }
    },


    /**
     * Verify with turf-inside if a pint is inside or outside the subscribe zone
     * @param feature
     * @return bool
     */
    isPointInZoneSubscribe(featureGeoJSON)
    {
        var parser = new ol.format.GeoJSON();
        //var featureGeoJSON = parser.writeFeatureObject(feature, {dataProjection: Projection.projectionTo, featureProjection: Projection.projectionFrom});

        var zsLayerFeature = this.state.zoneSubscriptionLayer.getSource().getFeatures()[0];
        var zsGeoJSON = parser.writeFeatureObject(zsLayerFeature, {dataProjection: Projection.projectionTo, featureProjection: Projection.projectionFrom});

        return turfInside(featureGeoJSON, zsGeoJSON);
    },


    /**
     * Return the centroid of a polygon/linestring feature
     * @param featureGeoJSON : geoJson a the feature
     * @return centroid of feature
     */
    getFeatureCentroid(featureGeoJSON)
    {
        var centroidPt = turfCentroid(featureGeoJSON);
        return centroidPt;
    },


    /**
     * Center to the map of the selected feature
     */
    setCenterFeature(featureId)
    {
        if (undefined != featureId && null != featureId) {
            var feature = this.getSelectedLayer().getSource().getFeatureById(featureId);
            var extFeature = feature.getGeometry().getExtent();
            var centerFeature = ol.extent.getCenter(extFeature);
            this.state.view.setCenter(centerFeature);
            this.state.view.setZoom(17);
        }
    },


    /**
     * Set datas from proporties in the popup
     * @param properties
     * @returns {Element}
     */
    createEditDatasForm()
    {
        console.log("createEditDatasForm() : lancement formulaire properties pour " + dataLayers.state.notNotifFeatureId);
        var this_ = this;
        var divForm = document.getElementById("divFormInput");

        if (divForm.childElementCount > 0) {
            while (divForm.firstChild) divForm.removeChild(divForm.firstChild);
        }

        Object.keys(dataLayers.state.mappingCollection).forEach(key => {

            var div = document.createElement('div');
            div.className = "mdl-textfield mdl-js-textfield mdl-textfield--floating-label";

            // Label
            var label = document.createElement('label');
            label.className = "mdl-textfield__label";

            label.innerHTML = key.capitalizeFirstLetter();
            label.setAttribute("for", key);

            // Input
            if ("string" == dataLayers.state.mappingCollection[key].type) {
                var input = document.createElement('input');
                input.type = 'text';
                input.className = 'mdl-textfield__input';
                input.name = key;
                input.id = key;

                div.appendChild(label);
                div.appendChild(input);
                divForm.appendChild(div);

            } else if ("string" == dataLayers.state.mappingCollection[key].type && "description" == key) {
                var input = document.createElement('textarea');
                input.className = 'mdl-textfield__input';
                input.type= "text";
                input.row = 3;
                input.name = key;
                input.id = key;

                div.appendChild(label);
                div.appendChild(input);
                divForm.appendChild(div);
            }

            componentHandler.upgradeElements(div);
        });


        document.getElementById("divAddDoc").classList.toggle("hidden");
    },


    /**
     * Show the selected feature in geoJson format
     * @param fGeoJson
     */
    addGeoJSONTab(fGeoJson)
    {
        var container = document.getElementById("jsoneditor");
        if(container.hasChildNodes()) {
            container.removeChild( container.childNodes[0] );
        }
        var options = {
            mode: 'code'
        };
        var editor = new jsoneditor(container, options);
        editor.set(fGeoJson);
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

                var coordinates = ol.proj.transform(fGeometry.getCoordinates(), Projection.projectionFrom, Projection.projectionTo);

                var trLon = document.createElement('tr');
                var tdLonLabel = document.createElement('td'); tdLonLabel.innerHTML = 'Longitude';
                tdLonLabel.className = "mdl-data-table__cell--non-numeric";
                var tdLonValue = document.createElement('td'); tdLonValue.innerHTML = coordinates[0];

                trLon.appendChild(tdLonLabel);
                trLon.appendChild(tdLonValue);

                var trLat = document.createElement('tr');
                var tdLatLabel = document.createElement('td'); tdLatLabel.innerHTML = 'Lattitude';
                tdLatLabel.className = "mdl-data-table__cell--non-numeric";
                var tdLatValue = document.createElement('td'); tdLatValue.innerHTML = coordinates[1];

                trLat.appendChild(tdLatLabel);
                trLat.appendChild(tdLatValue);

                tbody.appendChild(trLon);
                tbody.appendChild(trLat);
                break;

            case 'LineString':
                var trLong = document.createElement('tr');
                var tdLongLabelM = document.createElement('td'); tdLongLabelM.innerHTML = 'Length';
                tdLongLabelM.className = "mdl-data-table__cell--non-numeric";
                var tdLongValueM = document.createElement('td'); tdLongValueM.innerHTML = this.formatLength(fGeometry, true);

                trLong.appendChild(tdLongLabelM);
                trLong.appendChild(tdLongValueM);

                tbody.appendChild(trLong);
                break;

            case 'Polygon':
                var trSq = document.createElement('tr');
                var tdSqLabel = document.createElement('td'); tdSqLabel.innerHTML = 'Area';
                tdSqLabel.className = "mdl-data-table__cell--non-numeric";
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
     *
     */
    editExportLinks()
    {
        var links = document.getElementsByClassName('export');
        Array.filter(links, link => {
            link.href = "";

            var serialized = "export";
            var tabParams = {
                type: link.dataset.type,
                layer: this.getSelectedLayer().get('title')
            };

            var serialiseObject = function(obj) {
                var pairs = [];
                for (var prop in obj) {
                    if (!obj.hasOwnProperty(prop)) {
                        continue;
                    }
                    //pairs.push(prop + '=' + encodeURIComponent(obj[prop]));
                    pairs.push('/' + encodeURIComponent(obj[prop]));
                }
                return pairs.join(''); //('&');
            };

            serialized += serialiseObject(tabParams);
            link.href += serialized;
            link.setAttribute('disabled', false);
        });

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
                    fill: new ol.style.Fill({ color: [255,110,64] }), // interieur // rgb(255,110,64)
                    stroke: new ol.style.Stroke({ color: [255,102,0,1] }), // bordure
                    radius: 5
                })
            })],

            'LineString': [new ol.style.Style({
                stroke: new ol.style.Stroke({
                    color: [255,110,64],
                    width: 4
                })
            })],

            'Polygon': [new ol.style.Style({
                fill: new ol.style.Fill({
                    color : 'rgba(255,110,64, 0.3)'
                }),
                stroke: new ol.style.Stroke({
                    color: [255,102,0,1],
                    width: 2
                })
            })],

            'Circle': [new ol.style.Style({
                fill: new ol.style.Fill({
                    color: 'rgba(255,110,64, 0.3)'
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