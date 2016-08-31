import kuzzle from '../services/kuzzle'
import Config from '../services/kuzzle-config'
import KuzzleDocumentEntity from './KuzzleDocumentEntity'
import Projection from '../services/geo-parameters'
import notification from '../services/notification';
import ol from 'openlayers';
import olMap from './openlayers'

let subscription = null;
let kuzzleDocumentEntity = new KuzzleDocumentEntity();
//let this_ = this;  --> correct ?

export default {

    state: {
        collections: [], // List of collections
        tabLayersKuzzle: [], // Array contains layers
        notNotifFeatureId: null, // when we created a new feature od update a feature, store the featureId for not notfy it in kuzzleRoom
        mappingFieldsCollection: null, // data mapping of selected collection
        tabStyles: olMap.getStylesFeatures(),
        subscription: null,
        rstAdvancedSearch: null
    },

    /**
     * List collections (layers)
     * @returns {*|Object}
     */
    listCollections() {
        var this_ = this;

        kuzzle.listCollections(Config.defaultIndex, { type: "all"}, function (err, collections) {
            if (!err) {
                // Push collections in array
                this_.state.collections = collections.stored.map(layer => {
                    return layer;
                });
                olMap.initMap(13);
            } else {
                console.error(err.message);
                notification.init({
                    type: 'error',
                    message: 'Error listing collections'
                });
            }
        });
    },

    /**
     * Retrieve datas from collections and create openlayers Vector layer
     * @param collection
     */
    loadDatasFromCollection(collection, featureIdQs)
    {
        var this_ = this;
        var options = {
            from: 0,
            size: 10000,
            /*sort: {
                "fields.date_publish": {
                    order: "desc"
                }
            }*/
        };

        // Load mapping of collection
        this.getPropertiesMapping(collection);

        kuzzle.dataCollectionFactory(collection).advancedSearch(options, function(err, res) {
            if (!err) {
                var result = [];
                if(res.total > 0) {
                    result = res.documents.map(kDoc => {
                        return kuzzleDocumentEntity.fromKuzzleToFeature(kDoc);
                    });

                } else {
                    notification.init({
                        type: 'warning',
                        message:  'There is no data for the collection "' + collection + '"',
                    });
                }

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

                if (undefined != featureIdQs) {
                    var featureQs = olMap.getSelectedLayer().getSource().getFeatureById(featureIdQs);
                    olMap.showFeaturesInformations(featureQs, true);
                }
            } else {
                notification.init({
                    type: 'error',
                    message: 'Error fetching documents from collection'
                });
            }
        });
    },


    /**
     * Store mapping of selected collection
     * @param string layer
     */
    getPropertiesMapping(layer)
    {
        var this_ = this;
        kuzzle.dataCollectionFactory(layer).getMapping(function (err, res) {
            if (!err) {
                // Patch on user identifier
                this_.state.mappingFieldsCollection = res.mapping.fields.properties;
            } else {
                notification.init({
                    type: 'error',
                    message: 'Error mapping collection'
                });
            }
        });
    },


    /**
     * Adding new KuzzleDocument
     * @param json datas
     * @param ol.Feature newFeature
     */
    addDocument(fDatasGeoJson, feature)
    {
        var this_ = this;
        var layer = olMap.getSelectedLayer().get('title');
        var idFeature = (undefined != feature.get('id')) ? feature.get('id') : null;

        var newKuzzleDocument = kuzzleDocumentEntity.fromFeatureToKuzzle(layer, fDatasGeoJson, null);
        
        kuzzle.dataCollectionFactory(layer).createDocument(idFeature, newKuzzleDocument, function (err, resp) {
            if (!err) {
                // set of notNotifFeatureId and reconstruction of subscribe with new value of notNotifFeatureId
                this_.state.notNotifFeatureId = resp.id;

                // Convert KuzzleDocument into feature
                var newFeatureGeojson = kuzzleDocumentEntity.fromKuzzleToFeature(resp);

                // Setting of Kuzzle Document Identifier to identifier of the feature
                var f = new ol.format.GeoJSON();
                var newFeature = f.readFeature(newFeatureGeojson, {dataProjection:Projection.projectionTo, featureProjection: Projection.projectionFrom});
                newFeature.setId(resp.id);

                olMap.getSelectedLayer().getSource().addFeature(newFeature);
                olMap.createEditDatasForm();

            } else {
                notification.init({
                    type: 'error',
                    message: "Error creation kuzzle document."
                });
            }
        });
    },


    /**
     * Update Kuzzle Document from feature updated (geometry or properties)
     * @param ol.Feature updFeature
     */
    updateDocument(updFeature)
    {
        var layer = olMap.getSelectedLayer().get('title');
        var this_ = this;
        if (undefined != updFeature.getId()) {

            this.state.notNotifFeatureId = (updFeature.getId() != this.state.notNotifFeatureId) ? updFeature.getId() : this.state.notNotifFeatureId;

            // Transform feature in geoJSON
            this.parser = new ol.format.GeoJSON();
            var featureGeoJSON = this.parser.writeFeatureObject(updFeature, {dataProjection: Projection.projectionTo, featureProjection: Projection.projectionFrom});

            // Create a Kuzzle Document from updated datas
            var updDocument = kuzzleDocumentEntity.fromFeatureToKuzzle(layer, featureGeoJSON, updFeature.getId());

            kuzzle.dataCollectionFactory(layer).updateDocument(updFeature.getId(), updDocument.content, function (err, resp) {
            //updDocument.save((err, resp) => {
                if (err) {
                    notification.init({
                        type: 'error',
                        message:  "Error update kuzzle document"
                    });
                } else {
                    // Remove the feature from layer
                    //olMap.getSelectedLayer().getSource().removeFeature(updFeature);
                    if (undefined != olMap.getSelectedLayer().getSource().getFeatureById(resp.id)) {
                        var updFeatureDel = olMap.getSelectedLayer().getSource().getFeatureById(resp.id);
                        olMap.getSelectedLayer().getSource().removeFeature(updFeatureDel);
                    }

                    // Convert Kuzzle Document into geojson
                    var updGeojsonEdited = kuzzleDocumentEntity.fromKuzzleToFeature(resp);
                    var updFeatureEdited = this_.parser.readFeature(updGeojsonEdited, {dataProjection:Projection.projectionTo, featureProjection: Projection.projectionFrom});

                    // Add updated feature to the layer and open informations
                    olMap.getSelectedLayer().getSource().addFeature(updFeatureEdited);
                    olMap.showFeaturesInformations(updFeatureEdited, false);

                    notification.init({
                        type: 'notice',
                        message:  "Your kuzzle document have been succesfully updated"
                    });
                }
            });

        } else {
            notification.init({
                type: 'error',
                message:  "Sorry impossible to edit this kuzzle document, there is no identifier"
            });
        }
    },


    /**
     * Delete document from Kuzzle and delete from map
     * @param idDocument
     * @param layer
     * @returns {boolean}
     */
    deleteDocument(featureId)
    {
        if (undefined == featureId) {
            notification.init({
                type: 'error',
                message: "Can't delete the kuzzle document."
            });
        } else {
            var this_ = this;
            kuzzle.dataCollectionFactory(olMap.getSelectedLayer().get('title')).deleteDocument(featureId, (err, res) => {
                if (err) {
                    notification.init({
                        type: 'error',
                        message: "Error delete kuzzle document."
                    });
                } else {
                    this_.state.notNotifFeatureId = res[0];
                    var featureDel = olMap.getSelectedLayer().getSource().getFeatureById(res[0]);
                    olMap.getSelectedLayer().getSource().removeFeature(featureDel);
                    notification.init({
                        type: 'notice',
                        message: "The document have been removed."
                    });
                }
            });
        }
    },


    /**
     * Subscribe to item from currentPosition with a radius specified by distance
     * https://www.elastic.co/guide/en/elasticsearch/reference/1.7/query-dsl-geo-distance-filter.html
     * @param layer
     * @param currentPosition
     * @param int distance : distance of radius in meters (default unity)
     */
    subscribeCollection(layer, coordonatesWGS84)
    {
        var this_ = this;
        if (this.state.subscription || subscription) {
            this.state.subscription.unsubscribe();
            subscription.unsubscribe();
        }

        var distanceValue = (undefined != olMap.state.distance)? olMap.state.distance : 5000;

        /**
         * /!\ Filter on geo_shape is not implemented in kuzzle yet !!
         */

        var filter =
        {
            geoDistance: {

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

        console.log(JSON.stringify(filter, null, '\t'));
        this.state.subscription = subscription = kuzzle.dataCollectionFactory(layer.get('title')).subscribe(filter, options, (err, resp) => {
            if (!err) {
                if (null == this_.state.notNotifFeatureId || resp.result._id != this_.state.notNotifFeatureId) {

                    // We retrive kDoc and transform it on feature
                    if ('in' == resp.scope ) {

                        this_.action = resp.action;

                        console.log(resp);

                        /*kuzzle.dataCollectionFactory(layer.get('title')).fetchDocument(kDoc.id, (err, resp) => {
                            var f = new ol.format.GeoJSON();

                            if ("update" == this_.action) {
                                var featureDel = olMap.getSelectedLayer().getSource().getFeatureById(kDoc.id);
                                if (undefined != featureDel && featureDel.getId()) {
                                    olMap.getSelectedLayer().getSource().removeFeature(featureDel);
                                }
                            }

                            var newFeature = f.readFeature(resp.content, {featureProjection: Projection.projectionFrom});
                            if (undefined == newFeature.getId()) {
                                newFeature.setId(kDoc.id);
                            }

                            olMap.getSelectedLayer().getSource().addFeature(newFeature);

                            // Show new feature
                            olMap.showFeaturesInformations(newFeature, false);

                            // debug
                            console.log(this_.action + " : " + kDoc.id);
                            notification.init({
                                type: 'notice',
                                message: "A document have been " +  this_.action + "d in Kuzzle in your subscribe area."
                            });
                        });
                        */

                    } else if ('out' == resp.scope){
                        /**
                         * Suppression
                         */
                        var featureDel = olMap.getSelectedLayer().getSource().getFeatureById(resp.result._id);
                        olMap.getSelectedLayer().getSource().removeFeature(featureDel);

                        notification.init({
                            type: 'notice',
                            message: "A document have been deleted from Kuzzle in your subscribe area."
                        });
                    }
                }

            } else {
                console.error(err.message);
                notification.init({
                    type: 'error',
                    message: "Error subscribe room."
                });
            }
        });
    },


    /**
     * Kuzzle request for search
     * @param search
     * @param layer
     */
    searchDocuments(searchItem)
    {
        if (null != olMap.getSelectedLayer()) {

            var layer = olMap.getSelectedLayer().get('title');
            var coordonatesWGS84 = olMap.state.coordinates;

            // Filter search on name of items with a geoDistance filter, sorting by geodistance asc
            var distanceValue = (undefined != olMap.state.distance)? olMap.state.distance : 5000;
            var filterSearch =
            {
                query: {
                    prefix: {
                        "fields.name": searchItem
                    }
                },
                filter: {
                    geo_shape: {
                        "datas.location": {
                            shape: {
                                type: "circle",
                                radius: distanceValue,
                                coordinates: [
                                    coordonatesWGS84[0],
                                    coordonatesWGS84[1]
                                ]
                            }
                        }
                    }
                },
                sort: [
                    {
                        "fields.name" : {
                            "order" : "asc"
                        },
                        "fields.date_publish" : {
                            "order": "desc"
                        }
                    }
                ],
                from: 0,
                size: 10
            };

            kuzzle.dataCollectionFactory(layer).advancedSearch(filterSearch, (err, resp) => {
                if(!err) {
                    if (1 > resp.total) {
                        notification.init({
                            type: 'warning',
                            message: "No document find, retry with another term."
                        });
                        this.state.rstAdvancedSearch = [];
                    } else {
                        this.state.rstAdvancedSearch = resp.documents.map(kDoc => {
                            return {
                                value: kDoc.id,
                                label: kDoc.content.fields.name
                            }
                        });
                    }
                } else {
                    notification.init({
                        type: 'error',
                        message: "Research error"
                    });
                }
            });
        } else {
            notification.init({
                type: 'warning',
                message: "Please, select a layer."
            });
        }
    },


    /**
     * Bridge between kuzzle search result and Map datas
     * @param kdocId
     */
    setCenterKuzzleDoc(kdocId)
    {
        var kFeature = olMap.getSelectedLayer().getSource().getFeatureById(kdocId);
        olMap.showFeaturesInformations(kFeature);
    },

    /**
     * Raccourci vers la source de la layer
     * @returns {*}
     */
    getSource()
    {
        return olMap.getSelectedLayer().getSource();
    }
};