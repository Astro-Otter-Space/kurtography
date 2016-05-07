import ol from 'openlayers';
import olMap from './openlayers';


ol.control.SubscribeZone = function(opt_options) {

    var options = this.options = opt_options || {};
    var unity = this.unity = 'm';

    var divTarget = document.getElementById("mainRoom");
    var container = document.getElementById("subscribeZone");

    //var form = document.createElement('form');
    //form.type = 'POST';
    //form.addEventListener('submit', this.editSubscribeZone, false);

    this.panel = document.createElement('div');
    this.panel.className = 'input-group form-control';

    //form.appendChild(this.panel);
    container.appendChild(this.panel);

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

    var this_ = this;
    var tabValues = {
        'm':  'Meters',
        'km': 'Kilometers'
    };

    // Input
    var divNumber = document.createElement('div');
    divNumber.className = 'input-group-btn';

    var btnSelect = document.createElement('button');
    btnSelect.type = 'button'
    btnSelect.className = 'btn btn-default dropdown-toggle';
    btnSelect.setAttribute("data-toggle", "dropdown");
    btnSelect.setAttribute("aria-haspopup", "true");
    btnSelect.setAttribute("aria-expanded", "false");
    btnSelect.innerHTML = 'Unit <span class="caret"></span>';

    var ulSelect = document.createElement('ul');
    ulSelect.className = 'dropdown-menu';
    ulSelect.addEventListener('click', function(e) {
        this_.unity = e.target.dataset.id;
        var distance = document.getElementById('zoneRadius').value;

        if (undefined != olMap.state.zoneSubscriptionLayer)
        {
            var newDistance = ('km' == this_.unity) ? distance/1000 : distance*1000;
            var lblDistance = distance + ' ' + this_.unity;

            olMap.state.distance = parseInt(newDistance);
            olMap.state.map.removeLayer(olMap.state.zoneSubscriptionLayer);
            olMap.createZoneSubscription(olMap.state.distance);

            document.getElementById('valueDistance').innerHTML = lblDistance;

        }
    }, false);

    Object.keys(tabValues).forEach((value, key) => {
        var li = document.createElement("li");
        var a = document.createElement("a");
        a.innerHTML = tabValues[value];
        a.setAttribute('data-id', value);
        li.appendChild(a);
        ulSelect.appendChild(li);
    });

    divNumber.appendChild(btnSelect);
    divNumber.appendChild(ulSelect);

    //divNumber.appendChild(select);

    var inputNumber = document.createElement('input');
    inputNumber.type = 'range';
    inputNumber.id = 'zoneRadius';
    inputNumber.className = 'form-control';
    inputNumber.min = 1;
    inputNumber.max = 10000;
    inputNumber.value = this.options.distance;
    inputNumber.addEventListener('change', function(evt) {
        evt.preventDefault();

        // If chane, remove and rebuild the subscribe zone
        if (undefined != olMap.state.zoneSubscriptionLayer)
        {
            var distance = evt.target.value;
            console.log('Unity change slider : ' + this_.unity);
            var newDistance = ('km' == this_.unity)? distance*1000 : distance;
            var lblDistance = distance + ' ' + this_.unity;

            olMap.state.distance = parseInt(newDistance);
            olMap.state.map.removeLayer(olMap.state.zoneSubscriptionLayer);
            olMap.createZoneSubscription(olMap.state.distance);

            document.getElementById('valueDistance').innerHTML = lblDistance;
        }
    }, false);

    var valueNumber = document.createElement('span');
    valueNumber.className = 'input-group-addon';
    valueNumber.id = 'valueDistance';
    valueNumber.innerHTML = this.options.distance + ' ' + this.unity;

    //this.panel.appendChild(divNumber);
    this.panel.appendChild(divNumber);
    this.panel.appendChild(inputNumber);
    this.panel.appendChild(valueNumber);
};