import kuzzle from '../services/kuzzle'
import Config from '../services/config'
import Projection from '../services/geo-parameters'
import notification from '../services/notification';
import ol from 'openlayers';
import olMap from './openlayers'

let subscription = null;

export default {

    state: {
        collections: [], // List of collections
        tabLayersKuzzle: [], // Array contains layers
        newGJsonFeature: null,
        newFeature: null,
        mappingCollection: null, // data mapping of selected collection
        tabStyles: olMap.getStylesFeatures(),
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
    loadDatasFromCollection(collection)
    {
        var this_ = this;
        var options = {
            from: 10,
            size: 10000
        };
        kuzzle.dataCollectionFactory(collection).fetchAllDocuments(options, function(err, res) {
            if (!err) {
                var result = [];
                console.log(res);
                if(res.total > 0) {
                    res.documents.forEach(function (kDoc, index) {
                        // Push document identifier in feature data
                        kDoc.content.id = kDoc.id;
                        result.push(kDoc.content);
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
    addDocument(fDatasGeoJson, typeFeature)
    {
        var this_ = this;
        var layer = olMap.getSelectedLayer().get('title');

        // Create empty properties from mapping
        fDatasGeoJson.properties = {};
        Object.keys(this.state.mappingCollection).forEach(objectMapping => {
            if ("string" == this.state.mappingCollection[objectMapping].type) {
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

        kuzzle.dataCollectionFactory(layer).createDocument(fDatasGeoJson, function (err, resp) {
            if (!err) {
                // Setting of Kuzzle Document Identifier to identifier of the feature
                var f = new ol.format.GeoJSON();
                var newFeature = f.readFeature(fDatasGeoJson, {dataProjection:Projection.projectionTo, featureProjection: Projection.projectionFrom});
                newFeature.setId(resp.id);
                olMap.state.featureForm = newFeature;

                // If point and not in subscribe zone
                if ('Point' == typeFeature) {
                    if (false == olMap.isPointInZoneSubscribe(fDatasGeoJson)) {
                        olMap.getSelectedLayer().getSource().addFeature(newFeature);
                    }
                // If not point and centroid is not un subscribe zone
                } else {
                    var centroidPt = olMap.getFeatureCentroid(fDatasGeoJson);
                    if (false == olMap.isPointInZoneSubscribe(centroidPt)) {
                        olMap.getSelectedLayer().getSource().addFeature(newFeature);
                    }
                }
                olMap.createEditDatasForm();
            } else {
                console.log(err.message)
            }
        });
    },


    /**
     * Update geo-datas from documents
     */
    updateGeodatasDocument (fDatasGeoJson, feature)
    {
        if (feature.getId()) {
            var layer = olMap.getSelectedLayer().get('title');
            var kDocId = feature.getId();

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
                    console.error(err.message);
                } else {
                    var parser = new ol.format.GeoJSON();
                    var featureGeoJSON = parser.writeFeatureObject(feature, {dataProjection: Projection.projectionTo, featureProjection: Projection.projectionFrom});

                    // If Document is not in the subscribe zone
                    if ('Point' == feature.getGeometry().getType()) {
                        if (false == olMap.isPointInZoneSubscribe(fDatasGeoJson)) {
                            olMap.getSelectedLayer().getSource().removeFeature(feature);
                            olMap.getSelectedLayer().getSource().addFeature(feature);
                        }
                    } else {
                        var centroidPt = olMap.getFeatureCentroid(fDatasGeoJson);
                        if (false == olMap.isPointInZoneSubscribe(centroidPt)) {
                            olMap.getSelectedLayer().getSource().removeFeature(feature);
                            olMap.getSelectedLayer().getSource().addFeature(feature);
                        }
                    }

                    var updFeature = parser.readFeature(fDatasGeoJson, {featureProjection: Projection.projectionFrom});
                    olMap.state.featureForm = updFeature;
                    olMap.showFeaturesInformations(updFeature, true);
                }
            });

        } else {
            //document.getElementById('msgSuccessKuzzle').innerHTML = "A document have been updated in Kuzzle in your subscribe area.";
            //$("#alertSuccessKuzzle").slideDown('slow').delay(3000).slideUp('slow');
            console.error("Sorry impossible to edit this kuzzle document, there is no identifier.");
        }
    },

    /**
     * Update properties of a document
     * @param idKuzzleDoc
     * @param propertiesDatas
     */
    updatePropertiesDocument(feature, propertiesDatas)
    {
        var layer = olMap.getSelectedLayer().get('title');
        if (undefined != feature.getId()) {

            var parser = new ol.format.GeoJSON();
            var featureGeoJSON = parser.writeFeatureObject(feature, {dataProjection: Projection.projectionTo, featureProjection: Projection.projectionFrom});
            featureGeoJSON.properties = propertiesDatas;

            kuzzle.dataCollectionFactory(layer).updateDocument(feature.getId(), featureGeoJSON, (err, res) => {
                if (err) {
                    console.error(err.message);
                } else {

                    // If Document is not in the subscribe zone
                    if ('Point' == feature.getGeometry().getType()) {
                        if (false == olMap.isPointInZoneSubscribe(featureGeoJSON)) {
                            olMap.showFeaturesInformations(feature, false);
                        }
                    } else {
                        var centroidPt = olMap.getFeatureCentroid(featureGeoJSON);
                        if (false == olMap.isPointInZoneSubscribe(centroidPt)) {
                            olMap.showFeaturesInformations(feature, false);
                        }
                    }
                    var updFeature = parser.readFeature(featureGeoJSON, {featureProjection: Projection.projectionFrom});
                    olMap.state.featureForm = updFeature;
                    olMap.showFeaturesInformations(updFeature, true);
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
    deleteDocument(feature)
    {
        if (!feature.getId()) {
            notification.init({
                type: 'error',
                message: "Can't delete the kuzzle document."
            });
            return false;

        } else {
            kuzzle.dataCollectionFactory(olMap.getSelectedLayer().get('title')).deleteDocument(feature.getId(), (err, res) => {
                if (err) {
                    console.error(err.message);
                } else {
                    var parser = new ol.format.GeoJSON();
                    var featureGeoJSON = parser.writeFeatureObject(feature, {dataProjection: Projection.projectionTo, featureProjection: Projection.projectionFrom});

                    if ('Point' == feature.getGeometry().getType()) {
                        if (false == olMap.isPointInZoneSubscribe(featureGeoJSON)) {
                            olMap.getSelectedLayer().getSource().removeFeature(feature);
                        }
                    } else {
                        var centroidPt = olMap.getFeatureCentroid(featureGeoJSON);
                        if (false == olMap.isPointInZoneSubscribe(centroidPt)) {
                            olMap.getSelectedLayer().getSource().removeFeature(feature);
                        }
                    }

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
        if (subscription) {
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

        //console.log(JSON.stringify(filter, '', false));
        subscription = kuzzle.dataCollectionFactory(layer.get('title')).subscribe(filter, options, (err, resp) => {
            if (!err) {
                var kDoc = this.loadDataById(resp.result._id);
                console.log(resp.action + ' ' + resp.result._id + '/' + kDoc.id);
                if ('in' == resp.scope) {
                    this_.action = resp.action;
                    kuzzle.dataCollectionFactory(layer.get('title')).fetchDocument(kDoc.id, (err, resp) => {
                        var f = new ol.format.GeoJSON();

                        if ("update" == this_.action) {
                            var featureDel = olMap.getSelectedLayer().getSource().getFeatureById(kDoc.id);
                            olMap.getSelectedLayer().getSource().removeFeature(featureDel);
                        }

                        var newFeature = f.readFeature(resp.content, {featureProjection: Projection.projectionFrom});
                        if (undefined == newFeature.getId()) {
                            newFeature.setId(kDoc.id);
                        }

                        olMap.getSelectedLayer().getSource().addFeature(newFeature);

                        // Show new feature
                        olMap.showFeaturesInformations(newFeature, false);

                        notification.init({
                            type: 'notice',
                            message: "A document have been " +  this_.action + "d in Kuzzle in your subscribe area."
                        });
                    });

                /**
                 * Suppression
                 */
                } else if ('out' == resp.scope) {
                    console.log("Suppresion de la feature");
                    var featureDel = olMap.getSelectedLayer().getSource().getFeatureById(kDoc.id);
                    olMap.getSelectedLayer().getSource().removeFeature(featureDel);

                    notification.init({
                        type: 'notice',
                        message: "A document have been deleted from Kuzzle in your subscribe area."
                    });

                }
            } else {
                console.error(err.message);
            }
        });
    },


    /**
     * IN PROGRESS...
     * get a subscribe room if user subscribe to any docs
     */
    subscribeDocumentsUser()
    {
        var filter =
        {
        };
        var options = {
            // We want created messages only
            scope: 'all',
            // We treate our messages as any other messages
            subscribeToSelf: true,
            // We want only messages once they are stored (and volatile are always done)
            state: 'done'
        };
    },


    /**
     *
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
                    console.log(resp.total, "results");
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
                    console.error(err);
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
    }
};