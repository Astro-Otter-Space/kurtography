import ol from 'openlayers';
import olMap from './openlayers';

// PROBLEM : why I don't have the this context in ol.control.ZoomUiButtons.prototype.myFunction_ ?

/**
 *
 * @param opt_options
 * @constructor
 */
ol.control.ZoomUiButtons = function () {

    var this_ = this;

    var delta = this.delta = 1;
    var duration = this.duration_ = 250;

    var divTarget = document.getElementById("external_control_zoom");
    var divElement = document.getElementById("panel");

    var buttonIn = document.createElement('button');
    buttonIn.setAttribute('title', 'Zoom in');
    buttonIn.className = "mdl-button mdl-js-button mdl-button--fab mdl-js-ripple-effect mdl-button--mini-fab mdl-button--colored";
    buttonIn.onclick = function (event) {
        event.preventDefault();
        this_.zoomByDelta_(delta);
    };

    var iIn = document.createElement('i');
    iIn.className = "material-icons";
    iIn.innerHTML = "add";

    var buttonOut = document.createElement('button');
    buttonOut.setAttribute('title', 'Zoom out');
    buttonOut.className = "mdl-button mdl-js-button mdl-button--fab mdl-js-ripple-effect mdl-button--mini-fab mdl-button--colored";
    buttonOut.onclick = function (event) {
        event.preventDefault();
        this_.zoomByDelta_(-delta);
    };

    var iOut = document.createElement('i');
    iOut.className = "material-icons";
    iOut.innerHTML = "remove";

    buttonIn.appendChild(iIn);
    buttonOut.appendChild(iOut);

    divElement.appendChild(buttonIn);
    divElement.appendChild(buttonOut);

    ol.control.Control.call(this, {
        element: divElement,
        target: divTarget
    });
};

ol.inherits(ol.control.ZoomUiButtons, ol.control.Control);



/**
 * @param {number} delta Zoom delta.
 * @private
 */
ol.control.ZoomUiButtons.prototype.zoomByDelta_ = function(delta) {
    var map = /*(undefined != this.getMap()) ?*/ olMap.state.map /* : this.getMap()*/;
    var view = map.getView();
    if (!view) {
        // the map does not have a view, so we can't act
        // upon it
        var view = olMap.state.view;
        //return;
    }
    var currentResolution = view.getResolution();
    if (currentResolution) {
        if (this.duration_ > 0) {
            map.beforeRender(ol.animation.zoom({
                resolution: currentResolution,
                duration: ol.control.ZoomUiButtons.duration_,
                easing: ol.easing.easeOut
            }));
        }
        var newResolution = view.constrainResolution(currentResolution, delta);
        view.setResolution(newResolution);
    }
};
//
//ol.control.ZoomUiButtons.prototype.handleClick_ = function(event, delta) {
//    this.zoomByDelta_(delta);
//};
