import initBootstrap from './public/src/init-bootstrap'

jQuery(function(){
    jQuery('.sidebar-left .slide-submenu').on('click',function() {
        var thisEl = jQuery(this);
        thisEl.closest('.sidebar-body').fadeOut('slide',function(){
            jQuery('.mini-submenu-left').fadeIn();
            initBootstrap.applyMargins();
        });
    });

    jQuery('.mini-submenu-left').on('click',function() {
        var thisEl = jQuery(this);
        jQuery('.sidebar-left .sidebar-body').toggle('slide');
        thisEl.hide();
        initBootstrap.applyMargins();
    });

    jQuery(window).on("resize", initBootstrap.applyMargins);

    initBootstrap.applyInitialUIState();
    jQuery('.sidebar-left .slide-submenu').closest('.sidebar-body').fadeOut('slide',function(){
        jQuery('.mini-submenu-left').fadeIn();
        initBootstrap.applyMargins();
    });
});

import dataLayers from './public/src/dataLayers';
dataLayers.listCollections();

String.prototype.capitalizeFirstLetter = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
};

