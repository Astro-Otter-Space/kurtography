import ol from 'openlayers';
import olMap from './openlayers';


ol.control.SubscribeZone = function(opt_options) {

    var options = this.options = opt_options || {};

    var divTarget = document.getElementById("mainRoom");
    var container = document.getElementById("subscribeZone");

    var form = document.createElement('form');
    form.type = 'POST';
    form.addEventListener('submit', this.editSubscribeZone, false);

    this.panel = document.createElement('div');
    this.panel.className = 'input-group form-control';

    form.appendChild(this.panel);
    container.appendChild(form);

    this.renderPanel();
    ol.control.Control.call(this, {
        element: container,
        target: divTarget
    });
};

ol.inherits(ol.control.SubscribeZone, ol.control.Control);

/**
 * Re-draw the layer panel to represent the current state of the layers.
 */
ol.control.SubscribeZone.prototype.renderPanel = function() {

    var tabValues = {
        'm':  'Meters',
        'km': 'Kilometers'
    };

    // Select
    var select = document.createElement('select');
    select.className = 'selectpicker form-control';
    select.id = 'zoneUnit';
    Object.keys(tabValues).forEach((value, key) => {
        var option = document.createElement("option");
        option.id = value;
        option.text = tabValues[value];
        if (value == this.options.defaultUnit) {
            option.setAttribute("selected", "selected")
        }
        select.add(option);
    });

    // Input
    var inputNumber = document.createElement('input');
    inputNumber.type = 'number';
    inputNumber.id = 'zoneRadius';
    inputNumber.className = 'form-control';
    inputNumber.min = 1;
    inputNumber.max = 10000;
    inputNumber.step = 10;
    inputNumber.value = this.options.distance;

    // Button
    var span = document.createElement('span');
    span.className = 'input-group-btn';

    var editZone = document.createElement('button');
    editZone.className = 'btn btn-default';
    editZone.type = 'submit';
    editZone.innerHTML = 'Edit';
    span.appendChild(editZone);

    this.panel.appendChild(select);
    this.panel.appendChild(inputNumber);
    this.panel.appendChild(span);

};

ol.control.SubscribeZone.prototype.editSubscribeZone = function(evt)
{
    evt.preventDefault();
    var objForm = new Object();
    Array.from(evt.target.elements).forEach(element => {
        if ("form-control" == element.className && "undefined" != element.type) {
            objForm[element.id] = element.value;
        }
    });
    console.log(objForm);

    // If chane, remove and rebuild the subscribe zone
    if (undefined != olMap.state.zoneSubscriptionLayer)
    {
        var newDistance = objForm.zoneRadius;
        olMap.state.distance = parseInt(newDistance);
        olMap.state.map.removeLayer(olMap.state.zoneSubscriptionLayer);
        olMap.createZoneSubscription(olMap.state.distance);
    }

};