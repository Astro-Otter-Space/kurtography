/**
 * Created by stephane on 21/02/16.
 */
ol.control.DrawButtons = function (opt_options) {

    var options = opt_options || {};

    // Container
    this.olClassName = 'ol-unselectable ol-control';
    this.drawContainer = 'toggle-control';
    this.drawClassName = this.olClassName + ' ' + this.drawContainer;

    var element = document.createElement('div');
    element.className = this.drawClassName;

    // Boutons
    // Marker
    var buttonPoint = this.buttonPoint = document.createElement('button');
    buttonPoint.setAttribute('title', 'Draw point');
    buttonPoint.id = 'drawPoint';
    buttonPoint.className = 'glyphicon glyphicon-map-marker';
    element.appendChild(buttonPoint);

    // Line
    var buttonLine = this.buttonLine = document.createElement('button');
    buttonLine.setAttribute('title', 'Draw line');
    buttonLine.id = 'drawLine';
    buttonLine.className = 'glyphicon glyphicon-vector-path-line';
    element.appendChild(buttonLine);

    // Polygone
    var buttonPolygone = this.buttonPolygone = document.createElement('button');
    buttonPolygone.setAttribute('title', 'Draw polygone');
    buttonPolygone.id = 'drawPolygone';
    buttonPolygone.className = 'glyphicon glyphicon-vector-path-polygon';
    element.appendChild(buttonPolygone);

    var this_ = this;

    buttonPoint.onclick = function(e) {
        e = e || window.event;
        this_.disableButtons_(e.target);
        this_.drawOnMap('Point');
        e.preventDefault();
    };

    buttonLine.onclick = function(e) {
        e = e || window.event;
        this_.disableButtons_(e.target);
        this_.drawOnMap('LineString');
        e.preventDefault();
    };

    buttonPolygone.onclick = function(e) {
        e = e || window.event;
        this_.disableButtons_(e.target);
        this_.drawOnMap('Polygon');
        e.preventDefault();
    };

    ol.control.Control.call(this, {
        element: element,
        target: options.target
    });

};

ol.inherits(ol.control.DrawButtons, ol.control.Control);


// -> http://blog.awesomemap.tools/demo-draw-and-modify-openlayers-3/

// Dessinage sur la carte
ol.control.DrawButtons.prototype.drawOnMap = function(typeDraw)
{
    var map = this.getMap();

    //var mod = new ol.interaction.Modify({
    //    features: '', //fo.getFeatures()
    //    deleteCondition: function(event) {
    //        return ol.events.condition.shiftKeyOnly(event) && ol.events.condition.singleClick(event);
    //    }
    //});
    //map.addInteraction(mod);

    var geometryFctDraw = "";
    if (typeDraw == 'Square' || typeDraw == 'Circle') {
        geometryFctDraw = ol.interaction.Draw.createRegularPolygon(4);

    } else if(typeDraw == 'LineString' || typeDraw == 'Polygon') {
        geometryFctDraw = function(c, g) {
            if (!g) {
                g = new ol.geom.Polygon(g);
            }
            var start = c[0];
            var end = c[1];
            g.setCoordinates([
                [start, [start[0], end[1]], end, [end[0], start[1]], start]
            ]);
            return g;
        }
    }

    // Dessin
    var draw = new ol.interaction.Draw({
        source : testSource,
        type: typeDraw,
        //geometryFunction: geometryFctDraw
    });
    map.addInteraction(draw);
};



// Disabled draw buttons
ol.control.DrawButtons.prototype.disableButtons_ = function(button)
{
    //document.querySelectorAll('button[id^=\'' + button.id + '\']').setAttribute('disabled', 'disabled');
    // TODO : make it without jQuery
    jQuery('.'+this.drawContainer).children().not('button#' + button.id).each(function() {
        jQuery(this).attr('disabled', 'disabled');
    });
};

// Enabled draw button
ol.control.DrawButtons.enableButtons_ = function()
{
    jQuery('.'+this.drawContainer).children().removeAttr('disabled');
};

