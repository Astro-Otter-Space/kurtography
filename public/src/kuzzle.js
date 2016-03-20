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
    //listCollections: function ()
    //{
    //    this.kuzzle.listCollections(this.defaultIndex, {type: 'stored'}, function (err, listCollections) {
    //        if(!err) {
    //            return listCollections;
    //        } else {
    //            console.log("Erreur liste collections : " + err.message)
    //        }
    //    });
    //    //console.log("Liste de collections");
    //    console.log(listCollections);
    //    return listCollections;
    //}
};
exports.kuzzleManager = kuzzleManager;