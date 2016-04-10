import kuzzle from '../services/kuzzle'
import Config from '../services/config'
import ol from 'openlayers';
import olMap from './openlayers'

let subscription = null;

export default {

    state: {
        tabLayersKuzzle: [],
        collections: []
    },

    /**
     * List collections (layers)
     * @returns {*|Object}
     */
    listCollections() {
        var this_ = this;
        var tabStyles = olMap.getStylesFeatures();

        // Ex avec Mock : https://github.com/HamHamFonFon/kurtogaphy/blob/827b82fdfda3dc2d918fd44cbfd0fca3223a8ef5/public/src/openlayers.js
        kuzzle.listCollections(Config.defaultIndex, { type: "all"}, function (err, collections) {
            if (!err) {
                this_.state.collections.push(collections.stored);



                olMap.initMap(13, collections.stored);
                //collections.stored.forEach(function(iLayer, layer) {
                //
                //    // Retrieve data from each layer
                //    kuzzle.dataCollectionFactory(iLayer).fetchAllDocuments(function (err, result) {
                //        // result is an object containing the total number of documents
                //        // and an array of KuzzleDocument objects
                //        if (!err && result.total > 0) {
                //            // Retrieve content
                //            var dataGeoJSON = {
                //                "type": "FeatureCollection",
                //                "features": []
                //             };
                //            result.documents.forEach(function(kDoc, n) {
                //                dataGeoJSON.features.push(kDoc.content);
                //            });
                //
                //            // Construction of geoDatas from content
                //            var kGeoJSON =  new ol.format.GeoJSON().readFeatures(dataGeoJSON, { featureProjection: 'EPSG:3857' });
                //            var kSource = new ol.source.Vector({ features: kGeoJSON, wrapX: false });
                //
                //            var kuzzleLayerVector = new ol.layer.Vector({
                //                source: kSource,
                //                title: iLayer,
                //                type: 'base',
                //                visible: false,
                //                style: function(feature, resolution) {
                //                    //return tabStyles[feature.getGeometry().getType()];
                //                }
                //            });
                //            this_.state.tabLayersKuzzle.push(kuzzleLayerVector);
                //
                //        } else if(err) {
                //            console.log(err.message);
                //        }
                //    });
                //});

            } else {
                console.log(err.message);
            }
        });
    },

    /**
     * Retrieve datas from collections
     * @param collection
     */
    loadDatasFromCollection(collection)
    {
        kuzzle.dataCollectionFactory(collection).fetchAllDocuments(function(err, res) {
            if (!err && res.total > 0) {
                console.log(res.total);
            } else {
                console.log(err.message);
            }
        });

    },

    /**
     * Add document to Collection
     */
    addDocument(datas, layer)
    {

        var datas = {
            "type": "Feature",
            "properties": datas['properties'],
            "geometry": {
                "type": datas['type'],
                "coordinates": [datas['coords']]
            }
        };

        kuzzle.dataCollectionFactory(layer).createDocument(datas);
        // Rechargement de la couche ?
    },

    /**
     * Delete document from Kuzzle
     * @param idDocument
     * @param layer
     * @returns {boolean}
     */
    deleteDocument(idDocument, layer)
    {
        if (!idDocument) {
            console.log("Delete document error, no id document");
            return false;
        }

        kuzzle.dataCollectionFactory(layer).deleteDocument(idDocument, (err, res) => {
            if (err) {
                console.error(err);
            } else {
                // TODO rechargement de la map ?
            }
        });
    },

    /**
     * Update datas from documents
     */
    updateDocument ()
    {

    },

    /**
     * Subscribe to item from currentPosition with a radius specified by distance
     * @param layer
     * @param currentPosition
     * @param distance
     */
    subscribeCollection(layer, currentPosition, distance)
    {
        if (subscription) {
            subscription.unsubscribe();
        }


        var filter = {
            geoDistance: {
                location: {
                    lat: currentPosition.lat,
                    lon: currentPosition.lon
                },
                distance: distance
            }
        };

        var options = {
            // We want created messages only
            scope: 'all',
            // We treate our messages as any other messages
            subscribeToSelf: true,
            // We want only messages once they are stored (and volatile are always done)
            state: 'done'
        };

        subscription = kuzzle.dataCollectionFactory(layer).subscribe(filter, options, (err, resp) => {
            if (resp.scope == 'in') {
                this.state.tabLayersKuzzle.push();
            } else if (resp.scope == 'out') {

            }
        });
    },

    /**
     *
     * @param search
     * @param layer
     */
    searchDocument(search, layer)
    {

    }
};