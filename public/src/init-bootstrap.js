function applyMargins() {
    var leftToggler = jQuery(".mini-submenu-left");
    if (leftToggler.is(":visible")) {
        jQuery("#map .ol-zoom")
            .css("margin-left", 0)
            .removeClass("zoom-top-opened-sidebar")
            .addClass("zoom-top-collapsed");
    } else {
        jQuery("#map .ol-zoom")
            .css("margin-left", jQuery(".sidebar-left").width())
            .removeClass("zoom-top-opened-sidebar")
            .removeClass("zoom-top-collapsed");
    }
}

function isConstrained() {
    return jQuery(".sidebar").width() == jQuery(window).width();
}

function applyInitialUIState() {
    if (isConstrained()) {
        jQuery(".sidebar-left .sidebar-body").fadeOut('slide');
        jQuery('.mini-submenu-left').fadeIn();
    }
}

jQuery(function(){
    jQuery('.sidebar-left .slide-submenu').on('click',function() {
        var thisEl = jQuery(this);
        thisEl.closest('.sidebar-body').fadeOut('slide',function(){
            jQuery('.mini-submenu-left').fadeIn();
            applyMargins();
        });
    });

    jQuery('.mini-submenu-left').on('click',function() {
        var thisEl = jQuery(this);
        jQuery('.sidebar-left .sidebar-body').toggle('slide');
        thisEl.hide();
        applyMargins();
    });

    jQuery(window).on("resize", applyMargins);


    applyInitialUIState();
    applyMargins();
});