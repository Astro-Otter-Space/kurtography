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
        newGJsonFeature: null,
        newFeature: null,
        dataProperties: null, // data mapping of selected collection
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
                var result = [];
                if(res.total > 0) {
                    res.documents.forEach(function (kDoc, index) {
                        // Push document identifier in feature data
                        kDoc.content.id = kDoc.id;
                        result.push(kDoc.content);
                    });
                } else {
                    document.getElementById('msgWarnKuzzle').innerHTML = "There is no data for the collection " + collection;
                    $("#alertWarningKuzzle").slideDown('slow').delay(3000).slideUp('slow');
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
                console.error(err);
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
            // res is a KuzzleDataMapping object
            if (!err) {
                var mappingProperties = new Object();
                if (undefined != res.mapping.properties) {
                    var mapping = res.mapping.properties.properties;
                    Object.keys(mapping).forEach(field => {
                        mappingProperties[field] = "";
                    });
                } else {
                    // If no mapping in properties, we assign a default value
                    mappingProperties["name"] = "";
                }

                this_.state.dataProperties = mappingProperties;
            } else {
                console.error(err.message);
            }
        });
    },


    /**
     * Adding new KuzzleDocument
     * @param datas
     * @param newFeature
     */
    addDocument(fDatasGeoJson, newFeature)
    {
        var this_ = this;
        var layer = olMap.getSelectedLayer().get('title');
        // Create properties
        fDatasGeoJson.properties = this.state.dataProperties;

        // Create location point for subscribe zone
        // If Point, we add the lon/lat data in a specific mapping for making the kuzzle subscribe
        if ('Point' == newFeature.getGeometry().getType()) {
            fDatasGeoJson.location = {
                lon: fDatasGeoJson.geometry.coordinates[0],
                lat : fDatasGeoJson.geometry.coordinates[1]
            };
        } else if ('LineString' == newFeature.getGeometry().getType() || ('Polygon' == newFeature.getGeometry().getType())) {

            var fCentroid = olMap.getFeatureCentroid(fDatasGeoJson);
            fDatasGeoJson.location = {
                lon: fCentroid.geometry.coordinates[0],
                lat: fCentroid.geometry.coordinates[1]
            };
        }
        kuzzle.dataCollectionFactory(layer).createDocument(fDatasGeoJson, function (err, resp) {
            if (!err) {
                // Setting of Kuzzle Document Identifier to identifier of the feature
                newFeature.setId(resp.id);
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
     * @param dataProperties
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
                    console.log(res);
                }
            });

        } else {
            document.getElementById('msgDangerKuzzle').innerHTML = "Sorry impossible to edit this kuzzle document, there is no identifier.";
            $("#alertDangerKuzzle").slideDown('slow').delay(3000).slideUp('slow');
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
            document.getElementById('msgDangerKuzzle').innerHTML = "Can't delete the kuzzle document.";
            $("#alertDangerKuzzle").slideDown('slow').delay(3000).slideUp('slow');
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
    subscribeCollection(layer, coordonatesWGS84, distance = 10000)
    {
        var this_ = this;
        if (subscription) {
            subscription.unsubscribe();
        }

        var filter = {
            geoDistance: {
                distance: distance,
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

        subscription = kuzzle.dataCollectionFactory(layer.get('title')).subscribe(filter, options, (err, resp) => {
            if (!err) {
                var kDoc = this.loadDataById(resp.result._id);

                if ('in' == resp.scope) {
                    this_.action = resp.action;
                    kuzzle.dataCollectionFactory(layer.get('title')).fetchDocument(kDoc.id, (err, resp) => {
                        var f = new ol.format.GeoJSON();
                        var newFeature = f.readFeature(resp.content, {featureProjection: Projection.projectionFrom});
                        newFeature.setId(kDoc.id);

                        if ("update" == this_.action) {
                            var featureDel = olMap.getSelectedLayer().getSource().getFeatureById(kDoc.id);
                            olMap.getSelectedLayer().getSource().removeFeature(featureDel);
                        }
                        olMap.getSelectedLayer().getSource().addFeature(newFeature);

                        olMap.addPropertiesTab(newFeature.getProperties());
                        var newFeatureGeoJson = f.writeFeatureObject(newFeature, {dataProjection: Projection.projectionTo, featureProjection: Projection.projectionFrom})
                        olMap.addGeoJSONTab(newFeatureGeoJson);
                        if ("update" == this_.action) {
                            olMap.addGeometriesTab(newFeature.getGeometry());
                        }
                        document.getElementById('msgSuccessKuzzle').innerHTML = "A document have been " +  this_.action + "d in Kuzzle in your subscribe area.";
                        $("#alertSuccessKuzzle").slideDown('slow').delay(3000).slideUp('slow');
                    });


                /**
                 * Suppression
                 */
                } else if ('out' == resp.scope) {
                    console.log("delete " + kDoc.id);
                    var featureDel = olMap.getSelectedLayer().getSource().getFeatureById(kDoc.id);
                    olMap.getSelectedLayer().getSource().removeFeature(featureDel);

                    document.getElementById('msgSuccessKuzzle').innerHTML = "A document have been deleted from Kuzzle in your subscribe area.";
                    $("#alertSuccessKuzzle").slideDown('slow').delay(3000).slideUp('slow');
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
    searchDocuments(searchItem)
    {
        if (null != olMap.getSelectedLayer()) {
            var layer = olMap.getSelectedLayer().get('title');

            var collMapping = this.state.dataProperties;
            var filterMapping = Object.keys(collMapping).map(field => {
                var filterOr = {
                    term :{
                    }
                };
                filterOr.term['properties.'+field] = searchItem;
                return filterOr;
            });
            //sort: ['properties.name'],
            //from: 0,
            //size: 9999
            var filter = {
                filter :{
                    or: filterMapping
                }
            };

            kuzzle.dataCollectionFactory(layer).getMapping(function (err, res) {
               console.log(res);
            });

            kuzzle.dataCollectionFactory(layer).advancedSearch(filter, (err, resp) => {
                if(!err) {
                    console.log(resp);
                    if (1 > resp.total) {
                        document.getElementById('msgWarnKuzzle').innerHTML = "No document find, retry with another term.";
                        $("#alertWarningKuzzle").slideDown('slow').delay(3000).slideUp('slow');
                    } else {
                        console.log(resp.document);
                        //resp.document.forEach(kDoc => {
                            //
                            //    console.log("Recherche : " + kDoc.content);
                            //
                            //    var extFeature =  kDoc.content.getGeometry().getExtent();
                            //    var centerFeature = ol.extent.getCenter(extFeature);
                            //
                            //    olMap.state.view.setCenter(centerFeature);
                            //})
                    }
                } else {
                    console.error(err);
                    document.getElementById('msgDangerKuzzle').innerHTML = "Research error.";
                    $("#alertDangerKuzzle").slideDown('slow').delay(3000).slideUp('slow');
                }

            });
        } else {
            document.getElementById('msgWarnKuzzle').innerHTML = "Please, select a layer to the right.";
            $("#alertWarningKuzzle").slideDown('slow').delay(3000).slideUp('slow');
        }

    }
};