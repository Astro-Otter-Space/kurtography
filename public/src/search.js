// https://shellmonger.com/2015/03/24/promises-and-ajax-in-ecmascript-6/
// http://code.runnable.com/U_My8wwAYYJ8Oj_0/ajax-server-for-express-and-node-js
import dataLayers from './dataLayers';

let xhr = new XMLHttpRequest();

export default {

    state: {
        type: "POST",
        url: "search",
        sync: true,
        data: null,
    },

    init(searchItem)
    {
        // Create Datas
        this.state.data = JSON.stringify({ "search" : searchItem });

        // Prepare request
        xhr.open(this.state.type, this.state.url, this.state.sync);
        xhr.onreadystatechange = function (aEvt) {
            if (xhr.readyState == 4) {
                if(xhr.status == 200)
                    dump(xhr.responseText);
                else
                    console.error("Erreur pendant le chargement de la page.\n");
            }
        };
        xhr.setRequestHeader('Content-type', 'application/json');

        // Sending request
        // TODO : how to call anonymous function
        xhr.send(this.state.data);
    },


    done()
    {
        dataLayers.searchDocuments();
    }
}