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
            console.error(err.message);
            document.getElementById('msgDangerKuzzle').innerHTML = "Can't connect to Kuzzle.";
            $("#alertDangerKuzzle").slideDown('slow').delay(3000).slideUp('slow');
        }
    }
);
export default kuzzle