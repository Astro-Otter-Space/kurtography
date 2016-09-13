import GeoParameters from '../services/geo-parameters'
import notification from '../services/notification';
import kuzzleBridge from './kuzzleBridge';
import ol from 'openlayers';

// Openlayers controls
import LayerSwitcher from './ol3-plugins/ol3-layerSwitcher'
import ControlDrawButtons from './ol3-plugins/ol3-controldrawbuttons'
import ZoomControl from './ol3-plugins/ol3-zoomuibuttons';
import ResetPosition from './ol3-plugins/ol3-resetposition';
import RedrawSubscribeZone from './ol3-plugins/ol3-editsubscribezone';
import RealTimeTracking from './ol3-plugins/ol3-realTimeTracking';
import ExportDatas from './ol3-plugins/ol3-export';

// Openlayers 3 add-ons
import turfCentroid from 'turf-centroid';
// Others
import user from './user';
import dateFormat from 'dateformat';

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
        tabBaseLayers: [],
        groupKuzzleLayers:null,
        groupBaseMaps: null,
        projectionFrom: GeoParameters.projectionFrom,
        projectionTo: GeoParameters.projectionTo,
        coordinates: [],
        selectedLayer: null,
        distance: 5000,
        zoneSubscriptionLayer: null,
        buttonsDrawControls: null,
        realTimeTracking: null,
        layerSwitcher: null,
        markerSource: null,
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

        // Definition de la vue
        this.state.view = new ol.View({
            zoom: this.state.zoom
        });

        // Recuperation du fond de carte OpenStreetMap
        var osm = new ol.layer.Tile({
                title : 'Open Street Map',
                visible : true,
                type: 'overlays',
                source: new ol.source.OSM()
            }
        );

        this.state.tabBaseLayers.push(osm);

        this.state.groupBaseMaps = new ol.layer.Group({
            title: "Kuzzle group",
            layers: this.state.tabBaseLayers
        });

        // Put layers in ol.layer.Group
        if (kuzzleBridge.state.collections.length > 0) {
            this.state.tabLayersKuzzle = kuzzleBridge.state.collections.map(layerName => {
                return new ol.layer.Vector({
                    title: layerName,
                    type: 'base',
                    visible: false,
                    style: function (feature, resolution) {
                        if (undefined != GeoParameters.icons[layerName] && layerName in GeoParameters.icons) {
                            return new ol.style.Style({
                                image: new ol.style.Icon({
                                    anchor: [0.5, 18.5],
                                    anchorXUnits: 'fraction',
                                    anchorYUnits: 'pixels',
                                    src: GeoParameters.icons[layerName]
                                })
                            })
                        } else {
                            return this_.state.tabStyles[feature.getGeometry().getType()];
                        }
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
            layers: [this.state.groupBaseMaps, this.state.groupKuzzleLayers],
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
        var lonDef = GeoParameters.longDefault;
        var latDef = GeoParameters.latDefault;

        // Retrieve geolocation with default values
        this.geolocation = new ol.Geolocation({
            //projection: ol.proj.get(this.state.projectionTo),
            tracking: true
        });

        this.geolocation.set('position', [GeoParameters.longDefault, GeoParameters.latDefault]);
        this.geolocation.set('accuracy', 5); // Accuracy to 5 meters
        this.state.coordinates = [lonDef, latDef];
        this.initPosition(lonDef, latDef);

        // If user blocking geolocalisation, set on default point and set default point as geolocation
        this.geolocation.on('error', function(error) {
            this_.state.acceptGeoloc = false;
            console.log(error);
            notification.init({
                type: 'warning',
                message : 'You should accept geolocation on your browser :)'
            });
        });

        // Get change on geolocation (mobile use only)
        // TODO : verify if on mobile, changing position is detected
        document.addEventListener("DOMContentLoaded", function(event) {
            if(false != this_.state.acceptGeoloc) {
                this.geolocation.on('change', function() {

                    console.log(this_.geolocation.getPosition());

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
            var lon = this.getPosition()[0];
            var lat =  this.getPosition()[1];

            // Set of current coordonates
            this_.state.coordinates = [lon, lat];
            this_.initPosition(lon, lat);

            if (undefined != this.getSelectedLayer) {
                this_.createZoneSubscription(this_.state.distance);
            }
        });

        // Adding controls
        this.initControls();
        user.getCurrentUser(() => {});
        //this.initControlsIfConnected();

        // Show feature data + listener
        this.state.map.on('click', function(evt) {
            var feature = this_.state.map.forEachFeatureAtPixel(evt.pixel,
                function(feature, layer) {
                    return feature;
                }
            );

            if (undefined != feature && undefined != feature.getId()) {
                this_.setOpenGraphContent(feature);

                if (false == user.isAuthenticated()) {
                    this_.showFeaturesInformations(feature, true);
                } else {
                    if (false == this_.state.buttonsDrawControls.getFlagDraw()) {
                        this_.showFeaturesInformations(feature, true);
                    }
                }
            }
        });


    },


    /**
     * Get if params URI and set the datas
     * @param qs
     * @returns {{}}
     */
    getQueryParams(qs) {

        var query_string = {};
        var vars = qs.split("&");

        for (var i=0;i<vars.length;i++) {
            var pair = vars[i].split("=");
            // If first entry with this name
            if (typeof query_string[pair[0]] === "undefined") {
                query_string[pair[0]] = decodeURIComponent(pair[1]);
                // If second entry with this name

            } else if (typeof query_string[pair[0]] === "string") {
                var arr = [ query_string[pair[0]],decodeURIComponent(pair[1]) ];
                query_string[pair[0]] = arr;
                // If third or later entry with this name

            } else {
                query_string[pair[0]].push(decodeURIComponent(pair[1]));
            }
        }
        return query_string;
    },



    /**
     * Add controls to map
     */
    initControls()
    {
        var this_ = this;

        // Adding Layer switcher
        var options = {
            'connected' : false
        }
        this.state.layerSwitcher = new ol.control.LayerSwitcher();
        this.state.map.addControl(this.state.layerSwitcher);

        /**
         * @type {initControls.handleChangeScale}
         */
        this.handleChangeScale = function(e) {

            var min = parseInt(this.dataset.min);
            var max = parseInt(this.dataset.max);
            var zoom = parseInt(this.dataset.zoom);

            if (undefined != this_.state.zoneSubscriptionLayer) {

                var inputZoneRadius = document.getElementById('zoneRadius');
                var distanceUpdate = max/2; // we set to the middle

                inputZoneRadius.setAttribute("min", min);
                inputZoneRadius.setAttribute("max", max);
                inputZoneRadius.value = distanceUpdate;

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
        this.handleChangeDistance = function(e) {
            e.preventDefault();

            // If chane, remove and rebuild the subscribe zone
            if (undefined != this_.state.zoneSubscriptionLayer) {
                var distance = e.target.value;

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

        // Detection of selected layer
        // EDIT : detection of edit layer is on LayerSwitcher
        //ol.control.LayerSwitcher.forEachRecursive(this.state.map.getLayerGroup(), function(l, idx, a) {
        //    console.log(idx,a);
        //
        //    l.on("change:visible", function(e) {
        //        var lyr = e.target;
        //        if ('base' === l.get('type')) {
        //            if (lyr.getVisible() == true) {
        //                this_.setEventsSelectedLayer(lyr, null, false);
        //            }
        //        }
        //
        //    });
        //});

        // Reset to the position
        var resetPosition = new ol.control.ResetPosition();
        this.state.map.addControl(resetPosition);

        // Redraw the subscribe zone
        var redrawSubscribeZone = new ol.control.EditSubscribeRoom();
        this.state.map.addControl(redrawSubscribeZone);

        // Export datas
        var exportDatas = new ol.control.Export();
        this.state.map.addControl(exportDatas);

        // Inspect query string
        var paramsUrl = this.getQueryParams(window.location.search.substring(1));
        if (1 < Object.keys(paramsUrl).length) {

            ol.control.LayerSwitcher.forEachRecursive(this.state.map.getLayerGroup(), function(l, idx, a) {
                if (l.get('title') == paramsUrl.layer) {
                    var idRadioLayer = paramsUrl.layer.replace(/\s+/g, '-');
                    document.getElementById(idRadioLayer).parentNode.MaterialRadio.check();
                    l.setVisible(true);
                    this_.setEventsSelectedLayer(l, paramsUrl.id, false);
                }
            });
        }
    },

    /**
     * TEST
     * List of controls who need to be connected
     */
    initControlsIfConnected(flagIsAuthenticated)
    {
        if (true == flagIsAuthenticated) {
            var this_ = this;
            // RealTime Tracking
            if(false != this.state.acceptGeoloc) {
                this.state.realTimeTracking = new ol.control.RealTimeTracking(this.getSelectedLayer());
                this.state.map.addControl(this.state.realTimeTracking);
            }

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

            if (undefined != this.getSelectedLayer()) {
                this.setEventsSelectedLayer(this.getSelectedLayer(), null, flagIsAuthenticated);
            }

            //ol.control.LayerSwitcher.forEachRecursive(this.state.map.getLayerGroup(), function(l, idx, a) {
            //    l.on("change:visible", function(e) {
            //        var lyr = e.target;
            //        if ('base' === l.get('type')) {
            //            if (lyr.getVisible() == true) {
            //                this_.setEventsSelectedLayer(lyr, null, flagIsAuthenticated);
            //            }
            //        }
            //    });
            //});

            // This adding must be placed after the onchange...
            this.state.map.addControl(this.state.buttonsDrawControls);

            // Show notificate button
            document.getElementById('BtnNotificationUser').classList.remove('hidden');

        } else {
            this.state.map.removeControl(this.state.buttonsDrawControls);
            this.state.map.removeControl(this.state.realTimeTracking);
            document.getElementById('BtnNotificationUser').classList.add("hidden");
        }
    },

    /**
     * Set all events when change layer
     * @param layer
     * @param featureId
     * @param flagIsAuthenticated
     */
    setEventsSelectedLayer(layer, featureId, flagIsAuthenticated) {

        this.setSelectedLayer(layer);

        // Button export
        var exportList = document.getElementsByName('export');
        Array.filter(exportList, radio => {
            radio.disabled = false;
        });
        document.getElementById("exportNameLayer").innerHTML = this.getSelectedLayer().get('title');
        document.getElementById("export_datas").removeAttribute('disabled');

        // Button redraw
        document.getElementById("redraw_zone").removeAttribute('disabled');

        // Creation couche zone subscribe
        this.createZoneSubscription(this.state.distance);

        var scaleList = document.getElementsByName('scale');
        Array.filter(scaleList, radio => {
            radio.disabled = false;
        });
        document.getElementById('zoneRadius').disabled = false;

        // Load datas and Mapping
        if (undefined != featureId && null != featureId) {
            kuzzleBridge.loadDatasFromCollection(layer.get('title'), featureId);
        } else {
            kuzzleBridge.loadDatasFromCollection(layer.get('title'));
        }

        console.log(user.isAuthenticated());

        // Au cas ou...
        if (user.isAuthenticated()) {
            kuzzleBridge.receiveNotification(user.state.id);
            flagIsAuthenticated = true;

        }

        if (true == flagIsAuthenticated) {
            this.state.buttonsDrawControls.setSelectedLayer(layer);
            // Not sure if correct but it's working :|
            if(false != this.state.acceptGeoloc) {
                this.state.realTimeTracking.setSelectedLayer(layer);
            }
        }

        if (true == flagIsAuthenticated) {

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
        }
    },

    /**
     * Initialisation of position
     * @param lon
     * @param lat
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
     * @param distanceMeters
     */
    createZoneSubscription(distanceMeters)
    {
        if (undefined != this.state.zoneSubscriptionLayer || null != this.state.zoneSubscriptionLayer) {
            this.state.map.removeLayer(this.state.zoneSubscriptionLayer);
        }

        var coordonatesWGS84 = this.state.coordinates;

        var features = [];

        // Creation of circle
        var projection = this.state.view.getProjection();
        var resolutionAtEquator = this.state.view.getResolution();
        var center = this.state.view.getCenter();

        // Radius from distance in meters
        var pointResolution = projection.getPointResolution(resolutionAtEquator, center);
        var resolutionFactor = resolutionAtEquator/pointResolution;
        var radius = (distanceMeters / ol.proj.METERS_PER_UNIT.m) * resolutionFactor;

        var circle = new ol.geom.Circle(
            ol.proj.transform([coordonatesWGS84[0], coordonatesWGS84[1]], this.state.projectionTo, this.state.projectionFrom),
            radius
        );

        // Create feature : we transform the circle into polygon for having a geJSON of this feature
        features.push(new ol.Feature({
            geometry: new ol.geom.Polygon.fromCircle(circle, 128)
        }));

        // Create Vector Source
        var vectorSource = new ol.source.Vector({
            features: features
        });

        // Random color #RRGGBB
        //var color = '#' + '0123456789abcdef'.split('').map(function(v,i,a){
        //        return i>5 ? null : a[Math.floor(Math.random()*16)] }).join('');

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
        kuzzleBridge.subscribeByGeoDistance(this.getSelectedLayer(), this.state.coordinates);
    },

    /**
     * Show feature information by feature
     * @param feature
     * @param centerTofeature Boolean
     */
    showFeaturesInformations(feature, centerTofeature = true)
    {

        var this_ = this;
        var fProperties = this.fProperties = feature.getProperties();

        this.feature = feature;

        // Event on button
        var buttonNotificate = document.getElementsByClassName('notificate_owner')[0];
        buttonNotificate.setAttribute('title', 'Notificate ' + fProperties.userId + ' about ' + fProperties.name);
        buttonNotificate.dataset.featureId = feature.getId();
        buttonNotificate.removeEventListener("click", this.sendNotificationToOwner, false);

        // Show datas
        document.getElementById("nameKdoc").innerHTML = fProperties.name;

        // Date publish
        var byUser = "";
        if (undefined != fProperties.userId) {
            byUser = " by " + fProperties.userId;
        }

        var datePublish = new Date(fProperties.date_publish);
        document.getElementById("dateKdoc").innerHTML = " " + dateFormat(datePublish, 'dd/mm/yyyy') + byUser;

        // Image
        document.getElementById("descriptionKdoc").innerHTML = fProperties.description;
        if ("" != fProperties.url_image) {
            document.getElementById("imgKdoc").classList.remove("hidden");
            document.getElementById("imgKdoc").setAttribute("src", fProperties.url_image);
            document.getElementById("imgKdoc").setAttribute("alt", fProperties.name);
            document.getElementById("imgKdoc").setAttribute("title", fProperties.name);
        } else {
            document.getElementById("imgKdoc").classList.add("hidden");
        }

        if (undefined != fProperties.nbNotifications) {
            var txtPerson = (1 < fProperties.nbNotifications) ? ' persons ' : ' person ';
            document.getElementById("nbNotifications").innerHTML = fProperties.nbNotifications + txtPerson + 'have seen ' + fProperties.name;
        }

        this.addGeometriesTab(feature.getGeometry());

        // Sending notification
        this.sendNotificationToOwner = function(e) {
            e.target.removeEventListener(e.type, arguments);

            // Send a notification to the owner
            kuzzleBridge.sendNotificationToUser(e.currentTarget.dataset.featureId);

            // Update the feature in Kuzzle
            var objPropertiesFeature = new Array();
            objPropertiesFeature['nbNotifications'] = this_.fProperties.nbNotifications + 1;
            this_.feature.setProperties(objPropertiesFeature);

            kuzzleBridge.updateDocument(this_.feature);

            // Show notification
            notification.init({
                type: 'notice',
                message: 'You have notified ' + this_.fProperties.userId + ' about ' + this_.fProperties.name
            });
            e.preventDefault();
        };

        buttonNotificate.removeEventListener("dblclick", this.sendNotificationToOwner, false);
        buttonNotificate.addEventListener("click", this.sendNotificationToOwner, false);

        if (true == centerTofeature) {
            document.getElementById("infoKdoc").classList.toggle("hidden");
            this.setCenterFeature(feature.getId());
        }
    },


    /**
     * Return the centroid of a polygon/linestring feature
     * @param featureGeoJSON : feature in geojson format
     * @return centroid of feature
     */
    getFeatureCentroid(featureGeoJSON)
    {
        return turfCentroid(featureGeoJSON);
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
     * Generate form for input datas in kuzzle
     */
    createEditDatasForm()
    {
        var divForm = document.getElementById("divFormInput");
        document.getElementById('formTitle').appendChild(document.createTextNode('Add document in ' + this.getSelectedLayer().get('title')));


        if (divForm.childElementCount > 0) {
            while (divForm.firstChild) divForm.removeChild(divForm.firstChild);
        }

        Object.keys(kuzzleBridge.state.mappingFieldsCollection).forEach(key => {

            var div = document.createElement('div');
            div.className = "mdl-textfield mdl-js-textfield mdl-textfield--floating-label";

            // Label
            var label = document.createElement('label');
            label.className = "mdl-textfield__label";

            label.innerHTML = key.capitalizeFirstLetter();
            label.setAttribute("for", key);

            // Input
            if ("string" == kuzzleBridge.state.mappingFieldsCollection[key].type) {
                var input = document.createElement('input');
                input.type = 'text';
                input.className = 'mdl-textfield__input';
                input.name = key;
                input.id = key;

                if (key == "name"){
                    input.setAttribute("required", "required");
                }

                div.appendChild(label);
                div.appendChild(input);
                divForm.appendChild(div);

            } else if ("string" == kuzzleBridge.state.mappingFieldsCollection[key].type && "description" == key) {
                var textArea = document.createElement('textarea');
                textArea.className = 'mdl-textfield__input';
                textArea.type= "text";
                textArea.row = 3;
                textArea.name = key;
                textArea.id = key;

                div.appendChild(label);
                div.appendChild(textArea);
                divForm.appendChild(div);
            }
            componentHandler.upgradeElements(div);
        });

        document.getElementById("divAddDoc").classList.toggle("hidden");
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

                var coordinates = ol.proj.transform(fGeometry.getCoordinates(), GeoParameters.projectionFrom, GeoParameters.projectionTo);

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
        return {

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
    },

    /**
     * Set the properties for open graph
     * @param feature
     */
    setOpenGraphContent(feature)
    {
        if (feature.getProperties()) {

            var shareUrl = this.setShareUrl(feature);

            document.querySelector('meta[property=og\\:title]').setAttribute('content', feature.getProperties().name);
            document.querySelector('meta[property=og\\:type]').setAttribute('content', this.getSelectedLayer().get('title'));
            document.querySelector('meta[property=og\\:url]').setAttribute('content', shareUrl);

            if (undefined != feature.getProperties().description) {
                document.querySelector('meta[property=og\\:description]').setAttribute('content', feature.getProperties().description);
            }

            if (undefined != feature.getProperties().url_image) {
                document.querySelector('meta[property=og\\:image]').setAttribute('content', feature.getProperties().url_image);
            }

            var locationUrl = window.location.href + encodeURIComponent(shareUrl);
            var shareFacebook = 'https://www.facebook.com/sharer/sharer.php?u=' + locationUrl;
            var shareTwitter = 'https://twitter.com/intent/tweet?url=' + locationUrl;
            var shareGooglePlus = 'https://twitter.com/intent/tweet?url=' + locationUrl;

            document.getElementById('shareFacebook').setAttribute('href', shareFacebook);
            document.getElementById('shareTwitter').setAttribute('href', shareTwitter);
            document.getElementById('shareGooglePlus').setAttribute('href', shareGooglePlus);

            window.history.pushState({ },"", '' + shareUrl);
        }
    },

    setShareUrl(feature)
    {
        return  '?layer=' + this.getSelectedLayer().get('title')
                            + '&name=' + feature.getProperties().name
                            + '&id=' + feature.getId();
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