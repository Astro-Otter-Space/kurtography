import dataLayers from './public/src/dataLayers';
dataLayers.listCollections();

/**
 * Ajax request for search
 * @returns {string}
 */
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