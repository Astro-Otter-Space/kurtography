import kuzzle from '../services/kuzzle'
import Config from '../services/config'
import Projection from '../services/projections'
import ol from 'openlayers';
import olMap from './openlayers'

let subscription = null;

export default {

    state: {
        collections: [], // List of collections
        tabLayersKuzzle: [], // Array contains layers
        dataProperties: [], // data mapping of selected collection
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
                    var result = [];
                    res.documents.forEach(function(kDoc, index) {
                        // Push document identifier in feature data
                        kDoc.content.id = kDoc.id;
                        result.push(kDoc.content);
                    });

                    var dataGeoJSON = {
                        "type": "FeatureCollection",
                        "features": result
                    };

                    // Construction of geoDatas from content
                    var kGeoJSON = new ol.format.GeoJSON().readFeatures(dataGeoJSON, {featureProjection: Projection.projectionFrom});
                    var kSource = new ol.source.Vector({
                        features: kGeoJSON
                    });
                    olMap.getSelectedLayer().setSource(kSource);
                    olMap.getSelectedLayer().setZIndex(20);
                } else {
                    console.log("No datas from " + collection);
                }
            } else {
                console.error(err);
            }
        });
    },

    /**
     * Store mapping of selected collection
     * @param layer
     */
    getPropertiesMapping(layer)
    {
        var this_ = this;
        kuzzle.dataCollectionFactory(layer).getMapping(function (err, res) {
            // result is a KuzzleDataMapping object
            if (!err) {
                var mapping = res.mapping.properties.properties;
                var Properties = new Object();
                Object.keys(mapping).forEach(field => {
                    Properties[field] = "";
                });
                this_.state.dataProperties = Properties;
            } else {
                console.error(err.message);
            }
        });
    },

    /**
     * Add document to Collection
     */
    addDocument(datas, newFeature)
    {
        var layer = olMap.getSelectedLayer().get('title');
        datas.properties = this.state.dataProperties;
        kuzzle.dataCollectionFactory(layer).createDocument(datas, function (err, res) {
            if (!err) {
                // Setting of Kuzzle Document Identifier to identifier of the feature
                newFeature.setId(res.content.id);
            } else {
                console.log(err.message)
            }
        });
    },

    /**
     * Delete document from Kuzzle
     * @param idDocument
     * @param layer
     * @returns {boolean}
     */
    deleteDocument(feature, layer)
    {
        if (!feature.getId()) {
            console.log("Delete document error, no id document");
            return false;
        } else {
            var idDocument = feature.getId();
        }

        kuzzle.dataCollectionFactory(layer).deleteDocument(idDocument, (err, res) => {
            if (err) {
                console.error(err.message);
            } else {
                console.log("Delete from kuzzle " + idDocument);
                // remove from selected Layer ??
                olMap.getSelectedLayer().getSource().removeFeature(feature);
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
     * https://www.elastic.co/guide/en/elasticsearch/reference/1.7/query-dsl-geo-distance-filter.html
     * Err : Error during Kuzzle subscription: Cannot create the room 2ebc90b3a5419f060ec9a64fa91ca77f because it has been marked for destruction
     * @param layer
     * @param currentPosition
     * @param distance
     */
    subscribeCollection(layer, coordonatesWGS84, distance, unite)
    {
        if (subscription) {
            subscription.unsubscribe();
        }

        var lon = coordonatesWGS84[0];
        var lat = coordonatesWGS84[1];

        var filter = {
            geoDistance: {
                distance: distance + unite,
                location: {
                    lon: lon,
                    lat: lat
                }
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

        subscription = kuzzle.dataCollectionFactory(layer.get('title')).subscribe(filter, options, (err, resp) => {
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