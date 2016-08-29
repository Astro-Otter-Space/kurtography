import Awesomplete from 'awesomplete';
import kuzzleBridge from './kuzzleBridge';

/**
 * Search request with result in autocompletion
 * @returns {string}
 */
export default {

    init()
    {
        var searchInput = document.querySelector('#kuzzleSearch');
        var awesomplete = new Awesomplete(searchInput, {
            maxItems: 10
        });

        // Event listener on select list
        window.addEventListener("awesomplete-select", function(e){
            var idFeature = e.text.value;
            kuzzleBridge.setCenterKuzzleDoc(idFeature);
            e.preventDefault();
        }, false);

        searchInput.addEventListener('keyup', function(e) {
            // TODO : reset the list
            kuzzleBridge.searchDocuments(e.target.value);
            awesomplete.list = kuzzleBridge.state.rstAdvancedSearch
        }, false);
    },

}