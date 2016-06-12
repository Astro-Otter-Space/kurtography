import ol from 'openlayers';
import olMap from './openlayers';

ol.control.Export = function () {

    var divTarget = document.getElementById("external_control_zoom");
    var divElement = document.getElementById("panel");

    var button = document.createElement('button');
    button.setAttribute('title', 'Export datas');
    button.disabled = true;
    button.className = "mdl-button mdl-js-button mdl-button--fab mdl-js-ripple-effect mdl-button--mini-fab mdl-button--colored";

    var iLabel = document.createElement('i');
    iLabel.className = "material-icons";
    iLabel.innerHTML = "file_download";

    button.onclick = function (event) {
        event.preventDefault();

        document.getElementById('divExport').classList.toggle("hidden");
    };

    button.appendChild(iLabel);

    divElement.appendChild(button);

    ol.control.Control.call(this, {
        element: divElement,
        target: divTarget
    });

};

ol.inherits(ol.control.Export, ol.control.Control);