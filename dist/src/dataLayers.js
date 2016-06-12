import kuzzle from '../services/kuzzle'
import Config from '../services/config'
import Projection from '../services/geo-parameters'
import notification from '../services/notification';
import ol from 'openlayers';
import olMap from './openlayers'
import user from './user';

let subscription = null;
//let this_ = this;  --> correct ?

export default {

    state: {
        collections: [], // List of collections
        tabLayersKuzzle: [], // Array contains layers
        notNotifFeatureId: null, // when we created a new feature od update a feature, store the featureId for not notfy it in kuzzleRoom
        mappingCollection: null, // data mapping of selected collection
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
     * Retrieve datas from collections
     * @param collection
     */
    loadDatasFromCollection(collection, featureIdQs)
    {
        var this_ = this;
        var options = {
            from: 0,
            size: 100000,
            /*sort: {
                "properties.date_publish" :{
                    order: "desc"
                }
            }*/
        };

        //kuzzle.dataCollectionFactory(collection).fetchAllDocuments(options, function(err, res) {
        kuzzle.dataCollectionFactory(collection).advancedSearch(options, function(err, res) {
            if (!err) {
                var result = [];
                if(res.total > 0) {
                    result = res.documents.map(kDoc => {
                        kDoc.content.id = kDoc.id;
                        if(undefined != kDoc.content.userId) {
                            kDoc.content.properties.userId = kDoc.content.userId;
                            delete kDoc.content.userId;
                        }
                        return kDoc.content;
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
     * Retrieve a kuzzle document by his ID
     * @param idKDoc
     * @return KuzzleDocument
     */
    loadDataById (idKDoc)
    {
        var kDocument = kuzzle.dataCollectionFactory(olMap.getSelectedLayer().get('title')).documentFactory(idKDoc).save();
        return kDocument;
    },

    /**
     * Store mapping of selected collection
     * @param layer
     */
    getPropertiesMapping(layer)
    {
        var this_ = this;
        kuzzle.dataCollectionFactory(layer).getMapping(function (err, res) {
            if (!err) {
                // Patch on user identifier
                if (undefined != res.mapping.userId) {
                    res.mapping.properties.properties.userId = res.mapping.userId;
                }
                this_.state.mappingCollection = res.mapping.properties.properties;
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
     * @param datas
     * @param newFeature
     */
    addDocument(fDatasGeoJson, feature)
    {
        var this_ = this;
        var layer = olMap.getSelectedLayer().get('title');
        var idFeature = (undefined != feature.get('id')) ? feature.get('id') : null;
        var typeFeature = feature.getGeometry().getType();

        // Create empty properties from mapping
        fDatasGeoJson.properties = {};
        Object.keys(this.state.mappingCollection).forEach(objectMapping => {
            if ("string" == this.state.mappingCollection[objectMapping].type && "userId" != objectMapping) {
                fDatasGeoJson.properties[objectMapping] = "";
            } else if ("date" == this.state.mappingCollection[objectMapping].type) {
                fDatasGeoJson.properties[objectMapping] = new Date().toISOString().slice(0, 10);
            }
        });

        // Create location point for subscribe zone
        // If Point, we add the lon/lat data in a specific mapping for making the kuzzle subscribe
        if ('Point' == typeFeature) {
            fDatasGeoJson.location = {
                lon: fDatasGeoJson.geometry.coordinates[0],
                lat : fDatasGeoJson.geometry.coordinates[1]
            };
        } else if ('LineString' == typeFeature || 'Polygon' == typeFeature) {

            var fCentroid = olMap.getFeatureCentroid(fDatasGeoJson);
            fDatasGeoJson.location = {
                lon: fCentroid.geometry.coordinates[0],
                lat: fCentroid.geometry.coordinates[1]
            };
        }
        fDatasGeoJson.userId = user.state.id;

        kuzzle.dataCollectionFactory(layer).createDocument(idFeature, fDatasGeoJson, function (err, resp) {
            if (!err) {
                // set of notNotifFeatureId and reconstruction of subscribe with new value of notNotifFeatureId
                this_.state.notNotifFeatureId = resp.id;

                fDatasGeoJson.properties.userId = resp.content.userId;
                // Setting of Kuzzle Document Identifier to identifier of the feature
                var f = new ol.format.GeoJSON();
                var newFeature = f.readFeature(fDatasGeoJson, {dataProjection:Projection.projectionTo, featureProjection: Projection.projectionFrom});
                newFeature.setId(resp.id);

                // If point and not in subscribe zone
                //if ('Point' == typeFeature) {
                //    if (false == olMap.isPointInZoneSubscribe(fDatasGeoJson)) {
                //        olMap.getSelectedLayer().getSource().addFeature(newFeature);
                //    }
                //// If not point and centroid is not un subscribe zone
                //} else {
                //    var centroidPt = olMap.getFeatureCentroid(fDatasGeoJson);
                //    if (false == olMap.isPointInZoneSubscribe(centroidPt)) {
                //        olMap.getSelectedLayer().getSource().addFeature(newFeature);
                //    }
                //}
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
     * Update geo-datas from documents
     */
    updateGeodatasDocument (feature)
    {
        if (feature.getId()) {
            var layer = olMap.getSelectedLayer().get('title');
            var kDocId = feature.getId();

            this.state.notNotifFeatureId = (kDocId != this.state.notNotifFeatureId) ? kDocId : this.state.notNotifFeatureId;
            var parser = new ol.format.GeoJSON();
            var fDatasGeoJson = parser.writeFeatureObject(feature, {dataProjection: Projection.projectionTo, featureProjection: Projection.projectionFrom});

            if ('Point' == feature.getGeometry().getType()) {
                fDatasGeoJson.location = {
                    lon: fDatasGeoJson.geometry.coordinates[0],
                    lat : fDatasGeoJson.geometry.coordinates[1]
                };
            } else if ('LineString' == feature.getGeometry().getType() || ('Polygon' == feature.getGeometry().getType())) {
                var fCentroid = olMap.getFeatureCentroid(fDatasGeoJson);
                fDatasGeoJson.location = {
                    lon: fCentroid.geometry.coordinates[0],
                    lat: fCentroid.geometry.coordinates[1]
                };
            }
            kuzzle.dataCollectionFactory(layer).updateDocument(kDocId, fDatasGeoJson, function (err, res) {
                if (err) {
                    notification.init({
                        type: 'error',
                        message:  "Error update geodatas kuzzle document"
                    });
                } else {
                    var parser = new ol.format.GeoJSON();
                    res.content.properties.userId = res.content.userId;
                    var updFeatureEdited = parser.readFeature(res.content, {featureProjection: Projection.projectionFrom});

                    if (undefined != olMap.getSelectedLayer().getSource().getFeatureById(res.id)) {
                        var updFeatureDel = olMap.getSelectedLayer().getSource().getFeatureById(res.id);
                        olMap.getSelectedLayer().getSource().removeFeature(updFeatureDel);
                    }
                    olMap.getSelectedLayer().getSource().addFeature(updFeatureEdited);

                    olMap.showFeaturesInformations(updFeatureEdited, false);
                    notification.init({
                        type: 'notice',
                        message:  "Update geodatas kuzzle document"
                    });
                }
            });

        } else {
            notification.init({
                type: 'warning',
                message:  "There is no identifier fot the kuzzle document."
            });
        }
    },

    /**
     * Update properties of a document
     * @param idKuzzleDoc
     * @param propertiesDatas
     */
    updatePropertiesDocument(updFeature)
    {
        var layer = olMap.getSelectedLayer().get('title');
        if (undefined != updFeature.getId()) {
            // Transform feature in geoJSON
            var parser = new ol.format.GeoJSON();
            var featureGeoJSON = parser.writeFeatureObject(updFeature, {dataProjection: Projection.projectionTo, featureProjection: Projection.projectionFrom});

            kuzzle.dataCollectionFactory(layer).updateDocument(updFeature.getId(), featureGeoJSON, (err, res) => {
                if (err) {
                    notification.init({
                        type: 'error',
                        message:  "Error update kuzzle document"
                    });
                } else {
                    res.content.properties.userId = res.content.userId;
                    var updFeatureEdited = parser.readFeature(res.content, {featureProjection: Projection.projectionFrom});

                    olMap.getSelectedLayer().getSource().removeFeature(updFeature);
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
                        message: "Suppression kuzzle document ok."
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
        var filter =
        {
            geoDistance: {
                distance: distanceValue,
                location: {
                    lon: coordonatesWGS84[0],
                    lat: coordonatesWGS84[1]
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

        //console.log(JSON.stringify(filter, null, '\t'));
        this.state.subscription = subscription = kuzzle.dataCollectionFactory(layer.get('title')).subscribe(filter, options, (err, resp) => {
            if (!err) {
                if (null == this_.state.notNotifFeatureId || resp.result._id != this_.state.notNotifFeatureId) {

                    // We retrive kDoc and transform it on feature
                    if ('in' == resp.scope ) {
                        var kDoc = this_.loadDataById(resp.result._id);
                        this_.action = resp.action;
                        kuzzle.dataCollectionFactory(layer.get('title')).fetchDocument(kDoc.id, (err, resp) => {
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
            var coordonatesWGS84 = olMap.state.coordinates; //olMap.geolocation.getPosition();

            //var collMapping = this.state.mappingCollection;
            //var filterMapping = Object.keys(collMapping).map(field => {
            //    var filterOr = {
            //        term :{
            //        }
            //    };
            //    filterOr.term['properties.'+field] = searchItem;
            //    return filterOr;
            //});
            //or: filterMapping

            // Filter search on name of items with a geoDistance filter, sorting by geodistance asc
            var distanceValue = (undefined != olMap.state.distance)? olMap.state.distance : 5000;
            var filterSearch =
            {
                filter: {
                    geo_distance: {
                        distance: distanceValue,
                        location: {
                            lon: coordonatesWGS84[0],
                            lat: coordonatesWGS84[1]
                        }
                    }
                },
                query: {
                    prefix: {
                        "properties.name": searchItem
                    }
                },
                sort: [
                    {
                        "_geo_distance" : {
                            "location" : {
                                lon: coordonatesWGS84[0],
                                lat: coordonatesWGS84[1]
                            },
                            "order"    : "asc",
                            "unit"     : "m"
                        }
                    }
                ],
                from: 0,
                size: 10
            };

            //console.log(JSON.stringify(filterSearch, null, '\t'));

            kuzzle.dataCollectionFactory(layer).advancedSearch(filterSearch, (err, resp) => {
                if(!err) {
                    if (1 > resp.total) {
                        notification.init({
                            type: 'warning',
                            message: "No document find, retry with another term."
                        });
                    } else {
                        var respAutoComplete = resp.documents.map(kDoc => {
                            return {
                                value: kDoc.id,
                                label: kDoc.content.properties.name
                            }
                        });
                        this.state.rstAdvancedSearch = respAutoComplete;
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
                message: "Please, select a layer to the right."
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