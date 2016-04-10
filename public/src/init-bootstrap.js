import $ from 'jquery';
import jQuery from 'jquery';
window.$ = $;
window.jQuery = jQuery;

export default {

    applyMargins() {
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
    },

    isConstrained() {
        return jQuery(".sidebar").width() == jQuery(window).width();
    },

    applyInitialUIState() {
        if (this.isConstrained()) {
            jQuery(".sidebar-left .sidebar-body").fadeOut('slide');
            jQuery('.mini-submenu-left').fadeIn();
        }
    },

}

