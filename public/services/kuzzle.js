import Kuzzle from 'kuzzle-sdk'
import Config from './config'

var optConnect = {
    defaultIndex: Config.defaultIndex,
    connect: 'auto',
    autoReconnect: true,
    headers: {
        'Access-Control-Allow-Origin' : '*'
    }
};

var kuzzle = new Kuzzle(Config.kuzzleUrl, optConnect, function (err, res) {
        if(err) {
            console.log(err.message);
        } else {
            console.log("Connexion to Kuzzle OK");
        }
    }
);
//kuzzle.connect();
export default kuzzle