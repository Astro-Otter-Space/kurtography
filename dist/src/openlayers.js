import Projection from '../services/geo-parameters'
import dataLayers from './dataLayers';
import ol from 'openlayers';
import LayerSwitcher from './layerSwitcher'
import ControlDrawButtons from './ol3-controldrawbuttons'
import ZoomControl from './ol3-zoomuibuttons';
import SetPosition from './ol3-resetposition';
import turfInside from 'turf-inside';
import turfCentroid from 'turf-centroid';
import jsoneditor from 'jsoneditor';
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
        distance: 5000,
        zoneSubscriptionLayer: null,
        view: null,
        zoom: null,
        buttonsDrawControls: null,
        layerSwitcher: null,
        markerSource: null,
        groupKuzzleLayers:null,
        featureForm: null,
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

        // Centrage sur la carte en recuperant la position
        this.geolocation = new ol.Geolocation({
            projection: ol.proj.get(this.state.projectionTo),
            tracking: true
        });

        // If user blocking geolocalisation, set on default point
        // TODO : probleme version OpenLayers 3.13 -> 3.15
        this.geolocation.on('error', function(){
            var lonDef = Projection.longDefault;
            var latDef = Projection.latDefault;
            this.setProperties({
                position: [lonDef, latDef],
                tracking: true
            });
            this_.initPosition(lonDef, latDef);
        });

        // Get change on geolocation (mobile use only)
        this.geolocation.on('change', function() {
            console.log("detection changement");
            var lon = this_.geolocation.getPosition()[0];
            var lat =  this_.geolocation.getPosition()[1];
            this_.initPosition(lon, lat);

            if (undefined != this.getSelectedLayer) {
                this.createZoneSubscription(this.state.distance);
            }
        });


        /**
         * Feature editing : Callback on submit
         * @param e
         * @returns {boolean}
         */
        var handleSubmit = this.handleSubmit = function(e) {
            e.preventDefault();
            //var featureForm = this_.state.featureForm;
            var objPropertiesFeature = new Object();
            Array.from(e.target.elements).forEach(element => {
                if ("text" == element.type && "undefined" != element.type) {
                    objPropertiesFeature[element.name] = element.value;
                }
            });
            dataLayers.updatePropertiesDocument(this_.state.featureForm, objPropertiesFeature);
            return false;
        };

        // Show feature data + listener
        this.state.map.on('click', function(evt) {
            // When we select a feature, it's become the featureForm
            var feature = this_.state.map.forEachFeatureAtPixel(evt.pixel,
                function(feature, layer) {
                    return feature;
                }
            );
            if (undefined != feature && undefined != feature.getId() && this_.state.buttonsDrawControls.getFlagDraw() == false) {
                this_.state.featureForm = feature;
                this_.showFeaturesInformations(feature);
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

                    // Set the export links
                    this_.editExportLinks();
                }
            });
        });
        this.state.map.addControl(this.state.buttonsDrawControls);

        var resetPosition = new ol.control.ResetPosition();
        this.state.map.addControl(resetPosition);
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
            style: new ol.style.Style({
                image: new ol.style.Icon({
                    anchor: [0, 20],
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
        var coordonatesWGS84 = this.geolocation.getPosition();

        var features = [];
        // Transformation coordinates
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
        dataLayers.subscribeCollection(this.getSelectedLayer(), this.geolocation.getPosition(), this.state.distance);
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

        if (true == centerTofeature) {
            this.setCenterFeature(feature.getId());
        }

        // Gestion dialog box
        var dialog = document.querySelector('dialog');
        if (! dialog.showModal) {
            dialogPolyfill.registerDialog(dialog);
        }

        if (0 < fProperties.name.length) {
            document.getElementById("featureTitle").innerHTML = (typeof fProperties.name == "string") ? fProperties.name.capitalizeFirstLetter() : fProperties.name;
        } else {
            document.getElementById("featureTitle").innerHTML = "No name";
        }

        dialog.showModal();

        dialog.querySelector('.close').addEventListener('click', function() {
            dialog.close();
        });

        this.addPropertiesTab(fProperties);
        //this.addGeoJSONTab(fGeoJson);
        this.addGeometriesTab(feature.getGeometry());

        // Retrieve datas from Form Edit Properties
        // TODO : edit
        var form = document.getElementsByName("form-edit-properties")[0];
        form.removeEventListener('submit', this.handleSubmit);
        form.addEventListener('submit', this.handleSubmit, false);
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
    addPropertiesTab(properties)
    {
        //console.log(dataLayers.state.dataProperties);
        // Delete geometry if exist
        if (properties.geometry) {
            delete properties.geometry;
        }

        var form = document.forms['form-edit-properties'];
        if (form.childElementCount > 0) {
            while (form.firstChild) form.removeChild(form.firstChild);
        }
        for (var key in properties) {
            if (typeof properties[key] != 'object' || properties[key] != undefined) {

                var div = document.createElement('div');
                div.className = "mdl-textfield mdl-js-textfield";

                // Label
                var label = document.createElement('label');
                label.className = "mdl-textfield__label";
                if (0 < properties[key].length) {
                    var labelValue = (typeof properties[key] == "string") ? properties[key].capitalizeFirstLetter() : properties[key];
                } else {
                    var labelValue = key.capitalizeFirstLetter();
                }
                label.innerHTML = labelValue;
                label.setAttribute("for", key);

                // Input for edit propertie
                var input = document.createElement('input');
                input.type = 'text';
                input.className = 'mdl-textfield__input ';//properties-edit';
                input.name = key;
                input.id = key;

                input.value = (typeof properties[key] == "string") ? properties[key].capitalizeFirstLetter() : properties[key];
                //input.setAttribute('disabled', 'disabled');
                //input.setAttribute('placeholder', labelValue);

                div.appendChild(input);
                div.appendChild(label);

                form.appendChild(div);
            }
        }
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
                    fill: new ol.style.Fill({ color: [255,110,1,64] }), // interieur // rgb(255,110,64)
                    stroke: new ol.style.Stroke({ color: [255,102,0,1] }), // bordure
                    radius: 5
                })
            })],

            'LineString': [new ol.style.Style({
                stroke: new ol.style.Stroke({
                    color: [255,110,1,64,1],
                    width: 4
                })
            })],

            'Polygon': [new ol.style.Style({
                fill: new ol.style.Fill({
                    color : [255,110,1,64,0.4]
                }),
                stroke: new ol.style.Stroke({
                    color: [255,102,0,1],
                    width: 2
                })
            })],

            'Circle': [new ol.style.Style({
                fill: new ol.style.Fill({
                    color: [255,110,1,64,0.4]
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