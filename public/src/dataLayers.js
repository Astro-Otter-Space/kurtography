import kuzzle from '../services/kuzzle'
import Config from '../services/config'

//let subscription = null;

export default {

    state: {
        tabLayersKuzzle: []
    },

    /**
     * List collections (layers)
     * @returns {*|Object}
     */
    listCollections () {

        var this_ = this;
        var tabStyles = this.olMap.getStylesFeatures();

        // Ex avec Mock : https://github.com/HamHamFonFon/kurtogaphy/blob/827b82fdfda3dc2d918fd44cbfd0fca3223a8ef5/public/src/openlayers.js
        kuzzle.listCollections(Config.defaultIndex, { type: "stored" }, function (err, collections) {
            if(!err) {
                collections.stored.forEach(function(iLayer, layer) {

                    // Retrieve data from each layer
                    kuzzle.dataCollectionFactory(iLayer).fetchAllDocuments(function (err, result) {
                        // result is an object containing the total number of documents
                        // and an array of KuzzleDocument objects
                        if (!err && result.total > 0) {
                            // Retrieve content
                            var dataGeoJSON = {
                                "type": "FeatureCollection",
                                "features": []
                             };
                            result.documents.forEach(function(kDoc, n) {
                                dataGeoJSON.features.push(kDoc.content);
                            });

                            // Construction of geoDatas from content
                            var kGeoJSON =  new ol.format.GeoJSON().readFeatures(dataGeoJSON, { featureProjection: 'EPSG:3857' });
                            var kSource = new ol.source.Vector({ features: kGeoJSON, wrapX: false });

                            var kuzzleLayerVector = new ol.layer.Vector({
                                source: kSource,
                                title: i,
                                type: 'base',
                                visible: false,
                                style: function(feature, resolution) {
                                    return tabStyles[feature.getGeometry().getType()];
                                }
                            });
                            console.log("Push de " + kuzzleLayerVector.get('title') + " dans tabLayersKuzzle[]");
                            this_.state.tabLayersKuzzle.push(kuzzleLayerVector);

                        } else if(err) {
                            console.log(err.message);
                        }
                    });
                });

            } else {
                console.log(err.message);
            }
        });
    },

};
exports.kuzzleManager = kuzzleManager;