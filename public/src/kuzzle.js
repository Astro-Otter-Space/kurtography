/**
 *
 * @returns {Kuzzle|*}
 */
var kuzzleManager = {

    kuzzle: null,
    olMap: null,
    defaultIndex : null,
    host: 'http://localhost:7512',

    initKuzzle: function (defaultIndex, olMap)
    {
        this.olMap = olMap;
        this.defaultIndex = defaultIndex;
        this.host = kuzzleManager.host;

        var optConnect = {
            defaultIndex: this.defaultIndex,
            connect: 'auto',
            autoReconnect: true,
            headers: {
                'Access-Control-Allow-Origin' : '*'
            }
        };
        this.kuzzle = new Kuzzle(this.host, optConnect, function (err, res) {
            if(err) {
                console.log(err.message)
            }
        });
        this.kuzzle.connect();

        return this.kuzzle;
    },

    /**
     * List collections (layers)
     * @returns {*|Object}
     */
    listCollections: function () {
        var this_ = this;
        var tabStyles = this.olMap.getStylesFeatures();
        var collection = new ol.Collection();
        this.kuzzle.listCollections(this.defaultIndex, { type: "stored" }, function (err, collections) {
            if(!err) {

                collections.stored.forEach(function(i, layer) {

                    // Retrieve data from each layer
                    this_.kuzzle.dataCollectionFactory(this_.defaultIndex, i).fetchAllDocuments(function (error, result) {
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

                            collection.push(kuzzleLayerVector);
                            this_.olMap.groupKuzzleLayers.setLayers(collection);

                            this_.olMap.layerSwitcher.renderPanel();
                        } else {
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