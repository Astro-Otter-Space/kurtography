import ol from 'openlayers';
import olMap from './openlayers';

ol.control.ResetPosition = function () {

    var divTarget = document.getElementById("external_control_zoom");
    var divElement = document.getElementById("panel");

    var button = document.createElement('button');
    button.setAttribute('title', 'Set to position');
    button.className = "mdl-button mdl-js-button mdl-button--fab mdl-js-ripple-effect mdl-button--mini-fab mdl-button--colored";

    var iLabel = document.createElement('i');
    iLabel.className = "material-icons";
    iLabel.innerHTML = "my_location";

    button.onclick = function (event) {
        event.preventDefault();

        var lon = olMap.geolocation.getPosition()[0];
        var lat = olMap.geolocation.getPosition()[1];

        var pointCenter = new ol.geom.Point([lon, lat]).transform(olMap.state.projectionTo, olMap.state.projectionFrom).getCoordinates();
        olMap.state.map.getView().setCenter(pointCenter);
    };

    button.appendChild(iLabel);

    divElement.appendChild(button);

    ol.control.Control.call(this, {
        element: divElement,
        target: divTarget
    });

};

ol.inherits(ol.control.ResetPosition, ol.control.Control);