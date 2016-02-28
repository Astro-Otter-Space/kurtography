/**
 *
 * @returns {Kuzzle|*}
 */
var kMap = kMap || {};

kMap.kuzzleManager = {

    kuzzle: null,
    defaultIndex : null,
    host: 'http://localhost:7512',

    initKuzzle: function (defaultIndex)
    {

        this.defaultIndex = defaultIndex;

        var optConnect = {
            defaultIndex: 'kurtography',
            connect: 'auto',
            autoReconnect: true,
            headers: {
                'Access-Control-Allow-Origin' : '*'
            }
        };
        this.kuzzle = new Kuzzle(kuzzleManager.host, optConnect, function (err, res) {
            if(err) {
                console.log(err.message)
            }
        });
        this.kuzzle.connect();

        this.kuzzle.listIndexes(function (err, indexes) {
            console.log(indexes);
        });
    },


    listCollections: function ()
    {
        var listCollections = this.kuzzle.listCollections(this.defaultIndex, {type: 'all'}, function (err, collections) {
            if(!err) {
                return collections;
            } else {
                console.log("Erreur liste collections : " + err.message)
            }
        });

        return listCollections;
    }
};

exports.kuzzle = kMap.kuzzleManager;