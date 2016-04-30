import dataLayers from './public/src/dataLayers';
dataLayers.listCollections();

/**
 * Ajax request for search
 * @returns {string}
 */
jQuery(function(){
    jQuery('form[name="formSearch"]').on('keyup', function(e){
        if(3 <= e.target.value.length) {
            dataLayers.searchDocuments(e.target.value);
        }
    });
});
/**
 * Initialisation Bootstrap
 */
import initBootstrap from './public/src/init-bootstrap';
import 'bootstrap-toggle';
jQuery(function(){
//    jQuery('.sidebar-right .slide-submenu').on('click',function() {
//        var thisEl = jQuery(this);
//        thisEl.closest('.sidebar-body').fadeOut('slide',function(){
//            jQuery('.mini-submenu-right').fadeIn();
//            initBootstrap.applyMargins();
//        });
//    });

    jQuery('.mini-submenu-right').on('click',function() {
        var thisEl = jQuery(this);
        jQuery('.sidebar-right .sidebar-body').toggle('slide');
        thisEl.hide();
        initBootstrap.applyMargins();
    });

    jQuery(window).on("resize", initBootstrap.applyMargins);

    initBootstrap.applyInitialUIState();
    //jQuery('.sidebar-right .slide-submenu').closest('.sidebar-body').fadeOut('slide',function(){
    //    jQuery('.mini-submenu-right').fadeIn();
    //    initBootstrap.applyMargins();
    //});

    $('#toggle-properties').bootstrapToggle({
        on: 'Read',
        off: 'Edit'
    });
    $('#toggle-properties').on('change', function() {
        if ($(this).is(':checked')) {
            $('span.properties-read').hide();
            $('span.properties-read').attr('disabled', true);
            $('.properties-edit').show();
            $('input[type="text"].properties-edit').removeAttr('disabled');
        } else {
            $('.properties-edit').hide();
            $('input[type="text"].properties-edit').attr('disabled', true);
            $('span.properties-read').show();
            $('span.properties-read').removeAttr('disabled');
        }
    });
});



String.prototype.capitalizeFirstLetter = function() {
    return this.charAt(0).toUpperCase() + this.slice(1);
};

