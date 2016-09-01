import Projection from '../../services/geo-parameters'
import kuzzleBridge from './../kuzzleBridge';
import olMap from './../openlayers';
import ol from 'openlayers';

/**
 *
 * @param opt_options
 * @constructor
 */
ol.control.EditSubscribeRoom = function (opt_options) {

    // Get options
    var options = opt_options || {};

    this.map = this.getMap();
    this.flagDraw = new Boolean(false);

    this.setFlagDraw(this.flagDraw);

    var this_ = this;

    // Events listeners
    var handleButtonsClick = function (e)
    {
        e = e || window.event;
        this_.setFlagDraw(true)
        this_.drawOnMap(e);
        e.preventDefault();
    };

    //var buttonsContainer = new ol3buttons.init(opt_options, handleButtonsClick, handleControlsClick, handleGroupEnd);

    var divTarget = document.getElementById("external_control_zoom");
    var divElement = document.getElementById("panel");

    var button = document.createElement('button');
    button.setAttribute('title', 'Redraw subscribe zone');
    button.disabled = true;
    button.id = "redraw_zone";
    button.className = "mdl-button mdl-js-button mdl-button--fab mdl-js-ripple-effect mdl-button--mini-fab mdl-button--colored";

    button.addEventListener('click', handleButtonsClick, false);

    var iLabel = document.createElement('i');
    iLabel.className = "material-icons";
    iLabel.innerHTML = "find_replace";

    button.appendChild(iLabel);
    divElement.appendChild(button);

    ol.control.Control.call(this, {
        element: divElement,
        target: divTarget
    });
};

ol.inherits(ol.control.EditSubscribeRoom, ol.control.Control);

/**
 * Drawing on map
 * @param evt
 */
ol.control.EditSubscribeRoom.prototype.drawOnMap = function(evt)
{
    this.map = this.getMap();

    if (this.getFlagDraw() == true) {
        var geometryFctDraw;
        var typeSelect = 'Circle'; //evt.target.draw;

        // Draw new item
        var drawCircle = this.drawCircle = new ol.interaction.Draw({
            source : new ol.source.Vector( ),
            features : new ol.Collection(),
            type: /** @type {ol.geom.GeometryType} */ (typeSelect),
            //geometryFunction : geometryFctDraw,
            style : this.styleAdd(),
            title : "Subscribe zone"
        });

        drawCircle.on('drawend', this.drawEndFeature, this);
        this.map.addInteraction(drawCircle);
    }
};

/**
 * Event listener call when a new feature is created
 * @param evt
 */
ol.control.EditSubscribeRoom.prototype.drawEndFeature = function(evt)
{
    var feature = evt.feature;
    var features = [];

    if (undefined != olMap.state.zoneSubscriptionLayer && null != olMap.state.zoneSubscriptionLayer) {
        olMap.state.map.removeLayer(olMap.state.zoneSubscriptionLayer);
    }

    // Same as olMap.createZoneSubscription (TODO : factorise code source)
    var center = feature.getGeometry().getCenter();
    var radius = feature.getGeometry().getRadius();

    // Get radius in meters
    var edgeCoordinate = [center[0] + radius, center[1]];
    var wgs84Sphere = new ol.Sphere(6378137);
    var radiusInMeters = wgs84Sphere.haversineDistance(
        ol.proj.transform(center, Projection.projectionFrom, Projection.projectionTo),
        ol.proj.transform(edgeCoordinate, Projection.projectionFrom, Projection.projectionTo)
    );

    // Draw circle
    var circle = new ol.geom.Circle([center[0], center[1]], radius);

    features.push(new ol.Feature({
        geometry: new ol.geom.Polygon.fromCircle(circle, 128)
    }));

    var vectorSource = new ol.source.Vector({
        features: features
    });

    olMap.state.zoneSubscriptionLayer = new ol.layer.Vector({
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
    olMap.state.zoneSubscriptionLayer.setZIndex(10);
    // Ajout de la couche
    olMap.state.map.addLayer(olMap.state.zoneSubscriptionLayer);

    this.map.removeInteraction(this.drawCircle);

    // reprojection en WGS84
    var centerWgs84 = ol.proj.transform([center[0], center[1]], Projection.projectionFrom, Projection.projectionTo);

    olMap.state.distance = parseInt(radiusInMeters);
    olMap.state.coordinates = centerWgs84;

    kuzzleBridge.subscribeByGeoDistance(olMap.getSelectedLayer(), centerWgs84);
};


/**
 * Styles of selected layer
 */
ol.control.EditSubscribeRoom.prototype.styleAdd = function()
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


/**
 * Add a flag if Mode draw or not
 * @param flagDraw
 */
ol.control.EditSubscribeRoom.prototype.setFlagDraw = function(/** @type {boolean} */flagDraw)
{
    this.flagDraw = flagDraw;
};

ol.control.EditSubscribeRoom.prototype.getFlagDraw = function()
{
    return this.flagDraw;
};