import Projection from '../services/geo-parameters';
import notification from '../services/notification';
import dataLayers from './dataLayers';
import ol from 'openlayers';
import olMap from './openlayers';

// Algo
// 1 - Choice : point or linestring
// 2 - Create adding interaction
// 3 - create first point of feature (manual or by geoloc ?) and retrieve id from kuzzle
// 4 - change adding interaction in modify interaction
// 5 - with change geoloc, update (point) or adding (linestring) geometries
// 6 - If linestring : update field location
// 7 - Event for stopping tracking

ol.control.RealTimeTracking = function (selected_layer) {

    var this_ = this;
    this.setSelectedLayer(this.selectedLayers);

    var divTarget = document.getElementById("external_draw_control");
    var divElement = document.getElementById("panelTracking");

    // Formulaire
    var handleChoice = function(e) {
        e = e || window.event;
        e.preventDefault();

        var type = e.target.elements.type_tracking.value;
        this_.drawOnMap(type);
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
ol.control.RealTimeTracking.prototype.drawOnMap = function(typeSelect)
{
    this.map = this.getMap();
    this.position = olMap.state.coordinates;
    var this_ = this;

    var drawInteraction = this.drawInteraction = new ol.interaction.Draw({
        source : this.getSelectedLayer().getSource(),
        features : new ol.Collection(),
        type: /** @type {ol.geom.GeometryType} */ (typeSelect),
        geometryFunction: function (coords, geom) {

        }
        //style : this.styleAdd()
    });

    draw.on('drawstart', this.drawStartFeature, this);
    draw.on('drawend', this.drawEndFeature, this);
    this.map.addInteraction(drawInteraction);
};

// Event on start
ol.control.RealTimeTracking.prototype.drawStartFeature = function(evt)
{
    var feature = evt.feature;
    var pointStart = new ol.geom.Geometry([olMap.geolocation.getPosition()[0], olMap.geolocation.getPosition()[1]]).transform(olMap.state.projectionTo, olMap.state.projectionFrom).getCoordinates();
    console.log(pointStart);
    feature.setGeometry(pointStart);
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
