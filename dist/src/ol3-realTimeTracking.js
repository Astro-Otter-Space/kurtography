import notification from '../services/notification';
import kuzzle from '../services/kuzzle'
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

    // Event listener Formulaire
    var handleChoice = function(e) {
        e = e || window.event;
        e.preventDefault();

        // Datas from Form
        var formDatas = {};
        Object.keys(dataLayers.state.mappingCollection).forEach(field => {
            if ( undefined != e.target.elements[field] && "text" == e.target.elements[field].type) {
                formDatas[field] = e.target.elements[field].value;
            }
        });

        // Type of feature
        var type = e.target.elements.type_tracking.value;

        this_.createFeature(formDatas, type);
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

    // Listener tracking
    this.handleTracking = function(e) {
        e = e || window.event;

        document.getElementById("divTrackingChoice").classList.toggle("hidden");

        // Toggle buttons
        buttonOff.removeAttribute('disabled');
        buttonOff.classList.toggle("hidden");
        button.setAttribute('disabled', 'disabled');

        // Form construction
        this_.createForm();
        e.preventDefault();
    };

    this.handleStopTracking = function(e) {
        e = e || window.event;
        console.log("Ending tracking");

        // Button on
        button.removeAttribute('disabled');

        // Button Off
        buttonOff.classList.toggle("hidden");
        buttonOff.setAttribute('disabled', 'disabled');
        e.preventDefault();
    };

    button.addEventListener('click', this.handleTracking, false);
    buttonOff.addEventListener('click', this.handleStopTracking, false);


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
 * Form
 */
ol.control.RealTimeTracking.prototype.createForm = function()
{
    var divFormMapping = document.getElementById("listMappingTracking");
    if (divFormMapping.childElementCount > 0) {
        while (divFormMapping.firstChild) divFormMapping.removeChild(divFormMapping.firstChild);
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
            divFormMapping.appendChild(div);

        } else if ("string" == dataLayers.state.mappingCollection[key].type && "description" == key) {
            var input = document.createElement('textarea');
            input.className = 'mdl-textfield__input';
            input.type= "text";
            input.row = 3;
            input.name = key;
            input.id = key;

            div.appendChild(label);
            div.appendChild(input);
            divFormMapping.appendChild(div);
        }

        componentHandler.upgradeElements(div);
    });
};

/**
 * Create start Feature
 * @param evt
 */
ol.control.RealTimeTracking.prototype.createFeature = function(formDatas, typeSelect) {

    // Coordinates poistion
    var coordonatesWGS84 = olMap.state.coordinates;
    // Reprojection for openlayers
    var coordinatesTr =  ol.proj.transform([coordonatesWGS84[0], coordonatesWGS84[1]], olMap.state.projectionTo, olMap.state.projectionFrom);

    // Create geom type
    if ('Point' == typeSelect) {
        var geomType = new ol.geom.Point(coordinatesTr);
    } else if ('LineString' == typeSelect) {
        var geomType = new ol.geom.LineString([[coordinatesTr],[coordinatesTr]]);
    }

    // Create feature
    var idFeature = uuid.v1();
    var newRealTimeFeature = new ol.Feature({
        geometry: geomType,
        id: idFeature,
        style: this.getStyle(typeSelect)
    });

    // Convert feature in geoJSON and add in Kuzzle
    var parser = new ol.format.GeoJSON();
    var featureGeoJSON = parser.writeFeatureObject(newRealTimeFeature, {dataProjection: olMap.state.projectionTo, featureProjection: olMap.state.projectionFrom});

    featureGeoJSON.location = {};
    featureGeoJSON.properties = formDatas;
    newRealTimeFeature.setProperties(formDatas);

    // Add location reference
    if ('Point' == typeSelect) {
        featureGeoJSON.location = {
            lon: featureGeoJSON.geometry.coordinates[0],
            lat : featureGeoJSON.geometry.coordinates[1]
        };
    } else if ('LineString' == typeSelect ) {
        var fCentroid = olMap.getFeatureCentroid(featureGeoJSON);
        featureGeoJSON.location = {
            lon: fCentroid.geometry.coordinates[0],
            lat: fCentroid.geometry.coordinates[1]
        };
    }

    this.addDocumentTracking(newRealTimeFeature, featureGeoJSON);
};


/**
 * Create trackin document in kuzzle (like dataLayers.addDocument())
 */
ol.control.RealTimeTracking.prototype.addDocumentTracking = function(realTimeFeature, fDatasGeoJson)
{
    var this_ = this;
    var idFeature = (undefined != realTimeFeature.get('id')) ? realTimeFeature.get('id') : null;

    kuzzle.dataCollectionFactory(this.getSelectedLayer().get('title')).createDocument(idFeature, fDatasGeoJson, function (err, resp) {
        if (!err) {
            dataLayers.state.notNotifFeatureId = resp.id;
            olMap.getSelectedLayer().getSource().addFeature(realTimeFeature);
            this_.drawOnMap(realTimeFeature);
        } else {
            notification.init({
                type: 'error',
                message: "Error creation kuzzle tracking document."
            });
        }
    });
};

/**
 *
 * @param realTimeFeature
 */
ol.control.RealTimeTracking.prototype.drawOnMap = function(realTimeFeature)
{
    this.map = this.getMap();

    // when we get a position update, add the coordinate to the track's
    // geometry and recenter the view
    olMap.geolocation.on('change:position', function() {

        // Using olMap.state.coordinates from openlayers.js l.156 ???
        var newPosition = this.getPosition();

        if ('LineString' == realTimeFeature.getGeometry().getType()) {
            realTimeFeature.getGeometry().appendCoordinate(newPosition);
        } else {
            realTimeFeature.getGeometry().setCoordinates(newPosition);
        }

        // set position in kuzzle
        //kuzzle.dataCollectionFactory(this.getSelectedLayer().get('title'))
    });
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
