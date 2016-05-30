import dataLayers from './dist/src/dataLayers';
dataLayers.listCollections();

// Liens
document.querySelector('a[data-link="auth"]').addEventListener('click', function() {
    document.getElementById("divAuth").classList.toggle("hidden");
}, false);


/**
 * Search request with result in autocompletion
 * @returns {string}
 */
var searchInput = document.querySelector('#kuzzleSearch');
import Awesomplete from 'awesomplete';
var awesomplete = new Awesomplete(searchInput, {
    maxItems: 10
});
searchInput.addEventListener('keyup', function(e) {
    // TODO : reset the list
    dataLayers.searchDocuments(e.target.value);
    awesomplete.list = dataLayers.state.rstAdvancedSearch
}, false);

// Hide cards
document.querySelector('#mdlAuthClose').addEventListener('click', function() {
    document.getElementById("divAuth").classList.toggle("hidden");
}, false);
document.querySelector('#mdlClose').addEventListener('click', function() {
    document.getElementById("infoKdoc").classList.toggle("hidden");
}, false);

// Listener Add document
var handleSubmit = function(e) {
    e.preventDefault();
    var objPropertiesFeature = new Array();
    var updFeature = dataLayers.getSource().getFeatureById(dataLayers.state.notNotifFeatureId);
    Array.from(e.target.elements).forEach(element => {
        if ("text" == element.type && "undefined" != element.type) {
            objPropertiesFeature[element.name] = element.value;
            updFeature.setProperties(objPropertiesFeature);
        }
    });
    document.getElementById("divAddDoc").classList.toggle("hidden");
    dataLayers.updatePropertiesDocument(updFeature);
};
var form = document.forms['form-edit-properties'];
form.addEventListener('submit', handleSubmit, false);




//$(function(){
//    $('form[name="formSearch"]').on('submit', function (e) {
//        e.preventDefault();
//    });
//    $('input[name="search"]').autocomplete({
//        source: function(request, response) {
//            dataLayers.searchDocuments(request.term);
//            if (dataLayers.state.rstAdvancedSearch) {
//                response(dataLayers.state.rstAdvancedSearch);
//            }
//        },
//        minLength: 2,
//        open: function(event, ui) {
//            $(".ui-autocomplete").css("z-index", 10000);
//        },
//        select: function(event, ui)
//        {
//            dataLayers.setCenterKuzzleDoc(ui.item.id);
//        }
//    });
//});

String.prototype.capitalizeFirstLetter = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
};

Array.prototype.valueOf = function(){
    console.log(JSON.stringify(this, null, '\t'));
};