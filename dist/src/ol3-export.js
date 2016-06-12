import ol from 'openlayers';
import olMap from './openlayers';

ol.control.Export = function () {

    var this_ = this;

    var divTarget = document.getElementById("external_control_zoom");
    var divElement = document.getElementById("panel");

    // Create button control on map
    var button = document.createElement('button');
    button.setAttribute('title', 'Export datas');
    button.id = "export_datas";
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

    // Radio listener
    var handleChangeType = this.handleChangeType = function(e) {
        e = e || window.event;

        var type = e.target.value;
        var linkExport = this_.createLinkExport(type);

        document.getElementById('linkExport').setAttribute('href', linkExport);
        document.getElementById('linkExport').removeAttribute('disabled');
        e.preventDefault();
    };

    var exportList = document.getElementsByName('export');
    Array.filter(exportList, radio => {
        radio.addEventListener('change', this.handleChangeType, false);
    });

    ol.control.Control.call(this, {
        element: divElement,
        target: divTarget
    });

};

ol.inherits(ol.control.Export, ol.control.Control);

ol.control.Export.prototype.createLinkExport = function(typeExport) {

    var serialized = "export";
    var tabParams = {
        type: typeExport,
        layer: olMap.getSelectedLayer().get('title')
    };

    var serialiseObject = function(obj) {
        var pairs = [];
        for (var prop in obj) {
            if (!obj.hasOwnProperty(prop)) {
                continue;
            }
            pairs.push('/' + encodeURIComponent(obj[prop]));
        }
        return pairs.join('');
    };

    serialized += serialiseObject(tabParams);
    return serialized;
};