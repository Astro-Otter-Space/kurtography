/**
 * Created by stephane on 21/02/16.
 */
ol.control.DrawButtons = function (opt_options) {

    var options = opt_options || {};

    var this_ = this;

    // Default values
    this.typeSelect = 'Point';
    this.map = this.getMap();

    // Classes CSS
    this.olClassName = 'ol-unselectable ol-control';
    this.drawContainer = 'toggle-control';

    this.drawClassName = this.olClassName + ' ' + this.drawContainer;

    this.olGroupClassName = 'ol-control-group';

    // Boutons
    var elementDrawButtons = new ol.Collection();
    var elementDrawControls = new ol.Collection();

    // Events listeners
    var handleButtonsClick = function (e)
    {
        e = e || window.event;

        // Disabled Controls buttons
        var divsChildren = this_.element.getElementsByClassName('div-controls')[0].children;
        for(var i = 0; i < divsChildren.length; i++) {
            divsChildren.item(i).classList.remove('enable');
        }

        // Disable Draws controls
        var divsChildren = this_.element.getElementsByClassName('div-draw')[0].children;
        for(var i = 0; i < divsChildren.length; i++) {
            divsChildren.item(i).classList.remove('enable');
        }

        // Enable the actual button
        e.target.classList.toggle('enable');

        this_.drawOnMap(e);
        e.preventDefault();
    };

    var handleControlsClick = function (e)
    {
        e = e || window.event;

        // Disabled Controls buttons
        var divsChildren = this_.element.getElementsByClassName('div-controls')[0].children;
        for(var i = 0; i < divsChildren.length; i++) {
            divsChildren.item(i).classList.remove('enable');
        }

        // Disable Draws controls
        var divsChildren = this_.element.getElementsByClassName('div-draw')[0].children;
        for(var i = 0; i < divsChildren.length; i++) {
            divsChildren.item(i).classList.remove('enable');
        }

        // Enable the actual button
        e.target.classList.toggle('enable');

        this_.controlOnMap(e);
        e.preventDefault();
    }

    // Marker
    var buttonPoint = this.buttonPoint = document.createElement('button');
    buttonPoint.setAttribute('title', 'Draw point');
    buttonPoint.id = buttonPoint.draw = 'Point';
    buttonPoint.type_control = 'draw';
    buttonPoint.className = 'glyphicon glyphicon-map-marker';
    buttonPoint.addEventListener('click', handleButtonsClick, false);
    elementDrawButtons.push(buttonPoint);

    // Line
    var buttonLine = this.buttonLine = document.createElement('button');
    buttonLine.setAttribute('title', 'Draw line');
    buttonLine.id = buttonLine.draw = 'LineString';
    buttonLine.type_control = 'draw';
    buttonLine.className = 'glyphicon glyphicon-vector-path-line';
    buttonLine.addEventListener('click', handleButtonsClick, false);
    elementDrawButtons.push(buttonLine);

    // Square
    var buttonSquare = this.buttonCircle = document.createElement('button');
    buttonSquare.setAttribute('title', 'Draw square');
    buttonSquare.id = buttonSquare.draw = 'Square';
    buttonSquare.type_control = 'draw';
    buttonSquare.className = 'glyphicon glyphicon-vector-path-square';
    buttonSquare.addEventListener('click', handleButtonsClick, false);
    elementDrawButtons.push(buttonSquare);

    // Circle
    var buttonCircle = this.buttonCircle = document.createElement('button');
    buttonCircle.setAttribute('title', 'Draw circle');
    buttonCircle.id = buttonCircle.draw = 'Circle';
    buttonCircle.type_control = 'draw';
    buttonCircle.className = 'glyphicon glyphicon-vector-path-circle';
    buttonCircle.addEventListener('click', handleButtonsClick, false);
    elementDrawButtons.push(buttonCircle);

    // Polygone
    var buttonPolygone = this.buttonPolygone = document.createElement('button');
    buttonPolygone.setAttribute('title', 'Draw polygone');
    buttonPolygone.id = buttonPolygone.draw = 'Polygon';
    buttonPolygone.type_control = 'draw';
    buttonPolygone.className = 'glyphicon glyphicon-vector-path-polygon';
    buttonPolygone.addEventListener('click', handleButtonsClick, false);
    elementDrawButtons.push(buttonPolygone);

    // Edit
    var buttonEdit = this.buttonEdit = document.createElement('button');
    buttonEdit.setAttribute('title', 'Edit feature');
    buttonEdit.id = 'Edit';
    buttonEdit.type_control = 'edit';
    buttonEdit.className = 'glyphicon glyphicon glyphicon-pencil';
    buttonEdit.addEventListener('click', handleControlsClick, false);
    elementDrawControls.push(buttonEdit);

    // Delete
    var buttonDel = this.buttonEdit = document.createElement('button');
    buttonDel.setAttribute('title', 'Delete feature');
    buttonDel.id = 'Delete';
    buttonDel.type_control = 'delete';
    buttonDel.className = 'glyphicon glyphicon glyphicon-trash';
    buttonDel.addEventListener('click', handleControlsClick, false);
    elementDrawControls.push(buttonDel);


    // Containers
    var divDraw = document.createElement('div');
    divDraw.className = 'div-draw ' + this.olGroupClassName;
    elementDrawButtons.forEach(function(button) {
        divDraw.appendChild(button);
    });

    var divControls = document.createElement('div');
    divControls.className = 'div-controls ' + this.olGroupClassName;
    elementDrawControls.forEach(function(button) {
        divControls.appendChild(button);
    });

    // Container
    var element = document.createElement('div');
    element.className = this.drawClassName;
    element.appendChild(divDraw);
    element.appendChild(divControls);

    ol.control.Control.call(this, {
        element: element,
        target: options.target
    });
};

ol.inherits(ol.control.DrawButtons, ol.control.Control);


// -> http://blog.awesomemap.tools/demo-draw-and-modify-openlayers-3/
// -> http://cgit.drupalcode.org/openlayers/tree/modules/openlayers_geofield/src/Plugin/Control/Geofield/js/geofieldControl.js?id=8c2d83ff0e38ae846e853e2f3599114e40ed0f84
// Dessinage sur la carte
ol.control.DrawButtons.prototype.drawOnMap = function(evt)
{
    this.map = this.getMap();
    var geometryFctDraw;
    var typeSelect = evt.target.draw;

    // Specific for square
    if (typeSelect == 'Square') {
        typeSelect = 'Circle';
        geometryFctDraw = ol.interaction.Draw.createRegularPolygon(4);
    }

    // Draw new item
    var draw = this.draw = new ol.interaction.Draw({
        //features: features,
        source : layer_test.getSource(),
        features : new ol.Collection(),
        type: /** @type {ol.geom.GeometryType} */ (typeSelect),
        geometryFunction : geometryFctDraw,
        style : this.styleAdd()
    });

    // Fin edition
    draw.on('drawend', this.drawEnd, this);

    this.map.addInteraction(draw);
};


/**
 * Edit or delete a feature
 * @param evt
 */
ol.control.DrawButtons.prototype.controlOnMap = function(evt)
{
    this.map = this.getMap();

    var typeControl = evt.target.type_control; // (draw), edit or delete;

    // Select Interaction
    var selectInteraction = new ol.interaction.Select({
        layers: function(layer) {
            return layer_test
        }
    });
    this.map.addInteraction(selectInteraction);

    // Grab feature selected
    var selectedFeatures = selectInteraction.getFeatures();

    // Gestion des event sur la feature
    selectedFeatures.on('add', function(e, typeControl) {
        var feature = e.element;

        if (typeControl == 'edit') {
            console.log("Modication de " + feature);
        } else if(typeControl == 'delete') {
            console.log("Suppression de " + feature);
            // remove from selectInteraction
            selectedFeatures.remove(feature);
            // remove from selected Layer
            layer_test.getSource().removeFeature(feature);
            // TODO : delete from kuzzle
        }
    });

    // Modify interaction
    var mod = new ol.interaction.Modify({
        features: selectedFeatures,
        style: this.styleEdit(),
        deleteCondition: function(event) {
            return ol.events.condition.shiftKeyOnly(evt) && ol.events.condition.singleClick(evt);
        }
    });
    this.map.addInteraction(mod);
};

/**
 *
 */
ol.control.DrawButtons.prototype.styleAdd = function()
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

ol.control.DrawButtons.prototype.styleEdit = function()
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
 * @param evt
 */
ol.control.DrawButtons.prototype.drawStart = function() {
    console.log("Start editing");
};

/**
 *
 * @param evt
 */
ol.control.DrawButtons.prototype.drawEnd = function(evt) {
    var parser = new ol.format.GeoJSON();
    //var features = evt.getFeatures();
    //var featuresGeoJSON = parser.writeFeatures(features);
    //console.log('GeoJSON : ' + featuresGeoJSON);
    console.log("TODO : Envoie des données à Kuzzle");

    this.map.removeInteraction(this.draw);

    // Todoç :: remove disable
};

