// https://www.dartdocs.org/documentation/mdl/1.15.2/mdlcomponents/mdlcomponents-library.html
// https://code.getmdl.io/1.1.3/material.js
// http://quaintous.com/2015/07/09/react-components-with-mdl/
import dataLayers from './dist/src/dataLayers';
import auth from './dist/services/auth'
dataLayers.listCollections();

// Connexion/register links
document.querySelector('a[data-link="auth"]').addEventListener('click', function() {
    //document.querySelector('.mdl-layout__drawer').classList.toggle('is-visible');
    //document.querySelector('.mdl-mdl-layout__obfuscator').classList.toggle('is-visible');
    document.getElementById("divAuth").classList.toggle("hidden");
}, false);

document.querySelector('a[data-link="register"]').addEventListener('click', function() {
    //document.querySelector('.mdl-layout__drawer').classList.toggle('is-visible');
    //document.querySelector('.mdl-mdl-layout__obfuscator').classList.toggle('is-visible');
    //document.querySelector('.mdl-layout__drawer').setAttribute('aria-hidden', true);
    document.getElementById("divRegister").classList.toggle("hidden");
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

// Event listener on select list
window.addEventListener("awesomplete-select", function(e){
    var idFeature = e.text.value;
    dataLayers.setCenterKuzzleDoc(idFeature);
    e.preventDefault();
}, false);

searchInput.addEventListener('keyup', function(e) {
    // TODO : reset the list
    dataLayers.searchDocuments(e.target.value);
    awesomplete.list = dataLayers.state.rstAdvancedSearch
}, false);

// Hide cards
document.querySelector('#mdlAuthClose').addEventListener('click', function() {
    document.getElementById("divAuth").classList.toggle("hidden");
}, false);
document.querySelector('#mdlRegisterClose').addEventListener('click', function() {
    document.getElementById("divRegister").classList.toggle("hidden");
}, false);
document.querySelector('#mdlClose').addEventListener('click', function() {
    document.getElementById("infoKdoc").classList.toggle("hidden");
}, false);
document.querySelector('#mdlChoiceClose').addEventListener('click', function() {
    document.getElementById("divTrackingChoice").classList.toggle("hidden");
}, false);


/**
 * Form Adding Properties
 * @param e
 */
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

/**
 * Form Authentification
 * @returns {string}
 */
var handleConnexion = function(e)
{
    e.preventDefault();

    var login = e.target.elements.userkuzzlename.value;
    var password = e.target.elements.userkuzzlepass.value;

    auth.login(login, password);
};
var formAuth = document.forms['form-user-authentification'];
formAuth.addEventListener('submit', handleConnexion, false);

String.prototype.capitalizeFirstLetter = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
};

//Array.prototype.valueOf = function(){
//    console.log(JSON.stringify(this, null, '\t'));
//};