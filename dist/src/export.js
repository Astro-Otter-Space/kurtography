// http://ogre.adc4gis.com/
// https://github.com/wavded/ogre/blob/master/index.js
// https://github.com/wavded/ogr2ogr/blob/master/test/drivers-test.js

import kuzzle from 'kuzzle'
import ogr2ogr from 'ogr2ogr';

export default {

    state: {
        type: null,
        collection: null,
        dataGeoJson: null
    },

    /**
     *
     * @param datas
     */
    exportDatasKuzzle(datas)
    {
        var this_ = this;

        this.state.type = datas.type;
        this.state.collection = data.collection;

        kuzzle.dataCollectionFactory(collection).fetchAllDocuments(function(err, res) {
            if (!err) {
                var result = [];
                if(res.total > 0) {
                    res.documents.forEach(function (kDoc, index) {
                        // Push document identifier in feature data
                        kDoc.content.id = kDoc.id;
                        result.push(kDoc.content);
                    });
                }

                var dataGeoJSON = {
                    "type": "FeatureCollection",
                    "features": result
                };


                this.state.dataGeoJson = dataGeoJSON;
                console.log(this.state.dataGeoJson);
            } else {
                console.error(err);
            }
        });

    },

    export()
    {
        console.log(type);
    }

}