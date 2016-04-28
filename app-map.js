import dataLayers from './public/src/dataLayers';
dataLayers.listCollections();

/**
 * Initialisation Bootstrap
 */
import initBootstrap from './public/src/init-bootstrap'
jQuery(function(){
    jQuery('.sidebar-right .slide-submenu').on('click',function() {
        var thisEl = jQuery(this);
        thisEl.closest('.sidebar-body').fadeOut('slide',function(){
            jQuery('.mini-submenu-right').fadeIn();
            initBootstrap.applyMargins();
        });
    });

    jQuery('.mini-submenu-right').on('click',function() {
        var thisEl = jQuery(this);
        jQuery('.sidebar-right .sidebar-body').toggle('slide');
        thisEl.hide();
        initBootstrap.applyMargins();
    });

    jQuery(window).on("resize", initBootstrap.applyMargins);

    initBootstrap.applyInitialUIState();
    jQuery('.sidebar-right .slide-submenu').closest('.sidebar-body').fadeOut('slide',function(){
        jQuery('.mini-submenu-right').fadeIn();
        initBootstrap.applyMargins();
    });
});

/**
 * Ajax request for search
 * TODO :
 * @returns {string}
 */
import search from './public/src/search.js';
jQuery(function(){
    jQuery('form[name="formSearch"]').on('keyup', function(e){
        if(3 >= e.target.value.length) {
            search.init(e.target.value);
        }
    });
});

String.prototype.capitalizeFirstLetter = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
};

