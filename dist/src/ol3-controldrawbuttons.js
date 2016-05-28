import Projection from '../services/geo-parameters'
import dataLayers from './dataLayers';
import ol from 'openlayers';
import olMap from './openlayers';

/**
 * OpenLayers 3 Draw Control, special fork for Kuzzle
 * Fork from github.com/HamHamFonFon/ol3-drawButtons
 * @param ol.Vector.Layer selected_layer : layer
 * @param array opt_options : options
 * @constructor
 * @extends ol.control.Control
 *
 */
ol.control.ControlDrawButtons = function (selected_layer, opt_options) {

    // Get options
    var options = opt_options || {};
    options.draw.Ending = true;

    // Set of defaultLayer
    this.selectedLayers = selected_layer;
    // Default values
    this.typeSelect = 'Point';
    this.map = this.getMap();
    this.flagDraw = new Boolean(false);
    this.flagLocStor = new Boolean(false);

    //
    if (undefined != options.properties)
    {
        this.element = options.properties.element;
    }

    this.setFlagDraw(this.flagDraw);
    this.setFlagLocStor(this.flagLocStor);

    var this_ = this;

    // Set the selected layer : default layer or from localStorage
    //this.setFlagLocStor(false);
    //if (options.local_storage == true) {
    //
    //    this.setFlagLocStor(true);
    //    if (localStorage.getItem('features') !== null) {
    //
    //        // Create geojson features from local storage
    //        console.log(localStorage.getItem('features'))
    //        var featuresLS = new ol.format.GeoJSON().readFeatures(JSON.parse(localStorage.getItem('features')));
    //
    //        var sourceLS =  new ol.source.Vector({
    //            features: featuresLS
    //        });
    //        this.selectedLayers.setSource(sourceLS);
    //    }
    //}

    this.setSelectedLayer(this.selectedLayers);

    if (options.style_buttons == undefined) {
        options.style_buttons = "default";
    }

    // Events listeners
    var handleButtonsClick = function (e)
    {
        e = e || window.event;

        if (dataLayers.state.subscription) {
            dataLayers.state.subscription.unsubscribe();
        }

        // Disabled Controls buttons
        var divsChildren = this_.element.getElementsByClassName('div-controls')[0].children;
        for(var i = 0; i < divsChildren.length; i++) {
            //divsChildren.item(i).classList.remove('enable');
            //divsChildren.item(i).classList.remove('progress');
            divsChildren.item(i).disabled = true;
        }

        // Disable Draws controls
        var divsChildren = this_.element.getElementsByClassName('div-draw')[0].children;
        for(var i = 0; i < divsChildren.length; i++) {
            //divsChildren.item(i).classList.remove('enable');
            //divsChildren.item(i).classList.remove('progress');
            divsChildren.item(i).disabled = true;

            if (divsChildren.item(i).type_control == 'ending') {
                divsChildren.item(i).classList.remove('hidden');
                divsChildren.item(i).disabled = false;
            }
        }

        this_.drawOnMap(e);
        e.preventDefault();
    };

    // handling control mode
    var handleControlsClick = function (e)
    {
        e = e || window.event;

        if (dataLayers.state.subscription) {
            dataLayers.state.subscription.unsubscribe();
        }

        // Disabled Controls buttons
        var divsChildren = this_.element.getElementsByClassName('div-controls')[0].children;
        for(var i = 0; i < divsChildren.length; i++) {
            //divsChildren.item(i).classList.remove('enable');
            //divsChildren.item(i).classList.remove('progress');
            divsChildren.item(i).disabled = true;

            if (divsChildren.item(i).type_control == 'ending') {
                divsChildren.item(i).classList.remove('hidden');
                divsChildren.item(i).disabled = false;
            }
        }

        // Disable Draws controls
        var divsChildren = this_.element.getElementsByClassName('div-draw')[0].children;
        for(var i = 0; i < divsChildren.length; i++) {
            //divsChildren.item(i).classList.remove('enable');
            //divsChildren.item(i).classList.remove('progress');
            divsChildren.item(i).disabled = true;
        }

        switch (e.target.type_control) {
            case 'edit' :
                this_.controlEditOnMap(e);
                break;
            case 'delete' :
                this_.controlDelOnMap(e);
                break;
        }

        e.preventDefault();
    };


    // Endind draw/control mode
    var handleGroupEnd = function (e)
    {
        var divsChildren = this_.element.querySelectorAll('.div-controls button, .div-draw button');
        for(var i = 0; i < divsChildren.length; i++) {
            divsChildren.item(i).disabled = false;

            if (divsChildren.item(i).type_control == 'ending') {
                if (!divsChildren.item(i).classList.contains('hidden')) {
                    divsChildren.item(i).classList.toggle('hidden');
                }
            }
        }

        // Removing adding interaction
        if (undefined != this_.drawInteraction && this_.drawInteraction.getActive() == true) {
            this_.drawInteraction.setActive(false);
            this_.map.removeInteraction(this_.drawInteraction);
        }

        // Remove modify interaction
        if (undefined != this_.editSelectInteraction && this_.editSelectInteraction.getActive() == true) {
            this_.editSelectInteraction.setActive(false);
            this_.map.removeInteraction(this_.editSelectInteraction);
        }
        if (undefined != this_.delInteraction && this_.delInteraction.getActive()) {
            this_.delInteraction.setActive(false);
            this_.map.removeInteraction(this_.delInteraction);
        }
        if (undefined != this_.modifyInteraction && this_.modifyInteraction.getActive() == true) {
            this_.modifyInteraction.setActive(false);
            this_.map.removeInteraction(this_.modifyInteraction);
        }

        // Remove delete interaction
        if (undefined != this_.selectDelInteraction && this_.selectDelInteraction.getActive()) {
            this_.selectDelInteraction.setActive(false);
            this_.map.removeInteraction(this_.selectDelInteraction);
        }
        if (undefined != this_.delInteraction && this_.delInteraction.getActive()) {
            this_.delInteraction.setActive(false);
            this_.map.removeInteraction(this_.delInteraction);
        }

        if (true == this_.getFlagLocStor()) {
            this_.setFeaturesInLocalStorage();
        }

        this_.setFlagDraw(false); // Desactivation of drawing flag
        // TODO activate subscribe
        console.log("Reactivation subscribe with " + this_.getSelectedLayer().get('title'));
        console.log(olMap.state.coordinates);
        dataLayers.subscribeCollection(this_.getSelectedLayer(), olMap.state.coordinates);
        e.preventDefault();
    };

    var buttonsContainer = new ol3buttons.init(opt_options, handleButtonsClick, handleControlsClick, handleGroupEnd);

    ol.control.Control.call(this, {
        element: buttonsContainer,
        target: document.getElementById("external_draw_control")
    });
};

ol.inherits(ol.control.ControlDrawButtons, ol.control.Control);

/**
 * Drawing on map
 * @param evt
 */
ol.control.ControlDrawButtons.prototype.drawOnMap = function(evt)
{
    this.map = this.getMap();

    if (!this.getSelectedLayer()) {
        this.setFlagDraw(false);
    } else {
        this.setFlagDraw(true)
    }

    if (this.getFlagDraw() == true) {
        var geometryFctDraw;
        var typeSelect = evt.target.draw;

        // Specific for square
        if (typeSelect == 'Square') {
            typeSelect = 'Circle';
            geometryFctDraw = this.geometryFctDraw = ol.interaction.Draw.createRegularPolygon(4);
        }

        // Draw new item
        var draw = this.drawInteraction = new ol.interaction.Draw({
            //features: features,
            source : this.getSelectedLayer().getSource(),
            features : new ol.Collection(),
            type: /** @type {ol.geom.GeometryType} */ (typeSelect),
            geometryFunction : geometryFctDraw,
            style : this.styleAdd()
        });

        draw.on('drawend', this.drawEndFeature, this);

        this.map.addInteraction(draw);
    }
};

/**
 * Event listener call when a new feature is created
 * @param evt
 */
ol.control.ControlDrawButtons.prototype.drawEndFeature = function(evt)
{
    var feature = evt.feature;
    var parser = new ol.format.GeoJSON();

    // Problem with recuperation of a circle geometry : https://github.com/openlayers/ol3/pull/3434
    if ('Circle' == feature.getGeometry().getType()) {
        //var parserCircle = parser.writeCircleGeometry_()
    } else {
        // Addind feature to source vector in EPSG:4326
        var featureGeoJSON = parser.writeFeatureObject(feature, {dataProjection: Projection.projectionTo, featureProjection: Projection.projectionFrom});

        if (undefined != this.element) {
            // Ajout new document in Kuzzle
            dataLayers.addDocument(featureGeoJSON, feature.getGeometry().getType());
        } else {
            console.error("Problem create new feature");
        }
    }
};


/**
 * Record features in local storage
 * /!\ circles can't ge parsing in GeoJSON : https://github.com/openlayers/ol3/pull/3434
 */
ol.control.ControlDrawButtons.prototype.setFeaturesInLocalStorage = function()
{
    var features = this.getSelectedLayer().getSource().getFeatures();
    var parser = new ol.format.GeoJSON();

    if (features.length > 0) {
        var featuresGeoJson = parser.writeFeatures(features)
        localStorage.clear();
        //console.log('Number of feature : ' + features.length);
        //console.log(featuresGeoJson);
        localStorage.setItem('features', JSON.stringify(featuresGeoJson));
    }
}


/**
 * Edit or delete a feature
 * @param evt
 */
ol.control.ControlDrawButtons.prototype.controlEditOnMap = function(evt) {
    if (!this.getSelectedLayer()) {
        this.setFlagDraw(false)
    } else {
        this.setFlagDraw(true);
    }

    if (this.getFlagDraw() == true) {
        this.map = this.getMap();

        // Select Interaction
        var selectedLayer = this.getSelectedLayer();
        var editSelectInteraction = this.editSelectInteraction = new ol.interaction.Select({
            condition: ol.events.condition.click,
        });
        this.map.addInteraction(editSelectInteraction);

        // Modify interaction
        var mod = this.modifyInteraction = new ol.interaction.Modify({
            features: editSelectInteraction.getFeatures(),
            style: this.styleEdit(),
            zIndex: 50
        });
        mod.on('modifyend', this.editEndFeature, this);

        this.map.addInteraction(mod);
    }
};

/**geometryFctDraw
 * TODO : REPORT THIS IN REPOSITORY ol3-drawButtons
 * @param evt
 */
ol.control.ControlDrawButtons.prototype.editEndFeature = function(evt)
{
    var features = evt.features.getArray();
    var parser = new ol.format.GeoJSON();

    // Dont use ES2015 syntax "array.forEach(feature => { return feature; })"
    features.forEach(function(feature, index) {
        // Problem with recuperation of a circle geometry : https://github.com/openlayers/ol3/pull/3434
        if ('Circle' == feature.getGeometry().getType()) {
            //var parserCircle = parser.writeCircleGeometry_()
        } else {
            // Addind feature to source vector in EPSG:4326
            var featureGeoJSON = parser.writeFeatureObject(feature, {dataProjection: Projection.projectionTo, featureProjection: Projection.projectionFrom});

            // Edit document in Kuzzle
            dataLayers.updateGeodatasDocument(featureGeoJSON, feature);
        }
    });
};


/**
 * Delete a feature from map
 * @param evt
 */
ol.control.ControlDrawButtons.prototype.controlDelOnMap = function (evt)
{
    if (!this.getSelectedLayer()) {
        this.setFlagDraw(false)
    } else {
        this.setFlagDraw(true);
    }

    if (this.getFlagDraw() == true) {
        this.map = this.getMap();

        // TODO : set specific style on hover

        // Select Interaction
        var selectDelInteraction = this.selectDelInteraction = new ol.interaction.Select({
            condition: ol.events.condition.click,
            source : function(layer) {
                if (layer == this.getSelectedLayer()) {
                    return layer
                }
            }
        });
        this.map.addInteraction(selectDelInteraction);

        var this_ = this;
        selectDelInteraction.getFeatures().addEventListener('add', function(e) {
            var feature = e.element;
            if(confirm('Are you sure you want to delete this feature ?')) {
                //try {
                    console.log("Suppression de la feature de selectDelInteraction");
                    // Remove from interaction
                    var featureId = feature.getId();
                    selectDelInteraction.getFeatures().remove(feature);
                    console.log("On rentre dans deleteDocument('" + featureId + "')");
                    dataLayers.deleteDocument(featureId);
                /*} catch (e) {
                    console.log(e.message);
                }*/

            }
            e.preventDefault();
        });

        var delInteraction = this.delInteraction = new ol.interaction.Modify({
            style: this.styleEdit(),
            features: selectDelInteraction.getFeatures(),
            deleteCondition: function(event) {
                return ol.events.condition.singleClick(event);
            }
        });
        // add it to the map
        this.map.addInteraction(delInteraction);
    }
};


/**
 * Styles of selected layer
 */
ol.control.ControlDrawButtons.prototype.styleAdd = function()
{
    var style = new ol.style.Style({
        fill: new ol.style.Fill({
            color: [69, 175, 157, 0.4] //#45B29D
        }),
        stroke: new ol.style.Stroke({
            color: [0, 75, 82, 0.75], //#004B52
            width: 1.5
        }),
        image: new ol.style.Circle({
            radius: 7,
            fill: new ol.style.Fill({
                color: [60, 255, 100, 0.4]
            }),
            stroke: new ol.style.Stroke({
                color: [255, 255, 255, 0.75],
                width: 1.5
            })
        }),
        zIndex: 100000
    });

    return style;
};

ol.control.ControlDrawButtons.prototype.styleEdit = function()
{
    var style = new ol.style.Style({
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
    });
    return style;
};


/**
 * Getters/setters of selected layer : Set your layer according to your need :)
 * @param layer
 */
ol.control.ControlDrawButtons.prototype.setSelectedLayer = function(layer)
{
    this.selectedLayers = layer;
};

ol.control.ControlDrawButtons.prototype.getSelectedLayer = function()
{
    return this.selectedLayers;
};

/**
 * Add a flag if Mode draw or not
 * @param flagDraw
 */
ol.control.ControlDrawButtons.prototype.setFlagDraw = function(/** @type {boolean} */flagDraw)
{
    this.flagDraw = flagDraw;
};

ol.control.ControlDrawButtons.prototype.getFlagDraw = function()
{
    return this.flagDraw;
};

/**
 * Flag for local storage
 * @param locStor
 */
ol.control.ControlDrawButtons.prototype.setFlagLocStor = function(/** @type {boolean} */locStor)
{
    this.flagLocStor = locStor;
};

ol.control.ControlDrawButtons.prototype.getFlagLocStor = function()
{
    return this.flagLocStor;
};


/**
 *
 * @type {{tabOptions: {}, olClassName: string, drawContainer: string, olGroupClassName: string, handleButtonsClick: null, handleControlsClick: null, handleGroupEnd: null, init: ol3buttons.init, elContainer: ol3buttons.elContainer, drawButtons: ol3buttons.drawButtons, drawControls: ol3buttons.drawControls}}
 */
var ol3buttons = {

    tabOptions: {},

    olButtonClassName: 'mdl-button mdl-js-button mdl-button--fab mdl-js-ripple-effect mdl-button--mini-fab mdl-button--colored ',// Generic CSS class for override style

    handleButtonsClick: null,
    handleControlsClick: null,
    handleGroupEnd: null,

    init: function (tabOptions, handleButtonsClick, handleControlsClick, handleGroupEnd)
    {
        var this_ = this;
        this.tabOptions = ol3buttons.tabOptions = tabOptions;

        // Callback TEST
        this.handleButtonsClick = ol3buttons.handleButtonsClick = handleButtonsClick;
        this.handleControlsClick = ol3buttons.handleControlsClick = handleControlsClick;
        this.handleGroupEnd = ol3buttons.handleGroupEnd = handleGroupEnd;

        var container = ol3buttons.elContainer();
        return container;
    },

    /**
     * Create container
     */
    elContainer: function ()
    {
        var this_ = this;
        // Containers

        // adding Draw buttons to container
        var divDraw = document.createElement('div');
        divDraw.className = 'div-draw';
        divDraw.id = 'drawButtons';

        var elementDrawButtons = this.drawButtons();
        elementDrawButtons.forEach(function(button) {
            button.removeEventListener("dblclick", this_.handleButtonsClick);
            if(this_.tabOptions.draw[button.draw] == true) {
                divDraw.appendChild(button);
            }
        });

        // adding Control buttons to container
        var divControls = document.createElement('div');
        divControls.className = 'div-controls';
        divControls.id = 'controlButtons';

        var elementDrawControls = this.drawControls();
        elementDrawControls.forEach(function(button) {
            button.removeEventListener("dblclick", this_.handleControlsClick);
            divControls.appendChild(button);
        });

        // Container
        var elementContainer = document.getElementById('panelDrawControl');
        elementContainer.appendChild(divDraw);
        elementContainer.appendChild(divControls);


        return elementContainer;
    },

    /**
     * buttons for drawing
     */
    drawButtons: function()
    {
        var elementDrawButtons = new ol.Collection();

        // Marker
        var buttonPoint = this.buttonPoint = document.createElement('button');
        buttonPoint.setAttribute('title', 'Draw point');
        buttonPoint.setAttribute('disabled', 'disabled');
        buttonPoint.id = buttonPoint.draw = 'Point';
        buttonPoint.type_control = 'draw';
        buttonPoint.addEventListener('click', this.handleButtonsClick, false);
        elementDrawButtons.push(buttonPoint);

        // Line
        var buttonLine = this.buttonLine = document.createElement('button');
        buttonLine.setAttribute('title', 'Draw line');
        buttonLine.setAttribute('disabled', 'disabled');
        buttonLine.id = buttonLine.draw = 'LineString';
        buttonLine.type_control = 'draw';
        buttonLine.addEventListener('click', this.handleButtonsClick, false);
        elementDrawButtons.push(buttonLine);

        // Square
        var buttonSquare = this.buttonCircle = document.createElement('button');
        buttonSquare.setAttribute('title', 'Draw square');
        buttonSquare.setAttribute('disabled', 'disabled');
        buttonSquare.id = buttonSquare.draw = 'Square';
        buttonSquare.type_control = 'draw';
        buttonSquare.addEventListener('click', this.handleButtonsClick, false);
        elementDrawButtons.push(buttonSquare);

        // Circle
        var buttonCircle = this.buttonCircle = document.createElement('button');
        buttonCircle.setAttribute('title', 'Draw circle');
        buttonCircle.setAttribute('disabled', 'disabled');
        buttonCircle.id = buttonCircle.draw = 'Circle';
        buttonCircle.type_control = 'draw';
        buttonCircle.addEventListener('click', this.handleButtonsClick, false);
        elementDrawButtons.push(buttonCircle);

        // Polygone
        var buttonPolygone = this.buttonPolygone = document.createElement('button');
        buttonPolygone.setAttribute('title', 'Draw polygone');
        buttonPolygone.setAttribute('disabled', 'disabled');
        buttonPolygone.id = buttonPolygone.draw = 'Polygon';
        buttonPolygone.type_control = 'draw';
        buttonPolygone.addEventListener('click', this.handleButtonsClick, false);
        elementDrawButtons.push(buttonPolygone);

        // Record add items
        var buttonDrawEnd = this.buttonDrawEnd = document.createElement('button');
        buttonDrawEnd.setAttribute('title', 'Ending draw mode');
        buttonDrawEnd.setAttribute('disabled', 'disabled');
        buttonDrawEnd.id = buttonDrawEnd.draw = 'Ending';
        buttonDrawEnd.type_control = 'ending';
        buttonDrawEnd.addEventListener('click', this.handleGroupEnd, false);
        buttonDrawEnd.removeEventListener('dblclick', this.handleGroupEnd);
        elementDrawButtons.push(buttonDrawEnd);


        if (this.tabOptions.style_buttons == "glyphicon") {
            buttonPoint.className = this.olButtonClassName + ' glyphicon glyphicon-map-marker';
            buttonLine.className = this.olButtonClassName + ' glyphicon icon-large icon-vector-path-line';
            buttonSquare.className = this.olButtonClassName + ' glyphicon icon-vector-path-square';
            buttonCircle.className = this.olButtonClassName + ' glyphicon icon-vector-path-circle';
            buttonPolygone.className = this.olButtonClassName + ' glyphicon icon-vector-path-polygon';
            buttonDrawEnd.className = this.olButtonClassName + ' glyphicon glyphicon-ok hidden';

        } else if (this.tabOptions.style_buttons == "mdlIcons") {

            buttonPoint.className = this.olButtonClassName;
            var iPoint = document.createElement('i');
            iPoint.className = "material-icons";
            iPoint.draw = buttonPoint.draw;
            iPoint.innerHTML = "add_location";
            buttonPoint.appendChild(iPoint);

            buttonLine.className = this.olButtonClassName;
            var iLine = document.createElement('i');
            iLine.className = "material-icons";
            iLine.draw = buttonLine.draw;
            iLine.innerHTML = "timeline";
            buttonLine.appendChild(iLine);

            buttonSquare.className = this.olButtonClassName;
            var iSquare = document.createElement('i');
            iSquare.className = "material-icons";
            iSquare.draw = buttonSquare.draw;
            iSquare.innerHTML = "format_shapes";
            buttonSquare.appendChild(iSquare);

            buttonCircle.className = this.olButtonClassName;
            var iCircle = document.createElement('i');
            iCircle.className = "material-icons";
            iCircle.draw = buttonCircle.draw;
            iCircle.innerHTML = "bubble_chart";
            buttonCircle.appendChild(iCircle);

            buttonPolygone.className = this.olButtonClassName;
            var iPolygon = document.createElement('i');
            iPolygon.className = "material-icons";
            iPolygon.draw = buttonPolygone.draw;
            iPolygon.innerHTML = "share";
            buttonPolygone.appendChild(iPolygon);

            buttonDrawEnd.className = this.olButtonClassName + ' hidden';
            var iSaveFeature = document.createElement('i');
            iSaveFeature.className = "material-icons";
            iSaveFeature.draw = buttonDrawEnd.draw;
            iSaveFeature.innerHTML = "save";
            buttonDrawEnd.appendChild(iSaveFeature);
        }
        else {
            buttonPoint.className = this.olButtonClassName + ' glyphicon-vector-path-point';
            buttonLine.className = this.olButtonClassName + ' glyphicon-vector-path-line';
            buttonSquare.className = this.olButtonClassName + ' glyphicon-vector-path-square';
            buttonCircle.className = this.olButtonClassName + ' glyphicon-vector-path-circle';
            buttonPolygone.className = this.olButtonClassName + ' glyphicon-vector-path-polygon';
            buttonDrawEnd.className = this.olButtonClassName + ' glyphicon-vector-path-ok hidden';
        }

        return elementDrawButtons;
    },

    /**
     * Control buttons
     */
    drawControls: function()
    {
        var elementDrawControls = new ol.Collection();

        var buttonEdit = this.buttonEdit = document.createElement('button');
        buttonEdit.setAttribute('title', 'Edit feature');
        buttonEdit.setAttribute('disabled', 'disabled');
        buttonEdit.id = 'Edit';
        buttonEdit.type_control = 'edit';
        buttonEdit.addEventListener('click', this.handleControlsClick, false);
        elementDrawControls.push(buttonEdit);

        // Delete
        var buttonDel = this.buttonEdit = document.createElement('button');
        buttonDel.setAttribute('title', 'Delete feature');
        buttonDel.setAttribute('disabled', 'disabled');
        buttonDel.id = 'Delete';
        buttonDel.type_control = 'delete';
        buttonDel.addEventListener('click', this.handleControlsClick, false);
        elementDrawControls.push(buttonDel);

        var buttonControlEnd = this.buttonControlEnd = document.createElement('button');
        buttonControlEnd.setAttribute('title', 'Ending control mode');
        buttonDel.setAttribute('disabled', 'disabled');
        buttonControlEnd.id = 'EndingControl';
        buttonControlEnd.type_control = 'ending';
        buttonControlEnd.addEventListener('click', this.handleGroupEnd, false);
        buttonControlEnd.removeEventListener('dblclick', this.handleGroupEnd);
        elementDrawControls.push(buttonControlEnd);

        if (this.tabOptions.style_buttons == "glyphicon") {
            buttonEdit.className = this.olButtonClassName + ' glyphicon glyphicon-pencil';
            buttonDel.className = this.olButtonClassName + ' glyphicon glyphicon-trash';
            buttonControlEnd.className = this.olButtonClassName + ' glyphicon glyphicon-ok hidden';

        } else if (this.tabOptions.style_buttons == "mdlIcons") {


            buttonEdit.className = this.olButtonClassName;
            var iEdit = document.createElement('i');
            iEdit.className = "material-icons";
            iEdit.type_control = buttonEdit.type_control;
            iEdit.innerHTML = "edit_location";
            buttonEdit.appendChild(iEdit);

            buttonDel.className = this.olButtonClassName;
            var iDel = document.createElement('i');
            iDel.className = "material-icons";
            iDel.type_control = buttonDel.type_control;
            iDel.innerHTML = "delete";
            buttonDel.appendChild(iDel);

            buttonControlEnd.className = this.olButtonClassName + ' hidden';
            var iSaveCtrl = document.createElement('i');
            iSaveCtrl.className = "material-icons";
            iSaveCtrl.type_control = buttonControlEnd.type_control;
            iSaveCtrl.innerHTML = "save";
            buttonControlEnd.appendChild(iSaveCtrl);


        } else {
            buttonEdit.className = this.olButtonClassName; // + ' glyphicon-vector-path-pencil';
            buttonDel.className = this.olButtonClassName; // + ' glyphicon-vector-path-trash';
            buttonControlEnd.className = this.olButtonClassName + ' hidden'; // + ' glyphicon-vector-path-ok hidden';
        }

        return elementDrawControls;
    }
};