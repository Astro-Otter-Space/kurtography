/**
 *
 * @returns {Kuzzle|*}
 */
function init()
{
    // Connexion kuzzle
    var optConnect = {
        defaultIndex: 'kurtography',
        connect: 'auto',
        autoReconnect: true,
        headers: {
            'Access-Control-Allow-Origin' : '*'
        }
    };
    this._kuz = new Kuzzle('http://localhost:7511', optConnect, function (err, res) {
        if(err) {
            console.log(err.message)
        }
    });

    // Authentification
    //this._kuz.login("local", {username: "kurtouser"}, '', function (err, res) {
    //    if(err) {
    //        console.log("Err login : " + err.message);
    //    }
    //});

    return this._kuz;
}

/**
 *
 * @returns {Object}
 */
function listCollections()
{
    var listCollections = this._kuz.listCollections('kurtography', {type: 'stored'}, function (err, collections) {
        if(!err) {
            return collections;
        } else {
            console.log("Erreur liste collections : " + err.message)
        }
    });

    return listCollections;
}

exports.init = init;
exports.listCollections = listCollections;