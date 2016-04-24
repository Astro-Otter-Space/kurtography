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
                    document.getElementById('msgWarnKuzzle').innerHTML = "There is no data for the collection " + collection;
                    $("#alertWarningKuzzle").slideDown('slow').delay(3000).slideUp('slow');
                }
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
     * Adding new KuzzleDocument
     * @param datas
     * @param newFeature
     */
    addDocument(datas/*, newFeature*/)
    {
        var layer = olMap.getSelectedLayer().get('title');
        var this_ = this;
        datas.properties = this.state.dataProperties;

        kuzzle.dataCollectionFactory(layer).createDocument(datas, function (err, res) {
            if (!err) {
                // Setting of Kuzzle Document Identifier to identifier of the feature
                //this_.state.newGJsonFeature = res.content;
                //newFeature.setId();
                //newFeature.setId(res.id);
                //this_.state.newFeature = newFeature;
            } else {
                console.log(err.message)
            }
        });
    },


    /**
     * Update geo-datas from documents
     */
    updateGeodatasDocument (datas, feature)
    {
        if (feature.getId()) {
            var layer = olMap.getSelectedLayer().get('title');
            var kDocId = feature.getId();

            kuzzle.dataCollectionFactory(layer).updateDocument(kDocId, datas, function (err, res) {
                if (!err) {
                    //console.log(res);
                } else {
                    console.error(err.message);
                }
            });

        } else {
            document.getElementById('msgSuccessKuzzle').innerHTML = "A document have been updated in Kuzzle in your subscribe area.";
            $("#alertSuccessKuzzle").slideDown('slow').delay(3000).slideUp('slow');
            console.error("Sorry impossible to edit this kuzzle document, there is no identifier.");
        }
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
            }
        });
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
                        if ("update" == this_.action) {
                            olMap.addPropertiesTab(newFeature.getProperties());
                            olMap.addGeometriesTab(newFeature.getGeometry());
                        }
                        document.getElementById('msgSuccessKuzzle').innerHTML = "A document have been " +  this_.action + "d in Kuzzle in your subscribe area.";
                        $("#alertSuccessKuzzle").slideDown('slow').delay(3000).slideUp('slow');
                    });


                /**
                 * Suppression
                 */
                } else if ('out' == resp.scope) {

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
    searchDocuments(search, layer)
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