import dataLayers from './dist/src/dataLayers';
import auth from './dist/services/auth'
import search from './dist/src/search';
// Load collections
dataLayers.listCollections();
// Load research
search.init();

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
document.querySelector('#mdlExportClose').addEventListener('click', function() {
    document.getElementById("divExport").classList.toggle("hidden");
}, false);

document.querySelector('a[data-link="logout"]').addEventListener('click', function() {
    console.log("Deconnexion")
    auth.logout();
});

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

/**
 * Form registration
 * @returns {string}
 */
var handleRegister = function(e)
{
    e.preventDefault();

    var formLogin = e.target.elements.newUsername.value;
    var formPassword = e.target.elements.newUserPass.value;
    var formEmail = e.target.elements.newUserEmail.value;

    // TODO : add email verification

    if (0 < formLogin.length
        && 0 < formPassword.length
        && 0 < formEmail.length
    ) {
        var tabNewUser = {
            username: formLogin,
            password: formPassword,
            email: formEmail
        };

        auth.registerNewUser(tabNewUser);
    }
};
var formRegister = document.forms['form-user-register'];
formRegister.addEventListener('submit', handleRegister, false);

/**
 * @returns {string}
 */
String.prototype.capitalizeFirstLetter = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
};

//Array.prototype.valueOf = function(){
//    console.log(JSON.stringify(this, null, '\t'));
//};

// https://www.dartdocs.org/documentation/mdl/1.15.2/mdlcomponents/mdlcomponents-library.html
// http://quaintous.com/2015/07/09/react-components-with-mdl/