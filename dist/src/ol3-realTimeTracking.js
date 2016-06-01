import notification from '../services/notification';
import dataLayers from './dataLayers';
import ol from 'openlayers';
import olMap from './openlayers';
import uuid from 'node-uuid';

// Algo
// 1 - Choice : point or linestring OK
// 2 - create first point of feature by geoloc OK
// 3 - Add point in kuzzle and update properties
// 4 - change adding interaction in modify interaction
// 5 - with change geoloc, update (point) or adding (linestring) geometries
// 6 - If linestring : update field location
// 7 - Event for stopping tracking

ol.control.RealTimeTracking = function (selected_layer) {

    var this_ = this;
    this.map = this.getMap();
    this.setSelectedLayer(this.selectedLayers);

    var divTarget = document.getElementById("external_draw_control");
    var divElement = document.getElementById("panelTracking");

    // Formulaire
    var handleChoice = function(e) {
        e = e || window.event;
        e.preventDefault();

        var type = e.target.elements.type_tracking.value;
        this_.createFeature(type);
        document.getElementById("divTrackingChoice").classList.toggle("hidden");
    };
    var formChoice = document.forms['form-choice-tracking'];
        formChoice.addEventListener('submit', handleChoice, false);

    // BUTTON START
    var button = document.createElement('button');
    button.setAttribute('title', 'Real-time tracking');
    button.setAttribute('disabled', 'disabled');
    button.className = "mdl-button mdl-js-button mdl-button--fab mdl-js-ripple-effect mdl-button--mini-fab mdl-button--colored";
    button.id = "trackingButton";

    var iLabel = document.createElement('i');
    iLabel.className = "material-icons";
    iLabel.innerHTML = "directions_run";

    // Listener tracking
    this.handleTracking = function(e) {
        e = e || window.event;

        document.getElementById("divTrackingChoice").classList.toggle("hidden");

        // Toggle buttons
        buttonOff.setAttribute('disabled', false);
        buttonOff.classList.toggle("hidden");
        button.setAttribute('disabled', 'disabled');

        e.preventDefault();
    };
    button.addEventListener('click', this.handleTracking, false);
    button.appendChild(iLabel);

    // BUTTON OFF
    var buttonOff = document.createElement('button');
    buttonOff.setAttribute('title', 'Real-time tracking');
    buttonOff.setAttribute('disabled', 'disabled');
    buttonOff.className = "mdl-button mdl-js-button mdl-button--fab mdl-js-ripple-effect mdl-button--mini-fab mdl-button--colored hidden";
    buttonOff.id = "stopTrackingButton";

    var iLabelOff = document.createElement('i');
    iLabelOff.className = "material-icons";
    iLabelOff.innerHTML = "done";

    buttonOff.appendChild(iLabelOff);

    // Add elements
    divElement.appendChild(button);
    divElement.appendChild(buttonOff);

    ol.control.Control.call(this, {
        element: divElement,
        target: divTarget
    });
};

ol.inherits(ol.control.RealTimeTracking, ol.control.Control);


/**
 * Create Draw Interaction
 * @param evt
 */
ol.control.RealTimeTracking.prototype.createFeature = function(typeSelect) {

    // Coordinates poistion
    var coordonatesWGS84 = olMap.state.coordinates;
    // Reprojection for openlayers
    var coordinatesTr =  ol.proj.transform([coordonatesWGS84[0], coordonatesWGS84[1]], olMap.state.projectionTo, olMap.state.projectionFrom);

    // Create geom type
    if ('Point' == typeSelect) {
        var geomType = new ol.geom.Point(coordinatesTr);
    } else if ('LineString' == typeSelect) {
        var geomType = new ol.geom.LineString([[coordinatesTr],[coordinatesTr]])
    }

    // Create feature
    var idFeature = uuid.v1();
    var newRealTimeFeature = new ol.Feature({
        geometry: geomType,
        id: idFeature,
        style: this.getStyle(typeSelect)
    });
    // Add feature to map
    //this.getSelectedLayer().getSource().addFeature(this.myRealTimeFeature);

    // Convert feature in geoJSON
    var parser = new ol.format.GeoJSON();
    var featureGeoJSON = parser.writeFeatureObject(newRealTimeFeature, {dataProjection: olMap.state.projectionTo, featureProjection: olMap.state.projectionFrom});

    // Add feature in kuzzle
    dataLayers.addDocument(featureGeoJSON, newRealTimeFeature);

    var kRealTimeFeature = this.getSelectedLayer().getSource().getFeatureById(idFeature);
    this.drawOnMap(kRealTimeFeature, typeSelect);
};


ol.control.RealTimeTracking.prototype.drawOnMap = function(myRealTimeFeature, typeSelect)
{
    var this_ = this;
    this.map = this.getMap();
    var selectInteraction = this.selectInteraction = new ol.interaction.Select({
        features: myRealTimeFeature,
        source : function(layer) {
            if (layer == this.getSelectedLayer()) {
                return layer
            }
        }
    });
    console.log("Add selectInteraction");
    this.map.addInteraction(this.selectInteraction);

    var modifyInteraction = this.modifyInteraction = new ol.interaction.Modify({
        features : this.selectInteraction.getFeatures(),
        geometryFunction: function (coords, geom) {

        },
        style : this.getStyle('edit'),
        zIndex: 50
    });
    console.log("Add selectInteraction");
    this.map.addInteraction(this.modifyInteraction);
};

// Event on start
ol.control.RealTimeTracking.prototype.drawStartFeature = function(evt)
{
    var feature = evt.feature;
};

// Event on ending
ol.control.RealTimeTracking.prototype.drawEndFeature = function(evt)
{
    var feature = evt.feature;
};

/**
 * Getters/setters of selected layer : Set your layer according to your need :)
 * @param layer
 */
ol.control.RealTimeTracking.prototype.setSelectedLayer = function(layer)
{
    this.selectedLayers = layer;
};

ol.control.RealTimeTracking.prototype.getSelectedLayer = function()
{
    return this.selectedLayers;
};

ol.control.RealTimeTracking.prototype.getStyle = function(type)
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

        'edit': [
            new ol.style.Style({
                fill: new ol.style.Fill({
                    color: [4, 100, 128, 0.4] //#046380
                }),
                stroke: new ol.style.Stroke({
                    color: [0, 64, 28, 0.75], //#004080
                    width: 1.5
                }),
                image: new ol.style.Circle({
                    radius: 7,
                    fill: new ol.style.Fill({
                        color: [4, 100, 128, 0.4]
                    }),
                    stroke: new ol.style.Stroke({
                        color: [0, 64, 28, 0.75],
                        width: 1.5
                    })
                }),
                zIndex: 100000
            })
        ]
    };

    return styles;
};
