/**
 *
 * @returns {Kuzzle|*}
 */
var kuzzleManager = {

    kuzzle: null,
    defaultIndex : null,
    host: 'http://localhost:7512',

    initKuzzle: function (defaultIndex)
    {

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

        this.kuzzle.listCollections(this.k.kuzzleManager.defaultIndex, { type: "stored" }, function (err, collections) {
            if(!err) {

                var olCollection = this_.olCollection = [];
                collections.stored.forEach(function(i, layer) {

                    // Retrieve data from each layer
                    this_.kuzzle.dataCollectionFactory(this_.k.kuzzleManager.defaultIndex, i).fetchAllDocuments(function (error, result) {
                        // result is an object containing the total number of documents
                        // and an array of KuzzleDocument objects
                        if (!err && result.total > 0) {
                            console.log("Nb features : " + result.total);
                            var kGeoJSON =  new ol.format.GeoJSON().readFeatures(result.documents, { featureProjection: this_.projectionFrom });

                            var kSource = new ol.source.Vector({ features: kGeoJSON, wrapX: false });

                            var kuzzleLayerVector = new ol.layer.Vector({
                                source: kSource,
                                title: i,
                                type: 'base',
                                visible: true,
                                style: function(feature, resolution) {
                                    return tabStyles[feature.getGeometry().getType()];
                                }
                            });
                            this_.olCollection.push(kuzzleLayerVector);
                        } else {
                            console.log(err.message);
                        }
                    });
                });

                var grpKuzzleLayers = new ol.layer.Group({ layers: this_.olCollection });
                this_.map.setLayerGroup([this_.map.getLayers(), grpKuzzleLayers]);
            } else {
                console.log(err.message);
            }
        });
    },

};
exports.kuzzleManager = kuzzleManager;