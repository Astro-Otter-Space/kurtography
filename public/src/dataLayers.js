import kuzzle from '../services/kuzzle'
import Config from '../services/config'
import ol from 'openlayers';
import olMap from './openlayers'

let subscription = null;

export default {

    state: {
        collections: [],
        tabLayersKuzzle: [],
        tabStyles: olMap.getStylesFeatures()
    },

    /**
     * List collections (layers)
     * @returns {*|Object}
     */
    listCollections() {
        var this_ = this;

        // Ex avec Mock : https://github.com/HamHamFonFon/kurtogaphy/blob/827b82fdfda3dc2d918fd44cbfd0fca3223a8ef5/public/src/openlayers.js
        kuzzle.listCollections(Config.defaultIndex, { type: "all"}, function (err, collections) {
            if (!err) {
                // Push collections in array
                this_.state.collections = collections.stored.map(
                    layer => {
                        return layer;
                    }
                );

                //this_.state.collections.map(layer => {
                //    this_.loadDatasFromCollection(layer);
                //});

                olMap.initMap(13);
            } else {
                console.error(err.message);
            }
        });
    },

    /**
     * Retrieve datas from collections
     * @param collection
     */
    loadDatasFromCollection(collection)
    {
        var this_ = this;
        kuzzle.dataCollectionFactory(collection).fetchAllDocuments(function(err, res) {
            if (!err) {
                if(res.total > 0) {

                    /**
                     * SOLUCE 1
                     */
                     /*var result = res.documents.map(kDoc => {
                        return kDoc.content;
                    });*/

                    /**
                     * SOLUCE 2
                     * @type {Array}
                     */
                    var result = [];
                    res.documents.forEach(function(kDoc, index) {
                        result.push(kDoc.content);
                    });

                    var dataGeoJSON = {
                        "type": "FeatureCollection",
                        "features": result
                    };

                    // Construction of geoDatas from content
                    var kGeoJSON = new ol.format.GeoJSON().readFeatures(dataGeoJSON, {featureProjection: olMap.state.projectionFrom});
                    var kSource = new ol.source.Vector({
                        features: kGeoJSON
                    });
                    olMap.getSelectedLayer().setSource(kSource);
                } else {
                    console.log("No datas from " + collection);
                }
            } else {
                console.error(err);
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
     * Source : https://github.com/kuzzleio/kuzzle/blob/develop/docs/filters.md#geospacial
     * @param layer
     * @param currentPosition
     * @param distance
     */
    subscribeCollection(layer, currentPosition, distance)
    {
        if (subscription) {
            subscription.unsubscribe();
        }

        console.log("Longitude : " + currentPosition[0]);
        console.log("Lattitude : " + currentPosition[1]);

        var filter = {
            geoDistance: {
                location: {
                    lat: currentPosition[1],
                    lon: currentPosition[0]
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

        // index.js:25 Uncaught RangeError: Maximum call stack size exceeded
        var subscription = kuzzle.dataCollectionFactory(layer).subscribe(filter, options, (err, resp) => {
            if (!err) {
                console.log(resp);

                if (resp.scope == 'in') {
                    console.log("Notification : ajout document");
                    //this.state.tabLayersKuzzle.push();
                } else if (resp.scope == 'out') {
                    console.log("Notification : suppression document");
                }
            } else {
                console.error(err.message);
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
        var filter = {
            term: {

            }
        };

        var search = kuzzle.dataCollectionFactory(layer).advancedSearch(filter, (err, resp) => {
            res.document.forEach(kDoc => {

                console.log("Recherche : " + kDoc.content);

                var extFeature =  kDoc.content.getGeometry().getExtent();
                var centerFeature = ol.extent.getCenter(extFeature);

                olMap.state.view.setCenter(centerFeature);
            })
        });
    }
};