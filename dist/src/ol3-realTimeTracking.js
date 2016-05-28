import ol from 'openlayers';
import olMap from './openlayers';

ol.control.RealTimeTracking = function () {

    var divTarget = document.getElementById("external_control_zoom");
    var divElement = document.getElementById("panel");

    var button = document.createElement('button');
    button.setAttribute('title', 'Real-time tracking');
    button.setAttribute('disabled', 'disabled');
    button.className = "mdl-button mdl-js-button mdl-button--fab mdl-js-ripple-effect mdl-button--mini-fab mdl-button--colored";

    var iLabel = document.createElement('i');
    iLabel.className = "material-icons";
    iLabel.innerHTML = "directions_run";

    // Listener tracking
    this.handleTracking = function(e) {
        e = e || window.event;

    };
    button.addEventListener('click', this.handleTracking(), false);

    button.appendChild(iLabel);
    divElement.appendChild(button);

    ol.control.Control.call(this, {
        element: divElement,
        target: divTarget
    });

};

ol.inherits(ol.control.RealTimeTracking, ol.control.Control);