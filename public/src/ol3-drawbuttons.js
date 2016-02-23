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

    // Boutons
    var elementDrawButtons = new ol.Collection();
    var elementDrawControls = new ol.Collection();

    // Events listeners
    var handleButtonClick = function (e)
    {
        e = e || window.event;
        this_.drawOnMap(e);
        e.preventDefault();
    };

    var handleControlsClick = function (e)
    {
        e = e || window.event;
        this_.controlOnMap(e);
        e.preventDefault();
    }

    // Marker
    var buttonPoint = this.buttonPoint = document.createElement('button');
    buttonPoint.setAttribute('title', 'Draw point');
    buttonPoint.id = buttonPoint.draw = 'Point';
    buttonPoint.className = 'glyphicon glyphicon-map-marker';
    buttonPoint.addEventListener('click', handleButtonClick, false);
    elementDrawButtons.push(buttonPoint);

    // Line
    var buttonLine = this.buttonLine = document.createElement('button');
    buttonLine.setAttribute('title', 'Draw line');
    buttonLine.id = buttonLine.draw = 'LineString';
    buttonLine.className = 'glyphicon glyphicon-vector-path-line';
    buttonLine.addEventListener('click', handleButtonClick, false);
    elementDrawButtons.push(buttonLine);

    // Square
    var buttonSquare = this.buttonCircle = document.createElement('button');
    buttonSquare.setAttribute('title', 'Draw square');
    buttonSquare.id = buttonSquare.draw = 'Square';
    buttonSquare.className = 'glyphicon glyphicon-vector-path-square';
    buttonSquare.addEventListener('click', handleButtonClick, false);
    elementDrawButtons.push(buttonSquare);

    // Circle
    var buttonCircle = this.buttonCircle = document.createElement('button');
    buttonCircle.setAttribute('title', 'Draw circle');
    buttonCircle.id = buttonCircle.draw = 'Circle';
    buttonCircle.className = 'glyphicon glyphicon-vector-path-circle';
    buttonCircle.addEventListener('click', handleButtonClick, false);
    elementDrawButtons.push(buttonCircle);

    // Polygone
    var buttonPolygone = this.buttonPolygone = document.createElement('button');
    buttonPolygone.setAttribute('title', 'Draw polygone');
    buttonPolygone.id = buttonPolygone.draw = 'Polygon';
    buttonPolygone.className = 'glyphicon glyphicon-vector-path-polygon';
    buttonPolygone.addEventListener('click', handleButtonClick, false);
    elementDrawButtons.push(buttonPolygone);

    // Edit
    var buttonEdit = this.buttonEdit = document.createElement('button');
    buttonEdit.setAttribute('title', 'Edit feature');
    buttonEdit.id = 'Edit';
    buttonEdit.className = 'glyphicon glyphicon glyphicon-pencil';
    buttonEdit.addEventListener('click', handleControlsClick, false);
    elementDrawButtons.push(buttonEdit);

    // Delete
    var buttonDel = this.buttonEdit = document.createElement('button');
    buttonDel.setAttribute('title', 'Delete feature');
    buttonDel.id = 'Delite';
    buttonDel.className = 'glyphicon glyphicon glyphicon-trash';
    buttonDel.addEventListener('click', handleControlsClick, false);
    elementDrawButtons.push(buttonDel);

    // Container
    var element = document.createElement('div');
    element.className = this.drawClassName;
    // Add buttons to container
    elementDrawButtons.forEach(function(button) {
        element.appendChild(button);
    });


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

    // Couche de dessin
    //var features = new ol.Collection();
    //var fo = new ol.layer.Vector({
    //    source: new ol.source.Vector({
    //        features: features,
    //        source : this.layer_test.getSource()
    //    }),
    //    style :
    //});
    //fo.setMap(this.map);

    // Draw new item
    var draw = this.draw = new ol.interaction.Draw({
        //features: features,
        source : layer_test.getSource(),
        type: /** @type {ol.geom.GeometryType} */ (typeSelect),
        geometryFunction : geometryFctDraw,
        style : this.editStyle()
    });

    // Fin edition
    draw.on('drawstart', this.drawStart, this);
    draw.on('drawend', this.drawEnd, this);

    this.map.addInteraction(draw);
};


// Modification / suppression
ol.control.DrawButtons.prototype.controlOnMap = function(evt)
{
    this.map = this.getMap();

    // Select Interaction
    var selectInteraction = new ol.interaction.Select({
        style: this.editStyle(),
        layers: function(layer) {
            return this.layer_test
        }
    });
    this.map.addInteraction(selectInteraction);

    var selectedFeatures = selectInteraction.getFeatures();

    var mod = new ol.interaction.Modify({
        features: selectedFeatures, // TODO : trouver comment setter la couche selectionné
        deleteCondition: function(event) {
            return ol.events.condition.shiftKeyOnly(evt) && ol.events.condition.singleClick(evt);
        }
    });
    this.map.addInteraction(mod);
};

/**
 *
 */
ol.control.DrawButtons.prototype.editStyle = function()
{
    var styleEdit = new ol.style.Style({
        image: new ol.style.Circle({
            radius: 7,
            fill: new ol.style.Fill({
                color: [0, 153, 255, 1]
            }),
            stroke: new ol.style.Stroke({
                color: [255, 255, 255, 0.75],
                width: 1.5
            })
        }),
        zIndex: 100000
    });

    return styleEdit;
}


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
};

// Disabled draw buttons
//ol.control.DrawButtons.prototype.disableButtons_ = function(button)
//{
//    //document.querySelectorAll('button[id^=\'' + button.id + '\']').setAttribute('disabled', 'disabled');
//    // TODO : make it without jQuery
//    jQuery('.'+this.drawContainer).children().not('button#' + button.id).each(function() {
//        jQuery(this).attr('disabled', 'disabled');
//    });
//};

// Enabled draw button
//ol.control.DrawButtons.enableButtons_ = function()
//{
//    jQuery('.'+this.drawContainer).children().removeAttr('disabled');
//};

