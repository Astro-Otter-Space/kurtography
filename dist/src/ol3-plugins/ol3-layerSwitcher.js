import ol from 'openlayers'
import olMap from './../openlayers'
/**
 * OpenLayers 3 Layer Switcher Control.
 * See [the examples](./examples) for usage.
 * @constructor
 * @extends {ol.control.Control}
 * @param {Object} opt_options Control options, extends olx.control.ControlOptions adding:
 *                              **`tipLabel`** `String` - the button tooltip.
 */
ol.control.LayerSwitcher = function(opt_options) {

    var this_ = this;
    var options = opt_options || {};
    var tipLabel = options.tipLabel ? options.tipLabel : 'Legend';

    this.mapListeners = [];
    var element = this.element = document.getElementById("layers");

    //ol.control.LayerSwitcher.enableTouchScroll_(this.panel);

    var divTarget = document.getElementById("mainLayer");

    ol.control.Control.call(this, {
        element: element, //element,
        target: divTarget //options.target
    });

};

ol.inherits(ol.control.LayerSwitcher, ol.control.Control);

/**
 * Re-draw the layer panel to represent the current state of the layers.
 */
ol.control.LayerSwitcher.prototype.renderPanel = function() {

    this.ensureTopVisibleBaseLayerShown_();

    while(this.element.firstChild) {
        this.element.removeChild(this.element.firstChild);
    }

    this.renderLayers_(this.getMap(), this.element);
};

/**
 * Set the map instance the control is associated with.
 * @param {ol.Map} map The map instance.
 */
ol.control.LayerSwitcher.prototype.setMap = function(map) {
    // Clean up listeners associated with the previous map
    for (var i = 0, key; i < this.mapListeners.length; i++) {
        this.getMap().unByKey(this.mapListeners[i]);
    }
    this.mapListeners.length = 0;
    // Wire up listeners etc. and store reference to new map
    ol.control.Control.prototype.setMap.call(this, map);
    if (map) {
        var this_ = this;
        this.renderPanel();
    }
};

/**
 * Ensure only the top-most base layer is visible if more than one is visible.
 * @private
 */
ol.control.LayerSwitcher.prototype.ensureTopVisibleBaseLayerShown_ = function() {
    var lastVisibleBaseLyr;
    ol.control.LayerSwitcher.forEachRecursive(this.getMap(), function(l, idx, a) {
        if (l.get('type') === 'overlays' && l.getVisible()) {
            lastVisibleBaseLyr = l;
        }
    });
    if (lastVisibleBaseLyr) this.setVisible_(lastVisibleBaseLyr, true);
};

/**
 * Toggle the visible state of a layer.
 * Takes care of hiding other layers in the same exclusive group if the layer
 * is toggle to visible.
 * @private
 * @param {ol.layer.Base} The layer whos visibility will be toggled.
 */
ol.control.LayerSwitcher.prototype.setVisible_ = function(lyr, visible) {
    var map = this.getMap();
    lyr.setVisible(visible);

    if (visible && lyr.get('type') === 'overlays') {
        // Show all other base layers regardless of grouping
        ol.control.LayerSwitcher.forEachRecursive(map, function(l, idx, a) {
            if (l != lyr && l.get('type') === 'overlays') {
                l.setVisible(true);
            }
        });

    } else if (visible && lyr.get('type') === 'base'){
        ol.control.LayerSwitcher.forEachRecursive(map, function(l, idx, a) {
            if (l != lyr && l.get('type') === 'base') {
                l.setVisible(false);
            }
        });
    }
};

/**
 * Render all layers that are children of a group.
 * @private
 * @param {ol.layer.Base} lyr Layer to be rendered (should have a title property).
 * @param {Number} idx Position in parent group list.
 */
ol.control.LayerSwitcher.prototype.renderLayer_ = function(lyr) {

    var this_ = this;

    if (lyr.getLayers) {
        this.renderLayers_(lyr, this.element);
    } else {

        var li = document.createElement('li');
        li.className = "mdl-list__item";

        var lyrTitle = document.createTextNode(lyr.get('title'));
        var lyrId = lyr.get('title').replace(/\s+/g, '-');


        var spanFirst = document.createElement('span');
        spanFirst.className = "mdl-list__item-primary-content";


        if ('base' === lyr.get('type') || 'overlays' === lyr.get('type')) {

            if ('base' === lyr.get('type')) {
                //iLabel.innerHTML = "layers";
                var labelSwitch = document.createElement('i');
                labelSwitch.className = "material-icons mdl-list__item-icon";
                labelSwitch.innerHTML = "public";

            } else if ('overlays' === lyr.get('type')) {
                // Switch + label
                var labelSwitch = document.createElement('label');
                labelSwitch.className = "mdl-switch mdl-js-switch mdl-js-ripple-effect";
                labelSwitch.setAttribute('for', 'show_' + lyrId);

                var inputSwitch = document.createElement('input');
                inputSwitch.type = 'checkbox';
                inputSwitch.name = lyr.get('type');
                inputSwitch.className = "mdl-switch__input";
                inputSwitch.id = 'show_' + lyrId;
                inputSwitch.value = 'show_' + lyrId;

                inputSwitch.onchange = function(e) {
                    this_.setVisible_(lyr, e.target.checked);
                };

                var spanSwitch = document.createElement('span');
                spanSwitch.className = "mdl-switch__label";
                spanSwitch.appendChild(lyrTitle);

                labelSwitch.appendChild(inputSwitch);
                labelSwitch.appendChild(spanSwitch);
            }

            // Input Radio
            var spanInput = document.createElement('span');
            spanInput.className = "mdl-list__item-secondary-action";

            var labelInputRadio = document.createElement('label');
            labelInputRadio.className = "inline-list-radio mdl-radio mdl-js-radio mdl-js-ripple-effect";
            labelInputRadio.setAttribute("for", lyrId);

            var inputRadio = document.createElement('input');
            inputRadio.type = 'radio';
            inputRadio.name = lyr.get('type');
            inputRadio.className = "mdl-radio__button";
            inputRadio.id = lyrId;
            inputRadio.value = lyrId;

            // TODO : visibility is set to switcher, inputRadio is only use for selected layer
            if ('base' === lyr.get('type')) {
                inputRadio.checked = lyr.get('visible');
                inputRadio.onchange = function(e) {
                    this_.setVisible_(lyr, e.target.checked);
                };
            } else {
                inputRadio.onchange = function(e) {
                    olMap.setEventsSelectedLayer(lyr, null, false);
                };
            }


            labelInputRadio.appendChild(inputRadio);
            spanInput.appendChild(labelInputRadio);

        } else {
            labelSwitch.innerHTML = "public";
        }

        spanFirst.appendChild(labelSwitch);
        if ('base' === lyr.get('type')) {
            spanFirst.appendChild(lyrTitle);
        }

        li.appendChild(spanFirst);
        if (undefined != spanInput){
            li.appendChild(spanInput);
            componentHandler.upgradeElements(li);
        }

        return li;
    }
};

/**
 * Render all layers that are children of a group.
 * @private
 * @param {ol.layer.Group} lyr Group layer whos children will be rendered.
 * @param {Element} elm DOM element that children will be appended to.
 */
ol.control.LayerSwitcher.prototype.renderLayers_ = function(lyr, elm) {
    var lyrs = lyr.getLayers().getArray().slice().reverse();
    for (var i = 0, l; i < lyrs.length; i++) {
        l = lyrs[i];
        if (l.get('title') && 'hidden' != l.get('type')) {
            var linkLayer = this.renderLayer_(l);
            if (undefined != linkLayer) {
                elm.appendChild(linkLayer);
            }
        }
    }
};

/**
 * **Static** Call the supplied function for each layer in the passed layer group
 * recursing nested groups.
 * @param {ol.layer.Group} lyr The layer group to start iterating from.
 * @param {Function} fn Callback which will be called for each `ol.layer.Base`
 * found under `lyr`. The signature for `fn` is the same as `ol.Collection#forEach`
 */
ol.control.LayerSwitcher.forEachRecursive = function(lyr, fn) {

    lyr.getLayers().forEach(function(lyr, idx, a) {
        fn(lyr, idx, a);
        if (lyr.getLayers) {
            ol.control.LayerSwitcher.forEachRecursive(lyr, fn);
        }
    });
};

/**
 * @private
 * @desc Apply workaround to enable scrolling of overflowing content within an
 * element. Adapted from https://gist.github.com/chrismbarr/4107472
 */
ol.control.LayerSwitcher.enableTouchScroll_ = function(elm) {
    if(ol.control.LayerSwitcher.isTouchDevice_()){
        var scrollStartPos = 0;
        elm.addEventListener("touchstart", function(event) {
            scrollStartPos = this.scrollTop + event.touches[0].pageY;
        }, false);
        elm.addEventListener("touchmove", function(event) {
            this.scrollTop = scrollStartPos - event.touches[0].pageY;
        }, false);
    }
};

/**
 * @private
 * @desc Determine if the current browser supports touch events. Adapted from
 * https://gist.github.com/chrismbarr/4107472
 */
ol.control.LayerSwitcher.isTouchDevice_ = function() {
    try {
        document.createEvent("TouchEvent");
        return true;
    } catch(e) {
        return false;
    }
};
